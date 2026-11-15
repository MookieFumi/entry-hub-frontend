import { Dialog } from '@base-ui/react/dialog'
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/errors'
import { useCreateRoom, useUpdateRoom, type Room } from '@/api/queries'
import { FeatureChecklist } from '@/components/FeatureFilter'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Alert } from '@/components/ui/Feedback'
import { useToast } from '@/components/ui/Toasts'
import { useT } from '@/i18n'

/** Create (no `room`) or edit a room. Validation mirrors the API; the server has the last word. */
export function RoomFormDialog({
  room,
  open,
  onOpenChange,
}: {
  room?: Room
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const t = useT()
  const create = useCreateRoom()
  const update = useUpdateRoom()
  const { notify } = useToast()
  const [name, setName] = useState(room?.name ?? '')
  const [floor, setFloor] = useState(String(room?.floor ?? 0))
  const [capacity, setCapacity] = useState(String(room?.capacity ?? 4))
  const initialFeatureIds = room?.features.map((f) => f.id) ?? []
  const [featureIds, setFeatureIds] = useState<string[]>(initialFeatureIds)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const busy = create.isPending || update.isPending

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    const f = Number(floor)
    const c = Number(capacity)
    if (!name.trim() || name.length > 100) next.name = t('roomForm.nameInvalid')
    if (!Number.isInteger(f) || f < -5 || f > 100) next.floor = t('roomForm.floorInvalid')
    if (!Number.isInteger(c) || c < 1 || c > 500) next.capacity = t('roomForm.capacityInvalid')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const body = { name: name.trim(), floor: f, capacity: c }
    // On edit, the catalog selection is only sent when it changed, so entries the room keeps that were
    // deactivated in the catalog are not dropped by an unrelated edit.
    const changed =
      featureIds.length !== initialFeatureIds.length ||
      featureIds.some((id) => !initialFeatureIds.includes(id))
    try {
      if (room)
        await update.mutateAsync({
          id: room.id,
          body: {
            ...body,
            equipment: null,
            siteId: null,
            isActive: null,
            featureIds: changed ? featureIds : null,
          },
        })
      else await create.mutateAsync({ ...body, equipment: [], siteId: null, featureIds })
      notify('success', room ? t('roomForm.updated') : t('roomForm.created'))
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'conflict')
        setErrors({ name: t('roomForm.duplicate') })
      else if (err instanceof ApiError && err.kind === 'validation') {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.fieldErrors))
          mapped[k.charAt(0).toLowerCase() + k.slice(1)] = v.join(' ')
        setErrors(mapped)
        setFormError(Object.keys(mapped).length ? null : err.message)
      } else setFormError(err instanceof Error ? err.message : t('common.unexpected'))
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-gray-900/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(94vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            {room ? t('roomForm.edit') : t('roomForm.new')}
          </Dialog.Title>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
            <TextField
              label={t('roomForm.name')}
              value={name}
              maxLength={100}
              error={errors.name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label={t('roomForm.floor')}
                type="number"
                value={floor}
                error={errors.floor}
                onChange={(e) => setFloor(e.target.value)}
              />
              <TextField
                label={t('roomForm.capacity')}
                type="number"
                value={capacity}
                error={errors.capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <FeatureChecklist
              includeInactive
              selected={featureIds}
              valueOf={(f) => f.id}
              onChange={setFeatureIds}
            />
            {formError && <Alert tone="error">{formError}</Alert>}
            <div className="flex justify-end gap-3">
              <Dialog.Close render={<Button variant="secondary" type="button" />}>
                {t('common.cancel')}
              </Dialog.Close>
              <Button type="submit" disabled={busy}>
                {busy ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
