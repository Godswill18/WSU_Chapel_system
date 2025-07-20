import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
    },
    lastName:{
        type: String,
        required: true,
    },
    departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    default: []
    }],
    position:{
        type: String,
        required: false,
    },
    courseOfStudy:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber:{
        type: String,
        required: true,
        unique: true,

    },
    dateOfBirth:{
        type: Date,
        required: true,
    },
    profileImg:{
        type: String,
        default:""
    },
    address: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    emergencyContactName: {
        type: String,
        default: ""
    },
    emergencyContact: {
        type: String,
        default: ""
    },
    emergencyRelationship: {
        type: String,
        default: ""
    },
    password:{
        type: String,
        required: true,
    },
    isActivated:{
        type: Boolean,
        default: false,
    },
}, {timestamps: true});

const User = mongoose.model('User', userSchema);

export default User;