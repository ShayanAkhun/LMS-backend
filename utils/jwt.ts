require("dotenv").config()
import { Response } from "express";
import { redis } from "./redis";
import { IUser } from "../models/user.model";

interface ITokenOptions {
    expires: Date,
    maxAge: number,
    httpOnly: boolean,
    sameSite: 'lax' | 'none' | 'strict' | undefined,
    secure?: boolean
}

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.signRefreshToke();

    //Upload sessions to results
redis.set(user._id, JSON.stringify(user) as any)

    //parse environment variables to integrates with fallback
    const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRES || '300', 10)
    const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRES || '1200', 10)

    // options for cookies 
    const accessTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + accessTokenExpire * 1000),
        maxAge: accessTokenExpire * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
    const refreshTokenTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpire * 1000),
        maxAge: refreshTokenExpire * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }

    //only set secure to true if in production
    if (process.env.NODE_ENV === 'production') {
        accessTokenOptions.secure = true
    }

    res.cookie("access_token", accessToken, accessTokenOptions)
    res.cookie("refresh_token", refreshToken, refreshTokenTokenOptions)

    res.status(statusCode).json({
        success: true,
        user,
        accessToken
    })
}