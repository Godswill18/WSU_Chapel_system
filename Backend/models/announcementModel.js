import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      required: true,
      enum: ["general", "departmental", "course"],
    },

    department: {
      type: String,
      // required: function () {
      //   return this.type === "departmental";
      // },
      // enum: ['choir', 'instrumentalist','ushering', 'sanctuary', 'decoration','evangelism', 'technical','sunday school','utility', 'drama']
    },

    // course: {
    //   type: String,
    //   required: function () {
    //     return this.type === "course";
    //   },
    // },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
