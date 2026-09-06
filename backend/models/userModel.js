import mongoose from 'mongoose';


const user = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    name: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,

    },
    otpExpiry: {
        type: Date
    }
})

const User = mongoose.model('User', user);
module.exports = User;