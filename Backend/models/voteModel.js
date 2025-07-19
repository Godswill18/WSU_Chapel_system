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
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resultPublished: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model("Vote", voteSchema);


// models/VoteModel.js
// import mongoose from "mongoose";

// const voteSchema = new mongoose.Schema({
//   category: {
//     type: String,
//     required: true,
//   },
//   nominees: [{
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     voteCount: {
//       type: Number,
//       default: 0,
//     },
//     description: String,
//   }],
//   voters: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   }],
//   startTime: {
//     type: Date,
//     default: Date.now,
//   },
//   endTime: {
//     type: Date,
//     required: true,
//   },
//   winner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
//   resultPublished: {
//     type: Boolean,
//     default: false,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'active', 'ended', 'results_published'],
//     default: 'pending',
//   }
// }, { 
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true } 
// });

// // Add virtual for total votes
// voteSchema.virtual('totalVotes').get(function() {
//   return this.voters.length;
// });

// // Add pre-save hook to update status
// voteSchema.pre('save', function(next) {
//   const now = new Date();
  
//   if (this.isNew) {
//     this.status = this.startTime > now ? 'pending' : 'active';
//   } else {
//     if (this.endTime <= now && this.status !== 'ended' && this.status !== 'results_published') {
//       this.status = 'ended';
//     }
//     if (this.resultPublished && this.status !== 'results_published') {
//       this.status = 'results_published';
//     }
//   }
  
//   next();
// });

// export default mongoose.model("Vote", voteSchema);