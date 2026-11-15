import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('runs the action on press', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Reservar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does nothing when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Reservar
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
