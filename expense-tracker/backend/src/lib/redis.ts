import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Session TTL: 7 days in seconds
export const SESSION_TTL = 60 * 60 * 24 * 7;

// Dashboard cache TTL: 60 seconds
export const CACHE_TTL = 60;

export const getSessionKey = (token: string) => `session:${token}`;
export const getDashboardCacheKey = (userId: string) => `dashboard:${userId}`;
export const getAnalyticsCacheKey = (userId: string, type: string) => `analytics:${userId}:${type}`;
