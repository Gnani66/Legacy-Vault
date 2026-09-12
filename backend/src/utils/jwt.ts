import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "legacy-vault-dev-secret-change-in-prod";
const NOMINEE_SECRET = process.env.JWT_SECRET || "legacy-vault-dev-secret-change-in-prod";

export function signUserToken(payload: { userId: string; email: string }) {
  return jwt.sign({ ...payload, type: "user" }, SECRET, { expiresIn: "7d" });
}

export function signNomineeToken(payload: { nomineeId: string; email: string }) {
  return jwt.sign({ ...payload, type: "nominee" }, NOMINEE_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
