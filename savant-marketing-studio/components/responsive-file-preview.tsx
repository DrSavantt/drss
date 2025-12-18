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
          isMobile ? (
            // Mobile: Download-only card (iframe doesn't work well on mobile)
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] bg-background">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  <path d="M8 12h8v2H8zm0 4h8v2H8zm0-8h3v2H8z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Word Document
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
                {fileName}
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Document previews aren&apos;t available on mobile. Download to view in your preferred app.
              </p>
              <a
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-[280px] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white 
                  rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-3
                  active:scale-[0.98] shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Document
              </a>
              <p className="text-xs text-muted-foreground mt-4">
                Opens in Microsoft Word, Google Docs, or Pages
              </p>
            </div>
          ) : (
            // Desktop: Google Docs Viewer
            <div className="w-full max-w-4xl mx-auto">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                className="w-full border-0"
                style={{ height: '800px', backgroundColor: 'white' }}
                title={fileName}
              />
              
              {/* Fallback download if viewer fails */}
              <div className="mt-4 text-center p-4 bg-surface rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Having trouble viewing?
                </p>
                <a
                  href={fileUrl}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-primary hover:underline inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download document →
                </a>
              </div>
            </div>
          )
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