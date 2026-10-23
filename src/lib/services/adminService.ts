/**
 * NIErnaya — Centralized Admin Control Room Supabase Service Layer
 *
 * Architecture:
 * Admin UI
 *    ↓
 * adminService
 *    ↓
 * Supabase Client
 *    ↓
 * RLS / Security-Definer RPC / Storage
 *
 * Important:
 * - Never uses the Supabase service_role key.
 * - Runs entirely inside the authenticated browser session.
 * - Sensitive operations prefer database RPCs.
 * - UI-facing models are normalized here.
 */

import {
  supabase,
  isSupabaseConfigured,
} from '../supabase/client';

import type {
  Team,
  TeamMember,
  Student,
  Faculty,
  Submission,
  Phase,
  TimelineEvent,
  RuleItem,
  PrizeItem,
  FAQItem,
  OrganizerMember,
  Announcement,
  HackathonResult,
  AuditLog,
  LiveStats,
  ContactConfig,
  PhaseStatus,
  CampusType,
  ParticipationMode,
  RegistrationStatus,
} from '../../types';

// ============================================================
// SERVICE RESULT
// ============================================================

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

function successResult<T>(
  data: T
): ServiceResult<T> {
  return {
    data,
    error: null,
  };
}

function errorResult<T>(
  err: unknown,
  fallbackMessage = 'An unexpected error occurred in Admin Service'
): ServiceResult<T> {
  if (err instanceof Error) {
    return {
      data: null,
      error: err,
    };
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err
  ) {
    return {
      data: null,
      error: new Error(
        String(
          (err as { message: unknown }).message
        )
      ),
    };
  }

  return {
    data: null,
    error: new Error(
      typeof err === 'string'
        ? err
        : fallbackMessage
    ),
  };
}

function getClient() {
  if (
    !isSupabaseConfigured ||
    !supabase
  ) {
    throw new Error(
      'Supabase is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured in .env'
    );
  }

  return supabase;
}

// ============================================================
// CONSTANTS
// ============================================================

const SUBMISSION_BUCKET =
  'drushtix-submissions';

// ============================================================
// MAPPING HELPERS
// ============================================================

function mapDbTeamToUiTeam(
  raw: any
): Team {
  const leaderStudent =
    raw?.leader ||
    raw?.students ||
    null;

  const assignments =
    Array.isArray(
      raw?.faculty_assignments
    )
      ? raw.faculty_assignments
      : [];

  const primaryAssignment =
    assignments[0] || null;

  const assignedFaculty =
    primaryAssignment?.faculty ||
    null;

  const members: TeamMember[] =
    Array.isArray(raw?.team_members)
      ? raw.team_members.map(
          (tm: any) => {
            const student =
              tm?.student ||
              tm?.students ||
              {};

            return {
              id:
                tm?.id ||
                tm?.student_id,

              team_id:
                tm?.team_id ||
                raw?.id,

              name:
                student?.name ||
                tm?.name ||
                '',

              usn:
                student?.usn ||
                tm?.usn ||
                '',

              email:
                student?.email ||
                tm?.email ||
                '',

              phone:
                student?.phone ||
                tm?.phone ||
                '',

              branch:
                student?.branch ||
                tm?.branch ||
                '',

              year:
                student?.year ||
                tm?.year ||
                '2nd Year',

              section:
                student?.section ||
                tm?.section ||
                '',

              campus:
                (student?.campus ||
                  tm?.campus ||
                  raw?.campus ||
                  'North') as CampusType,

              role:
                (tm?.role ||
                  'member') as
                  | 'leader'
                  | 'member',

              created_at:
                tm?.created_at ||
                raw?.created_at ||
                new Date().toISOString(),
            };
          }
        )
      : [];

  const leaderFromMembers =
    members.find(
      member =>
        member.role === 'leader'
    );

  return {
    id: raw?.id,

    team_code:
      raw?.team_code ||
      'DAV26-000',

    team_name:
      raw?.team_name ||
      'Squad',

    leader_student_id:
      raw?.leader_student_id ||
      '',

    leader_name:
      leaderStudent?.name ||
      raw?.leader_name ||
      leaderFromMembers?.name ||
      '',

    leader_email:
      leaderStudent?.email ||
      raw?.leader_email ||
      leaderFromMembers?.email ||
      '',

    leader_phone:
      leaderStudent?.phone ||
      raw?.leader_phone ||
      leaderFromMembers?.phone ||
      '',

    mode:
      (raw?.mode ||
        'Offline') as ParticipationMode,

    campus:
      (raw?.campus ||
        'North') as CampusType,

    registration_status:
      (raw?.registration_status ||
        'submitted') as RegistrationStatus,

    locked_at:
      raw?.locked_at ||
      undefined,

    created_at:
      raw?.created_at ||
      new Date().toISOString(),

    members,

    assigned_faculty_id:
      primaryAssignment?.faculty_id ||
      raw?.assigned_faculty_id ||
      undefined,

    assigned_faculty_name:
      assignedFaculty?.name ||
      raw?.assigned_faculty_name ||
      undefined,

    meeting_link:
      raw?.meeting_link ||
      undefined,
  };
}

