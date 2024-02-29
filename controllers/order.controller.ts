import { Response, Request, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel, { IOrder } from "../models/order.model";
import CourseModel from "../models/course.model";
import userModel from "../models/user.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notifications.model";
import { newOrder } from "../services/order.service";


//CREATE ORDER

export const createOrder = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as IOrder;

        const user = await userModel.findById(req.user?._id);

        const ifCourseExistsInUser = user?.courses.some((course: any) => course._id.toString() === courseId)

        if (ifCourseExistsInUser) {

            return next(new ErrorHandler("you already have purchased this course", 400))
        }

        const course = await CourseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Cpurse not found", 400))

        }

        const data : any = {
            courseId: course._id,
            userId: user?._id
        }

        newOrder(data,res,next);
        const mailData = {
            order : {
                _id:course._id.slice(0,6),
                name:course.name,
                price:course.price,
                date:new Date().toLocaleDateString("en-US",{year: "numeric", month: "long", day: "numeric"})
            }
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})