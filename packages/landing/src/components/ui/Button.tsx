import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer',
          'rounded-[2px] border',
          // sizes
          size === 'sm' && 'px-4 py-2 text-sm',
          size === 'md' && 'px-6 py-3 text-base',
          size === 'lg' && 'px-8 py-4 text-lg',
          // variants
          variant === 'primary' && [
            'bg-[var(--accent)] text-[#050508] border-transparent',
            'hover:opacity-90 active:scale-[0.98]',
          ],
          variant === 'secondary' && [
            'bg-transparent text-[var(--accent)] border-[var(--accent)]',
            'hover:bg-[var(--accent-glow)] active:scale-[0.98]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-[#A1A1AA] border-[rgba(255,255,255,0.06)]',
            'hover:border-[rgba(255,255,255,0.12)] hover:text-[#FAFAFA]',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