function mapDbPhaseToUiPhase(
  raw: any
): Phase {
  const dates =
    raw?.dates ||
    (
      raw?.start_date &&
      raw?.end_date
        ? `${raw.start_date} – ${raw.end_date}`
        : raw?.start_date ||
          'TBD'
    );

  return {
    id: raw?.id,

    name:
      raw?.name ||
      '',

    slug:
      raw?.slug ||
      '',

    dates,

    focus:
      raw?.focus ||
      raw?.name ||
      '',

    description:
      raw?.description ||
      '',

    campus_info:
      raw?.campus_info ||
      'North & South Campuses',

    status:
      (raw?.status ||
        'upcoming') as PhaseStatus,

    sort_order:
      typeof raw?.sort_order ===
      'number'
        ? raw.sort_order
        : 0,

    public_visible:
      raw?.public_visible ??
      true,
  };
}

function mapDbResultToUiResult(
  raw: any
): HackathonResult {
  const team =
    raw?.team ||
    raw?.teams ||
    {};

  const leader =
    team?.leader ||
    team?.students ||
    {};

  return {
    id:
      raw?.id,

    team_id:
      raw?.team_id ||
      team?.id ||
      '',

    team_code:
      team?.team_code ||
      raw?.team_code ||
      'DAV26-000',

    team_name:
      team?.team_name ||
      raw?.team_name ||
      'Team',

    position:
      raw?.position ||
      '',

    prize_title:
      raw?.title ||
      raw?.prize_title ||
      '',

    leader_name:
      leader?.name ||
      team?.leader_name ||
      raw?.leader_name ||
      '',

    campus:
      (
        team?.campus ||
        raw?.campus ||
        'North'
      ) as CampusType,

    published:
      raw?.published ??
      false,

    announced_at:
      raw?.announced_at ||
      raw?.created_at ||
      undefined,
  };
}

// ============================================================
// 1. DASHBOARD
// ============================================================

export async function getDashboardStats(): Promise<
  ServiceResult<LiveStats>
> {
  try {
    const client =
      getClient();

    const [
      teamsRes,
      participantsRes,
      offlineRes,
      northRes,
      southRes,
      submissionsRes,
    ] = await Promise.all([
      client
        .from('teams')
        .select('id', {
          count: 'exact',
          head: true,
        }),

      client
        .from('team_members')
        .select('id', {
          count: 'exact',
          head: true,
        }),

      client
        .from('teams')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('mode', 'Offline'),

      client
        .from('teams')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('campus', 'North'),

      client
        .from('teams')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('campus', 'South'),

      client
        .from('submissions')
        .select('id', {
          count: 'exact',
          head: true,
        }),
    ]);

    const firstError =
      teamsRes.error ||
      participantsRes.error ||
      offlineRes.error ||
      northRes.error ||
      southRes.error ||
      submissionsRes.error;

    if (firstError) {
      throw firstError;
    }

    return successResult({
      registered_teams:
        teamsRes.count || 0,

      total_participants:
        participantsRes.count || 0,

      offline_teams:
        offlineRes.count || 0,

      north_campus_teams:
        northRes.count || 0,

      south_campus_teams:
        southRes.count || 0,

      submissions_count:
        submissionsRes.count || 0,
    });
  } catch (err) {
    return errorResult<LiveStats>(
      err
    );
  }
}

// ============================================================
// 2. TEAMS
// ============================================================

export async function getTeams(): Promise<
  ServiceResult<Team[]>
> {
  try {
    const client =
      getClient();

    const { data, error } =
      await client
        .from('teams')
        .select(`
          *,
          leader:students!teams_leader_student_id_fkey(*),
          team_members(*, student:students(*)),
          faculty_assignments(*, faculty(*))
        `)
        .order(
          'created_at',
          {
            ascending: false,
          }
        );

    if (error) {
      const fallback =
        await client
          .from('teams')
          .select(`
            *,
            team_members(*, students(*)),
            faculty_assignments(*, faculty(*))
          `)
          .order(
            'created_at',
            {
              ascending: false,
            }
          );

      if (fallback.error) {
        throw fallback.error;
      }

      return successResult(
        (fallback.data || []).map(
          mapDbTeamToUiTeam
        )
      );
    }

    return successResult(
      (data || []).map(
        mapDbTeamToUiTeam
      )
    );
  } catch (err) {
    return errorResult<Team[]>(
      err
    );
  }
}

