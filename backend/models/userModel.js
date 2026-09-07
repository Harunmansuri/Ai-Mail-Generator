import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        otp: {
            type: String,
            default: null,
        },

        otpExpiry: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model("User", userSchema);