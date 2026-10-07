import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const SALT_ROUNDS = 10;

export const registerUser = async ({ name, email, password }) => {
    const existing = await User.findOne({ email });
    if (existing) {
        const err = new Error("Email already registered");
        err.status = 409;
        throw err;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    return await User.create({ name, email, passwordHash });
};

export const verifyCredentials = async ({ email, password }) => {
    const user = await User.findOne({ email });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));

    if (!valid) {
        const err = new Error("Invalid email or password");
        err.status = 401;
        throw err;
    }
    return user;
};

export const signToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

export const getUserById = async (id) =>
    await User.findById(id).select("-passwordHash");