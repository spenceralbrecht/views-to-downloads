'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { useEffect, useState } from "react"

// Define the structure for a video example
interface VideoExample {
  url: string
  platform: "tiktok" | "instagram"
  views: number
  view_url: string
}

// Define the structure for a format (can be imported or refined later)
interface Format {
  name: string;
  difficulty: string;
  description: string;
  examples?: VideoExample[] | string;
  // Add other relevant fields later, e.g., requires
}

// Add onClick prop to the component's props interface
interface FormatCardProps {
  format: Format;
  onClick: () => void;
}

export function FormatCard({ format, onClick }: FormatCardProps) {
  const [parsedExamples, setParsedExamples] = useState<VideoExample[]>([]);
  
  useEffect(() => {
    // Handle examples that might be a string (JSON) or already parsed array
    if (format.examples) {
      if (typeof format.examples === 'string') {
        try {
          setParsedExamples(JSON.parse(format.examples).slice(0, 3));
        } catch (e) {
          console.error('Error parsing examples JSON:', e);
          setParsedExamples([]);
        }
      } else if (Array.isArray(format.examples)) {
        setParsedExamples(format.examples.slice(0, 3));
      }
    }
  }, [format.examples]);

  return (
    <Card 
      className="relative bg-gray-900/80 border-gray-800 hover:bg-gradient-to-br hover:from-indigo-900/80 hover:to-purple-900/80 transition-all duration-300 h-full cursor-pointer shadow-md hover:shadow-lg hover:shadow-purple-500/10 group overflow-hidden"
      onClick={onClick} // Apply the onClick handler to the Card
    >
      {/* Subtle gradient overlay that becomes more visible on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 group-hover:from-blue-600/20 group-hover:to-purple-600/20 transition-opacity duration-300 pointer-events-none"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-lg lg:text-xl text-white group-hover:text-white/95">{format.name}</CardTitle>
        <CardDescription className="text-gray-400 group-hover:text-purple-300 transition-colors duration-300">
          {format.difficulty}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-sm lg:text-base text-gray-300 group-hover:text-gray-200 transition-colors duration-300 mb-4">{format.description}</p>
        
        {parsedExamples.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {parsedExamples.map((example, index) => (
              <div key={index} className="relative aspect-[9/16] rounded-md overflow-hidden border border-gray-800">
                <div className="w-full h-full">
                  <video
                    src={example.view_url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Subtle border highlight on hover */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </Card>
  );
} 