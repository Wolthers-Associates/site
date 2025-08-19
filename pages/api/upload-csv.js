import formidable from 'formidable';
import fs from 'fs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      uploadDir: './public/mails',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      filename: (name, ext) => {
        // Generate timestamp-based filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `upload_${timestamp}${ext}`;
      }
    });

    // Ensure upload directory exists
    const uploadDir = './public/mails';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const [, files] = await form.parse(req);
    
    if (!files.csvFile || !files.csvFile[0]) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const file = files.csvFile[0];
    
    // Validate file type
    if (!file.originalFilename?.endsWith('.csv')) {
      // Clean up uploaded file
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ error: 'File must be a CSV' });
    }

    // Validate CSV content (basic check)
    try {
      const csvContent = fs.readFileSync(file.filepath, 'utf8');
      const lines = csvContent.split('\n');
      
      if (lines.length < 2) {
        fs.unlinkSync(file.filepath);
        return res.status(400).json({ error: 'CSV file appears to be empty or invalid' });
      }

      // Check for expected headers
      const headers = lines[0].toLowerCase();
      const requiredHeaders = ['sender_address', 'origin_timestamp_utc'];
      const hasRequiredHeaders = requiredHeaders.some(header => 
        headers.includes(header.toLowerCase())
      );

      if (!hasRequiredHeaders) {
        fs.unlinkSync(file.filepath);
        return res.status(400).json({ 
          error: 'CSV must contain sender_address and origin_timestamp_utc columns' 
        });
      }

      // Log successful upload
      console.log(`CSV uploaded successfully: ${file.newFilename} by ${session.user.email}`);

      res.status(200).json({
        success: true,
        filename: file.newFilename,
        size: file.size,
        message: 'CSV uploaded successfully. Refresh the page to see new data.'
      });

    } catch (parseError) {
      // Clean up file on parse error
      fs.unlinkSync(file.filepath);
      return res.status(400).json({ 
        error: 'Invalid CSV format: ' + parseError.message 
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed: ' + error.message 
    });
  }
}