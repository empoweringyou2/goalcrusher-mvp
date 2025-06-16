/*
  # Add Social and Accountability Features

  1. New Tables
    - friendships: Friend connections
    - teams: Goal teams
    - team_memberships: Team membership tracking
    - accountability_partnerships: Accountability relationships
    - accountability_logs: Accountability tracking
    - goal_templates: Shareable goal templates

  2. Security
    - Enable RLS on all new tables
    - Add policies for social data access
*/

-- Goal Templates
CREATE TABLE IF NOT EXISTS goal_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  is_public boolean DEFAULT false,
  template_data jsonb NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Social & Accountability
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK(requester_id != addressee_id)
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  creator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  is_public boolean DEFAULT true,
  max_members integer DEFAULT 50,
  total_xp integer DEFAULT 0,
  average_accountability decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_memberships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at timestamptz DEFAULT now(),
  contribution_xp integer DEFAULT 0,
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS accountability_partnerships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  partnership_type text NOT NULL CHECK (partnership_type IN ('ai', 'partner', 'team', 'public')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  success_rate decimal(5,2) DEFAULT 0,
  total_commitments integer DEFAULT 0,
  completed_commitments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK(
    (partnership_type = 'partner' AND partner_id IS NOT NULL) OR
    (partnership_type = 'team' AND team_id IS NOT NULL) OR
    (partnership_type IN ('ai', 'public'))
  )
);

CREATE TABLE IF NOT EXISTS accountability_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  partnership_id uuid REFERENCES accountability_partnerships(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  commitment_type text NOT NULL CHECK (commitment_type IN ('task', 'goal', 'habit', 'custom')),
  commitment_description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'excused')),
  check_in_time timestamptz,
  consequences text,
  rewards text,
  proof_image_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_user ON team_memberships(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_logs_partnership ON accountability_logs(partnership_id);

-- Enable RLS
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own goal templates" ON goal_templates FOR ALL TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can read public goal templates" ON goal_templates FOR SELECT TO authenticated USING (is_public = true);

CREATE POLICY "Users can manage friendships" ON friendships FOR ALL TO authenticated USING (
  requester_id = auth.uid() OR addressee_id = auth.uid()
);

CREATE POLICY "Users can read public teams" ON teams FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Team creators can manage teams" ON teams FOR ALL TO authenticated USING (creator_id = auth.uid());

CREATE POLICY "Users can read team memberships" ON team_memberships FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR 
  team_id IN (SELECT id FROM teams WHERE is_public = true)
);
CREATE POLICY "Users can manage own team memberships" ON team_memberships FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own accountability partnerships" ON accountability_partnerships FOR ALL TO authenticated USING (
  user_id = auth.uid() OR partner_id = auth.uid()
);

CREATE POLICY "Users can manage accountability logs" ON accountability_logs FOR ALL TO authenticated USING (
  user_id = auth.uid() OR 
  partnership_id IN (SELECT id FROM accountability_partnerships WHERE user_id = auth.uid() OR partner_id = auth.uid())
);

-- Update triggers
CREATE TRIGGER update_goal_templates_updated_at BEFORE UPDATE ON goal_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accountability_partnerships_updated_at BEFORE UPDATE ON accountability_partnerships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accountability_logs_updated_at BEFORE UPDATE ON accountability_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();