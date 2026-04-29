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
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      jobs: {
        Row: {
          apply_url: string | null
          company_image: string | null
          company_name: string | null
          country_code: string | null
          date_published: string | null
          description: string | null
          fetched_at: string
          id: string
          location: string | null
          raw: Json | null
          source: string
          source_id: string
          title: string
        }
        Insert: {
          apply_url?: string | null
          company_image?: string | null
          company_name?: string | null
          country_code?: string | null
          date_published?: string | null
          description?: string | null
          fetched_at?: string
          id: string
          location?: string | null
          raw?: Json | null
          source: string
          source_id: string
          title: string
        }
        Update: {
          apply_url?: string | null
          company_image?: string | null
          company_name?: string | null
          country_code?: string | null
          date_published?: string | null
          description?: string | null
          fetched_at?: string
          id?: string
          location?: string | null
          raw?: Json | null
          source?: string
          source_id?: string
          title?: string
        }
        Relationships: []
      }
      jobs_fetches: {
        Row: {
          error: string | null
          fetched_at: string
          id: number
          inserted_count: number
          location: string | null
          source: string
        }
        Insert: {
          error?: string | null
          fetched_at?: string
          id?: number
          inserted_count?: number
          location?: string | null
          source: string
        }
        Update: {
          error?: string | null
          fetched_at?: string
          id?: number
          inserted_count?: number
          location?: string | null
          source?: string
        }
        Relationships: []
      }
      gov_jobs_cache: {
        Row: {
          id: string
          position: string
          plantilla_item_no: string
          salary_grade: number
          monthly_salary: number
          place_of_assignment: string
          evaluator_email: string | null
          education: string
          training: string
          experience: string
          eligibility: string
          competency: string
          posting_date: string | null
          closing_date: string | null
          source_url: string
          apply_url: string
          first_seen_at: string
          last_seen_at: string
          missing_from_source: boolean
        }
        Insert: {
          id: string
          position: string
          plantilla_item_no: string
          salary_grade: number
          monthly_salary: number
          place_of_assignment: string
          evaluator_email?: string | null
          education: string
          training: string
          experience: string
          eligibility: string
          competency: string
          posting_date: string | null
          closing_date: string | null
          source_url: string
          apply_url: string
          first_seen_at?: string
          last_seen_at?: string
          missing_from_source?: boolean
        }
        Update: {
          id?: string
          position?: string
          plantilla_item_no?: string
          salary_grade?: number
          monthly_salary?: number
          place_of_assignment?: string
          evaluator_email?: string | null
          education?: string
          training?: string
          experience?: string
          eligibility?: string
          competency?: string
          posting_date?: string
          closing_date?: string
          source_url?: string
          apply_url?: string
          first_seen_at?: string
          last_seen_at?: string
          missing_from_source?: boolean
        }
        Relationships: []
      }
      infrastructure_projects: {
        Row: {
          id: string
          external_id: string
          source: string
          title: string
          description: string | null
          agency: string | null
          contractor: string | null
          location_text: string | null
          region: string | null
          province: string | null
          city_municipality: string | null
          barangay: string | null
          latitude: number | null
          longitude: number | null
          budget_amount: number | null
          status: string | null
          start_date: string | null
          end_date: string | null
          category: string | null
          raw_payload: Json | null
          geographic_scope_match: string
          first_seen_at: string
          last_seen_at: string
          last_synced_at: string
          source_removed_at: string | null
          archive_status: string
        }
        Insert: {
          id?: string
          external_id: string
          source?: string
          title: string
          description?: string | null
          agency?: string | null
          contractor?: string | null
          location_text?: string | null
          region?: string | null
          province?: string | null
          city_municipality?: string | null
          barangay?: string | null
          latitude?: number | null
          longitude?: number | null
          budget_amount?: number | null
          status?: string | null
          start_date?: string | null
          end_date?: string | null
          category?: string | null
          raw_payload?: Json | null
          geographic_scope_match?: string
          first_seen_at?: string
          last_seen_at?: string
          last_synced_at?: string
          source_removed_at?: string | null
          archive_status?: string
        }
        Update: {
          id?: string
          external_id?: string
          source?: string
          title?: string
          description?: string | null
          agency?: string | null
          contractor?: string | null
          location_text?: string | null
          region?: string | null
          province?: string | null
          city_municipality?: string | null
          barangay?: string | null
          latitude?: number | null
          longitude?: number | null
          budget_amount?: number | null
          status?: string | null
          start_date?: string | null
          end_date?: string | null
          category?: string | null
          raw_payload?: Json | null
          geographic_scope_match?: string
          first_seen_at?: string
          last_seen_at?: string
          last_synced_at?: string
          source_removed_at?: string | null
          archive_status?: string
        }
        Relationships: []
      }
      page_fetches: {
        Row: {
          bytes: number | null
          content_type: string | null
          duration_ms: number | null
          error: string | null
          fetched_at: string
          http_status: number | null
          id: number
          method: string
          run_id: number
          url: string
        }
        Insert: {
          bytes?: number | null
          content_type?: string | null
          duration_ms?: number | null
          error?: string | null
          fetched_at?: string
          http_status?: number | null
          id?: number
          method?: string
          run_id: number
          url: string
        }
        Update: {
          bytes?: number | null
          content_type?: string | null
          duration_ms?: number | null
          error?: string | null
          fetched_at?: string
          http_status?: number | null
          id?: number
          method?: string
          run_id?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'page_fetches_run_id_fkey'
            columns: ['run_id']
            isOneToOne: false
            referencedRelation: 'scrape_runs'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_admin: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_admin?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      scrape_alerts: {
        Row: {
          details: Json | null
          first_seen_at: string
          id: number
          kind: string
          last_seen_at: string
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          run_id: number | null
          seen_count: number
          severity: string
          source_id: string
        }
        Insert: {
          details?: Json | null
          first_seen_at?: string
          id?: number
          kind: string
          last_seen_at?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: number | null
          seen_count?: number
          severity: string
          source_id: string
        }
        Update: {
          details?: Json | null
          first_seen_at?: string
          id?: number
          kind?: string
          last_seen_at?: string
          message?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: number | null
          seen_count?: number
          severity?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scrape_alerts_run_id_fkey'
            columns: ['run_id']
            isOneToOne: false
            referencedRelation: 'scrape_runs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scrape_alerts_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'source_health'
            referencedColumns: ['source_id']
          },
          {
            foreignKeyName: 'scrape_alerts_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
      scrape_runs: {
        Row: {
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          http_status: number | null
          id: number
          metadata: Json | null
          records_inserted: number
          records_total: number
          records_updated: number
          source_id: string
          started_at: string
          status: string
          trigger: string
        }
        Insert: {
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: number
          metadata?: Json | null
          records_inserted?: number
          records_total?: number
          records_updated?: number
          source_id: string
          started_at?: string
          status: string
          trigger?: string
        }
        Update: {
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: number
          metadata?: Json | null
          records_inserted?: number
          records_total?: number
          records_updated?: number
          source_id?: string
          started_at?: string
          status?: string
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scrape_runs_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'source_health'
            referencedColumns: ['source_id']
          },
          {
            foreignKeyName: 'scrape_runs_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
      snapshots: {
        Row: {
          bytes: number | null
          captured_at: string
          id: number
          inline: Json | null
          kind: string
          run_id: number | null
          sha256: string | null
          source_id: string
          storage_path: string | null
          url: string | null
        }
        Insert: {
          bytes?: number | null
          captured_at?: string
          id?: number
          inline?: Json | null
          kind: string
          run_id?: number | null
          sha256?: string | null
          source_id: string
          storage_path?: string | null
          url?: string | null
        }
        Update: {
          bytes?: number | null
          captured_at?: string
          id?: number
          inline?: Json | null
          kind?: string
          run_id?: number | null
          sha256?: string | null
          source_id?: string
          storage_path?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'snapshots_run_id_fkey'
            columns: ['run_id']
            isOneToOne: false
            referencedRelation: 'scrape_runs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'snapshots_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'source_health'
            referencedColumns: ['source_id']
          },
          {
            foreignKeyName: 'snapshots_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
      sources: {
        Row: {
          base_url: string | null
          created_at: string
          domain: string | null
          expected_ttl_minutes: number
          fallback_mode: boolean
          id: string
          is_active: boolean
          is_paused: boolean
          name: string
          notes: string | null
          parser_version: string | null
          retry_policy: Json | null
          schedule_cron: string | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          domain?: string | null
          expected_ttl_minutes?: number
          fallback_mode?: boolean
          id?: string
          is_active?: boolean
          is_paused?: boolean
          name: string
          notes?: string | null
          parser_version?: string | null
          retry_policy?: Json | null
          schedule_cron?: string | null
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          domain?: string | null
          expected_ttl_minutes?: number
          fallback_mode?: boolean
          id?: string
          is_active?: boolean
          is_paused?: boolean
          name?: string
          notes?: string | null
          parser_version?: string | null
          retry_policy?: Json | null
          schedule_cron?: string | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      validation_results: {
        Row: {
          created_at: string
          details: Json | null
          field: string | null
          id: number
          issue: string
          record_ref: string | null
          resolved: boolean
          resolved_at: string | null
          run_id: number | null
          severity: string
          source_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          field?: string | null
          id?: number
          issue: string
          record_ref?: string | null
          resolved?: boolean
          resolved_at?: string | null
          run_id?: number | null
          severity?: string
          source_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          field?: string | null
          id?: number
          issue?: string
          record_ref?: string | null
          resolved?: boolean
          resolved_at?: string | null
          run_id?: number | null
          severity?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'validation_results_run_id_fkey'
            columns: ['run_id']
            isOneToOne: false
            referencedRelation: 'scrape_runs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'validation_results_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'source_health'
            referencedColumns: ['source_id']
          },
          {
            foreignKeyName: 'validation_results_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'sources'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      source_health: {
        Row: {
          avg_duration_ms_24h: number | null
          avg_records_24h: number | null
          base_url: string | null
          domain: string | null
          expected_ttl_minutes: number | null
          fallback_mode: boolean | null
          freshness_status: string | null
          is_active: boolean | null
          is_paused: boolean | null
          last_failure_at: string | null
          last_failure_message: string | null
          last_success_at: string | null
          last_success_duration_ms: number | null
          name: string | null
          open_alerts: number | null
          runs_24h: number | null
          schedule_cron: string | null
          slug: string | null
          source_id: string | null
          successes_24h: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_vault_secret: { Args: { secret_name: string }; Returns: string }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      resolve_alert: {
        Args: { alert_id: number }
        Returns: {
          details: Json | null
          first_seen_at: string
          id: number
          kind: string
          last_seen_at: string
          message: string | null
          resolved_at: string | null
          resolved_by: string | null
          run_id: number | null
          seen_count: number
          severity: string
          source_id: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
