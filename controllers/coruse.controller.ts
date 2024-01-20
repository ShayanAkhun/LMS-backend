import { Response,Request,NextFunction  } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudindary from "cloudinary";
import { createCourse } from "../services/course.service";



//UPLOAD AVATAR

export const uploadCourse = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;

        const thumbnail = data.thumbnail
        
        if(thumbnail){
            const myCloud = await cloudindary.v2.uploader.upload(thumbnail,{
                folder:"courses",
            });
            data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
            }

        }
            createCourse(data,res,next)
    } catch (error :any) {
        return next(new ErrorHandler(error.message, 500))
    }
})