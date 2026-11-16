import { Button as BaseButton } from '@base-ui/react/button'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'secondary' | 'destructive'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap ' +
  'transition-[background-color,border-color,box-shadow,translate] duration-150 active:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[disabled]:active:translate-y-0'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'border border-gray-300 bg-white text-gray-800 hover:border-brand-400 hover:bg-brand-25 hover:text-brand-800',
  destructive: 'bg-error-600 text-white shadow-sm hover:bg-error-700',
}

/** Same look for links that act as buttons (for example "Reprogramar"). */
export const buttonClass = (variant: Variant = 'primary') => `${base} ${variants[variant]}`

export type ButtonProps = ComponentProps<typeof BaseButton> & { variant?: Variant }

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <BaseButton
      className={`${base} ${variants[variant]} ${typeof className === 'string' ? className : ''}`}
      {...props}
    />
  )
}
