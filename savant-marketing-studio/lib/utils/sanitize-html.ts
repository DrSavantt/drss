/**
 * HTML Sanitization Utility
 * 
 * Sanitizes HTML content to prevent XSS attacks when using dangerouslySetInnerHTML.
 * Uses a whitelist approach - only explicitly allowed tags and attributes are kept.
 */

// Allowed HTML tags for content rendering
const ALLOWED_TAGS = new Set([
  // Text formatting
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'span',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Lists
  'ul', 'ol', 'li',
  // Links
  'a',
  // Block elements
  'div', 'blockquote', 'pre', 'code',
  // Tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  // Other
  'hr',
])

// Allowed attributes for specific tags
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  'a': new Set(['href', 'target', 'rel']),
  'span': new Set(['class']),
  'div': new Set(['class']),
  'p': new Set(['class']),
  'code': new Set(['class']),
  'pre': new Set(['class']),
  'h1': new Set(['class']),
  'h2': new Set(['class']),
  'h3': new Set(['class']),
  'li': new Set(['class']),
}

/**
 * Sanitizes HTML content for safe rendering
 * 
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  // For server-side rendering, we do basic sanitization
  // A proper implementation would use DOMPurify in the browser
  if (typeof window === 'undefined') {
    return sanitizeHtmlServer(html)
  }
  
  return sanitizeHtmlClient(html)
}

/**
 * Server-side HTML sanitization using regex (basic protection)
 */
function sanitizeHtmlServer(html: string): string {
  // Remove script tags and their content
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (onclick, onerror, etc.)
  result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  
  // Remove javascript: URLs
  result = result.replace(/href\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'href="#"')
  
  // Remove data: URLs (potential XSS vector)
  result = result.replace(/href\s*=\s*["']?\s*data:[^"'>]*/gi, 'href="#"')
  
  // Remove style tags
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  // Remove iframe tags
  result = result.replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
  
  // Remove form tags
  result = result.replace(/<form\b[^>]*>.*?<\/form>/gi, '')
  
  // Remove input tags
  result = result.replace(/<input\b[^>]*>/gi, '')
  
  return result
}

/**
 * Client-side HTML sanitization using DOM API (more thorough)
 */
function sanitizeHtmlClient(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  function cleanNode(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const tagName = element.tagName.toLowerCase()
      
      // Remove disallowed tags entirely
      if (!ALLOWED_TAGS.has(tagName)) {
        // Replace with text content for non-dangerous tags, remove dangerous ones
        if (['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'].includes(tagName)) {
          element.remove()
          return
        }
        // Keep text content for other disallowed tags
        const textContent = element.textContent || ''
        element.replaceWith(document.createTextNode(textContent))
        return
      }
      
      // Remove disallowed attributes
      const allowedAttrs = ALLOWED_ATTRS[tagName] || new Set()
      const attrsToRemove: string[] = []
      
      for (const attr of element.attributes) {
        const attrName = attr.name.toLowerCase()
        
        // Always remove event handlers
        if (attrName.startsWith('on')) {
          attrsToRemove.push(attr.name)
          continue
        }
        
        // Remove disallowed attributes
        if (!allowedAttrs.has(attrName)) {
          attrsToRemove.push(attr.name)
          continue
        }
        
        // Sanitize href attributes
        if (attrName === 'href') {
          const value = attr.value.toLowerCase().trim()
          if (value.startsWith('javascript:') || value.startsWith('data:')) {
            element.setAttribute('href', '#')
          }
        }
      }
      
      attrsToRemove.forEach(attr => element.removeAttribute(attr))
      
      // Add rel="noopener noreferrer" to external links
      if (tagName === 'a' && element.hasAttribute('href')) {
        const href = element.getAttribute('href') || ''
        if (href.startsWith('http') || element.getAttribute('target') === '_blank') {
          element.setAttribute('rel', 'noopener noreferrer')
        }
      }
      
      // Recursively clean children
      Array.from(element.childNodes).forEach(cleanNode)
    }
  }
  
  // Clean the body
  Array.from(doc.body.childNodes).forEach(cleanNode)
  
  return doc.body.innerHTML
}

/**
 * Escape HTML special characters (for plain text content)
 * Use this when you want to display user text without any HTML interpretation
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  
  return text.replace(/[&<>"']/g, char => htmlEntities[char])
}

