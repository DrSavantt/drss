export interface AICommand {
  id: string
  label: string
  description: string
  icon: string
  promptTemplate: (context: CommandContext) => string
}

export interface CommandContext {
  selectedText?: string
  fullContent: string
  clientData?: any
  frameworkContent?: string
}

export interface MentionOption {
  id: string
  label: string
  description: string
  icon: string
  value: string
}

export type AutocompleteType = 'command' | 'mention' | null

