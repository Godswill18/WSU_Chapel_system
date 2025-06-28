import Announcement from "../models/AnnouncementModel.js";
import fs from "fs";
import path from "path";


export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, type, department} = req.body;

    // Basic required fields
    if (!title || !description || !type) {
      return res.status(400).json({ message: "Title, description, and type are required." });
    }

    
    // Type-specific validation
    if (type === "departmental" && !department) {
      return res.status(400).json({ message: "Department is required for departmental announcements." });
    }

    if (type === "course" && !course) {
      return res.status(400).json({ message: "Course is required for course announcements." });
    }

    const ImagePath = req.file ? req.file.path : "";

    const announcement = new Announcement({
      title,
      description,
      image: ImagePath || "", // Default to empty string if not provided
      type,
      department
      // department: type === "departmental" ? department : undefined,
      // course: type === "course" ? course : undefined,
    });

    await announcement.save();

    res.status(201).json({
      message: "Announcement created successfully.",
      announcement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const getUserAnouncements = async(req, res) => {
//   const {department } = req.params;

//   try{
//     const announcements = await Announcement.find({
//       $or: [
//         {type: "general"},
//         {type: "departmental", department: department},
//       ]
//     }).sort({ createdAt: -1 });

//     res.status(200).json(announcements);
//   }catch (error) {
//     console.error("Error fetching user announcements:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }
export const getUserAnnouncements = async (req, res) => {
  try {
    const userDepartment = req.user?.department;

    if (!userDepartment) {
      return res.status(400).json({ message: "User department is required." });
    }

    const announcements = await Announcement.find({
      $or: [
        { type: "general" },
        { type: "departmental", department: userDepartment },
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching user announcements:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    res.status(200).json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, department, course } = req.body;

    const existingAnnouncement = await Announcement.findById(id);
    if (!existingAnnouncement) {
      // Cleanup uploaded image if announcement doesn't exist
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Announcement not found." });
    }

    // Validate non-empty updates
    if (
      (title !== undefined && title.trim() === "") ||
      (description !== undefined && description.trim() === "") ||
      (type !== undefined && type.trim() === "")
    ) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Fields cannot be empty if provided." });
    }

    if (type === "departmental" && (!department || department.trim() === "")) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Department is required for departmental announcements." });
    }

    if (type === "course" && (!course || course.trim() === "")) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: "Course is required for course announcements." });
    }

    // Update fields only if they were provided
    if (title !== undefined) existingAnnouncement.title = title;
    if (description !== undefined) existingAnnouncement.description = description;
    if (type !== undefined) existingAnnouncement.type = type;
    if (type === "departmental") existingAnnouncement.department = department;
    if (type === "course") existingAnnouncement.course = course;

    // Handle image update (only if validation passed above)
    if (req.file) {
      const newImagePath = req.file.path;

      // Delete old image if it exists
      if (existingAnnouncement.image && fs.existsSync(existingAnnouncement.image)) {
        fs.unlinkSync(existingAnnouncement.image);
      }

      existingAnnouncement.image = newImagePath;
    }

    await existingAnnouncement.save();

    res.status(200).json({
      message: "Announcement updated successfully.",
      announcement: existingAnnouncement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    // Delete image from local storage if it exists
    if (announcement.image && fs.existsSync(announcement.image)) {
      fs.unlinkSync(announcement.image);
    }

    // Delete the announcement from the database
    await Announcement.findByIdAndDelete(id);

    res.status(200).json({ message: "Announcement deleted successfully." });
  } catch (error) {
    console.error("Error deleting announcement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// This code defines the controllers for managing announcements in a Node.js application using Express and Mongoose.
