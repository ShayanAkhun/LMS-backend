import { Response, Request, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudindary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";



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

        const course = await CourseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links")

        res.status(201).json({
            success: true,
            course
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})
//GET ALL COURSE --WITHOUT PAYING

export const getAllCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const courses = await CourseModel.find().select("-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links")

        res.status(201).json({
            success: true,
            courses
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})