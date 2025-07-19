import {generateAdminTokenAndSetCookie} from '../../lib/utils/generateAdminToken.js';
import Admin from "../../models/adminModel.js";
import bcrypt from 'bcryptjs';
import User from '../../models/userModel.js';


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
//     generateAdminTokenAndSetCookie(newAdmin._id, res);

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
    if (account_Type === "super admin") {
      const superAdminCount = await Admin.countDocuments({ account_Type: "super admin" });
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
    const token = generateAdminTokenAndSetCookie(newAdmin._id); // Modified to return token
    
    res.status(201).json({
      _id: newAdmin._id,
      firstName: newAdmin.firstName,
      lastName: newAdmin.lastName,
      email: newAdmin.email,
      phoneNumber: newAdmin.phoneNumber,
      account_Type: newAdmin.account_Type,
      profileImg: newAdmin.profileImg,
      token // Include token in response
    });


  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate token and set cookie
    const token = generateAdminTokenAndSetCookie(admin._id, res);

    // Return admin data without sensitive information
    const adminData = {
      _id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      account_Type: admin.account_Type,
      profileImg: admin.profileImg,
      token: token // Include token in response if needed
    };

    res.status(200).json(adminData);

  } catch (error) {
    console.error("Error in login controller:", error.message);
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
    const admin = await Admin.findById(req.admin._id).select("-password"); // The admin is already attached to the request object by the protectRoute middleware
    res.status(200).json(admin)

  }catch(error){
    console.log("Error in getMe controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}



export const getAllAdmins = async (req, res) => {
  try {
    // Get all admins with specific fields
    const admins = await Admin.find({
      account_Type: 'admin' // Only get users with admin role
    })
    .select('firstName lastName email phoneNumber profileImage isActive account_Type createdAt')
    .lean();

    if (admins.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: "No admins found",
        admins: []
      });
    }

    res.status(200).json({
      success: true,
      message: "Admins retrieved successfully",
      admins
    });

  } catch (error) {
    console.error("Error in getting all admins:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    // Get all user with specific fields
    const users = await User.find()
    // .select('firstName lastName email phoneNumber profileImage isActive department position createdAt')
    // .lean();

    if (users.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: "No user found",
        users: []
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      users
    });

  } catch (error) {
    console.error("Error in getting all user:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Toggle admin status
export const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the admin and toggle their status
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.status(200).json({
      success: true,
      message: `Admin's Account ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      admin: {
        _id: admin._id,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error("Error toggling admin status:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user and toggle their status
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActivated = !user.isActivated;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User's Account ${user.isActivated ? 'activated' : 'deactivated'} successfully`,
      user: {
        _id: user._id,
        isActivated: user.isActivated
      }
    });

  } catch (error) {
    console.error("Error toggling user status:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// / Change password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin._id;

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    // Validate new password
    if (newPassword.length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters long" });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    admin.password = hashedPassword;

    await admin.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log("Error in changePassword:", error.message);
    res.status(500).json({ error: "Failed to change password" });
  }
};