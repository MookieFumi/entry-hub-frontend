import { useT } from '@/i18n'

/** Small muted text with the version of the build that is running. */
export function AppVersion({ className = '' }: { className?: string }) {
  const t = useT()
  return (
    <p className={`nums text-xs ${className}`} data-testid="app-version">
      {t('app.version', { version: __APP_VERSION__ })}
    </p>
  )
}
