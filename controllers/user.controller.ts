require("dotenv").config()
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from 'ejs';
import path from 'path'
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import {redis} from "../utils/redis"
import { getUserById } from "../services/user.services";
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
interface ILoginRequest {
    email: string,
    password: string,
}

export const loginUser = catchAsyncErrors(async ( req: Request,res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as ILoginRequest;

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

//LOGOUT USER
export const logoutUser = catchAsyncErrors(async(req: Request,res:Response, next:NextFunction) => {
    try {   
        res.cookie("access_token","", {maxAge:1});
        res.cookie("refresh_token","",{maxAge: 1});
        const userId = req.user?._id || "";
        redis.del(userId) 
        res.status(200).json({
            success: true,
            message: "logged out successfully"
        })
        
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

// UPDATE REFRESH TOKEN
export const updateAccessToken = catchAsyncErrors(async(req: Request, res:Response,next:NextFunction)=> {
    try {
            const refresh_token = req.cookies.refresh_token as string;
            const decoded = jwt.verify(refresh_token,
                process.env.REFRESH_TOKEN as string) as JwtPayload;
                
                const message = "could not refresh token"
                if(!decoded){
                    return next(new ErrorHandler(message, 400))
                    
                }
                const sessions = await redis.get(decoded.id as string);
                
                if(!sessions){
                    return next(new ErrorHandler(message, 400))
                }
                const user = JSON.parse(sessions);

                const accessToken = jwt.sign({is:user._id},process.env.ACCESS_TOKEN as string,{
                    expiresIn: '5m'
                })
                const refreshToken = jwt.sign({is:user._id},process.env.REFRESH_TOKEN as string,{
                    expiresIn: '3d'
                })

                res.cookie("access_token", accessToken,accessTokenOptions)
                res.cookie("refresh_token", refreshToken,refreshTokenOptions)

                res.status(200).json({
                    status: "success",
                    accessToken
                })
    }catch (error:any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


//get user info
export const getUserInfo = catchAsyncErrors(async(req: Request, res:Response,next:NextFunction)=> {
    try {
        const userId = req.user?._id
        getUserById(userId, res)   
    }catch (error:any) {
        return next(new ErrorHandler(error.message, 400))
    }
})




//get social Auth
interface ISocialAuthBody {
    email:string,
    name:string,
    avatar: string,
}
export const socialAuth = catchAsyncErrors(async(req: Request, res:Response,next:NextFunction)=> {
    try {
        const {email, name, avatar} = req.body as ISocialAuthBody;
        const user = await userModel.findOne({email})
        if(!user) {
            const newUser = await  userModel.create({email,name,avatar})
            sendToken(newUser,200,res)
        } else {
            sendToken(user,200,res)
        }
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400))
    }
})

//Update user info

interface IUpdateUserInfo {
    name? : string,
    email? :string,
}

export const updateUserInfo = catchAsyncErrors (async(req: Request, res:Response,next:NextFunction)=> {
    try {
                const {email, name} = req.body as IUpdateUserInfo;
                const userID = req.user?._id
                const user = await userModel.findById(userID);

                if(email && user ){
                    const isEmailExisting = await userModel.findOne({email}) 
                    if(isEmailExisting){
                        return next(new ErrorHandler("Email already Exists", 400))
                    }
                    user.email = email;
                }

                if(name && user) {
                        user.name = name
                }
                await user?.save()

                await  redis.set(userID,JSON.stringify(user));

                res.status(201).json({
                    success: true,
                    user
                })
                
                
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400))
    }
})