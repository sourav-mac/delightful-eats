import { Link } from 'react-router-dom';
import { ArrowRight, UtensilsCrossed, Clock, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-95" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920')] bg-cover bg-center mix-blend-overlay opacity-30" />
        
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl space-y-6 text-primary-foreground">
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              Authentic Indian Bengali <br />
              <span className="font-bengali">রান্নাঘর</span> Kitchen
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Experience the rich culinary heritage of Kolkata and Bengal. From aromatic Ilish Bhapa to 
              legendary Kosha Mangsho, every dish is crafted with love and tradition.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/menu">
                  Explore Menu <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/reservations">Book a Table</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: UtensilsCrossed, title: "Authentic Recipes", desc: "Traditional Kolkata recipes passed down generations" },
              { icon: Clock, title: "Fresh Daily", desc: "Spices ground fresh every morning" },
              { icon: Star, title: "Top Rated", desc: "Loved by food enthusiasts across India" },
              { icon: Users, title: "Family Friendly", desc: "Perfect for celebrations and gatherings" },
            ].map((feature, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center space-y-6">
          <h2 className="text-4xl font-display font-bold">Ready to Order?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Browse our menu and experience the authentic taste of Indian Bengali cuisine delivered to your doorstep.
          </p>
          <Button size="lg" asChild>
            <Link to="/menu">View Full Menu</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
