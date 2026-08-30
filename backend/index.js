import express from express;
import authRoutes from './Routes/user.route.js';
const app = express();
import ConnectDb from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

ConnectDb();
app.use(cors());
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on localhost:${PORT}`);
})