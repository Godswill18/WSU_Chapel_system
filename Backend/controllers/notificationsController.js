import Notification from '../models/notificationModel.js';

/**
 * Get all notifications for a user
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const notifications = await Notification.find({ to: userId })
      .sort({ createdAt: -1 })
      .populate('from', 'firstName lastName avatar')
      .limit(50);

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    await Notification.updateMany(
      { _id: { $in: notificationIds }, to: userId },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete multiple notifications
 */
export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { notificationIds } = req.body;

        if (notificationIds && notificationIds.length > 0) {
            // Delete specific notifications
            await Notification.deleteMany({
                _id: { $in: notificationIds },
                to: userId
            });
        } else {
            // Delete all notifications for user
            await Notification.deleteMany({ to: userId });
        }

        res.status(200).json({
            success: true,
            message: 'Notifications deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting notifications:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Delete a single notification
 */
export const deleteOneNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            to: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found or not authorized'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting notification:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

/**
 * Create a new notification (for internal use)
 */
export const createNotification = async (data) => {
    try {
        const notification = new Notification(data);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const count = await Notification.countDocuments({
            to: userId,
            read: false
        });

        res.status(200).json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};