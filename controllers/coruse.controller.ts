import { Response, Request, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudindary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";



//UPLOAD COURSE

export const uploadCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;

        const thumbnail = data.thumbnail

        if (thumbnail) {
            const myCloud = await cloudindary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }

        }
        createCourse(data, res, next)
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


//COURSE EDIT

export const editCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;

        const thumbnail = data.thumbNail;

        if (thumbnail) {
            await cloudindary.v2.uploader.destroy(thumbnail.public_id);

            const myCloud = await cloudindary.v2.uploader.upload(thumbnail, {
                folder: "coursses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

        const courseId = req.params.id;

        const course = await CourseModel.findByIdAndUpdate(
            courseId, { $set: data }, { new: true }
        );

        res.status(201).json({
            success: true,
            course
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})

//GET SINGLE COURSE --WITHOUT PAYING

export const getSingleCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const courseId = req.params.id;

        const doesCacheExists = await redis.get(courseId);

        if (doesCacheExists) {
            const course = JSON.parse(doesCacheExists)
            res.status(200).json({
                success: true,
                course
            })
        } else {
            const course = await CourseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links")

            res.status(201).json({
                success: true,
                course
            })
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})
//GET ALL COURSE --WITHOUT PAYING

export const getAllCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const doesCacheExists = await redis.get("allCourses");

        if (doesCacheExists) {
            const course = JSON.parse(doesCacheExists)
            res.status(200).json({
                success: true,
                course
            })
        } else {
            const courses = await CourseModel.find().select("-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links")

            await redis.set("allCourses", JSON.stringify((courses)))

            res.status(201).json({
                success: true,
                courses
            })
        }





    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


//GET COURSE CONTENT -- FOR PREMIUM USERS

export const getCourseByPremiumUser = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;

        const courseExists = userCourseList?.find((course: any) => course._id.string() === courseId);

        if (!courseExists) {
            return next(new ErrorHandler("You are not eligible to access this course content", 400))

        }
        const course = await CourseModel.findById(courseId);

        const content = course?.courseData;

        res.status(200).json({
            success: true,
            content
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


//ADD QUESTIONS IN COURSE

interface IAddQuestionData {
    question: string,
    courseId: string,
    contentId: string
}

export const addQuestion = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId }: IAddQuestionData = req.body;
        const course = await CourseModel.findById(courseId)

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content Id", 400))
        }

        const courseContent = course?.courseData?.find((item:any) =>item._id.equals(courseId))
        

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})