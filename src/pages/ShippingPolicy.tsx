import { Layout } from "@/components/layout/Layout";

const ShippingPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Shipping & Delivery Policy</h1>
        <p className="text-muted-foreground mb-6">Last updated: January 2026</p>

        <div className="space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Delivery Areas</h2>
            <p>We currently deliver to select areas within our city. During checkout, you will be notified if your location is within our delivery zone. We are constantly expanding our delivery areas to serve more customers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Delivery Hours</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Lunch:</strong> 11:00 AM - 3:00 PM</li>
              <li><strong>Dinner:</strong> 6:00 PM - 10:30 PM</li>
              <li>Delivery hours may vary on holidays and special occasions</li>
              <li>Orders placed outside delivery hours will be scheduled for the next available slot</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Estimated Delivery Time</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Standard delivery: 30-45 minutes from order confirmation</li>
              <li>Delivery time may vary based on:</li>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Distance from our restaurant</li>
                <li>Order complexity and preparation time</li>
                <li>Weather conditions</li>
                <li>Traffic and peak hours</li>
              </ul>
              <li>You will receive real-time updates on your order status</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Delivery Charges</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery charges are calculated based on distance</li>
              <li>Free delivery may be available for orders above a minimum value</li>
              <li>Delivery charges will be clearly displayed before checkout</li>
              <li>Special promotions may offer reduced or free delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Order Tracking</h2>
            <p>Once your order is confirmed, you can track its status:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Order Confirmed:</strong> Your order has been received</li>
              <li><strong>Preparing:</strong> Our kitchen is preparing your food</li>
              <li><strong>Ready for Pickup:</strong> Your order is ready for delivery</li>
              <li><strong>Out for Delivery:</strong> Our delivery partner is on the way</li>
              <li><strong>Delivered:</strong> Order has been delivered</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contactless Delivery</h2>
            <p>We offer contactless delivery for your safety:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Request contactless delivery in the order notes</li>
              <li>Delivery partner will place the order at your doorstep</li>
              <li>You will be notified upon delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Delivery Instructions</h2>
            <p className="mb-3">To ensure smooth delivery:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete delivery address</li>
              <li>Include landmarks if your location is difficult to find</li>
              <li>Keep your phone accessible for delivery partner calls</li>
              <li>Ensure someone is available to receive the order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Failed Delivery</h2>
            <p>If delivery cannot be completed due to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Incorrect address: Customer will be contacted for correction</li>
              <li>Customer unavailable: Delivery partner will wait for 10 minutes</li>
              <li>Unreachable customer: Order may be returned, and refund policy applies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Pickup/Takeaway</h2>
            <p>For pickup orders:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Select "Pickup" option during checkout</li>
              <li>You will receive notification when order is ready</li>
              <li>Please collect within 30 minutes of ready notification</li>
              <li>Bring order confirmation for verification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p>For delivery-related queries:</p>
            <p className="mt-2">Email: mandalsourav026@gmail.com</p>
            <p>Phone: +91 9832358231</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingPolicy;
