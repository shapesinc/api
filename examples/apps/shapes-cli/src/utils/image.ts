import fs from 'fs/promises';
import path from 'path';

interface ImageUploadResult {
  dataUrl: string;
  filename: string;
  size: number;
}

export async function listImageFiles(): Promise<string[]> {
  try {
    const currentDir = process.cwd();
    const files = await fs.readdir(currentDir);

    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    return imageFiles.sort();
  } catch (error) {
    throw new Error(`Failed to list files: ${(error as Error).message}`);
  }
}

export async function uploadImage(filename?: string): Promise<ImageUploadResult> {
  try {
    let filePath: string;
    let displayFilename: string;

    if (filename) {
      // User specified a filename - could be relative or absolute path
      if (path.isAbsolute(filename)) {
        filePath = filename;
        displayFilename = path.basename(filename);
      } else {
        filePath = path.resolve(process.cwd(), filename);
        displayFilename = filename;
      }
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new Error(`File "${filename}" not found`);
      }

      // Check if it's an image file
      const ext = path.extname(filePath).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        throw new Error(`File "${filename}" is not a supported image format (jpg, jpeg, png, gif, webp)`);
      }
    } else {
      // Auto-select first image file from current directory
      const imageFiles = await listImageFiles();
      
      if (imageFiles.length === 0) {
        throw new Error('No image files found in current directory');
      }
      
      displayFilename = imageFiles[0];
      filePath = path.join(process.cwd(), displayFilename);
    }

    const fileContent = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    // Convert to base64 data URL
    const base64 = fileContent.toString('base64');
    const contentType = getContentType(filePath);
    
    return {
      dataUrl: `data:${contentType};base64,${base64}`,
      filename: displayFilename,
      size: stats.size,
    };
  } catch (error) {
    throw error; // Re-throw with original message
  }
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return contentTypes[ext] || 'application/octet-stream';
}