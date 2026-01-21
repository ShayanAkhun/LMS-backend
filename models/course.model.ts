import mongoose, {Document ,Model, Schema} from "mongoose";

interface IReview {
    user: mongoose.Types.ObjectId;
    name: string;
    rating: number;
    comment: string;
}
