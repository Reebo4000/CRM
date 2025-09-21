const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Use the same upload path as the upload middleware
const uploadsDir = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

console.log('🖼️  Uploads route loaded successfully');

/**
 * @route   OPTIONS /uploads/:filename
 * @desc    Handle preflight requests for images
 * @access  Public
 */
router.options('/:filename', (req, res) => {
  console.log(`🔄 OPTIONS request for: ${req.params.filename}`);

  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Access-Control-Max-Age': '86400'
  });

  res.status(200).end();
});

/**
 * @route   GET /uploads/:filename
 * @desc    Serve uploaded images with proper CORS headers
 * @access  Public
 */
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  // Log image requests for debugging
  console.log(`� Serving image: ${filename}`);
  console.log(`📁 Looking for file at: ${filePath}`);
  console.log(`📂 Uploads directory: ${uploadsDir}`);

  // Set CORS headers explicitly
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
  });
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'File not found',
      message: 'The requested image does not exist'
    });
  }
  
  // Get file stats for proper headers
  const stat = fs.statSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  
  // Set content type based on file extension
  let contentType = 'application/octet-stream';
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.webp':
      contentType = 'image/webp';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
  }
  
  res.set({
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Last-Modified': stat.mtime.toUTCString(),
    'ETag': `"${stat.size}-${stat.mtime.getTime()}"`
  });
  
  // Stream the file
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  
  stream.on('error', (error) => {
    console.error('Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'File streaming error',
        message: 'Failed to serve the image'
      });
    }
  });
});

module.exports = router;
