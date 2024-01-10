import express from 'express'
import { regristrationUser,activateUser, loginUser, logoutUser, updateAccessToken, getUserInfo, socialAuth, } from '../controllers/user.controller';
import { isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/regristration',regristrationUser);
userRouter.post('/activate-user',activateUser);
userRouter.post('/login',loginUser);
userRouter.get('/logout',isAuthenticated,logoutUser);
userRouter.get('/refresh',updateAccessToken);
userRouter.get('/me',isAuthenticated,getUserInfo);
userRouter.post('/social-auth',socialAuth);

export default userRouter