/*
  # Add Analytics and Security Features

  1. New Tables
    - analytics_snapshots: Periodic analytics data
    - success_happiness_logs: Success vs happiness tracking
    - feature_flags: Pro feature access control
    - audit_logs: Security and activity logging

  2. Security
    - Enable RLS on all new tables
    - Add policies for analytics and security data
*/

-- Analytics
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date date NOT NULL,
  snapshot_type text NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date, snapshot_type)
);

CREATE TABLE IF NOT EXISTS success_happiness_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  log_date date NOT NULL,
  success_rating integer CHECK (success_rating >= 1 AND success_rating <= 10),
  happiness_rating integer CHECK (happiness_rating >= 1 AND happiness_rating <= 10),
  life_domain_id uuid REFERENCES life_domains(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date, life_domain_id)
);

-- Security & Access
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  feature_name text NOT NULL,
  is_enabled boolean DEFAULT false,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  granted_by text,
  UNIQUE(user_id, feature_name)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date ON analytics_snapshots(user_id, snapshot_date);

-- Enable RLS
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_happiness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own analytics" ON analytics_snapshots FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own success happiness logs" ON success_happiness_logs FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own feature flags" ON feature_flags FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can read own audit logs" ON audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid());