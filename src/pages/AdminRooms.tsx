import { useState } from 'react'
import { ApiError } from '@/api/errors'
import { useRooms, useUpdateRoom, type Room } from '@/api/queries'
import { RoomFormDialog } from '@/components/RoomFormDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toasts'

export function AdminRooms() {
  const [page, setPage] = useState(1)
  const rooms = useRooms({ includeInactive: true, page, pageSize: 20 })
  const update = useUpdateRoom()
  const { notify } = useToast()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [toggling, setToggling] = useState<Room | null>(null)

  async function toggle(room: Room) {
    try {
      await update.mutateAsync({
        id: room.id,
        body: {
          name: room.name,
          floor: Number(room.floor),
          capacity: Number(room.capacity),
          equipment: room.equipment,
          isActive: !room.isActive,
        },
      })
      notify('success', room.isActive ? 'Sala desactivada.' : 'Sala reactivada.')
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : 'No se pudo cambiar el estado.')
    }
    setToggling(null)
  }

  return (
    <>
      <PageHeader
        title="Administración de salas"
        actions={<Button onClick={() => setCreating(true)}>Nueva sala</Button>}
      />
      {rooms.isPending && <Skeleton className="h-40" />}
      {rooms.error && (
        <ErrorState message={rooms.error.message} onRetry={() => void rooms.refetch()} />
      )}
      {rooms.data && rooms.data.items.length === 0 && (
        <EmptyState title="Todavía no hay salas">
          Crea la primera con el botón «Nueva sala».
        </EmptyState>
      )}
      {rooms.data && rooms.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nombre
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Planta
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Capacidad
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rooms.data.items.map((r) => (
                  <tr key={r.id} className="border-t border-gray-200">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                      {r.name}
                    </th>
                    <td className="px-4 py-3">{r.floor}</td>
                    <td className="px-4 py-3">{r.capacity}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.isActive ? 'success' : 'warning'}>
                        {r.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="flex justify-end gap-2 px-4 py-3">
                      <Button variant="secondary" onClick={() => setEditing(r)}>
                        Editar
                      </Button>
                      <Button variant="secondary" onClick={() => setToggling(r)}>
                        {r.isActive ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={Number(rooms.data.page)}
            pageSize={Number(rooms.data.pageSize)}
            totalCount={Number(rooms.data.totalCount)}
            onChange={setPage}
          />
        </>
      )}
      {creating && <RoomFormDialog open onOpenChange={(o) => !o && setCreating(false)} />}
      {editing && (
        <RoomFormDialog
          key={editing.id}
          room={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={toggling !== null}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.isActive ? '¿Desactivar la sala?' : '¿Reactivar la sala?'}
        confirmLabel={toggling?.isActive ? 'Desactivar' : 'Reactivar'}
        destructive={toggling?.isActive}
        busy={update.isPending}
        onConfirm={() => toggling && void toggle(toggling)}
      >
        <p>
          {toggling?.isActive
            ? 'La sala saldrá del catálogo y no admitirá reservas nuevas.'
            : 'La sala volverá a aparecer en el catálogo.'}
        </p>
      </ConfirmDialog>
    </>
  )
}
