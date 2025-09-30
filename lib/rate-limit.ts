import { NextRequest } from "next/server";

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per 15 minutes
};

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = defaultConfig
): { success: boolean; remaining: number; resetTime: number } {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  // const windowStart = now - config.windowMs; // Not currently used

  // Clean up expired entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }

  const current = rateLimitMap.get(ip);

  if (!current) {
    // First request from this IP
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (current.resetTime < now) {
    // Window has expired, reset
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment count
  current.count++;
  rateLimitMap.set(ip, current);

  return {
    success: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}
