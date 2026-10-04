// Generated from the napuch-crm project (`generate_typescript_types`).
// Regenerate after every migration; do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          label: string
          starts_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          label: string
          starts_at: string
          status?: string
          tenant_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          label?: string
          starts_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          created_at: string
          deal_value: number | null
          id: string
          meta: Json
          photos: string[]
          position: number
          price: number
          price_suffix: string | null
          sent_count: number
          status: string
          subtitle: string | null
          tags: string[]
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          deal_value?: number | null
          id?: string
          meta?: Json
          photos?: string[]
          position?: number
          price?: number
          price_suffix?: string | null
          sent_count?: number
          status?: string
          subtitle?: string | null
          tags?: string[]
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          deal_value?: number | null
          id?: string
          meta?: Json
          photos?: string[]
          position?: number
          price?: number
          price_suffix?: string | null
          sent_count?: number
          status?: string
          subtitle?: string | null
          tags?: string[]
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          call_seconds: number | null
          channel: string
          closed_at: string | null
          created_at: string
          email: string | null
          fields: Json
          first_reply_seconds: number | null
          handled_by: string
          id: string
          item_id: string | null
          last_contact_at: string
          name: string
          phone: string | null
          stage_id: string
          summary: string | null
          tags: string[]
          temperature: string
          tenant_id: string
          unread: number
          value: number
        }
        Insert: {
          call_seconds?: number | null
          channel: string
          closed_at?: string | null
          created_at?: string
          email?: string | null
          fields?: Json
          first_reply_seconds?: number | null
          handled_by?: string
          id?: string
          item_id?: string | null
          last_contact_at?: string
          name: string
          phone?: string | null
          stage_id: string
          summary?: string | null
          tags?: string[]
          temperature?: string
          tenant_id: string
          unread?: number
          value?: number
        }
        Update: {
          call_seconds?: number | null
          channel?: string
          closed_at?: string | null
          created_at?: string
          email?: string | null
          fields?: Json
          first_reply_seconds?: number | null
          handled_by?: string
          id?: string
          item_id?: string | null
          last_contact_at?: string
          name?: string
          phone?: string | null
          stage_id?: string
          summary?: string | null
          tags?: string[]
          temperature?: string
          tenant_id?: string
          unread?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contacts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingest_events: {
        Row: {
          error: string | null
          event_id: string
          id: string
          payload: Json
          processed_at: string | null
          received_at: string
          tenant_id: string
          type: string
        }
        Insert: {
          error?: string | null
          event_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          received_at?: string
          tenant_id: string
          type: string
        }
        Update: {
          error?: string | null
          event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingest_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          tenant_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: string
          tenant_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          at: string
          attachment_item_id: string | null
          author: string
          body: string
          contact_id: string
          external_id: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          at?: string
          attachment_item_id?: string | null
          author: string
          body: string
          contact_id: string
          external_id?: string | null
          id?: string
          tenant_id: string
        }
        Update: {
          at?: string
          attachment_item_id?: string | null
          author?: string
          body?: string
          contact_id?: string
          external_id?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_attachment_item_id_fkey"
            columns: ["attachment_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
        }
        Relationships: []
      }
      tenants: {
        Row: {
          agents: string[]
          archived_at: string | null
          brand: Json
          business_name: string
          city: string | null
          created_at: string
          id: string
          industry: string
          ingest_key_hash: string | null
          owner_name: string | null
          plan_monthly: number
          settings: Json
          slug: string
          tagline: string | null
        }
        Insert: {
          agents?: string[]
          archived_at?: string | null
          brand?: Json
          business_name: string
          city?: string | null
          created_at?: string
          id?: string
          industry: string
          ingest_key_hash?: string | null
          owner_name?: string | null
          plan_monthly?: number
          settings?: Json
          slug: string
          tagline?: string | null
        }
        Update: {
          agents?: string[]
          archived_at?: string | null
          brand?: Json
          business_name?: string
          city?: string | null
          created_at?: string
          id?: string
          industry?: string
          ingest_key_hash?: string | null
          owner_name?: string | null
          plan_monthly?: number
          settings?: Json
          slug?: string
          tagline?: string | null
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          at: string
          contact_id: string
          id: string
          kind: string
          tenant_id: string
          text: string
        }
        Insert: {
          at?: string
          contact_id: string
          id?: string
          kind: string
          tenant_id: string
          text: string
        }
        Update: {
          at?: string
          contact_id?: string
          id?: string
          kind?: string
          tenant_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_my_invitations: { Args: never; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
