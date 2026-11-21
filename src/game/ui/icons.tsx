/** Minimal white-silhouette icon set (24px grid, currentColor). */

interface IconProps {
  size?: number
}

const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const MapIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M9 4 3.8 6v14L9 18l6 2 5.2-2V4L15 6 9 4Z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

export const BookIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
    <path d="M8 7h7M8 11h5" />
  </svg>
)

export const CameraIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.2-2h6l1.2 2h1.8A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z" />
    <circle cx="12" cy="12.4" r="3.4" />
  </svg>
)

export const GearIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M4.5 7.5l2 1.2M17.5 15.3l2 1.2M4.5 16.5l2-1.2M17.5 8.7l2-1.2" />
  </svg>
)

export const HelpIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M9.4 9.2a2.8 2.8 0 1 1 4 2.5c-.9.5-1.4 1.1-1.4 2.1" />
    <path d="M12 17.2h.01" />
  </svg>
)

export const CloseIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const PinIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 21s6.5-6.2 6.5-11a6.5 6.5 0 1 0-13 0C5.5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
)
