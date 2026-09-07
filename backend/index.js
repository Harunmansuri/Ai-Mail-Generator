import express from 'express';
import authRoutes from './Routes/user.route.js';
import aiRoutes from './Routes/ai.route.js';
import { ConnectDb } from './config/db.js';
import dotenv from 'dotenv';
import cors from 'cors';


const app = express();
dotenv.config();

ConnectDb();
app.use(cors(
    {
        origin: '*',
    }
));
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
    next();
})
app.listen(PORT, () => {
    console.log(`Server is running on localhost:${PORT}`);
})