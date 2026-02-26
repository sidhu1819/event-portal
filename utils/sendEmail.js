const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendApprovalEmail = async (toEmail, name, tempPassword) => {
    try {

        console.log("Brevo Key:", process.env.BREVO_API_KEY);

        const client = SibApiV3Sdk.ApiClient.instance;

        const apiKey = client.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

        const sender = {
            email: "832siddhartha@gmail.com",
            name: "Event Portal"
        };

        const receivers = [
            {
                email: toEmail,
                name: name
            }
        ];

        await tranEmailApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: "Event Portal - Approval Confirmation",
            htmlContent: `
                <h2>Congratulations ${name} 🎉</h2>
                <p>Your registration has been approved.</p>
                <p><strong>Login Credentials:</strong></p>
                <p>Email: ${toEmail}</p>
                <p>Temporary Password: ${tempPassword}</p>
                <p>Please login and change your password.</p>
                <br>
                <a href="https://event-portal-5ftl.onrender.com/login.html">
                Click here to Login
                </a>
                <a href="https://chat.whatsapp.com/K4e3EXbj6y44q0KuAYsjp7?mode=gi_t" target="_blank">
                    Join WhatsApp Group
                </a>
            `
        });

        console.log("Email sent via Brevo successfully");

    } catch (error) {
        console.error("Brevo email sending failed:", error.response?.body || error);
        throw error;
    }
};

module.exports = sendApprovalEmail;
