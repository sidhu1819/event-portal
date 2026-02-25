require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");

const app = express();

// 1️⃣ GLOBAL MIDDLEWARE
app.use(express.json());
app.use(cors());

// 2️⃣ DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected ✅"))
    .catch(err => console.log("MongoDB Connection Error: ", err));

// 3️⃣ STATIC FILES (Serve Frontend)
// This ensures that visiting http://localhost:5000/ looks into the 'client' folder
app.use(express.static(path.join(__dirname, "client")));

// 4️⃣ API ROUTES
app.use("/api", authRoutes);

// 5️⃣ FALLBACK ROUTE
app.get("/", (req, res) => {
    res.send("Server running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});