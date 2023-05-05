import { Locale } from '@/i18n'

export type AppInfo = {
  title: string
  description: string
  default_language: Locale
  copyright?: string
  privacy_policy?: string
}

export type PromptVariable = {
  key: string,
  name: string,
  type: "string" | "number" | "select",
  default?: string | number,
  required?: boolean
  options?: string[]
  max_length: number
}

export type PromptConfig = {
  prompt_template: string,
  prompt_variables: PromptVariable[],
}

export const MessageRatings = ['like', 'dislike', null] as const
export type MessageRating = typeof MessageRatings[number]

export type Feedbacktype = {
  rating: MessageRating
  content?: string | null
}
