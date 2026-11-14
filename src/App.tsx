import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

/** Pantalla provisional: se sustituirá por el layout con rutas en la tarea F5. */
export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6">
      <Badge tone="brand">Demo v1.0.0</Badge>
      <h1 className="text-3xl font-semibold text-gray-900">EntryHub</h1>
      <p className="text-gray-600">
        Reserva de salas. Esqueleto del frontal listo para empezar las pantallas.
      </p>
      <div>
        <Button>Reservar sala</Button>
      </div>
    </main>
  )
}
