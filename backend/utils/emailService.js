import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Verify SMTP connection
        await transporter.verify();

        // Send email
        const info = await transporter.sendMail({
            from: `"AI Cold Mail Generator" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text: message,
        });

        console.log("Email sent successfully:", info.messageId);

        return info;
    } catch (error) {
        console.error("Email service error:", error.message);
        throw new Error("Failed to send email");
    }
};

export default sendEmail;