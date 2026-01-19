/**
 * File processor for extracting content from uploaded files
 * Supports: TXT, MD, PDF, DOCX, Images
 */

/**
 * Fetch file buffer from Supabase Storage URL
 */
export async function fetchFileFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract text content from a file based on its MIME type
 * Returns extracted text or null if unsupported/failed
 */
export async function extractFileContent(
  fileUrl: string,
  fileType: string | null
): Promise<{ text: string | null; isImage: boolean; base64?: string; mediaType?: string }> {
  if (!fileUrl || !fileType) {
    return { text: null, isImage: false };
  }

  try {
    // Handle text files
    if (fileType === 'text/plain' || fileType === 'text/markdown') {
      const buffer = await fetchFileFromUrl(fileUrl);
      return { text: buffer.toString('utf-8'), isImage: false };
    }

    // Handle PDF
    if (fileType === 'application/pdf') {
      return { text: await extractTextFromPDF(fileUrl), isImage: false };
    }

    // Handle DOCX
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return { text: await extractTextFromDOCX(fileUrl), isImage: false };
    }

    // Handle images
    if (fileType.startsWith('image/')) {
      const buffer = await fetchFileFromUrl(fileUrl);
      const base64 = buffer.toString('base64');
      return { 
        text: null, 
        isImage: true, 
        base64,
        mediaType: fileType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      };
    }

    // Unsupported file type
    console.warn(`Unsupported file type for content extraction: ${fileType}`);
    return { text: `[File type "${fileType}" - content extraction not supported]`, isImage: false };

  } catch (error) {
    console.error(`Error extracting content from ${fileType}:`, error);
    return { text: `[Error extracting file content: ${error instanceof Error ? error.message : 'Unknown error'}]`, isImage: false };
  }
}

/**
 * Extract text from PDF file
 * Uses unpdf library (modern, Node.js compatible, no workers needed)
 */
async function extractTextFromPDF(fileUrl: string): Promise<string> {
  // Dynamic import - unpdf works in Node.js without web workers
  const { extractText } = await import('unpdf');
  const buffer = await fetchFileFromUrl(fileUrl);
  
  // Convert Buffer to Uint8Array for unpdf
  const uint8Array = new Uint8Array(buffer);
  const result = await extractText(uint8Array);
  
  // unpdf returns text as array of strings (one per page), join them
  if (Array.isArray(result.text)) {
    return result.text.join('\n\n');
  }
  return typeof result.text === 'string' ? result.text : String(result.text || '');
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(fileUrl: string): Promise<string> {
  // Dynamic import to avoid build issues
  const mammoth = await import('mammoth');
  const buffer = await fetchFileFromUrl(fileUrl);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
