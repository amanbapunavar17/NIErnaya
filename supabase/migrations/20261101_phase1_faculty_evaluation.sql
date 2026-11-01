-- NIErnaya Phase 1 Faculty Evaluation
-- Six criteria, automatic marks, faculty shortlist and confirmation.

CREATE TABLE IF NOT EXISTS public.phase1_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

    dataset_relevance SMALLINT NOT NULL CHECK (dataset_relevance BETWEEN 0 AND 12),
    dataset_quality SMALLINT NOT NULL CHECK (dataset_quality BETWEEN 0 AND 10),
    authenticity_credibility SMALLINT NOT NULL CHECK (authenticity_credibility BETWEEN 0 AND 8),
    data_volume_diversity SMALLINT NOT NULL CHECK (data_volume_diversity BETWEEN 0 AND 5),
    analytical_potential SMALLINT NOT NULL CHECK (analytical_potential BETWEEN 0 AND 10),
    sdg_relevance SMALLINT NOT NULL CHECK (sdg_relevance BETWEEN 0 AND 5),

    total_marks SMALLINT GENERATED ALWAYS AS (
        dataset_relevance +
        dataset_quality +
        authenticity_credibility +
        data_volume_diversity +
        analytical_potential +
        sdg_relevance
    ) STORED,

    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (faculty_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.phase1_faculty_shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL UNIQUE REFERENCES public.faculty(id) ON DELETE CASCADE,
    assigned_team_count SMALLINT NOT NULL,
    required_selection_count SMALLINT NOT NULL,
    selected_team_ids UUID[] NOT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.phase1_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase1_faculty_shortlists ENABLE ROW LEVEL SECURITY;

-- Faculty can view their own evaluations.
CREATE POLICY "Faculty can view own phase1 evaluations"
ON public.phase1_evaluations
FOR SELECT TO authenticated
USING (faculty_id = public.get_current_faculty_id());

-- Admin can view all evaluations.
CREATE POLICY "Admins can view phase1 evaluations"
ON public.phase1_evaluations
FOR SELECT TO authenticated
USING (public.get_user_role()::text = 'admin');

-- Faculty can view their own shortlist.
CREATE POLICY "Faculty can view own phase1 shortlist"
ON public.phase1_faculty_shortlists
FOR SELECT TO authenticated
USING (faculty_id = public.get_current_faculty_id());

-- Admin can view all shortlists.
CREATE POLICY "Admins can view phase1 shortlists"
ON public.phase1_faculty_shortlists
FOR SELECT TO authenticated
USING (public.get_user_role()::text = 'admin');


-- SAVE EVALUATION
CREATE OR REPLACE FUNCTION public.save_phase1_evaluation(
    p_team_id UUID,
    p_dataset_relevance SMALLINT,
    p_dataset_quality SMALLINT,
    p_authenticity_credibility SMALLINT,
    p_data_volume_diversity SMALLINT,
    p_analytical_potential SMALLINT,
    p_sdg_relevance SMALLINT
)
RETURNS public.phase1_evaluations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_faculty_id UUID;
    v_result public.phase1_evaluations;
BEGIN
    v_faculty_id := public.get_current_faculty_id();

    IF v_faculty_id IS NULL THEN
        RAISE EXCEPTION 'Faculty account not found';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.faculty_assignments
        WHERE faculty_id = v_faculty_id
          AND team_id = p_team_id
    ) THEN
        RAISE EXCEPTION 'This team is not assigned to you';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.phase1_faculty_shortlists
        WHERE faculty_id = v_faculty_id
    ) THEN
        RAISE EXCEPTION 'Your shortlist is already confirmed';
    END IF;

    INSERT INTO public.phase1_evaluations (
        faculty_id,
        team_id,
        dataset_relevance,
        dataset_quality,
        authenticity_credibility,
        data_volume_diversity,
        analytical_potential,
        sdg_relevance,
        updated_at
    )
    VALUES (
        v_faculty_id,
        p_team_id,
        p_dataset_relevance,
        p_dataset_quality,
        p_authenticity_credibility,
        p_data_volume_diversity,
        p_analytical_potential,
        p_sdg_relevance,
        NOW()
    )
    ON CONFLICT (faculty_id, team_id)
    DO UPDATE SET
        dataset_relevance = EXCLUDED.dataset_relevance,
        dataset_quality = EXCLUDED.dataset_quality,
        authenticity_credibility = EXCLUDED.authenticity_credibility,
        data_volume_diversity = EXCLUDED.data_volume_diversity,
        analytical_potential = EXCLUDED.analytical_potential,
        sdg_relevance = EXCLUDED.sdg_relevance,
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;


