import express from 'express';
import { createNominees, 
    voteUser,
    //  getNominees,
    //   getVotes,
    //    publishResult,
        // editNominees,
         deleteVoteCategory,
          getUserNominees,
           getWinners,
            getVoteStatus,
            //  deleteVotingCategory, 
             createVotingCategory, 
             updateVotingCategory,
              getAllVotingCategoriesAdmin,
               publishVotingResults, 
               getVotingResultsAdmin,
                getAllWinnersAdmin } from '../../controllers/votesControllers.js';
import { protectRoute, protectAdminRoute } from '../../middleware/protectRoute.js';
const router = express.Router();

// Route to create nominees
// router.post('/createNominees', protectAdminRoute, createNominees);

// router.get('/getNominees', protectAdminRoute, getNominees);

// router.put('/updateNominees/:voteId', protectAdminRoute, editNominees);


// Route to vote for a nominee
router.post('/voteUser', protectRoute, voteUser);

// Route to get winners
router.get('/winners', protectRoute, getWinners);
// router.get('/winners-admin', protectAdminRoute, getWinners);

// Route to get all nominees
router.get('/current', protectRoute, getUserNominees);

// Route to get vote status
router.get('/:voteId/status',protectRoute, getVoteStatus);

// Route to get all votes
// router.get('/getVotes', protectAdminRoute, getVotes);

// router.post('/publish/:voteId', protectAdminRoute, publishResult);
// router.delete('/admin/delete/:voteId', protectAdminRoute, deleteVotingCategory);

// In your voteRoutes.js
router.post('/admin/create', protectAdminRoute, createVotingCategory);
router.put('/admin/update/:voteId', protectAdminRoute, updateVotingCategory);
router.delete('/deleteCategory/:voteId', protectAdminRoute, deleteVoteCategory);
router.get('/admin/all', protectAdminRoute, getAllVotingCategoriesAdmin);
router.post('/admin/publish/:voteId', protectAdminRoute, publishVotingResults);
router.get('/admin/results/:voteId', protectAdminRoute, getVotingResultsAdmin);
router.get('/admin/winners', protectAdminRoute, getAllWinnersAdmin);


export default router;
