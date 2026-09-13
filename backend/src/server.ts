import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import testRoutes from "./routes/testRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import blockchainRoutes from "./routes/blockchainRoutes";
import aiRoutes from "./routes/aiRoutes";
import aegisRoutes from "./routes/aegisRoutes";
import registryRoutes from "./routes/registryRoutes";
import claimsRoutes from "./routes/claimsRoutes";
import assetsRoutes from "./routes/assetsRoutes";

const app = express();

app.use(cors());
app.use(express.json());

// Aegis-compatible frontend copy routes at root (/, /login, /signup, /vault-documents, etc.)
app.use("/", aegisRoutes);

// Legacy /api routes — Phase 5 Full Integration
app.use("/api/test", testRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/registry", registryRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/assets", assetsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Legacy Vault Backend is running",
    phase: "5 - Full System Integration",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Legacy Vault API is healthy",
    phase: "5",
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Backend healthy", version: "aegis+legacy", phase: "5" });
});

app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof SyntaxError && "status" in error && (error as { status?: number }).status === 400) {
    return res.status(400).json({ message: "Malformed JSON request body" });
  }

  return next(error);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Legacy Vault Backend running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`AI proxy: http://localhost:${PORT}/api/ai/verify-death-certificate`);
  console.log(`Registry mock: http://localhost:${PORT}/api/registry/verify?certificate_number=DC-DEMO-001`);
});
