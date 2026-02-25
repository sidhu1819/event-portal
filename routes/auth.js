const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const sendApprovalEmail = require("../utils/sendEmail");

const router = express.Router();

// ---------------------------------------------------
// 1️⃣ REGISTER ROUTE (Public)
// ---------------------------------------------------
router.post("/register", async (req, res) => {
    try {
        const { name, section, email, rollNumber, needSystem } = req.body;

        // Roll Number Validation (Format: 23CSDxxx)
        if (!rollNumber.startsWith("23CSD")) {
            return res.status(400).json({ message: "Only CSD 1st year allowed" });
        }

        const numberPart = parseInt(rollNumber.substring(5));
        if (numberPart < 1 || numberPart > 120) {
            return res.status(400).json({ message: "Roll number out of allowed range" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // System limit logic (Max 60 lab systems)
        if (needSystem) {
            const systemUsers = await User.countDocuments({ needSystem: true });
            if (systemUsers >= 60) {
                return res.status(400).json({ message: "System slots full. Please bring your own laptop." });
            }
        }

        // Create user with a placeholder password (or empty) until admin approves
        const newUser = new User({
            name,
            section,
            email,
            rollNumber,
            needSystem,
            status: "pending" // Ensure status is pending by default
        });

        await newUser.save();
        res.status(201).json({ message: "Registration successful. Wait for admin approval." });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// ---------------------------------------------------
// 2️⃣ LOGIN ROUTE (Public)
// ---------------------------------------------------
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if approved by admin
        if (user.status !== "approved") {
            return res.status(403).json({ message: "Your account has not been approved yet." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

// ---------------------------------------------------
// 3️⃣ PARTICIPANT DASHBOARD (Protected)
// ---------------------------------------------------
router.get("/dashboard", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ---------------------------------------------------
// 4️⃣ SUBMIT GITHUB LINK (Protected Participant)
// ---------------------------------------------------
router.put("/submit-github", verifyToken, async (req, res) => {
    try {
        const { githubLink } = req.body;
        if (!githubLink) return res.status(400).json({ message: "GitHub link is required" });

        const user = await User.findByIdAndUpdate(
            req.user.id, 
            { githubLink: githubLink },
            { new: true }
        );

        res.json({ message: "GitHub link submitted successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ---------------------------------------------------
// 5️⃣ ADMIN APPROVE USER & SEND EMAIL (Protected Admin)
// ---------------------------------------------------
router.put("/approve/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent re-approving (optional but recommended)
        if (user.status === "approved") {
            return res.status(400).json({ message: "User is already approved." });
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        // Hash the temporary password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        user.password = hashedPassword;
        user.status = "approved";

        await user.save();

        // Send email with credentials
        await sendApprovalEmail(user.email, user.name, tempPassword);

        res.json({ message: "User approved and email sent with login credentials" });

    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ message: "Server error during approval", error });
    }
});

// ---------------------------------------------------
// 6️⃣ ADMIN GET ALL USERS (Protected Admin Only)
// ---------------------------------------------------
router.get("/all-users", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ---------------------------------------------------
// 7️⃣ SYSTEM SLOT COUNT (Protected Admin Only)
// ---------------------------------------------------
router.get("/system-count", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const count = await User.countDocuments({ needSystem: true });
        res.json({
            used: count,
            total: 60,
            remaining: 60 - count
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;