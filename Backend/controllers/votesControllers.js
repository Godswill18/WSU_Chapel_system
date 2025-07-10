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
    const votes = await Vote.find({
      createdAt: { $lte: new Date() },
      endTime: { $gte: new Date() }
    })
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

    // Prevent early publishing
    if (new Date() < new Date(vote.endTime)) {
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

    await vote.save();

    res.status(200).json({
      message: "Result published successfully.",
      winner: {
        _id: topNominee.user._id,
        name: `${topNominee.user.firstName} ${topNominee.user.lastName}`,
        profileImg: topNominee.user.profileImg,
        votes: topNominee.voteCount,
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

