-- ============================================
-- Migration 001: Initial Schema & RLS
-- Smarte Dokumentenablage MVP
-- ============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'basic', 'plus', 'max')),
  locale TEXT NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en')),
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'colorful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Create folders table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  inherited_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime TEXT NOT NULL,
  size BIGINT NOT NULL CHECK (size >= 0),
  hash_sha256 TEXT NOT NULL,
  title TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  preview_state TEXT NOT NULL DEFAULT 'queued' CHECK (preview_state IN ('queued', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create usage_tracking table
CREATE TABLE public.usage_tracking (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0 CHECK (count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature, date)
);

-- 7. Create schema_config table
CREATE TABLE public.schema_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1 CHECK (version > 0),
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create audit_log table
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Files indexes
CREATE INDEX idx_files_owner_id ON public.files(owner_id);
CREATE INDEX idx_files_folder_id ON public.files(folder_id);
CREATE INDEX idx_files_hash_sha256 ON public.files(hash_sha256);
CREATE INDEX idx_files_tags ON public.files USING GIN(tags);
CREATE INDEX idx_files_created_at ON public.files(created_at DESC);

-- Folders indexes
CREATE INDEX idx_folders_owner_id ON public.folders(owner_id);
CREATE INDEX idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX idx_folders_created_at ON public.folders(created_at DESC);

-- Usage tracking indexes
CREATE INDEX idx_usage_tracking_user_feature_date ON public.usage_tracking(user_id, feature, date);

-- Audit log indexes
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schema_config_updated_at
  BEFORE UPDATE ON public.schema_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies (owner-only)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Folders policies (owner-only)
CREATE POLICY "Users can view own folders"
  ON public.folders
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own folders"
  ON public.folders
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own folders"
  ON public.folders
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own folders"
  ON public.folders
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Files policies (owner-only)
CREATE POLICY "Users can view own files"
  ON public.files
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own files"
  ON public.files
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own files"
  ON public.files
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own files"
  ON public.files
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Usage tracking policies (owner-only)
CREATE POLICY "Users can view own usage"
  ON public.usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.usage_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON public.usage_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Schema config policies (owner-only)
CREATE POLICY "Users can view own schema config"
  ON public.schema_config
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schema config"
  ON public.schema_config
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schema config"
  ON public.schema_config
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schema config"
  ON public.schema_config
  FOR DELETE
  USING (auth.uid() = user_id);

-- Audit log policies (owner-only read, system writes)
CREATE POLICY "Users can view own audit logs"
  ON public.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, plan_tier, locale, theme)
  VALUES (
    NEW.id,
    'free',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'de'),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'light')
  );
  
  -- Also create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();