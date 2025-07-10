import User from '../models/userModel.js';
import Prayer from '../models/prayerModel.js';
// import Event from '../models/eventModel.js';
import Calendar from '../models/calendarModel.js';
import Vote from '../models/VoteModel.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Active members (Assume role === 'worker' and status === 'active')
    const activeMembersCount = await User.countDocuments({ isActivated: true });

    // 2. Total prayer requests
    const prayerRequestCount = await Prayer.countDocuments();

    // 3. Upcoming events (future dates only)
    const today = new Date();
    const upcomingEventsCount = await Calendar.countDocuments({ date: { $gte: today } });

    // 4. This week's votes
    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday

    const weeklyVoteCount = await Vote.countDocuments({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek }
    });

    return res.status(200).json({
      success: true,
      data: {
        activeMembers: activeMembersCount,
        prayerRequests: prayerRequestCount,
        upcomingEvents: upcomingEventsCount,
        weeklyVotes: weeklyVoteCount
      }
    });
  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};
