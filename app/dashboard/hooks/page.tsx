import { Button } from "@/components/ui/button"

export default function HooksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Hooks Manager</h1>
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold">Oops! You need to add an app</h2>
        <p className="text-gray-600">You need to add an app to generate viral hooks</p>
      </div>
      <Button className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm">
        <span className="text-gray-600">+</span>
        <span>Add new app</span>
      </Button>
      <Button className="mt-4 bg-gray-200 text-gray-600 rounded-lg px-4 py-2">
        Generate New Hooks
      </Button>
    </div>
  )
}

