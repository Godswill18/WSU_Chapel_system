// utils/generateToken.js
import jwt from 'jsonwebtoken';

export const generateAdminTokenAndSetCookie = (adminId, res = null) => {
    const token = jwt.sign({ adminId }, process.env.JWT_SECRET, {
        expiresIn: '2d',
    });

    // Only set cookie if response object is provided
    if (res) {
        res.cookie("jwt", token, {
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
        httpOnly: true, // Prevent JS access
        secure: process.env.NODE_ENV === "production", // Secure only in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" 
            // secure: process.env.NODE_ENV !== "development",
        });
    }
    
    return token; // Always return the token
};