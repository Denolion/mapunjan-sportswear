export type Category = 'Football' | 'Basketball' | 'Rugby' | 'Athletics' | 'Other';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  team_name: string;
  product_name: string;
  category: Category;
  season: string;
  jersey_type: string;
  description: string | null;
  previous_price: number;
  current_price: number;
  available_sizes: string[];
  stock_quantity: number;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
}

export interface DeliveryLocation {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopSettings {
  id: string;
  shop_name: string;
  shop_address: string;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  whatsapp_number: string;
  business_phone: string | null;
  business_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  team_name: string;
  product_name: string;
  season: string;
  jersey_type: string;
  selected_size: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  preferred_delivery_date: string;
  preferred_delivery_time: string;
  additional_instructions: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface CartItem { product: Product; size: string; quantity: number; }
export interface OrderResult {
  orderNumber: string;
  orderId: string;
  whatsappText: string;
  item: CartItem;
  customer: { name: string; phone: string; location: string; date: string; time: string; instructions: string; };
  total: number;
}

export const formatKES = (value: number) => `KES ${new Intl.NumberFormat('en-KE').format(value)}`;
export const getSavings = (product: Product) => product.previous_price > product.current_price
  ? Math.round(((product.previous_price - product.current_price) / product.previous_price) * 100)
  : 0;

export const CATEGORY_OPTIONS: Category[] = ['Football', 'Basketball', 'Rugby', 'Athletics', 'Other'];
export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
export const LOW_STOCK_THRESHOLD = 5;
