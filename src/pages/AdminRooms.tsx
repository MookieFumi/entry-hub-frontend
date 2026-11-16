import { useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/errors'
import { useRooms, useUpdateRoom, type Room } from '@/api/queries'
import { RoomFormDialog } from '@/components/RoomFormDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import { useToast } from '@/components/ui/Toasts'
import { useT } from '@/i18n'

export function AdminRooms() {
  const t = useT()
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
          name: null,
          floor: null,
          capacity: null,
          equipment: null,
          siteId: null,
          featureIds: null,
          isActive: !room.isActive,
        },
      })
      notify('success', room.isActive ? t('admin.rooms.deactivated') : t('admin.rooms.reactivated'))
    } catch (err) {
      notify('error', err instanceof ApiError ? err.message : t('admin.rooms.toggleFailed'))
    }
    setToggling(null)
  }

  return (
    <>
      <PageHeader
        title={t('admin.rooms.title')}
        actions={<Button onClick={() => setCreating(true)}>{t('admin.rooms.new')}</Button>}
      />
      {rooms.isPending && <Skeleton className="h-40" />}
      {rooms.error && (
        <ErrorState message={rooms.error.message} onRetry={() => void rooms.refetch()} />
      )}
      {rooms.data && rooms.data.items.length === 0 && (
        <EmptyState title={t('admin.rooms.noneTitle')}>{t('admin.rooms.noneHint')}</EmptyState>
      )}
      {rooms.data && rooms.data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-300 bg-white">
            <table className="nums w-full text-left text-sm">
              <thead className="bg-brand-50 text-xs font-semibold tracking-wider text-brand-900 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {t('admin.rooms.name')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('admin.rooms.floor')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('admin.rooms.capacity')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('admin.rooms.buffers')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('admin.rooms.approval')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {t('admin.rooms.state')}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">{t('admin.rooms.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rooms.data.items.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-gray-200 transition-colors duration-150 hover:bg-gray-25"
                  >
                    <th scope="row" className="px-4 py-3 font-semibold text-gray-900">
                      {r.name}
                    </th>
                    <td className="px-4 py-3">{r.floor}</td>
                    <td className="px-4 py-3">{r.capacity}</td>
                    <td className="px-4 py-3">
                      {t('admin.rooms.bufferText', {
                        before: Number(r.bufferBeforeMinutes),
                        after: Number(r.bufferAfterMinutes),
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.requiresApproval ? 'warning' : 'gray'}>
                        {r.requiresApproval
                          ? t('admin.rooms.requiresApproval')
                          : t('admin.rooms.noApproval')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.isActive ? 'success' : 'warning'}>
                        {r.isActive ? t('admin.rooms.active') : t('admin.rooms.inactive')}
                      </Badge>
                    </td>
                    <td className="flex justify-end gap-2 px-4 py-3">
                      <Link to={`/admin/rooms/${r.id}/blocks`}>
                        <Button variant="secondary">{t('blocks.manage')}</Button>
                      </Link>
                      <Button variant="secondary" onClick={() => setEditing(r)}>
                        {t('admin.rooms.edit')}
                      </Button>
                      <Button variant="secondary" onClick={() => setToggling(r)}>
                        {r.isActive ? t('admin.rooms.deactivate') : t('admin.rooms.reactivate')}
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
        title={
          toggling?.isActive ? t('admin.rooms.deactivateTitle') : t('admin.rooms.reactivateTitle')
        }
        confirmLabel={
          toggling?.isActive ? t('admin.rooms.deactivate') : t('admin.rooms.reactivate')
        }
        destructive={toggling?.isActive}
        busy={update.isPending}
        onConfirm={() => toggling && void toggle(toggling)}
      >
        <p>
          {toggling?.isActive ? t('admin.rooms.deactivateBody') : t('admin.rooms.reactivateBody')}
        </p>
      </ConfirmDialog>
    </>
  )
}
