import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const csvDir = path.join(process.cwd(), 'public', 'mails');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    // Read all files in the directory
    const files = fs.readdirSync(csvDir);
    
    // Filter for CSV files and get file stats
    const csvFiles = files
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const filePath = path.join(csvDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          isUpload: file.startsWith('upload_')
        };
      })
      // Sort by modification date (newest first)
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.status(200).json({
      success: true,
      files: csvFiles,
      count: csvFiles.length
    });

  } catch (error) {
    console.error('List CSV files error:', error);
    res.status(500).json({ 
      error: 'Failed to list CSV files: ' + error.message 
    });
  }
}