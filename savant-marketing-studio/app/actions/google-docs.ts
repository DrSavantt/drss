'use server';

/**
 * Google Docs Integration for Research Export
 * 
 * MVP Implementation: Opens a new Google Doc with content ready to paste
 * Full implementation would require Google OAuth and Docs API
 */

export interface GoogleDocResult {
  url: string;
  success: boolean;
  message?: string;
}

/**
 * Create a Google Doc with research content
 * 
 * MVP: Opens Google Docs with a pre-filled title
 * User can paste the content (which is copied to clipboard)
 * 
 * Future: Use Google Docs API with OAuth to programmatically create and populate
 */
export async function createGoogleDoc(
  title: string,
  content: string
): Promise<GoogleDocResult> {
  try {
    // Encode title for URL
    const encodedTitle = encodeURIComponent(title);
    
    // For MVP, open a new Google Doc with the title
    // The user will need to paste the content (we'll copy it to clipboard on the client side)
    const docUrl = `https://docs.google.com/document/create?title=${encodedTitle}`;
    
    return {
      url: docUrl,
      success: true,
      message: 'Opening Google Docs. Content copied to clipboard - paste it into the document.',
    };
  } catch (error) {
    console.error('Failed to create Google Doc URL:', error);
    return {
      url: '',
      success: false,
      message: 'Failed to create Google Doc link',
    };
  }
}

/**
 * Export research to Google Docs with formatting
 * Converts markdown-style content to Google Docs format
 */
export async function exportResearchToGoogleDocs(
  title: string,
  content: string,
  sources?: Array<{ title: string; url: string }>
): Promise<GoogleDocResult> {
  // Format content for better pasting into Google Docs
  let formattedContent = content;
  
  // Add sources section if provided
  if (sources && sources.length > 0) {
    formattedContent += '\n\n---\n\n## Sources\n\n';
    sources.forEach((source, i) => {
      formattedContent += `[${i + 1}] ${source.title}\n${source.url}\n\n`;
    });
  }
  
  return createGoogleDoc(title, formattedContent);
}

/* 
 * FUTURE IMPLEMENTATION: Google Docs API with OAuth
 * 
 * Requirements:
 * 1. Add Google OAuth to Next-Auth or Supabase Auth
 * 2. Store access tokens for users
 * 3. Install googleapis package: npm install googleapis
 * 4. Implement the following:
 * 
 * import { google } from 'googleapis';
 * 
 * export async function createGoogleDocWithAPI(
 *   accessToken: string,
 *   title: string,
 *   content: string
 * ) {
 *   const auth = new google.auth.OAuth2();
 *   auth.setCredentials({ access_token: accessToken });
 *   
 *   const docs = google.docs({ version: 'v1', auth });
 *   
 *   // Create document
 *   const doc = await docs.documents.create({
 *     requestBody: { title },
 *   });
 *   
 *   // Insert content with formatting
 *   await docs.documents.batchUpdate({
 *     documentId: doc.data.documentId!,
 *     requestBody: {
 *       requests: [
 *         {
 *           insertText: {
 *             location: { index: 1 },
 *             text: content,
 *           },
 *         },
 *       ],
 *     },
 *   });
 *   
 *   return {
 *     documentId: doc.data.documentId,
 *     url: `https://docs.google.com/document/d/${doc.data.documentId}/edit`,
 *   };
 * }
 */

