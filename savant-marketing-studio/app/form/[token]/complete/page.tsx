import { CheckCircle } from 'lucide-react'

export default function QuestionnaireCompletePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Thank You!
        </h1>
        
        <p className="text-muted-foreground text-lg mb-8">
          Your questionnaire has been submitted successfully. We&apos;ll review your responses and get back to you soon.
        </p>
        
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            You can safely close this window now.
          </p>
        </div>
      </div>
    </div>
  )
}

