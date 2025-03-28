# YoPix Development Documentation

This document contains implementation details and technical information for developers working on YoPix.

## API Endpoints

### 1. Image Generation (`/api/generate-ai-image`)

```javascript
// Implementation details
const enhancePrompt = (userPrompt) => {
  return `Create a 1:1 pixel art icon of a ${userPrompt} on a black background, with these strict requirements:
  - Always output a square image on a black background.
  - Orient the ${userPrompt} in a way that it is large and takes up the majority of the image frame.
  - When possible, make the subject symmetrical.
  - Use accurate, bright, saturated colors that stand out dramatically against the black background.
  - Create the subject using distinct, solid-colored shapes.
  - Make the subject large and centered, a majority (90%) of the image frame.
  - Utilize a style reminiscent of retro 8-bit video game sprites
  - Maintain simplicity and geometric forms; strictly no gradients or shading.
  - The design should be easily recognizable and effective when scaled down to 16x16 pixels.
  - Exclude any text, borders, or purely decorative elements.`;
};
```

**Rate Limiting Configuration:**
```javascript
// Rate limiting is centralized in lib/rate-limit.js
import { strictLimiter } from '../../lib/rate-limit';

// Strict rate limiting for AI generation (50 requests per 15 minutes)
export default corsMiddleware(withRateLimit(handler, strictLimiter));
```

### 2. Image Fetching (`/api/fetch-image`)

**Validation Rules:**
- Maximum file size: 5MB
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
- Timeout: 15 seconds
- No animated GIFs (checked via frame count)

**Error Response Formats:**
```javascript
// Size limit exceeded
{ error: 'Image size exceeds the 5MB limit' }

// Invalid MIME type
{ error: 'Invalid image type. Supported types: JPEG, PNG, GIF, WebP' }

// Animated GIF
{ error: 'Animated GIFs are not supported. Please upload a static image.' }

// Timeout
{ error: 'Request timed out while fetching image' }
```

### 3. Proxy Endpoints

#### Image Proxy (`/api/proxy-image`)
- Caches responses for 24 hours
- Validates content-type headers
- Enforces size limits
- Strips EXIF data

#### Asset Proxy (`/api/proxy-asset`)
- Whitelisted domains only
- Cache-control headers
- Size and type validation

#### Model Proxy (`/api/proxy-model`)
- ML model file validation
- Checksums verification
- Streaming response handling

## Security Implementation Details

### Rate Limiting
```javascript
// Centralized rate limiting configuration (lib/rate-limit.js)
import rateLimit from 'express-rate-limit';

// Base configuration
const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
};

// Tiered rate limiting
export const strictLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // AI generation
});

export const standardLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // API operations
});

export const lenientLimiter = rateLimit({
  ...baseConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Basic operations
});
```

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yopix.vercel.app'] 
    : ['http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
```

### Response Headers
```javascript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self';"
};
```

## Environment Variables

### Required Variables
```bash
# API Keys
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

### Development Values
```bash
# For local development
NODE_ENV=development
```

## Error Handling

### Common Error Codes
- `ERR_INVALID_INPUT`: Input validation failures
- `ERR_RATE_LIMIT`: Rate limit exceeded
- `ERR_FILE_SIZE`: File size violations
- `ERR_TIMEOUT`: Request timeouts
- `ERR_INVALID_TYPE`: Invalid file types
- `ERR_SERVER`: Internal server errors

### Logging
Production errors are logged with:
- Timestamp
- Error code
- Request ID
- IP address (hashed)
- Endpoint
- Response time

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- -t "Image Generation"
```

### Integration Tests
```bash
# Test image generation flow
curl -X POST http://localhost:3000/api/generate-ai-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' \
  -o test_output.json && \
curl -X POST http://localhost:3000/api/fetch-image \
  -H "Content-Type: application/json" \
  -d "@test_output.json"
```

### Load Testing
```bash
# Using artillery for load testing
npm install -g artillery
artillery run load-tests/basic.yml

# Quick load test with autocannon
npx autocannon -c 100 -d 30 http://localhost:3000/api/fetch-image
```

### Security Testing
```bash
# Test XSS protection
curl -X POST http://localhost:3000/api/generate-ai-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"<script>alert(1)</script>"}'

