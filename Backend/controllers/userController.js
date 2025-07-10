import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import fs from "fs";
import path from "path";

export const getUserProfile = async (req, res) => {
    const {id} = req.params;

    try{
        // If the user is not found, return a 404 error
         if(!id){
            return res.status(400).json({message: "User ID is required"});
        }

        const user = await User.findById(id).select("-password").exec();

        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json(user);

    }catch(error){
        console.log("Error in getUserProfile", error.message);
        res.status(500).json({error: error.message});
    }

}

export const updateProfile = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    department,
    courseOfStudy,
    dateOfBirth,
    bio,
    address,
    emergencyContactName,
    emergencyContact,
    emergencyRelationship,
    currentPassword,
    newPassword
  } = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email is being changed and if new email already exists
    if (email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Handle password change if both passwords are provided
    if (currentPassword && newPassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Please provide both current and new password" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

      if (newPassword.length < 4) {
        return res.status(400).json({ error: "New password must be at least 4 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    // Update user details
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.department = department || user.department;
    user.courseOfStudy = courseOfStudy || user.courseOfStudy;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.bio = bio || user.bio;
    user.address = address || user.address;
    user.emergencyContactName = emergencyContactName || user.emergencyContactName;
    user.emergencyContact = emergencyContact || user.emergencyContact;
    user.emergencyRelationship = emergencyRelationship || user.emergencyRelationship;

    const updatedUser = await user.save();
    updatedUser.password = undefined; // Remove password from response

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updating User:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Upload profile image
export const uploadProfileImg = async (req, res) => {
  // Accept any of the three possible id fields
  const userId = req.user?.userId || req.user?.id || req.user?._id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required!" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newImagePath = req.file.path;

    // Delete any existing image in local storage
    if (user.profileImg && fs.existsSync(user.profileImg)) {
      fs.unlinkSync(user.profileImg);
    }

    user.profileImg = newImagePath;
    await user.save();

    res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImg: user.profileImg
    });
  } catch (error) {
    console.error("Error in uploadProfile:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });

    // Validate new password
    if (newPassword.length < 4) {
      return res.status(400).json({ error: "New password must be at least 4 characters long" });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log("Error in changePassword:", error.message);
    res.status(500).json({ error: "Failed to change password" });
  }
};

export const getAllUsers = async (req, res) => {
    try {
        // Get all active users with specific fields needed for birthdays
        const users = await User.find({ isActivated: true })
            .select('firstName lastName dateOfBirth department role profilePicture')
            .lean(); // Convert to plain JS objects for better performance

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "No users found",
                users: []
            });
        }

        // Transform dateOfBirth to consistent format
        const processedUsers = users.map(user => ({
            ...user,
            // Ensure dateOfBirth is in ISO format (YYYY-MM-DD)
            dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] || null
        }));

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            users: processedUsers
        });

    } catch (error) {
        console.error("Error in getAllUsers:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// New endpoint specifically for birthdays
export const getBirthdays = async (req, res) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
        
        // Get users with birthdays this month (for better performance)
        const users = await User.find({ 
            isActivated: true,
            $expr: {
                $eq: [{ $month: "$dateOfBirth" }, currentMonth]
            }
        })
        .select('firstName lastName dateOfBirth department position profileImg')
        .lean();

        // Process birthdays with age calculation
        const birthdays = users.map(user => {
            const birthDate = new Date(user.dateOfBirth);
            const age = calculateAge(birthDate);

            
            return {
                ...user,
                age,
                dateOfBirth: birthDate.toISOString().split('T')[0],
                isToday: isBirthdayToday(birthDate),
                isThisWeek: isBirthdayThisWeek(birthDate),
                initials: getInitials(user.firstName, user.lastName)
            };
        });

        res.status(200).json({
            success: true,
            message: "Birthdays retrieved successfully",
            birthdays
        });

    } catch (error) {
        console.error("Error in getBirthdays:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Helper functions
function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function isBirthdayToday(birthDate) {
    const today = new Date();
    return (
        birthDate.getDate() === today.getDate() && 
        birthDate.getMonth() === today.getMonth()
    );
}

function isBirthdayThisWeek(birthDate) {
    const today = new Date();
    const birthDateThisYear = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
    );
    
    const diffDays = Math.floor((birthDateThisYear - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
}

function getInitials(firstName, lastName) {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export const getAllUsersInDepartment = async(req, res) => {
    const { department } = req.params;

    try{
        if(!department){
            return res.status(400).json({message: "Department is required"});
        }

        const users = await User.find({ department, isActivated: true }).select("-password");

        if(users.length === 0){
            return res.status(404).json({message: "No users found in this department"});
        }

        res.status(200).json(users);

    }catch(error){
        console.log("Error in getAllUsersInDepartment:", error.message);
        res.status(500).json({error: error.message});
    }
}

export const uploadProfile = async (req, res) => {
  // Accept any of the three possible id fields
  const userId = req.user?.userId || req.user?.id || req.user?._id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required!" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newImagePath = req.file.path;

    // Delete any existing image in local storage
    if (user.profileImg && fs.existsSync(user.profileImg)) {
      fs.unlinkSync(user.profileImg);
    }

    user.profileImg = newImagePath;
    await user.save();

    res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImg: user.profileImg
    });
  } catch (error) {
    console.error("Error in uploadProfile:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};