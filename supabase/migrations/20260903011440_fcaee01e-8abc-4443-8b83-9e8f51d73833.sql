-- 1. Tabelas
ALTER TABLE public.profiles RENAME TO perfis;
ALTER TABLE public.user_roles RENAME TO usuario_papeis;
ALTER TABLE public.children RENAME TO criancas;
ALTER TABLE public.tasks RENAME TO tarefas;
ALTER TABLE public.rewards RENAME TO recompensas;
ALTER TABLE public.goals RENAME TO metas;
ALTER TABLE public.achievements RENAME TO conquistas;
ALTER TABLE public.chapter_progress RENAME TO progresso_capitulos;
ALTER TABLE public.quiz_attempts RENAME TO tentativas_quiz;

-- 2. Tipos enum
ALTER TYPE public.app_role RENAME TO papel_app;
ALTER TYPE public.papel_app RENAME VALUE 'parent' TO 'responsavel';
ALTER TYPE public.papel_app RENAME VALUE 'child' TO 'crianca';
ALTER TYPE public.reward_status RENAME TO status_recompensa;
ALTER TYPE public.task_frequency RENAME TO frequencia_tarefa;
ALTER TYPE public.task_status RENAME TO status_tarefa;
ALTER TYPE public.status_tarefa RENAME VALUE 'todo' TO 'a_fazer';
ALTER TYPE public.status_tarefa RENAME VALUE 'doing' TO 'fazendo';
ALTER TYPE public.status_tarefa RENAME VALUE 'done' TO 'concluida';

-- 3. Colunas
ALTER TABLE public.perfis RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.perfis RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.perfis RENAME COLUMN full_name TO nome_completo;
ALTER TABLE public.perfis RENAME COLUMN gender TO genero;

ALTER TABLE public.usuario_papeis RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.usuario_papeis RENAME COLUMN user_id TO usuario_id;
ALTER TABLE public.usuario_papeis RENAME COLUMN role TO papel;

ALTER TABLE public.criancas RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.criancas RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.criancas RENAME COLUMN parent_id TO responsavel_id;
ALTER TABLE public.criancas RENAME COLUMN user_id TO usuario_id;
ALTER TABLE public.criancas RENAME COLUMN name TO nome;
ALTER TABLE public.criancas RENAME COLUMN level TO nivel;
ALTER TABLE public.criancas RENAME COLUMN level_name TO nivel_nome;
ALTER TABLE public.criancas RENAME COLUMN xp_to_next TO xp_proximo_nivel;
ALTER TABLE public.criancas RENAME COLUMN points TO pontos;
ALTER TABLE public.criancas RENAME COLUMN point_value TO valor_ponto;
ALTER TABLE public.criancas RENAME COLUMN gender TO genero;

ALTER TABLE public.tarefas RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.tarefas RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.tarefas RENAME COLUMN child_id TO crianca_id;
ALTER TABLE public.tarefas RENAME COLUMN title TO titulo;
ALTER TABLE public.tarefas RENAME COLUMN category TO categoria;
ALTER TABLE public.tarefas RENAME COLUMN points TO pontos;
ALTER TABLE public.tarefas RENAME COLUMN frequency TO frequencia;
ALTER TABLE public.tarefas RENAME COLUMN due TO prazo;
ALTER TABLE public.tarefas RENAME COLUMN approved TO aprovada;
ALTER TABLE public.tarefas RENAME COLUMN task_date TO data_tarefa;
ALTER TABLE public.tarefas RENAME COLUMN approval TO aprovacao;

ALTER TABLE public.recompensas RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.recompensas RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.recompensas RENAME COLUMN child_id TO crianca_id;
ALTER TABLE public.recompensas RENAME COLUMN name TO nome;
ALTER TABLE public.recompensas RENAME COLUMN points TO pontos;

ALTER TABLE public.metas RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.metas RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.metas RENAME COLUMN child_id TO crianca_id;
ALTER TABLE public.metas RENAME COLUMN name TO nome;
ALTER TABLE public.metas RENAME COLUMN target TO alvo;
ALTER TABLE public.metas RENAME COLUMN current TO atual;
ALTER TABLE public.metas RENAME COLUMN due TO prazo;

ALTER TABLE public.conquistas RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.conquistas RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.conquistas RENAME COLUMN child_id TO crianca_id;
ALTER TABLE public.conquistas RENAME COLUMN code TO codigo;
ALTER TABLE public.conquistas RENAME COLUMN name TO nome;
ALTER TABLE public.conquistas RENAME COLUMN description TO descricao;
ALTER TABLE public.conquistas RENAME COLUMN earned TO conquistada;
ALTER TABLE public.conquistas RENAME COLUMN earned_at TO conquistada_em;

