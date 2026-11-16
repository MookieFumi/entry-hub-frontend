import { useFeatures, type Feature } from '@/api/queries'
import { featureLabel } from '@/lib/featureLabel'
import { useT, type MessageKey } from '@/i18n'

const KINDS: { kind: Feature['kind']; legend: MessageKey }[] = [
  { kind: 'Equipment', legend: 'features.Equipment' },
  { kind: 'Accessibility', legend: 'features.Accessibility' },
]

/**
 * Checkbox groups for the tenant's catalog, one per kind. It works on any value type: the filter uses
 * codes and the room form uses ids, so the caller says which one with `valueOf`.
 */
export function FeatureChecklist({
  selected,
  onChange,
  valueOf,
  includeInactive = false,
}: {
  selected: string[]
  onChange: (next: string[]) => void
  valueOf: (feature: Feature) => string
  includeInactive?: boolean
}) {
  const t = useT()
  const catalog = useFeatures(includeInactive)
  if (catalog.isPending) return <p className="text-sm text-gray-600">{t('features.loading')}</p>
  if (catalog.error) return <p className="text-sm text-error-700">{t('features.failed')}</p>

  const toggle = (value: string, checked: boolean) =>
    onChange(checked ? [...selected, value] : selected.filter((v) => v !== value))

  return (
    <div className="flex flex-col gap-3">
      {KINDS.map(({ kind, legend }) => {
        const entries = catalog.data.filter((f) => f.kind === kind)
        if (entries.length === 0) return null
        return (
          <fieldset key={kind} className="min-w-0">
            <legend className="mb-2 text-sm font-semibold text-gray-800">{t(legend)}</legend>
            <div className="flex flex-wrap gap-2">
              {entries.map((f) => {
                const value = valueOf(f)
                const checked = selected.includes(value)
                return (
                  <label
                    key={f.id}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white py-1.5 pr-3.5 pl-3 text-sm font-medium text-gray-800 transition-colors duration-150 hover:border-brand-400 has-checked:border-brand-600 has-checked:bg-brand-50 has-checked:text-brand-900 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-600"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-brand-600 focus-visible:outline-none"
                      checked={checked}
                      disabled={!f.isActive && !checked}
                      onChange={(e) => toggle(value, e.target.checked)}
                    />
                    {featureLabel(f, t)}
                    {!f.isActive && (
                      <span className="text-xs text-gray-600">{t('features.inactive')}</span>
                    )}
                  </label>
                )
              })}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
