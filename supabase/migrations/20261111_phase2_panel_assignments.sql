-- NIErnaya Phase 2: coordinator panels, display-only jury profiles,
-- shortlisted team assignment, and coordinator-submitted final decisions.
-- Apply after 20261101_phase1_faculty_evaluation.sql.

CREATE TABLE IF NOT EXISTS public.phase2_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id uuid NOT NULL UNIQUE REFERENCES public.faculty(id) ON DELETE RESTRICT,
  coordinator_photo_url text,
  jury_name text NOT NULL DEFAULT '',
  jury_designation text NOT NULL DEFAULT '',
  jury_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.phase2_team_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id uuid NOT NULL REFERENCES public.phase2_panels(id) ON DELETE CASCADE,
  team_id uuid NOT NULL UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.phase2_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE,
  panel_id uuid NOT NULL REFERENCES public.phase2_panels(id) ON DELETE CASCADE,
  coordinator_id uuid NOT NULL REFERENCES public.faculty(id) ON DELETE RESTRICT,
  decision text NOT NULL CHECK (decision IN ('selected', 'not_selected')),
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS phase2_assignments_panel_idx
  ON public.phase2_team_assignments(panel_id);
CREATE INDEX IF NOT EXISTS phase2_decisions_panel_idx
  ON public.phase2_decisions(panel_id);

ALTER TABLE public.phase2_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase2_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase2_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Phase2 admins manage panels" ON public.phase2_panels;
CREATE POLICY "Phase2 admins manage panels" ON public.phase2_panels
  FOR ALL TO authenticated
  USING (public.get_user_role()::text = 'admin')
  WITH CHECK (public.get_user_role()::text = 'admin');

DROP POLICY IF EXISTS "Authenticated users read Phase2 panels" ON public.phase2_panels;
CREATE POLICY "Authenticated users read Phase2 panels" ON public.phase2_panels
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Phase2 admins manage team assignments" ON public.phase2_team_assignments;
CREATE POLICY "Phase2 admins manage team assignments" ON public.phase2_team_assignments
  FOR ALL TO authenticated
  USING (public.get_user_role()::text = 'admin')
  WITH CHECK (public.get_user_role()::text = 'admin');

DROP POLICY IF EXISTS "Coordinators read own Phase2 assignments" ON public.phase2_team_assignments;
CREATE POLICY "Coordinators read own Phase2 assignments" ON public.phase2_team_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.phase2_panels p
    WHERE p.id = panel_id AND p.coordinator_id = public.get_current_faculty_id()
  ));

-- IMPORTANT: Do not create a student policy on phase2_team_assignments
-- that queries team_members. Existing team_members access policies may
-- themselves consult Phase 2 assignments, creating recursive RLS evaluation.
-- Student-facing assignment visibility will be added later through a
-- SECURITY DEFINER RPC with a fixed search_path and explicit auth.uid() check.
DROP POLICY IF EXISTS "Students read their Phase2 assignment"
  ON public.phase2_team_assignments;

-- Phase 2 coordinators need read-only access to the complete assigned-team
-- context even when the team was originally mentored by another Phase 1 faculty member.
DROP POLICY IF EXISTS "Phase2 coordinators read assigned teams" ON public.teams;
CREATE POLICY "Phase2 coordinators read assigned teams" ON public.teams
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.phase2_team_assignments a
    JOIN public.phase2_panels p ON p.id = a.panel_id
    WHERE a.team_id = teams.id
      AND p.coordinator_id = public.get_current_faculty_id()
  ));

DROP POLICY IF EXISTS "Phase2 coordinators read assigned team members" ON public.team_members;
CREATE POLICY "Phase2 coordinators read assigned team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.phase2_team_assignments a
    JOIN public.phase2_panels p ON p.id = a.panel_id
    WHERE a.team_id = team_members.team_id
      AND p.coordinator_id = public.get_current_faculty_id()
  ));

DROP POLICY IF EXISTS "Phase2 coordinators read assigned students" ON public.students;
CREATE POLICY "Phase2 coordinators read assigned students" ON public.students
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.phase2_team_assignments a ON a.team_id = tm.team_id
    JOIN public.phase2_panels p ON p.id = a.panel_id
    WHERE tm.student_id = students.id
      AND p.coordinator_id = public.get_current_faculty_id()
  ) OR EXISTS (
    SELECT 1
    FROM public.teams t
    JOIN public.phase2_team_assignments a ON a.team_id = t.id
    JOIN public.phase2_panels p ON p.id = a.panel_id
    WHERE t.leader_student_id = students.id
      AND p.coordinator_id = public.get_current_faculty_id()
  ));

