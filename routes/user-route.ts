import express from 'express';
import { activateUser, loginUser, logoutUser, registeringUsers, updateRefreshToken } from '../controllers/user-controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const UserRouter = express.Router();
UserRouter.post('/registration', registeringUsers);
UserRouter.post('/activate-user', activateUser);
UserRouter.post('/login', loginUser);
UserRouter.get('/logout',isAuthenticated, logoutUser);
UserRouter.get('/refresh-token', updateRefreshToken);

export default UserRouter;
