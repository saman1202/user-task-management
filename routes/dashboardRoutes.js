import express from 'express';
import { 
    getDashboard, 
    createTask, 
    updateTaskStatus, 
    deleteTask 
} from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, getDashboard);
router.post('/tasks', requireAuth, createTask);
router.post('/tasks/:taskId/status', requireAuth, updateTaskStatus);
router.post('/tasks/:taskId/delete', requireAuth, deleteTask);

export default router;