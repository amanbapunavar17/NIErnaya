import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Building,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

type TeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  mode: 'Offline';
  campus: 'North' | 'South';
  registration_status: 'draft' | 'submitted' | 'locked';
  created_at: string;
  updated_at: string;
};

type StudentRow = {
  id: string;
  profile_id: string | null;
  name: string;
  usn: string;
  email: string;
  phone: string | null;
  branch: string;
  year: number;
  semester: number;
  section: string;
  campus: 'North' | 'South';
};

type FacultyRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  active: boolean;
};

type SubmissionRow = {
  id: string;
  team_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  submitted_at: string;
  submitted_by: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'rejected';
};

type PhaseRow = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  focus: string;
  description: string;
  campus_info: string | null;
  status: 'upcoming' | 'active' | 'completed' | 'hidden';
  sort_order: number;
  public_visible: boolean;
};

type DashboardData = {
  student: StudentRow;
  team: TeamRow | null;
  members: StudentRow[];
  faculty: FacultyRow | null;
  submission: SubmissionRow | null;
  phase1FormUrl: string | null;
  phase1Accepting: boolean;
  phases: PhaseRow[];
};

const formatPhaseDates = (start: string, end: string) => {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  const startText = startDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  const endText = endDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return start === end ? startText : `${startText} – ${endText}`;
};

