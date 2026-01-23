import { Response } from "express";
import { CourseModel } from "../models/course.model";


//create course
export const createCourse = async (data: any, res: Response) => {
    try {
        const course = await CourseModel.create(data);
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course,
        });
    } catch (error: any) {
        throw error;
    }
}
