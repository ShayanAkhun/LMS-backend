import mongoose, { Document, Model, Schema } from "mongoose";


interface IComment extends Document {
    user: object;
    comment: string;
    commentReplies?: IComment[];
}

interface IReview extends Document {
    user: object;
    name: string;
    ratings: number;
    comment: IComment[];
}

interface ILink extends Document {
    title: string;
    url: string;
}
interface ICourseData extends Document {
    title: string;
    description: string;
    videoUrl: string;
    videoThumbnail: object;
    videoLength: number;
    videoSection: string;
    videoPlayer: string;
    suggestions: string;
    links: ILink[];
    questions: IComment[];

}

interface ICourse extends Document {
    name: string;
    description: string;
    price: number;
    estimatePrice?: number;
    thumbnail: string;
    tags: string;
    demoUrl: string;
    level: string;
    benefits: { title: string }[];
    prerequisites: { title: string }[];
    reviews: IReview[];
    courseData: ICourseData[];
    ratings?: number;
    purchased?: number;
    instructor: object;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
    user: Object,
    comment: String,
    ratings: {
        type: Number,
        default: 0
    }
})

const linkSchema = new Schema<ILink>({
    title: String,
    url: String
})

const commentSchema = new Schema<IComment>({
    user: Object,
    comment: String,
    commentReplies: [Object]
})

const courseDataSchema = new Schema<ICourseData>({
    videoUrl: String,
    videoLength: Number,
    videoSection: String,
    description: String,
    title: String,
    videoPlayer: String,
    suggestions: String,
    links: [linkSchema],
    questions: [commentSchema]
})

const courseSchema = new Schema<ICourse>({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    estimatePrice: { type: Number },
    thumbnail: {
        public_id: {
            type: String
        },
        url: {
            type: String,

        }
    },
    tags: {
        required: true,
        type: String
    },
    level: {
        required: true,
        type: String
    },
    demoUrl: {
        type: String,
        required: true
    },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }
})

const CourseModel: Model<ICourse> = mongoose.model<ICourse>("Course", courseSchema);

export { CourseModel, ICourse, IReview, IComment, ICourseData };
