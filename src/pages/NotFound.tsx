import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/Feedback'
import { useT } from '@/i18n'

export function NotFound() {
  const t = useT()
  return (
    <EmptyState
      title={t('notFound.title')}
      action={
        <Link className="text-brand-700 underline" to="/">
          {t('notFound.home')}
        </Link>
      }
    >
      {t('notFound.body')}
    </EmptyState>
  )
}
