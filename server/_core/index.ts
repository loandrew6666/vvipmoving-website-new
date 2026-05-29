import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import {
  globalRateLimitMiddleware,
  securityHeadersMiddleware,
  requestValidationMiddleware,
} from "./rateLimit";
import { csrfMiddleware } from "./csrf";
import rateLimit from "express-rate-limit";
import { erpRouter } from "../erp-api";
import { registerStorageProxy } from "./storageProxy";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Layer 0: Security Headers ──────────────────────────────────────
  app.use(securityHeadersMiddleware);

  // ─── Layer 1: Request Validation ────────────────────────────────────
  app.use(requestValidationMiddleware);

  // ─── Layer 2: Global Rate Limit (60 req/min per IP on API routes) ───
  app.use("/api", globalRateLimitMiddleware);

  // ─── Layer 3: CSRF Protection ──────────────────────────────────────
  app.use(csrfMiddleware);

  // ─── Body Parsers ─────────────────────────────────────────────────
  // Photo uploads via base64 require larger payload limits (50MB raw → ~67MB base64)
  app.use(express.json({ limit: "70mb" }));
  app.use(express.urlencoded({ limit: "70mb", extended: true }));

  // ─── OAuth Rate Limiting (15 min window, max 5 attempts) ────────────
  const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => {
      const fwd = req.headers["x-forwarded-for"];
      if (typeof fwd === "string") return fwd.split(",")[0].trim();
      return (req.headers["x-real-ip"] as string) || req.socket?.remoteAddress || "unknown";
    },
    skip: (_req, res) => res.statusCode === 404,
    message: "Too many OAuth attempts, please try again later",
  });

  // OAuth callback under /api/oauth/callback
  app.post("/api/oauth/callback", oauthLimiter);
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Block common attack paths
  const blockedPaths = [
    "/api/trpc/_def", "/api/trpc/_health", "/api/trpc/_introspect",
    "/.env", "/wp-admin", "/wp-login.php", "/phpmyadmin",
    "/admin.php", "/.git", "/config",
  ];
  blockedPaths.forEach(path => {
    app.all(path, (_req, res) => {
      res.status(404).json({ error: "Not found" });
    });
  });
  
  // ─── ERP Integration API (before CSRF, uses API Key auth) ─────────
  app.use("/api/erp", erpRouter);

  // tRPC API with error sanitization
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, type, path }) => {
        // Hide detailed route info in production
        if (process.env.NODE_ENV === "production") {
          if (error.code === "NOT_FOUND" || error.code === "UNAUTHORIZED") return;
        }
        console.error(`[tRPC] ${type} error at ${path}:`, error.message);
      },
    })
  );

  // Block tRPC route discovery/introspection
  app.get("/api/trpc", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
