import express from 'express';
import { createDepartment, getAllDepartments, assignLeader, getDepartmentById, updateDepartment, deleteDepartment, joinDepartment, leaveDepartment, getAllUsersDepartments, getUserDepartments } from '../../controllers/Admin_Con/departmentControllers.js';
import { protectAdminRoute, protectRoute } from '../../middleware/protectRoute.js';
const router = express.Router();

// Route to create a new department
router.post('/createDepartment', protectAdminRoute, createDepartment);

// Route to get all departments
router.get('/getAllDepartments', protectAdminRoute, getAllDepartments);

// Route to get a specific department by ID
router.get('/getDepartment/:id', protectAdminRoute, getDepartmentById);

// Route to update an existing department
router.put('/updateDepartment/:id', protectAdminRoute, updateDepartment);

// Route to delete a department
router.delete('/deleteDepartment/:id', protectAdminRoute, deleteDepartment);

router.put('/assignLeader/:departmentId', protectAdminRoute, assignLeader)


// user part
router.get('/getDepartments', protectRoute, getAllUsersDepartments);

router.get('/fetch-User-Departments/:userId', protectRoute, getUserDepartments);

router.post('/:departmentId/join/:userId', protectRoute, joinDepartment);

router.delete('/:departmentId/leave/:userId', protectRoute, leaveDepartment);

export default router;