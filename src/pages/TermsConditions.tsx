import { Layout } from "@/components/layout/Layout";

const TermsConditions = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using our website and services, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Services</h2>
            <p>We provide online food ordering and delivery services. Our services include:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Online menu browsing and food ordering</li>
              <li>Table reservations</li>
              <li>Home delivery within our serviceable areas</li>
              <li>Takeaway/pickup orders</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Account</h2>
            <p className="mb-3">To place orders, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 18 years old or have parental consent</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Orders and Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All orders are subject to availability and confirmation</li>
              <li>Prices are displayed in Indian Rupees (INR) and include applicable taxes</li>
              <li>Payment can be made via Razorpay (UPI, cards, net banking) or Cash on Delivery</li>
              <li>We reserve the right to refuse or cancel orders at our discretion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Delivery</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery times are estimates and may vary based on demand and conditions</li>
              <li>You must provide accurate delivery address and contact information</li>
              <li>Delivery charges may apply based on location and order value</li>
              <li>We are not liable for delays caused by factors beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Food Quality and Safety</h2>
            <p>We maintain strict hygiene and quality standards. However:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Please inform us of any food allergies before ordering</li>
              <li>Food should be consumed within a reasonable time of delivery</li>
              <li>We are not responsible for issues arising from improper storage after delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p>All content on this website, including logos, images, and text, is our property and protected by intellectual property laws. Unauthorized use is prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in our operating city.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p>For questions regarding these terms, contact us at:</p>
            <p className="mt-2">Email: legal@petuk.com</p>
            <p>Phone: +91 XXXXXXXXXX</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;