-- CONFIRM FACULTY SHORTLIST
CREATE OR REPLACE FUNCTION public.confirm_phase1_shortlist(
    p_selected_team_ids UUID[]
)
RETURNS public.phase1_faculty_shortlists
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_faculty_id UUID;
    v_assigned_count INTEGER;
    v_required INTEGER;
    v_selected_count INTEGER;
    v_evaluated_count INTEGER;
    v_result public.phase1_faculty_shortlists;
BEGIN
    v_faculty_id := public.get_current_faculty_id();

    IF v_faculty_id IS NULL THEN
        RAISE EXCEPTION 'Faculty account not found';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.phase1_faculty_shortlists
        WHERE faculty_id = v_faculty_id
    ) THEN
        RAISE EXCEPTION 'Your shortlist has already been confirmed';
    END IF;

    SELECT COUNT(*)
    INTO v_assigned_count
    FROM public.faculty_assignments
    WHERE faculty_id = v_faculty_id;

    v_required := CASE v_assigned_count
        WHEN 13 THEN 6
        WHEN 14 THEN 7
        WHEN 15 THEN 5
        WHEN 16 THEN 8
        ELSE NULL
    END;

    IF v_required IS NULL THEN
        RAISE EXCEPTION
        'No selection rule configured for % assigned teams',
        v_assigned_count;
    END IF;

    SELECT COUNT(*)
    INTO v_evaluated_count
    FROM public.phase1_evaluations
    WHERE faculty_id = v_faculty_id;

    IF v_evaluated_count <> v_assigned_count THEN
        RAISE EXCEPTION
        'Evaluate all assigned teams first. Evaluated % of %',
        v_evaluated_count,
        v_assigned_count;
    END IF;

    v_selected_count := COALESCE(
        ARRAY_LENGTH(p_selected_team_ids, 1),
        0
    );

    IF v_selected_count < v_required
       OR v_selected_count > v_required + 2 THEN
        RAISE EXCEPTION
        'Select between % and % teams',
        v_required,
        v_required + 2;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM UNNEST(p_selected_team_ids) AS chosen(team_id)
        LEFT JOIN public.faculty_assignments fa
          ON fa.team_id = chosen.team_id
         AND fa.faculty_id = v_faculty_id
        WHERE fa.team_id IS NULL
    ) THEN
        RAISE EXCEPTION
        'Selection contains a team not assigned to you';
    END IF;

    IF (
        SELECT COUNT(DISTINCT x)
        FROM UNNEST(p_selected_team_ids) x
    ) <> v_selected_count THEN
        RAISE EXCEPTION 'Duplicate teams are not allowed';
    END IF;

    INSERT INTO public.phase1_faculty_shortlists (
        faculty_id,
        assigned_team_count,
        required_selection_count,
        selected_team_ids,
        confirmed_at
    )
    VALUES (
        v_faculty_id,
        v_assigned_count,
        v_required,
        p_selected_team_ids,
        NOW()
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;


REVOKE ALL ON FUNCTION public.save_phase1_evaluation(
    UUID, SMALLINT, SMALLINT, SMALLINT,
    SMALLINT, SMALLINT, SMALLINT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_phase1_evaluation(
    UUID, SMALLINT, SMALLINT, SMALLINT,
    SMALLINT, SMALLINT, SMALLINT
) TO authenticated;

REVOKE ALL ON FUNCTION public.confirm_phase1_shortlist(UUID[])
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.confirm_phase1_shortlist(UUID[])
TO authenticated;