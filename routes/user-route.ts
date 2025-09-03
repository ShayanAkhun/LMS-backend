import express from 'express';
import { registeringUsers } from '../controllers/user-controller';

const UserRouter = express.Router();
UserRouter.post('/registration', registeringUsers);

export default UserRouter;
