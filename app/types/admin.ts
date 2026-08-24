export interface Product {
  id: number
  name: string
  price: number
  original_price: number
  status: string
  tag: string
  images: string[]
  description: string
  details: { label: string; value: string }[] | string[]
  category: string
  stock: number
  sizes: string[] | { name: string; stock: number }[]
}

export interface SizeOption {
  name: string
  stock: number
}

export interface TopupRequest {
  id: number
  user_id: number
  user_name: string
  user_email: string
  amount: number
  status: string
  created_at: string
  slip_url?: string
}

export interface OrderItem {
  product_id: number
  product_name: string
  product_price: number
  quantity: number
}

export interface Order {
  id: number
  user_id: number
  user_name: string
  user_email: string
  total_price: number
  status: string
  created_at: string
  items: OrderItem[]
  payment_method?: string
  slip_image?: string
  shipping_name?: string
  shipping_phone?: string
  shipping_address?: string
}

export interface AdminUser {
  id: number
  name: string
  email: string
  balance: number
  is_admin: number
  created_at: string
  tier?: string
  points?: number
  total_spent?: number
}

export interface Ticket {
  id: number
  user_id: number
  user_name: string
  user_email: string
  title: string
  category: string
  message: string
  status: string
  admin_reply: string | null
  created_at: string
}

export interface SalesReport {
  summary: {
    total_orders: number
    total_revenue: number
    completed_orders: number
    pending_orders: number
    cancelled_orders: number
  }
  dailySales: {
    date: string
    count: number
    revenue: number
  }[]
  topProducts: {
    product_name: string
    total_sold: number
    total_revenue: number
  }[]
  userStats: {
    total_users: number
    total_members: number
  }
}

export interface Promotion {
  id: number
  title: string
  description: string
  image: string
  badge: string
  discount_text: string
  start_date: string
  end_date: string
  is_active: number
  target_category?: string
  promo_type?: string
  min_spend?: number
  created_at: string
}

export interface GachaChestItem {
  id?: number
  name: string
  image: string
  price: number
  tier: string
  odds: number
  stock: number | null
}

export interface GachaChest {
  id: number
  name: string
  price: number
  image: string
  description: string
  is_active: number
  items?: GachaChestItem[]
  products?: GachaChestItem[]
}

export interface WithdrawalRequest {
  id: number
  user_id: number
  user_name: string
  user_email: string
  amount: number
  bank_name: string
  bank_account: string
  status: string
  note: string | null
  created_at: string
}

export interface AdminReview {
  id: number
  user_name: string
  user_avatar?: string
  product_name: string
  rating: number
  title?: string
  body?: string
  created_at: string
}
