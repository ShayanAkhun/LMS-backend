require("dotenv").config();
import mongoose, { Document, Model, Schema,Types  } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
     _id: Types.ObjectId,
    name: string,
    email: string,
    password: string,
    avatar: {
        public_id: string,
        url: string
    },
    role: string,
    isVerified: boolean,
    courses: Array<{ courseId: string }>
    comparePassword: (password: string) => Promise<boolean>
    SignAccessToken: () => string
    SignRefreshToken: () => string
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please enter your email"],
        validate: {
            validator: (value: string) => {
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid email address"
        },
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [6, "Password must be at least 6 characters long"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        enum: ["user", "instructor", "admin"],
        default: "user"
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    courses: [{
        courseId: String
    }]
}, {
    timestamps: true,
})

// Hash the password before saving the user
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//sign access token
userSchema.methods.SignAccessToken =  function () {
    return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN || '' ,{
        expiresIn: '5m'
    } )
}

//sign refresh token
userSchema.methods.SignRefreshToken =  function () {
    return jwt.sign({id: this._id}, process.env.REFRESH_TOKEN || '', {
        expiresIn: '3d'
    } )
}




//Compare the password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
}

const userModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default userModel;
