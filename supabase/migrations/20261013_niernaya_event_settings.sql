-- NIErnaya: align event dates with the confirmed schedule and make participation offline-only.
-- This migration updates event configuration only; it does not delete teams or submissions.

-- The event is offline-only. Normalize any previously saved participation mode values.
UPDATE public.teams
SET mode = 'Offline', updated_at = now()
WHERE mode::text <> 'Offline';

-- Phase cards shown on the public website and student dashboard.
UPDATE public.phases
SET start_date = DATE '2026-10-28', end_date = DATE '2026-10-28', status = 'upcoming', updated_at = now()
WHERE slug = 'data-hunt';

UPDATE public.phases
SET start_date = DATE '2026-11-11', end_date = DATE '2026-11-11', status = 'upcoming', updated_at = now()
WHERE slug = 'data-lab-war';

UPDATE public.phases
SET start_date = DATE '2026-11-20', end_date = DATE '2026-11-20', status = 'upcoming', updated_at = now()
WHERE slug = 'live-battle';

-- Ensure each phase's primary Event Journey entry is linked to its phase record.
UPDATE public.timeline_events
SET phase_id = (SELECT id FROM public.phases WHERE slug = 'data-hunt' LIMIT 1)
WHERE title ILIKE 'Phase 1: Data Hunt%';

UPDATE public.timeline_events
SET phase_id = (SELECT id FROM public.phases WHERE slug = 'data-lab-war' LIMIT 1)
WHERE title ILIKE 'Phase 2: Data Lab%';

UPDATE public.timeline_events
SET phase_id = (SELECT id FROM public.phases WHERE slug = 'live-battle' LIMIT 1)
WHERE title ILIKE 'Phase 3: Live Data Battle%';

-- Confirmed public Event Journey dates.
UPDATE public.timeline_events
SET event_date = DATE '2026-10-17', status = 'upcoming', sort_order = 1, updated_at = now()
WHERE title ILIKE 'Registrations Open%';

UPDATE public.timeline_events
SET event_date = DATE '2026-10-25', status = 'upcoming', updated_at = now(), sort_order = 2
WHERE title ILIKE 'Registration Deadline%';

UPDATE public.timeline_events
SET event_date = DATE '2026-10-28', status = 'upcoming', updated_at = now(), sort_order = 3
WHERE title ILIKE 'Phase 1: Data Hunt%';

UPDATE public.timeline_events
SET event_date = DATE '2026-11-04', status = 'upcoming', updated_at = now(), sort_order = 4
WHERE title ILIKE 'Shortlisted Teams Announcement%';

UPDATE public.timeline_events
SET event_date = DATE '2026-11-11', status = 'upcoming', updated_at = now(), sort_order = 5
WHERE title ILIKE 'Phase 2: Data Lab%';

UPDATE public.timeline_events
SET event_date = DATE '2026-11-20', status = 'upcoming', updated_at = now(), sort_order = 6
WHERE title ILIKE 'Phase 3: Live Data Battle%';

-- This extra submission-deadline card is not part of the confirmed published timeline.
-- Keep its record for administrators but hide it from the public journey.
UPDATE public.timeline_events
SET public_visible = false, updated_at = now()
WHERE title ILIKE 'Phase 1 Submission Deadline%';

-- The official Grand Valedictory date is still unconfirmed. event_date is NOT NULL
-- in this database, so preserve its existing date instead of setting it to NULL.
-- Update its order/status only; replace the date once the official date is confirmed.
UPDATE public.timeline_events
SET status = 'upcoming', sort_order = 7, updated_at = now()
WHERE title ILIKE 'Grand Valedictory%';

-- Existing policies already grant assigned faculty SELECT access to team_members
-- and submissions via is_current_user_faculty_for_team(). Add only the missing
-- faculty read path for student profiles, limited to students on assigned teams.
-- RLS is already enabled on students in the inspected project.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'students'
      AND policyname = 'faculty_read_students_on_assigned_teams'
  ) THEN
    CREATE POLICY faculty_read_students_on_assigned_teams
      ON public.students
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.team_members tm
          JOIN public.faculty_assignments fa ON fa.team_id = tm.team_id
          JOIN public.faculty f ON f.id = fa.faculty_id
          WHERE tm.student_id = students.id
            AND f.profile_id = auth.uid()
            AND f.active = true
        )
      );
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
