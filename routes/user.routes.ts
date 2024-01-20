import express from 'express'
import { regristrationUser,activateUser, loginUser, logoutUser, updateAccessToken, getUserInfo, socialAuth, updateUserInfo,updatePasword } from '../controllers/user.controller';
import { authrorizeRoles, isAuthenticated } from '../middleware/auth';

const userRouter = express.Router();

userRouter.post('/regristration',regristrationUser);
userRouter.post('/activate-user',activateUser);
userRouter.post('/login',loginUser);
userRouter.get('/logout',isAuthenticated,authrorizeRoles("admin"),logoutUser);
userRouter.get('/refresh',updateAccessToken);
userRouter.get('/get-user-info',isAuthenticated,getUserInfo);
userRouter.post('/get-social-auth',socialAuth);
userRouter.put('/update-user-info',isAuthenticated,updateUserInfo);
userRouter.put('/update-user-password',isAuthenticated,updatePasword);

export default userRouter