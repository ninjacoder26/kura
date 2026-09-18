import Header from '@/components/layout/Header';
import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — Kura' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="px-4 py-8 max-w-[740px] mx-auto">
        <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">Privacy Policy</h1>
        <p className="text-xs text-[var(--fg4)] mb-6">Last updated: September 18, 2026</p>

        <div className="space-y-6 text-sm text-[var(--fg2)] leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">1. Introduction</h2>
            <p>Kura (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. This policy complies with the Electronic Transactions Act, 2063 (2008) and the Privacy Act, 2075 (2018) of Nepal.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">2. Information We Collect</h2>
            <h3 className="font-bold mt-3 mb-1">2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Email address</li>
              <li>Username and display name</li>
              <li>Profile picture (if provided)</li>
              <li>Authentication data (if using Google Sign-In)</li>
            </ul>

            <h3 className="font-bold mt-3 mb-1">2.2 Content You Create</h3>
            <p>We store the posts, comments, votes, and community memberships you create on the Platform.</p>

            <h3 className="font-bold mt-3 mb-1">2.3 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Device type and browser information</li>
              <li>IP address (used for security and spam prevention)</li>
              <li>Pages visited and interaction patterns</li>
              <li>Referring URLs</li>
            </ul>

            <h3 className="font-bold mt-3 mb-1">2.4 Cookies</h3>
            <p>We use essential cookies for authentication and session management. We do not use third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provide and maintain the Platform</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Personalize your experience and content feed</li>
              <li>Prevent spam, abuse, and security threats</li>
              <li>Communicate with you about your account or the Platform</li>
              <li>Improve and develop new features</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">4. How We Share Your Information</h2>
            <p>We do NOT sell your personal data. We may share information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li><strong>With your consent:</strong> When you authorize third-party integrations</li>
              <li><strong>Service providers:</strong> With the trusted backend providers listed in Section 5, who process data only to operate the Platform</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect rights and safety under Nepal law</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">5. Third-Party Service Providers</h2>
            <p>To operate the Platform we rely on the following backend providers, which process data on our behalf. We do not allow them to use your data for their own advertising purposes:</p>
            <ul className="list-disc list-inside mt-2 space-y-2 ml-4">
              <li>
                <strong>Supabase (authentication, database, file storage, transactional email):</strong>{' '}
                stores your account data (email, username, profile), the content you post, uploaded files, and session/security logs, and sends signup and password-reset emails.{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-500)] hover:underline">Supabase Privacy Policy</a>
              </li>
              <li>
                <strong>Cloudinary (image hosting and delivery):</strong>{' '}
                stores and serves images you choose to upload (avatars, banners, post images) through its content delivery network.{' '}
                <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-500)] hover:underline">Cloudinary Privacy Policy</a>
              </li>
              <li>
                <strong>Google (optional Sign-In):</strong>{' '}
                if you sign in with Google, Google shares your account email, name, and profile picture with us as described in Google&apos;s policy.{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-500)] hover:underline">Google Privacy Policy</a>
              </li>
              <li>
                <strong>Hosting infrastructure:</strong>{' '}
                the application is served through our hosting provider, which processes IP addresses and request logs for security and reliability.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">6. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data, including encryption in transit (TLS/SSL) and at rest. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">7. Data Retention</h2>
            <p>We retain your account information for as long as your account is active. When you delete your account, we remove your personal data within 30 days, except where required by law. Anonymized and aggregated data may be retained indefinitely.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">8. Your Rights</h2>
            <p>Under Nepal&apos;s Privacy Act, 2075, you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:privacy@kura.com.np" className="text-[var(--brand-500)] hover:underline">privacy@kura.com.np</a></p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">9. Children&apos;s Privacy</h2>
            <p>Kura is not intended for children under 13. We do not knowingly collect data from children under 13. If we become aware that we have collected such data, we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">10. Third-Party Links</h2>
            <p>The Platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">11. International Data Transfers</h2>
            <p>Your data may be processed in countries outside Nepal where our service providers operate (e.g., United States for Supabase, Cloudinary, Google, and hosting). These countries may have different data protection laws. By using Kura, you consent to such transfers.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated through the Platform. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[var(--fg)] mb-2">13. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:privacy@kura.com.np" className="text-[var(--brand-500)] hover:underline">privacy@kura.com.np</a></p>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <Link href="/" className="text-xs text-[var(--brand-500)] font-bold hover:underline">← Back to Kura</Link>
        </div>
      </div>
    </div>
  );
}
