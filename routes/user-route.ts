import express from 'express';
import { activateUser, loginUser, registeringUsers } from '../controllers/user-controller';

const UserRouter = express.Router();
UserRouter.post('/registration', registeringUsers);
UserRouter.post('/activate-user', activateUser);
UserRouter.post('/login', loginUser);

export default UserRouter;
