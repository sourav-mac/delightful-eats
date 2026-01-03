import { Layout } from "@/components/layout/Layout";

const RefundPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Refund & Cancellation Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Order Cancellation</h2>
            <p className="mb-3">You may cancel your order under the following conditions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Before preparation begins:</strong> Full refund will be processed</li>
              <li><strong>After preparation has started:</strong> Cancellation is not possible as food preparation is underway</li>
              <li><strong>After dispatch:</strong> No cancellation or refund available</li>
            </ul>
            <p className="mt-3">To cancel an order, please contact us immediately through the app or call our customer support.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Refund Eligibility</h2>
            <p className="mb-3">Refunds may be issued in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Wrong order delivered</li>
              <li>Missing items in your order</li>
              <li>Food quality issues (with valid proof)</li>
              <li>Order not delivered within reasonable time (beyond 2 hours without communication)</li>
              <li>Payment deducted but order not confirmed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Refund Process</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Report any issues within 24 hours of order delivery</li>
              <li>Provide order ID, photos (if applicable), and description of the issue</li>
              <li>Our team will review and respond within 24-48 hours</li>
              <li>Approved refunds will be processed within 5-7 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Refund Methods</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Online payments (Razorpay):</strong> Refund to original payment method</li>
              <li><strong>Cash on Delivery:</strong> Refund via bank transfer or store credit</li>
              <li>Refund processing time depends on your bank (typically 5-10 business days)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Non-Refundable Situations</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Change of mind after order confirmation</li>
              <li>Incorrect address provided by customer</li>
              <li>Customer unavailable at delivery location</li>
              <li>Complaints raised after 24 hours of delivery</li>
              <li>Natural taste preferences or subjective quality complaints</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Reservation Cancellation</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reservations can be cancelled up to 24 hours before the scheduled time</li>
              <li>Late cancellations may result in a cancellation fee</li>
              <li>No-shows may be noted and could affect future reservation privileges</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Contact for Refunds</h2>
            <p>To request a refund or report an issue:</p>
            <p className="mt-2">Email: refunds@petuk.com</p>
            <p>Phone: +91 XXXXXXXXXX</p>
            <p className="mt-3">Please have your order ID ready when contacting us.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;