export async function getTeamById(
  teamId: string
): Promise<ServiceResult<Team>> {
  try {
    const client =
      getClient();

    const { data, error } =
      await client
        .from('teams')
        .select(`
          *,
          leader:students!teams_leader_student_id_fkey(*),
          team_members(*, student:students(*)),
          faculty_assignments(*, faculty(*))
        `)
        .eq('id', teamId)
        .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        `Team with ID ${teamId} not found`
      );
    }

    return successResult(
      mapDbTeamToUiTeam(data)
    );
  } catch (err) {
    return errorResult<Team>(
      err
    );
  }
}

export async function lockTeam(
  teamId: string
): Promise<
  ServiceResult<{ locked: boolean }>
> {
  try {
    const client =
      getClient();

    const { error } =
      await client.rpc(
        'lock_team_registration',
        {
          p_team_id: teamId,
        }
      );

    if (error) {
      throw error;
    }

    return successResult({
      locked: true,
    });
  } catch (err) {
    return errorResult<{
      locked: boolean;
    }>(err);
  }
}

export async function unlockTeam(
  teamId: string
): Promise<
  ServiceResult<{ locked: boolean }>
> {
  try {
    const client =
      getClient();

    const { error } =
      await client.rpc(
        'admin_unlock_team_registration',
        {
          p_team_id: teamId,
        }
      );

    if (error) {
      throw error;
    }

    return successResult({
      locked: false,
    });
  } catch (err) {
    return errorResult<{
      locked: boolean;
    }>(err);
  }
}

export async function getTeamMembers(
  teamId: string
): Promise<
  ServiceResult<TeamMember[]>
> {
  try {
    const client =
      getClient();

    const { data, error } =
      await client
        .from('team_members')
        .select(`
          *,
          students(*)
        `)
        .eq(
          'team_id',
          teamId
        );

    if (error) {
      throw error;
    }

    const mapped: TeamMember[] =
      (data || []).map(
        (tm: any) => {
          const student =
            tm?.students || {};

          return {
            id:
              tm?.id ||
              tm?.student_id,

            team_id:
              tm?.team_id,

            name:
              student?.name ||
              '',

            usn:
              student?.usn ||
              '',

            email:
              student?.email ||
              '',

            phone:
              student?.phone ||
              '',

            branch:
              student?.branch ||
              '',

            year:
              student?.year ||
              2,

            section:
              student?.section ||
              '',

            campus:
              (
                student?.campus ||
                'North'
              ) as CampusType,

            role:
              (tm?.role ||
                'member') as
                | 'leader'
                | 'member',

            created_at:
              tm?.created_at ||
              new Date().toISOString(),
          };
        }
      );

    return successResult(
      mapped
    );
  } catch (err) {
    return errorResult<
      TeamMember[]
    >(err);
  }
}

// ============================================================
// 3. STUDENTS
// ============================================================

export async function getStudents(): Promise<
  ServiceResult<Student[]>
> {
  try {
    const client =
      getClient();

    const { data, error } =
      await client
        .from('students')
        .select('*')
        .order(
          'name',
          {
            ascending: true,
          }
        );

    if (error) {
      throw error;
    }

    return successResult(
      data as Student[]
    );
  } catch (err) {
    return errorResult<
      Student[]
    >(err);
  }
}

export async function getStudentById(
  studentId: string
): Promise<
  ServiceResult<Student>
> {
  try {
    const client =
      getClient();

    const { data, error } =
      await client
        .from('students')
        .select('*')
        .eq(
          'id',
          studentId
        )
        .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        `Student with ID ${studentId} not found`
      );
    }

    return successResult(
      data as Student
    );
  } catch (err) {
    return errorResult<Student>(
      err
    );
  }
}

// ============================================================
// 4. FACULTY
// ============================================================

export async function getFaculty(): Promise<
  ServiceResult<Faculty[]>
> {
  try {
    const client =
      getClient();

    const { data, error } =
      await client
        .from('faculty')
        .select(`
          *,
          faculty_assignments(count)
        `)
        .order(
          'sort_order',
          {
            ascending: true,
          }
        );

    if (error) {
      throw error;
    }

    const mapped: Faculty[] =
      (data || []).map(
        (faculty: any) => {
          const assignments =
            Array.isArray(
              faculty?.faculty_assignments
            )
              ? faculty.faculty_assignments
              : [];

          const assignedCount =
            assignments.reduce(
              (
                total: number,
                item: any
              ) =>
                total +
                (typeof item?.count ===
                'number'
                  ? item.count
                  : 0),
              0
            );

          return {
            id:
              faculty.id,

            profile_id:
              faculty.profile_id,

            name:
              faculty.name,

            role:
              'Faculty Coordinator',

            email:
              faculty.email,

            phone:
              faculty.phone ||
              '',

            designation:
              faculty.designation,

            department:
              faculty.department,

            active:
              faculty.active ??
              true,

            assigned_count:
              assignedCount,

            photo_url:
              faculty.photo_url,

            order:
              faculty.sort_order ||
              0,
          };
        }
      );

    return successResult(
      mapped
    );
  } catch (err) {
    return errorResult<
      Faculty[]
    >(err);
  }
}

