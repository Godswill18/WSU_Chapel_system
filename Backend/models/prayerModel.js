import mongoose from 'mongoose';

const prayerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  prayerRequest: {
    type: String,
    required: true,
  },
  
  category: {
    type: String,
    required: true,
  },

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isPraying: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
    },
  ],

  isDisplay: {
    type: Boolean,
    default: false, // Only visible to admin until published
  },

}, { timestamps: true });

const Prayer = mongoose.model("Prayer", prayerSchema);
export default Prayer;
