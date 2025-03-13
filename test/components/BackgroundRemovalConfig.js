import { removeBackground } from '@imgly/background-removal';

// This function can be used to initialize the background removal library with custom configurations
export const configureBackgroundRemoval = async () => {
  try {
    console.log('Configuring background removal library...');
    
    // The @imgly/background-removal library doesn't have an 'init' function
    // Instead, we can test if the removeBackground function is available
    if (typeof removeBackground !== 'function') {
      throw new Error('removeBackground is not a function');
    }
    
    // No explicit initialization needed - the library is ready to use
    console.log('Background removal library is available');
    
    // We'll do a simple test to verify the library is working by checking its type
    console.log('Function type check:', typeof removeBackground);
    
    return true;
  } catch (error) {
    console.error('Error configuring background removal library:', error);
    return false;
  }
};

// Export model file paths if you need to download and host them locally
export const modelFiles = {
  onnxModelUrl: 'https://unpkg.com/@imgly/background-removal@1.6.0/dist/model.onnx',
  wasmUrl: 'https://unpkg.com/@imgly/background-removal@1.6.0/dist/ort-wasm.wasm',
  wasmSimdUrl: 'https://unpkg.com/@imgly/background-removal@1.6.0/dist/ort-wasm-simd.wasm',
  wasmThreadedUrl: 'https://unpkg.com/@imgly/background-removal@1.6.0/dist/ort-wasm-threaded.wasm',
  wasmSimdThreadedUrl: 'https://unpkg.com/@imgly/background-removal@1.6.0/dist/ort-wasm-simd-threaded.wasm',
}; 