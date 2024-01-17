import mongoose, { Document, Model, Schema } from "mongoose";

interface IComment extends Document {
    user: object,
    comment: string
}

interface IReview extends Document {
    user: object,
    rating: string,
    commentReplies: IComment[]
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
    videoLength: number,
    videoPlayer: string,
    links: ILink[],
    suggestions: string,
    questions: IComment[],
    test: string
}