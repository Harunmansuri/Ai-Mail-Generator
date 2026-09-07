import { User } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/emailService.js";

// ==============================
// GENERATE JWT TOKEN
// ==============================
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "30d",
        }
    );
};

// ==============================
// GENERATE 6-DIGIT OTP
// ==============================
const generateOTP = () => {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
};

// ==============================
// REGISTER USER
// ==============================
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, and password are required",
            });
        }

        // Validate email
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address",
            });
        }

        // Validate password
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters long",
            });
        }

        // Validate name
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message:
                    "Name must be at least 2 characters long",
            });
        }

        // Normalize email
        const normalizedEmail =
            email.trim().toLowerCase();

        // Check existing user
        const userExists = await User.findOne({
            email: normalizedEmail,
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message:
                    "Email already registered. Please try logging in.",
            });
        }

        // ==============================
        // HASH PASSWORD
        // ==============================
        const salt = await bcrypt.genSalt(12);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );

        // Generate OTP
        const otp = generateOTP();

        // OTP expires in 10 minutes
        const otpExpiry = new Date(
            Date.now() + 10 * 60 * 1000
        );

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            otp,
            otpExpiry,
            isVerified: false,
        });

        // ==============================
        // SEND OTP EMAIL
        // ==============================
        const message = `Hello ${user.name},

Your OTP for email verification is:

${otp}

This OTP is valid for 10 minutes.

If you did not create this account, please ignore this email.

Regards,
AI Cold Mail Generator Team`;

        try {
            await sendEmail({
                to: user.email,
                subject:
                    "Email Verification OTP - AI Cold Mail Generator",
                text: message,
            });
        } catch (error) {
            console.error(
                "Email sending error:",
                error.message
            );
        }

        return res.status(201).json({
            success: true,
            message:
                "User registered successfully. Please verify OTP sent to your email.",
            userId: user._id,
            email: user.email,
        });
    } catch (error) {
        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message,
        });
    }
};

// ==============================
// VERIFY OTP
// ==============================
export const verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ message: 'User ID and OTP are required' });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'OTP must be a 6-digit number' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified. Please login.' });
        }

        if (!user.otp || !user.otpExpiry) {

            return res.status(400).json({ message: 'No OTP found. Please register again.' });
        }

        if (Date.now() > user.otpExpiry.getTime()) {
            return res.status(400).json({ message: 'OTP has expired. Please register again.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save();
        const token = generateToken(user._id);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: token,
            message: 'Email verified successfully!'
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
};

// ==============================
// LOGIN USER
// ==============================
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }

        // Normalize email
        const normalizedEmail =
            email.trim().toLowerCase();

        // Find user
        const user = await User.findOne({
            email: normalizedEmail,
        });

        // User not found
        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        // Check email verification
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message:
                    "Please verify your email first",
                userId: user._id,
            });
        }

        // ==============================
        // COMPARE PASSWORD
        // ==============================
        const isPasswordValid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        // Generate JWT
        const token = generateToken(
            user._id
        );

        return res.status(200).json({
            success: true,
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
            message: "Login successful!",
        });
    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message,
        });
    }
};

// ==============================
// LOGOUT USER
// ==============================
export const logoutUser = async (req, res) => {
    try {
        // Clear authentication cookie
        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
            sameSite: "strict",
            secure:
                process.env.NODE_ENV ===
                "production",
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message,
        });
    }
};