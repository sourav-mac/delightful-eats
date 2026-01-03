import { Layout } from "@/components/layout/Layout";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, phone number, and delivery address</li>
              <li>Payment information (processed securely through Razorpay)</li>
              <li>Order history and preferences</li>
              <li>Communications with our customer service team</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and deliver your food orders</li>
              <li>Send order confirmations and delivery updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Improve our services and menu offerings</li>
              <li>Send promotional offers (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Delivery partners to fulfill your orders</li>
              <li>Payment processors (Razorpay) for secure transactions</li>
              <li>Service providers who assist in our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. Payment transactions are processed through Razorpay's secure payment gateway, which is PCI-DSS compliant.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Cookies</h2>
            <p>We use cookies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can manage cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <p className="mt-2">Email: privacy@petuk.com</p>
            <p>Phone: +91 XXXXXXXXXX</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