export async function getFacultyById(
  facultyId: string
): Promise<
  ServiceResult<Faculty>
> {
  try {
    const client =
      getClient();

    const { data, error } =
      await client
        .from('faculty')
        .select(`
          *,
          faculty_assignments(count)
        `)
        .eq(
          'id',
          facultyId
        )
        .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        `Faculty with ID ${facultyId} not found`
      );
    }

    const assignments =
      Array.isArray(
        data.faculty_assignments
      )
        ? data.faculty_assignments
        : [];

    const assignedCount =
      assignments.reduce(
        (
          total: number,
          item: any
        ) =>
          total +
          (typeof item?.count ===
          'number'
            ? item.count
            : 0),
        0
      );

    return successResult({
      id: data.id,

      profile_id:
        data.profile_id,

      name:
        data.name,

      role:
        'Faculty Coordinator',

      email:
        data.email,

      phone:
        data.phone || '',

      designation:
        data.designation,

      department:
        data.department,

      active:
        data.active ?? true,

      assigned_count:
        assignedCount,

      photo_url:
        data.photo_url,

      order:
        data.sort_order || 0,
    });
  } catch (err) {
    return errorResult<Faculty>(
      err
    );
  }
}

export async function deactivateFaculty(
  facultyId: string
): Promise<
  ServiceResult<{ success: boolean }>
> {
  try {
    const client =
      getClient();

    const { error } =
      await client
        .from('faculty')
        .update({
          active: false,
        })
        .eq(
          'id',
          facultyId
        );

    if (error) {
      throw error;
    }

    return successResult({
      success: true,
    });
  } catch (err) {
    return errorResult<{
      success: boolean;
    }>(err);
  }
}

export async function activateFaculty(
  facultyId: string
): Promise<
  ServiceResult<{ success: boolean }>
> {
  try {
    const client =
      getClient();

    const { error } =
      await client
        .from('faculty')
        .update({
          active: true,
        })
        .eq(
          'id',
          facultyId
        );

    if (error) {
      throw error;
    }

    return successResult({
      success: true,
    });
  } catch (err) {
    return errorResult<{
      success: boolean;
    }>(err);
  }
}

// ============================================================
// 5. FACULTY ALLOCATION
// ============================================================

export interface AllocationStatusRecord {
  faculty_id: string;
  faculty_name: string;
  assigned_teams_count: number;
  teams: {
    id: string;
    team_code: string;
    team_name: string;
    campus: CampusType;
  }[];
}

export interface AllocationIntegrityResult {
  is_balanced: boolean;
  total_teams: number;
  assigned_teams: number;
  unassigned_teams: number;
  max_difference: number;
  active_faculty_count: number;
}

export async function getAllocationStatus(): Promise<
  ServiceResult<AllocationStatusRecord[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client.rpc(
      'get_allocation_status'
    );

    if (error) {
      throw error;
    }

    return successResult(
      (data || []) as AllocationStatusRecord[]
    );
  } catch (err) {
    return errorResult<
      AllocationStatusRecord[]
    >(err);
  }
}

export async function getAllocationIntegrity(): Promise<
  ServiceResult<AllocationIntegrityResult>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client.rpc(
      'get_allocation_integrity'
    );

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        'Allocation integrity data was not returned'
      );
    }

    return successResult(
      data as AllocationIntegrityResult
    );
  } catch (err) {
    return errorResult<
      AllocationIntegrityResult
    >(err);
  }
}

export async function randomizeFacultyAllocation(): Promise<
  ServiceResult<{
    allocations_count: number;
  }>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client.rpc(
      'randomize_faculty_allocation'
    );

    if (error) {
      throw error;
    }

    return successResult({
      allocations_count:
        typeof data === 'number'
          ? data
          : 0,
    });
  } catch (err) {
    return errorResult<{
      allocations_count: number;
    }>(err);
  }
}

export async function assignFacultyToTeam(
  teamId: string,
  facultyId: string
): Promise<
  ServiceResult<{ success: boolean }>
> {
  try {
    const client =
      getClient();

    const {
      error,
    } = await client.rpc(
      'reassign_team_faculty',
      {
        p_team_id: teamId,
        p_faculty_id: facultyId,
      }
    );

    if (error) {
      throw error;
    }

    return successResult({
      success: true,
    });
  } catch (err) {
    return errorResult<{
      success: boolean;
    }>(err);
  }
}

