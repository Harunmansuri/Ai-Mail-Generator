import jsonwebtoken from 'jsonwebtoken'
import User from '../models/userModel'

const protect = async (req, res, next) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer', '');
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token Provided' });
            u
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if 
        } catch (error) {

        }
    }