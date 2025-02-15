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
    question: "How does the content creation process work?",
    answer: "Add the link to your app and our AI will analyze it to create engaging TikTok-style videos that showcase your app's features. We'll generate hooks, captions, and edit the video to match viral TikTok formats."
  },
  {
    question: "What type of content can I create?",
    answer: "Right now you can create hook + app demo videos, which are the one of the highest performing content formats for driving downloads in 2025."
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
    question: "Do you guys support automatically publishing content to TikTok, IG, etc?",
    answer: "We don't support this and we have chosen not to for now. As app founders ourselves, we found that scheduled content from a third party IP address almost always performs worse than natively posted content. The platforms (TikTok, IG, etc) are always incentivized to bring people into the app so there are various features that would also be missing out on by remotely posting (TikTok AI sound selection for example) which again can negatively impact performance. We want to help you drive the most possible views and downloads so we encourage you to post all our content natively."
  },
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