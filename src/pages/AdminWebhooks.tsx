import { useState } from 'react'
import { ApiError } from '@/api/errors'
import { useDeleteWebhook, useSetWebhookEnabled, useWebhooks, type Webhook } from '@/api/queries'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { useEventName } from '@/hooks/useEventName'
import { useT } from '@/i18n'

/** Facilities manage the webhook subscriptions of the tenant. */
export function AdminWebhooks() {
  const t = useT()
  const eventName = useEventName()
  const { notify } = useToast()
  const webhooks = useWebhooks()
  const toggle = useSetWebhookEnabled()
  const remove = useDeleteWebhook()
  const [deleting, setDeleting] = useState<Webhook | null>(null)

  async function setEnabled(w: Webhook, isEnabled: boolean) {
    try {
      await toggle.mutateAsync({ id: w.id, isEnabled })
      notify('success', isEnabled ? t('webhooks.resumed.done') : t('webhooks.paused.done'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('webhooks.toggleFailed'))
    }
  }

  async function confirmDelete(w: Webhook) {
    try {
      await remove.mutateAsync(w.id)
      notify('success', t('webhooks.deleted'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('webhooks.deleteFailed'))
    }
    setDeleting(null)
  }

  return (
    <>
      <PageHeader title={t('webhooks.title')} description={t('webhooks.description')} />
      {webhooks.isPending && <Skeleton className="h-40" />}
      {webhooks.error && (
        <ErrorState message={webhooks.error.message} onRetry={() => void webhooks.refetch()} />
      )}
      {webhooks.data && webhooks.data.length === 0 && (
        <EmptyState title={t('webhooks.noneTitle')}>{t('webhooks.noneHint')}</EmptyState>
      )}
      {webhooks.data && webhooks.data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t('webhooks.colUrl')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('webhooks.colEvents')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('webhooks.colState')}
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">{t('webhooks.colActions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {webhooks.data.map((w) => (
                <tr key={w.id} className="border-t border-gray-200">
                  <th scope="row" className="px-4 py-3 font-medium break-all text-gray-900">
                    {w.url}
                  </th>
                  <td className="px-4 py-3">{w.events.map(eventName).join(', ')}</td>
                  <td className="px-4 py-3">
                    <Badge tone={w.isEnabled ? 'success' : 'warning'}>
                      {w.isEnabled ? t('webhooks.enabled') : t('webhooks.paused')}
                    </Badge>
                  </td>
                  <td className="flex justify-end gap-2 px-4 py-3">
                    <Button
                      variant="secondary"
                      disabled={toggle.isPending}
                      onClick={() => void setEnabled(w, !w.isEnabled)}
                    >
                      {w.isEnabled ? t('webhooks.pause') : t('webhooks.resume')}
                    </Button>
                    <Button variant="secondary" onClick={() => setDeleting(w)}>
                      {t('webhooks.delete')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t('webhooks.deleteTitle')}
        confirmLabel={t('webhooks.delete')}
        destructive
        busy={remove.isPending}
        onConfirm={() => deleting && void confirmDelete(deleting)}
      >
        <p>{t('webhooks.deleteBody', { url: deleting?.url ?? '' })}</p>
      </ConfirmDialog>
    </>
  )
}
