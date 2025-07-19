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

// Add a virtual property for the primary leader
departmentSchema.virtual('leader').get(function() {
  return this.leads.length > 0 ? this.leads[0] : null;
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;