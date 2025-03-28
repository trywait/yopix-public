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
  - **AI Generation**: Create custom pixel art using [Google Gemini 2.0 Flash](https://ai.google.dev/gemini-api)
- **Advanced Pixel Editing**:
  - **Color Palette**: Choose from 2 to 256 colors
  - **Interactive Editor**: Fine-tune your pixel art with a powerful editor
  - **Eyedropper Tool**: Pick colors from your image
  - **Undo/Redo**: Track your changes with history
- **Client-Side Processing**: All image conversion happens in the browser
- **Modern, Responsive UI**: Two-column layout for desktop and optimized for mobile
- **Preview & Download**: View and download your pixel art creations

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
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Click on "APIs & Services" > "Library"
   - Search for "Gemini API" and click "Enable"
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
   - (Optional) Click "Edit" on the API key to restrict it to specific domains/IPs

4. Set up Unsplash:
   - Go to [Unsplash Developers](https://unsplash.com/developers)
   - Sign up for a developer account
   - Click "Your apps" > "New Application"
   - Accept the terms and conditions
   - Give your app a name and description
   - Copy your "Access Key" (not the Secret Key)

5. Create a `.env.local` file in the root directory:
   ```bash
   # Create the file
   touch .env.local
   ```
   
   Add your API keys to the file:
   ```
   # Required API Keys
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
   ```
   
   Replace `your_google_ai_api_key_here` and `your_unsplash_access_key_here` with the actual keys you copied.

6. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

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
