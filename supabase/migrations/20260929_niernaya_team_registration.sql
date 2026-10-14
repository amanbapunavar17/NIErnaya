-- NIErnaya: Phase 1 problem statement + SDG capture
-- Adds the official Phase 1 registration fields without changing existing team IDs.

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS problem_statement text,
  ADD COLUMN IF NOT EXISTS selected_sdg smallint;

ALTER TABLE public.teams
  DROP CONSTRAINT IF EXISTS teams_selected_sdg_check;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_selected_sdg_check
  CHECK (selected_sdg IS NULL OR selected_sdg IN (2, 3, 4, 5, 13));

COMMENT ON COLUMN public.teams.problem_statement IS
  'NIErnaya Phase 1 problem statement submitted by the team leader.';

COMMENT ON COLUMN public.teams.selected_sdg IS
  'NIErnaya Phase 1 SDG selection. Allowed values: 2, 3, 4, 5, 13.';

-- Keep the established 4-argument register_team() as the compatibility
-- implementation. This overload captures the two new official fields and
-- then delegates all existing validation/team-member creation to it.
CREATE OR REPLACE FUNCTION public.register_team(
  p_team_name text,
  p_mode text,
  p_campus text,
  p_members jsonb,
  p_problem_statement text,
  p_selected_sdg smallint
)
RETURNS public.teams
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_team public.teams;
  v_sql text;
BEGIN
  IF p_problem_statement IS NULL OR length(trim(p_problem_statement)) < 20 THEN
    RAISE EXCEPTION 'Problem statement must contain at least 20 characters';
  END IF;

  IF p_selected_sdg NOT IN (2, 3, 4, 5, 13) THEN
    RAISE EXCEPTION 'Invalid SDG selection';
  END IF;

  -- Existing register_team() remains the source of truth for authentication,
  -- registration-window, team-size, student-uniqueness, campus, and academic
  -- eligibility checks.
  -- Resolve the established four-argument function's exact parameter
  -- types from PostgreSQL metadata. This avoids coupling the migration to
  -- whether the existing mode/campus columns are enums, domains, or text.
  SELECT format(
    'SELECT * FROM public.register_team($1::%s, $2::%s, $3::%s, $4::%s)',
    format_type(proargtypes[0], NULL),
    format_type(proargtypes[1], NULL),
    format_type(proargtypes[2], NULL),
    format_type(proargtypes[3], NULL)
  )
  INTO v_sql
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname = 'register_team'
    AND pronargs = 4
  ORDER BY oid DESC
  LIMIT 1;

  IF v_sql IS NULL THEN
    RAISE EXCEPTION 'Existing 4-argument register_team() function was not found';
  END IF;

  EXECUTE v_sql
  INTO v_team
  USING p_team_name, p_mode, p_campus, p_members;

  UPDATE public.teams
  SET
    problem_statement = trim(p_problem_statement),
    selected_sdg = p_selected_sdg,
    updated_at = now()
  WHERE id = v_team.id
  RETURNING * INTO v_team;

  RETURN v_team;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.register_team(
  text, text, text, jsonb, text, smallint
) TO authenticated;

NOTIFY pgrst, 'reload schema';
