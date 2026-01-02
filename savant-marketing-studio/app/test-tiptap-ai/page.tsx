'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const TiptapEditor = dynamic(
  () => import('@/components/tiptap-editor').then(mod => ({ default: mod.TiptapEditor })),
  {
    loading: () => (
      <div className="min-h-[400px] flex items-center justify-center border border-border rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false
  }
)

export default function TestTiptapAIPage() {
  const [content, setContent] = useState(`<h1>Welcome to the AI-Powered Editor</h1>

<p>This is a sample document. Try these features:</p>

<ul>
  <li>Select any text and click "Ask AI" to rewrite it</li>
  <li>Type a prompt like "Make this more professional"</li>
  <li>Use @mentions for context: @client, @selection, @framework</li>
</ul>

<h2>Example Content</h2>

<p>Our company provides innovative solutions for modern businesses. We help teams collaborate better and achieve their goals faster.</p>

<p>Select the paragraph above and try: "Rewrite this to be more compelling [@selection]"</p>
`)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tiptap Editor with AI Integration
          </h1>
          <p className="text-muted-foreground">
            Test the Tiptap editor with minimal Cursor-style AI prompt bar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <TiptapEditor
              content={content}
              onChange={setContent}
              editable={true}
              showAIBar={true}
              clientId={undefined} // Set to actual client ID if testing client context
            />
          </div>

          {/* Instructions Panel */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                📘 How to Use
              </h2>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    1. Basic Editing
                  </h3>
                  <p className="text-muted-foreground">
                    Use the toolbar to format text (bold, italic, headings, lists)
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    2. AI Assistant (Minimal Design)
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    Click the "Ask AI" button or scroll to the bottom. The clean Cursor-style prompt bar features inline hints and subtle icons.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    3. Text Selection
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    Select text in the editor to work with specific content. The AI bar will show how many characters are selected.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    4. Mentions
                  </h3>
                  <ul className="text-muted-foreground space-y-1 ml-4">
                    <li>• <code className="bg-muted px-1 rounded">@client</code> - Include brand context</li>
                    <li>• <code className="bg-muted px-1 rounded">@selection</code> - Focus on selected text</li>
                    <li>• <code className="bg-muted px-1 rounded">@framework</code> - Use copywriting frameworks</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                💡 Example Prompts
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="bg-muted/50 rounded p-3">
                  <p className="text-foreground font-medium mb-1">
                    Basic rewrite:
                  </p>
                  <p className="text-muted-foreground italic">
                    "Rewrite this to be clearer"
                  </p>
                </div>

                <div className="bg-muted/50 rounded p-3">
                  <p className="text-foreground font-medium mb-1">
                    With selection:
                  </p>
                  <p className="text-muted-foreground italic">
                    "Make this more professional [@selection]"
                  </p>
                </div>

                <div className="bg-muted/50 rounded p-3">
                  <p className="text-foreground font-medium mb-1">
                    With framework:
                  </p>
                  <p className="text-muted-foreground italic">
                    "Rewrite using AIDA framework [@framework]"
                  </p>
                </div>

                <div className="bg-muted/50 rounded p-3">
                  <p className="text-foreground font-medium mb-1">
                    Generate new:
                  </p>
                  <p className="text-muted-foreground italic">
                    "Write a compelling CTA for this content"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                ✨ Features
              </h2>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ Rich text editing</li>
                <li>✅ AI-powered rewriting</li>
                <li>✅ Context-aware generation</li>
                <li>✅ Text selection support</li>
                <li>✅ @ mention autocomplete</li>
                <li>✅ Smart content insertion</li>
                <li>✅ Loading states</li>
                <li>✅ Error handling</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-sm text-yellow-500/90">
            <strong>Note:</strong> This is a test page. Content is not saved. The AI will use real API calls and may incur costs.
          </p>
        </div>
      </div>
    </div>
  )
}

