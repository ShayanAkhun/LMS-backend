import express from 'express';
import { authrorizeRoles, isAuthenticated } from '../middleware/auth';
import { editCourse, uploadCourse, getSingleCourse, getAllCourse, getCourseByPremiumUser } from '../controllers/coruse.controller';
const courseRouter = express.Router()


courseRouter.post("/create-course", isAuthenticated, authrorizeRoles('admin'), uploadCourse);
courseRouter.post("/edit-course/:id", isAuthenticated, authrorizeRoles('admin'), editCourse);
courseRouter.post("/get-course/:id", getSingleCourse);
courseRouter.post("/get-courses", getAllCourse);
courseRouter.post("/get-courses-content/:id",isAuthenticated, getCourseByPremiumUser);

export default courseRouter;