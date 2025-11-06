import Link from 'next/link'

export default function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizes = {
    small: { logo: 24, text: 'text-base', tagline: 'text-[9px]' },
    default: { logo: 32, text: 'text-lg', tagline: 'text-[10px]' },
    large: { logo: 40, text: 'text-xl', tagline: 'text-xs' },
  }

  const sizeConfig = sizes[size]

  return (
    <Link href="/client/dashboard" className="flex items-center gap-3 group">
      {/* Logo Icon - Puzzle Pieces */}
      <div className="relative">
        <div className={`w-${sizeConfig.logo / 4} h-${sizeConfig.logo / 4} bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
          <svg
            width={sizeConfig.logo}
            height={sizeConfig.logo}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            {/* Puzzle pieces - stylized version */}
            <path
              d="M20 30 C20 20, 30 20, 35 25 L35 15 C35 10, 40 5, 45 5 L55 5 C60 5, 65 10, 65 15 L65 25 C70 20, 80 20, 80 30 L80 50 C80 60, 70 60, 65 55 L65 65 C65 70, 60 75, 55 75 L45 75 C40 75, 35 70, 35 65 L35 55 C30 60, 20 60, 20 50 Z"
              fill="currentColor"
              opacity="0.9"
            />
            {/* Second piece */}
            <path
              d="M45 45 L55 45 L55 55 L65 55 L65 65 C65 70, 60 75, 55 75 L45 75 C40 75, 35 70, 35 65 L35 55 Z"
              fill="currentColor"
              opacity="0.7"
            />
            {/* Third piece (detached) */}
            <path
              d="M70 15 C75 15, 80 20, 80 25 L80 35 C85 30, 90 30, 90 35 L90 45 C90 50, 85 55, 80 55 L75 50 C72 53, 68 55, 65 55 L60 50 Z"
              fill="currentColor"
              opacity="0.6"
              transform="rotate(-10 75 35)"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <span className={`${sizeConfig.text} font-bold text-gray-900 tracking-tight`}>
          <span className="text-blue-600">Supersender</span>
        </span>
        <span className={`${sizeConfig.tagline} text-gray-500 font-medium tracking-wide uppercase`}>
          by MAK Consulting
        </span>
      </div>
    </Link>
  )
}

