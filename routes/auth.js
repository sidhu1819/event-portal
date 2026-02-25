const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const sendApprovalEmail = require("../utils/sendEmail");

const router = express.Router();


// ---------------------------------------------------
// 1️⃣ REGISTER ROUTE
// ---------------------------------------------------
router.post("/register", async (req, res) => {
    try {
        const { name, section, email, rollNumber, needSystem } = req.body;

        // ✅ Strict Roll Number Validation
        // Allowed: A24126551001 to A24126551230

        const rollRegex = /^A24126551(00[1-9]|0[1-9][0-9]|1[0-9][0-9]|2[0-2][0-9]|230)$/;

        if (!rollRegex.test(rollNumber)) {
            return res.status(400).json({
                message: "Invalid roll number. Only CSD 1st year allowed."
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // System limit (Max 60)
        if (needSystem) {
            const systemUsers = await User.countDocuments({ needSystem: true });
            if (systemUsers >= 60) {
                return res.status(400).json({
                    message: "System slots full. Please bring your own laptop."
                });
            }
        }

        const newUser = new User({
            name,
            section,
            email,
            rollNumber,
            needSystem,
            status: "pending",
            role: "participant"
        });

        await newUser.save();

        res.status(201).json({
            message: "Registration successful. Wait for admin approval."
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// ---------------------------------------------------
// 2️⃣ LOGIN ROUTE
// ---------------------------------------------------
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (user.status !== "approved") {
            return res.status(403).json({
                message: "Your account has not been approved yet."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

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
// 3️⃣ PARTICIPANT DASHBOARD
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
// 4️⃣ SUBMIT GITHUB LINK
// ---------------------------------------------------
router.put("/submit-github", verifyToken, async (req, res) => {
    try {
        const { githubLink } = req.body;

        if (!githubLink) {
            return res.status(400).json({ message: "GitHub link is required" });
        }

        await User.findByIdAndUpdate(req.user.id, { githubLink });

        res.json({ message: "GitHub link submitted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


// ---------------------------------------------------
// 5️⃣ ADMIN APPROVE USER + SEND EMAIL
// ---------------------------------------------------
router.put("/approve/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.status === "approved") {
            return res.status(400).json({ message: "User already approved" });
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        user.password = hashedPassword;
        user.status = "approved";

        await user.save();

        // Send email
        await sendApprovalEmail(user.email, user.name, tempPassword);

        res.json({
            message: "User approved and email sent successfully"
        });

    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ message: "Server error during approval" });
    }
});


// ---------------------------------------------------
// 6️⃣ ADMIN GET ALL USERS
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
// 7️⃣ SYSTEM SLOT COUNT
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

// ---------------------------------------------------
// 8️⃣ DELETE USER (Admin Only)
// ---------------------------------------------------
router.delete("/delete/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
