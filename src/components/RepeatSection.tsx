import { TextField, SelectField } from '@/components/ui/Field'
import { useT } from '@/i18n'
import type { RepeatErrors, RepeatValue } from '@/lib/recurrence'

/** "Repeat" options of the booking form: daily or weekly, every N, ending after a count or on a date. */
export function RepeatSection({
  value,
  onChange,
  errors,
  serverError,
}: {
  value: RepeatValue
  onChange: (v: RepeatValue) => void
  errors: RepeatErrors
  serverError?: string
}) {
  const t = useT()
  const set = (patch: Partial<RepeatValue>) => onChange({ ...value, ...patch })
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3">
      <legend className="px-1 text-sm font-medium text-gray-700">{t('repeat.title')}</legend>
      <SelectField
        label={t('repeat.title')}
        value={value.frequency}
        error={serverError}
        onChange={(e) => set({ frequency: e.target.value as RepeatValue['frequency'] })}
      >
        <option value="None">{t('repeat.none')}</option>
        <option value="Daily">{t('repeat.daily')}</option>
        <option value="Weekly">{t('repeat.weekly')}</option>
      </SelectField>
      {value.frequency !== 'None' && (
        <>
          <TextField
            label={`${t('repeat.every')} (${value.frequency === 'Daily' ? t('repeat.unitDaily') : t('repeat.unitWeekly')})`}
            type="number"
            min={1}
            max={52}
            value={value.interval}
            error={errors.interval ? t('repeat.intervalInvalid') : undefined}
            onChange={(e) => set({ interval: e.target.value })}
          />
          <SelectField
            label={t('repeat.ends')}
            value={value.endMode}
            onChange={(e) => set({ endMode: e.target.value as RepeatValue['endMode'] })}
          >
            <option value="count">{t('repeat.endCount')}</option>
            <option value="until">{t('repeat.endUntil')}</option>
          </SelectField>
          {value.endMode === 'count' ? (
            <TextField
              label={t('repeat.count')}
              type="number"
              min={2}
              max={52}
              value={value.count}
              error={errors.count ? t('repeat.countInvalid') : undefined}
              onChange={(e) => set({ count: e.target.value })}
            />
          ) : (
            <TextField
              label={t('repeat.until')}
              type="date"
              value={value.until}
              error={errors.until ? t('repeat.untilInvalid') : undefined}
              onChange={(e) => set({ until: e.target.value })}
            />
          )}
          <p className="text-sm text-gray-500">{t('repeat.limitHint')}</p>
        </>
      )}
    </fieldset>
  )
}
