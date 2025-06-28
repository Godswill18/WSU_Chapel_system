import express from 'express';
import { createNominees, voteUser, getNominees, getVotes, publishResult, editNominees, deleteVoteCategory } from '../../controllers/votesControllers.js';
import { protectRoute, protectAdminRoute } from '../../middleware/protectRoute.js';
const router = express.Router();

// Route to create nominees
router.post('/createNominees', protectAdminRoute, createNominees);

router.get('/getNominees', protectAdminRoute, getNominees);

router.put('/updateNominees/:voteId', protectAdminRoute, editNominees);

router.delete('/deleteCategory/:voteId', protectAdminRoute, deleteVoteCategory)

// Route to vote for a nominee
router.post('/voteUser', protectRoute, voteUser);

// Route to get all nominees
router.get('/getNominees/:voteId', protectRoute, getNominees);

// Route to get all votes
router.get('/getVotes', protectAdminRoute, getVotes);

router.post('/publish/:voteId', protectAdminRoute, publishResult);

export default router;
