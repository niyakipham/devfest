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

export const PotIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M4 12.2h16a8 8 0 0 1-4.4 7.2H8.4A8 8 0 0 1 4 12.2Z" />
    <path d="M8.5 9.4c0-1.5 1-1.6 1-3M12 9.4c0-1.5 1-1.6 1-3M15.5 9.4c0-1.5 1-1.6 1-3" />
  </svg>
)

export const CycloIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M3.5 10.5c.6-3.6 3.3-5.6 7-5.6s6.4 2 7 5.6" />
    <path d="M3.5 10.5h14" />
    <circle cx="6.5" cy="16.8" r="2.4" />
    <circle cx="15.5" cy="16.8" r="2.4" />
    <path d="M6.5 14.4v-2M15.5 14.4v-2M15.5 12.4l3-2.2M5 21h14" />
  </svg>
)

export const LotusIcon = ({ size }: IconProps) => (
  <svg {...base(size)} aria-hidden="true">
    <path d="M12 4.5c1.6 2.3 1.6 5.2 0 7.4-1.6-2.2-1.6-5.1 0-7.4Z" />
    <path d="M5.5 7.5c2.6.3 4.7 2.3 5.3 5-2.6-.3-4.7-2.4-5.3-5Z" />
    <path d="M18.5 7.5c-2.6.3-4.7 2.3-5.3 5 2.6-.3 4.7-2.4 5.3-5Z" />
    <path d="M3 13.5c2.8 3.4 5.6 5 9 5s6.2-1.6 9-5c-1.2 4.6-4.3 7.5-9 7.5s-7.8-2.9-9-7.5Z" />
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
