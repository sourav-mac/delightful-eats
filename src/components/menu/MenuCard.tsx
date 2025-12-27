import { useState } from 'react';
import { Flame, Leaf, Star, Clock, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MenuItem } from '@/types/database';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { user } = useAuth();

  const handleAddToCart = () => {
    addItem(item, quantity);
    setQuantity(1);
  };

  const discount = item.original_price 
    ? Math.round(((item.original_price - item.price) / item.original_price) * 100) 
    : 0;

  return (
    <Card className="group overflow-hidden border-border/50 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <span className="text-4xl font-bengali text-primary/50">{item.name_bn?.charAt(0) || item.name.charAt(0)}</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {item.is_popular && (
            <Badge className="bg-popular text-white border-0">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Popular
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-destructive text-white border-0">
              {discount}% OFF
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {item.is_spicy && (
            <Badge variant="outline" className="bg-background/90 border-spicy text-spicy">
              <Flame className="h-3 w-3" />
            </Badge>
          )}
          {item.is_vegetarian && (
            <Badge variant="outline" className="bg-background/90 border-vegetarian text-vegetarian">
              <Leaf className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          {item.name_bn && (
            <p className="text-sm font-bengali text-muted-foreground">{item.name_bn}</p>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {item.preparation_time} min
          </span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">৳{item.price}</span>
            {item.original_price && (
              <span className="text-sm text-muted-foreground line-through">৳{item.original_price}</span>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="sm" onClick={handleAddToCart}>
                Add
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <a href="/auth">Sign in</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
