import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500 // Short summary for cards
    },
    fullContent: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    // date: {
    //   type: String, // Storing as String in YYYY-MM-DD format
    //   required: true,
    //   match: /^\d{4}-\d{2}-\d{2}$/ // Ensures YYYY-MM-DD format
    // },
    category: {
      type: String,
      required: true,
      enum: ['general', 'event', 'urgent', 'community'],
      default: 'general'
    },
    pinned: {
      type: Boolean,
      default: false
    },
    image: {
      type: String,
      trim: true,
      default: ""
    },
    priority:{
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    // Optional fields that might be useful
    lastUpdatedBy: {
      type: String,
      trim: true
    },
    expiresAt: {
      type: String, // Could also be Date if needed
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    // For future features
    // tags: {
    //   type: [String],
    //   default: []
    // },
    // For analytics
    views: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for better performance
announcementSchema.index({ title: 'text', content: 'text' });
announcementSchema.index({ category: 1 });
announcementSchema.index({ pinned: 1 });
announcementSchema.index({ date: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;