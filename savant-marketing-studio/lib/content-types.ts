import {
  LucideIcon,
  FileText,
  Image,
  Search,
  Mail,
  Megaphone,
  BookOpen,
  Globe,
  Share2,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * All valid asset types stored in the database.
 * Includes legacy 'research_pdf' for backward compatibility.
 */
export type AssetType =
  | 'note'
  | 'document'
  | 'image'
  | 'research_report'
  | 'email'
  | 'ad_copy'
  | 'blog_post'
  | 'landing_page'
  | 'social_post'
  | 'research_pdf'; // Legacy type - maps to 'document' for display

/**
 * Configuration for displaying a content type in the UI.
 */
export interface ContentTypeConfig {
  /** Lucide React icon component */
  icon: LucideIcon;
  /** Human-readable label for display */
  label: string;
  /** Tailwind CSS color class (e.g., 'text-blue-500') */
  color: string;
}

/**
 * Option for the content type filter dropdown.
 */
export interface FilterOption {
  /** Value to filter by (matches database asset_type or 'all') */
  value: string;
  /** Human-readable label for the dropdown */
  label: string;
  /** If true, render as a visual separator instead of an option */
  isSeparator?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Readonly array of all valid asset types.
 * Use this for validation and iteration.
 */
export const ASSET_TYPES = [
  'note',
  'document',
  'image',
  'research_report',
  'email',
  'ad_copy',
  'blog_post',
  'landing_page',
  'social_post',
  'research_pdf', // Legacy
] as const;

/**
 * Configuration for each content type including icon, label, and color.
 * 
 * Icon Mapping:
 * - note: FileText (blue) - Manual text content
 * - document: FileText (red) - Uploaded PDFs, Word docs
 * - image: Image (cyan) - Uploaded images
 * - research_report: Search (purple) - AI Deep Research results
 * - email: Mail (green) - AI-generated emails
 * - ad_copy: Megaphone (purple) - AI-generated ad copy
 * - blog_post: BookOpen (orange) - AI-generated blog posts
 * - landing_page: Globe (green) - AI-generated landing pages
 * - social_post: Share2 (pink) - AI-generated social posts
 * - research_pdf: FileText (red) - Legacy uploaded files (same as document)
 */
export const CONTENT_TYPE_CONFIG: Record<AssetType, ContentTypeConfig> = {
  note: {
    icon: FileText,
    label: 'Note',
    color: 'text-blue-500',
  },
  document: {
    icon: FileText,
    label: 'Document',
    color: 'text-red-500',
  },
  image: {
    icon: Image,
    label: 'Image',
    color: 'text-cyan-500',
  },
  research_report: {
    icon: Search,
    label: 'Research',
    color: 'text-purple-500',
  },
  email: {
    icon: Mail,
    label: 'Email',
    color: 'text-green-500',
  },
  ad_copy: {
    icon: Megaphone,
    label: 'Ad Copy',
    color: 'text-purple-500',
  },
  blog_post: {
    icon: BookOpen,
    label: 'Blog Post',
    color: 'text-orange-500',
  },
  landing_page: {
    icon: Globe,
    label: 'Landing Page',
    color: 'text-green-500',
  },
  social_post: {
    icon: Share2,
    label: 'Social Post',
    color: 'text-pink-500',
  },
  // Legacy type - same display as 'document'
  research_pdf: {
    icon: FileText,
    label: 'Document',
    color: 'text-red-500',
  },
};

/**
 * Filter dropdown options for the content library.
 * Includes separators for visual grouping:
 * - First group: All types filter
 * - Second group: User-created content (note, document, image, research)
 * - Third group: AI-generated content (email, ad copy, blog, landing page, social)
 */
export const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Types' },
  { value: '', label: '', isSeparator: true },
  { value: 'note', label: 'Note' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'research_report', label: 'Research' },
  { value: '', label: '', isSeparator: true },
  { value: 'email', label: 'Email' },
  { value: 'ad_copy', label: 'Ad Copy' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'social_post', label: 'Social Post' },
  { value: '', label: '', isSeparator: true },
  { value: 'journal_page', label: 'Journal' },
];

/**
 * MIME type to asset type mapping for file uploads.
 * Used to determine the correct asset_type when uploading files.
 */
const MIME_TYPE_MAP: Record<string, 'document' | 'image'> = {
  // Documents
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  // Images
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determines the asset type based on a file's MIME type.
 * 
 * @param mimeType - The MIME type of the uploaded file
 * @returns 'document' for PDFs/Word docs, 'image' for images, 'document' as fallback
 * 
 * @example
 * getAssetTypeFromMimeType('application/pdf') // 'document'
 * getAssetTypeFromMimeType('image/png') // 'image'
 * getAssetTypeFromMimeType('application/octet-stream') // 'document' (fallback)
 */
export function getAssetTypeFromMimeType(mimeType: string): 'document' | 'image' {
  const normalizedMimeType = mimeType.toLowerCase().trim();
  return MIME_TYPE_MAP[normalizedMimeType] ?? 'document';
}

/**
 * Gets the full configuration for a content type.
 * Returns 'note' config as fallback for unknown types.
 * 
 * @param assetType - The asset type from the database
 * @returns ContentTypeConfig with icon, label, and color
 * 
 * @example
 * getContentTypeConfig('email') // { icon: Mail, label: 'Email', color: 'text-green-500' }
 * getContentTypeConfig('unknown') // { icon: FileText, label: 'Note', color: 'text-blue-500' }
 */
export function getContentTypeConfig(assetType: string): ContentTypeConfig {
  // Special virtual type: journal_page is not a real asset_type in content_assets
  if (assetType === 'journal_page') {
    return { icon: BookOpen, label: 'Journal Page', color: 'text-amber-500' };
  }
  if (isValidAssetType(assetType)) {
    return CONTENT_TYPE_CONFIG[assetType];
  }
  // Fallback to 'note' config for unknown types
  return CONTENT_TYPE_CONFIG.note;
}

/**
 * Gets the human-readable label for a content type.
 * 
 * @param assetType - The asset type from the database
 * @returns Human-readable label string
 * 
 * @example
 * getContentTypeLabel('blog_post') // 'Blog Post'
 * getContentTypeLabel('research_pdf') // 'Document'
 */
export function getContentTypeLabel(assetType: string): string {
  return getContentTypeConfig(assetType).label;
}

/**
 * Gets the Lucide icon component for a content type.
 * 
 * @param assetType - The asset type from the database
 * @returns LucideIcon component
 * 
 * @example
 * const Icon = getContentTypeIcon('email') // Mail component
 * <Icon className="h-4 w-4" />
 */
export function getContentTypeIcon(assetType: string): LucideIcon {
  return getContentTypeConfig(assetType).icon;
}

/**
 * Gets the Tailwind color class for a content type.
 * 
 * @param assetType - The asset type from the database
 * @returns Tailwind CSS color class string
 * 
 * @example
 * getContentTypeColor('image') // 'text-cyan-500'
 */
export function getContentTypeColor(assetType: string): string {
  return getContentTypeConfig(assetType).color;
}

/**
 * Type guard to check if a string is a valid AssetType.
 * 
 * @param value - String to validate
 * @returns True if value is a valid AssetType
 * 
 * @example
 * if (isValidAssetType(unknownValue)) {
 *   // TypeScript now knows unknownValue is AssetType
 *   const config = CONTENT_TYPE_CONFIG[unknownValue];
 * }
 */
export function isValidAssetType(value: string): value is AssetType {
  return (ASSET_TYPES as readonly string[]).includes(value);
}
