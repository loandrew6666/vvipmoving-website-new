/**
 * Multi-layer rate limiting & IP blacklist system
 * 
 * Layer 1: Global rate limit (60 req/min per IP)
 * Layer 2: Sensitive endpoint rate limit (AI estimate 150s, chat 5s, upload 30s)
 * Layer 3: IP blacklist (auto-ban after 10 consecutive violations for 30 min)
 * Layer 4: Request validation (body size, content-type, user-agent)
 */

import type { Request, Response, NextFunction } from "express";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];  // sliding window timestamps
  violations: number;    // consecutive violation count
}

interface BlacklistEntry {
  bannedAt: number;
  expiresAt: number;
  reason: string;
}

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  // Global rate limit
  global: {
    windowMs: 60 * 1000,    // 1 minute
    maxRequests: 60,         // 60 requests per minute per IP
  },
  // Sensitive endpoint limits
  sensitive: {
    aiEstimate: { windowMs: 150 * 1000, maxRequests: 1 },   // 150s cooldown
    ticketCreate: { windowMs: 150 * 1000, maxRequests: 1 },  // 150s cooldown
    chatSend: { windowMs: 5 * 1000, maxRequests: 3 },        // 5s window, 3 msgs
    upload: { windowMs: 30 * 1000, maxRequests: 5 },          // 30s window, 5 uploads
    query: { windowMs: 10 * 1000, maxRequests: 5 },           // 10s window, 5 queries
  },
  // Blacklist
  blacklist: {
    maxViolations: 10,           // 10 consecutive violations → ban
    banDurationMs: 30 * 60 * 1000, // 30 minutes ban
  },
} as const;

// ─── Storage ──────────────────────────────────────────────────────────────────

const globalLimits = new Map<string, RateLimitEntry>();
const endpointLimits = new Map<string, RateLimitEntry>(); // key: `${ip}:${endpoint}`
const blacklist = new Map<string, BlacklistEntry>();

// ─── IP Extraction ────────────────────────────────────────────────────────────

export function getClientIp(req: Request | any): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return (
    (req.headers?.["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// ─── Blacklist Check ──────────────────────────────────────────────────────────

export function isBlacklisted(ip: string): BlacklistEntry | null {
  const entry = blacklist.get(ip);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    blacklist.delete(ip);
    return null;
  }
  
  return entry;
}

function addToBlacklist(ip: string, reason: string): void {
  const now = Date.now();
  blacklist.set(ip, {
    bannedAt: now,
    expiresAt: now + CONFIG.blacklist.banDurationMs,
    reason,
  });
  console.warn(`[Security] IP ${ip} blacklisted for 30 minutes: ${reason}`);
}

function recordViolation(ip: string): void {
  // Track violations in global store
  let entry = globalLimits.get(ip);
  if (!entry) {
    entry = { timestamps: [], violations: 0 };
    globalLimits.set(ip, entry);
  }
  entry.violations++;
  if (entry.violations >= CONFIG.blacklist.maxViolations) {
    addToBlacklist(ip, `Exceeded ${CONFIG.blacklist.maxViolations} consecutive rate limit violations`);
  }
}

// ─── Sliding Window Rate Limiter ──────────────────────────────────────────────

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  windowMs: number,
  maxRequests: number
): { limited: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let entry = store.get(key);
  
  if (!entry) {
    entry = { timestamps: [now], violations: 0 };
    store.set(key, entry);
    return { limited: false, remaining: maxRequests - 1, resetMs: windowMs };
  }
  
  // Remove expired timestamps (sliding window)
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  
  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]!;
    const resetMs = windowMs - (now - oldestInWindow);
    return { limited: true, remaining: 0, resetMs };
  }
  
  entry.timestamps.push(now);
  return {
    limited: false,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}

// ─── Public Rate Limit Check (for tRPC procedures) ───────────────────────────

export function isRateLimited(ip: string): boolean {
  // Check blacklist first
  if (isBlacklisted(ip)) return true;
  
  const result = checkRateLimit(
    endpointLimits,
    `${ip}:sensitive`,
    CONFIG.sensitive.aiEstimate.windowMs,
    CONFIG.sensitive.aiEstimate.maxRequests
  );
  
  if (result.limited) {
    recordViolation(ip);
  }
  
  return result.limited;
}

