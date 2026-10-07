import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import {
    registerUser,
    verifyCredentials,
    signToken,
    getUserById
} from "../services/auth.service.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email
});

export const register = async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: parsed.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message
            }))
        });
    }

    try {
        const user = await registerUser(parsed.data);
        res.status(201).json({ success: true, user: publicUser(user) });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

export const login = async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: parsed.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message
            }))
        });
    }

    try {
        const user = await verifyCredentials(parsed.data);
        const token = signToken(user._id);

        res.cookie("token", token, cookieOptions);
        res.json({ success: true, user: publicUser(user) });
    } catch (error) {
        res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

export const me = async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.json({ success: true, user: publicUser(user) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logout = (req, res) => {
    const { maxAge, ...clearOptions } = cookieOptions;
    res.clearCookie("token", clearOptions);
    res.json({ success: true, message: "Logged out" });
};