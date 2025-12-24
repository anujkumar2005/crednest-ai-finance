export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banks: {
        Row: {
          apply_url: string | null
          business_loan_rate: number | null
          car_loan_rate: number | null
          created_at: string | null
          customer_care: string | null
          description: string | null
          education_loan_rate: number | null
          fd_rate_1yr: number | null
          fd_rate_3yr: number | null
          fd_rate_5yr: number | null
          features: Json | null
          home_loan_rate: number | null
          id: string
          logo_url: string | null
          max_loan_amount: number | null
          max_tenure_years: number | null
          min_balance: number | null
          min_cibil_score: number | null
          min_loan_amount: number | null
          name: string
          personal_loan_rate: number | null
          processing_fee: number | null
          rating: number | null
          savings_rate: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          apply_url?: string | null
          business_loan_rate?: number | null
          car_loan_rate?: number | null
          created_at?: string | null
          customer_care?: string | null
          description?: string | null
          education_loan_rate?: number | null
          fd_rate_1yr?: number | null
          fd_rate_3yr?: number | null
          fd_rate_5yr?: number | null
          features?: Json | null
          home_loan_rate?: number | null
          id?: string
          logo_url?: string | null
          max_loan_amount?: number | null
          max_tenure_years?: number | null
          min_balance?: number | null
          min_cibil_score?: number | null
          min_loan_amount?: number | null
          name: string
          personal_loan_rate?: number | null
          processing_fee?: number | null
          rating?: number | null
          savings_rate?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          apply_url?: string | null
          business_loan_rate?: number | null
          car_loan_rate?: number | null
          created_at?: string | null
          customer_care?: string | null
          description?: string | null
          education_loan_rate?: number | null
          fd_rate_1yr?: number | null
          fd_rate_3yr?: number | null
          fd_rate_5yr?: number | null
          features?: Json | null
          home_loan_rate?: number | null
          id?: string
          logo_url?: string | null
          max_loan_amount?: number | null
          max_tenure_years?: number | null
          min_balance?: number | null
          min_cibil_score?: number | null
          min_loan_amount?: number | null
          name?: string
          personal_loan_rate?: number | null
          processing_fee?: number | null
          rating?: number | null
          savings_rate?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          month: string
          notes: string | null
          planned_amount: number
          spent_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          month: string
          notes?: string | null
          planned_amount?: number
          spent_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          month?: string
          notes?: string | null
          planned_amount?: number
          spent_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          tool_used: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
          tool_used?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          tool_used?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          location: string | null
          payment_method: string | null
          recurring_frequency: string | null
          tags: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          payment_method?: string | null
          recurring_frequency?: string | null
          tags?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          payment_method?: string | null
          recurring_frequency?: string | null
          tags?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_corpus: {
        Row: {
          bank_name: string | null
          category: string
          content: string
          created_at: string | null
          id: string
          keywords: string[] | null
          loan_type: string | null
          source: string | null
          subcategory: string | null
          title: string
        }
        Insert: {
          bank_name?: string | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          loan_type?: string | null
          source?: string | null
          subcategory?: string | null
          title: string
        }
        Update: {
          bank_name?: string | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          loan_type?: string | null
          source?: string | null
          subcategory?: string | null
          title?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          recurring_frequency: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_companies: {
        Row: {
          apply_url: string | null
          claim_settlement_ratio: number | null
          coverage_amount_max: number | null
          coverage_amount_min: number | null
          created_at: string | null
          customer_care: string | null
          description: string | null
          features: Json | null
          health_premium_max: number | null
          health_premium_min: number | null
          home_premium_max: number | null
          home_premium_min: number | null
          id: string
          life_premium_max: number | null
          life_premium_min: number | null
          logo_url: string | null
          name: string
          rating: number | null
          updated_at: string | null
          vehicle_premium_max: number | null
          vehicle_premium_min: number | null
          website: string | null
        }
        Insert: {
          apply_url?: string | null
          claim_settlement_ratio?: number | null
          coverage_amount_max?: number | null
          coverage_amount_min?: number | null
          created_at?: string | null
          customer_care?: string | null
          description?: string | null
          features?: Json | null
          health_premium_max?: number | null
          health_premium_min?: number | null
          home_premium_max?: number | null
          home_premium_min?: number | null
          id?: string
          life_premium_max?: number | null
          life_premium_min?: number | null
          logo_url?: string | null
          name: string
          rating?: number | null
          updated_at?: string | null
          vehicle_premium_max?: number | null
          vehicle_premium_min?: number | null
          website?: string | null
        }
        Update: {
          apply_url?: string | null
          claim_settlement_ratio?: number | null
          coverage_amount_max?: number | null
          coverage_amount_min?: number | null
          created_at?: string | null
          customer_care?: string | null
          description?: string | null
          features?: Json | null
          health_premium_max?: number | null
          health_premium_min?: number | null
          home_premium_max?: number | null
          home_premium_min?: number | null
          id?: string
          life_premium_max?: number | null
          life_premium_min?: number | null
          logo_url?: string | null
          name?: string
          rating?: number | null
          updated_at?: string | null
          vehicle_premium_max?: number | null
          vehicle_premium_min?: number | null
          website?: string | null
        }
        Relationships: []
      }
      investment_funds: {
        Row: {
          amc: string | null
          aum: number | null
          created_at: string | null
          description: string | null
          expense_ratio: number | null
          features: Json | null
          fund_type: string
          id: string
          logo_url: string | null
          min_investment: number | null
          min_sip: number | null
          name: string
          nav: number | null
          rating: number | null
          returns_1yr: number | null
          returns_3yr: number | null
          returns_5yr: number | null
          risk_level: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          amc?: string | null
          aum?: number | null
          created_at?: string | null
          description?: string | null
          expense_ratio?: number | null
          features?: Json | null
          fund_type: string
          id?: string
          logo_url?: string | null
          min_investment?: number | null
          min_sip?: number | null
          name: string
          nav?: number | null
          rating?: number | null
          returns_1yr?: number | null
          returns_3yr?: number | null
          returns_5yr?: number | null
          risk_level?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          amc?: string | null
          aum?: number | null
          created_at?: string | null
          description?: string | null
          expense_ratio?: number | null
          features?: Json | null
          fund_type?: string
          id?: string
          logo_url?: string | null
          min_investment?: number | null
          min_sip?: number | null
          name?: string
          nav?: number | null
          rating?: number | null
          returns_1yr?: number | null
          returns_3yr?: number | null
          returns_5yr?: number | null
          risk_level?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          age: number | null
          bio: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          gender: string | null
          id: string
          monthly_income: number | null
          name: string | null
          occupation: string | null
          phone: string | null
          pincode: string | null
          profile_completed: boolean | null
          profile_image: string | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          bio?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          monthly_income?: number | null
          name?: string | null
          occupation?: string | null
          phone?: string | null
          pincode?: string | null
          profile_completed?: boolean | null
          profile_image?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          age?: number | null
          bio?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          monthly_income?: number | null
          name?: string | null
          occupation?: string | null
          phone?: string | null
          pincode?: string | null
          profile_completed?: boolean | null
          profile_image?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          icon: string | null
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          name: string
          target_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          icon?: string | null
          id?: string
          is_completed?: boolean | null
          name?: string
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_loans: {
        Row: {
          bank_id: string | null
          created_at: string | null
          emi_amount: number | null
          id: string
          interest_rate: number
          loan_type: string
          notes: string | null
          principal_amount: number
          start_date: string | null
          status: string | null
          tenure_months: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_id?: string | null
          created_at?: string | null
          emi_amount?: number | null
          id?: string
          interest_rate: number
          loan_type: string
          notes?: string | null
          principal_amount: number
          start_date?: string | null
          status?: string | null
          tenure_months: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_id?: string | null
          created_at?: string | null
          emi_amount?: number | null
          id?: string
          interest_rate?: number
          loan_type?: string
          notes?: string | null
          principal_amount?: number
          start_date?: string | null
          status?: string | null
          tenure_months?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loans_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
