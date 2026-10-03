-- ============================================================================
--  Centro de Sobrevivência — Supabase schema
--  Execute este script no SQL Editor do Supabase OU via psql:
--    psql "postgresql://postgres:***@db.mbterwktxczsyevcudoz.supabase.co:5432/postgres" \
--      -f supabase/schema.sql
--
--  Após rodar:
--   1. Configure Google OAuth no Supabase Dashboard > Authentication > Providers
--   2. Defina o primeiro admin manualmente (instruções no final do arquivo)
--   3. Popule o catálogo via página /admin (botão "Importar mock data")
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES (extende auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE,
  full_name    TEXT,
  email        TEXT,
  avatar_url   TEXT,
  provider     TEXT,  -- 'google' | 'email'
  xp           INTEGER DEFAULT 0,
  level        INTEGER DEFAULT 1,
  streak_days  INTEGER DEFAULT 0,
  last_active_date DATE,
  is_admin     BOOLEAN DEFAULT FALSE,
  settings     JSONB DEFAULT '{"sound": true, "theme": "dark"}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cria profile automaticamente quando um user se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 2. CATEGORIES (categorias compartilhadas entre products/ebooks/games/challenges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('product', 'ebook', 'game', 'challenge')),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PRODUCTS (equipamentos com link de afiliado)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  category          TEXT,
  category_id       UUID REFERENCES public.categories(id),
  description       TEXT,
  full_description  TEXT,
  benefits          JSONB DEFAULT '[]'::jsonb,
  price             TEXT,
  image             TEXT,
  images            JSONB DEFAULT '[]'::jsonb,
  specs             JSONB DEFAULT '[]'::jsonb,
  buy_link          TEXT,                  -- link de afiliado
  affiliate_network TEXT,                  -- 'amazon', 'mercadolivre', 'aliexpress', etc.
  rating            NUMERIC DEFAULT 0,
  in_stock          BOOLEAN DEFAULT TRUE,
  featured          BOOLEAN DEFAULT FALSE,
  sort_order        INTEGER DEFAULT 0,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products(sort_order);

-- ============================================================================
-- 4. EBOOKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ebooks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  author       TEXT,
  description  TEXT,
  synopsis     TEXT,
  pages        INTEGER,
  category     TEXT,
  category_id  UUID REFERENCES public.categories(id),
  image        TEXT,
  pdf_url      TEXT,
  price        TEXT,
  is_free      BOOLEAN DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ebooks_category ON public.ebooks(category);
CREATE INDEX IF NOT EXISTS idx_ebooks_sort_order ON public.ebooks(sort_order);

-- ============================================================================
-- 5. GAMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.games (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  category     TEXT,
  category_id  UUID REFERENCES public.categories(id),
  description  TEXT,
  mechanic     TEXT,
  objective    TEXT,
  image        TEXT,
  thumbnail    TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_games_active ON public.games(is_active);
CREATE INDEX IF NOT EXISTS idx_games_sort_order ON public.games(sort_order);

-- ============================================================================
-- 6. CHALLENGES (desafios semanais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  difficulty  TEXT CHECK (difficulty IN ('Fácil', 'Médio', 'Difícil', 'Extremo')),
  category    TEXT,
  xp          INTEGER DEFAULT 0,
  deadline    TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active);

-- ============================================================================
-- 7. ACHIEVEMENTS (conquistas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  xp_reward   INTEGER DEFAULT 0,
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. USER_ACHIEVEMENTS (junction: user <-> achievement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  unlocked_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- 9. USER_CHALLENGES (desafios completados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded   INTEGER DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

-- ============================================================================
-- 10. WAYPOINTS (mapa tático do usuário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.waypoints (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  lat        NUMERIC NOT NULL,
  lng        NUMERIC NOT NULL,
  type       TEXT DEFAULT 'generico',
  note       TEXT,
  color      TEXT DEFAULT '#f59e0b',
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_waypoints_user_id ON public.waypoints(user_id);

-- ============================================================================
-- 11. ROUTES (rotas no mapa tático)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.routes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  color               TEXT DEFAULT '#F97316',
  points              JSONB NOT NULL,              -- [{lat, lng}, ...]
  elevations          JSONB DEFAULT '[]'::jsonb,
  distance_km         NUMERIC,
  ascent_m            NUMERIC,
  descent_m           NUMERIC,
  estimated_time_min  INTEGER,
  notes               TEXT,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON public.routes(user_id);

-- ============================================================================
-- 12. ACTIVITY_LOG (log de atividades do usuário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description   TEXT,
  xp_awarded    INTEGER DEFAULT 0,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);

-- ============================================================================
-- 13. STREAKS (sequência de dias consecutivos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_seen_date  DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. DAILY_MISSIONS (missões diárias por usuário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_date    DATE NOT NULL,
  missions        JSONB NOT NULL,           -- array of mission objects
  completed_count INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mission_date)
);

-- ============================================================================
-- Row Level Security (RLS) — ativar em todas as tabelas
-- ============================================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waypoints         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions   ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function: is current user admin?
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- POLICIES — catálogo (public read, admin write)
-- ============================================================================

-- CATEGORIES
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  USING (TRUE);
CREATE POLICY "categories_admin_write"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PRODUCTS
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (TRUE);
CREATE POLICY "products_admin_write"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- EBOOKS
CREATE POLICY "ebooks_public_read"
  ON public.ebooks FOR SELECT
  USING (TRUE);
CREATE POLICY "ebooks_admin_write"
  ON public.ebooks FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- GAMES
CREATE POLICY "games_public_read"
  ON public.games FOR SELECT
  USING (TRUE);
CREATE POLICY "games_admin_write"
  ON public.games FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CHALLENGES
CREATE POLICY "challenges_public_read"
  ON public.challenges FOR SELECT
  USING (TRUE);
CREATE POLICY "challenges_admin_write"
  ON public.challenges FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ACHIEVEMENTS
CREATE POLICY "achievements_public_read"
  ON public.achievements FOR SELECT
  USING (TRUE);
CREATE POLICY "achievements_admin_write"
  ON public.achievements FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- POLICIES — user-owned data (own data only; admin can see all)
-- ============================================================================

-- PROFILES: user reads/updates own; admin reads all + can update any
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- USER_ACHIEVEMENTS
CREATE POLICY "user_achievements_owner_read"
  ON public.user_achievements FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_achievements_owner_insert"
  ON public.user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_achievements_owner_delete"
  ON public.user_achievements FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- USER_CHALLENGES
CREATE POLICY "user_challenges_owner_read"
  ON public.user_challenges FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_challenges_owner_insert"
  ON public.user_challenges FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_challenges_owner_delete"
  ON public.user_challenges FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- WAYPOINTS
CREATE POLICY "waypoints_owner_read"
  ON public.waypoints FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "waypoints_owner_insert"
  ON public.waypoints FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "waypoints_owner_update"
  ON public.waypoints FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "waypoints_owner_delete"
  ON public.waypoints FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ROUTES
CREATE POLICY "routes_owner_read"
  ON public.routes FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "routes_owner_insert"
  ON public.routes FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "routes_owner_update"
  ON public.routes FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "routes_owner_delete"
  ON public.routes FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- ACTIVITY_LOG
CREATE POLICY "activity_log_owner_read"
  ON public.activity_log FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "activity_log_owner_insert"
  ON public.activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- STREAKS
CREATE POLICY "streaks_owner_read"
  ON public.streaks FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "streaks_owner_insert"
  ON public.streaks FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "streaks_owner_update"
  ON public.streaks FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- DAILY_MISSIONS
CREATE POLICY "daily_missions_owner_read"
  ON public.daily_missions FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "daily_missions_owner_insert"
  ON public.daily_missions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "daily_missions_owner_update"
  ON public.daily_missions FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- Realtime (habilitar para tabelas críticas)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.waypoints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.routes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- ============================================================================
-- SEED — categorias padrão
-- ============================================================================
INSERT INTO public.categories (name, slug, type, description) VALUES
  ('Equipamentos de Camping',   'equipamentos-camping',   'product',   'Barracas, mochilas, sacos de dormir'),
  ('Ferramentas de Bushcraft',  'ferramentas-bushcraft',  'product',   'Facas, machados, serras'),
  ('Iluminação Tática',         'iluminacao-tatica',       'product',   'Lanternas, headlamps, luzes de emergência'),
  ('Kits de Emergência',        'kits-emergencia',         'product',   'Primeiros socorros, kits de sobrevivência'),
  ('Navegação',                 'navegacao',               'product',   'Bússolas, GPS, mapas'),
  ('Purificação de Água',       'purificacao-agua',        'product',   'Filtros, tabletes, purificadores UV'),
  ('Cozinha de Campo',          'cozinha-campo',           'product',   'Fogareiros, panelas, garrafas térmicas'),
  ('Abrigo e Vestuário',        'abrigo-vestuario',         'product',   'Tarps, ponchos, luvas, cobertores'),
  ('Comunicação',               'comunicacao',             'product',   'Rádios, apitos, sinalizadores'),
  ('E-books de Sobrevivência',  'ebooks-sobrevivencia',    'ebook',     'Guias de sobrevivência e bushcraft'),
  ('Jogos de Sobrevivência',    'jogos-sobrevivencia',     'game',      'Jogos interativos de sobrevivência'),
  ('Desafios de Sobrevivência', 'desafios-sobrevivencia',  'challenge', 'Desafios práticos semanais')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED — conquistas padrão (10)
-- ============================================================================
INSERT INTO public.achievements (code, name, description, icon, xp_reward, category) VALUES
  ('explorer_init',   'Explorador Iniciante',   'Descubra 5 pontos no mapa',         '🧭', 50,  'map'),
  ('shelter_expert',  'Especialista em Abrigo', 'Construa 3 abrigos no simulador',   '🏕️', 100, 'simulator'),
  ('survival_master', 'Mestre da Sobrevivência', 'Atinja o nível 10',                  '🏆', 200, 'level'),
  ('first_login',     'Primeiro Acesso',        'Faça login pela primeira vez',      '🔑', 10,  'general'),
  ('streak_7',        'Semana Perfeita',         '7 dias consecutivos',               '🔥', 75,  'streak'),
  ('streak_30',       'Mês de Ouro',             '30 dias consecutivos',              '⭐', 300, 'streak'),
  ('challenge_5',     'Desafiante',              'Complete 5 desafios',               '💪', 100, 'challenge'),
  ('ebook_reader',    'Leitor Voraz',            'Leia 3 e-books',                    '📚', 75,  'ebook'),
  ('waypoint_10',     'Cartógrafo',              'Crie 10 waypoints',                 '📍', 100, 'gis'),
  ('route_master',    'Mestre das Rotas',        'Crie 5 rotas',                      '🗺️', 150, 'gis')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- FIM do schema.
--
-- PARA DEFINIR O PRIMEIRO ADMIN:
--   1. Crie uma conta no app (login por e-mail ou Google)
--   2. Pegue o ID do user no Supabase Dashboard > Authentication > Users
--   3. Rode no SQL Editor:
--        UPDATE public.profiles SET is_admin = TRUE WHERE email = 'seu@email.com';
--
-- PARA CONFIGURAR GOOGLE OAUTH:
--   1. https://console.cloud.google.com/ > APIs & Services > Credentials
--   2. Create OAuth client ID (Web application)
--   3. Authorized redirect URIs:
--        https://mbterwktxczsyevcudoz.supabase.co/auth/v1/callback
--   4. Supabase Dashboard > Authentication > Providers > Google
--      > Habilitar > colar Client ID + Secret
-- ============================================================================
