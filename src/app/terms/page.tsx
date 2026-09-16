import Header from '@/components/layout/Header';
import Link from 'next/link';

export const metadata = { title: 'Terms of Service — Kura' };

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 py-8 max-w-[740px] mx-auto">
        <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">Terms of Service</h1>
        <p className="text-xs text-[var(--fg4)] mb-6">Last updated: September 15, 2026</p>

        <div className="space-y-6 text-sm text-[var(--fg2)] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using Kura (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. Kura is a community platform designed for Nepal and Nepali-speaking communities worldwide.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">2. Eligibility</h2>
            <p>You must be at least 13 years of age to use Kura. By using the Platform, you represent that you meet this age requirement and have the legal capacity to enter into these Terms.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">3. Account Registration</h2>
            <p>To access certain features, you must create an account. You may register using your email address or through Google OAuth. You are responsible for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
            <p className="mt-2">You must provide accurate and complete information during registration and keep your account information up to date.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Impersonate any person or entity</li>
              <li>Spam, flood, or disrupt the Platform</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Use automated tools (bots, scrapers) without permission</li>
              <li>Post spam, advertisements, or unsolicited content</li>
              <li>Violate any applicable laws of Nepal or your jurisdiction</li>
              <li>Engage in hate speech or discrimination against any group</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">5. Content</h2>
            <h3 className="font-bold mt-3 mb-1">5.1 Your Content</h3>
            <p>You retain ownership of content you post on Kura. By posting content, you grant Kura a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your content in connection with operating the Platform.</p>

            <h3 className="font-bold mt-3 mb-1">5.2 Content Moderation</h3>
            <p>Kura reserves the right to remove any content that violates these Terms or is otherwise objectionable, at our sole discretion. We may also suspend or terminate accounts of repeat offenders.</p>

            <h3 className="font-bold mt-3 mb-1">5.3 DMCA / Copyright</h3>
            <p>If you believe your copyrighted work has been used on Kura without authorization, please contact us at <a href="mailto:legal@kura.com.np" className="text-[var(--brand-500)] hover:underline">legal@kura.com.np</a> with the required information under the Nepal Copyright Act, 2059 (2002).</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">6. Intellectual Property</h2>
            <p>The Platform, including its design, code, logos, and branding, is the intellectual property of Kura. You may not copy, modify, distribute, or reverse-engineer any part of the Platform without prior written consent.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">7. Communities and Voting</h2>
            <p>Kura allows users to create and participate in communities. Community moderators are responsible for enforcing community-specific rules. The voting system is used to surface quality content and is not a measure of truth or factuality.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">8. Termination</h2>
            <p>We may suspend or terminate your account at any time, with or without notice, for conduct that violates these Terms or is otherwise harmful to the Platform or its users. You may also delete your account at any time through your profile settings.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">9. Disclaimers</h2>
            <p>Kura is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any content on the Platform. Use of the Platform is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, Kura and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of Nepal. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Nepal.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">12. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Material changes will be communicated through the Platform. Your continued use after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">13. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:legal@kura.com.np" className="text-[var(--brand-500)] hover:underline">legal@kura.com.np</a></p>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <Link href="/" className="text-xs text-[var(--brand-500)] font-bold hover:underline">← Back to Kura</Link>
        </div>
      </div>
    </div>
  );
}
