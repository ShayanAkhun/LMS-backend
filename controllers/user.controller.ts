require("dotenv").config()
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import jwt, { Secret } from "jsonwebtoken";
import ejs from 'ejs';
import path from 'path'
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
interface IRegistration {
    name: string,
    email: string,
    password: string,
    avatar?: string
}

export const regristrationUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { name, email, password } = req.body;
        const isEmailExist = await userModel.findOne({ email })
        if (isEmailExist) {
            return next(new ErrorHandler("Email already exists", 400))
        }
        const user: IRegistration = {
            name,
            email,
            password,
        }

        const activationToken = createActivationToken(user)
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };

        await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data)

        try {
            await sendMail({
                email: user.email,
                subject: 'Activate your account',
                template: 'activation-mail.ejs',
                data,
            })

            return res.status(201).json({
                success: true,
                message: `please check your email ${user.email} to activate your account`,
                activationToken: activationToken.token
            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400))
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))

    }
})

interface IActivationToken {
    token: string,
    activationCode: string
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign({
        user, activationCode
    }, process.env.ACTVATION_SECRET as Secret, {
        expiresIn: "5m"
    })
    console.log(token, 'token');
    console.log(activationCode, 'code');

    return { token, activationCode }
}
//activitate user
interface IActivationRequest {
    activation_token: string,
    activation_code: string,
}

export const activateUser = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_token, activation_code } = req.body as IActivationRequest;
        const newUser: { user: IUser, activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTVATION_SECRET as string
        ) as { user: IUser, activationCode: string };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code ", 400))
        }
        const { name, email, password } = newUser.user;

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return next(new ErrorHandler("Email already exists", 400))
        }
        const user = userModel.create({
            name,
            email,
            password,
        })
        res.status(201).json({
            success: true
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


///LOGIN USER
interface ILoginUser {
    email: string,
    password: string,
}

export const LoginUser = catchAsyncErrors(async (res: Response, req: Request, next: NextFunction) => {
    try {
        const { email, password } = req.body as ILoginUser;

        if (!email || !password) {
            return next(new ErrorHandler("Please enter your email and password", 400))
        }
        const user = await userModel.findOne({ email }).select("+password")

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400))
        }
        const isPasswordMatching = await user.comparePasswords(password)
        if (!isPasswordMatching) {

            return next(new ErrorHandler("Invalid email or password", 400))
        }

        sendToken(user, 200, res)

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})