import express from express;
import authRoutes from './Routes/user.route.js';
import aiRoutes from './Routes/ai.route.js';
import ConnectDb from './config/db.js';
import dotenv from 'dotenv';


const app = express();
dotenv.config();

ConnectDb();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on localhost:${PORT}`);
})