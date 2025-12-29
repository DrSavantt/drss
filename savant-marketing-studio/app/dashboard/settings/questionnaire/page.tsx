import { QuestionnaireSettings } from '@/components/settings/questionnaire-settings'

export const metadata = {
  title: 'Questionnaire Settings',
  description: 'Manage questionnaire sections, questions, and help content',
}

export default function QuestionnaireSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Questionnaire Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize questions, sections, validation rules, and help content
        </p>
      </div>
      
      <QuestionnaireSettings />
    </div>
  )
}

