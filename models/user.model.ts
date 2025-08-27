import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+s/;

export interface IUser extends Document {
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
    comparedPassword: (password: string) => Promise<boolean>
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

//Compare the password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
}

const userModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default userModel;
