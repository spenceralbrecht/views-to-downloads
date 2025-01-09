import Link from 'next/link'
import { Download } from 'lucide-react'

export function Header() {
  return (
    <header className="py-4 px-4 md:px-6 flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-2">
        <Download className="h-6 w-6 text-[#4287f5]" />
        <span className="text-xl font-bold">Views to Downloads</span>
      </Link>
      <nav className="hidden md:flex space-x-4">
        <Link href="/#features" className="text-sm font-medium hover:text-[#4287f5]">
          Features
        </Link>
        <Link href="/#pricing" className="text-sm font-medium hover:text-[#4287f5]">
          Pricing
        </Link>
      </nav>
    </header>
  )
}

