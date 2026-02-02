import { Request,Response,  NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";

// checks if the user is authenticated or not
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies.accessToken;


        if (!accessToken) {
            return next(new ErrorHandler("Invalid Token. Please login again", 400));
        }

        if (!process.env.ACCESS_TOKEN) {
            return next(new ErrorHandler("ACCESS_TOKEN environment variable is not set", 500));
        }

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN as string) as JwtPayload;
        if (!decoded || !decoded.id) {
            return next(new ErrorHandler("access token is not valid", 400));
        }

        const user = await redis.get(`user:${decoded.id}`);
        if (!user) {
            return next(new ErrorHandler("user not found", 400));
        }

        const parsedUser = JSON.parse(user);
        // Ensure _id is properly set
        if (!parsedUser._id) {
            parsedUser._id = decoded.id;
        }
        req.user = parsedUser;
        next();
    } catch (error: any) {
        // Handle JWT errors (expired, invalid, etc.)
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return next(new ErrorHandler("Invalid Token. Please login again", 400));
        }
        return next(error);
    }
}

//this will validate the user

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    }
}
