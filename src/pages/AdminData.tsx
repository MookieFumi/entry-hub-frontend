import { useState } from 'react'
import { ApiError } from '@/api/errors'
import {
  fetchTenantExport,
  useDeleteTenantData,
  useMe,
  type DeleteTenantDataResponse,
} from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TextField } from '@/components/ui/Field'
import { Alert, Card, PageHeader } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { downloadJson, slug } from '@/lib/download'
import { useT } from '@/i18n'

/** Facilities download everything the tenant has stored. */
export function AdminData() {
  const t = useT()
  const { notify } = useToast()
  const [exporting, setExporting] = useState(false)
  const me = useMe()
  const remove = useDeleteTenantData()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<DeleteTenantDataResponse | null>(null)
  const phrase = `DELETE ${me.data?.tenantName ?? ''}`
  const matches = Boolean(me.data) && typed === phrase

  async function onDelete() {
    if (!matches) return
    try {
      setResult(await remove.mutateAsync(phrase))
      notify('success', t('data.deleted'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('data.deleteFailed'))
    }
    setConfirming(false)
    setTyped('')
  }

  async function onExport() {
    setExporting(true)
    try {
      const data = await fetchTenantExport()
      const day = new Date().toISOString().slice(0, 10)
      downloadJson(data, `${slug(data.tenantName)}-${day}.json`)
      notify('success', t('data.exported'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('data.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader title={t('data.title')} description={t('data.description')} />
      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-gray-900">{t('data.exportTitle')}</h2>
        <p className="text-sm text-gray-600">{t('data.exportBody')}</p>
        <div>
          <Button disabled={exporting} onClick={() => void onExport()}>
            {exporting ? t('data.exporting') : t('data.exportButton')}
          </Button>
        </div>
      </Card>
      {result && (
        <div className="mt-6">
          <Alert tone="success">
            {t('data.deleteResult', {
              bookings: Number(result.bookings),
              rooms: Number(result.rooms),
              sites: Number(result.sites),
              features: Number(result.features),
              blocks: Number(result.blocks),
              holidays: Number(result.holidays),
              auditEntries: Number(result.auditEntries),
            })}
          </Alert>
        </div>
      )}
      <Card className="mt-6 flex flex-col gap-3 border-error-300">
        <h2 className="font-semibold text-error-700">{t('data.dangerTitle')}</h2>
        <h3 className="font-medium text-gray-900">{t('data.deleteTitle')}</h3>
        <p className="text-sm text-gray-600">{t('data.deleteBody')}</p>
        <div>
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            {t('data.deleteButton')}
          </Button>
        </div>
      </Card>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(o) => {
          setConfirming(o)
          if (!o) setTyped('')
        }}
        title={t('data.deleteConfirmTitle')}
        confirmLabel={t('data.deleteConfirm')}
        destructive
        busy={remove.isPending}
        confirmDisabled={!matches}
        onConfirm={() => void onDelete()}
      >
        <p>{t('data.deleteBody')}</p>
        <div className="mt-4">
          <TextField
            label={t('data.deleteConfirmLabel', { phrase })}
            value={typed}
            autoComplete="off"
            error={typed && !matches ? t('data.deleteMismatch') : undefined}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
