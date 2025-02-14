import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

const tiktokTextStyle = "text-white [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]"

const faqs = [
  {
    question: "How does the video creation process work?",
    answer: "Simply upload your app demo video, and our AI will analyze it to create engaging TikTok-style videos that showcase your app's features. We'll generate hooks, captions, and edit the video to match viral TikTok formats."
  },
  {
    question: "What type of videos can I create?",
    answer: "You can create various types of TikTok-style videos including app demos, feature showcases, and user testimonials. Our AI helps optimize your content for maximum engagement and app downloads."
  },
  {
    question: "How many videos can I create?",
    answer: "The number of videos you can create depends on your subscription plan. Our Starter plan includes 10 videos per month, Growth plan includes 50 videos, and Scale plan includes 100 videos per month."
  },
  {
    question: "Can I customize the generated hooks and captions?",
    answer: "Yes! While our AI generates engaging hooks automatically, you have full control to edit and customize them to match your brand voice and style."
  },
  {
    question: "What formats do you support for demo videos?",
    answer: "We currently support MP4 video files up to 50MB in size. Your demo video should showcase your app's key features that you want to highlight in the TikTok videos."
  },
  {
    question: "How do I get started?",
    answer: "Simply sign up for an account, choose your subscription plan, and upload your first demo video. Our AI will guide you through the process of creating engaging TikTok content for your app."
  }
]

export default function FAQ() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 mt-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Everything you need to know about creating viral app content
        </p>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <div className={cn("p-2 rounded", tiktokTextStyle)}>
                {faq.answer}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
} 