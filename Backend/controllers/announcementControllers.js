import Announcement from "../models/AnnouncementModel.js";
import fs from "fs";
import path from "path";
import { batchCreateNotifications } from "../lib/utils/notificationUtils.js";
import User from "../models/userModel.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      fullContent, 
      author, 
      date, 
      category, 
      pinned,
      tags = [] 
    } = req.body;
    
    const createdBy = req.user._id;

    // Required fields validation
    if (!title || !content || !fullContent || !author || !date || !category) {
      return res.status(400).json({ 
        message: "Title, content, fullContent, author, date, and category are required." 
      });
    }

    // Date format validation (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        message: "Date must be in YYYY-MM-DD format." 
      });
    }

    // Category validation
    const validCategories = ['general', 'event', 'urgent', 'community'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: "Invalid category." 
      });
    }

    const imagePath = req.file ? req.file.path : "";

    const announcement = new Announcement({
      title,
      content,
      fullContent,
      author,
      date,
      category,
      pinned: pinned || false,
      image: imagePath,
      tags,
      createdBy
    });

    await announcement.save();

    // Notification logic (updated for new schema)
    try {
      let recipientUserIds = [];
      
      // For urgent announcements, notify all active users
      if (category === 'urgent') {
        const activeUsers = await User.find({ isActive: true }).select('_id');
        recipientUserIds = activeUsers.map(user => user._id);
      } 
      // For community announcements, notify users who opted in
      else if (category === 'community') {
        const communityUsers = await User.find({ 
          notifyCommunity: true,
          isActive: true 
        }).select('_id');
        recipientUserIds = communityUsers.map(user => user._id);
      }

      // Don't notify the creator
      recipientUserIds = recipientUserIds.filter(id => id.toString() !== createdBy.toString());

      if (recipientUserIds.length > 0) {
        await batchCreateNotifications(
          createdBy,
          recipientUserIds,
          'announcement',
          `New ${category.charAt(0).toUpperCase() + category.slice(1)} Announcement`,
          title,
          {
            announcementId: announcement._id,
            category
          }
        );
      }
    } catch (notifError) {
      console.error("Notification error (non-critical):", notifError.message);
    }

    res.status(201).json({
      message: "Announcement created successfully.",
      announcement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error.message);
    
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: "Internal server error" });
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
    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

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
    
    const existingAnnouncement = await Announcement.findById(id);
    if (!existingAnnouncement) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Announcement not found." });
    }

    // Date format validation if date is being updated
    if (updates.date && !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Date must be in YYYY-MM-DD format." });
    }

    // Category validation if category is being updated
    if (updates.category && !['general', 'event', 'urgent', 'community'].includes(updates.category)) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Invalid category." });
    }

    // Update fields
    const allowedUpdates = ['title', 'content', 'fullContent', 'author', 'date', 'category', 'pinned', 'tags'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        existingAnnouncement[field] = updates[field];
      }
    });

    // Handle image update
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
    const { id } = req.params;
    
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    announcement.pinned = !announcement.pinned;
    await announcement.save();

    res.status(200).json({
      message: `Announcement ${announcement.pinned ? 'pinned' : 'unpinned'} successfully.`,
      announcement
    });
  } catch (error) {
    console.error("Error toggling pin status:", error.message);
    res.status(500).json({ error: "Internal server error" });
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