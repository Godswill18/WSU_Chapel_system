import mongooes from 'mongoose';

const calendarSchema = new mongooes.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },

} , { timestamps: true });
const Calendar = mongooes.model('Calendar', calendarSchema);
export default Calendar;