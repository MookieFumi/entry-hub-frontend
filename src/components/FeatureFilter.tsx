import { useFeatures, type Feature } from '@/api/queries'

const KINDS: { kind: Feature['kind']; legend: string }[] = [
  { kind: 'Equipment', legend: 'Equipamiento' },
  { kind: 'Accessibility', legend: 'Accesibilidad' },
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
  const catalog = useFeatures(includeInactive)
  if (catalog.isPending) return <p className="text-sm text-gray-500">Cargando catálogo…</p>
  if (catalog.error)
    return <p className="text-sm text-error-700">No se pudo cargar el catálogo de equipamiento.</p>

  const toggle = (value: string, checked: boolean) =>
    onChange(checked ? [...selected, value] : selected.filter((v) => v !== value))

  return (
    <div className="flex flex-col gap-3">
      {KINDS.map(({ kind, legend }) => {
        const entries = catalog.data.filter((f) => f.kind === kind)
        if (entries.length === 0) return null
        return (
          <fieldset key={kind} className="min-w-0">
            <legend className="mb-1.5 text-sm font-medium text-gray-700">{legend}</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {entries.map((f) => {
                const value = valueOf(f)
                const checked = selected.includes(value)
                return (
                  <label key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-gray-300 accent-brand-600"
                      checked={checked}
                      disabled={!f.isActive && !checked}
                      onChange={(e) => toggle(value, e.target.checked)}
                    />
                    {f.name}
                    {!f.isActive && <span className="text-xs text-gray-500">(inactivo)</span>}
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
