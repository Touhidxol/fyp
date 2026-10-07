import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated"
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id };
        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};