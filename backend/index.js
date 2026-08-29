import express from express;
import authRoutes from './Routes/user.route.js';
const app = express();
import dotenv from 'dotenv';
dotenv.config();

app.use(cors());
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on localhost:${PORT}`);
})