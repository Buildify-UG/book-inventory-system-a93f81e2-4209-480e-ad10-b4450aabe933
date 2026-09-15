import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type School = {
  id: string
  name: string
  director_name: string
  accountant_name: string
  sales_manager_name: string
  sales_manager_role: string
}

export type Level = {
  id: string
  school_id: string
  level_name: string
}

export type Book = {
  id: string
  level_id: string
  barcode: string
  title: string
  image_url: string | null
  unit_price: number
  total_quantity: number
  sold_quantity: number
}

export type SaleItem = {
  id: string
  book_id: string
  barcode: string
  title: string
  quantity: number
  unit_price: number
  total_price: number
}
