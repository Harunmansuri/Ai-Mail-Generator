import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/emailService.js";

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "30d",
        }
    );
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==============================
// REGISTER USER
// ==============================
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Required fields validation
        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        // Name validation
        if (normalizedName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 2 characters long",
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered. Please login.",
            });
        }

        // Generate OTP
        const otp = generateOTP();

        const otpExpiry = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Create user
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
            otp,
            otpExpiry,
            isVerified: false,
        });

        // Send OTP email
        try {
            await sendEmail({
                to: user.email,
                subject: "Email Verification OTP - AI Cold Mail Generator",
                text: `Hello ${user.name},

Your OTP for email verification is:

${otp}

This OTP is valid for 10 minutes.

If you did not create this account, please ignore this email.

Regards,
AI Cold Mail Generator Team`,
            });
        } catch (error) {
            console.error(
                "OTP email sending failed:",
                error.message
            );
        }

        return res.status(201).json({
            success: true,
            message:
                "Registration successful. Please verify the OTP sent to your email.",
            userId: user._id,
            email: user.email,
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// ==============================
// VERIFY OTP
// ==============================
export const verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        // Validate fields
        if (!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: "User ID and OTP are required",
            });
        }

        // Validate OTP
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "OTP must be a 6-digit number",
            });
        }

        // Find user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Already verified
        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message:
                    "Email is already verified. Please login.",
            });
        }

        // OTP doesn't exist
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message:
                    "No active OTP found. Please request a new OTP.",
            });
        }

        // OTP expired
        if (Date.now() > user.otpExpiry.getTime()) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP has expired. Please request a new OTP.",
            });
        }

        // Invalid OTP
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again.",
            });
        }

        // Verify user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save();

        // Generate JWT
        const token = generateToken(user._id);

        // Store token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully!",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("OTP verification error:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// ==============================
// LOGIN USER
// ==============================
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate fields
        if (!email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user
        const user = await User.findOne({
            email: normalizedEmail,
        });

        // Don't reveal whether email exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check email verification
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message:
                    "Please verify your email before logging in.",
                userId: user._id,
            });
        }

        // Check password
        const isPasswordValid =
            await user.matchPassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate JWT
        const token = generateToken(user._id);

        // Store JWT in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful!",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

// ==============================
// LOGOUT USER
// ==============================
export const logoutUser = async (req, res) => {
    try {
        // Clear JWT cookie
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};