const nodemailer = require("nodemailer");

const sendApprovalEmail = async (toEmail, name, tempPassword) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
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
            `
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.log("Email error:", error);
    }
};

module.exports = sendApprovalEmail;