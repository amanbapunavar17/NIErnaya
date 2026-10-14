# NIErnaya implementation notes

This ZIP is the current source baseline inspected for the requested NIErnaya corrections. It is not a deployed build and no live Supabase migration has been executed from this environment.

## Changes included in source

- Student dashboard selects the most recent faculty assignment row so duplicate/history rows do not make `maybeSingle()` fail.
- Faculty dashboards fetch the team leader independently of `team_members`, include team leader details, roster details, problem statement, SDG, and submission status for assigned teams.
- Admin phase settings now use editable phase name/date/status drafts with an explicit **Save Phase Settings** action. Event Journey rows have editable title/date/status drafts with an explicit **Save** action. Saving a phase synchronizes its primary linked Event Journey item.
- Volunteer certificate category added using the existing A4 landscape certificate generator/template.
- Participation mode is now offline-only in registration and user-facing UI. Evaluation/score/feedback UI has been removed; existing database score/feedback columns, if present, are not dropped.
- Public faculty cards and timeline cards use compact small-screen layouts while keeping desktop layout intact.
- Event Journey includes a car icon that moves forward/backward with page scrolling; existing arrow controls remain.
- Confirmed schedule dates are reflected in static fallbacks. Grand Valedictory date is shown as TBD because the current handover did not confirm it.

## Supabase migration required

File: `supabase/migrations/20261013_niernaya_event_settings.sql`

Before running it, review it and confirm the current Supabase project has the tables/columns/functions referenced by the application (`teams`, `phases`, `timeline_events`, `faculty_assignments`, `team_members`, `students`, `submissions`, and `get_current_faculty_id()`). The migration updates known event dates/statuses, normalizes saved participation mode values to Offline, hides the unconfirmed Phase 1 submission-deadline card, leaves Grand Valedictory visible with no date, and adds narrowly scoped faculty read policies if those policy names do not already exist. It does not delete teams or submissions.

Run it only in the intended NIErnaya Supabase project: open **Supabase Dashboard → SQL Editor**, review the SQL, then execute it. Do not run it against a production project until you have confirmed the target project and taken any required backup. The migration does not toggle RLS on/off; the added policies assume the affected tables already have RLS enabled. Inspect current policies first if they do not.

The public timeline and `phases` table are updated by this migration. The actual registration gate may also be enforced inside the existing `register_team()` function or `event_settings.registration_deadline`. That function/schema is not fully defined in this ZIP, so verify the `event_settings` column types and `register_team()` function definition before changing the backend registration cutoff. Do not assume the public date text alone changes the database registration gate.

## Validation limitation

The ZIP does not contain installed project dependencies and this environment could not complete `npm ci`, so a full Vite build and browser/Supabase integration test could not be run here. TypeScript syntax checking found no parse errors after the edits; a full type/build check still requires installing dependencies in VS Code.

## Run locally in VS Code

1. Extract this ZIP into a new folder so your existing copy remains untouched.
2. Open the extracted folder in VS Code.
3. In the terminal run `npm ci`.
4. Review `.env.example` (if present) and create a local `.env` with your own Supabase URL and anon key; never put a service-role key in frontend environment variables.
5. Run `npm run build`. Fix any environment-specific issues before replacing your existing working folder.
6. Review and apply the SQL migration separately in the correct Supabase project.
7. Test student, faculty, and admin accounts individually, especially that a faculty account can only read teams assigned to that faculty account.

Grand Valedictory date still needs your confirmation before a date is published.


## Supabase schema verification update (2026-10-13)
- Verified that the required eight public tables exist and RLS is enabled on each.
- Reused the existing faculty identity/access helpers and existing team_members/submissions faculty policies; the migration no longer adds duplicate policies for those tables.
- Added only the assigned-faculty SELECT policy for student profiles.
- `timeline_events.event_date` is NOT NULL in the current schema, so the migration preserves the existing Grand Valedictory date until the official date is confirmed.
- This SQL is still a migration file; it has not been applied to the live Supabase project. Review event enum values and test in the intended project before applying.
