import mongoose from 'mongoose';

const calendarSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String  // or Date if you want to store as Date object
    },
    location: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['all', 'service', 'meeting', 'event', 'birthday'], // example types
        default: 'event'
    },
    description: {
        type: String,
        required: true,
    },
    organizer: {
        type: String,
        required: true
    },
    attendees: {
        type: String,
        // default: 5000
        // type: [String], // array of strings
        // default: []
    }

}, { timestamps: true });

const Calendar = mongoose.model('Calendar', calendarSchema);
export default Calendar;