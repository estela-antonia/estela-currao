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
      biography: {
        Row: {
          body: string | null
          body_es: string | null
          body_fr: string | null
          created_at: string
          documents: Json
          id: string
          portrait_media_id: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          body?: string | null
          body_es?: string | null
          body_fr?: string | null
          created_at?: string
          documents?: Json
          id?: string
          portrait_media_id?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          body?: string | null
          body_es?: string | null
          body_fr?: string | null
          created_at?: string
          documents?: Json
          id?: string
          portrait_media_id?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "biography_portrait_media_id_fkey"
            columns: ["portrait_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          cover_media_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      contact_submission_log: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          session_hash: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          session_hash?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          session_hash?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_text: string | null
          created_at: string
          height: number | null
          id: string
          mime_type: string | null
          original_filename: string | null
          public_url: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          public_url?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          public_url?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      media_seo: {
        Row: {
          created_at: string
          h1_es: string | null
          h1_fr: string | null
          id: string
          intro_es: string | null
          intro_fr: string | null
          keyword: string | null
          seo_description: string | null
          seo_title: string | null
          sort_order: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          h1_es?: string | null
          h1_fr?: string | null
          id?: string
          intro_es?: string | null
          intro_fr?: string | null
          keyword?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          h1_es?: string | null
          h1_fr?: string | null
          id?: string
          intro_es?: string | null
          intro_fr?: string | null
          keyword?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sort_order?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_slots: {
        Row: {
          alt_override: string | null
          created_at: string
          slot_key: string
          sort_order: number
          updated_at: string
          work_id: string | null
        }
        Insert: {
          alt_override?: string | null
          created_at?: string
          slot_key: string
          sort_order?: number
          updated_at?: string
          work_id?: string | null
        }
        Update: {
          alt_override?: string | null
          created_at?: string
          slot_key?: string
          sort_order?: number
          updated_at?: string
          work_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_slots_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          content: string | null
          cover_media_id: string | null
          created_at: string
          id: string
          published_at: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_media_id?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_media_id?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      news_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_id: string
          news_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_id: string
          news_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_id?: string
          news_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_images_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          cover_media_id: string | null
          created_at: string
          description: string | null
          id: string
          pdf_media_id: string | null
          published_at: string | null
          slug: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          year: string | null
        }
        Insert: {
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pdf_media_id?: string | null
          published_at?: string | null
          slug?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          pdf_media_id?: string | null
          published_at?: string | null
          slug?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publications_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_pdf_media_id_fkey"
            columns: ["pdf_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          contact_address: string | null
          contact_email: string | null
          contact_instagram_bw: string | null
          contact_instagram_color: string | null
          contact_intro: Json
          contact_links: Json
          contact_phone: string | null
          contact_photo_media_id: string | null
          created_at: string
          favicon_media_id: string | null
          footer_legal_links: Json
          footer_text: string | null
          home_image_desktop_media_id: string | null
          home_image_mobile_media_id: string | null
          home_image_tablet_media_id: string | null
          id: string
          logo_media_id: string | null
          press_dossier_media_id: string | null
          seo_description: string | null
          seo_og_media_id: string | null
          seo_title: string | null
          singleton: boolean
          site_name: string
          social: Json
          updated_at: string
        }
        Insert: {
          contact_address?: string | null
          contact_email?: string | null
          contact_instagram_bw?: string | null
          contact_instagram_color?: string | null
          contact_intro?: Json
          contact_links?: Json
          contact_phone?: string | null
          contact_photo_media_id?: string | null
          created_at?: string
          favicon_media_id?: string | null
          footer_legal_links?: Json
          footer_text?: string | null
          home_image_desktop_media_id?: string | null
          home_image_mobile_media_id?: string | null
          home_image_tablet_media_id?: string | null
          id?: string
          logo_media_id?: string | null
          press_dossier_media_id?: string | null
          seo_description?: string | null
          seo_og_media_id?: string | null
          seo_title?: string | null
          singleton?: boolean
          site_name?: string
          social?: Json
          updated_at?: string
        }
        Update: {
          contact_address?: string | null
          contact_email?: string | null
          contact_instagram_bw?: string | null
          contact_instagram_color?: string | null
          contact_intro?: Json
          contact_links?: Json
          contact_phone?: string | null
          contact_photo_media_id?: string | null
          created_at?: string
          favicon_media_id?: string | null
          footer_legal_links?: Json
          footer_text?: string | null
          home_image_desktop_media_id?: string | null
          home_image_mobile_media_id?: string | null
          home_image_tablet_media_id?: string | null
          id?: string
          logo_media_id?: string | null
          press_dossier_media_id?: string | null
          seo_description?: string | null
          seo_og_media_id?: string | null
          seo_title?: string | null
          singleton?: boolean
          site_name?: string
          social?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_contact_photo_media_id_fkey"
            columns: ["contact_photo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_favicon_media_id_fkey"
            columns: ["favicon_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_home_image_desktop_media_id_fkey"
            columns: ["home_image_desktop_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_home_image_mobile_media_id_fkey"
            columns: ["home_image_mobile_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_home_image_tablet_media_id_fkey"
            columns: ["home_image_tablet_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_logo_media_id_fkey"
            columns: ["logo_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_press_dossier_media_id_fkey"
            columns: ["press_dossier_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_seo_og_media_id_fkey"
            columns: ["seo_og_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          cover_media_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          layout_type: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          layout_type?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          cover_media_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          layout_type?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategories_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      work_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_featured: boolean
          media_id: string
          sort_order: number
          updated_at: string
          work_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          media_id: string
          sort_order?: number
          updated_at?: string
          work_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          media_id?: string
          sort_order?: number
          updated_at?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_images_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_images_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          category_id: string
          cita: string | null
          created_at: string
          description: string | null
          dimensions: string | null
          extra_text: string | null
          featured_media_id: string | null
          format: string | null
          id: string
          layout_type: string | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          subcategory_id: string | null
          technique: string | null
          title: string
          updated_at: string
          year: string | null
        }
        Insert: {
          category_id: string
          cita?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          extra_text?: string | null
          featured_media_id?: string | null
          format?: string | null
          id?: string
          layout_type?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subcategory_id?: string | null
          technique?: string | null
          title: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          category_id?: string
          cita?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          extra_text?: string | null
          featured_media_id?: string | null
          format?: string | null
          id?: string
          layout_type?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          subcategory_id?: string | null
          technique?: string | null
          title?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "works_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_featured_media_id_fkey"
            columns: ["featured_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_admin: { Args: never; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin"
      content_status: "draft" | "published"
      media_type: "sculpture" | "painting" | "photography"
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
      app_role: ["admin"],
      content_status: ["draft", "published"],
      media_type: ["sculpture", "painting", "photography"],
    },
  },
} as const