export async function removeFacultyFromTeam(
  teamId: string
): Promise<
  ServiceResult<{ success: boolean }>
> {
  try {
    const client =
      getClient();

    const {
      error,
    } = await client.rpc(
      'remove_team_faculty_assignment',
      {
        p_team_id: teamId,
      }
    );

    if (error) {
      throw error;
    }

    return successResult({
      success: true,
    });
  } catch (err) {
    return errorResult<{
      success: boolean;
    }>(err);
  }
}

// ============================================================
// 6. SUBMISSIONS
// ============================================================

export async function getSubmissions(): Promise<
  ServiceResult<Submission[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('submissions')
      .select(`
        *,
        teams(
          id,
          team_code,
          team_name
        )
      `)
      .order(
        'submitted_at',
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    const mapped: Submission[] =
      (data || []).map(
        (submission: any) => ({
          id:
            submission.id,

          team_id:
            submission.team_id,

          team_code:
            submission.teams?.team_code ||
            'DAV26-000',

          team_name:
            submission.teams?.team_name ||
            'Team',

          storage_path:
            submission.storage_path,

          file_name:
            submission.file_name,

          file_type:
            submission.file_type,

          file_size:
            Number(
              submission.file_size
            ) || 0,

          submitted_at:
            submission.submitted_at ||
            new Date().toISOString(),

          submitted_by:
            submission.submitted_by ||
            '',

          status:
            submission.status ||
            'submitted',
        })
      );

    return successResult(
      mapped
    );
  } catch (err) {
    return errorResult<
      Submission[]
    >(err);
  }
}

export async function getSubmissionByTeam(
  teamId: string
): Promise<
  ServiceResult<Submission | null>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('submissions')
      .select(`
        *,
        teams(
          id,
          team_code,
          team_name
        )
      `)
      .eq(
        'team_id',
        teamId
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return successResult(null);
    }

    return successResult({
      id:
        data.id,

      team_id:
        data.team_id,

      team_code:
        data.teams?.team_code ||
        'DAV26-000',

      team_name:
        data.teams?.team_name ||
        'Team',

      storage_path:
        data.storage_path,

      file_name:
        data.file_name,

      file_type:
        data.file_type,

      file_size:
        Number(
          data.file_size
        ) || 0,

      submitted_at:
        data.submitted_at ||
        new Date().toISOString(),

      submitted_by:
        data.submitted_by ||
        '',

      status:
        data.status ||
        'submitted',
    });
  } catch (err) {
    return errorResult<
      Submission | null
    >(err);
  }
}

export async function getSubmissionSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<
  ServiceResult<string>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client.storage
      .from(
        SUBMISSION_BUCKET
      )
      .createSignedUrl(
        storagePath,
        expiresInSeconds
      );

    if (error) {
      throw error;
    }

    if (!data?.signedUrl) {
      throw new Error(
        'Failed to generate signed download URL'
      );
    }

    return successResult(
      data.signedUrl
    );
  } catch (err) {
    return errorResult<string>(
      err
    );
  }
}

// ============================================================
// 7. PHASES & TIMELINE
// ============================================================

export async function getPhases(): Promise<
  ServiceResult<Phase[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('phases')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return successResult(
      (data || []).map(
        mapDbPhaseToUiPhase
      )
    );
  } catch (err) {
    return errorResult<Phase[]>(
      err
    );
  }
}

export async function updatePhase(
  id: string,
  updates: Partial<Phase> & {
    start_date?: string;
    end_date?: string;
  }
): Promise<
  ServiceResult<Phase>
> {
  try {
    const client =
      getClient();

    const payload: Record<
      string,
      unknown
    > = {};

    if (
      updates.name !==
      undefined
    ) {
      payload.name =
        updates.name;
    }

    if (
      updates.slug !==
      undefined
    ) {
      payload.slug =
        updates.slug;
    }

    if (
      updates.start_date !==
      undefined
    ) {
      payload.start_date =
        updates.start_date;
    }

    if (
      updates.end_date !==
      undefined
    ) {
      payload.end_date =
        updates.end_date;
    }

    if (
      updates.focus !==
      undefined
    ) {
      payload.focus =
        updates.focus;
    }

    if (
      updates.description !==
      undefined
    ) {
      payload.description =
        updates.description;
    }

    if (
      updates.campus_info !==
      undefined
    ) {
      payload.campus_info =
        updates.campus_info;
    }

    if (
      updates.status !==
      undefined
    ) {
      payload.status =
        updates.status;
    }

    if (
      updates.sort_order !==
      undefined
    ) {
      payload.sort_order =
        updates.sort_order;
    }

    if (
      updates.public_visible !==
      undefined
    ) {
      payload.public_visible =
        updates.public_visible;
    }

    const {
      data,
      error,
    } = await client
      .from('phases')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return successResult(
      mapDbPhaseToUiPhase(data)
    );
  } catch (err) {
    return errorResult<Phase>(
      err
    );
  }
}

