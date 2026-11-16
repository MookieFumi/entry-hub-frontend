import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/api/client'
import { Alert, PageHeader, Spinner } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { AppVersion } from '@/components/AppVersion'
import { useT } from '@/i18n'

export function Status() {
  const t = useT()
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => unwrap(api.GET('/api/v1/health', { signal })),
    retry: false,
  })
  return (
    <>
      <PageHeader title={t('status.title')} description={t('status.description')} />
      {health.isPending && <Spinner label={t('status.waking')} />}
      {health.data && (
        <Alert tone="success" title={t('status.okTitle')}>
          {t('status.okBody', { api: health.data.status, database: health.data.database })}
        </Alert>
      )}
      {health.error && (
        <div className="flex flex-col gap-3">
          <Alert tone="error" title={t('status.failedTitle')}>
            {health.error.message}
          </Alert>
          <div>
            <Button onClick={() => void health.refetch()}>{t('common.retry')}</Button>
          </div>
        </div>
      )}
      <AppVersion className="mt-6 text-gray-600" />
    </>
  )
}
