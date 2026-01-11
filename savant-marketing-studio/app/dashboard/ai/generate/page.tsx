import { redirect } from 'next/navigation'

export default function OldAIStudioRedirect() {
  redirect('/dashboard/ai/chat')
}
