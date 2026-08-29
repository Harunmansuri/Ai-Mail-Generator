import express from "express";
import {
    registerUser,
    verifyOTP,
    loginUser,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);
router.post("/logout", logout);


export default router;