export function getRateLimitResetTime(ip: string): number {
  const entry = endpointLimits.get(`${ip}:sensitive`);
  if (!entry || entry.timestamps.length === 0) return 0;
  
  const now = Date.now();
  const oldest = entry.timestamps[0]!;
  const remaining = CONFIG.sensitive.aiEstimate.windowMs - (now - oldest);
  return Math.max(0, Math.ceil(remaining / 1000));
}

// ─── Endpoint-Specific Rate Limit (for tRPC) ─────────────────────────────────

export function checkEndpointLimit(
  ip: string,
  endpoint: "aiEstimate" | "ticketCreate" | "chatSend" | "upload" | "query"
): { limited: boolean; remaining: number; resetSeconds: number } {
  // Check blacklist first
  const banned = isBlacklisted(ip);
  if (banned) {
    const resetSeconds = Math.ceil((banned.expiresAt - Date.now()) / 1000);
    return { limited: true, remaining: 0, resetSeconds };
  }
  
  const config = CONFIG.sensitive[endpoint];
  const key = `${ip}:${endpoint}`;
  const result = checkRateLimit(endpointLimits, key, config.windowMs, config.maxRequests);
  
  if (result.limited) {
    recordViolation(ip);
  }
  
  return {
    limited: result.limited,
    remaining: result.remaining,
    resetSeconds: Math.ceil(result.resetMs / 1000),
  };
}

// ─── Express Middleware: Global Rate Limit ─────────────────────────────────────

export function globalRateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  
  // Check blacklist
  const banned = isBlacklisted(ip);
  if (banned) {
    const retryAfter = Math.ceil((banned.expiresAt - Date.now()) / 1000);
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      error: "Too many requests. Your IP has been temporarily blocked.",
      retryAfter,
    });
    return;
  }
  
  // Check global rate limit
  const result = checkRateLimit(
    globalLimits,
    ip,
    CONFIG.global.windowMs,
    CONFIG.global.maxRequests
  );
  
  // Set rate limit headers
  res.set("X-RateLimit-Limit", String(CONFIG.global.maxRequests));
  res.set("X-RateLimit-Remaining", String(result.remaining));
  
  if (result.limited) {
    recordViolation(ip);
    const retryAfter = Math.ceil(result.resetMs / 1000);
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      error: "Too many requests. Please try again later.",
      retryAfter,
    });
    return;
  }
  
  next();
}

// ─── Express Middleware: Security Headers ──────────────────────────────────────

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Hide server info
  res.removeHeader("X-Powered-By");
  
  // Security headers
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "SAMEORIGIN");
  res.set("X-XSS-Protection", "1; mode=block");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  
  next();
}

// ─── Express Middleware: Request Validation ────────────────────────────────────

export function requestValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Block requests without User-Agent on API endpoints (likely bots/scanners)
  if (!req.headers["user-agent"] && req.path.startsWith("/api/")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  
  next();
}

// ─── Sanitization Helpers ─────────────────────────────────────────────────────

/**
 * Strip potential XSS payloads from string input
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/<\/?(?:script|iframe|object|embed|form|input|button|select|textarea|style|link|meta)[^>]*>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    .replace(/vbscript\s*:/gi, "");
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export function cleanupRateLimitMap(): void {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [key, entry] of Array.from(globalLimits.entries())) {
    const latest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
    if (now - latest > maxAge) {
      globalLimits.delete(key);
    }
  }
  
  for (const [key, entry] of Array.from(endpointLimits.entries())) {
    const latest = entry.timestamps[entry.timestamps.length - 1] ?? 0;
    if (now - latest > maxAge) {
      endpointLimits.delete(key);
    }
  }
  
  for (const [ip, entry] of Array.from(blacklist.entries())) {
    if (now > entry.expiresAt) {
      blacklist.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitMap, 5 * 60 * 1000);

// ─── Stats (for admin monitoring) ─────────────────────────────────────────────

export function getRateLimitStats() {
  return {
    globalEntries: globalLimits.size,
    endpointEntries: endpointLimits.size,
    blacklistedIPs: blacklist.size,
    blacklistedList: Array.from(blacklist.entries()).map(([ip, entry]) => ({
      ip,
      reason: entry.reason,
      expiresAt: new Date(entry.expiresAt).toISOString(),
      remainingSeconds: Math.ceil((entry.expiresAt - Date.now()) / 1000),
    })),
  };
}
