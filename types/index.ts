/* Auto-generated from Supabase schema — do not edit the Database type by hand */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          color: string | null
          created_at: string
          currency: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string | null
          created_at?: string
          currency?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          balance?: number
          color?: string | null
          created_at?: string
          currency?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          month: number
          user_id: string
          year: number
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          id?: string
          month: number
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          id?: string
          month?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/* Convenience aliases */
export type Account = Database["public"]["Tables"]["accounts"]["Row"]
export type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"]
export type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"]

export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"]
export type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"]

export type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"]
export type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"]

export type Budget = Database["public"]["Tables"]["budgets"]["Row"]
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"]
export type BudgetUpdate = Database["public"]["Tables"]["budgets"]["Update"]

/* Bills — not auto-generated, added manually */
export type Bill = {
  id: string
  user_id: string
  name: string
  amount: number
  due_day: number
  frequency: "weekly" | "monthly" | "quarterly" | "yearly"
  category_id: string | null
  account_id: string | null
  is_active: boolean
  icon: string | null
  color: string | null
  notes: string | null
  created_at: string
}

/* Savings Goals — not auto-generated */
export type SavingsGoal = {
  id: string
  user_id: string
  name: string
  target_amount: number
  saved_amount: number
  icon: string | null
  color: string | null
  deadline: string | null
  notes: string | null
  is_achieved: boolean
  created_at: string
}

/* Debts & Loans */
export type Debt = {
  id: string; user_id: string; name: string
  type: "debt" | "loan"
  balance: number; original_amount: number
  interest_rate: number | null; monthly_payment: number | null
  due_date: string | null; counterparty: string | null
  icon: string | null; color: string | null; notes: string | null
  is_paid: boolean; created_at: string
}

/* Assets & Liabilities */
export type Asset = {
  id: string; user_id: string; name: string
  type: "asset" | "liability"
  value: number
  category: "property"|"vehicle"|"investment"|"cash"|"retirement"|"other"|"credit_card"|"loan"|"mortgage"|"other_liability"
  icon: string | null; color: string | null; notes: string | null
  created_at: string
}

/* UI helpers */
export type Theme =
  | "blush" | "lavender" | "matcha" | "butter"
  | "peach" | "ocean" | "cocoa" | "midnight";

export type Currency = "USD" | "MYR" | "EUR" | "GBP" | "SGD";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$", MYR: "RM ", EUR: "€", GBP: "£", SGD: "S$",
};

export const ACTIVATION_CODES = new Set([
  "LEAF2024", "NAMYRA001", "LLBETA01", "LEDGER2024",
]);
