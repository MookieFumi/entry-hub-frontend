import { Dialog } from '@base-ui/react/dialog'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  destructive,
  busy,
  confirmDisabled,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  confirmLabel: string
  destructive?: boolean
  busy?: boolean
  /** Keeps the confirm button disabled without showing the busy label. */
  confirmDisabled?: boolean
  onConfirm: () => void
}) {
  const t = useT()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-brand-950/55 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg transition-[opacity,scale] duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="font-display text-xl text-gray-900">{title}</Dialog.Title>
          <Dialog.Description render={<div />} className="mt-2 text-sm text-gray-600">
            {children}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close render={<Button variant="secondary" />}>{t('common.back')}</Dialog.Close>
            <Button
              variant={destructive ? 'destructive' : 'primary'}
              disabled={busy || confirmDisabled}
              onClick={onConfirm}
            >
              {busy ? t('common.processing') : confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
