import { createI18n } from 'vue-i18n'
import de from '@/locales/de'
import en from '@/locales/en'

export type SupportedLocale = 'de' | 'en'

const messages = { de, en }

export type AppMessageSchema = typeof de

export const i18n = createI18n<[AppMessageSchema], SupportedLocale, false>({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'en',
  messages,
})