'use client'

import { TiptapEditor } from '@/components/tiptap-editor'
import { useState } from 'react'

export default function TestPage() {
  const [content, setContent] = useState('<p>Start typing to test the editor...</p>')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tiptap Editor Test
          </h1>
          <p className="mt-2 text-gray-600">
            Test basic formatting before using in Phase 1
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rich Text Editor
          </h2>

          <TiptapEditor
            content={content}
            onChange={(html) => setContent(html)}
          />

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              ✅ Test Checklist:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Type some text</li>
              <li>• Make text bold and italic</li>
              <li>• Create H1, H2, H3 headings</li>
              <li>• Add bullet and numbered lists</li>
              <li>• Click &quot;Show HTML&quot; to see output</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
