const nodemailer = require("nodemailer");

const sendApprovalEmail = async (toEmail, name, tempPassword) => {
    try {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: "Event Portal - Approval Confirmation",
            html: `
                <h2>Congratulations ${name} 🎉</h2>
                <p>Your registration has been approved.</p>
                <p><strong>Login Credentials:</strong></p>
                <p>Email: ${toEmail}</p>
                <p>Temporary Password: ${tempPassword}</p>
                <p>Please login and change your password.</p>
                <br>
                <a href="https://your-render-link.onrender.com/login.html">
                Click here to Login
                </a>
                <br><br>
                <b>Join our WhatsApp Group for updates and support:</b><br>
                <a href="https://chat.whatsapp.com/K4e3EXbj6y44q0KuAYsjp7?mode=gi_t" target="_blank" style="color:#25D366; font-weight:bold;">Join WhatsApp Group</a>
            `
        };


        await transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Nodemailer sendMail error:", err);
            } else {
                console.log("Email sent:", info.response);
            }
        });

    } catch (error) {
        console.log("Email error:", error);
    }
};

module.exports = sendApprovalEmail;