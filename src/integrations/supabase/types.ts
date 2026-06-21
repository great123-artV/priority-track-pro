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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          city: string
          country: string
          created_at: string
          id: string
          manager_name: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          country: string
          created_at?: string
          id?: string
          manager_name?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          manager_name?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      delivery_confirmations: {
        Row: {
          created_at: string
          delivered_at: string
          delivered_by: string | null
          delivered_by_name: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          note: string | null
          photo_url: string | null
          receiver_name: string
          shipment_id: string
          signature_data: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string
          delivered_by?: string | null
          delivered_by_name?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          note?: string | null
          photo_url?: string | null
          receiver_name: string
          shipment_id: string
          signature_data?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string
          delivered_by?: string | null
          delivered_by_name?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          note?: string | null
          photo_url?: string | null
          receiver_name?: string
          shipment_id?: string
          signature_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          branch_id: string | null
          created_at: string
          event_at: string
          id: string
          location: string | null
          note: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          event_at?: string
          id?: string
          location?: string | null
          note?: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          event_at?: string
          id?: string
          location?: string | null
          note?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          current_location: string | null
          current_status: Database["public"]["Enums"]["shipment_status"]
          custom_clearance_charge: number
          declared_value: number | null
          delivery_type: string
          departure_date: string | null
          destination_branch_id: string | null
          destination_city: string | null
          destination_country: string | null
          discount: number
          expected_arrival_date: string | null
          handling_fee: number
          id: string
          insurance_fee: number
          insurance_required: boolean
          origin_branch_id: string | null
          package_contents: string | null
          package_description: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          quantity: number
          receipt_number: string
          receiver_address: string | null
          receiver_city: string | null
          receiver_country: string | null
          receiver_email: string | null
          receiver_name: string
          receiver_phone: string | null
          registration_charge: number
          sender_address: string | null
          sender_city: string | null
          sender_country: string | null
          sender_email: string | null
          sender_name: string
          sender_phone: string | null
          special_handling_note: string | null
          total_amount: number
          tracking_number: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          current_location?: string | null
          current_status?: Database["public"]["Enums"]["shipment_status"]
          custom_clearance_charge?: number
          declared_value?: number | null
          delivery_type?: string
          departure_date?: string | null
          destination_branch_id?: string | null
          destination_city?: string | null
          destination_country?: string | null
          discount?: number
          expected_arrival_date?: string | null
          handling_fee?: number
          id?: string
          insurance_fee?: number
          insurance_required?: boolean
          origin_branch_id?: string | null
          package_contents?: string | null
          package_description?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          receipt_number: string
          receiver_address?: string | null
          receiver_city?: string | null
          receiver_country?: string | null
          receiver_email?: string | null
          receiver_name: string
          receiver_phone?: string | null
          registration_charge?: number
          sender_address?: string | null
          sender_city?: string | null
          sender_country?: string | null
          sender_email?: string | null
          sender_name: string
          sender_phone?: string | null
          special_handling_note?: string | null
          total_amount?: number
          tracking_number: string
          updated_at?: string
          weight_kg?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          current_location?: string | null
          current_status?: Database["public"]["Enums"]["shipment_status"]
          custom_clearance_charge?: number
          declared_value?: number | null
          delivery_type?: string
          departure_date?: string | null
          destination_branch_id?: string | null
          destination_city?: string | null
          destination_country?: string | null
          discount?: number
          expected_arrival_date?: string | null
          handling_fee?: number
          id?: string
          insurance_fee?: number
          insurance_required?: boolean
          origin_branch_id?: string | null
          package_contents?: string | null
          package_description?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quantity?: number
          receipt_number?: string
          receiver_address?: string | null
          receiver_city?: string | null
          receiver_country?: string | null
          receiver_email?: string | null
          receiver_name?: string
          receiver_phone?: string | null
          registration_charge?: number
          sender_address?: string | null
          sender_city?: string | null
          sender_country?: string | null
          sender_email?: string | null
          sender_name?: string
          sender_phone?: string | null
          special_handling_note?: string | null
          total_amount?: number
          tracking_number?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipments_destination_branch_id_fkey"
            columns: ["destination_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_origin_branch_id_fkey"
            columns: ["origin_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_awb: { Args: never; Returns: string }
      next_receipt: { Args: never; Returns: string }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "branch_manager"
        | "operations_officer"
        | "dispatcher"
        | "driver"
        | "customer_support"
      payment_status: "pending" | "paid" | "partial" | "refunded"
      shipment_status:
        | "shipment_registered"
        | "received_at_origin"
        | "processing_sorting"
        | "dispatched_origin"
        | "in_transit"
        | "arrived_destination"
        | "out_for_delivery"
        | "delivered"
        | "delayed"
        | "cancelled"
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
      app_role: [
        "super_admin",
        "branch_manager",
        "operations_officer",
        "dispatcher",
        "driver",
        "customer_support",
      ],
      payment_status: ["pending", "paid", "partial", "refunded"],
      shipment_status: [
        "shipment_registered",
        "received_at_origin",
        "processing_sorting",
        "dispatched_origin",
        "in_transit",
        "arrived_destination",
        "out_for_delivery",
        "delivered",
        "delayed",
        "cancelled",
      ],
    },
  },
} as const
