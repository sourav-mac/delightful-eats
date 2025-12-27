import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { MenuItem } from '@/types/database';
import { toast } from 'sonner';

interface CartItemWithDetails {
  id: string;
  menuItem: MenuItem;
  quantity: number;
}

interface CartContextType {
  items: CartItemWithDetails[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  addItem: (menuItem: MenuItem, quantity?: number) => Promise<void>;
  updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  removeItem: (menuItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setItems([]);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        menu_item_id,
        menu_items (
          id,
          name,
          name_bn,
          description,
          price,
          original_price,
          image_url,
          is_vegetarian,
          is_spicy,
          is_popular,
          is_available,
          preparation_time
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching cart:', error);
      setIsLoading(false);
      return;
    }

    const cartItems: CartItemWithDetails[] = (data || [])
      .filter((item: any) => item.menu_items)
      .map((item: any) => ({
        id: item.id,
        menuItem: item.menu_items as MenuItem,
        quantity: item.quantity,
      }));

    setItems(cartItems);
    setIsLoading(false);
  };

  const addItem = async (menuItem: MenuItem, quantity = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    const existingItem = items.find(item => item.menuItem.id === menuItem.id);

    if (existingItem) {
      await updateQuantity(menuItem.id, existingItem.quantity + quantity);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        menu_item_id: menuItem.id,
        quantity,
      });

    if (error) {
      toast.error('Failed to add item to cart');
      return;
    }

    toast.success(`${menuItem.name} added to cart`);
    await fetchCartItems();
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeItem(menuItemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', user.id)
      .eq('menu_item_id', menuItemId);

    if (error) {
      toast.error('Failed to update quantity');
      return;
    }

    await fetchCartItems();
  };

  const removeItem = async (menuItemId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('menu_item_id', menuItemId);

    if (error) {
      toast.error('Failed to remove item');
      return;
    }

    toast.success('Item removed from cart');
    await fetchCartItems();
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to clear cart');
      return;
    }

    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, total, isLoading, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
