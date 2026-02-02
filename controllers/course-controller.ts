require("dotenv").config();
import ErrorHandler from "../utils/ErrorHandler";
import { Response, Request, NextFunction } from "express";
import cloudinary from "cloudinary";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import { createCourse } from "../services/course.services";
import { CourseModel } from "../models/course.model";
import { redis } from "../utils/redis";



// upload course
export const uploadCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail
        if (thumbnail && typeof thumbnail === "string") {


            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }
        await createCourse(data, res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


// edit course
export const editCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        const courseId = req.params.id;

        const courseData = await CourseModel.findById(courseId) as any;

        if (thumbnail && typeof thumbnail === "string" && !thumbnail.startsWith("https")) {
            if (courseData.thumbnail?.public_id) {
                await cloudinary.v2.uploader.destroy(courseData.thumbnail.public_id);
            }

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

        if (thumbnail && typeof thumbnail === "string" && thumbnail.startsWith("https")) {
            data.thumbnail = {
                public_id: courseData?.thumbnail?.public_id,
                url: thumbnail
            }
        }

        const course = await CourseModel.findByIdAndUpdate(courseId, {
            $set: data
        }, { new: true });

        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})
// get single course without payment
export const getSingleCourse = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.id;

            const isCacheExisting = await redis.get(courseId);

            if (isCacheExisting) {


                const course = JSON.parse(isCacheExisting);
                return res.status(200).json({
                    success: true,
                    course,
                });
            }


            const course = await CourseModel.findById(courseId).select(
                "-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links"
            );




            await redis.set(courseId, JSON.stringify(course), "EX", 60 * 60); // 1 hour

            return res.status(200).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);


// get all courses

export const getAllCourses = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isCacheExisting = await redis.get("allCourses");

        if (isCacheExisting) {
            const course = JSON.parse(isCacheExisting);

            res.status(200).json({
                success: true,
                course
            });
            return;
        } else {


            const course = await CourseModel.find().select("-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links")
            await redis.set("allCourses", JSON.stringify(course), "EX", 60 * 60);

            res.status(200).json({
                success: true,
                course
            });
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// git course content
