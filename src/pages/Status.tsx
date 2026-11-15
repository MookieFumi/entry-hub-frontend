import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '@/api/client'
import { Alert, PageHeader, Spinner } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'

export function Status() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => unwrap(api.GET('/api/v1/health', { signal })),
    retry: false,
  })
  return (
    <>
      <PageHeader
        title="Estado de la demo"
        description="El servidor gratuito se duerme tras un rato sin uso; la primera petición puede tardar unos segundos."
      />
      {health.isPending && <Spinner label="Despertando el servidor" />}
      {health.data && (
        <Alert tone="success" title="Todo en marcha">
          API: {health.data.status} · Base de datos: {health.data.database}
        </Alert>
      )}
      {health.error && (
        <div className="flex flex-col gap-3">
          <Alert tone="error" title="No se pudo contactar con la API">
            {health.error.message}
          </Alert>
          <div>
            <Button onClick={() => void health.refetch()}>Reintentar</Button>
          </div>
        </div>
      )}
    </>
  )
}
