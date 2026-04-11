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
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          release_days: number | null
          release_type: Database["public"]["Enums"]["release_type"]
          sort_order: number
          status: Database["public"]["Enums"]["module_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          release_days?: number | null
          release_type?: Database["public"]["Enums"]["release_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["module_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          release_days?: number | null
          release_type?: Database["public"]["Enums"]["release_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["module_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          access_days: number | null
          access_type: Database["public"]["Enums"]["access_type"]
          allow_comments: boolean
          banner_url: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          display_order: number
          featured: boolean
          full_description: string | null
          has_certificate: boolean
          id: string
          instructor_name: string | null
          is_free: boolean
          language: string
          login_cover_url: string | null
          logo_url: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          tags: string[] | null
          ticto_product_id: string | null
          title: string
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          access_days?: number | null
          access_type?: Database["public"]["Enums"]["access_type"]
          allow_comments?: boolean
          banner_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          display_order?: number
          featured?: boolean
          full_description?: string | null
          has_certificate?: boolean
          id?: string
          instructor_name?: string | null
          is_free?: boolean
          language?: string
          login_cover_url?: string | null
          logo_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          tags?: string[] | null
          ticto_product_id?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          access_days?: number | null
          access_type?: Database["public"]["Enums"]["access_type"]
          allow_comments?: boolean
          banner_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          display_order?: number
          featured?: boolean
          full_description?: string | null
          has_certificate?: boolean
          id?: string
          instructor_name?: string | null
          is_free?: boolean
          language?: string
          login_cover_url?: string | null
          logo_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          tags?: string[] | null
          ticto_product_id?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enrollment_lessons: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          lesson_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_lessons_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_modules: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          module_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          module_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_modules_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          notes: string | null
          origin: Database["public"]["Enums"]["enrollment_origin"]
          started_at: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["enrollment_origin"]
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["enrollment_origin"]
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          course_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          external_link: string | null
          file_url: string | null
          id: string
          is_visible: boolean
          lesson_id: string
          material_type: Database["public"]["Enums"]["material_type"]
          module_id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          file_url?: string | null
          id?: string
          is_visible?: boolean
          lesson_id: string
          material_type?: Database["public"]["Enums"]["material_type"]
          module_id: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          external_link?: string | null
          file_url?: string | null
          id?: string
          is_visible?: boolean
          lesson_id?: string
          material_type?: Database["public"]["Enums"]["material_type"]
          module_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          allow_comments: boolean
          allow_download: boolean
          audio_url: string | null
          author: string | null
          content_html: string | null
          course_id: string
          created_at: string
          duration_seconds: number | null
          estimated_time: string | null
          id: string
          is_preview: boolean
          is_required: boolean
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          module_id: string
          published_at: string | null
          release_days: number | null
          release_type: Database["public"]["Enums"]["release_type"]
          short_description: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["lesson_status"]
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          allow_comments?: boolean
          allow_download?: boolean
          audio_url?: string | null
          author?: string | null
          content_html?: string | null
          course_id: string
          created_at?: string
          duration_seconds?: number | null
          estimated_time?: string | null
          id?: string
          is_preview?: boolean
          is_required?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          module_id: string
          published_at?: string | null
          release_days?: number | null
          release_type?: Database["public"]["Enums"]["release_type"]
          short_description?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          allow_comments?: boolean
          allow_download?: boolean
          audio_url?: string | null
          author?: string | null
          content_html?: string | null
          course_id?: string
          created_at?: string
          duration_seconds?: number | null
          estimated_time?: string | null
          id?: string
          is_preview?: boolean
          is_required?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          module_id?: string
          published_at?: string | null
          release_days?: number | null
          release_type?: Database["public"]["Enums"]["release_type"]
          short_description?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["lesson_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          affiliate_name: string | null
          amount: number
          approved_at: string | null
          canceled_at: string | null
          coupon_code: string | null
          course_id: string | null
          created_at: string
          currency: string
          external_order_id: string | null
          external_payment_id: string | null
          id: string
          installments: number | null
          notes: string | null
          origin: string | null
          payment_method: string | null
          product_id: string | null
          product_name: string | null
          purchased_at: string | null
          raw_payload: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          affiliate_name?: string | null
          amount?: number
          approved_at?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string
          external_order_id?: string | null
          external_payment_id?: string | null
          id?: string
          installments?: number | null
          notes?: string | null
          origin?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          purchased_at?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          affiliate_name?: string | null
          amount?: number
          approved_at?: string | null
          canceled_at?: string | null
          coupon_code?: string | null
          course_id?: string | null
          created_at?: string
          currency?: string
          external_order_id?: string | null
          external_payment_id?: string | null
          id?: string
          installments?: number | null
          notes?: string | null
          origin?: string | null
          payment_method?: string | null
          product_id?: string | null
          product_name?: string | null
          purchased_at?: string | null
          raw_payload?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          name: string
          origin: string | null
          phone: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          name: string
          origin?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          origin?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          permissions?: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          description: string | null
          event_mapping: Json | null
          headers_config: Json | null
          id: string
          is_active: boolean
          name: string
          secret_token: string | null
          slug: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_mapping?: Json | null
          headers_config?: Json | null
          id?: string
          is_active?: boolean
          name: string
          secret_token?: string | null
          slug: string
          source?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_mapping?: Json | null
          headers_config?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          secret_token?: string | null
          slug?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed_at: string | null
          source: string
          status: string
          webhook_endpoint_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source?: string
          status?: string
          webhook_endpoint_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source?: string
          status?: string
          webhook_endpoint_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      access_type: "lifetime" | "limited"
      app_role: "super_admin" | "admin_operacional"
      course_status: "draft" | "published" | "hidden" | "archived"
      enrollment_origin: "purchase" | "manual" | "bonus" | "test"
      enrollment_status: "active" | "expired" | "canceled" | "blocked"
      lesson_status: "draft" | "published" | "hidden"
      lesson_type: "video" | "text" | "audio" | "download" | "hybrid"
      material_type:
        | "pdf"
        | "spreadsheet"
        | "document"
        | "image"
        | "link"
        | "other"
      module_status: "draft" | "published" | "hidden"
      payment_status:
        | "pending"
        | "approved"
        | "refunded"
        | "canceled"
        | "chargeback"
        | "expired"
        | "failed"
      release_type: "immediate" | "manual" | "drip"
      student_status: "active" | "blocked" | "pending" | "canceled"
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
      access_type: ["lifetime", "limited"],
      app_role: ["super_admin", "admin_operacional"],
      course_status: ["draft", "published", "hidden", "archived"],
      enrollment_origin: ["purchase", "manual", "bonus", "test"],
      enrollment_status: ["active", "expired", "canceled", "blocked"],
      lesson_status: ["draft", "published", "hidden"],
      lesson_type: ["video", "text", "audio", "download", "hybrid"],
      material_type: [
        "pdf",
        "spreadsheet",
        "document",
        "image",
        "link",
        "other",
      ],
      module_status: ["draft", "published", "hidden"],
      payment_status: [
        "pending",
        "approved",
        "refunded",
        "canceled",
        "chargeback",
        "expired",
        "failed",
      ],
      release_type: ["immediate", "manual", "drip"],
      student_status: ["active", "blocked", "pending", "canceled"],
    },
  },
} as const
