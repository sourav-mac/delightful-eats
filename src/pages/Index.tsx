import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UtensilsCrossed, Clock, Star, Users, Flame, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  price: number;
  original_price: number | null;
  is_spicy: boolean | null;
  is_vegetarian: boolean | null;
  preparation_time: number | null;
}

export default function Index() {
  const [popularDishes, setPopularDishes] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPopularDishes();
  }, []);

  const fetchPopularDishes = async () => {
    try {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_popular', true)
        .eq('is_available', true)
        .limit(6);
      
      if (data) setPopularDishes(data);
    } catch (error) {
      console.error('Error fetching popular dishes:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Popular Dishes */}
      {popularDishes.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-display font-bold mb-4">Popular Dishes</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our most loved dishes that keep our guests coming back for more
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularDishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden hover:shadow-card transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-lg">{dish.name}</h3>
                          {dish.is_spicy && (
                            <Flame className="h-4 w-4 text-spicy" />
                          )}
                          {dish.is_vegetarian && (
                            <Leaf className="h-4 w-4 text-vegetarian" />
                          )}
                        </div>
                        {dish.name_bn && (
                          <p className="text-sm font-bengali text-muted-foreground">{dish.name_bn}</p>
                        )}
                        {dish.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{dish.description}</p>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          <span className="text-lg font-bold text-primary">₹{dish.price}</span>
                          {dish.original_price && dish.original_price > dish.price && (
                            <span className="text-sm text-muted-foreground line-through">₹{dish.original_price}</span>
                          )}
                        </div>
                        {dish.preparation_time && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{dish.preparation_time} mins</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-popular/10 text-popular border-0">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button size="lg" variant="outline" asChild>
                <Link to="/menu">View Full Menu <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-secondary">
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
