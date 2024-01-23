import { Response, Request, NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudindary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from 'ejs';
import path from "path";
import sendMail from "../utils/sendMail";



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

        const courseContent = course?.courseData?.find((item: any) => item._id.equals(courseId))

        if (!courseContent) {
            return next(new ErrorHandler("Invalid content Id", 400))
        }

        //CREATE A NEW QUESTION
        const newQuestion: any = {
            user: req.user,
            question,
            questionReplies: []
        }

        //ADD THIS QUESTION TO OUR COURSE CONTENT
        courseContent.questions.push(newQuestion)

        //SAVE THIS UPDATE QUESTION
        await course?.save()

        res.status(200).json({
            success: true,
            course
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


//ANSWER THE QUESTION

interface IAnswerQuestion {
    answer: string,
    courseId: string,
    contentId: string,
    questionId: string,
}

export const addAnswer = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { answer, courseId, contentId, questionId }: IAnswerQuestion = req.body;
        const course = await CourseModel.findById(courseId)

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content Id", 400))
        }

        const courseContent = course?.courseData?.find((item: any) => item._id.equals(courseId))

        if (!courseContent) {
            return next(new ErrorHandler("Invalid content Id", 400))
        }
        const question = courseContent?.questions?.find((item: any) => item._id.equals(questionId))

        if (!question) {
            return next(new ErrorHandler("Invalid content Id", 400))
        }

        //CREATE A NEW ANSWER
        const newAnswer: any = {
            user: req.user,
            answer
        }

        //ADD THIS QUESTION TO OUR COURSE CONTENT
        question.questionReplies.push(newAnswer)

        await course?.save()

        if (req.user?._id === question.user._id) {
            //CREATE A NOTIFICATION WHICH IS NOT CREATE YET
        } else {
            const data = {
                name: question.user.name,
                title: courseContent.title
            }
            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.js"), data);

            try {
                await sendMail({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data
                })
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500))
            }
        }
        res.status(200).json({
            success: true,
            course
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


//ADD REVIEW IN COURSE

interface IAddReviewData {
    review: string,
    rating: number,
    userId: string
}

export const addReview = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;

        //validate if courseId already exists in usercourselist based on_id
        const courseExists = userCourseList?.some((course: any) => course._id.toString() === courseId.toString());

        if (!courseExists) {
            return next(new ErrorHandler('you are not eligible to access this resource', 400))
        }

        const course = await CourseModel.findById(courseId);

        const { review, rating } = req.body as IAddReviewData;

        const reviewData: any = {
            user: req.user,
            comment: review,
            rating
        }

        course?.reviews.push(reviewData);

        let avg = 0;

        course?.reviews.forEach((rev: any) => {
            avg += rev.rating;
        })

        if (course) {
            course.ratings = avg / course.reviews.length;
        }

        await course?.save();

        const notification = {
            title: "New Notification Received",
            message: `${req.user?.name} has given you a review in ${course?.name}`
        }

        res.status(200).json({
            success: true,
            course
        })


    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})


//ADDREPLY IN REVIEW

interface IAddReviewData {
    comment: string,
    courseId: string,
    reviewId: string

}

export const addReplyToReview = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { comment, courseId, reviewId } = req.body as IAddReviewData;
        const course = await CourseModel.findById(courseId);

        if (!course) {
            return next(new ErrorHandler("course not found ", 404))

        }

        const review = course?.reviews?.find((rev: any) => rev._id.toString().equals(reviewId));

        if (!review) {
            return next(new ErrorHandler("course not found ", 404))
        }

        const replyData: any = {
            user: req.user,
            comment,
        }

        if (!review.commentReplies) {
            review.commentReplies = []
        }


        review.commentReplies?.push(replyData);

        await course?.save();

        res.status(200).json({
            success: true,
            course
        });



    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500))
    }
})