import express from 'express';
import { authrorizeRoles, isAuthenticated } from '../middleware/auth';
import { editCourse, uploadCourse,getSingleCourse, getAllCourse } from '../controllers/coruse.controller';
const courseRouter = express.Router()


courseRouter.post("/create-course", isAuthenticated,authrorizeRoles('admin'),uploadCourse);
courseRouter.post("/edit-course/:id", isAuthenticated,authrorizeRoles('admin'),editCourse);
courseRouter.post("/get-course/:id", getSingleCourse);
courseRouter.post("/get-courses", getAllCourse);

export default courseRouter;