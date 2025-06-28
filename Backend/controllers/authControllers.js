import {generateTokenAndSetCookie} from '../lib/utils/generateToken.js';
import User from "../models/userModel.js";
import bcrypt from 'bcryptjs';


export const register = async (req, res) => {
  try {
    const { firstName, lastName, department, position, courseOfStudy, email, phoneNumber, dateOfBirth, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !department || !position|| !courseOfStudy || !email || !phoneNumber || !dateOfBirth || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if phone number already exists
    const existingPhoneNumber = await User.findOne({ phoneNumber });
    if (existingPhoneNumber) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if(password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
        firstName,
        lastName,
        department,
        position,
        courseOfStudy,
        email,
        phoneNumber,
        dateOfBirth,
        password: hashedPassword,
    });

    if(newUser){
       // Save the user and generate a token
       generateTokenAndSetCookie(newUser._id, res);
        await newUser.save();

    res.status(201).json({
     _id: newUser._id,
     firstName: newUser.firstName,
     lastName: newUser.username,
     department: newUser.department,
     position: newUser.position,
     courseOfStudy: newUser.courseOfStudy,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      dateOfBirth: newUser.dateOfBirth,
      profileImg: newUser.profileImg,
      isActivated: newUser.isActivated,


    });
  } else {
    res.status(400).json({ error: "User creation failed" });
  }

   
  } catch (error) {
    console.log("Error in signup controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const login = async (req, res) => {
  try{
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

    if(!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if(!user.isActivated){
        return res.status(403).json({ error: "Account not activated. Please contact the Admin." });
    }
    
    // Generate a token and set it in the cookie
    generateTokenAndSetCookie(user._id, res);
    // console.log(generateTokenAndSetCookie())
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
        position: user.position,
      courseOfStudy: user.courseOfStudy,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      profileImg: user.profileImg,
    //   coverImg: user.coverImg,
    });


  }catch(error){
    console.log("Error in login controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }


};

export const logout = async (req, res) => {
try{
  res.cookie("jwt", "", {maxAge: 0});
  res.status(200).json({ message: "Logged out successfully" });

}catch(error){
  console.log("Error in logout controller:", error.message);
  res.status(500).json({ error: "Internal server error" });
}
};

export const getMe = async (req, res) => {
  try{
    const user = await User.findById(req.user._id).select("-password"); // The user is already attached to the request object by the protectRoute middleware
    res.status(200).json(user)

  }catch(error){
    console.log("Error in getMe controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}