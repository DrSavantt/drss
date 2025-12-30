import { AICommand, MentionOption } from './types'

export const AI_COMMANDS: AICommand[] = [
  {
    id: 'rewrite',
    label: '/rewrite',
    description: 'Rewrite content to be clearer',
    icon: '✏️',
    promptTemplate: (ctx) => `Rewrite the following text to be clearer and more engaging. Maintain the same meaning:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'expand',
    label: '/expand',
    description: 'Expand with more detail',
    icon: '📝',
    promptTemplate: (ctx) => `Expand on this with more detail and examples:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'shorten',
    label: '/shorten',
    description: 'Make more concise',
    icon: '✂️',
    promptTemplate: (ctx) => `Make this more concise while keeping the key message:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'improve',
    label: '/improve',
    description: 'Improve writing quality',
    icon: '✨',
    promptTemplate: (ctx) => `Improve the writing quality of this text. Fix any issues and make it more polished:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'professional',
    label: '/professional',
    description: 'Make tone professional',
    icon: '👔',
    promptTemplate: (ctx) => `Rewrite this in a more professional, business-appropriate tone:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'casual',
    label: '/casual',
    description: 'Make tone casual',
    icon: '😊',
    promptTemplate: (ctx) => `Rewrite this in a more casual, conversational tone:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'friendly',
    label: '/friendly',
    description: 'Make tone friendly',
    icon: '🤝',
    promptTemplate: (ctx) => `Rewrite this in a warm, friendly tone:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'summarize',
    label: '/summarize',
    description: 'Create a summary',
    icon: '📋',
    promptTemplate: (ctx) => `Summarize the key points of this text:\n\n${ctx.fullContent}`
  },
  {
    id: 'bullets',
    label: '/bullets',
    description: 'Convert to bullet points',
    icon: '•',
    promptTemplate: (ctx) => `Convert this into a clear bullet point list:\n\n${ctx.selectedText || ctx.fullContent}`
  },
  {
    id: 'cta',
    label: '/cta',
    description: 'Generate call-to-action',
    icon: '🎯',
    promptTemplate: (ctx) => `Based on this content, generate 3 compelling call-to-action options:\n\n${ctx.fullContent}`
  },
  {
    id: 'headline',
    label: '/headline',
    description: 'Generate headlines',
    icon: '📰',
    promptTemplate: (ctx) => `Generate 5 attention-grabbing headline options for this content:\n\n${ctx.fullContent}`
  },
  {
    id: 'subject',
    label: '/subject',
    description: 'Generate email subjects',
    icon: '✉️',
    promptTemplate: (ctx) => `Generate 5 compelling email subject line options for this content:\n\n${ctx.fullContent}`
  }
]

export const MENTION_OPTIONS: MentionOption[] = [
  {
    id: 'client',
    label: '@client',
    description: 'Include client brand data',
    icon: '👤',
    value: 'client'
  },
  {
    id: 'framework',
    label: '@framework',
    description: 'Select a framework',
    icon: '📚',
    value: 'framework'
  },
  {
    id: 'selection',
    label: '@selection',
    description: 'Reference selected text',
    icon: '✂️',
    value: 'selection'
  }
]

export function filterCommands(query: string): AICommand[] {
  const lower = query.toLowerCase().replace('/', '')
  return AI_COMMANDS.filter(cmd => 
    cmd.id.includes(lower) || cmd.description.toLowerCase().includes(lower)
  )
}

export function filterMentions(query: string): MentionOption[] {
  const lower = query.toLowerCase().replace('@', '')
  return MENTION_OPTIONS.filter(opt =>
    opt.id.includes(lower) || opt.description.toLowerCase().includes(lower)
  )
}

