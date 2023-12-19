require('dotenv').config()
import express, {Request , Response ,NextFunction} from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
export const app = express();          
import { ErrorMiddleWare } from "./middleware/error";
import userRouter from "./routes/user.routes";

//body parser
app.use(express.json({limit: '50mb'}))

//cookie parser
app.use(cookieParser())

//CORS = cross origin resourse sharing
app.use(cors({
    origin: process.env.ORIGIN
}))


//ROutes
app.use("/api/v1",userRouter)


//Test API
app.get("/test", (req:Request, res:Response, next:NextFunction)=>{
    res.status(200).json({
        success: true,
        message:"API is working"
    })
})


//unkown routes

app.all("*",(req:Request, res:Response, next:NextFunction)=>{
    const err= new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err)
} )

app.use(ErrorMiddleWare);