export async function getTimeline(): Promise<
  ServiceResult<TimelineEvent[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('timeline_events')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return successResult(
      data as TimelineEvent[]
    );
  } catch (err) {
    return errorResult<
      TimelineEvent[]
    >(err);
  }
}

export async function updateTimelineEvent(
  id: string,
  updates: Partial<TimelineEvent>
): Promise<
  ServiceResult<TimelineEvent>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('timeline_events')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return successResult(
      data as TimelineEvent
    );
  } catch (err) {
    return errorResult<
      TimelineEvent
    >(err);
  }
}

// ============================================================
// 8. CMS
// ============================================================

export async function getAnnouncements(): Promise<
  ServiceResult<Announcement[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('announcements')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    return successResult(
      data as Announcement[]
    );
  } catch (err) {
    return errorResult<
      Announcement[]
    >(err);
  }
}


export async function createAnnouncement(
  announcement: Omit<
    Announcement,
    'id' | 'created_at'
  >
): Promise<ServiceResult<Announcement>> {
  try {
    const client = getClient();

    // Verify that a user session exists before publishing.
    const {
      data: sessionData,
      error: sessionError,
    } = await client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session) {
      throw new Error(
        'No active session found. Please log in again before publishing.'
      );
    }

    const {
      data,
      error,
    } = await client
      .from('announcements')
      .insert({
        title: announcement.title,
        message: announcement.message,
        priority: announcement.priority,
        published: announcement.published ?? true,
        expires_at: announcement.expires_at || null,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return successResult(data as Announcement);
  } catch (err) {
    return errorResult<Announcement>(err);
  }
}

export async function deleteAnnouncement(
  id: string
): Promise<
  ServiceResult<{ success: boolean }>
> {
  try {
    const client =
      getClient();

    const {
      error,
    } = await client
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return successResult({
      success: true,
    });
  } catch (err) {
    return errorResult<{
      success: boolean;
    }>(err);
  }
}

export async function getContactConfig(): Promise<
  ServiceResult<ContactConfig>
> {
  try {
    const client = getClient();

    const { data, error } = await client
      .from('contact_config')
      .select(`
        id,
        email,
        phone,
        address,
        north_campus_venue,
        south_campus_venue,
        whatsapp_community_link,
        working_hours,
        updated_by,
        created_at,
        updated_at
      `)
      .order('updated_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return successResult({
        email: data.email,
        phone: data.phone,
        address: data.address,
        northCampusVenue:
          data.north_campus_venue,
        southCampusVenue:
          data.south_campus_venue,
        whatsappCommunityLink:
          data.whatsapp_community_link,
        workingHours:
          data.working_hours,
      });
    }

    // Safe fallback only if contact_config is empty.
    return successResult({
      email: '',
      phone: '',
      address:
        'The National Institute of Engineering, Manandavadi Road, Mysuru, Karnataka 570008',
      northCampusVenue:
        'NIE North Campus (CSE / AIML Block), Koorgalli, Mysuru',
      southCampusVenue:
        'NIE South Campus (ECE, EEE, ME), Manandavadi Rd, Mysuru',
      whatsappCommunityLink:
        'https://chat.whatsapp.com/JGsWjeav6U47BbcKrxBdyb',
      workingHours:
        '09:00 AM – 05:00 PM IST (MON–SAT)',
    });
  } catch (err) {
    return errorResult<ContactConfig>(err);
  }
}
export async function updateContactConfig(
  config: ContactConfig
): Promise<ServiceResult<ContactConfig>> {
  try {
    const client = getClient();

    const {
      data: existing,
      error: existingError,
    } = await client
      .from('contact_config')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const payload = {
      email: config.email.trim(),
      phone: config.phone.trim(),
      address: config.address?.trim() || null,
      north_campus_venue:
        config.northCampusVenue.trim(),
      south_campus_venue:
        config.southCampusVenue.trim(),
      whatsapp_community_link:
        config.whatsappCommunityLink.trim(),
      working_hours:
        config.workingHours.trim(),
      updated_at: new Date().toISOString(),
    };

    let data;
    let error;

    if (existing?.id) {
      const result = await client
        .from('contact_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      const result = await client
        .from('contact_config')
        .insert(payload)
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    return successResult({
      email: data.email,
      phone: data.phone,
      address: data.address,
      northCampusVenue:
        data.north_campus_venue,
      southCampusVenue:
        data.south_campus_venue,
      whatsappCommunityLink:
        data.whatsapp_community_link,
      workingHours:
        data.working_hours,
    });
  } catch (err) {
    return errorResult<ContactConfig>(err);
  }
}

export async function getSiteContent<T>(
  key: string
): Promise<
  ServiceResult<T | null>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('site_content')
      .select('value')
      .eq(
        'key',
        key
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    return successResult(
      data?.value
        ? (data.value as T)
        : null
    );
  } catch (err) {
    return errorResult<
      T | null
    >(err);
  }
}

export async function updateSiteContent<T>(
  key: string,
  value: T,
  published = true
): Promise<
  ServiceResult<T>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('site_content')
      .upsert(
        {
          key,
          value,
          published,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            'key',
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResult(
      data.value as T
    );
  } catch (err) {
    return errorResult<T>(
      err
    );
  }
}

export async function getFAQs(): Promise<
  ServiceResult<FAQItem[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('faqs')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return successResult(
      data as FAQItem[]
    );
  } catch (err) {
    return errorResult<
      FAQItem[]
    >(err);
  }
}

