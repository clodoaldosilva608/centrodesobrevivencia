-- ============================================================================
--  Proteção do is_admin — previne demotion acidental
--  Aplica após o schema.sql principal.
-- ============================================================================

-- Trigger 1: BEFORE UPDATE em profiles
--   - Previne is_admin ser demovido (TRUE → FALSE) por usuário que não é admin
--   - Previne auto-demotion (admin não pode rebaixar a si mesmo)
--   - Se a tentativa for ilegítima, mantém is_admin = true (silenciosamente)
-- Trigger 2: AFTER UPDATE em profiles
--   - Loga toda mudança de is_admin em activity_log (auditoria)

-- ============================================================================
-- Função BEFORE UPDATE: proteger is_admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.protect_is_admin()
RETURNS TRIGGER AS $$
DECLARE
  caller_id UUID;
  caller_is_admin BOOLEAN;
BEGIN
  -- Se o novo valor de is_admin é TRUE ou NULL (default), não há demotion — permite.
  IF NEW.is_admin IS NOT FALSE THEN
    RETURN NEW;
  END IF;

  -- Aqui NEW.is_admin = FALSE (tentando demover).
  -- Verificar quem está tentando.
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    -- Chamada sem usuário autenticado (server-side via service_role ou SQL direto).
    -- Permitir (admin via Supabase Studio ou psql).
    RETURN NEW;
  END IF;

  -- Verificar se o caller é admin
  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE id = caller_id;

  IF NOT COALESCE(caller_is_admin, FALSE) THEN
    -- Caller não é admin. BLOQUEAR a demotion (manter is_admin = OLD.is_admin).
    NEW.is_admin := OLD.is_admin;
    RETURN NEW;
  END IF;

  -- Caller é admin. Mas não pode demover a si mesmo.
  IF caller_id = NEW.id THEN
    -- Auto-demotion bloqueado. Manter is_admin = OLD.is_admin.
    NEW.is_admin := OLD.is_admin;
    RETURN NEW;
  END IF;

  -- Caller é admin diferente do user sendo modificado. Permitir.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_is_admin_trigger ON public.profiles;
CREATE TRIGGER protect_is_admin_trigger
  BEFORE UPDATE OF is_admin ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_is_admin();

-- ============================================================================
-- Função AFTER UPDATE: logar mudanças de is_admin (auditoria)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_is_admin_changes()
RETURNS TRIGGER AS $$
DECLARE
  caller_id UUID;
BEGIN
  -- Só logar se is_admin mudou
  IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
    caller_id := auth.uid();
    INSERT INTO public.activity_log (user_id, activity_type, description, xp_awarded, metadata)
    VALUES (
      COALESCE(caller_id, NEW.id),
      'admin_change',
      CASE WHEN NEW.is_admin THEN 'Promoção a admin' ELSE 'Demotion de admin' END,
      0,
      jsonb_build_object(
        'target_user_id', NEW.id,
        'target_email', NEW.email,
        'old_is_admin', OLD.is_admin,
        'new_is_admin', NEW.is_admin,
        'caller_id', caller_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_is_admin_changes_trigger ON public.profiles;
CREATE TRIGGER log_is_admin_changes_trigger
  AFTER UPDATE OF is_admin ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_is_admin_changes();

-- ============================================================================
-- Comentar para documentação
-- ============================================================================
COMMENT ON FUNCTION public.protect_is_admin() IS
'Previne demotion acidental de is_admin: bloqueia usuários não-admin e auto-demotion. Permite demotion legítima apenas por outro admin diferente do alvo.';

COMMENT ON FUNCTION public.log_is_admin_changes() IS
'Auditoria: loga toda mudança de is_admin em activity_log para rastreabilidade.';
