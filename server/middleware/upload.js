const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files. Be permissive on mimetype but verify extension too.
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/pjpeg', 'image/x-png', 'image/webp'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isMimeOk = !!file.mimetype && (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/'));
    const isExtOk = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

    if (isMimeOk && isExtOk) {
      return cb(null, true);
    }

    // Log details to help debugging unexpected mimetypes/extensions
    console.warn('Rejected file upload - mimetype:', file.mimetype, 'ext:', ext, 'originalname:', file.originalname);
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
  }
});

module.exports = upload;