ALTER TABLE public.sprints RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.sprints RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.sprints RENAME COLUMN child_id TO crianca_id;
ALTER TABLE public.sprints RENAME COLUMN week_start TO semana_inicio;
ALTER TABLE public.sprints RENAME COLUMN week_end TO semana_fim;

ALTER TABLE public.progresso_capitulos RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.progresso_capitulos RENAME COLUMN updated_at TO atualizado_em;
ALTER TABLE public.progresso_capitulos RENAME COLUMN child_id TO crianca_id;
ALTER TABLE public.progresso_capitulos RENAME COLUMN chapter_id TO capitulo_id;
ALTER TABLE public.progresso_capitulos RENAME COLUMN progress TO progresso;
ALTER TABLE public.progresso_capitulos RENAME COLUMN completed_at TO concluido_em;

ALTER TABLE public.tentativas_quiz RENAME COLUMN created_at TO criado_em;
ALTER TABLE public.tentativas_quiz RENAME COLUMN child_id TO crianca_id;
ALTER TABLE public.tentativas_quiz RENAME COLUMN score TO acertos;

-- 4. Funções (recriadas ANTES de qualquer UPDATE, pois os triggers dependem delas)
ALTER FUNCTION public.has_role(uuid, public.papel_app) RENAME TO tem_papel;
ALTER FUNCTION public.can_access_child(uuid) RENAME TO pode_acessar_crianca;
ALTER FUNCTION public.get_user_role(uuid) RENAME TO obter_papel_usuario;
ALTER FUNCTION public.handle_new_user() RENAME TO tratar_novo_usuario;
ALTER FUNCTION public.touch_updated_at() RENAME TO atualizar_atualizado_em;

CREATE OR REPLACE FUNCTION public.atualizar_atualizado_em()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.tem_papel(_user_id uuid, _role public.papel_app)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuario_papeis WHERE usuario_id = _user_id AND papel = _role)
$$;

CREATE OR REPLACE FUNCTION public.pode_acessar_crianca(_child_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.criancas c
    WHERE c.id = _child_id
      AND (c.responsavel_id = auth.uid() OR c.usuario_id = auth.uid())
  ) OR public.tem_papel(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.obter_papel_usuario(_user_id uuid)
RETURNS public.papel_app LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT papel FROM public.usuario_papeis WHERE usuario_id = _user_id
  ORDER BY CASE papel WHEN 'admin' THEN 1 WHEN 'responsavel' THEN 2 WHEN 'crianca' THEN 3 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.tratar_novo_usuario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _papel public.papel_app;
  _papel_texto TEXT;
  _genero TEXT;
BEGIN
  _genero := COALESCE(NEW.raw_user_meta_data->>'genero', NEW.raw_user_meta_data->>'gender');
  IF _genero IS NULL OR _genero NOT IN ('M','F','O') THEN _genero := NULL; END IF;

  INSERT INTO public.perfis (id, nome_completo, email, genero)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    _genero
  );

  _papel_texto := COALESCE(NEW.raw_user_meta_data->>'papel', NEW.raw_user_meta_data->>'role', 'responsavel');
  IF _papel_texto NOT IN ('admin', 'responsavel', 'crianca') THEN
    _papel_texto := 'responsavel';
  END IF;
  _papel := _papel_texto::public.papel_app;

  INSERT INTO public.usuario_papeis (usuario_id, papel) VALUES (NEW.id, _papel);
  RETURN NEW;
END;
$$;

-- 5. Valores textuais de aprovação
ALTER TABLE public.tarefas ALTER COLUMN aprovacao DROP DEFAULT;
ALTER TABLE public.tarefas DROP CONSTRAINT IF EXISTS tasks_approval_check;
UPDATE public.tarefas SET aprovacao = CASE aprovacao
  WHEN 'not_required' THEN 'nao_requerido'
  WHEN 'pending' THEN 'pendente'
  WHEN 'approved' THEN 'aprovada'
  WHEN 'rejected' THEN 'rejeitada'
  ELSE aprovacao END;
ALTER TABLE public.tarefas ALTER COLUMN aprovacao SET DEFAULT 'nao_requerido';
ALTER TABLE public.tarefas ADD CONSTRAINT tarefas_aprovacao_check
  CHECK (aprovacao IN ('nao_requerido','pendente','aprovada','rejeitada'));