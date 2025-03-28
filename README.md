# YoPix - 16×16 Pixel Art Converter

> 👋 Hey there! Quick heads up: YoPix was built by a dad (me) with zero development experience, paired with AI (I know...) to create a tool I wished existed for my kids and Yoto MYO cards and playlists. The code might be messy, probably breaks a bunch of best practices, and could make seasoned developers cry - but hey, it works! 😅
>
> This project stands on the shoulders of tons of other great projects, using amazing open-source tools like Pixel It, Next.js, and others. Also allows you to search the great resource that is Yoto icons. Please support these original projects and their creators. YoPix is not meant for profit - it's just a fun tool for the community.
>
> Also important to note: This project has no affiliation with Yoto or Yoto Player. I'm just a dad who wanted an easier way to make pixel art for my kids' MYO cards and playlists.

YoPix is a web application that converts any image into a true 16×16 pixel art representation using the open-source [Pixel It](https://github.com/giventofly/pixelit) library. The application is built with [Next.js](https://nextjs.org/) and styled with [Tailwind CSS](https://tailwindcss.com/).

## Features

- **Accurate 16×16 Pixel Art Output**: Converts any image to exactly 16×16 pixels
- **Advanced Image Preprocessing**:
  - **Interactive Cropping**: Precisely select the portion of your image to convert
  - **Background Removal**: Optionally isolate subjects from their backgrounds
- **Multiple Image Sources**:
  - **File Upload**: Drag & drop or file selection
  - **URL Input**: Direct image URL input
  - **Unsplash Search**: Browse and use high-quality photos from [Unsplash](https://unsplash.com)
  - **Yoto Icons**: Search and edit pixel-perfect icons from [Yoto Icons](https://www.yotoicons.com)
  - **AI Generation**: Create custom pixel art using [Google Gemini 2.0 Flash](https://ai.google.dev/gemini-api)
- **Advanced Pixel Editing**:
  - **Color Palette**: Choose from 2 to 256 colors
  - **Interactive Editor**: Fine-tune your pixel art with a powerful editor with standard image editing tools
  - **Undo/Redo**: Track your changes with history
- **Client-Side Processing**: All image conversion happens in the browser
- **Download & Share**: View, download, and share your pixel art creations
- **Built-in Rate Limiting**:
  - AI Generation: 50 requests per 15 minutes
  - API Operations (Unsplash/Yoto): 100 requests per 15 minutes
  - Basic Operations: 200 requests per 5 minutes

## Demo

[Live Demo](https://yopix.vercel.app) (Replace with your actual deployment URL)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or later (LTS version recommended)
- [npm](https://www.npmjs.com/) 9.x or later, or [yarn](https://yarnpkg.com/) 1.22.x or later
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
   # Using npm
   npm install
   
   # OR using yarn
   yarn install
   ```

   This will install all required packages listed in `package.json`, including:
   - Next.js and React
   - Tailwind CSS
   - Image processing libraries
   - UI components
   - API clients

3. Set up Google AI:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy your API key

4. Set up Unsplash:
   - Go to [Unsplash Developers](https://unsplash.com/developers)
   - Sign up for a developer account
   - Create a new application
   - Copy your "Access Key" (not the Secret Key)

5. Create a `.env.local` file in the root directory:
   ```bash
   # Create the file
   touch .env.local
   ```
   
   Add your API keys to the file:
   ```
   # Google AI API Key for Gemini
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

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security Features

### Rate Limiting
The application includes built-in rate limiting to prevent abuse:

- **AI Image Generation**: Limited to 50 requests per 15 minutes per IP
- **API Operations**: Limited to 100 requests per 15 minutes per IP (Unsplash/Yoto)
- **Basic Operations**: Limited to 200 requests per 5 minutes per IP

These limits are configured in `lib/rate-limit.js` and can be adjusted if needed.

#### Modifying Rate Limits
For local development or custom deployments, you can modify the rate limits:

1. Open `lib/rate-limit.js`
2. Adjust the limits in the respective configurations:
   ```javascript
   // For AI Generation
   export const strictLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // Change time window (in milliseconds)
     max: 50,                  // Change max requests
   });

   // For API Operations
   export const standardLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // Change time window (in milliseconds)
     max: 100,                 // Change max requests
   });

   // For Basic Operations
   export const lenientLimiter = rateLimit({
     windowMs: 5 * 60 * 1000,  // Change time window (in milliseconds)
     max: 200,                 // Change max requests
   });
   ```

3. To disable rate limiting for local development:
   ```javascript
   // Create a pass-through limiter
   const disabledLimiter = (req, res, next) => next();
   
   // Replace any limiter with the disabled one
   export const strictLimiter = disabledLimiter;
   export const standardLimiter = disabledLimiter;
   export const lenientLimiter = disabledLimiter;
   ```

**Note**: Be cautious when modifying rate limits in production environments, as they help protect your API keys and prevent abuse.

## How It Works

YoPix uses a multi-stage process to create high-quality pixel art:

1. **Image Acquisition**: Upload an image, use a URL, search Unsplash, use Yoto Icons, or generate with AI.
2. **Image Preprocessing**: Crop and remove backgrounds as needed.
3. **Pixel Art Conversion**: Convert to 16×16 pixels with optimized colors.
4. **Preview and Download**: View and save your creation.

## Deployment

### Vercel (Recommended)

The easiest way to deploy YoPix is to use the [Vercel Platform](https://vercel.com):

1. Push your code to a [GitHub](https://github.com) repository
2. Import your repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add your environment variables
4. Click "Deploy"

## Dependencies & Acknowledgments

- [@google/generative-ai](https://github.com/google/generative-ai) - Google's Generative AI SDK
- [@imgly/background-removal](https://github.com/imgly/background-removal) - AI-powered background removal
- [react-easy-crop](https://github.com/ricardo-ch/react-easy-crop) - Interactive image cropping
- [react-dropzone](https://github.com/react-dropzone/react-dropzone) - Drag and drop file upload
- [react-colorful](https://github.com/omgovich/react-colorful) - Color picker component
- [Pixel It](https://github.com/giventofly/pixelit) - Pixel art conversion library
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Unsplash API](https://unsplash.com/developers) - High-quality images
- [Yoto Icons](https://www.yotoicons.com/) - Pixel art icons

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
