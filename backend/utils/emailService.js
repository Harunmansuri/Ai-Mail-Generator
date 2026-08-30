import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Send Email
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        // Validate environment variables
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error(
                "EMAIL_USER and EMAIL_PASS are not configured in environment variables"
            );
        }

        // Validate required email fields
        if (!to || !subject || !text) {
            throw new Error(
                "Email recipient, subject, and text are required"
            );
        }

        // Email options
        const mailOptions = {
            from: `"AI Cold Mail Generator" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || `<p>${text}</p>`,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log(
            `Email sent successfully to ${to}: ${info.messageId}`
        );

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error("Email service error:", error.message);

        throw new Error("Failed to send email");
    }
};

export default sendEmail;