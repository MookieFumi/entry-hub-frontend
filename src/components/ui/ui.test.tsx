import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { SelectField, TextField } from './Field'
import { Alert, Card, EmptyState, ErrorState, PageHeader, Skeleton, Spinner } from './Feedback'
import { Pagination } from './Pagination'
import { ToastProvider, useToast } from './Toasts'

afterEach(() => vi.useRealTimers())

describe('Alert', () => {
  it('announces errors with role alert and other tones as a status', () => {
    render(
      <>
        <Alert tone="error" title="Broken">
          Details
        </Alert>
        <Alert tone="success">Done</Alert>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Broken')
    expect(screen.getByRole('status')).toHaveTextContent('Done')
  })
})

describe('Spinner and Skeleton', () => {
  it('exposes the loading label to assistive technology and hides the skeleton', () => {
    const { container } = render(
      <>
        <Spinner label="Buscando" />
        <Skeleton className="h-4" />
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Buscando…')
    expect(container.querySelector('[aria-hidden="true"].animate-pulse')).not.toBeNull()
  })
})

describe('EmptyState, Card and PageHeader', () => {
  it('render their content', () => {
    render(
      <>
        <EmptyState title="Nothing here" action={<a href="/x">Go</a>}>
          Try again later
        </EmptyState>
        <Card>Inside the card</Card>
        <PageHeader title="Rooms" description="All rooms" actions={<button>Add</button>} />
      </>,
    )
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument()
    expect(screen.getByText('Try again later')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go' })).toBeInTheDocument()
    expect(screen.getByText('Inside the card')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Rooms' })).toBeInTheDocument()
    expect(screen.getByText('All rooms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('offers a retry only when there is a handler', async () => {
    const onRetry = vi.fn()
    const { rerender } = render(<ErrorState message="Boom" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
    rerender(<ErrorState message="Boom" />)
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })
})

describe('TextField and SelectField', () => {
  it('tie label, hint and error to the control', () => {
    render(
      <>
        <TextField label="Name" hint="Up to 80 characters" />
        <TextField label="Title" error="Required" />
        <SelectField label="Floor" hint="Pick one">
          <option value="1">1</option>
        </SelectField>
      </>,
    )
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Up to 80 characters')
    const title = screen.getByLabelText('Title')
    expect(title).toBeInvalid()
    expect(title).toHaveAccessibleDescription('Required')
    expect(screen.getByLabelText('Floor')).toHaveAccessibleDescription('Pick one')
  })

  it('can be filled in with the keyboard', async () => {
    render(<TextField label="Name" />)
    await userEvent.tab()
    expect(screen.getByLabelText('Name')).toHaveFocus()
    await userEvent.keyboard('Gaudí')
    expect(screen.getByLabelText('Name')).toHaveValue('Gaudí')
  })
})

describe('Pagination', () => {
  it('shows the position and disables the ends', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Pagination page={1} pageSize={20} totalCount={45} onChange={onChange} />,
    )
    expect(screen.getByText(/Página 1 de 3 · 45 en total/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onChange).toHaveBeenCalledWith(2)
    rerender(<Pagination page={3} pageSize={20} totalCount={45} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('shows one page when there is nothing', () => {
    render(<Pagination page={1} pageSize={20} totalCount={0} onChange={() => {}} />)
    expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  function Harness({ onConfirm }: { onConfirm: () => void }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>Open</button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Cancel booking"
          confirmLabel="Yes, cancel"
          onConfirm={onConfirm}
        >
          This cannot be undone.
        </ConfirmDialog>
      </>
    )
  }

  it('opens, confirms, and returns focus to the trigger when closed', async () => {
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Cancel booking' })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    await userEvent.click(screen.getByRole('button', { name: 'Yes, cancel' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

describe('Toasts', () => {
  function Notifier() {
    const { notify } = useToast()
    return <button onClick={() => notify('success', 'Saved')}>Notify</button>
  }

  it('shows a notice in the live region and removes it after 6 seconds', () => {
    vi.useFakeTimers()
    const { container } = render(
      <ToastProvider>
        <Notifier />
      </ToastProvider>,
    )
    act(() => screen.getByRole('button', { name: 'Notify' }).click())
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Saved')
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })
})
