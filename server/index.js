/**
 * OnlyOffice Document Server Backend
 *
 * Provides APIs for:
 * - File upload
 * - File download (for OnlyOffice to access)
 * - Callback handling (for save events from OnlyOffice)
 * - File listing
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
// For Docker container to access host machine - use actual network IP
// host.docker.internal gets blocked as meta IP, localhost gets blocked as private IP
const DOCKER_HOST = process.env.DOCKER_HOST || '192.168.31.14';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow Office documents and PDFs
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
      'application/msword', // doc
      'application/vnd.ms-excel', // xls
      'application/vnd.ms-powerpoint', // ppt
      'application/pdf',
    ];
    const allowedExtensions = [
      '.docx',
      '.doc',
      '.xlsx',
      '.xls',
      '.pptx',
      '.ppt',
      '.pdf',
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Office documents and PDFs are allowed'));
    }
  },
});

// In-memory file metadata storage (use database in production)
const fileMetadata = new Map();

/**
 * GET /api/files
 * List all uploaded files
 */
app.get('/api/files', (req, res) => {
  const files = Array.from(fileMetadata.values());
  res.json({ success: true, files });
});

/**
 * POST /api/upload
 * Upload a new document
 */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const { filename, originalname, size, mimetype } = req.file;
  const fileInfo = {
    id: filename.replace(/\.[^.]+$/, ''), // Remove extension for ID
    filename,
    originalName: originalname,
    size,
    mimetype,
    uploadedAt: new Date().toISOString(),
    // Generate a unique key for OnlyOffice (required for document tracking)
    documentKey: uuidv4(),
  };

  fileMetadata.set(fileInfo.id, fileInfo);

  res.json({
    success: true,
    file: fileInfo,
    downloadUrl: `http://localhost:${PORT}/api/files/${filename}`,
  });
});

/**
 * GET /api/files/:filename
 * Download/serve a file (used by OnlyOffice Document Server)
 */
app.get('/api/files/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  res.sendFile(filePath);
});

/**
 * DELETE /api/files/:id
 * Delete a file
 */
app.delete('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const fileInfo = fileMetadata.get(id);

  if (!fileInfo) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  const filePath = path.join(UPLOADS_DIR, fileInfo.filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    fileMetadata.delete(id);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/callback
 * OnlyOffice callback handler for document save events
 *
 * Status codes from OnlyOffice:
 * 0 - No document with the given key
 * 1 - Document being edited
 * 2 - Document ready for saving
 * 3 - Document saving error
 * 4 - Document closed with no changes
 * 6 - Document being edited, but saved
 * 7 - Forceful save error
 */
app.post('/api/callback', async (req, res) => {
  const { key, status, url } = req.body;

  console.log('OnlyOffice callback received:', { key, status, url });

  // Find file by document key
  let targetFile = null;
  for (const [id, file] of fileMetadata) {
    if (file.documentKey === key) {
      targetFile = { id, ...file };
      break;
    }
  }

  if (!targetFile) {
    console.log('File not found for key:', key);
    return res.json({ error: 0 }); // Return error: 0 to acknowledge
  }

  // Status 2 or 6: Document ready for saving
  if (status === 2 || status === 6) {
    try {
      // Download the edited document from OnlyOffice
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const filePath = path.join(UPLOADS_DIR, targetFile.filename);

      fs.writeFileSync(filePath, buffer);
      console.log('Document saved:', targetFile.filename);

      // Update document key for next edit session
      const updatedFile = fileMetadata.get(targetFile.id);
      if (updatedFile) {
        updatedFile.documentKey = uuidv4();
        updatedFile.updatedAt = new Date().toISOString();
        fileMetadata.set(targetFile.id, updatedFile);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      return res.json({ error: 1 });
    }
  }

  // Return error: 0 to indicate success
  res.json({ error: 0 });
});

/**
 * GET /api/config/:id
 * Get OnlyOffice configuration for a specific document
 */
app.get('/api/config/:id', (req, res) => {
  const { id } = req.params;
  const { edit } = req.query;
  const fileInfo = fileMetadata.get(id);

  if (!fileInfo) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  const ext = path.extname(fileInfo.filename).slice(1).toLowerCase();

  // Determine document type
  let documentType = 'word';
  const docTypes = ['doc', 'docx', 'odt', 'rtf', 'txt', 'pdf'];
  const spreadsheetTypes = ['xls', 'xlsx', 'ods', 'csv'];
  const presentationTypes = ['ppt', 'pptx', 'odp'];

  if (spreadsheetTypes.includes(ext)) {
    documentType = 'cell';
  } else if (presentationTypes.includes(ext)) {
    documentType = 'slide';
  }

  const isEditable = edit === 'true' && ext !== 'pdf';

  const config = {
    document: {
      fileType: ext,
      key: fileInfo.documentKey,
      title: fileInfo.originalName,
      url: `http://${DOCKER_HOST}:${PORT}/api/files/${fileInfo.filename}`,
      permissions: {
        edit: isEditable,
        download: true,
        print: true,
        review: isEditable,
        comment: isEditable,
      },
    },
    documentType,
    editorConfig: {
      callbackUrl: `http://${DOCKER_HOST}:${PORT}/api/callback`,
      lang: 'zh-CN',
      mode: isEditable ? 'edit' : 'view',
      customization: {
        autosave: true,
        chat: false,
        comments: true,
        help: false,
        plugins: false,
        forcesave: true,
      },
      user: {
        id: 'user-1',
        name: '测试用户',
      },
    },
    width: '100%',
    height: '100%',
  };

  res.json({ success: true, config });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ success: false, error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`OnlyOffice backend server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});
