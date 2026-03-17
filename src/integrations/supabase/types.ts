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
      access_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          changed_fields: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string
        }
        Insert: {
          action: string
          changed_fields?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          changed_fields?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_type: string
          commission_rate: number | null
          company: string | null
          created_at: string
          created_by: string
          credit_limit: number | null
          discount_default: number | null
          email: string | null
          id: string
          inn: string | null
          is_active: boolean
          manager_id: string | null
          name: string
          notes: string | null
          payment_terms: string
          phone: string | null
          pricing_type: string
          region: string | null
          source: string | null
          telegram: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_type?: string
          commission_rate?: number | null
          company?: string | null
          created_at?: string
          created_by: string
          credit_limit?: number | null
          discount_default?: number | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean
          manager_id?: string | null
          name: string
          notes?: string | null
          payment_terms?: string
          phone?: string | null
          pricing_type?: string
          region?: string | null
          source?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_type?: string
          commission_rate?: number | null
          company?: string | null
          created_at?: string
          created_by?: string
          credit_limit?: number | null
          discount_default?: number | null
          email?: string | null
          id?: string
          inn?: string | null
          is_active?: boolean
          manager_id?: string | null
          name?: string
          notes?: string | null
          payment_terms?: string
          phone?: string | null
          pricing_type?: string
          region?: string | null
          source?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          category: string
          id: string
          key: string
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          category?: string
          id?: string
          key: string
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      deal_activities: {
        Row: {
          action: string
          created_at: string
          deal_id: string
          details: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          deal_id: string
          details?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          deal_id?: string
          details?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          client_id: string | null
          closed_at: string | null
          created_at: string
          id: string
          notes: string | null
          responsible_id: string
          stage_id: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          responsible_id: string
          stage_id: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          responsible_id?: string
          stage_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      dictionary_items: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_default: boolean
          metadata: Json | null
          name: string
          sort_order: number
          type_id: string
          updated_at: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          name: string
          sort_order?: number
          type_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          metadata?: Json | null
          name?: string
          sort_order?: number
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dictionary_items_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "dictionary_types"
            referencedColumns: ["id"]
          },
        ]
      }
      dictionary_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_permissions: {
        Row: {
          allowed: boolean
          group_id: string
          id: string
          module: string
        }
        Insert: {
          allowed?: boolean
          group_id: string
          id?: string
          module: string
        }
        Update: {
          allowed?: boolean
          group_id?: string
          id?: string
          module?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          amount: number | null
          assigned_manager_id: string | null
          budget: number | null
          calculation_id: string | null
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          converted_to_order_id: string | null
          created_at: string
          id: string
          lost_reason: string | null
          notes: string | null
          product_interest: string | null
          region: string | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          assigned_manager_id?: string | null
          budget?: number | null
          calculation_id?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          converted_to_order_id?: string | null
          created_at?: string
          id?: string
          lost_reason?: string | null
          notes?: string | null
          product_interest?: string | null
          region?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          assigned_manager_id?: string | null
          budget?: number | null
          calculation_id?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          converted_to_order_id?: string | null
          created_at?: string
          id?: string
          lost_reason?: string | null
          notes?: string | null
          product_interest?: string | null
          region?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "saved_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      nomenclature: {
        Row: {
          category: string
          characteristics: string | null
          created_at: string
          created_by: string
          description: string | null
          drawing_url: string | null
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          price_dealer: number | null
          price_partner: number | null
          price_rrp: number | null
          price_wholesale: number | null
          show_in_pricelist: boolean
          size_mm: string | null
          sku: string
          sort_order: number
          unit: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          category?: string
          characteristics?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          drawing_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          price_dealer?: number | null
          price_partner?: number | null
          price_rrp?: number | null
          price_wholesale?: number | null
          show_in_pricelist?: boolean
          size_mm?: string | null
          sku?: string
          sort_order?: number
          unit?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          category?: string
          characteristics?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          drawing_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          price_dealer?: number | null
          price_partner?: number | null
          price_rrp?: number | null
          price_wholesale?: number | null
          show_in_pricelist?: boolean
          size_mm?: string | null
          sku?: string
          sort_order?: number
          unit?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      nomenclature_colors: {
        Row: {
          color_id: string
          id: string
          nomenclature_id: string
        }
        Insert: {
          color_id: string
          id?: string
          nomenclature_id: string
        }
        Update: {
          color_id?: string
          id?: string
          nomenclature_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomenclature_colors_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "standard_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomenclature_colors_nomenclature_id_fkey"
            columns: ["nomenclature_id"]
            isOneToOne: false
            referencedRelation: "nomenclature"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agent_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          delivery_address: string | null
          delivery_date: string | null
          delivery_method: string | null
          discount_percent: number | null
          id: string
          items: Json
          lead_id: string | null
          notes: string | null
          number: string
          order_type: string
          paid_amount: number
          responsible_id: string
          status: string
          total_amount: number
          tracking_number: string | null
          updated_at: string
          warranty_months: number | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_method?: string | null
          discount_percent?: number | null
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          number?: string
          order_type?: string
          paid_amount?: number
          responsible_id: string
          status?: string
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          warranty_months?: number | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_method?: string | null
          discount_percent?: number | null
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          number?: string
          order_type?: string
          paid_amount?: number
          responsible_id?: string
          status?: string
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_closed: boolean
          name: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          category: string
          id: string
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: number
        }
        Insert: {
          category?: string
          id?: string
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value: number
        }
        Update: {
          category?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          characteristics: Json | null
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          price_agent: number | null
          price_base: number
          price_retail: number | null
          price_wholesale: number | null
          product_id: string | null
          production_time_days: number | null
          size_cm: string | null
          sku_variant: string
          texture: string | null
          updated_at: string | null
          warranty_months_override: number | null
        }
        Insert: {
          characteristics?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price_agent?: number | null
          price_base: number
          price_retail?: number | null
          price_wholesale?: number | null
          product_id?: string | null
          production_time_days?: number | null
          size_cm?: string | null
          sku_variant: string
          texture?: string | null
          updated_at?: string | null
          warranty_months_override?: number | null
        }
        Update: {
          characteristics?: Json | null
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price_agent?: number | null
          price_base?: number
          price_retail?: number | null
          price_wholesale?: number | null
          product_id?: string | null
          production_time_days?: number | null
          size_cm?: string | null
          sku_variant?: string
          texture?: string | null
          updated_at?: string | null
          warranty_months_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_mockup: boolean | null
          sku_base: string
          type_id: string | null
          updated_at: string | null
          warranty_default_months: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_mockup?: boolean | null
          sku_base: string
          type_id?: string | null
          updated_at?: string | null
          warranty_default_months?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_mockup?: boolean | null
          sku_base?: string
          type_id?: string | null
          updated_at?: string | null
          warranty_default_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "dictionary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          phone: string | null
          role: string
          telegram: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          phone?: string | null
          role?: string
          telegram?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          phone?: string | null
          role?: string
          telegram?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_calculations: {
        Row: {
          calc_name: string
          client_id: string | null
          created_at: string
          id: string
          params: Json
          product_label: string
          product_type: string
          result: Json
          user_id: string
        }
        Insert: {
          calc_name?: string
          client_id?: string | null
          created_at?: string
          id?: string
          params: Json
          product_label: string
          product_type: string
          result: Json
          user_id: string
        }
        Update: {
          calc_name?: string
          client_id?: string | null
          created_at?: string
          id?: string
          params?: Json
          product_label?: string
          product_type?: string
          result?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_calculations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_colors: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          show_in_print: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          show_in_print?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          show_in_print?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: string
          value_type: string
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value: string
          value_type?: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
          value_type?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_group_assignments: {
        Row: {
          assigned_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_module_access: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
