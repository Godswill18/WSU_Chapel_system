// models/departmentModel.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: false,
  },
  color: {
    type: String,
    required: true
  },
  icon: {
    type: String,
  },
  leads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: [],
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: [],
  }]
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
export default Department;