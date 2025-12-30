'use client'

import { useState } from 'react'
import { AIPromptBar } from '@/components/editor/ai-prompt-bar'

export default function TestAIPromptPage() {
  const [editorContent, setEditorContent] = useState('This is some sample editor content. You can use the AI to rewrite, expand, or improve this text.')
  const [selectedText, setSelectedText] = useState('')
  const [responses, setResponses] = useState<Array<{ response: string; timestamp: Date }>>([])

  const handleResponse = (text: string) => {
    console.log('AI Response:', text)
    setResponses([...responses, { response: text, timestamp: new Date() }])
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Prompt Bar Test
          </h1>
          <p className="text-muted-foreground">
            Test the AI prompt bar with @ mention autocomplete and backend integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Content Section */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Editor Content
              </h2>
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-40 bg-muted/50 border border-border rounded-lg p-3 text-sm text-foreground resize-none"
                placeholder="Enter your editor content here..."
              />
              
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Selected Text (optional):
                </label>
                <input
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm text-foreground"
                  placeholder="Simulated selection..."
                />
              </div>
            </div>

            {/* AI Prompt Bar - Minimal Cursor Style */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                AI Prompt Bar (Minimal Design)
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Clean Cursor-inspired interface with inline hints and subtle icons
              </p>
              
              <AIPromptBar
                onResponse={handleResponse}
                editorContent={editorContent}
                selectedText={selectedText}
                clientId={undefined}
                showModelSelector={true}
              />
              
              <ul className="text-xs text-muted-foreground space-y-1 mt-4 ml-4">
                <li>• Type <code className="bg-muted px-1 py-0.5 rounded text-[10px]">@</code> or click @ icon to add context</li>
                <li>• Press Enter to send, Shift+Enter for new line</li>
                <li>• Use <code className="bg-muted px-1 py-0.5 rounded text-[10px]">[@client]</code> <code className="bg-muted px-1 py-0.5 rounded text-[10px]">[@selection]</code> <code className="bg-muted px-1 py-0.5 rounded text-[10px]">[@framework]</code></li>
              </ul>
            </div>
          </div>

          {/* Responses Section */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                AI Responses ({responses.length})
              </h2>
              
              {responses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No responses yet</p>
                  <p className="text-sm mt-2">Submit a prompt to see AI responses here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {responses.map((item, index) => (
                    <div
                      key={index}
                      className="bg-muted/50 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground font-semibold">
                          RESPONSE #{responses.length - index}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-background/50 rounded p-3 text-sm text-foreground whitespace-pre-wrap">
                        {item.response}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

