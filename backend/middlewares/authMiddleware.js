import jsonwebtoken from 'jsonwebtoken'
import User from '../models/userModel'

export const verifyToken = async (req, res, next) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer', '');
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token Provided' });
        }
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
}
