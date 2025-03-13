# YoPix - 16×16 Pixel Art Converter

YoPix is a web application that converts any image into a true 16×16 pixel art representation using the open-source [Pixel It](https://github.com/giventofly/pixelit) library. The application is built with Next.js and styled with Tailwind CSS, with Firebase handling backend tasks like image storage.

## Features

- **Accurate 16×16 Pixel Art Output**: Converts any image to exactly 16×16 pixels
- **Advanced Image Preprocessing**:
  - **Interactive Cropping**: Precisely select the portion of your image to convert
  - **Background Removal**: Isolate subjects from their backgrounds using AI
  - **Custom Background Colors**: Choose any color for your background after removal
  - **Zoom Controls**: Fine-tune your crop with intuitive zoom functionality
- **Multiple Upload Options**: Drag & drop, file selection, URL input, or Unsplash search
- **Unsplash Integration**: Search and use high-quality photos directly from Unsplash
- **Client-Side Processing**: All image conversion happens in the browser
- **Modern, Responsive UI**: Two-column layout for desktop and optimized for mobile
- **Preview & Download**: View and download your pixel art creations
- **Share**: Generate shareable links for your pixel art (requires Firebase setup)

## Demo

[Live Demo](https://yopix.vercel.app) (Replace with your actual deployment URL)

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn
- Firebase account (for storage and sharing features)
- Unsplash API key (for Unsplash image search integration)

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

3. Set up Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firebase Storage
   - Create a web app in your Firebase project
   - Copy your Firebase configuration

4. Set up Unsplash:
   - Create a developer account at [Unsplash Developers](https://unsplash.com/developers)
   - Create a new application
   - Copy your Access Key

5. Create a `.env.local` file in the root directory with your configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   
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

## How It Works

YoPix uses a multi-stage process to create high-quality pixel art:

1. **Image Acquisition**: The user can upload an image via drag & drop, file selection, URL, or search Unsplash for high-quality photos.

2. **Image Preprocessing**:
   - **Cropping**: Users can interactively select the most important part of their image
   - **Background Removal**: Powered by [@imgly/background-removal](https://github.com/imgly/background-removal), users can isolate subjects
   - **Background Color**: Users can choose custom colors for removed backgrounds

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
   - The user can download the 16×16 pixel art as a PNG or share it via Firebase Storage

## Deployment

### Vercel (Recommended)

The easiest way to deploy YoPix is to use the [Vercel Platform](https://vercel.com):

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add your environment variables (Firebase and Unsplash configuration).
4. Deploy!

### Firebase Hosting

You can also deploy to Firebase Hosting:

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize your project:
   ```bash
   firebase init
   ```

4. Build your Next.js app:
   ```bash
   npm run build
   # or
   yarn build
   ```

5. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Dependencies & Acknowledgments

- [@imgly/background-removal](https://github.com/imgly/background-removal) - AI-powered background removal
- [react-easy-crop](https://github.com/ricardo-ch/react-easy-crop) - Interactive image cropping
- [Pixel It](https://github.com/giventofly/pixelit) - The open-source library that powers the pixel art conversion
- [Next.js](https://nextjs.org/) - The React framework used for building the UI
- [Tailwind CSS](https://tailwindcss.com/) - For styling the application
- [Firebase](https://firebase.google.com/) - For backend services and storage
- [Unsplash API](https://unsplash.com/developers) - For high-quality, free-to-use images

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Environment Setup

This project uses environment variables for configuration. To set up your local environment:

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your credentials in the `.env.local` file:
   - For Firebase configuration, create a project at [Firebase Console](https://console.firebase.google.com/)
   - For Unsplash API, register for a developer account at [Unsplash Developers](https://unsplash.com/developers)

3. Make sure not to commit your `.env.local` file with real credentials to GitHub! # https://github.com/trywait/yopix.git
