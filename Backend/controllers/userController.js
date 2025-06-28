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

export const updatePeofile = async (req, res) => {

    const { firstName, lastName, department, courseOfStudy, email, phoneNumber, dateOfBirth, currentPassword, newPassword } = req.body;

    const userId = req.user._id;

    try{
        let user = await User.findById(userId);
        
        if(!user) return res.status(404).json({message: "User not found"});

        if((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({error: "Please provide both current and new password or neither"});
        }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
            }

            if(email !== user.email){

                // Check if email already exists
                 const existingEmail = await User.findOne({ email });
                 if (existingEmail) {
                 return res.status(400).json({ error: "Email already exists" });
                 }
            }


        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch) return res.status(400).json({error: "Current password is incorrect"});

            if(newPassword.length < 4) return res.status(400).json({error: "New password must be at least 4 characters long"});

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword;
        }

        // Update user details
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.department = department || user.department;
        user.courseOfStudy = courseOfStudy || user.courseOfStudy;
        user.email = email || user.email;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        // user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        user.password = null; // Remove password from the response

        return res.status(200).json(user ,{message: "User updated successfully"});


    }catch(error){
        console.log("Error in updating User:", error.message);
        res.status(500).json({error: error.message});
    }
}

export const getAllUsers = async (req, res) => {
    try{
        const users = await User.find({isActivated: true}).select("-password");

        if(users.length === 0){
            return res.status(404).json({message: "No users found"});
        }

        res.status(200).json(users);
        

    }catch(error){
        console.log("Error in getAllUsers:", error.message);
        res.status(500).json({error: error.message});
    }
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