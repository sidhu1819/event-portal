const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// Import protection middleware
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ---------------------------------------------------
// 1️⃣ REGISTER ROUTE (Public)
// ---------------------------------------------------
router.post("/register", async (req, res) => {
    try {
        const { name, section, email, rollNumber, password, needSystem } = req.body;

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

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            section,
            email,
            rollNumber,
            password: hashedPassword,
            needSystem
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
            return res.status(403).json({ message: "Wait for admin approval." });
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

        if (!githubLink) {
            return res.status(400).json({ message: "GitHub link is required" });
        }

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
// 5️⃣ ADMIN APPROVE USER (Protected Admin Only)
// ---------------------------------------------------
router.put("/approve/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { status: "approved" },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User approved successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
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
            remaining: 60 - count
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;