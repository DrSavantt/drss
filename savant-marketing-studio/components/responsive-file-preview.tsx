'use client'

import { useState } from 'react'
import { useMobile } from '@/hooks/use-mobile'
import { Download, ZoomIn, ZoomOut, Maximize2, Minimize2, ExternalLink } from 'lucide-react'

interface ResponsiveFilePreviewProps {
  fileUrl: string
  fileName: string
  fileType: string | null
  className?: string
}

export function ResponsiveFilePreview({
  fileUrl,
  fileName,
  fileType,
  className = ''
}: ResponsiveFilePreviewProps) {
  const isMobile = useMobile()
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const isPDF = fileType === 'application/pdf' || fileName.endsWith('.pdf')
  const isImage = fileType?.startsWith('image/')
  const isVideo = fileType?.startsWith('video/')
  const isWordDoc = fileType?.includes('wordprocessingml') || 
                    fileType?.includes('msword') ||
                    fileName.match(/\.(doc|docx)$/i)

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Preview Controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-surface rounded-lg border border-border">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">{fileName}</h3>
          <p className="text-sm text-muted-foreground">
            {fileType || 'Unknown type'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {isImage && !isMobile && (
            <>
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="p-2 rounded-lg hover:bg-surface-highlight transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={zoom <= 0.5}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-sm text-muted-foreground font-mono min-w-[3.5rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="p-2 rounded-lg hover:bg-surface-highlight transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={zoom >= 3}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="px-3 py-2 rounded-lg hover:bg-surface-highlight transition-colors text-xs font-medium text-foreground"
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                Reset
              </button>
            </>
          )}
          
          {isImage && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg hover:bg-surface-highlight transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-foreground" />
              ) : (
                <Maximize2 className="w-4 h-4 text-foreground" />
              )}
            </button>
          )}
          
          <a
            href={fileUrl}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-primary hover:bg-red-bright text-white 
              rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>

      {/* Preview Container */}
      <div className={`
        rounded-lg overflow-hidden border border-border bg-white
        ${isFullscreen ? 'fixed inset-0 z-50' : ''}
      `}>
        {isPDF ? (
          <div className="w-full max-w-4xl mx-auto">
            {/* Try object tag first for better PDF rendering */}
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full border-0"
              style={{ height: '800px' }}
            >
              {/* Fallback to iframe */}
              <iframe
                src={fileUrl}
                className="w-full border-0"
                style={{ height: '800px' }}
                title={fileName}
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
            </object>
            
            {/* Always show direct link as backup */}
            <div className="mt-4 text-center p-4 bg-surface">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-primary hover:underline inline-flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open PDF in new tab
              </a>
            </div>
          </div>
        ) : isImage ? (
          <div className={`
            flex items-center justify-center
            ${isFullscreen ? 'h-screen p-8' : 'min-h-[400px] p-4'}
            bg-background
          `}>
            <img
              src={fileUrl}
              alt={fileName}
              className="w-full h-auto object-contain transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom})`,
                maxWidth: isFullscreen ? '100%' : isMobile ? '100%' : '900px',
                maxHeight: isFullscreen ? '100%' : isMobile ? '60vh' : '700px'
              }}
            />
          </div>
        ) : isVideo ? (
          <div className="w-full max-w-4xl mx-auto p-4">
            <video
              src={fileUrl}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: '600px' }}
            >
              Your browser doesn&apos;t support video playback.
            </video>
          </div>
        ) : isWordDoc ? (
          // DOCX: Use Google Docs Viewer (same as PDF approach - works on mobile and desktop)
          <div className="w-full max-w-4xl mx-auto">
            <object
              data={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              type="text/html"
              className="w-full border-0"
              style={{ height: isMobile ? '500px' : '800px' }}
            >
              {/* Fallback to iframe */}
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                className="w-full border-0"
                style={{ height: isMobile ? '500px' : '800px', backgroundColor: 'white' }}
                title={fileName}
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
            </object>
            
            {/* Always show direct link as backup */}
            <div className="mt-4 text-center p-4 bg-surface">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-primary hover:underline inline-flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open document in new tab
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Preview not available
            </h3>
            <p className="text-muted-foreground mb-6">
              {fileType || 'Unknown file type'}
            </p>
            <a
              href={fileUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-red-primary hover:bg-red-bright text-white 
                rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download to view
            </a>
          </div>
        )}
      </div>

      {/* Fullscreen Close Overlay */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-[60] p-3 bg-surface hover:bg-surface-highlight
            rounded-lg border border-border shadow-lg transition-colors"
          aria-label="Exit fullscreen"
        >
          <Minimize2 className="w-5 h-5 text-foreground" />
        </button>
      )}
    </div>
  )
}