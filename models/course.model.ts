import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
    user: IUser,
    question: string
    questionReplies: IComment[],
}

interface IReview extends Document {
    user: IUser,
    rating: Number,
    comment: string,
    commentReplies?: IComment[]
}

interface ILink extends Document {
    title: string,
    url: string
}

interface ICourseData extends Document {
    title: string,
    description: string,
    videoUrl: string,
    videoThumbnail: object,
    videoSection: string,
    videoLength: number,
    videoPlayer: string,
    links: ILink[],
    suggestions: string,
    questions: IComment[],
}

interface ICourse extends Document {
    name: string,
    description: string,
    price: number,
    estimatedPrice?: number,
    thumbNail: object,
    tags: string,
    levels: string,
    demoUrl: string,
    benefits: {title: string}[],
    prerequisites: {title: string}[],
    reviews: IReview[],
    courseData: ICourseData[],
    ratings?: number,
    purchased?: number,
}

//SCHEMAS FOR INTERFACE

const reviewSchema = new Schema <IReview> ({
    user: Object,
    rating: {
        type: Number,
        default: 0
    },
    comment:String,
    commentReplies: [Object]
})

const linkSchema= new Schema<ILink>({
    title:String,
    url:String
})

const commentSchema = new Schema<IComment>({
    user:Object,
    question:String,
    questionReplies: [Object]
})


const courseDataSchema = new Schema<ICourseData>({
    videoUrl:String,
    videoLength:Number,
    videoSection:String,
    videoPlayer: String,
    title: String,
    description: String,
    links: [linkSchema],
    suggestions: String,
    questions: [commentSchema]

})


const courseSchema = new Schema<ICourse> ({
    name: {
        type: String,
        required: true,

    },
    description: {
        type:String,
        required:true
    },
    price: {    
        type:Number,
        required:true
    },
    estimatedPrice: {
        type:Number
    },
    thumbNail: {
        public_id:{
            type:String
        },
        url: {
            type:String
        }
    },
    tags:{
        type:String,
        required:true
    },
    levels :{
            type:String,
            required:true
    },
    demoUrl: {
        type:String,
        required:true
    },
    benefits: [{title: String}],
    prerequisites: [{title: String}],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings:{ 
        type:Number,
        default: 0
    },
    purchased: {
        type:Number,
        default: 0
    }

})


const CourseModel : Model<ICourse> = mongoose.model("Course",courseSchema);

export default CourseModel;