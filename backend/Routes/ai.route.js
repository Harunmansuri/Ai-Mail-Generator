import express from "express";
import {
    generateEmail,
    getAllEmailHistory,
} from "../controllers/email.controller.js";

import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/generate", protectRoute, generateEmail);

router.get("/history", protectRoute, getAllEmailHistory);

export default router;

