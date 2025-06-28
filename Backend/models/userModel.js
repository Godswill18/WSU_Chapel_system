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
    department:{
        type: String,
        required: true,
    },
    position:{
        type: String,
        required: true,
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