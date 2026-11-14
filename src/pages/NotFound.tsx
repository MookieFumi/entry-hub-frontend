import { Link } from 'react-router'
import { EmptyState } from '@/components/ui/Feedback'

export function NotFound() {
  return (
    <EmptyState
      title="Página no encontrada"
      action={
        <Link className="text-brand-700 underline" to="/">
          Volver al inicio
        </Link>
      }
    >
      La dirección no existe o ha cambiado.
    </EmptyState>
  )
}
