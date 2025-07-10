// controllers/prayerController.js
import Prayer from '../models/prayerModel.js';
import User from '../models/userModel.js';
import { 
  createUserNotification,
  batchCreateNotifications 
} from '../lib/utils/notificationUtils.js';

// USER submits prayer request
export const submitPrayerRequest = async (req, res) => {
  try {
    const { title, prayerRequest, category } = req.body;
    const submittedBy = req.user._id;
    const user = req.user; // Assuming user object is attached by auth middleware

    if (!title || !prayerRequest || !category ) {
      return res.status(400).json({ message: "Title, request and category are required." });
    }

    const newPrayer = new Prayer({ title, prayerRequest, submittedBy, category });
    await newPrayer.save();

    // NOTIFICATION: Alert admins about new prayer request
    try {
      const admins = await User.find({ role: 'admin', role: 'super admin' }).select('_id');
      if (admins.length > 0) {
        await batchCreateNotifications(
          submittedBy, // The user who submitted the prayer
          admins.map(admin => admin._id), // All admin users
          'prayer_request', // Notification type
          'New Prayer Request Needs Approval', // Title
          `${user.firstName} ${user.lastName} submitted a prayer request: "${title}"`, // Content
          {
            prayerId: newPrayer._id,
            isAdminAlert: true
          }
        ).save();
      }
    } catch (notifError) {
      console.error("Notification error (non-critical):", notifError.message);
    }

    res.status(201).json({ message: "Prayer request submitted.", prayer: newPrayer });
  } catch (error) {
    console.error("submitPrayerRequest error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ADMIN gets all prayer requests (including hidden ones)
export const getAllPrayerRequests = async (req, res) => {
  try {
    const prayers = await Prayer.find().populate('submittedBy', 'firstName lastName email');
    res.status(200).json(prayers);
  } catch (error) {
    console.error("getAllPrayerRequests error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ADMIN approves a prayer request to be displayed publicly
export const approvePrayerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user; // The admin who is approving
    const prayer = await Prayer.findById(id).populate('submittedBy', 'firstName lastName _id');

    if (!prayer) return res.status(404).json({ message: "Prayer request not found." });

    prayer.isDisplay = true;
    await prayer.save();

    // NOTIFICATION: Notify the submitter that their prayer was approved
    if (prayer.submittedBy && prayer.submittedBy._id) {
      try {
        await createUserNotification(
          adminUser._id, // The approving admin
          prayer.submittedBy._id, // The original submitter
          'prayer_request', // Notification type
          'Your Prayer Request Was Approved', // Title
          `Your prayer request "${prayer.title}" has been approved and is now public`, // Content
          {
            prayerId: prayer._id,
            approvedBy: adminUser._id
          }
        );
      } catch (notifError) {
        console.error("Approval notification error:", notifError.message);
      }
    }

    // NOTIFICATION: Optionally notify community about new public prayer
    // This could be enabled based on settings
    try {
      const communityMembers = await User.find({ 
        settings: { receivePrayerNotifications: true },
        _id: { $ne: prayer.submittedBy._id } // Don't notify submitter again
      }).select('_id');
      
      if (communityMembers.length > 0) {
        await batchCreateNotifications(
          null, // System notification
          communityMembers.map(user => user._id),
          'prayer_request',
          'New Community Prayer Request',
          `A new prayer request was shared: "${prayer.title}"`,
          {
            prayerId: prayer._id,
            isCommunityPrayer: true
          }
        );
      }
    } catch (communityNotifError) {
      console.error("Community notification error:", communityNotifError.message);
    }

    res.status(200).json({ message: "Prayer request approved for public display.", prayer });
  } catch (error) {
    console.error("approvePrayerRequest error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// PUBLIC: get all approved/displayed prayer requests
export const getPublicPrayerRequests = async (req, res) => {
  try {
    const prayers = await Prayer.find({ isDisplay: true })
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'firstName lastName');
    res.status(200).json(prayers);
  } catch (error) {
    console.error("getPublicPrayerRequests error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};


export const prayFor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the prayer request
    const prayer = await Prayer.findById(id);
    if (!prayer) {
      return res.status(404).json({ message: "Prayer request not found" });
    }

    // Check if user is already praying
    const isPraying = prayer.isPraying.includes(userId);

    if (isPraying) {
      // Remove prayer
      await Prayer.findByIdAndUpdate(
        id,
        { $pull: { isPraying: userId } },
        { new: true }
      );
      return res.status(200).json({ 
        message: "Prayer removed successfully",
        isPraying: false,
        prayerCount: prayer.isPraying.length - 1
      });
    } else {
      // Add prayer
      const updatedPrayer = await Prayer.findByIdAndUpdate(
        id,
        { $addToSet: { isPraying: userId } }, // Using $addToSet to prevent duplicates
        { new: true }
      );

      // Create notification
      if (prayer.submittedBy.toString() !== userId.toString()) {
        const newNotification = new Notification({
          type: "prayer",
          from: userId,
          to: prayer.submittedBy,
          prayerId: id
        });
        await newNotification.save();
      }

      return res.status(200).json({ 
        message: "Prayer added successfully",
        isPraying: true,
        prayerCount: updatedPrayer.isPraying.length
      });
    }
  } catch (error) {
    console.log("Error in togglePrayFor:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get prayer count for a specific request
export const getPrayerCount = async (req, res) => {
  try {
    const { id } = req.params;
    const prayer = await Prayer.findById(id).select('isPraying');
    
    if (!prayer) {
      return res.status(404).json({ message: "Prayer request not found" });
    }

    res.status(200).json({
      prayerCount: prayer.isPraying.length,
      isPraying: req.user ? prayer.isPraying.includes(req.user._id) : false
    });
  } catch (error) {
    console.log("Error in getPrayerCount:", error.message);
    res.status(500).json({ error: error.message });
  }
};
