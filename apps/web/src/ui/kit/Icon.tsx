import { iconPaths, type IconName } from './icons'

type Props = {
  name: IconName
  size?: number
  className?: string | undefined
}

export function Icon({ name, size = 20, className }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}
