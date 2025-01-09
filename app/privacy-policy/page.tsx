import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p>Welcome to Views to Downloads ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
        <p>We collect information that you provide directly to us, such as when you create an account, use our services, or communicate with us. This may include:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Name and contact information</li>
          <li>Account credentials</li>
          <li>Payment information</li>
          <li>Content you upload or create using our services</li>
          <li>Communications with us</li>
        </ul>
        <p className="mt-2">We also automatically collect certain information when you use our service, including:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Device and usage information</li>
          <li>IP address and location data</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send you technical notices, updates, security alerts, and support messages</li>
          <li>Respond to your comments, questions, and customer service requests</li>
          <li>Communicate with you about products, services, offers, and events</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
          <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
          <li>Personalize and improve the services and provide content or features that match user profiles or interests</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Sharing of Information</h2>
        <p>We may share your information with:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Service providers who perform services on our behalf</li>
          <li>Business partners with whom we jointly offer products or services</li>
          <li>Law enforcement or other third parties in response to a legal request or when we believe disclosure is necessary to protect our rights, property, or safety</li>
          <li>Other users when you use social features of our services</li>
          <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Your Rights and Choices</h2>
        <p>You have certain rights regarding your personal information, including:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Accessing, correcting, or deleting your information</li>
          <li>Opting out of marketing communications</li>
          <li>Setting browser cookies</li>
        </ul>
        <p className="mt-2">To exercise these rights, please contact us at support@viewstodownloads.com.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@viewstodownloads.com.</p>
      </section>

      <Button asChild className="mt-6">
        <Link href="/">Return to Home</Link>
      </Button>
    </div>
  )
}

