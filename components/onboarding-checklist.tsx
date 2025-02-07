import { Check } from "lucide-react"

export function OnboardingChecklist() {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-violet-200 p-2 rounded-lg">
            <span className="text-xl">S</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Subscription required</h3>
            <p className="text-gray-500 text-sm">Estimated 2-3 minutes</p>
          </div>
        </div>
        <Check className="text-green-500 h-5 w-5" />
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-2 rounded-lg flex items-center justify-center">
            <span className="text-xl">+</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Add your first product</h3>
            <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
          </div>
        </div>
        <Check className="text-green-500 h-5 w-5" />
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-2 rounded-lg">
            <span className="text-xl">📹</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Upload product demo video</h3>
            <p className="text-gray-500 text-sm">Estimated 30 seconds</p>
          </div>
        </div>
        <Check className="text-green-500 h-5 w-5" />
      </div>
    </div>
  )
}