# Test SQL injection
curl -X POST http://localhost:3000/api/fetch-image \
  -H "Content-Type: application/json" \
  -d '{"url":"'; DROP TABLE users;--"}'
```

## Troubleshooting

### Common Issues

1. **Rate Limiting Issues**
   - Symptom: Too many 429 responses
   - Solution: Check rate limit configuration in `lib/rate-limit.js`
   - Debug: Monitor rate limit headers in responses

2. **Image Processing Failures**
   - Symptom: Timeout or memory errors
   - Solution: Adjust MAX_IMAGE_SIZE and timeout values
   - Debug: Monitor memory usage with `node --inspect`

3. **CORS Errors**
   - Symptom: Preflight failures
   - Solution: Verify CORS configuration
   - Debug: Check browser console network tab

4. **API Key Issues**
   - Symptom: 401 Unauthorized
   - Solution: Verify key restrictions and quotas
   - Debug: Enable API key debug logging

### Performance Optimization

1. **Caching Strategy**
   ```javascript
   const cacheConfig = {
     ttl: 1000 * 60 * 5, // 5 minutes
     max: 100,
     updateAgeOnGet: true
   };
   ```

2. **Memory Management**
   ```javascript
   const gc = global.gc;
   if (gc) {
     setInterval(() => {
       gc();
     }, 30000);
   }
   ```

3. **Request Pipeline**
   ```javascript
   // Optimize request handling
   app.use(compression());
   app.use(express.json({ limit: '1mb' }));
   app.use(express.urlencoded({ extended: true, limit: '1mb' }));
   ```

## Security Details

### URL Validation
```javascript
const validateUrl = (url) => {
  const urlPattern = new RegExp(
    '^https?:\\/\\/' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$',
    'i'
  );
  return urlPattern.test(url);
};
```

### Allowed Domains
```javascript
const allowedDomains = [
  'unsplash.com',
  'githubusercontent.com',
  'cloudfront.net',
  // Add more as needed
];

