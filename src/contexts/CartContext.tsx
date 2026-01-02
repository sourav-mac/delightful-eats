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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setItems([]);
      setIsLoading(false);
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }); // Keep a stable order

    if (error) {
      console.error('Error fetching cart:', error);
      toast.error("Failed to fetch your cart items.");
    } else {
        const cartItems: CartItemWithDetails[] = (data || [])
        .filter((item: any) => item.menu_items)
        .map((item: any) => ({
          id: item.id,
          menuItem: item.menu_items as MenuItem,
          quantity: item.quantity,
        }));
        setItems(cartItems);
    }
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
      toast.success(`${menuItem.name} quantity updated`);
      return;
    }

    const { data: newItemData, error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        menu_item_id: menuItem.id,
        quantity,
      })
      .select(`
        id,
        quantity,
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
      .single();

    if (error || !newItemData) {
      toast.error('Failed to add item to cart');
      return;
    }

    const newItem: CartItemWithDetails = {
        id: newItemData.id,
        quantity: newItemData.quantity,
        menuItem: newItemData.menu_items as MenuItem,
    };
    
    setItems(prevItems => [...prevItems, newItem]);
    toast.success(`${menuItem.name} added to cart`);
  };

  const updateQuantity = async (menuItemId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeItem(menuItemId);
      return;
    }

    const originalItems = [...items];
    
    const updatedItems = items.map(item =>
      item.menuItem.id === menuItemId
        ? { ...item, quantity }
        : item
    );
    setItems(updatedItems);

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', user.id)
      .eq('menu_item_id', menuItemId);

    if (error) {
      toast.error('Failed to update quantity');
      setItems(originalItems); // Revert on failure
    }
  };

  const removeItem = async (menuItemId: string) => {
    if (!user) return;

    const originalItems = [...items];
    const removedItemName = originalItems.find(i => i.menuItem.id === menuItemId)?.menuItem.name;
    
    const updatedItems = items.filter(item => item.menuItem.id !== menuItemId);
    setItems(updatedItems);

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('menu_item_id', menuItemId);

    if (error) {
      toast.error('Failed to remove item');
      setItems(originalItems); // Revert on failure
    } else {
        if(removedItemName) toast.success(`${removedItemName} removed from cart`);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    const originalItems = [...items];
    setItems([]);

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to clear cart');
      setItems(originalItems); // Revert on failure
    }
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
