const fs = require('fs');
const svg2img = require('svg2img');
const path = require('path');

// Read SVG content
const svgContent = fs.readFileSync('favicon.svg', 'utf8');

// Convert SVG to PNG with multiple sizes (16x16, 32x32, 48x48)
const sizes = [16, 32, 48];
const images = [];

// Function to create PNG buffers for each size
const createPngBuffers = () => {
  return Promise.all(sizes.map(size => {
    return new Promise((resolve, reject) => {
      svg2img(svgContent, { width: size, height: size }, (err, buffer) => {
        if (err) return reject(err);
        
        // Save individual PNG files for reference
        fs.writeFileSync(`favicon-${size}.png`, buffer);
        
        resolve({
          size,
          buffer
        });
      });
    });
  }));
};

// Execute conversion and write to ico format
createPngBuffers()
  .then(pngBuffers => {
    console.log('PNG buffers created successfully');
    
    // Create simple favicon.ico (just using the 32x32 version for now)
    // For a proper ICO file with multiple sizes, you might need a specialized package
    const favicon32 = pngBuffers.find(item => item.size === 32);
    if (favicon32) {
      fs.writeFileSync('favicon.ico', favicon32.buffer);
      console.log('favicon.ico created successfully');
    }
  })
  .catch(err => {
    console.error('Error creating favicon:', err);
  }); 