DROP POLICY IF EXISTS "Phase2 coordinators read assigned submissions" ON public.submissions;
CREATE POLICY "Phase2 coordinators read assigned submissions" ON public.submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.phase2_team_assignments a
    JOIN public.phase2_panels p ON p.id = a.panel_id
    WHERE a.team_id = submissions.team_id
      AND p.coordinator_id = public.get_current_faculty_id()
  ));

DROP POLICY IF EXISTS "Phase2 admins read decisions" ON public.phase2_decisions;
CREATE POLICY "Phase2 admins read decisions" ON public.phase2_decisions
  FOR SELECT TO authenticated USING (public.get_user_role()::text = 'admin');

DROP POLICY IF EXISTS "Coordinators read own Phase2 decisions" ON public.phase2_decisions;
CREATE POLICY "Coordinators read own Phase2 decisions" ON public.phase2_decisions
  FOR SELECT TO authenticated USING (coordinator_id = public.get_current_faculty_id());

-- Enforce that only teams explicitly selected in a confirmed Phase 1 shortlist
-- can be assigned, even if an admin bypasses the website UI.
CREATE OR REPLACE FUNCTION public.validate_phase2_shortlisted_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.phase1_faculty_shortlists s
    WHERE NEW.team_id = ANY(s.selected_team_ids)
  ) THEN
    RAISE EXCEPTION 'Only confirmed Phase 1 shortlisted teams can be assigned to Phase 2';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS phase2_require_confirmed_shortlist
  ON public.phase2_team_assignments;
CREATE TRIGGER phase2_require_confirmed_shortlist
  BEFORE INSERT OR UPDATE OF team_id ON public.phase2_team_assignments
  FOR EACH ROW EXECUTE FUNCTION public.validate_phase2_shortlisted_team();

-- A reassigned team must receive a fresh decision from its new coordinator.
CREATE OR REPLACE FUNCTION public.clear_phase2_decision_on_reassignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.phase2_decisions WHERE team_id = OLD.team_id;
    RETURN OLD;
  END IF;

  IF NEW.panel_id IS DISTINCT FROM OLD.panel_id THEN
    DELETE FROM public.phase2_decisions WHERE team_id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS phase2_clear_decision_after_assignment_change
  ON public.phase2_team_assignments;
CREATE TRIGGER phase2_clear_decision_after_assignment_change
  AFTER UPDATE OF panel_id OR DELETE ON public.phase2_team_assignments
  FOR EACH ROW EXECUTE FUNCTION public.clear_phase2_decision_on_reassignment();

CREATE OR REPLACE FUNCTION public.submit_phase2_decision(
  p_team_id uuid,
  p_decision text
)
RETURNS public.phase2_decisions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_faculty_id uuid;
  v_panel_id uuid;
  v_result public.phase2_decisions;
BEGIN
  IF p_decision NOT IN ('selected', 'not_selected') THEN
    RAISE EXCEPTION 'Decision must be selected or not_selected';
  END IF;

  v_faculty_id := public.get_current_faculty_id();
  IF v_faculty_id IS NULL THEN
    RAISE EXCEPTION 'Faculty account not found';
  END IF;

  SELECT a.panel_id INTO v_panel_id
  FROM public.phase2_team_assignments a
  JOIN public.phase2_panels p ON p.id = a.panel_id
  WHERE a.team_id = p_team_id AND p.coordinator_id = v_faculty_id;

  IF v_panel_id IS NULL THEN
    RAISE EXCEPTION 'This team is not assigned to your Phase 2 panel';
  END IF;

  INSERT INTO public.phase2_decisions
    (team_id, panel_id, coordinator_id, decision, submitted_by, submitted_at, updated_at)
  VALUES
    (p_team_id, v_panel_id, v_faculty_id, p_decision, auth.uid(), now(), now())
  ON CONFLICT (team_id) DO UPDATE SET
    panel_id = EXCLUDED.panel_id,
    coordinator_id = EXCLUDED.coordinator_id,
    decision = EXCLUDED.decision,
    submitted_by = EXCLUDED.submitted_by,
    submitted_at = now(),
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_phase2_decision(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_phase2_decision(uuid, text) TO authenticated;

GRANT SELECT ON public.phase2_panels, public.phase2_team_assignments, public.phase2_decisions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.phase2_panels, public.phase2_team_assignments TO authenticated;
NOTIFY pgrst, 'reload schema';
