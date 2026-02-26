const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter once at startup
transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP Connection Error:", error);
    } else {
        console.log("SMTP Server Ready ✅");
    }
});

const sendApprovalEmail = async (toEmail, name, tempPassword) => {
    try {
        const mailOptions = {
            from: `"Event Portal" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: "Event Portal - Approval Confirmation",
            html: `
                <h2>Congratulations ${name} 🎉</h2>
                <p>Your registration has been approved.</p>
                <p><strong>Login Credentials:</strong></p>
                <p>Email: ${toEmail}</p>
                <p>Temporary Password: ${tempPassword}</p>
                <p>Please login and change your password after logging in.</p>
                <br>
                <a href="https://your-render-link.onrender.com/login.html">
                    Click here to Login
                </a>
                <br><br>
                <b>Join our WhatsApp Group for updates and support:</b><br>
                <a href="https://chat.whatsapp.com/K4e3EXbj6y44q0KuAYsjp7?mode=gi_t" target="_blank">
                    Join WhatsApp Group
                </a>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);

    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};

module.exports = sendApprovalEmail;