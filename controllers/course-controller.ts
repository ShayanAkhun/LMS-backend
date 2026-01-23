require("dotenv").config();
import ErrorHandler from "../utils/ErrorHandler";
import { Response, Request, NextFunction } from "express";
import cloudinary from "cloudinary";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import { createCourse } from "../services/course.services";



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
        const thumbnail = data.thumbnail

        if (thumbnail) {
            await cloudinary.v2.uploader.destroy(data.public_id);
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})
