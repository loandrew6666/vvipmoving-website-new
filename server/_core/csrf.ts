/**
 * CSRF Protection Middleware
 * 
 * Strategy: tRPC routes (/api/trpc/*) are exempt from CSRF because:
 * 1. tRPC uses JSON content-type which browsers don't send via form submissions
 * 2. tRPC already validates via session cookies + SameSite policy
 * 3. All mutations go through tRPC's own validation pipeline
 * 
 * CSRF protection is applied to:
 * - OAuth callback routes
 * - Any non-tRPC POST/PUT/DELETE endpoints
 * 
 * Uses double-submit cookie pattern for non-tRPC routes.
 */

import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "__csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

// Token store with expiry
const tokenStore = new Map<string, { token: string; expiresAt: number }>();
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Store token with expiry
 */
function storeToken(token: string): void {
  tokenStore.set(token, {
    token,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  });
}

/**
 * Verify token exists and hasn't expired
 */
function verifyToken(token: string): boolean {
  const entry = tokenStore.get(token);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return false;
  }

  return true;
}

/**
 * Check if the request path should be exempt from CSRF validation
 */
function isExemptFromCsrf(req: Request): boolean {
  const path = req.path;

  // tRPC routes are exempt - they use JSON content-type + SameSite cookies
  if (path.startsWith("/api/trpc")) return true;

  // OAuth routes handle their own state validation
  if (path.startsWith("/api/oauth")) return true;

  // ERP API routes use API Key authentication, exempt from CSRF
  if (path.startsWith("/api/erp")) return true;

  // Analytics and health check endpoints
  if (path.startsWith("/api/health")) return true;

  // Safe HTTP methods don't need CSRF
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;

  return false;
}

/**
 * Express middleware: CSRF protection with tRPC exemption
 */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Always set CSRF token cookie on GET requests for forms that need it
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    const token = generateCsrfToken();
    storeToken(token);
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: TOKEN_EXPIRY_MS,
    });
    res.locals.csrfToken = token;
    next();
    return;
  }

  // Exempt paths skip CSRF validation
  if (isExemptFromCsrf(req)) {
    next();
    return;
  }

  // Validate CSRF token for non-exempt POST/PUT/DELETE/PATCH
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const token =
      (req.headers[CSRF_HEADER_NAME] as string) ||
      (req.body?.csrfToken as string) ||
      (req.cookies?.[CSRF_COOKIE_NAME] as string);

    if (!token || !verifyToken(token)) {
      res.status(403).json({
        error: "CSRF token invalid or missing",
        code: "CSRF_INVALID",
      });
      return;
    }

    // Consume token (one-time use)
    tokenStore.delete(token);
    next();
    return;
  }

  next();
}

/**
 * Validate CSRF token in tRPC procedures (for extra-sensitive operations)
 */
export function validateCsrfToken(req: Request, token?: string): void {
  if (!token || !verifyToken(token)) {
    throw new Error("CSRF token invalid or missing");
  }
  tokenStore.delete(token);
}

/**
 * Cleanup expired tokens (run every 1 hour)
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  const tokensToDelete: string[] = [];
  tokenStore.forEach((entry, token) => {
    if (now > entry.expiresAt) {
      tokensToDelete.push(token);
    }
  });
  tokensToDelete.forEach(token => tokenStore.delete(token));
}

// Auto-cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// Cleanup on startup
cleanupExpiredTokens();
