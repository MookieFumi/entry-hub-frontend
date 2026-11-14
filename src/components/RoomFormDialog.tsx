import { Dialog } from '@base-ui/react/dialog'
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/errors'
import { useCreateRoom, useUpdateRoom, type Room } from '@/api/queries'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'

/** Alta (sin `room`) o edición de una sala. Validación espejo de la API; el servidor decide en última instancia. */
export function RoomFormDialog({
  room,
  open,
  onOpenChange,
}: {
  room?: Room
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const create = useCreateRoom()
  const update = useUpdateRoom()
  const { notify } = useToast()
  const [name, setName] = useState(room?.name ?? '')
  const [floor, setFloor] = useState(String(room?.floor ?? 0))
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 4))
  const [equipment, setEquipment] = useState(room?.equipment.join(', ') ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const busy = create.isPending || update.isPending

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    const f = Number(floor)
    const c = Number(capacity)
    if (!name.trim() || name.length > 100)
      next.name = 'Nombre obligatorio, de hasta 100 caracteres.'
    if (!Number.isInteger(f) || f < -5 || f > 100) next.floor = 'Planta entre -5 y 100.'
    if (!Number.isInteger(c) || c < 1 || c > 500) next.capacity = 'Capacidad entre 1 y 500.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const body = {
      name: name.trim(),
      floor: f,
      capacity: c,
      equipment: equipment
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    }
    try {
      if (room)
        await update.mutateAsync({ id: room.id, body: { ...body, isActive: room.isActive } })
      else await create.mutateAsync(body)
      notify('success', room ? 'Sala actualizada.' : 'Sala creada.')
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'conflict')
        setErrors({ name: 'Ya existe una sala con ese nombre.' })
      else if (err instanceof ApiError && err.kind === 'validation') {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.fieldErrors))
          mapped[k.charAt(0).toLowerCase() + k.slice(1)] = v.join(' ')
        setErrors(mapped)
        setFormError(Object.keys(mapped).length ? null : err.message)
      } else setFormError(err instanceof Error ? err.message : 'Error inesperado.')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-gray-900/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(94vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            {room ? 'Editar sala' : 'Nueva sala'}
          </Dialog.Title>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
            <TextField
              label="Nombre"
              value={name}
              maxLength={100}
              error={errors.name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Planta"
                type="number"
                value={floor}
                error={errors.floor}
                onChange={(e) => setFloor(e.target.value)}
              />
              <TextField
                label="Capacidad"
                type="number"
                value={capacity}
                error={errors.capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <TextField
              label="Equipamiento"
              hint="Separado por comas"
              value={equipment}
              error={errors.equipment}
              onChange={(e) => setEquipment(e.target.value)}
            />
            {formError && <Alert tone="error">{formError}</Alert>}
            <div className="flex justify-end gap-3">
              <Dialog.Close render={<Button variant="secondary" type="button" />}>
                Cancelar
              </Dialog.Close>
              <Button type="submit" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
