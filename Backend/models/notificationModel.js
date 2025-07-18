import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    // For system notifications, this can be null
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'prayer_request', // User-generated
            'vote',           // User-generated
            'announcement',   // System-generated
            'birthday',       // System-generated
            'system_alert',   // System-generated
            'event_reminder', // System-generated
            // 'content_update', // System-generated
            // 'achievement'     // System-generated
        ]
    },
    read: {
        type: Boolean,
        default: false
    },
    // Additional metadata for the notification
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // For system notifications
    isSystemNotification: {
        type: Boolean,
        default: false
    },
    // Notification title and content
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // Optional link for the notification
    // actionLink: {
    //     type: String,
    //     required: false
    // },
    // Priority level (low, medium, high)
      createdAt: {
    type: Date,
    default: Date.now
  },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ to: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;