const formatSubmissionSize = (bytes: number) => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').toUpperCase();
};

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Supabase is not configured. Please check your environment variables.'
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /* ---------------------------------------------------------
         1. Current authenticated user
      --------------------------------------------------------- */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error('No authenticated student session found.');
      }

      /* ---------------------------------------------------------
         2. Current student profile
      --------------------------------------------------------- */
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(
          `
          id,
          profile_id,
          name,
          usn,
          email,
          phone,
          branch,
          year,
          semester,
          section,
          campus
        `
        )
        .eq('profile_id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;

      if (!student) {
        throw new Error(
          'Student profile not found. Please contact the NIErnaya administrator.'
        );
      }

      /* ---------------------------------------------------------
         3. Find the team through team_members
      --------------------------------------------------------- */
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select(
            `
            id,
            team_id,
            student_id,
            created_at
            `
          )

        .eq('student_id', student.id)
        .maybeSingle();

      if (membershipError) throw membershipError;

      let team: TeamRow | null = null;
      let members: StudentRow[] = [];
      let faculty: FacultyRow | null = null;
      let submission: SubmissionRow | null = null;
      let phase1FormUrl: string | null = null;
      let phase1Accepting = false;

      /* ---------------------------------------------------------
         4. If the student belongs to a team, load team data
      --------------------------------------------------------- */
      if (membership) {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(
            `
            id,
            team_code,
            team_name,
            leader_student_id,
            mode,
            campus,
            registration_status,
            created_at,
            updated_at
          `
          )
          .eq('id', membership.team_id)
          .maybeSingle();

        if (teamError) throw teamError;

        team = teamData;

        if (team) {
          /* -----------------------------------------------------
             5. Load team members
          ----------------------------------------------------- */
          const { data: memberRows, error: memberRowsError } =
            await supabase
              .from('team_members')
              .select(
                  `
                  id,
                  team_id,
                  student_id,
                  created_at
                  `
                )
                .eq('team_id', team.id)
                .order('created_at', { ascending: true });
          if (memberRowsError) throw memberRowsError;

          const memberStudentIds =
            (memberRows ?? []).map((row) => row.student_id);

          if (memberStudentIds.length > 0) {
            const { data: studentRows, error: studentRowsError } =
              await supabase
                .from('students')
                .select(
                  `
                  id,
                  profile_id,
                  name,
                  usn,
                  email,
                  phone,
                  branch,
                  year,
                  semester,
                  section,
                  campus
                `
                )
                .in('id', memberStudentIds);

            if (studentRowsError) throw studentRowsError;

            const studentMap = new Map(
              (studentRows ?? []).map((row) => [row.id, row as StudentRow])
            );

            members = (memberRows ?? [])
              .map((row) => studentMap.get(row.student_id))
              .filter(Boolean) as StudentRow[];
          }

          /* -----------------------------------------------------
             6. Load assigned faculty
          ----------------------------------------------------- */
          const { data: assignmentRows, error: assignmentError } =
            await supabase
              .from('faculty_assignments')
              .select('id, team_id, faculty_id, assigned_at')
              .eq('team_id', team.id)
              .order('assigned_at', { ascending: false })
              .limit(1);

          if (assignmentError) throw assignmentError;

          // The allocation screen can retain historical/repeated assignment
          // rows. Select the most recent assignment instead of failing
          // maybeSingle() and leaving the student dashboard without a mentor.
          const assignment = assignmentRows?.[0] ?? null;

          if (assignment) {
            const { data: facultyData, error: facultyError } =
              await supabase
                .from('faculty')
                .select(
                  `
                  id,
                  name,
                  email,
                  phone,
                  designation,
                  department,
                  active
                `
                )
                .eq('id', assignment.faculty_id)
                .maybeSingle();

            if (facultyError) throw facultyError;

            faculty = facultyData;

            // Load the Phase 1 form configured for this team's assigned faculty.
            const { data: phase1Config, error: phase1ConfigError } = await supabase
              .from('phase_submission_configs')
              .select('form_url,is_visible,is_accepting_submissions')
              .eq('phase_number', 1)
              .eq('faculty_id', assignment.faculty_id)
              .eq('is_visible', true)
              .maybeSingle();
            if (phase1ConfigError) throw phase1ConfigError;
            if (phase1Config?.is_visible && phase1Config.form_url) {
              phase1FormUrl = phase1Config.form_url;
              phase1Accepting = Boolean(phase1Config.is_accepting_submissions);
            }
          }

          /* -----------------------------------------------------
             7. Load team submission
          ----------------------------------------------------- */
          const { data: submissionData, error: submissionError } =
            await supabase
              .from('submissions')
              .select(
                `
                id,
                team_id,
                storage_path,
                file_name,
                file_type,
                file_size,
                submitted_at,
                submitted_by,
                status
              `
              )
              .eq('team_id', team.id)
              .maybeSingle();

          if (submissionError) throw submissionError;

          submission = submissionData;
        }
      }

      /* ---------------------------------------------------------
         8. Load public phases
      --------------------------------------------------------- */
      const { data: phasesData, error: phasesError } = await supabase
        .from('phases')
        .select(
          `
          id,
          name,
          slug,
          start_date,
          end_date,
          focus,
          description,
          campus_info,
          status,
          sort_order,
          public_visible
        `
        )
        .eq('public_visible', true)
        .neq('status', 'hidden')
        .order('sort_order', { ascending: true });

      if (phasesError) throw phasesError;

      setData({
        student: student as StudentRow,
        team,
        members,
        faculty,
        submission,
        phase1FormUrl,
        phase1Accepting,
        phases: (phasesData ?? []) as PhaseRow[],
      });
    } catch (err) {
      console.error('Student dashboard load error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  void loadDashboard();

  const client = supabase;

  if (!isSupabaseConfigured || !client) return;

  const refreshVisiblePhases = async () => {
    const { data: phaseRows, error: phaseError } = await client
      .from('phases')
      .select('id, name, slug, start_date, end_date, focus, description, campus_info, status, sort_order, public_visible')
      .eq('public_visible', true)
      .neq('status', 'hidden')
      .order('sort_order', { ascending: true });

      if (phaseError) {
        console.error('Student phase timeline refresh error:', phaseError);
        return;
      }

      setData((current) => current
        ? { ...current, phases: (phaseRows ?? []) as PhaseRow[] }
        : current);
    };

  const channel = client
  .channel('student-dashboard-phase-sync')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'phases',
    },
    () => {
      void refreshVisiblePhases();
    }
  )
  .subscribe();