export async function getRules(): Promise<
  ServiceResult<RuleItem[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('rules')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return successResult(
      data as RuleItem[]
    );
  } catch (err) {
    return errorResult<
      RuleItem[]
    >(err);
  }
}

export async function getPrizes(): Promise<
  ServiceResult<PrizeItem[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('prizes')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return successResult(
      data as PrizeItem[]
    );
  } catch (err) {
    return errorResult<
      PrizeItem[]
    >(err);
  }
}

export async function getOrganizers(): Promise<
  ServiceResult<OrganizerMember[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('organizers')
      .select('*')
      .order(
        'sort_order',
        {
          ascending: true,
        }
      );

    if (error) {
      const fallback =
        await getSiteContent<
          OrganizerMember[]
        >('organizers');

      if (fallback.data) {
        return successResult(
          fallback.data
        );
      }

      throw error;
    }

    return successResult(
      data as OrganizerMember[]
    );
  } catch (err) {
    return errorResult<
      OrganizerMember[]
    >(err);
  }
}

// ============================================================
// 9. RESULTS
// ============================================================

export async function getResults(): Promise<
  ServiceResult<HackathonResult[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client.rpc(
      'get_all_results'
    );

    if (error) {
      throw error;
    }

    return successResult(
      (data || []).map(
        mapDbResultToUiResult
      )
    );
  } catch (err) {
    return errorResult<
      HackathonResult[]
    >(err);
  }
}

export async function getPublishedResults(): Promise<
  ServiceResult<HackathonResult[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client.rpc(
      'get_published_results'
    );

    if (error) {
      throw error;
    }

    return successResult(
      (data || []).map(
        mapDbResultToUiResult
      )
    );
  } catch (err) {
    return errorResult<
      HackathonResult[]
    >(err);
  }
}

export async function getResultEligibleTeams(): Promise<
  ServiceResult<
    {
      id: string;
      team_code: string;
      team_name: string;
      campus: CampusType;
    }[]
  >
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('teams')
      .select(
        'id, team_code, team_name, campus'
      )
      .order(
        'team_code',
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    return successResult(
      data as {
        id: string;
        team_code: string;
        team_name: string;
        campus: CampusType;
      }[]
    );
  } catch (err) {
    return errorResult<
      {
        id: string;
        team_code: string;
        team_name: string;
        campus: CampusType;
      }[]
    >(err);
  }
}

export async function saveResult(
  result: Partial<HackathonResult> & {
    team_id: string;
    position: string;
    prize_title?: string;
    published?: boolean;
  }
): Promise<ServiceResult<HackathonResult>> {
  try {
    const client = getClient();

    // UI position values are strings such as:
    // "1st Place – Winner"
    // "2nd Place"
    // "3rd Place"
    //
    // Database stores position as INTEGER.
    const positionMatch = String(result.position || '').match(/\d+/);
    const position = positionMatch
      ? Number(positionMatch[0])
      : null;

    // The current UI has one "Prize & Honor Title" field.
    // Store that text as honor_title.
    const honorTitle =
      String(result.prize_title || '').trim() || null;

    // Save the result record first.
    const { data: rpcData, error: rpcError } =
      await client.rpc('save_result', {
        p_team_id: result.team_id,
        p_prize_id: null,
        p_position: position,
        p_honor_title: honorTitle
      });

    if (rpcError) {
      throw rpcError;
    }

    if (!rpcData) {
      throw new Error(
        'Result was saved but no result record was returned.'
      );
    }

    // The DB RPC returns the raw results row.
    // Fetch the normalized result through the existing
    // admin RPC so the UI receives team/prize information.
    const {
      data: resultsData,
      error: resultsError
    } = await client.rpc('get_all_results');

    if (resultsError) {
      throw resultsError;
    }

    const matchingResult = Array.isArray(resultsData)
      ? resultsData.find(
          (item: any) =>
            item.result_id === rpcData.id ||
            item.team_id === result.team_id
        )
      : null;

    if (matchingResult) {
      return successResult(
        mapDbResultToUiResult(matchingResult)
      );
    }

    return successResult(
      mapDbResultToUiResult({
        ...rpcData,
        team_id: result.team_id,
        position,
        honor_title: honorTitle
      })
    );
  } catch (err) {
    return errorResult<HackathonResult>(err);
  }
}

