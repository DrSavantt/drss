'use client'

import { useState } from 'react'
import { useMobile } from '@/hooks/use-mobile'
import { Download, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react'
import Image from 'next/image'

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

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Preview Controls */}
      <div className="flex items-center justify-between mb-4 p-3 bg-surface rounded-lg border border-border">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
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
            className="p-2 rounded-lg hover:bg-surface-highlight transition-colors"
            aria-label="Download file"
            title="Download file"
          >
            <Download className="w-4 h-4 text-foreground" />
          </a>
        </div>
      </div>

      {/* Preview Container */}
      <div className={`
        rounded-lg overflow-hidden border border-border
        ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'bg-surface'}
      `}>
        {isPDF ? (
          <div className={`
            mx-auto bg-white
            ${isMobile 
              ? 'w-full' 
              : 'max-w-5xl' // Desktop: 1024px max width for better readability
            }
          `}>
            <iframe
              src={`${fileUrl}#view=FitH&toolbar=1&navpanes=0`}
              className={`
                w-full border-0
                ${isMobile 
                  ? 'h-[60vh] min-h-[400px]' // Mobile: 60% viewport height, min 400px
                  : isFullscreen
                    ? 'h-screen'
                    : 'h-[600px] lg:h-[700px] xl:h-[800px]' // Desktop: responsive heights
                }
              `}
              title={fileName}
              sandbox="allow-same-origin allow-scripts allow-downloads"
            />
          </div>
        ) : isImage ? (
          <div className={`
            flex items-center justify-center
            ${isFullscreen ? 'h-screen p-8' : 'min-h-[400px] p-4'}
            bg-background
          `}>
            <div 
              className="relative w-full h-full transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                maxWidth: isFullscreen ? '100%' : isMobile ? '100%' : '900px',
                maxHeight: isFullscreen ? '100%' : isMobile ? '60vh' : '700px'
              }}
            >
              <Image
                src={fileUrl}
                alt={fileName}
                fill
                className="object-contain"
                sizes={isFullscreen 
                  ? '100vw' 
                  : isMobile 
                    ? '(max-width: 768px) 100vw' 
                    : '(max-width: 1024px) 800px, 900px'
                }
                priority
                quality={90}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg font-medium text-foreground mb-2">
              Preview not available
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {fileType || 'Unknown file type'}
            </p>
            <a
              href={fileUrl}
              download={fileName}
              className="px-6 py-3 bg-red-primary hover:bg-red-bright text-white
                rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download File
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
