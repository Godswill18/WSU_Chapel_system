import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
    },
    lastName:{
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
    profileImg:{
        type: String,
        default:""
    },
    password:{
        type: String,
        required: true,
    },
    account_Type:{
        type: String,
        enum: ["super_admin", "admin"],
        required: true,
    },
}, {timestamps: true});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;