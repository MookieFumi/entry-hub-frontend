import { LOCALES, isLocale, setLocale, useLocale, useT } from '@/i18n'

/** Language selector for the header; the choice is saved by `setLocale`. */
export function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'ink' }) {
  const t = useT()
  const locale = useLocale()
  return (
    <select
      aria-label={t('language.label')}
      value={locale}
      onChange={(e) => {
        if (isLocale(e.target.value)) setLocale(e.target.value)
      }}
      className={`h-10.5 rounded-lg border px-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        tone === 'ink'
          ? 'border-white/50 bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-mine-400 [&>option]:bg-white [&>option]:text-gray-900'
          : 'border-gray-300 bg-white text-gray-800 hover:border-brand-400 focus-visible:outline-brand-600'
      }`}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {t(`language.${code}`)}
        </option>
      ))}
    </select>
  )
}
