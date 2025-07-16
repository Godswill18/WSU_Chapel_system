import Vote from "../models/VoteModel.js";
import User from "../models/userModel.js";


// For Creating nominees for a vote || Admins can create nominees
export const createNominees = async (req, res) => {
  try {
    const { category, nomineeIds, endTime } = req.body;

    if (!category || !nomineeIds || !endTime) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const validUsers = await User.find({ _id: { $in: nomineeIds } });
    if (validUsers.length !== nomineeIds.length) {
      return res.status(400).json({ message: "One or more nominee IDs are invalid." });
    }

    const nominees = validUsers.map(user => ({
      user: user._id,
      voteCount: 0,
    }));

    const vote = new Vote({
      category,
      nominees,
      endTime,
    });

    await vote.save();
    res.status(201).json({ message: "Nominees created successfully.", vote });
  } catch (error) {
    console.error("createNominees error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// For editing nominees for a vote || Admins can edit nominees
export const editNominees = async (req, res) => {
  try {
    const { voteId } = req.params;
    const { nomineeIds } = req.body;

    if (!nomineeIds || nomineeIds.length === 0) {
      return res.status(400).json({ message: "Nominee IDs are required." });
    }

    const vote = await Vote.findById(voteId);
    if (!vote) return res.status(404).json({ message: "Vote not found." });

    const validUsers = await User.find({ _id: { $in: nomineeIds } });
    if (validUsers.length !== nomineeIds.length) {
      return res.status(400).json({ message: "One or more nominee IDs are invalid." });
    }

    vote.nominees = validUsers.map(user => ({
      user: user._id,
      voteCount: 0,
    }));

    await vote.save();
    res.status(200).json({ message: "Nominees updated successfully.", vote });
  } catch (error) {
    console.error("editNominees error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};


// function for votting users votes
export const voteUser = async (req, res) => {
  try {
    const { voteId, nomineeId } = req.body;
    const userId = req.user._id;

    // Find and update the vote in one operation to avoid race conditions
    const vote = await Vote.findOneAndUpdate(
      {
        _id: voteId,
        createdAt: { $lte: new Date() },
        endTime: { $gte: new Date() },
        voters: { $ne: userId }
      },
      {
        $inc: { 'nominees.$[elem].voteCount': 1 },
        $push: { voters: userId }
      },
      {
        arrayFilters: [{ 'elem._id': nomineeId }],
        new: true
      }
    );

    if (!vote) {
      // Check why the vote wasn't found
      const existingVote = await Vote.findById(voteId);
      if (!existingVote) {
        return res.status(404).json({ message: "Vote not found." });
      }
      if (existingVote.voters.includes(userId)) {
        return res.status(403).json({ message: "You have already voted." });
      }
      const now = new Date();
      if (now < existingVote.createdAt || now > existingVote.endTime) {
        return res.status(403).json({ message: "Voting is not active." });
      }
      return res.status(404).json({ message: "Nominee not found in this vote." });
    }

    res.status(200).json({ message: "Vote cast successfully.", vote });
  } catch (error) {
    console.error("voteUser error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Function to get all nominees for a specific vote
// This will return the vote category, start time, end time, and nominees with their names
export const getNominees = async (req, res) => {
    const { voteId } = req.params;
  try {

    const vote = await Vote.findById(voteId).populate("nominees.user", "firstName lastName profileImg");
    if (!vote) return res.status(404).json({ message: "Vote not found." });

    res.status(200).json({
      category: vote.category,
      startTime: vote.startTime,
      endTime: vote.endTime,
      nominees: vote.nominees.map(n => ({
        _id: n.user._id,
        name: `${n.user.firstName} ${n.user.lastName}`,
        profileImg: n.user.profileImg,
      }))
    });
  } catch (error) {
    console.error("getNominees error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// getNominees controller
export const getUserNominees = async (req, res) => {
 try {
    const userId = req.user?._id;
    
    // Fetch votes with populated nominees and user details
    const votes = await Vote.find()
    .populate({
      path: 'nominees.user',
      select: 'firstName lastName profileImg position department'
    })
    .populate({
      path: 'voters',
      select: '_id'
    })
    .lean();

    // Add userHasVoted status for each vote
    const votesWithStatus = votes.map(vote => ({
      ...vote,
      userHasVoted: userId ? vote.voters.some(voter => voter._id.equals(userId)) : false
    }));

    res.status(200).json({ votes: votesWithStatus });
  } catch (error) {
    console.error("getCurrentVotes error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};



export const getCurrentVote = async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();
    const vote = await Vote.findOne({
      createdAt: { $lte: now },
      endTime: { $gte: now }
    }).populate("nominees.user", "firstName lastName profileImg department position description");

    if (!vote) return res.status(404).json({ message: "No active voting at this time." });

    const hasVoted = vote.voters.includes(userId);

    res.status(200).json({
      _id: vote._id,
      voteCategory: vote.category,
      createdAt: vote.createdAt,
      endTime: vote.endTime,
      userVote: hasVoted ? vote.nominees.find(n => n.voters?.includes(userId))?.user?._id : null,
      nominees: vote.nominees.map(n => ({
        _id: n.user._id,
        name: `${n.user.firstName} ${n.user.lastName}`,
        profileImg: n.user.profileImg,
        department: n.user.department,
        position: n.user.position,
        description: n.user.description,
      })),
    });
  } catch (error) {
    console.error("getCurrentVote error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};



// Function to get all votes with nominees and their vote counts || Admins can see all votes
// This will return the vote category, nominees with their names and vote counts, total votes,
export const getVotes = async (req, res) => {
  try {
    const votes = await Vote.find();

    const now = new Date();
    const compiledVotes = votes.map(vote => {
      const isEnded = now > vote.endTime;

      let winner = null;
      if (isEnded) {
        const topNominee = vote.nominees.reduce((max, current) => current.voteCount > max.voteCount ? current : max, vote.nominees[0]);
        winner = topNominee.user;
      }

      return {
        _id: vote._id,
        category: vote.category,
        nominees: vote.nominees.map(n => ({
          name: `${n.user.firstName} ${n.user.lastName}`,
          votes: n.voteCount
        })),
        totalVotes: vote.voters.length,
        resultPublished: vote.resultPublished,
        voteEnded: isEnded,
        winner: winner ? `${winner.firstName} ${winner.lastName}` : null
      };
    });

    res.status(200).json(compiledVotes);
  } catch (error) {
    console.error("getVotes error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Function to publish the result of a vote
// This will check if the voting period has ended and then determine the winner based on vote counts
export const publishResult = async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findById(voteId)
      .populate("nominees.user", "firstName lastName profileImg")
      .select("-nominees.user.password");

    if (!vote) return res.status(404).json({ message: "Vote not found." });

    // If voting hasn't ended, check if admin is forcing publication
    const now = new Date();
    if (now < vote.endTime && !req.user.isAdmin) {
      return res.status(403).json({ message: "Voting is still in progress." });
    }

    // Prevent re-publishing
    if (vote.resultPublished) {
      return res.status(400).json({ message: "Result has already been published." });
    }

    if (vote.nominees.length === 0) {
      return res.status(400).json({ message: "No nominees to calculate results." });
    }

    // Get top nominee
    const topNominee = vote.nominees.reduce((max, current) =>
      current.voteCount > max.voteCount ? current : max, vote.nominees[0]
    );

    vote.resultPublished = true;
    vote.winner = topNominee.user._id;
    vote.status = 'results_published';

    await vote.save();

    res.status(200).json({
      message: "Result published successfully.",
      winner: {
        _id: topNominee.user._id,
        name: `${topNominee.user.firstName} ${topNominee.user.lastName}`,
        profileImg: topNominee.user.profileImg,
        votes: topNominee.voteCount,
        percentage: calculatePercentage(vote, topNominee.user._id)
      }
    });

  } catch (error) {
    console.error("publishResult error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const deleteVoteCategory = async (req, res) => {
    const {voteId} = req.params;

    try{
        const voteCategory = await Vote.findByIdAndDelete(voteId);

        if(!voteCategory){
            return res.status(400).json({message: "Vote Category was not found"});
        }

        res.status(200).json({message: "Vote category was deleted successfully "})

    }catch(error){

    }
}

export const getVoteStatus = async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findById(voteId)
      .populate('winner', 'firstName lastName profileImg position department')
      .populate('nominees.user', 'firstName lastName profileImg');

    if (!vote) {
      return res.status(404).json({ message: "Vote not found." });
    }

    const now = new Date();
    const response = {
      _id: vote._id,
      category: vote.category,
      status: vote.status,
      endTime: vote.endTime,
      hasEnded: now > vote.endTime,
      resultPublished: vote.resultPublished,
      totalVotes: vote.voters.length,
    };

    if (vote.resultPublished && vote.winner) {
      response.winner = {
        _id: vote.winner._id,
        name: `${vote.winner.firstName} ${vote.winner.lastName}`,
        profileImg: vote.winner.profileImg,
        position: vote.winner.position,
        department: vote.winner.department,
        voteCount: vote.nominees.find(n => n.user._id.equals(vote.winner._id))?.voteCount || 0,
        percentage: calculatePercentage(vote, vote.winner._id)
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("getVoteStatus error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getWinners = async (req, res) => {
  try {
    // Only get votes that have ended and results are published
    const votes = await Vote.find({
      endTime: { $lt: new Date() },
      resultPublished: true
    }).populate({
      path: 'nominees.user winner',
      select: 'firstName lastName profileImg position department'
    });

    const winners = {};
    
    for (const vote of votes) {
      // If winner is already set in the vote document, use that
      if (vote.winner) {
        winners[vote._id] = {
          user: vote.winner,
          voteCount: vote.nominees.find(n => n.user._id.equals(vote.winner._id))?.voteCount || 0,
          percentage: calculatePercentage(vote, vote.winner._id),
          category: vote.category,
          description: vote.nominees.find(n => n.user._id.equals(vote.winner._id))?.description || ''
        };
        continue;
      }

      // Otherwise calculate winner from nominees
      if (vote.nominees.length === 0) continue;
      
      const winner = vote.nominees.reduce((prev, current) => 
        (prev.voteCount > current.voteCount) ? prev : current
      );
      
      winners[vote._id] = {
        user: winner.user,
        voteCount: winner.voteCount,
        percentage: calculatePercentage(vote, winner.user._id),
        category: vote.category,
        description: winner.description || ''
      };
    }

   res.status(200).json({
  success: true,
  winners: Object.entries(winners).map(([voteId, winnerData]) => ({
    voteId,
    user: winnerData.user,
    voteCount: winnerData.voteCount,
    percentage: winnerData.percentage,
    category: winnerData.category
  }))
});
  } catch (error) {
    console.error("Error getting winners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get winners",
      error: error.message
    });
  }
};

// Helper function to calculate percentage
function calculatePercentage(vote, winnerId) {
  const totalVotes = vote.nominees.reduce((sum, nominee) => sum + nominee.voteCount, 0);
  const winnerVotes = vote.nominees.find(n => n.user._id.equals(winnerId))?.voteCount || 0;
  return totalVotes > 0 ? Math.round((winnerVotes / totalVotes) * 100) : 0;
}


// In your votesControllers.js

// Admin-only controller functions
export const createVotingCategory = async (req, res) => {
  try {
    const { category, nominees, endTime } = req.body;

    // Validate input
    if (!category || !nominees || !endTime) {
      return res.status(400).json({ message: "Category, nominee IDs, and end time are required." });
    }

    // Check if end time is in the future
    if (new Date(endTime) <= new Date()) {
      return res.status(400).json({ message: "End time must be in the future." });
    }

    // Verify all nominee IDs are valid users
    const validUsers = await User.find({ _id: { $in: nominees } });
    if (validUsers.length !== nominees.length) {
      return res.status(400).json({ message: "One or more nominee IDs are invalid." });
    }

    // Create the vote
    const vote = new Vote({
      category,
      nominees: validUsers.map(user => ({ user: user._id, voteCount: 0 })),
      endTime,
      // status: 'pending'
    });

    await vote.save();

    res.status(201).json({
      message: "Voting category created successfully.",
      vote: await Vote.populate(vote, { path: 'nominees.user', select: 'firstName lastName profileImg' })
    });
  } catch (error) {
    console.error("createVotingCategory error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const updateVotingCategory = async (req, res) => {
  try {
    const { voteId } = req.params;
    const { category, nominees, endTime } = req.body;

    const vote = await Vote.findById(voteId).populate('nominees.user', 'firstName lastName profileImg');
    if (!vote) return res.status(404).json({ message: "Voting category not found." });

    // Allow update until voting ends
    if (new Date(vote.endTime) < new Date()) {
      return res.status(400).json({ message: "Cannot update a voting category that has ended." });
    }

    if (category) vote.category = category;
    if (endTime) {
      if (new Date(endTime) <= new Date()) {
        return res.status(400).json({ message: "End time must be in the future." });
      }
      vote.endTime = endTime;
    }

    if (nominees?.length) {
      const validUsers = await User.find({ _id: { $in: nominees } });
      if (validUsers.length !== nominees.length) {
        return res.status(400).json({ message: "One or more nominee IDs are invalid." });
      }
      vote.nominees = validUsers.map(user => ({ user: user._id, voteCount: 0 }));
    }

    await vote.save();
    res.status(200).json({
      message: "Voting category updated successfully.",
      vote
    });
  } catch (error) {
    console.error("updateVotingCategory error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};


export const deleteVotingCategory = async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findById(voteId);
    if (!vote) {
      return res.status(404).json({ message: "Voting category not found." });
    }

    // Only allow deletion if voting hasn't started
    if (vote.status !== 'pending') {
      return res.status(400).json({ message: "Cannot delete a voting category that has already started." });
    }

    await Vote.findByIdAndDelete(voteId);

    res.status(200).json({ message: "Voting category deleted successfully." });
  } catch (error) {
    console.error("deleteVotingCategory error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getAllVotingCategoriesAdmin = async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate('nominees.user', 'firstName lastName profileImg')
      .populate('winner', 'firstName lastName profileImg')
      .sort({ createdAt: -1 });

    const now = new Date();
    const votesWithCountdown = votes.map(vote => {
      const timeRemaining = Math.max(0, new Date(vote.endTime) - now);
      
      return {
        ...vote.toObject(),
        countdown: {
          days: Math.floor(timeRemaining / (1000 * 60 * 60 * 24)),
          hours: Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((timeRemaining % (1000 * 60)) / 1000),
          hasEnded: timeRemaining <= 0
        },
        totalVotes: vote.voters.length,
        status: vote.status || (timeRemaining <= 0 ? 'ended' : 'active')
      };
    });

    res.status(200).json(votesWithCountdown);
  } catch (error) {
    console.error("getAllVotingCategoriesAdmin error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const publishVotingResults = async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findById(voteId)
      .populate('nominees.user', 'firstName lastName profileImg position department');

    if (!vote) {
      return res.status(404).json({ message: "Voting category not found." });
    }

    // Check if voting has ended
    if (new Date(vote.endTime) > new Date() && !req.user.isSuperAdmin) {
      return res.status(400).json({ message: "Cannot publish results before voting has ended." });
    }

    // Check if results are already published
    if (vote.resultPublished) {
      return res.status(400).json({ message: "Results have already been published." });
    }

    // Determine winner
    if (vote.nominees.length === 0) {
      return res.status(400).json({ message: "No nominees in this voting category." });
    }

    const winner = vote.nominees.reduce((prev, current) => 
      (prev.voteCount > current.voteCount) ? prev : current
    );

    // Update vote with winner and publish status
    vote.winner = winner.user._id;
    vote.resultPublished = true;
    vote.status = 'results_published';
    await vote.save();

    res.status(200).json({
      message: "Voting results published successfully.",
      winner: {
        _id: winner.user._id,
        name: `${winner.user.firstName} ${winner.user.lastName}`,
        profileImg: winner.user.profileImg,
        position: winner.user.position,
        department: winner.user.department,
        votes: winner.voteCount,
        percentage: calculatePercentage(vote, winner.user._id)
      }
    });
  } catch (error) {
    console.error("publishVotingResults error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getVotingResultsAdmin = async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findById(voteId)
      .populate('nominees.user', 'firstName lastName profileImg position department')
      .populate('winner', 'firstName lastName profileImg');

    if (!vote) {
      return res.status(404).json({ message: "Voting category not found." });
    }

    const totalVotes = vote.voters.length;
    const now = new Date();
    const hasEnded = new Date(vote.endTime) <= now;

    const results = {
      _id: vote._id,
      category: vote.category,
      status: vote.status || (hasEnded ? 'ended' : 'active'),
      endTime: vote.endTime,
      hasEnded,
      resultPublished: vote.resultPublished,
      totalVotes,
      nominees: vote.nominees.map(nominee => ({
        user: nominee.user,
        votes: nominee.voteCount,
        percentage: totalVotes > 0 ? Math.round((nominee.voteCount / totalVotes) * 100) : 0
      })),
      winner: vote.winner ? {
        _id: vote.winner._id,
        name: `${vote.winner.firstName} ${vote.winner.lastName}`,
        profileImg: vote.winner.profileImg,
        votes: vote.nominees.find(n => n.user._id.equals(vote.winner._id))?.voteCount || 0,
        percentage: calculatePercentage(vote, vote.winner._id)
      } : null
    };

    res.status(200).json(results);
  } catch (error) {
    console.error("getVotingResultsAdmin error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getAllWinnersAdmin = async (req, res) => {
  try {
    const votes = await Vote.find({ resultPublished: true })
      .populate('nominees.user');

    const winners = votes.map(vote => {
      // Find nominee with highest voteCount
      const topNominee = vote.nominees.reduce((max, nominee) => {
        return nominee.voteCount > max.voteCount ? nominee : max;
      }, vote.nominees[0]);

      // Calculate percentage
      const totalVotes = vote.nominees.reduce((sum, n) => sum + n.voteCount, 0);
      const percentage = totalVotes > 0 
        ? ((topNominee.voteCount / totalVotes) * 100).toFixed(2)
        : 0;

      return {
        voteId: vote._id,
        category: vote.category,
        user: {
          _id: topNominee.user._id,
          firstName: topNominee.user.firstName,
          lastName: topNominee.user.lastName,
          profileImg: topNominee.user.profileImg,
          position: topNominee.user.position,
          department: topNominee.user.department
        },
        voteCount: topNominee.voteCount,
        percentage,
        totalVotes
      };
    });

    res.status(200).json(winners);
  } catch (error) {
    console.error('getAllWinnersAdmin error:', error);
    res.status(500).json({ message: 'Failed to fetch winners' });
  }
};


