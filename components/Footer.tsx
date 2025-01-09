import Link from 'next/link'
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Views to Downloads. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4 items-center">
            <Link href="/privacy-policy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4287f5] dark:hover:text-[#4287f5]">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4287f5] dark:hover:text-[#4287f5]">
              Terms of Service
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#4287f5] dark:hover:text-[#4287f5]"
              onClick={() => window.location.href = 'mailto:support@viewstodownloads.com'}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}

