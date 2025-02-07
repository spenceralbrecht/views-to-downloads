import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function LoadingAppCard() {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <CardHeader className="p-0 mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
          </CardTitle>
          <span className="text-sm text-gray-500">
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-4 w-full bg-gray-200 animate-pulse rounded"></div>
        <div className="mt-2 flex items-center justify-center">
          <svg 
            className="animate-spin h-5 w-5 text-blue-500" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-2 text-sm text-gray-500">Loading app details...</span>
        </div>
      </CardContent>
    </Card>
  )
}
