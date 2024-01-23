import express from 'express';
import { authrorizeRoles, isAuthenticated } from '../middleware/auth';
import { editCourse, uploadCourse, getSingleCourse, getAllCourse, getCourseByPremiumUser, addQuestion, addAnswer } from '../controllers/coruse.controller';
const courseRouter = express.Router()


courseRouter.post("/create-course", isAuthenticated, authrorizeRoles('admin'), uploadCourse);
courseRouter.put("/edit-course/:id", isAuthenticated, authrorizeRoles('admin'), editCourse);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses", getAllCourse);
courseRouter.get("/get-courses-content/:id",isAuthenticated, getCourseByPremiumUser);
courseRouter.put("/add-question",isAuthenticated, addQuestion);
courseRouter.put("/add-answer",isAuthenticated, addAnswer);

export default courseRouter;