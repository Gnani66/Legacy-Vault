import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; type: string; nomineeId?: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload || payload.type !== "user" || !payload.userId) return res.status(401).json({ message: "Invalid owner token" });
  req.user = payload;
  next();
}

export function nomineeAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload || payload.type !== "nominee") return res.status(401).json({ message: "Invalid nominee token" });
  req.user = payload;
  next();
}
