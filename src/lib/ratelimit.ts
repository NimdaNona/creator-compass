/**
 * Rate limiter implementation for AI API calls
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private tokensPerInterval: number;
  private intervalMs: number;
  private fireImmediately: boolean;

  constructor(options: {
    tokensPerInterval: number;
    interval: 'second' | 'minute' | 'hour';
    fireImmediately?: boolean;
  }) {
    this.tokensPerInterval = options.tokensPerInterval;
    this.intervalMs = this.getIntervalMs(options.interval);
    this.fireImmediately = options.fireImmediately || false;
  }

  private getIntervalMs(interval: 'second' | 'minute' | 'hour'): number {
    switch (interval) {
      case 'second': return 1000;
      case 'minute': return 60000;
      case 'hour': return 3600000;
    }
  }

  async check(identifier: string): Promise<{ success: boolean; remaining?: number; resetIn?: number }> {
    const now = Date.now();
    const key = identifier;
    const entry = this.requests.get(key);

    // Clean up old entries
    this.cleanup();

    if (!entry || now > entry.resetTime) {
      // First request or reset period has passed
      this.requests.set(key, { 
        count: 1, 
        resetTime: now + this.intervalMs 
      });
      return { 
        success: true, 
        remaining: this.tokensPerInterval - 1,
        resetIn: this.intervalMs
      };
    }

    if (entry.count >= this.tokensPerInterval) {
      // Rate limit exceeded
      return { 
        success: false, 
        remaining: 0,
        resetIn: entry.resetTime - now
      };
    }

    // Increment counter
    entry.count++;
    return { 
      success: true, 
      remaining: this.tokensPerInterval - entry.count,
      resetIn: entry.resetTime - now
    };
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Remove expired entries to prevent memory leak
    this.requests.forEach((entry, key) => {
      if (now > entry.resetTime + this.intervalMs) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.requests.delete(key));
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string) {
    this.requests.delete(identifier);
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(identifier: string): { used: number; total: number; resetIn: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      return { used: 0, total: this.tokensPerInterval, resetIn: 0 };
    }

    return {
      used: entry.count,
      total: this.tokensPerInterval,
      resetIn: Math.max(0, entry.resetTime - now)
    };
  }
}

/**
 * Create a shared rate limiter instance for general API calls
 */
export const apiRateLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute',
  fireImmediately: true,
});

/**
 * Create a stricter rate limiter for expensive operations
 */
export const expensiveOpRateLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: 'hour',
  fireImmediately: false,
});