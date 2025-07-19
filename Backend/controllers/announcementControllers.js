import Announcement from "../models/announcementModel.js";
import fs from "fs";
import path from "path";
// import { batchCreateNotifications } from "../lib/utils/notificationUtils.js";
import User from "../models/userModel.js";

export const createAnnouncement = async (req, res) => {
  try {
    // Validate user authentication first
    // if (!req.user || !req.user._id) {
    //   return res.status(401).json({ 
    //     message: "Unauthorized - User not authenticated" 
    //   });
    // }

    const { 
      title, 
      content, 
      fullContent, 
      author, 
      // date, 
      category, 
      pinned = false,
      priority,
      // tags = [] 
    } = req.body;
    
    // const createdBy = req.user._id;

    // Required fields validation
    const requiredFields = { title, content, fullContent, author, category, priority };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Date format validation (YYYY-MM-DD)
    // if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    //   return res.status(400).json({ 
    //     message: "Date must be in YYYY-MM-DD format",
    //     received: date
    //   });
    // }

    // Category validation
    const validCategories = ['general', 'event', 'urgent', 'community'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        received: category
      });
    }

    // Handle file upload if present
    const imagePath = req.file ? req.file.path : undefined;

    const announcement = new Announcement({
      title,
      content,
      fullContent,
      author,
      // date,
      category,
      pinned: Boolean(pinned),
      image: imagePath,
      priority
      // tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
    });

    const savedAnnouncement = await announcement.save();

    // Notification logic
    // try {
    //   let recipientUserIds = [];
      
    //   if (category === 'urgent') {
    //     const activeUsers = await User.find({ isActive: true }).select('_id');
    //     recipientUserIds = activeUsers.map(user => user._id);
    //   } else if (category === 'community') {
    //     const communityUsers = await User.find({ 
    //       notifyCommunity: true,
    //       isActive: true 
    //     }).select('_id');
    //     recipientUserIds = communityUsers.map(user => user._id);
    //   }

    //   // Filter out creator from notifications
    //   recipientUserIds = recipientUserIds.filter(id => 
    //     id.toString() !== createdBy.toString()
    //   );

    //   if (recipientUserIds.length > 0) {
    //     await batchCreateNotifications(
    //       createdBy,
    //       recipientUserIds,
    //       'announcement',
    //       `New ${category.charAt(0).toUpperCase() + category.slice(1)} Announcement`,
    //       title,
    //       {
    //         announcementId: savedAnnouncement._id,
    //         category
    //       }
    //     );
    //   }
    // } catch (notifError) {
    //   console.error("Notification error (non-critical):", notifError);
    //   // Continue even if notifications fail
    // }

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement: savedAnnouncement
    });

  } catch (error) {
    console.error("Error creating announcement:", error);

    // Clean up uploaded file if error occurred
    if (req.file?.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (fileError) {
        console.error("Error deleting uploaded file:", fileError);
      }
    }
    
    return res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message 
    });
  }
};

export const getAllAnnouncements = async (req, res) => {
  try {
    const { category, pinned, search } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (pinned) filter.pinned = pinned === 'true';
    if (search) {
      filter.$text = { $search: search };
    }

    const announcements = await Announcement.find(filter)
      .sort({ pinned: -1, date: -1, createdAt: -1 });
      
    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllAnnouncementsAdmin = async (req, res) => {
  try {
    const { category, pinned, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (pinned) filter.pinned = pinned === 'true';
    if (search) {
      filter.$text = { $search: search };
    }

    // Fetch announcements with lean and map _id to id
    const announcements = await Announcement.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .lean()
      .exec();

    // Map _id to id and ensure object structure
    const announcementsWithId = announcements.map((a) => ({
      ...a,
      id: a._id.toString(),
    }));

    res.status(200).json(announcementsWithId);
  } catch (error) {
    console.error("Error fetching admin announcements:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message 
    });
  }
};


export const getUserAnnouncements = async (req, res) => {
  try {
    // Get announcements based on user preferences
    const user = await User.findById(req.user._id);
    
    const filter = {
      $or: [
        { category: 'general' },
        { category: 'urgent' },
        { category: 'event' }
      ]
    };

    // Include community if user opted in
    if (user?.notifyCommunity) {
      filter.$or.push({ category: 'community' });
    }

    const announcements = await Announcement.find(filter)
      .sort({ pinned: -1, date: -1, createdAt: -1 });

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
    const updates = req.body;

    // ✅ Fetch existing document
   const existingAnnouncement = await Announcement.findByIdAndUpdate(id);

    if (!existingAnnouncement) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Announcement not found." });
    }

    // ✅ Validate category
    if (updates.category && !['general', 'event', 'urgent', 'community'].includes(updates.category)) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Invalid category." });
    }

    // ✅ Update allowed fields
    const allowedUpdates = ['title', 'content', 'fullContent', 'author', 'category', 'pinned', 'priority'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        existingAnnouncement[field] = updates[field];
      }
    });

    // ✅ Handle image replacement
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
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const togglePinAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Toggle the pinned status
    announcement.pinned = !announcement.pinned;
    await announcement.save();

    res.status(200).json({
      success: true,
      data: announcement,
      message: `Announcement ${announcement.pinned ? 'pinned' : 'unpinned'} successfully`
    });

  } catch (error) {
    console.error('Error toggling pin status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    // Delete image if it exists
    if (announcement.image && fs.existsSync(announcement.image)) {
      fs.unlinkSync(announcement.image);
    }

    res.status(200).json({ message: "Announcement deleted successfully." });
  } catch (error) {
    console.error("Error deleting announcement:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};