import User from "../../models/userModel.js";
import Admin from "../../models/adminModel.js";
import Calendar from "../../models/calendarModel.js";
import Announcement from "../../models/announcementModel.js";
import Prayer from "../../models/prayerModel.js";

export const getAdminDashboardStats = async (req, res) => {
  try {
    // Count all users
    const totalUsers = await User.countDocuments();
    
    // Count active events (where end date is in the future)
    const activeEvents = await Calendar.countDocuments({ 
      endDate: { $gte: new Date() } 
    });
    
    // Count all announcements
    const totalAnnouncements = await Announcement.countDocuments();
    
    // Count all prayer points
    const totalPrayerPoints = await Prayer.countDocuments();
    
    // Get recent activity (last 5 activities from any collection)
    const recentUserActivity = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt')
      .lean();
    
    const recentEventActivity = await Calendar.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt updatedAt')
      .lean();
    
    const recentActivities = [
      ...recentUserActivity.map(user => ({
        action: 'New user registered',
        user: user.firstName + ' ' + user.lastName,
        time: user.createdAt
      })),
      ...recentEventActivity.map(event => ({
        action: event.updatedAt > event.createdAt ? 'Event updated' : 'Event created',
        user: 'System', // or get actual updater if you track that
        time: event.updatedAt > event.createdAt ? event.updatedAt : event.createdAt
      }))
    ].sort((a, b) => b.time - a.time).slice(0, 5);

    
    res.json({
      stats: {
        totalUsers,
        activeEvents,
        totalAnnouncements,
        totalPrayerPoints
      },
      recentActivities: recentActivities.map(activity => ({
        ...activity,
        time: formatTimeDifference(activity.time)
      }))
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
}

// Helper function to format time as "X minutes/hours/days ago"
function formatTimeDifference(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
  
  return 'Just now';
}