import { LOCALES, isLocale, setLocale, useLocale, useT } from '@/i18n'

/** Language selector for the header; the choice is saved by `setLocale`. */
export function LanguageSwitcher() {
  const t = useT()
  const locale = useLocale()
  return (
    <select
      aria-label={t('language.label')}
      value={locale}
      onChange={(e) => {
        if (isLocale(e.target.value)) setLocale(e.target.value)
      }}
      className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700"
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {t(`language.${code}`)}
        </option>
      ))}
    </select>
  )
}
