import rateLimit from 'express-rate-limit';

// Base configuration for rate limiting
const baseConfig = {
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.',
};

// Strict rate limiting for resource-intensive operations (AI generation)
export const strictLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Rate limit exceeded for AI generation. Please try again later or use alternative methods.',
});

// Standard rate limiting for API-dependent operations (Unsplash, Yoto)
export const standardLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

// Lenient rate limiting for basic operations (asset proxying)
export const lenientLimiter = rateLimit({
  ...baseConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requests per window
});

// Helper function to combine rate limiter with CORS
export const withRateLimit = (handler, limiter) => {
  return async (req, res) => {
    return new Promise((resolve, reject) => {
      limiter(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(handler(req, res));
      });
    });
  };
}; 