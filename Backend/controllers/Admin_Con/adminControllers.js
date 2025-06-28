import {generateTokenAndSetCookie} from '../../lib/utils/generateToken.js';
import Admin from "../../models/adminModel.js";
import bcrypt from 'bcryptjs';


// export const signUp = async (req, res) => {
//   try {
//     const { firstName, lastName, email, phoneNumber, account_Type, password } = req.body;

//     if (!firstName || !lastName || !email || !phoneNumber || !account_Type || !password) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ error: "Invalid email format" });
//     }

//     const existingPhoneNumber = await Admin.findOne({ phoneNumber });
//     if (existingPhoneNumber) {
//       return res.status(400).json({ error: "Phone number already exists" });
//     }

//     const existingEmail = await Admin.findOne({ email });
//     if (existingEmail) {
//       return res.status(400).json({ error: "Email already exists" });
//     }

//     if (password.length < 4) {
//       return res.status(400).json({ error: "Password must be at least 4 characters long" });
//     }

//     // Enforce super_admin creation rule
//     if (account_Type === "super_admin") {
//       // Must be logged in as super_admin to create one
//       if (!req.admin || req.admin.account_Type !== "super_admin") {
//         return res.status(403).json({ error: "Only super admins can create another super admin." });
//       }

//       // Only allow up to 2 super_admins total
//       const superAdminCount = await Admin.countDocuments({ account_Type: "super_admin" });
//       if (superAdminCount >= 2) {
//         return res.status(403).json({ error: "Only 2 super admins are allowed." });
//       }
//     }

//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newAdmin = new Admin({
//       firstName,
//       lastName,
//       email,
//       phoneNumber,
//       account_Type,
//       password: hashedPassword,
//     });

//     await newAdmin.save();
//     generateTokenAndSetCookie(newAdmin._id, res);

//     res.status(201).json({
//       _id: newAdmin._id,
//       firstName: newAdmin.firstName,
//       lastName: newAdmin.lastName,
//       email: newAdmin.email,
//       phoneNumber: newAdmin.phoneNumber,
//       account_Type: newAdmin.account_Type,
//       profileImg: newAdmin.profileImg,
//     });

//   } catch (error) {
//     console.error("Signup error:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };


export const signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, account_Type, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !account_Type || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingPhoneNumber = await Admin.findOne({ phoneNumber });
    if (existingPhoneNumber) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long" });
    }

    // Enforce max 2 super_admins
    if (account_Type === "super_admin") {
      const superAdminCount = await Admin.countDocuments({ account_Type: "super_admin" });
      if (superAdminCount >= 2) {
        return res.status(403).json({ error: "Only 2 super admins are allowed." });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      firstName,
      lastName,
      email,
      phoneNumber,
      account_Type,
      password: hashedPassword,
    });

    await newAdmin.save();
    generateTokenAndSetCookie(newAdmin._id, res);

    res.status(201).json({
      _id: newAdmin._id,
      firstName: newAdmin.firstName,
      lastName: newAdmin.lastName,
      email: newAdmin.email,
      phoneNumber: newAdmin.phoneNumber,
      account_Type: newAdmin.account_Type,
      profileImg: newAdmin.profileImg,
    });

  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};




export const login = async (req, res) => {
  try{
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    const isPasswordCorrect = await bcrypt.compare(password, admin?.password || "");

    if(!admin || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    
    // Generate a token and set it in the cookie
    generateTokenAndSetCookie(admin._id, res);
    // console.log(generateTokenAndSetCookie())
    res.status(200).json({
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      account_Type: admin.account_Type,
      profileImg: admin.profileImg,
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
    const admin = await Admin.findById(req.user._id).select("-password"); // The user is already attached to the request object by the protectRoute middleware
    res.status(200).json(admin)

  }catch(error){
    console.log("Error in getMe controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}