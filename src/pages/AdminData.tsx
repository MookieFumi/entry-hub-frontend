import { useState } from 'react'
import { ApiError } from '@/api/errors'
import { fetchTenantExport } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { downloadJson, slug } from '@/lib/download'
import { useT } from '@/i18n'

/** Facilities download everything the tenant has stored. */
export function AdminData() {
  const t = useT()
  const { notify } = useToast()
  const [exporting, setExporting] = useState(false)

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
    </>
  )
}
