const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const os = require('os');

// Version of the background-removal package
const packageVersion = '1.6.0';

// Model files to download from the correct CDN
const modelFiles = [
  {
    url: `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm.wasm`,
    filename: 'ort-wasm.wasm'
  },
  {
    url: `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd.wasm`,
    filename: 'ort-wasm-simd.wasm'
  },
  {
    url: `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-threaded.wasm`,
    filename: 'ort-wasm-threaded.wasm'
  },
  {
    url: `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/ort-wasm-simd-threaded.wasm`,
    filename: 'ort-wasm-simd-threaded.wasm'
  }
];

// Output directory
const outputDir = path.join(__dirname, '../public/models');

// Make sure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Function to download a file
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    
    // Choose http or https based on the URL
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log(`Redirecting to: ${response.headers.location}`);
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: Status code ${response.statusCode}`));
      }
      
      const file = fs.createWriteStream(outputPath);
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(outputPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        console.log(`Downloaded: ${outputPath} (${fileSizeInMB.toFixed(2)} MB)`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete the file on error
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      console.error(`Error downloading ${url}:`, err.message);
      reject(err);
    });
    
    // Set a timeout (60 seconds)
    request.setTimeout(60000, () => {
      request.abort();
      reject(new Error(`Request timeout for ${url}`));
    });
  });
}

// Function to download and extract the model.onnx file from the package
async function downloadAndExtractModelOnnx() {
  const tempDir = fs.mkdirSync(path.join(os.tmpdir(), 'imgly-model-' + Date.now()), { recursive: true });
  const packageTgzPath = path.join(tempDir, 'package.tgz');
  
  try {
    console.log('Downloading model package...');
    
    // Try different URLs for the package
    const urls = [
      `https://staticimgly.com/@imgly/background-removal-data/${packageVersion}/package.tgz`,
      `https://unpkg.com/@imgly/background-removal-data@${packageVersion}/dist/model.onnx`,
      `https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@${packageVersion}/dist/model.onnx`
    ];
    
    let downloaded = false;
    let error = null;
    
    for (const url of urls) {
      try {
        if (url.endsWith('model.onnx')) {
          // Direct download of model.onnx
          await downloadFile(url, path.join(outputDir, 'model.onnx'));
          console.log('Successfully downloaded model.onnx directly');
          downloaded = true;
          break;
        } else {
          // Download package.tgz
          await downloadFile(url, packageTgzPath);
          
          // Extract the package
          console.log('Extracting package...');
          
          // Create extraction directory
          const extractDir = path.join(tempDir, 'extract');
          fs.mkdirSync(extractDir, { recursive: true });
          
          // Extract the package using tar
          execSync(`tar -xzf "${packageTgzPath}" -C "${extractDir}"`);
          
          // Find and copy the model.onnx file
          const modelPath = path.join(extractDir, 'package', 'dist', 'model.onnx');
          if (fs.existsSync(modelPath)) {
            fs.copyFileSync(modelPath, path.join(outputDir, 'model.onnx'));
            console.log(`Copied model.onnx to ${outputDir}`);
            downloaded = true;
            break;
          } else {
            throw new Error('model.onnx not found in the extracted package');
          }
        }
      } catch (err) {
        console.error(`Failed with URL ${url}:`, err.message);
        error = err;
      }
    }
    
    if (!downloaded) {
      console.error('Failed to download model.onnx from any source');
      if (error) throw error;
    }
    
  } catch (error) {
    console.error('Error downloading and extracting model:', error.message);
    throw error;
  } finally {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('Cleaned up temporary files');
    } catch (err) {
      console.error('Error cleaning up:', err.message);
    }
  }
}

// Download all files
async function downloadAllFiles() {
  console.log('Starting download of model files...');
  
  // First try to download and extract the model.onnx file
  try {
    await downloadAndExtractModelOnnx();
  } catch (error) {
    console.error('Failed to download model.onnx:', error.message);
    console.log('Continuing with WASM files...');
  }
  
  // Download WASM files
  for (const file of modelFiles) {
    const outputPath = path.join(outputDir, file.filename);
    try {
      await downloadFile(file.url, outputPath);
    } catch (error) {
      console.error(`Failed to download ${file.url}:`, error.message);
    }
  }
  
  console.log('Download complete!');
}

// Start the download
downloadAllFiles().catch(console.error); 