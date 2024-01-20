import express from 'express';
import { authrorizeRoles, isAuthenticated } from '../middleware/auth';
import { uploadCourse } from '../controllers/coruse.controller';
const courseRouter = express.Router()


courseRouter.post("/create-course", isAuthenticated,authrorizeRoles('admin'),uploadCourse);

export default courseRouter;