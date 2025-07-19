// utils/voteScheduler.js
// import Vote from "../../models/voteModel.js";
import { scheduleJob } from 'node-schedule';
import Vote from '../../models/voteModel.js';

// Function to process ended votes
export const processEndedVotes = async () => {
  try {
    const now = new Date();
    
    // Find votes that have ended but haven't had results published
    const endedVotes = await Vote.find({
      endTime: { $lte: now },
      resultPublished: false
    }).populate('nominees.user');

    for (const vote of endedVotes) {
      await determineAndSaveWinner(vote);
    }

    console.log(`Processed ${endedVotes.length} ended votes`);
  } catch (error) {
    console.error('Error processing ended votes:', error);
  }
};

// Helper function to determine and save winner
const determineAndSaveWinner = async (vote) => {
  if (!vote.nominees || vote.nominees.length === 0) {
    console.log(`Vote ${vote._id} has no nominees, skipping winner determination`);
    return;
  }

  // Find the nominee with highest votes
  const topNominee = vote.nominees.reduce((max, current) => 
    current.voteCount > max.voteCount ? current : max, 
    vote.nominees[0]
  );

  // Update the vote with winner and mark as published
  vote.winner = topNominee.user._id;
  vote.resultPublished = true;
  
  await vote.save();
  console.log(`Winner determined for vote ${vote._id}: ${topNominee.user._id}`);
};

// Schedule the job to run every hour
export const startVoteProcessingScheduler = () => {
  // Run immediately on startup
  processEndedVotes();
  
  // Then run every hour
  scheduleJob('0 * * * *', processEndedVotes);
  console.log('Vote processing scheduler started');
  
};

// In your voteScheduler.js
export const isSchedulerRunning = () => {
    return !!global.voteSchedulerJob;
};