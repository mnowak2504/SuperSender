/**
 * MAK Consulting Logo Component
 * 
 * Based on the official logo design:
 * - Puzzle pieces (three interconnected pieces, one detached) in blue outline
 * - "mak consulting" text in stylized lowercase script
 * - "FOR BETTER BUSINESS RESULTS" tagline in uppercase
 * - Blue accent color matching brand
 * 
 * If you have the actual logo file (SVG/PNG), place it in /public/logo-mak.svg
 * and set useImageFile={true} to use it instead of the SVG representation.
 */

import Link from 'next/link'
import Image from 'next/image'

interface MAKLogoProps {
  size?: 'small' | 'default' | 'large'
  showTagline?: boolean
  className?: string
  useImageFile?: boolean
  imagePath?: string
}

export default function MAKLogo({ 
  size = 'default', 
  showTagline = false,
  className = '',
  useImageFile = false,
  imagePath = '/logo-mak.svg'
}: MAKLogoProps) {
  const sizeConfig = {
    small: { 
      container: 'h-8', 
      icon: 'w-6 h-6',
      text: 'text-sm',
      tagline: 'text-[8px]',
      gap: 'gap-2'
    },
    default: { 
      container: 'h-10', 
      icon: 'w-8 h-8',
      text: 'text-base',
      tagline: 'text-[9px]',
      gap: 'gap-3'
    },
    large: { 
      container: 'h-12', 
      icon: 'w-10 h-10',
      text: 'text-lg',
      tagline: 'text-[10px]',
      gap: 'gap-4'
    },
  }

  const config = sizeConfig[size]

  // If using image file, render that instead
  if (useImageFile) {
    const imageDimensions = {
      small: { width: 96, height: 96 },      // ~3x larger (was 32)
      default: { width: 144, height: 144 }, // ~3x larger (was 48)
      large: { width: 192, height: 192 },   // ~3x larger (was 64)
    }
    const dims = imageDimensions[size]

    return (
      <Link 
        href="/client/dashboard" 
        className={`flex items-center ${config.gap} group ${className}`}
        title="MAK Consulting - For Better Business Results"
      >
        <div className={`relative`} style={{ width: dims.width, height: dims.height, minWidth: dims.width, minHeight: dims.height }}>
          <Image
            src={imagePath}
            alt="MAK Consulting Logo"
            width={dims.width}
            height={dims.height}
            className="object-contain w-full h-full"
            priority
          />
        </div>
        {showTagline && (
          <div className="flex flex-col">
            <span className={`${config.tagline} text-[#0052CC] font-medium tracking-wider uppercase`}>
              FOR BETTER BUSINESS RESULTS
            </span>
          </div>
        )}
      </Link>
    )
  }

  return (
    <Link 
      href="/client/dashboard" 
      className={`flex items-center ${config.gap} group ${className}`}
      title="MAK Consulting - For Better Business Results"
    >
      {/* Logo Icon - Puzzle Pieces (SVG representation based on official design) */}
      <div className={`relative ${config.icon}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background - subtle circle frame (representing the purple-grey frame from original) */}
          <circle cx="50" cy="50" r="48" stroke="#9CA3AF" strokeWidth="0.5" fill="none" opacity="0.3" />
          
          {/* Main puzzle pieces - blue outline style */}
          {/* First piece (bottom-left, interlocked) */}
          <path
            d="M20 35 C20 25, 30 25, 35 30 L35 20 C35 15, 40 10, 45 10 L55 10 C60 10, 65 15, 65 20 L65 30 C70 25, 80 25, 80 35 L80 55 C80 65, 70 65, 65 60 L65 70 C65 75, 60 80, 55 80 L45 80 C40 80, 35 75, 35 70 L35 60 C30 65, 20 65, 20 55 Z"
            stroke="#0052CC"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Second piece (top-right, interlocked) */}
          <path
            d="M50 50 L60 50 L60 60 L70 60 L70 70 C70 75, 65 80, 60 80 L50 80 C45 80, 40 75, 40 70 L40 60 Z"
            stroke="#0052CC"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Third piece (detached, rotated - representing the detached puzzle piece) */}
          <path
            d="M68 18 C73 18, 78 23, 78 28 L78 38 C83 33, 88 33, 88 38 L88 48 C88 53, 83 58, 78 58 L73 53 C70 56, 66 58, 63 58 L58 53 Z"
            stroke="#0052CC"
            strokeWidth="2.5"
            fill="none"
            transform="rotate(-10 73 38)"
          />
        </svg>
      </div>

      {/* Text - matching original logo style */}
      <div className="flex flex-col">
        <span 
          className={`${config.text} font-normal text-gray-900 lowercase tracking-wide`}
          style={{ 
            fontFamily: 'cursive, serif',
            fontWeight: 400,
            letterSpacing: '0.05em'
          }}
        >
          mak consulting
        </span>
        {showTagline && (
          <span className={`${config.tagline} text-[#0052CC] font-semibold tracking-widest uppercase mt-0.5`}>
            FOR BETTER BUSINESS RESULTS
          </span>
        )}
      </div>
    </Link>
  )
}

