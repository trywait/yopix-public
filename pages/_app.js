import '../styles/globals.css';
import '../public/styles/cursors.css';
import '../public/icons/eyedropper.css';
import '../public/styles/mac-cursors.css';
import Head from 'next/head';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  // Add client-side error handling
  useEffect(() => {
    const handleError = (error) => {
      console.error('Global error caught:', error);
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>YoPix - 16×16 Pixel Art Converter</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 