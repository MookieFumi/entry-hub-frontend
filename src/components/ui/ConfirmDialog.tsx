import { Dialog } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  confirmLabel: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-gray-900/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-gray-900">{title}</Dialog.Title>
          <Dialog.Description render={<div />} className="mt-2 text-sm text-gray-600">
            {children}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close render={<Button variant="secondary" />}>Volver</Dialog.Close>
            <Button
              variant={destructive ? 'destructive' : 'primary'}
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? 'Procesando…' : confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
