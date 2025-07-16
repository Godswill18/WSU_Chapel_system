import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './DB/connectMongoDB.js';
import corsOptions from './config/corsOptions.js';
import authRoutes from './routes/user_Routes/authRoutes.js';
import userRoutes from './routes/user_Routes/userRoutes.js'
import announcementRoutes from './routes/AdminRoutes/announcementRoutes.js';
import adminRoutes from './routes/AdminRoutes/adminRoutes.js';
import calendarRoutes from './routes/AdminRoutes/chapelCalenderRoutes.js';
import departmentRoutes from './routes/AdminRoutes/departmentRoutes.js';
import votesRoutes from './routes/user_Routes/votesRoutes.js';
import prayerRoutes from './routes/user_Routes/prayerRoutes.js';
import dashboardRoute from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/user_Routes/notificationRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './middleware/logEvents.js';
import adminDashboardRoute from './routes/AdminRoutes/adminDashboardRoute.js';


dotenv.config();


connectDB(); // Connect to MongoDB using the connectDB function

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json({limit:"5mb"})); // Middleware to parse JSON requests || to parse incoming JSON data  [ Limit shouldn't be too high, as it can lead to performance issues or security vulnerabilities DOS ]
app.use(express.urlencoded({ extended: false })); // Middleware to parse URL-encoded data || to parse form data(urlencoded)

// Middleware
// pass cookies through here 
app.use(cookieParser());
// app.use(errorHandler); // Error handling middleware

// Logger middleware
app.use(logger);

// Cross Origin Resource Sharing
app.use(cors({ ...corsOptions, credentials: true }));
app.use('/uploads', cors(), express.static('uploads'));


// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/prayer", prayerRoutes);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/notifications", notificationRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes); 
app.use("/api/calendar", calendarRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/votes", votesRoutes);
app.use("/api/admin", adminDashboardRoute);



mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB...');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}....`));
});