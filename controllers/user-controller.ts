require("dotenv").config();
import ErrorHandler from "../utils/ErrorHandler";
import { Response, Request, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import jwt, { Secret,JwtPayload } from "jsonwebtoken";
import ejs from "ejs"
import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";


interface IRegisterBody {
    name: string;
    email: string;
    password: string;
    avatar?: string
}
export const registeringUsers = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, } = req.body;
        const ifEmailExists = await userModel.findOne({ email });
        if (ifEmailExists) {
            return next(new ErrorHandler("Email already exists", 400));
        }
        const user: IRegisterBody = {
            name,
            email,
            password
        }
        const activationToken = createActivationToken(user);

        const activationCode = activationToken.activationCode;
        const data = {
            user: { name: user.name },
            activationCode
        }

        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data
            });
            res.status(201).json({
                success: true,
                message: `Please check your email:- ${user.email} to activate your account!`,
                activationToken: activationToken.token
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

interface IActivationToken {
    token: string;
    activationCode: string,
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign({
        user, activationCode
    }, process.env.ACTIVATION_SECRET as Secret, {
        expiresIn: "5m"
    })
    return { token, activationCode }
}


//activate user

interface IActivateUser {
    activation_token: string;
    activation_code: string;
}
export const activateUser = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const { activation_token, activation_code } = req.body as IActivateUser;

        const newUser: { user: IUser; activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as Secret
        ) as { user: IUser; activationCode: string };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid activation code", 400));
        }

        const { name, email, password, } = newUser.user;

        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return next(new ErrorHandler("user already exists", 400));
        }
        const user = await userModel.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
            message: "User activated successfully",
            user
        });

    }
    catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

//login user

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { email, password } = req.body as ILoginRequest;

        if (!email || !password) {
            return next(new ErrorHandler("Please provide email and password", 400));
        }

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }
        const doesPasswordMatched = await user.comparePassword(password);
        if (!doesPasswordMatched) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }

        sendToken(user, 200, res);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }

})

//Logout user

export const logoutUser = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {

    try {
        const userId = req.user?._id || "";

        // Clear Redis session
        await redis.del(`user:${userId}`);

        res.cookie("accessToken", "", { maxAge: 1 });
        res.cookie("refreshToken", "", { maxAge: 1 });


        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

//update the refresh token

export const updateRefreshToken = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
            const refresh_token = req.cookies.refreshToken as string;
            const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;

            const message = "could not refresh token, please login again";
            const tokenMessage = "Token refreshed successfully";


            if (!decoded ) {
                return next(new ErrorHandler(message, 400));
            }
            const session = await redis.get(`user:${decoded.id as string}`);
            if (!session) {
                return next(new ErrorHandler(message, 400));
            }
            const user = JSON.parse(session);

            const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string,{
                expiresIn: "5m"
            })


                const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string,{
                expiresIn: "3d"
            })
            res.cookie("accessToken", accessToken, accessTokenOptions);
            res.cookie("refreshToken", refreshToken, refreshTokenOptions);

            const safeUser = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            };

            return res.status(200).json({
                success: true,
                user: safeUser,
                accessToken,
                tokenMessage
            });


    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

//Get user info
