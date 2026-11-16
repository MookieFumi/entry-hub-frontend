import { Dialog } from '@base-ui/react/dialog'
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/errors'
import { useCreateWebhook, type WebhookCreated } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { useEventName } from '@/hooks/useEventName'
import { useT } from '@/i18n'

export const WEBHOOK_EVENTS = ['booking.created', 'booking.cancelled', 'booking.rescheduled']

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/** Creates a subscription and then shows its signing secret once. */
export function WebhookFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const t = useT()
  const eventName = useEventName()
  const create = useCreateWebhook()
  const { notify } = useToast()
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>(WEBHOOK_EVENTS)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [created, setCreated] = useState<WebhookCreated | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    if (!isHttpsUrl(url.trim())) next.url = t('webhooks.form.urlInvalid')
    if (events.length === 0) next.events = t('webhooks.form.eventsRequired')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      const result = await create.mutateAsync({ url: url.trim(), events })
      onOpenChange(false)
      setUrl('')
      setEvents(WEBHOOK_EVENTS)
      setCreated(result)
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'conflict')
        setErrors({ url: t('webhooks.form.duplicate') })
      else if (err instanceof ApiError && err.kind === 'validation') {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.fieldErrors))
          mapped[k.charAt(0).toLowerCase() + k.slice(1)] = v.join(' ')
        setErrors(mapped)
        setFormError(Object.keys(mapped).length ? null : err.message)
      } else setFormError(err instanceof Error ? err.message : t('common.unexpected'))
    }
  }

  async function copy(secret: string) {
    try {
      await navigator.clipboard.writeText(secret)
      notify('success', t('webhooks.secret.copied'))
    } catch {
      notify('error', t('webhooks.secret.copyFailed'))
    }
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-gray-900/50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
            <Dialog.Title className="mb-4 text-lg font-semibold text-gray-900">
              {t('webhooks.form.title')}
            </Dialog.Title>
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <TextField
                label={t('webhooks.form.url')}
                type="url"
                value={url}
                hint={t('webhooks.form.urlHint')}
                error={errors.url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-gray-700">
                  {t('webhooks.form.events')}
                </legend>
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={events.includes(ev)}
                      onChange={(e) =>
                        setEvents(
                          e.target.checked ? [...events, ev] : events.filter((x) => x !== ev),
                        )
                      }
                    />
                    {eventName(ev)}
                  </label>
                ))}
                {errors.events && (
                  <p role="alert" className="text-sm text-error-700">
                    {errors.events}
                  </p>
                )}
              </fieldset>
              {formError && <Alert tone="error">{formError}</Alert>}
              <div className="flex justify-end gap-3">
                <Dialog.Close render={<Button variant="secondary" type="button" />}>
                  {t('common.cancel')}
                </Dialog.Close>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? t('webhooks.form.creating') : t('webhooks.form.create')}
                </Button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={created !== null} onOpenChange={() => undefined}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-gray-900/50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {t('webhooks.secret.title')}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              {t('webhooks.secret.body')}
            </Dialog.Description>
            <div className="mt-4 flex flex-col gap-3">
              <TextField
                label={t('webhooks.secret.label')}
                readOnly
                value={created?.secret ?? ''}
                className="font-mono"
                onFocus={(e) => e.currentTarget.select()}
              />
              <div className="flex justify-between gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => created && void copy(created.secret)}
                >
                  {t('webhooks.secret.copy')}
                </Button>
                <Button type="button" onClick={() => setCreated(null)}>
                  {t('webhooks.secret.done')}
                </Button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
