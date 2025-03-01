//// filepath: /c:/Users/Sathwik/Downloads/morphic/components/ui/icons.tsx
'use client'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="black" />
      {/* Magnifying Glass */}
      <circle cx="115" cy="115" r="35" fill="none" stroke="white" strokeWidth="12" />
      <line x1="140" y1="140" x2="170" y2="170" stroke="white" strokeWidth="12" strokeLinecap="round" />
    </svg>
  )
}

export { IconLogo }