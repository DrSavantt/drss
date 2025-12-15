import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Client Onboarding - DRSS Marketing',
  description: 'Complete your onboarding questionnaire to help us serve you better.',
}

export default function PublicFormLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border bg-surface sticky top-0 z-40 backdrop-blur-xl bg-surface/95">
        <div className="max-w-4xl mx-auto px-4 py-4 safe-area-top">
          <h1 className="text-xl font-bold text-red-primary">DRSS Marketing</h1>
          <p className="text-sm text-silver">Client Onboarding</p>
        </div>
      </header>
      
      {/* Form content */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-32 safe-area-bottom">
        {children}
      </main>
    </div>
  )
}
