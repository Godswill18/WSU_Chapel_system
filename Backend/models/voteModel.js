import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
  },
  nominees: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      voteCount: {
        type: Number,
        default: 0,
      },
    },
  ],
  voters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  endTime: {
    type: Date,
    required: true,
  },
  resultPublished: {
    type: Boolean,
    default: false,
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default mongoose.model("Vote", voteSchema);
