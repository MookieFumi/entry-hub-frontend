import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/Feedback'
import { useT } from '@/i18n'

export function NotFound() {
  const t = useT()
  return (
    <EmptyState
      title={t('notFound.title')}
      action={
        <Link className="font-semibold text-brand-700 underline hover:text-brand-900" to="/">
          {t('notFound.home')}
        </Link>
      }
    >
      {t('notFound.body')}
    </EmptyState>
  )
}
