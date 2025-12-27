require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenPayload {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    secure?: boolean;
    sameSite: "lax" | "strict" | "none" | undefined;
}

    //parse environment variables to integrates with fallback values
  export  const accessTokenEpiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN || '300', 10)
    export const refreshTokenExpiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '1210', 10)

    // options  for cookies
  export  const accessTokenOptions: ITokenPayload = {
        expires: new Date(Date.now() + accessTokenEpiresIn * 60 * 60 * 1000),
        maxAge: accessTokenEpiresIn * 60 * 60* 1000,
        httpOnly: true,
        sameSite: "lax",
    }
   export const refreshTokenOptions: ITokenPayload = {
        expires: new Date(Date.now() + refreshTokenExpiresIn * 24 * 60 * 60 * 1000),
        maxAge: refreshTokenExpiresIn * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
    }

export const sendToken = async (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    //upload session to redis
    redis.set(`user:${user._id.toString()}`, JSON.stringify(user));




    //only set secure flag in production
    if (process.env.NODE_ENV === "production") {
        accessTokenOptions.secure = true;
        refreshTokenOptions.secure = true;
    }

    res.cookie("accessToken", accessToken, accessTokenOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenOptions);


    const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
};
    res.status(statusCode).json({
        success: true,
        user : safeUser,
        accessToken,
    })

}
