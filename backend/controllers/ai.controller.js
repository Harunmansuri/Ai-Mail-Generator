import axios from "axios";
import EmailHistory from "../models/emailHistory.model.js";

// Generate Subject + Email + Follow-up + LinkedIn DM
export const generateEmail = async (req, res) => {
    try {
        const { content } = req.body;

        // Validation
        if (!content) {
            return res.status(400).json({
                success: false,
                error: "Content is required",
            });
        }

        // Check authentication
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
            });
        }

        const prompt = `
You are an expert professional cold email copywriter,
    recruiter outreach specialist, and LinkedIn networking expert.

Based on the user's information below, generate highly
personalized, professional and natural - sounding outreach content.

USER INFORMATION:
${content}

Generate exactly these 4 things:

1. subject:
Generate a professional and attention - grabbing email subject.
- Keep it short.
- Make it relevant to the user's purpose.
    - Avoid clickbait.
- Make it sound human.
- Do not use emojis.

2. emailBody:
Write a professional cold email.
- Make it sound human, not AI - generated.
- Keep it concise and persuasive.
- Use a professional but friendly tone.
- Clearly communicate the purpose.
- Include a strong but natural call - to - action.
- Do not use unnecessary emojis.
- Do not make fake claims.
- Do not include the subject line inside the email body.
- Use proper paragraphs.
- Do not add explanations outside the email.

3. followUpEmail:
Write a professional follow - up email.
- Assume the original email was already sent.
- Keep it short.
- Do not sound desperate or pushy.
- Naturally reference the previous email.
- Include a simple call - to - action.
- Do not include a subject line inside the body.

4. linkedInDM:
Write a short LinkedIn outreach message.
- Natural and conversational.
- Professional.
- Maximum 500 characters.
- Do not sound like a sales pitch.
- Make it personalized.
- End with a natural reason to connect.

Return ONLY valid JSON in exactly this format:

{
    "subject": "...",
        "emailBody": "...",
            "followUpEmail": "...",
                "linkedInDM": "..."
}
`;

        // Groq API
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",

                messages: [
                    {
                        role: "system",
                        content:
                            "You are an expert professional email and LinkedIn outreach copywriter. Always return valid JSON.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],

                temperature: 0.7,
                max_tokens: 1000,

                response_format: {
                    type: "json_object",
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY} `,
                    "Content-Type": "application/json",
                },
            }
        );

        // AI response
        const aiContent = response.data.choices[0].message.content;

        const generatedContent = JSON.parse(aiContent);

        const {
            subject,
            emailBody,
            followUpEmail,
            linkedInDM,
        } = generatedContent;

        // Validate AI response
        if (
            !subject ||
            !emailBody ||
            !followUpEmail ||
            !linkedInDM
        ) {
            return res.status(500).json({
                success: false,
                error: "AI failed to generate all required content",
            });
        }

        // Save in MongoDB
        const emailHistory = await EmailHistory.create({
            user: req.user._id,
            prompt: content,
            subject,
            emailBody,
            followUpEmail,
            linkedInDM,
        });

        // Response
        return res.status(201).json({
            success: true,
            message: "Email generated successfully",

            data: {
                id: emailHistory._id,
                subject: emailHistory.subject,
                emailBody: emailHistory.emailBody,
                followUpEmail: emailHistory.followUpEmail,
                linkedInDM: emailHistory.linkedInDM,
                createdAt: emailHistory.createdAt,
            },
        });

    } catch (error) {
        console.error(
            "Generate Email Error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            error: "An error occurred while generating the email",
            details:
                error.response?.data?.error?.message ||
                error.message,
        });
    }
};


// Get all email history
export const getAllEmailHistory = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
            });
        }

        const emailHistory = await EmailHistory.find({
            user: req.user._id,
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: emailHistory.length,
            data: emailHistory,
        });

    } catch (error) {
        console.error(
            "Get Email History Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error: "Failed to fetch email history",
        });
    }
};

