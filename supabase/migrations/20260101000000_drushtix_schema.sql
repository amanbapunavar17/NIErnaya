-- ============================================================
-- NIErnaya
-- ADMIN CONTROLLED SUBMISSION PORTAL
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add submission_open to existing event_settings
-- ------------------------------------------------------------

ALTER TABLE public.event_settings
ADD COLUMN IF NOT EXISTS submission_open boolean
NOT NULL
DEFAULT false;


-- ------------------------------------------------------------
-- 2. Make sure the existing singleton is CLOSED initially
-- ------------------------------------------------------------

UPDATE public.event_settings
SET submission_open = false;


-- ------------------------------------------------------------
-- 3. Student / authenticated users can safely ask whether
--    the submission portal is open.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_submission_portal_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_open boolean;
BEGIN

    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT submission_open
    INTO v_open
    FROM public.event_settings
    LIMIT 1;

    RETURN COALESCE(v_open, false);

END;
$function$;


-- ------------------------------------------------------------
-- 4. Admin-only OPEN / CLOSE control
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_submission_portal(
    p_open boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_role public.user_role;
BEGIN

    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT public.get_user_role()
    INTO v_role;

    IF v_role <> 'admin' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE public.event_settings
    SET submission_open = p_open;

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        details
    )
    VALUES (
        auth.uid(),
        CASE
            WHEN p_open
            THEN 'SUBMISSION_PORTAL_OPENED'
            ELSE 'SUBMISSION_PORTAL_CLOSED'
        END,
        'submission_portal',
        NULL,
        jsonb_build_object(
            'submission_open', p_open
        )
    );

    RETURN p_open;

END;
$function$;


-- ------------------------------------------------------------
-- 5. Replace submission RPC
--
-- IMPORTANT:
-- Submission is NO LONGER dependent on
-- teams.registration_status = 'locked'.
--
-- Admin's submission_open flag is now the gate.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_team_submission(
    p_team_id uuid,
    p_storage_path text,
    p_file_name text,
    p_file_type text,
    p_file_size bigint
)
RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$

DECLARE
    v_user_id uuid;
    v_profile_id uuid;
    v_student_id uuid;
    v_team public.teams;
    v_submission public.submissions;
    v_existing_count integer;
    v_submission_open boolean;

BEGIN

    -- ========================================================
    -- 1. AUTHENTICATION
    -- ========================================================

    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;


    -- ========================================================
    -- 2. CHECK ADMIN SUBMISSION PORTAL
    -- ========================================================

    SELECT submission_open
    INTO v_submission_open
    FROM public.event_settings
    LIMIT 1;

    IF COALESCE(v_submission_open, false) = false THEN
        RAISE EXCEPTION 'Submission portal is currently closed';
    END IF;


    -- ========================================================
    -- 3. CURRENT PROFILE
    -- ========================================================

    SELECT id
    INTO v_profile_id
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;


    -- ========================================================
    -- 4. STUDENT RECORD
    -- ========================================================

    SELECT id
    INTO v_student_id
    FROM public.students
    WHERE profile_id = v_profile_id;

    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student profile not found';
    END IF;


    -- ========================================================
    -- 5. TEAM
    -- ========================================================

    SELECT *
    INTO v_team
    FROM public.teams
    WHERE id = p_team_id;

    IF v_team.id IS NULL THEN
        RAISE EXCEPTION 'Team not found';
    END IF;


    -- ========================================================
    -- 6. ONLY TEAM LEADER CAN SUBMIT
    -- ========================================================

    IF v_team.leader_student_id <> v_student_id THEN
        RAISE EXCEPTION 'Only the team leader can submit';
    END IF;


    -- ========================================================
    -- 7. STORAGE PATH
    --
    -- Expected:
    -- {TEAM_UUID}/submission-file.ext
    -- ========================================================

    IF p_storage_path IS NULL
       OR trim(p_storage_path) = ''
    THEN
        RAISE EXCEPTION 'Storage path is required';
    END IF;

    IF split_part(p_storage_path, '/', 1) <> p_team_id::text THEN
        RAISE EXCEPTION 'Invalid submission storage path';
    END IF;


    -- ========================================================
    -- 8. FILE NAME
    -- ========================================================

    IF p_file_name IS NULL
       OR trim(p_file_name) = ''
    THEN
        RAISE EXCEPTION 'File name is required';
    END IF;


    -- ========================================================
    -- 9. FILE SIZE
    -- Maximum 20 MB
    -- ========================================================

    IF p_file_size IS NULL OR p_file_size <= 0 THEN
        RAISE EXCEPTION 'Invalid file size';
    END IF;

    IF p_file_size > 20971520 THEN
        RAISE EXCEPTION 'File exceeds the 20 MB limit';
    END IF;


    -- ========================================================
    -- 10. FILE TYPE
    -- ========================================================

    IF lower(coalesce(p_file_type, '')) NOT IN (
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) THEN
        RAISE EXCEPTION 'Only PDF, PPT and PPTX files are allowed';
    END IF;


    -- ========================================================
    -- 11. PREVENT DUPLICATE SUBMISSION
    -- ========================================================

    SELECT count(*)
    INTO v_existing_count
    FROM public.submissions
    WHERE team_id = p_team_id;

    IF v_existing_count > 0 THEN
        RAISE EXCEPTION 'This team has already submitted a file';
    END IF;


    -- ========================================================
    -- 12. CREATE SUBMISSION
    -- ========================================================

    INSERT INTO public.submissions (
        team_id,
        storage_path,
        file_name,
        file_type,
        file_size,
        submitted_by,
        status
    )
    VALUES (
        p_team_id,
        p_storage_path,
        p_file_name,
        lower(p_file_type),
        p_file_size,
        v_profile_id,
        'submitted'
    )
    RETURNING *
    INTO v_submission;


    -- ========================================================
    -- 13. RETURN
    -- ========================================================

    RETURN v_submission;

END;
$function$;


-- ------------------------------------------------------------
-- 6. Permissions
-- ------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.get_submission_portal_status()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.set_submission_portal(boolean)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.submit_team_submission(
    uuid,
    text,
    text,
    text,
    bigint
)
TO authenticated;