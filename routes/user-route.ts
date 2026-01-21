import express from 'express';
import { activateUser, getUserInfo, loginUser, logoutUser, registeringUsers, socialAuth, updateUserPassword, updateRefreshToken, updateUserInfo, updateProfilePhoto } from '../controllers/user-controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const UserRouter = express.Router();
UserRouter.post('/registration', registeringUsers);
UserRouter.post('/activate-user', activateUser);
UserRouter.post('/login', loginUser);
UserRouter.get('/logout',isAuthenticated, logoutUser);
UserRouter.get('/refresh-token', updateRefreshToken);
UserRouter.get('/me', isAuthenticated, getUserInfo);
UserRouter.post('/social-auth', socialAuth);
UserRouter.put('/update-user-info', isAuthenticated,updateUserInfo);
UserRouter.put('/update-user-password', isAuthenticated,updateUserPassword);
UserRouter.put('/update-user-avatar', isAuthenticated,updateProfilePhoto);

export default UserRouter;
