import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p>By accessing or using the Views to Downloads service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
        <p>Views to Downloads provides a platform for automating the creation and publishing of TikTok videos to drive traffic to websites. Our services are subject to change or termination at our discretion without notice.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
        <p>You must create an account to use our service. You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. User Content</h2>
        <p>You retain all rights to any content you submit, post or display on or through the service. By submitting, posting or displaying content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute such content.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Prohibited Uses</h2>
        <p>You agree not to use the service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Prohibited activities include, but are not limited to:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Violating any applicable laws or regulations</li>
          <li>Infringing upon the rights of others</li>
          <li>Attempting to gain unauthorized access to the service or its related systems</li>
          <li>Interfering with or disrupting the integrity or performance of the service</li>
          <li>Engaging in any automated use of the system</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Intellectual Property</h2>
        <p>The service and its original content, features, and functionality are owned by Views to Downloads and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Termination</h2>
        <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
        <p>In no event shall Views to Downloads, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">9. Disclaimer</h2>
        <p>Your use of the service is at your sole risk. The service is provided on an "AS IS" and "AS AVAILABLE" basis. The service is provided without warranties of any kind, whether express or implied.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">10. Governing Law</h2>
        <p>These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">11. Changes to Terms</h2>
        <p>We reserve the right to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">12. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at support@viewstodownloads.com.</p>
      </section>

      <Button asChild className="mt-6">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  )
}

