import Notification from '../../models/notificationModel.js';
import User from '../../models/userModel.js'

/**
 * Creates a single user-to-user notification
 * @param {string} fromUserId - ID of user triggering the notification
 * @param {string} toUserId - ID of recipient user
 * @param {string} type - Notification type (must match your enum)
 * @param {string} title - Short title for the notification
 * @param {string} content - Detailed content/message
 * @param {object} metadata - Additional data to store with notification
 * @returns {Promise<object>} Created notification
 */
export const createUserNotification = async (fromUserId, toUserId, type, title, content, metadata = {}) => {
    try {
        // Validate users exist
        const [fromUser, toUser] = await Promise.all([
            User.findById(fromUserId).select('_id'),
            User.findById(toUserId).select('_id')
        ]);

        if (!fromUser || !toUser) {
            throw new Error('Invalid user IDs provided');
        }

        const notification = await Notification.create({
            from: fromUserId,
            to: toUserId,
            type,
            title,
            content,
            metadata,
            isSystemNotification: false,
            read: false
        });

        return notification;
    } catch (error) {
        console.error(`Error creating user notification (${type}):`, error);
        throw error; // Re-throw for the caller to handle
    }
};

/**
 * Creates a system-generated notification
 * @param {string} userId - ID of recipient user
 * @param {string} type - Notification type
 * @param {string} title - Short title
 * @param {string} content - Detailed content
 * @param {object} metadata - Additional data
 * @returns {Promise<object>} Created notification
 */
export const createSystemNotification = async (userId, type, title, content, metadata = {}) => {
    try {
        const user = await User.findById(userId).select('_id');
        if (!user) {
            throw new Error('Invalid user ID provided');
        }

        const notification = await Notification.create({
            to: userId,
            type,
            title,
            content,
            metadata,
            isSystemNotification: true,
            read: false
        });

        return notification;
    } catch (error) {
        console.error(`Error creating system notification (${type}):`, error);
        throw error;
    }
};

/**
 * Creates notifications for multiple users in a single operation
 * @param {string|null} fromUserId - Null for system notifications
 * @param {string[]} toUserIds - Array of recipient IDs
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} content - Notification content
 * @param {object} metadata - Additional data
 * @returns {Promise<number>} Count of created notifications
 */
export const batchCreateNotifications = async (fromUserId, toUserIds, type, title, content, metadata = {}) => {
    try {
        // Validate at least some users exist
        const validUsers = await User.find({ 
            _id: { $in: toUserIds } 
        }).select('_id');

        if (validUsers.length === 0) {
            console.warn('No valid users found for batch notification');
            return [];
        }

        const notifications = validUsers.map(userId => ({
            from: fromUserId,
            to: userId,
            type,
            title,
            content,
            metadata,
            isSystemNotification: fromUserId === null,
            read: false,
            createdAt: new Date()
        }));

        const result = await Notification.insertMany(notifications);
        return result.length;
    } catch (error) {
        console.error(`Error in batchCreateNotifications (${type}):`, error);
        throw error;
    }
};

/**
 * Marks notifications as read
 * @param {string} userId - ID of user whose notifications to mark
 * @param {string[]} notificationIds - Specific IDs to mark (empty for all)
 * @returns {Promise<number>} Count of updated notifications
 */
export const markNotificationsAsRead = async (userId, notificationIds = []) => {
    try {
        const filter = { to: userId };
        if (notificationIds.length > 0) {
            filter._id = { $in: notificationIds };
        }

        const result = await Notification.updateMany(
            filter,
            { $set: { read: true } }
        );

        return result.modifiedCount;
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        throw error;
    }
};

/**
 * Gets unread notification count for a user
 * @param {string} userId 
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
    try {
        return await Notification.countDocuments({
            to: userId,
            read: false
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        throw error;
    }
};

/**
 * Deletes notifications by filter
 * @param {object} filter - MongoDB filter
 * @returns {Promise<number>} Count of deleted notifications
 */
export const deleteNotifications = async (filter) => {
    try {
        const result = await Notification.deleteMany(filter);
        return result.deletedCount;
    } catch (error) {
        console.error('Error deleting notifications:', error);
        throw error;
    }
};