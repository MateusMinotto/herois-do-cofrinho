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
      conquistas: {
        Row: {
          atualizado_em: string
          codigo: string
          conquistada: boolean
          conquistada_em: string | null
          criado_em: string
          crianca_id: string
          descricao: string
          emoji: string
          id: string
          nome: string
        }
        Insert: {
          atualizado_em?: string
          codigo: string
          conquistada?: boolean
          conquistada_em?: string | null
          criado_em?: string
          crianca_id: string
          descricao?: string
          emoji?: string
          id?: string
          nome: string
        }
        Update: {
          atualizado_em?: string
          codigo?: string
          conquistada?: boolean
          conquistada_em?: string | null
          criado_em?: string
          crianca_id?: string
          descricao?: string
          emoji?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_child_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      criancas: {
        Row: {
          atualizado_em: string
          avatar_config: Json
          avatar_emoji: string
          criado_em: string
          genero: string
          id: string
          nivel: number
          nivel_nome: string
          nome: string
          pontos: number
          responsavel_id: string
          usuario_id: string | null
          valor_ponto: number
          xp: number
          xp_proximo_nivel: number
        }
        Insert: {
          atualizado_em?: string
          avatar_config?: Json
          avatar_emoji?: string
          criado_em?: string
          genero?: string
          id?: string
          nivel?: number
          nivel_nome?: string
          nome: string
          pontos?: number
          responsavel_id: string
          usuario_id?: string | null
          valor_ponto?: number
          xp?: number
          xp_proximo_nivel?: number
        }
        Update: {
          atualizado_em?: string
          avatar_config?: Json
          avatar_emoji?: string
          criado_em?: string
          genero?: string
          id?: string
          nivel?: number
          nivel_nome?: string
          nome?: string
          pontos?: number
          responsavel_id?: string
          usuario_id?: string | null
          valor_ponto?: number
          xp?: number
          xp_proximo_nivel?: number
        }
        Relationships: []
      }
      metas: {
        Row: {
          alvo: number
          atual: number
          atualizado_em: string
          criado_em: string
          crianca_id: string
          emoji: string
          id: string
          nome: string
          prazo: string | null
        }
        Insert: {
          alvo?: number
          atual?: number
          atualizado_em?: string
          criado_em?: string
          crianca_id: string
          emoji?: string
          id?: string
          nome: string
          prazo?: string | null
        }
        Update: {
          alvo?: number
          atual?: number
          atualizado_em?: string
          criado_em?: string
          crianca_id?: string
          emoji?: string
          id?: string
          nome?: string
          prazo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_child_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string | null
          genero: string | null
          id: string
          nome_completo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          genero?: string | null
          id: string
          nome_completo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          genero?: string | null
          id?: string
          nome_completo?: string
        }
        Relationships: []
      }
      progresso_capitulos: {
        Row: {
          atualizado_em: string
          capitulo_id: number
          concluido_em: string | null
          criado_em: string
          crianca_id: string
          id: string
          progresso: number
        }
        Insert: {
          atualizado_em?: string
          capitulo_id: number
          concluido_em?: string | null
          criado_em?: string
          crianca_id: string
          id?: string
          progresso?: number
        }
        Update: {
          atualizado_em?: string
          capitulo_id?: number
          concluido_em?: string | null
          criado_em?: string
          crianca_id?: string
          id?: string
          progresso?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapter_progress_child_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      recompensas: {
        Row: {
          atualizado_em: string
          criado_em: string
          crianca_id: string
          emoji: string
          id: string
          nome: string
          pontos: number
          status: Database["public"]["Enums"]["status_recompensa"]
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          crianca_id: string
          emoji?: string
          id?: string
          nome: string
          pontos?: number
          status?: Database["public"]["Enums"]["status_recompensa"]
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          crianca_id?: string
          emoji?: string
          id?: string
          nome?: string
          pontos?: number
          status?: Database["public"]["Enums"]["status_recompensa"]
        }
        Relationships: [
          {
            foreignKeyName: "rewards_child_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          atualizado_em: string
          criado_em: string
          crianca_id: string
          id: string
          semana_fim: string
          semana_inicio: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          crianca_id: string
          id?: string
          semana_fim: string
          semana_inicio: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          crianca_id?: string
          id?: string
          semana_fim?: string
          semana_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_child_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          aprovacao: string
          aprovada: boolean | null
          atualizado_em: string
          categoria: string
          criado_em: string
          crianca_id: string
          data_tarefa: string | null
          frequencia: Database["public"]["Enums"]["frequencia_tarefa"]
          id: string
          pontos: number
          prazo: string | null
          sprint_id: string | null
          status: Database["public"]["Enums"]["status_tarefa"]
          titulo: string
        }
        Insert: {
          aprovacao?: string
          aprovada?: boolean | null
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          crianca_id: string
          data_tarefa?: string | null
          frequencia?: Database["public"]["Enums"]["frequencia_tarefa"]
          id?: string
          pontos?: number
          prazo?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["status_tarefa"]
          titulo: string
        }
        Update: {
          aprovacao?: string
          aprovada?: boolean | null
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          crianca_id?: string
          data_tarefa?: string | null
          frequencia?: Database["public"]["Enums"]["frequencia_tarefa"]
          id?: string
          pontos?: number
          prazo?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["status_tarefa"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_child_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      tentativas_quiz: {
        Row: {
          acertos: number
          criado_em: string
          crianca_id: string
          id: string
          total: number
        }
        Insert: {
          acertos: number
          criado_em?: string
          crianca_id: string
          id?: string
          total: number
        }
        Update: {
          acertos?: number
          criado_em?: string
          crianca_id?: string
          id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_child_id_fkey"
            columns: ["crianca_id"]
            isOneToOne: false
            referencedRelation: "criancas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_papeis: {
        Row: {
          criado_em: string
          id: string
          papel: Database["public"]["Enums"]["papel_app"]
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          papel: Database["public"]["Enums"]["papel_app"]
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_app"]
          usuario_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      obter_papel_usuario: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["papel_app"]
      }
      pode_acessar_crianca: { Args: { _child_id: string }; Returns: boolean }
      tem_papel: {
        Args: {
          _role: Database["public"]["Enums"]["papel_app"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      frequencia_tarefa: "Única" | "Diária" | "Semanal" | "Mensal"
      papel_app: "admin" | "responsavel" | "crianca"
      status_recompensa: "Ativo" | "Solicitado" | "Entregue"
      status_tarefa: "a_fazer" | "fazendo" | "concluida"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      frequencia_tarefa: ["Única", "Diária", "Semanal", "Mensal"],
      papel_app: ["admin", "responsavel", "crianca"],
      status_recompensa: ["Ativo", "Solicitado", "Entregue"],
      status_tarefa: ["a_fazer", "fazendo", "concluida"],
    },
  },
} as const
