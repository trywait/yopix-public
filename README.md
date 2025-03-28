# YoPix - 16×16 Pixel Art Converter

YoPix is a web application that converts any image into a true 16×16 pixel art representation using the open-source [Pixel It](https://github.com/giventofly/pixelit) library. The application is built with [Next.js](https://nextjs.org/) and styled with [Tailwind CSS](https://tailwindcss.com/).

## Features

- **Accurate 16×16 Pixel Art Output**: Converts any image to exactly 16×16 pixels
- **Advanced Image Preprocessing**:
  - **Interactive Cropping**: Precisely select the portion of your image to convert
  - **Background Removal**: Isolate subjects from their backgrounds using AI
- **Multiple Image Sources**:
  - **File Upload**: Drag & drop or file selection
  - **URL Input**: Direct image URL input
  - **Unsplash Search**: Browse and use high-quality photos from [Unsplash](https://unsplash.com)
  - **Yoto Icons**: Search and edit pixel-perfect icons from [Yoto Icons](https://www.yotoicons.com)
  - **AI Generation**: Create custom pixel art using [Google Gemini 2.0 Flash](https://ai.google.dev/gemini-api) with:
    - Simple text prompts (e.g., "dog", "car", "house")
    - Input validation for safe prompt handling
    - Automatic pixel art style enhancement
    - Multiple variations per prompt
- **Advanced Pixel Editing**:
  - **Color Palette**: Choose from 2 to 256 colors
  - **Interactive Editor**: Fine-tune your pixel art with a powerful editor
  - **Eyedropper Tool**: Pick colors from your image
  - **Undo/Redo**: Track your changes with history
- **Client-Side Processing**: All image conversion happens in the browser
- **Modern, Responsive UI**: Two-column layout for desktop and optimized for mobile
- **Preview & Download**: View and download your pixel art creations
- **Share**: Download and share your pixel art creations

## Demo

[Live Demo](https://yopix.vercel.app) (Replace with your actual deployment URL)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 14.x or later
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Google AI](https://ai.google.dev/) API key (for AI image generation)
- [Unsplash](https://unsplash.com/developers) API key (for image search integration)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/trywait/yopix.git
   cd yopix
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
   This will automatically download the required AI model files for background removal.

3. Set up Google AI:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the [Gemini API](https://ai.google.dev/gemini-api) in the API Library
   - Go to Credentials > Create Credentials > API Key
   - Copy your API key
   - (Optional) Restrict the API key to specific domains/IPs for security

4. Set up Unsplash:
   - Go to [Unsplash Developers](https://unsplash.com/developers)
   - Sign up for a developer account
   - Create a new application
   - Note your Access Key
   - Review the [API Guidelines](https://unsplash.com/documentation) for usage limits

5. Create a `.env.local` file in the root directory with your configuration:
   ```
   # Google AI API credentials
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   
   # Unsplash API credentials
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   ```

6. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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

## How It Works

YoPix uses a multi-stage process to create high-quality pixel art:

1. **Image Acquisition**: The user can upload an image via drag & drop, file selection, URL, search Unsplash for high-quality photos, search Yoto Icons, or generate with AI.

2. **Image Preprocessing**:
   - **Cropping**: Users can interactively select the most important part of their image
   - **Background Removal**: Powered by [@imgly/background-removal](https://github.com/imgly/background-removal), users can isolate subjects

3. **Pixel Art Conversion**:
   - A canvas element is created with dimensions of 16×16 pixels
   - Pixel It processes the preprocessed image with the following configuration:
     ```javascript
     const config = {
       to: canvas,
       from: img,
       maxWidth: 16,
       maxHeight: 16,
       scale: 1
     };
     ```

4. **Preview and Download**:
   - The processed image is displayed in the UI with an upscaled view for better visibility
   - The user can download the 16×16 pixel art as a PNG

## Deployment

### Vercel (Recommended)

The easiest way to deploy YoPix is to use the [Vercel Platform](https://vercel.com):

1. Push your code to a [GitHub](https://github.com) repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Add your environment variables (Google AI and Unsplash configuration)
6. Click "Deploy"

## Dependencies & Acknowledgments

- [@google/generative-ai](https://github.com/google/generative-ai) - Google's Generative AI SDK for image generation
- [@imgly/background-removal](https://github.com/imgly/background-removal) - AI-powered background removal
- [react-easy-crop](https://github.com/ricardo-ch/react-easy-crop) - Interactive image cropping
- [react-dropzone](https://github.com/react-dropzone/react-dropzone) - Drag and drop file upload
- [react-colorful](https://github.com/omgovich/react-colorful) - Color picker component
- [Pixel It](https://github.com/giventofly/pixelit) - The open-source library that powers the pixel art conversion
- [Next.js](https://nextjs.org/) - The React framework used for building the UI
- [Tailwind CSS](https://tailwindcss.com/) - For styling the application
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) - Rate limiting middleware
- [Unsplash API](https://unsplash.com/developers) - For high-quality, free-to-use images
- [Yoto Icons](https://www.yotoicons.com/) - For high-quality pixel art icons

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Environment Setup

This project uses environment variables for configuration. To set up your local environment:

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Configure your environment variables:
   ```bash
   # Required API Keys
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here

   # Optional Configuration
   # See .env.local.example for all available options
   ```

3. Security Best Practices:
   - Never commit `.env.local` to version control
   - Use secure secrets management in production
   - Follow the principle of least privilege for API keys
   - Implement appropriate rate limiting for your use case

### Security Features

The application implements several security measures:

1. **Rate Limiting**:
   - Configurable request limits
   - Protection against abuse
   - Development mode options

2. **Input Validation**:
   - URL and file validation
   - Content type verification
   - Size restrictions

3. **Resource Protection**:
   - Request timeouts
   - File size limits
   - Response caching
   - Error handling

4. **Security Headers**:
   - Industry-standard security headers
   - CORS protection
   - Cache control

### AI Image Generation

The application includes built-in prompt enhancement for AI image generation:

1. **Input Guidelines**:
   - Use clear, simple descriptions
   - Follow standard text input practices
   - Keep prompts concise

2. **Automatic Enhancement**:
   The application automatically optimizes prompts for pixel art generation with:
   - Style requirements
   - Composition guidelines
   - Aesthetic specifications

3. **Multiple Variations**:
   - Generate multiple options
   - Select preferred version
   - Convert to 16×16 pixel art

4. **Customization**:
   The prompt enhancement can be customized through environment variables.
   See `.env.local.example` for available options.

### Development Mode

For local development:
1. Copy `.env.local.example` to `.env.local`
2. Configure your development settings
3. Refer to the example file for available options

```bash
# Rate limiting configuration
RATE_LIMIT_ENABLED=true           # Enable/disable rate limiting
RATE_LIMIT_WINDOW_MS=900000      # Time window in milliseconds (default: 15 minutes)
RATE_LIMIT_MAX_REQUESTS=100      # Maximum requests per window (default: 100)
```

#### Development Mode
For local development, you can disable rate limiting by setting:
```bash
RATE_LIMIT_ENABLED=false
```

#### Production Mode
For production deployments, it's recommended to:
1. Enable rate limiting (`RATE_LIMIT_ENABLED=true`)
2. Adjust the window time and request limits based on your needs
3. Monitor the rate limit headers in responses:
   - `X-RateLimit-Limit`: Maximum requests per window
   - `X-RateLimit-Remaining`: Remaining requests in current window
   - `X-RateLimit-Reset`: Time when the rate limit window resets

#### Rate Limit Headers
The API includes standard rate limit headers:
- `X-RateLimit-Limit`: Maximum number of requests allowed per window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time when the rate limit window resets (Unix timestamp)

When rate limits are exceeded, the API will return:
- Status code: 429 (Too Many Requests)
- Response body: `{ "error": "Too many requests from this IP, please try again later." }`