export async function publishResult(
  idOrData:
    | string
    | (
        Partial<HackathonResult> & {
          team_id: string;
          position: string;
          prize_title?: string;
        }
      )
): Promise<
  ServiceResult<{ success: boolean }>
> {
  try {
    const client =
      getClient();

    if (
      typeof idOrData ===
      'string'
    ) {
      const {
        error,
      } = await client.rpc(
        'publish_result',
        {
          p_result_id:
            idOrData,
        }
      );

      if (error) {
        throw error;
      }

      return successResult({
        success: true,
      });
    }

    const saved =
      await saveResult({
        ...idOrData,
        published: true,
      });

    if (saved.error) {
      throw saved.error;
    }

    return successResult({
      success: true,
    });
  } catch (err) {
    return errorResult<{
      success: boolean;
    }>(err);
  }
}

export async function unpublishResult(
  id: string
): Promise<
  ServiceResult<{ success: boolean }>
> {
  try {
    const client =
      getClient();

    const {
      error,
    } = await client.rpc(
      'unpublish_result',
      {
        p_result_id: id,
      }
    );

    if (error) {
      throw error;
    }

    return successResult({
      success: true,
    });
  } catch (err) {
    return errorResult<{
      success: boolean;
    }>(err);
  }
}

export async function deleteResult(
  id: string
): Promise<ServiceResult<{ success: boolean }>> {
  try {
    const client = getClient();

    if (!id) {
      throw new Error('Invalid result ID.');
    }

    const { data, error } = await client.rpc(
      'admin_delete_result',
      {
        p_result_id: id,
      }
    );

    if (error) {
      console.error('admin_delete_result RPC error:', error);
      throw error;
    }

    return successResult({
      success: Boolean(data),
    });
  } catch (err) {
    console.error('deleteResult service error:', err);
    return errorResult<{ success: boolean }>(err);
  }
}
// ============================================================
// 10. AUDIT LOGS
// ============================================================

export async function getAuditLogs(): Promise<
  ServiceResult<AuditLog[]>
> {
  try {
    const client =
      getClient();

    const {
      data,
      error,
    } = await client
      .from('audit_logs')
      .select(`
        id,
        actor_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
      `)
      .order(
        'created_at',
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    const mapped: AuditLog[] =
      (data || []).map(
        (log: any) => ({
          id: log.id,
          actor_id:
            log.actor_id ?? null,
          actor:
            log.actor_id ||
            'System',
          action:
            log.action ||
            'ACTION',
          entity_type:
            log.entity_type ||
            'entity',
          entity_id:
            log.entity_id ?? null,
          details:
            log.details ?? null,
          created_at:
            log.created_at ||
            new Date().toISOString(),
        })
      );

    return successResult(
      mapped
    );
  } catch (err) {
    return errorResult<
      AuditLog[]
    >(err);
  }
}

// ============================================================
// CONSOLIDATED SERVICE EXPORT
// ============================================================

export const adminService = {
  // Dashboard
  getDashboardStats,

  // Teams
  getTeams,
  getTeamById,
  lockTeam,
  unlockTeam,
  getTeamMembers,

  // Students
  getStudents,
  getStudentById,

  // Faculty
  getFaculty,
  getFacultyById,
  deactivateFaculty,
  activateFaculty,

  // Allocation
  getAllocationStatus,
  getAllocationIntegrity,
  randomizeFacultyAllocation,
  assignFacultyToTeam,
  removeFacultyFromTeam,

  // Submissions
  getSubmissions,
  getSubmissionByTeam,
  getSubmissionSignedUrl,

  // Phases
  getPhases,
  updatePhase,
  getTimeline,
  updateTimelineEvent,

  // CMS
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getContactConfig,
  updateContactConfig,
  getSiteContent,
  updateSiteContent,
  getFAQs,
  getRules,
  getPrizes,
  getOrganizers,

  // Results
  getResults,
  getPublishedResults,
  getResultEligibleTeams,
  saveResult,
  publishResult,
  unpublishResult,
  deleteResult,

  // Audit
  getAuditLogs,
};

export default adminService;