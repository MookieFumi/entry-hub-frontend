import { useT } from '@/i18n'
import { Button } from './Button'

export function Pagination({
  page,
  pageSize,
  totalCount,
  onChange,
}: {
  page: number
  pageSize: number
  totalCount: number
  onChange: (page: number) => void
}) {
  const t = useT()
  const pages = Math.max(1, Math.ceil(totalCount / pageSize))
  return (
    <nav
      aria-label={t('pagination.label')}
      className="flex items-center justify-between gap-3 pt-4"
    >
      <p className="text-sm text-gray-600" aria-live="polite">
        {t('pagination.summary', { page, pages, total: totalCount })}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          {t('pagination.previous')}
        </Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          {t('pagination.next')}
        </Button>
      </div>
    </nav>
  )
}
