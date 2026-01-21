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
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            }); 
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }
        createCourse(data, res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})
