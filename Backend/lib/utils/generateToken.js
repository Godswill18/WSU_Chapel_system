import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: '2d',
    });

    res.cookie("jwt", token, {
      maxAge: 2 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'None' : 'Lax',
    });

    return token;
  } catch (error) {
    console.error('Error generating token or setting cookie:', error);
    throw error; // Or handle as needed
  }
};