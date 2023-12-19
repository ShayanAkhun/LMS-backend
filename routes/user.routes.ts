import express from 'express'
import { regristrationUser,activateUser, LoginUser } from '../controllers/user.controller';

const userRouter = express.Router();

userRouter.post('/regristration',regristrationUser);
userRouter.post('/activate-user',activateUser);
userRouter.post('/login',LoginUser);

export default userRouter