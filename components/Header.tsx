import Link from 'next/link'
import { Download } from 'lucide-react'

export function Header() {
  return (
    <header className="py-4 px-4 md:px-6 flex items-center justify-between bg-transparent">
      <Link href="/" className="flex items-center space-x-2">
        <Download className="h-6 w-6 text-[#4287f5]" />
        <span className="text-xl font-bold">Views to Downloads</span>
      </Link>
    </header>
  )
}

