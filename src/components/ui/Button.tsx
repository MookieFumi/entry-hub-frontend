import { Button as BaseButton } from '@base-ui/react/button'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'secondary' | 'destructive'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  destructive: 'bg-error-600 text-white hover:bg-error-700',
}

export type ButtonProps = ComponentProps<typeof BaseButton> & { variant?: Variant }

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <BaseButton
      className={`${base} ${variants[variant]} ${typeof className === 'string' ? className : ''}`}
      {...props}
    />
  )
}
