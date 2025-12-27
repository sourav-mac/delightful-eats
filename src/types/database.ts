export interface Category {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  name_bn: string | null;
  description: string | null;
  description_bn: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  is_vegetarian: boolean;
  is_spicy: boolean;
  is_popular: boolean;
  is_available: boolean;
  preparation_time: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CartItem {
  id: string;
  user_id: string;
  menu_item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  menu_item?: MenuItem;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  created_at: string;
  menu_item?: MenuItem;
}

export interface Reservation {
  id: string;
  user_id: string | null;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string | null;
  menu_item_id: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  profile?: Profile;
  menu_item?: MenuItem;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}
