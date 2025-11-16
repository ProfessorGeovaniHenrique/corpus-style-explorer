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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      annotated_corpus: {
        Row: {
          confianca: number | null
          contexto_direito: string | null
          contexto_esquerdo: string | null
          id: string
          job_id: string
          lema: string | null
          metadata: Json | null
          palavra: string
          pos: string | null
          posicao_no_corpus: number | null
          prosody: number | null
          tagset_codigo: string | null
        }
        Insert: {
          confianca?: number | null
          contexto_direito?: string | null
          contexto_esquerdo?: string | null
          id?: string
          job_id: string
          lema?: string | null
          metadata?: Json | null
          palavra: string
          pos?: string | null
          posicao_no_corpus?: number | null
          prosody?: number | null
          tagset_codigo?: string | null
        }
        Update: {
          confianca?: number | null
          contexto_direito?: string | null
          contexto_esquerdo?: string | null
          id?: string
          job_id?: string
          lema?: string | null
          metadata?: Json | null
          palavra?: string
          pos?: string | null
          posicao_no_corpus?: number | null
          prosody?: number | null
          tagset_codigo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annotated_corpus_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "annotation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotated_corpus_tagset_codigo_fkey"
            columns: ["tagset_codigo"]
            isOneToOne: false
            referencedRelation: "semantic_tagset"
            referencedColumns: ["codigo"]
          },
        ]
      }
      annotation_jobs: {
        Row: {
          corpus_type: string
          erro_mensagem: string | null
          id: string
          metadata: Json | null
          palavras_anotadas: number | null
          palavras_processadas: number | null
          progresso: number | null
          status: string
          tempo_fim: string | null
          tempo_inicio: string | null
          total_palavras: number | null
          user_id: string
        }
        Insert: {
          corpus_type: string
          erro_mensagem?: string | null
          id?: string
          metadata?: Json | null
          palavras_anotadas?: number | null
          palavras_processadas?: number | null
          progresso?: number | null
          status?: string
          tempo_fim?: string | null
          tempo_inicio?: string | null
          total_palavras?: number | null
          user_id: string
        }
        Update: {
          corpus_type?: string
          erro_mensagem?: string | null
          id?: string
          metadata?: Json | null
          palavras_anotadas?: number | null
          palavras_processadas?: number | null
          progresso?: number | null
          status?: string
          tempo_fim?: string | null
          tempo_inicio?: string | null
          total_palavras?: number | null
          user_id?: string
        }
        Relationships: []
      }
      human_validations: {
        Row: {
          aplicado: boolean | null
          contexto: string | null
          criado_em: string | null
          id: string
          justificativa: string | null
          palavra: string
          prosody_corrigida: number | null
          prosody_original: number | null
          sugestao_novo_ds: string | null
          tagset_corrigido: string | null
          tagset_original: string | null
          user_id: string
        }
        Insert: {
          aplicado?: boolean | null
          contexto?: string | null
          criado_em?: string | null
          id?: string
          justificativa?: string | null
          palavra: string
          prosody_corrigida?: number | null
          prosody_original?: number | null
          sugestao_novo_ds?: string | null
          tagset_corrigido?: string | null
          tagset_original?: string | null
          user_id: string
        }
        Update: {
          aplicado?: boolean | null
          contexto?: string | null
          criado_em?: string | null
          id?: string
          justificativa?: string | null
          palavra?: string
          prosody_corrigida?: number | null
          prosody_original?: number | null
          sugestao_novo_ds?: string | null
          tagset_corrigido?: string | null
          tagset_original?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "human_validations_tagset_corrigido_fkey"
            columns: ["tagset_corrigido"]
            isOneToOne: false
            referencedRelation: "semantic_tagset"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "human_validations_tagset_original_fkey"
            columns: ["tagset_original"]
            isOneToOne: false
            referencedRelation: "semantic_tagset"
            referencedColumns: ["codigo"]
          },
        ]
      }
      semantic_lexicon: {
        Row: {
          atualizado_em: string | null
          confianca: number
          contexto_exemplo: string | null
          criado_em: string | null
          fonte: string | null
          id: string
          lema: string | null
          palavra: string
          pos: string | null
          prosody: number
          tagset_codigo: string
          validado: boolean | null
        }
        Insert: {
          atualizado_em?: string | null
          confianca?: number
          contexto_exemplo?: string | null
          criado_em?: string | null
          fonte?: string | null
          id?: string
          lema?: string | null
          palavra: string
          pos?: string | null
          prosody: number
          tagset_codigo: string
          validado?: boolean | null
        }
        Update: {
          atualizado_em?: string | null
          confianca?: number
          contexto_exemplo?: string | null
          criado_em?: string | null
          fonte?: string | null
          id?: string
          lema?: string | null
          palavra?: string
          pos?: string | null
          prosody?: number
          tagset_codigo?: string
          validado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "semantic_lexicon_tagset_codigo_fkey"
            columns: ["tagset_codigo"]
            isOneToOne: false
            referencedRelation: "semantic_tagset"
            referencedColumns: ["codigo"]
          },
        ]
      }
      semantic_tagset: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          categoria_pai: string | null
          codigo: string
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          exemplos: string[] | null
          id: string
          nome: string
          status: string
          validacoes_humanas: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          categoria_pai?: string | null
          codigo: string
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          exemplos?: string[] | null
          id?: string
          nome: string
          status?: string
          validacoes_humanas?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          categoria_pai?: string | null
          codigo?: string
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          exemplos?: string[] | null
          id?: string
          nome?: string
          status?: string
          validacoes_humanas?: number | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
