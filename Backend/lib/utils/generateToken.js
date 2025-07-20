import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '2d', // Token expires in 2 days
  });

  res.cookie("jwt", token, {
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    httpOnly: true, // Prevent JS access
    secure: true, // Secure only in production
    sameSite: "none" 
    // secure: process.env.NODE_ENV === "production", // Secure only in production
    // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" // For cross-origin setups
  });

  return token; // Return token only if you also use it in frontend
};
