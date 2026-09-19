import { verifyToken } from "../utils/jwt.js";

export const authRequired = (req, res, next) => {
  const authHeader = req.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const token = bearerToken || req.cookies.token;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
