import { redis } from "./redis";
import { IUser } from "../models/user.model";

export const cacheUser = async (user: IUser) => {
  const safeUser = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar?.url || null,
  };

  // Safety guard
  const payload = JSON.stringify(safeUser);
  if (payload.includes("data:image")) {
    throw new Error("Base64 image detected in Redis payload");
  }

  await redis.set(
    `user:${safeUser._id}`,
    payload,
    "EX",
    60 * 60 * 24 // 24 hours
  );

  return safeUser;
};