return () => {
  void client.removeChannel(channel);
};
  }, []);

  const phaseCards = useMemo(() => {
    return data?.phases ?? [];
  }, [data?.phases]);

  /* -------------------------------------------------------------
     Loading
  ------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#121A23] border border-white/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#36D9FF] animate-spin" />
          </div>

          <div className="text-center">
            <p className="font-mono text-xs text-[#36D9FF] font-bold">
              LOADING LEADER DESK
            </p>
            <p className="text-xs text-[#8B96A5] mt-1">
              Synchronizing with NIErnaya control system...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     Error
  ------------------------------------------------------------- */
  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full p-6 rounded-3xl bg-[#0D1219] border border-red-500/20 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>

          <h2 className="font-display font-bold text-xl text-white">
            Dashboard Unavailable
          </h2>

          <p className="text-sm text-[#8B96A5] mt-2 leading-relaxed">
            {error || 'Unable to load your student dashboard.'}
          </p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-6 px-5 py-2.5 rounded-xl bg-[#FF7A30] text-[#07090D] font-mono text-xs font-bold hover:bg-[#FF8C4B] transition-all"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  const {
    student,
    team,
    members,
    faculty,
    submission,
    phase1FormUrl,
    phase1Accepting,
  } = data;

  return (
    <div className="space-y-8">
      {team && phase1FormUrl && (
        <section className="rounded-2xl border border-[#FF7A30]/30 bg-[#0D1219] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono font-bold tracking-[0.18em] text-[#FF7A30]">PHASE 1 · DATA HUNT</div>
              <h2 className="mt-2 text-xl font-black text-white">Dataset Submission Form</h2>
              <p className="mt-1 text-sm text-[#8B96A5]">Use the form provided for your team’s assigned faculty member.</p>
              <p className={`mt-2 text-xs font-bold ${phase1Accepting ? 'text-emerald-300' : 'text-amber-300'}`}>{phase1Accepting ? 'Website status: submissions marked open' : 'Website status: submissions not marked open'}</p>
            </div>
            <a href={phase1FormUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF7A30] px-5 py-3 text-sm font-bold text-[#07090D] hover:bg-[#FF8C4B]">Open Phase 1 Form <ExternalLink className="w-4 h-4" /></a>
          </div>
          <p className="mt-3 text-[11px] text-[#8B96A5]">The form may be unavailable if the organizer has closed responses in Google Forms, regardless of this website status.</p>
        </section>
      )}
      {/* =========================================================
          TOP WELCOME BANNER
      ========================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#36D9FF]/10 text-[#36D9FF] font-mono text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#36D9FF] animate-ping" />
            <span>LEADER DESK ACTIVATED</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-4xl text-white">
            Welcome, {team ? student.name : student.name || 'Team Leader'}
          </h1>

          <p className="text-xs sm:text-sm text-[#8B96A5]">
            {team
              ? `Managing Squad "${team.team_name}" [${team.team_code}]`
              : 'Complete your team squad registration below to enter the arena.'}
          </p>
        </div>

        {team ? (
          <div className="p-4 rounded-2xl bg-[#121A23] border border-white/10 text-right shrink-0 font-mono">
            <div className="text-[10px] text-[#8B96A5]">
              ASSIGNED TEAM ID
            </div>

            <div className="font-display font-black text-2xl text-[#FF7A30]">
              {team.team_code}
            </div>

            <div
              className={`text-[11px] font-bold ${
                team.registration_status === 'locked'
                  ? 'text-[#10B981]'
                  : team.registration_status === 'submitted'
                    ? 'text-[#36D9FF]'
                    : 'text-[#F59E0B]'
              }`}
            >
              ● {formatStatus(team.registration_status)}
            </div>
          </div>
        ) : (
          <Link
            to="/student/team"
            className="px-6 py-3 rounded-full bg-[#FF7A30] text-[#07090D] font-mono text-xs font-bold hover:bg-[#FF8C4B] active:scale-95 transition-all text-center shrink-0"
          >
            CREATE SQUAD REGISTRATION
          </Link>
        )}
      </div>

      {/* =========================================================
          TEAM AREA
      ========================================================= */}
      {team ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* -----------------------------------------------------
              Squad Details
          ----------------------------------------------------- */}
          <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[#8B96A5]">
                  SQUAD DETAILS
                </span>

                <Users className="w-4 h-4 text-[#36D9FF]" />
              </div>

              <h3 className="font-display font-bold text-xl text-white mb-2">
                {team.team_name}
              </h3>

              <div className="space-y-1 text-xs text-[#8B96A5] font-mono">
                <div>
                  Campus:{' '}
                  <strong className="text-white">
                    {team.campus} Campus
                  </strong>
                </div>

                <div>
                  Mode:{' '}
                  <strong className="text-white">Offline</strong>
                </div>

                <div>
                  Members:{' '}
                  <strong className="text-white">
                    {members.length} Students
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <Link
                to="/student/team"
                className="text-xs font-mono text-[#FF7A30] hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>View Full Roster</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#8B96A5]">
                {formatStatus(team.registration_status)}
              </span>
            </div>
          </div>

          {/* -----------------------------------------------------
              Assigned Faculty
          ----------------------------------------------------- */}
          <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[#8B96A5]">
                  FACULTY MENTOR / JURY
                </span>

                <Building className="w-4 h-4 text-[#8B5CF6]" />
              </div>

              <h3 className="font-display font-bold text-xl text-white mb-2">
                {faculty?.name || 'Allocation In Progress'}
              </h3>

              <p className="text-xs text-[#8B96A5] leading-relaxed">
                {faculty
                  ? faculty.designation
                    ? `${faculty.designation}${
                        faculty.department
                          ? ` • ${faculty.department}`
                          : ''
                      }`
                    : 'Assigned academic jury coordinator from NIE committee.'
                  : 'Balanced faculty allocation takes place following registration closure.'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#8B96A5]">
              <span>STATUS:</span>

              <span
                className={
                  faculty
                    ? 'text-[#10B981] font-bold'
                    : 'text-[#F59E0B]'
                }
              >
                {faculty ? 'ASSIGNED' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* -----------------------------------------------------
              Submission Status
          ----------------------------------------------------- */}
          <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs text-[#8B96A5]">
                  PHASE 1 SUBMISSION
                </span>

                <FileText className="w-4 h-4 text-[#10B981]" />
              </div>

              <h3 className="font-display font-bold text-xl text-white mb-2 break-words">
                {submission ? submission.file_name : 'No File Uploaded'}
              </h3>

              <p className="text-xs text-[#8B96A5]">
                {submission
                  ? `Uploaded on ${new Date(
                      submission.submitted_at
                    ).toLocaleDateString('en-IN')} (${formatSubmissionSize(
                      submission.file_size
                    )} MB)`
                  : 'Upload your initial Problem Formulation deck (.ppt, .pptx, or .pdf).'}
              </p>

              {submission && (
                <div className="mt-3 inline-flex items-center px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-[#36D9FF]">
                  {formatStatus(submission.status)}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <Link
                to="/student/submission"
                className="text-xs font-mono text-[#36D9FF] hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>
                  {submission ? 'Manage Artifact' : 'Upload Submission'}
                </span>

                <ArrowRight className="w-3 h-3" />
              </Link>

              <span className="text-[10px] font-mono text-[#8B96A5]">
                MAX 20MB
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================
           NO TEAM STATE
        ========================================================= */
        <div className="p-8 rounded-2xl bg-[#0D1219] border-2 border-dashed border-[#FF7A30]/40 text-center space-y-4">
          <Users className="w-12 h-12 mx-auto text-[#FF7A30]" />

          <h2 className="font-display font-black text-2xl text-white">
            No Team Registered Yet
          </h2>

          <p className="text-xs text-[#8B96A5] max-w-md mx-auto">
            You must register your squad of 2 to 3 NIE 2nd Year students to
            activate phase access and submit artifacts.
          </p>

          <Link
            to="/student/team"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF7A30] text-[#07090D] font-mono text-xs font-bold hover:bg-[#FF8C4B] transition-all"
          >
            <span>START TEAM REGISTRATION</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* =========================================================
          PHASE ROADMAP
      ========================================================= */}
      <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display font-bold text-lg text-white">
            NIErnaya Phase Progression
          </h3>

          <span className="text-[10px] font-mono text-[#8B96A5]">
            LIVE EVENT ROADMAP
          </span>
        </div>

        {phaseCards.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#121A23] border border-white/5 text-center">
            <p className="text-xs text-[#8B96A5]">
              Phase information is currently being configured by the
              administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {phaseCards.map((phase, idx) => (
              <div
                key={phase.id}
                className="p-4 rounded-xl bg-[#121A23] border border-white/5 space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold text-[#FF7A30]">
                    {String(idx + 1).padStart(2, '0')} /{' '}
                    {phase.name}
                  </span>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                      phase.status === 'active'
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : phase.status === 'completed'
                          ? 'bg-[#36D9FF]/10 text-[#36D9FF]'
                          : 'bg-white/5 text-[#8B96A5]'
                    }`}
                  >
                    {phase.status}
                  </span>
                </div>

                <h4 className="font-display font-bold text-sm text-white">
                  {phase.focus}
                </h4>

                <p className="text-xs text-[#8B96A5]">
                  {formatPhaseDates(
                    phase.start_date,
                    phase.end_date
                  )}
                </p>

                {phase.campus_info && (
                  <p className="text-[10px] text-[#8B96A5] font-mono">
                    {phase.campus_info}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};