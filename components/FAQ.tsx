import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "How does the content creation process work?",
    answer: "Add the link to your app and our AI will analyze it to create engaging TikTok-style videos that showcase your app's features. We'll generate hooks, captions, and edit the video to match viral TikTok formats."
  },
  {
    question: "What type of content can I create?",
    answer: "Right now you can create hook + app demo videos, which are the one of the highest performing content formats for driving downloads in 2023. We're constantly adding new formats and templates based on what's working on social platforms."
  },
  {
    question: "How many videos can I create?",
    answer: "The number of videos you can create depends on your subscription plan. Our Starter plan includes 10 videos per month, Growth plan includes 50 videos, and Scale plan includes 150 videos per month."
  },
  {
    question: "Can I customize the generated hooks and captions?",
    answer: "Yes! While our AI generates engaging hooks automatically, you have full control to edit and customize them to match your brand voice and style. Our platform allows you to make changes to any part of the generated content."
  },
  {
    question: "Do you support automatically publishing content to TikTok, IG, etc?",
    answer: "We don't support this and we have chosen not to for now. As app founders ourselves, we found that scheduled content from a third party IP address almost always performs worse than natively posted content. The platforms (TikTok, IG, etc) are always incentivized to bring people into the app so there are various features that would also be missing out on by remotely posting (TikTok AI sound selection for example) which again can negatively impact performance. We want to help you drive the most possible views and downloads so we encourage you to post all our content natively."
  },
  {
    question: "How long does it take to generate a video?",
    answer: "Our AI typically generates videos in under 2 minutes. This includes analyzing your app, creating the script, generating the hook, and producing the final video. It's significantly faster than hiring a creator or agency."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time with no questions asked. You'll still have access to your plan until the end of your current billing period."
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="w-full max-w-5xl mx-auto mb-32 px-4">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
          <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 inline-block">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Everything you need to know about creating viral app content
        </p>
      </div>
      
      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:p-8 shadow-lg">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`} 
              className={cn(
                "border-b border-gray-200 dark:border-gray-800 overflow-hidden",
                index === faqs.length - 1 ? "border-b-0" : ""
              )}
            >
              <AccordionTrigger className="text-left py-5 text-lg font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 dark:text-gray-300 text-base leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      <div className="text-center mt-10">
        <p className="text-gray-600 dark:text-gray-400">
          Still have questions? <a href="mailto:support@viewstodownloads.com" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Contact our support team</a>
        </p>
      </div>
    </section>
  )
} 