const isAllowedDomain = (url) => {
  const domain = new URL(url).hostname;
  return allowedDomains.some(d => domain.endsWith(d));
};
```

## Monitoring

### Key Metrics
- Request rate per endpoint
- Error rate by type
- Response times
- Cache hit/miss ratio
- Rate limit triggers
- File size distribution
- API key usage

### Alert Thresholds
- Error rate > 5%
- Response time > 2s
- Rate limit triggers > 100/hour
- Cache miss ratio > 50%

## Development Utilities

### Cleaning Sensitive Data
If you accidentally commit sensitive data (like API keys) to your repository, you can use the `clean-repo.sh` script in the `dev-scripts` directory to remove it from the Git history. This script uses [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) to safely remove sensitive data.

⚠️ **Warning**: This script rewrites Git history. Make sure you have a backup before using it!

```bash
# From the project root
./dev-scripts/clean-repo.sh
```

### Manual Model Download
If you need to manually download the AI model files (e.g., after clearing the cache), you can run:
```bash
node scripts/download-models.js
```

### Implementation Details

#### Pixel Art Conversion Configuration
```javascript
const config = {
  to: canvas,
  from: img,
  maxWidth: 16,
  maxHeight: 16,
  scale: 1
};
```

#### Background Removal
The application uses [@imgly/background-removal](https://github.com/imgly/background-removal) for AI-powered background removal. The model files are automatically downloaded during installation.

## Pixel Art Conversion Process

### Overview
The pixel art conversion process is a multi-stage pipeline that transforms any input image into a high-quality 16x16 pixel art icon. The process uses a combination of image processing techniques and color quantization to achieve the desired result.

### Stages

1. **Image Preprocessing**
   ```javascript
   // Initial image loading and validation
   const img = new Image();
   img.crossOrigin = "Anonymous";
   img.onload = () => processLoadedImage(img);
   img.src = imageUrl;
   ```

2. **Size Normalization**
   - Images are first resized to maintain aspect ratio
   - Maximum dimensions are enforced (16x16)
   - Uses high-quality scaling with disabled image smoothing
   ```javascript
   const scale = Math.min(16 / width, 16 / height);
   const newWidth = width * scale;
   const newHeight = height * scale;
   ```

3. **Color Quantization**
   The process uses adaptive color quantization based on the target color count:
   ```javascript
   // For low color counts (2-8 colors)
   const levels = maxColors <= 8 ? 3 : maxColors <= 16 ? 4 : maxColors <= 32 ? 5 : 6;
   const step = 256 / levels;
   
   // For medium color counts (9-64 colors)
   const step = 16; // 16 levels per channel
   
   // For high color counts (65-256 colors)
   const rLevels = Math.max(6, Math.ceil(rangeR / 42));
   const gLevels = Math.max(6, Math.ceil(rangeG / 42));
   const bLevels = Math.max(6, Math.ceil(rangeB / 42));
   ```

4. **Color Space Conversion**
   - RGB to HSL conversion for better color matching
   - Perceptual color comparison using CIE Lab color space
   ```javascript
   const rgbToHsl = (r, g, b) => {
     r /= 255;
     g /= 255;
     b /= 255;
     // ... conversion logic
   };
   ```

5. **Pixelation**
   - Uses the Pixel It library for the core pixelation process
   - Maintains crisp edges and prevents anti-aliasing
   ```javascript
   ctx.imageSmoothingEnabled = false;
   ctx.webkitImageSmoothingEnabled = false;
   ctx.mozImageSmoothingEnabled = false;
   ```

6. **Color Palette Optimization**
   - Extracts dominant colors from the image
   - Reduces to the specified color count while maintaining visual quality
   - Uses frequency-based color selection
   ```javascript
   const getActualColors = (canvas, maxColors) => {
     // ... color extraction and optimization
   };
   ```

7. **Final Rendering**
   - Creates two versions:
     - 16x16 downloadable version
     - Scaled-up preview version (16x16 * scale)
   ```javascript
   const previewCanvas = document.createElement('canvas');
   const scale = 16;
   previewCanvas.width = 16 * scale;
   previewCanvas.height = 16 * scale;
   ```

### Color Palette Management

The application supports different color palette modes:

1. **Fixed Palette**
   ```javascript
   const defaultPalette = [
     [140, 143, 174], // Cool gray
     [88, 69, 99],    // Deep purple
     [62, 33, 55],    // Dark purple
     // ... more colors
   ];
   ```

2. **Dynamic Palette**
   - Extracts colors from the input image
   - Optimizes for the target color count
   - Maintains color harmony and contrast

3. **Custom Palette**
   - Allows users to specify their own color palette
   - Supports 2-256 colors
   - Validates color values and format

### Performance Optimizations

1. **Canvas Operations**
   - Uses `willReadFrequently` for better performance
   - Minimizes canvas resizing operations
   - Batches pixel operations where possible

2. **Memory Management**
   - Cleans up temporary canvases
   - Releases image resources after processing
   - Uses efficient data structures for color tracking

3. **Processing Pipeline**
   - Parallel processing where possible
   - Caches intermediate results
   - Uses efficient algorithms for color quantization

### Error Handling

The process includes comprehensive error handling:

1. **Input Validation**
   ```javascript
   if (!imageUrl || typeof imageUrl !== 'string') {
     throw new Error('Invalid image URL');
   }
   ```

2. **Processing Errors**
   ```javascript
   try {
     // Processing steps
   } catch (error) {
     console.error('Processing error:', error);
     // Fallback to simpler processing
   }
   ```

3. **Resource Cleanup**
   ```javascript
   finally {
     // Clean up resources
     if (tempCanvas) tempCanvas.remove();
     if (img) img.src = '';
   }
   ```

### Browser Compatibility

The pixelation process is designed to work across modern browsers:

1. **Canvas Support**
   - Uses standard Canvas API
   - Includes vendor prefixes for image smoothing
   - Handles different color space implementations

2. **Memory Considerations**
   - Handles large images gracefully
   - Implements progressive loading
   - Manages memory usage for mobile devices

3. **Performance Fallbacks**
   - Reduces color count on slower devices
   - Implements timeout handling
   - Provides fallback rendering methods