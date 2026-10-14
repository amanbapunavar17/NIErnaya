import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Lock,
  ArrowRight,
  RefreshCw,
  Loader2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { CampusType, ParticipationMode } from '../../types';

type SelectedSDG = 2 | 3 | 4 | 5 | 13;

const SDG_OPTIONS: Array<{ value: SelectedSDG; title: string; description: string }> = [
  { value: 2, title: 'SDG 2 — Zero Hunger', description: 'Food security, nutrition, and sustainable agriculture.' },
  { value: 3, title: 'SDG 3 — Good Health and Well-being', description: 'Health, prevention, care, and well-being.' },
  { value: 4, title: 'SDG 4 — Quality Education', description: 'Inclusive, equitable, and effective education.' },
  { value: 5, title: 'SDG 5 — Gender Equality', description: 'Equality, safety, opportunity, and inclusion.' },
  { value: 13, title: 'SDG 13 — Climate Action', description: 'Climate resilience, mitigation, and adaptation.' },
];

type StudentProfile = {
  id: string;
  profile_id: string;
  name: string;
  usn: string;
  email: string;
  phone: string | null;
  branch: string;
  year: number;
  semester: number;
  section: string;
  campus: CampusType;
};

type Team = {
  id: string;
  team_code: string;
  team_name: string;
  problem_statement: string | null;
  selected_sdg: SelectedSDG | null;
  leader_student_id: string;
  mode: ParticipationMode;
  campus: CampusType;
  registration_status: 'draft' | 'submitted' | 'locked';
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

type TeamMember = {
  id: string;
  team_id: string;
  student_id: string;
  role: 'leader' | 'member';
  student: StudentProfile;
};

type MemberForm = {
  name: string;
  usn: string;
  email: string;
  phone: string;
  branch: string;
  section: string;
  campus: CampusType;
};

const BRANCHES = [
  {
    value: 'Computer Science & Engineering',
    label: 'Computer Science & Engineering (CSE)',
    campus: 'North' as CampusType,
  },
  {
    value: 'Artificial Intelligence & Machine Learning',
    label: 'Artificial Intelligence & Machine Learning (AIML)',
    campus: 'North' as CampusType,
  },
  {
    value: 'Electronics & Communication Engineering',
    label: 'Electronics & Communication Engineering (ECE)',
    campus: 'South' as CampusType,
  },
  {
    value: 'Electrical & Electronics Engineering',
    label: 'Electrical & Electronics Engineering (EEE)',
    campus: 'South' as CampusType,
  },
  {
    value: 'Mechanical Engineering',
    label: 'Mechanical Engineering (ME)',
    campus: 'South' as CampusType,
  },
  {
    value: 'Civil Engineering',
    label: 'Civil Engineering (CV)',
    campus: 'South' as CampusType,
  },
];

const getCampusForBranch = (branch: string): CampusType => {
  const found = BRANCHES.find((item) => item.value === branch);
  return found?.campus || 'North';
};

const createEmptyMember = (campus: CampusType): MemberForm => ({
  name: '',
  usn: '',
  email: '',
  phone: '',
  branch: 'Computer Science & Engineering',
  section: 'A',
  campus,
});

const friendlyError = (message: string) => {
  const text = message || 'Registration failed. Please try again.';

  if (text.includes('registration_is_open')) {
    return 'Team registration is currently closed.';
  }

  if (text.toLowerCase().includes('registration window')) {
    return text;
  }

  if (text.toLowerCase().includes('already registered')) {
    return 'This student is already part of another team.';
  }

  if (text.toLowerCase().includes('duplicate')) {
    return 'One of the students is already registered in another team.';
  }

  if (text.toLowerCase().includes('team name')) {
    return 'Please choose a valid and unique team name.';
  }

  if (text.toLowerCase().includes('campus')) {
    return 'Please verify that the selected campus matches the students’ branches.';
  }

  if (text.toLowerCase().includes('usn')) {
    return 'Please verify the USNs entered for all team members.';
  }

  if (text.toLowerCase().includes('nie.ac.in')) {
    return 'Only valid NIE email addresses are allowed.';
  }

  return text;
};

export const TeamRegistrationPage: React.FC = () => {
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [existingTeam, setExistingTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [teamName, setTeamName] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [selectedSdg, setSelectedSdg] = useState<SelectedSDG>(2);
  const [campus, setCampus] = useState<CampusType>('North');
  const mode: ParticipationMode = 'Offline';

  const [leaderName, setLeaderName] = useState('');
  const [leaderUsn, setLeaderUsn] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderBranch, setLeaderBranch] = useState(
    'Computer Science & Engineering'
  );
  const [leaderSection, setLeaderSection] = useState('A');

  const [members, setMembers] = useState<MemberForm[]>([
    createEmptyMember('North'),
  ]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLocked = existingTeam?.registration_status === 'locked';
  const hasExistingTeam = Boolean(existingTeam);

  const loadRegistrationData = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured. Check your VITE environment variables.');
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      setUserId(user.id);
      setAuthEmail(user.email?.toLowerCase() || '');

      if (!user.email?.toLowerCase().endsWith('@nie.ac.in')) {
        throw new Error('Only @nie.ac.in accounts can register for NIErnaya.');
      }

      /*
       * ---------------------------------------------------------
       * 1. Find the student's academic profile.
       * ---------------------------------------------------------
       */
      let { data: studentData, error: studentError } = await supabase
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

      /*
       * ---------------------------------------------------------
       * 2. If profile does not exist, the user must complete
       *    their academic profile before registering.
       * ---------------------------------------------------------
       */
      if (studentError) {
        throw studentError;
      }

      if (!studentData) {
        setStudent(null);
        setLeaderEmail(user.email?.toLowerCase() || '');
        setAuthLoading(false);
        return;
      }

      const normalizedStudent = studentData as StudentProfile;

      setStudent(normalizedStudent);

      setLeaderName(normalizedStudent.name || '');
      setLeaderUsn(normalizedStudent.usn || '');
      setLeaderEmail(normalizedStudent.email || user.email?.toLowerCase() || '');
      setLeaderPhone(normalizedStudent.phone || '');
      setLeaderBranch(normalizedStudent.branch || BRANCHES[0].value);
      setLeaderSection(normalizedStudent.section || 'A');
      setCampus(normalizedStudent.campus);

      /*
       * ---------------------------------------------------------
       * 3. Find existing team where this student is leader.
       * ---------------------------------------------------------
       */
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(
          `
            id,
            team_code,
            team_name,
            problem_statement,
            selected_sdg,
            leader_student_id,
            mode,
            campus,
            registration_status,
            locked_at,
            created_at,
            updated_at
          `
        )
        .eq('leader_student_id', normalizedStudent.id)
        .maybeSingle();

      if (teamError) {
        throw teamError;
      }

      setExistingTeam(teamData as Team | null);

      if (teamData) {
        setTeamName(teamData.team_name);
        setProblemStatement(teamData.problem_statement || '');
        setSelectedSdg((teamData.selected_sdg || 2) as SelectedSDG);
        setCampus(teamData.campus);

        /*
         * -------------------------------------------------------
         * 4. Load all team members.
         * -------------------------------------------------------
         */
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select(
            `
              id,
              team_id,
              student_id,
              role,
              students (
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
              )
            `
          )
          .eq('team_id', teamData.id)
          .order('role', { ascending: false });

        if (memberError) {
          throw memberError;
        }

        const normalizedMembers: TeamMember[] = (memberData || [])
          .map((row: any) => ({
            id: row.id,
            team_id: row.team_id,
            student_id: row.student_id,
            role: row.role,
            student: row.students,
          }))
          .filter((row) => row.student);

        setTeamMembers(normalizedMembers);

        const additionalMembers = normalizedMembers
          .filter((member) => member.role === 'member')
          .map((member) => ({
            name: member.student.name,
            usn: member.student.usn,
            email: member.student.email,
            phone: member.student.phone || '',
            branch: member.student.branch,
            section: member.student.section,
            campus: member.student.campus,
          }));

        setMembers(
          additionalMembers.length > 0
            ? additionalMembers
            : [createEmptyMember(teamData.campus)]
        );
      } else {
        setTeamMembers([]);
      }
    } catch (err: any) {
      setError(friendlyError(err?.message));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      setError('Supabase is not configured. Check your .env file.');
      return;
    }

    loadRegistrationData();
  }, [loadRegistrationData]);

  /*
   * -----------------------------------------------------------
   * Student profile creation
   * -----------------------------------------------------------
   */
  const handleCreateStudentProfile = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!supabase || !userId) {
      setError('Authentication session not available.');
      return;
    }

    setError(null);
    setSuccess(null);
    setProfileLoading(true);

    try {
      const cleanEmail = leaderEmail.trim().toLowerCase();

      if (!cleanEmail.endsWith('@nie.ac.in')) {
        throw new Error('Please use your NIE @nie.ac.in email address.');
      }

      if (!leaderName.trim()) {
        throw new Error('Please enter your full name.');
      }

      if (!leaderUsn.trim()) {
        throw new Error('Please enter your USN.');
      }

      if (!leaderPhone.trim()) {
        throw new Error('Please enter your phone number.');
      }

      if (!leaderSection.trim()) {
        throw new Error('Please enter your section.');
      }

      const selectedCampus = getCampusForBranch(leaderBranch);

      if (selectedCampus !== campus) {
        setCampus(selectedCampus);
      }

      const { error: rpcError } = await supabase.rpc(
        'create_student_profile',
        {
          p_name: leaderName.trim(),
          p_usn: leaderUsn.trim().toUpperCase(),
          p_phone: leaderPhone.trim(),
          p_branch: leaderBranch,
          p_year: 2,
          p_semester: 3,
          p_section: leaderSection.trim().toUpperCase(),
          p_campus: selectedCampus,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      setSuccess(
        'Student profile created successfully. You can now register your squad.'
      );

      await loadRegistrationData();
    } catch (err: any) {
      setError(friendlyError(err?.message));
    } finally {
      setProfileLoading(false);
    }
  };

  /*
   * -----------------------------------------------------------
   * Member controls
   * -----------------------------------------------------------
   */
  const addMember = () => {
    if (members.length >= 2) {
      setError('Maximum team size is 3 members: Leader + 2 Members.');
      return;
    }

    setError(null);

    setMembers((current) => [
      ...current,
      createEmptyMember(campus),
    ]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) {
      setError('Minimum team size is 2 members: Leader + 1 Member.');
      return;
    }

    setError(null);

    setMembers((current) => current.filter((_, i) => i !== index));
  };

  const updateMember = (
    index: number,
    field: keyof MemberForm,
    value: string
  ) => {
    setMembers((current) =>
      current.map((member, i) => {
        if (i !== index) return member;

        if (field === 'branch') {
          const nextCampus = getCampusForBranch(value);

          return {
            ...member,
            branch: value,
            campus: nextCampus,
          };
        }

        return {
          ...member,
          [field]: value,
        };
      })
    );
  };

  /*
   * -----------------------------------------------------------
   * Registration validation
   * -----------------------------------------------------------
   */
  const validateRegistration = () => {
    if (!student) {
      return 'Please complete your student profile first.';
    }

    if (!teamName.trim()) {
      return 'Please enter a squad name.';
    }

    if (teamName.trim().length < 2) {
      return 'Squad name must contain at least 2 characters.';
    }

    if (!problemStatement.trim()) {
      return 'Please enter the problem statement your team intends to investigate.';
    }

    if (!SDG_OPTIONS.some((option) => option.value === selectedSdg)) {
      return 'Please select one of the five permitted Sustainable Development Goals.';
    }

    if (members.length < 1 || members.length > 2) {
      return 'A team must contain 2–3 members including the leader.';
    }

    const leaderCampus = getCampusForBranch(leaderBranch);

    if (leaderCampus !== campus) {
      return 'Leader campus does not match the selected branch.';
    }

    const leaderEmailLower = leaderEmail.trim().toLowerCase();

    if (!leaderEmailLower.endsWith('@nie.ac.in')) {
      return 'Leader email must be an @nie.ac.in address.';
    }

    const allUsns = [
      leaderUsn.trim().toUpperCase(),
      ...members.map((member) => member.usn.trim().toUpperCase()),
    ];

    const uniqueUsns = new Set(allUsns);

    if (uniqueUsns.size !== allUsns.length) {
      return 'Duplicate USN detected. Every team member must have a unique USN.';
    }

    const allEmails = [
      leaderEmailLower,
      ...members.map((member) => member.email.trim().toLowerCase()),
    ];

    if (allEmails.some((email) => !email.endsWith('@nie.ac.in'))) {
      return 'Every team member must use an @nie.ac.in email address.';
    }

    const uniqueEmails = new Set(allEmails);

    if (uniqueEmails.size !== allEmails.length) {
      return 'Duplicate email detected. Every team member must have a unique email.';
    }

    for (const [index, member] of members.entries()) {
      if (!member.name.trim()) {
        return `Please enter the name for Member ${index + 2}.`;
      }

      if (!member.usn.trim()) {
        return `Please enter the USN for Member ${index + 2}.`;
      }

      if (!member.email.trim()) {
        return `Please enter the email for Member ${index + 2}.`;
      }

      const expectedCampus = getCampusForBranch(member.branch);

      if (expectedCampus !== member.campus) {
        return `Campus mismatch detected for Member ${index + 2}.`;
      }
    }

    return null;
  };

  /*
   * -----------------------------------------------------------
   * Submit team registration
   * -----------------------------------------------------------
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    if (!student) {
      setError('Please complete your student profile first.');
      return;
    }

    if (existingTeam) {
      setError(
        'This squad is already registered. Team modifications are currently handled through the admin control room.'
      );
      return;
    }

    const validationError = validateRegistration();

    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      /*
       * IMPORTANT:
       * The backend register_team() RPC is the source of truth.
       * It generates the DAV26-XXX team code and performs the
       * one-team / student / campus / registration checks.
       */
      const payload = [
        {
          usn: leaderUsn.trim().toUpperCase(),
          name: leaderName.trim(),
          email: leaderEmail.trim().toLowerCase(),
          phone: leaderPhone.trim(),
          branch: leaderBranch,
          section: leaderSection.trim().toUpperCase(),
          campus,
          role: 'leader',
        },
        ...members.map((member) => ({
          usn: member.usn.trim().toUpperCase(),
          name: member.name.trim(),
          email: member.email.trim().toLowerCase(),
          phone: member.phone.trim(),
          branch: member.branch,
          section: member.section.trim().toUpperCase(),
          campus: member.campus,
          role: 'member',
        })),
      ];

      const { data, error: rpcError } = await supabase.rpc(
        'register_team',
        {
          p_team_name: teamName.trim(),
          p_mode: mode,
          p_campus: campus,
          p_members: payload,
          p_problem_statement: problemStatement.trim(),
          p_selected_sdg: selectedSdg,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      const createdTeam = Array.isArray(data) ? data[0] : data;

      if (!createdTeam?.id) {
        throw new Error(
          'Registration was processed but the team record could not be retrieved.'
        );
      }

      setSuccess(
        `Squad successfully registered! Your Team ID is ${createdTeam.team_code}.`
      );

      await loadRegistrationData();
    } catch (err: any) {
      setError(friendlyError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  /*
   * -----------------------------------------------------------
   * Final lock
   * -----------------------------------------------------------
   */
  const handleLockTeam = async () => {
    if (!supabase || !existingTeam) return;

    const confirmed = window.confirm(
      'Are you sure you want to FINAL LOCK this squad?\n\n' +
        'After locking, the registration cannot be edited by the student. ' +
        'The squad becomes eligible for faculty allocation.'
    );

    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error: rpcError } = await supabase.rpc(
        'lock_team_registration',
        {
          p_team_id: existingTeam.id,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      setSuccess(
        'Team registration successfully locked. The squad is now ready for faculty allocation.'
      );

      await loadRegistrationData();
    } catch (err: any) {
      setError(friendlyError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const leaderCampus = useMemo(
    () => getCampusForBranch(leaderBranch),
    [leaderBranch]
  );

  /*
   * -----------------------------------------------------------
   * Loading state
   * -----------------------------------------------------------
   */
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[420px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#36D9FF] animate-spin" />
          <span className="text-xs font-mono text-[#8B96A5] uppercase tracking-wider">
            Loading registration system...
          </span>
        </div>
      </div>
    );
  }

  /*
   * -----------------------------------------------------------
   * Profile setup screen
   * -----------------------------------------------------------
   */
  if (!student) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#FF7A30] uppercase tracking-wider font-bold mb-1">
            <UserRound className="w-4 h-4" />
            <span>STUDENT PROFILE INITIALIZATION</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Complete Your NIE Student Profile
          </h1>

          <p className="mt-2 text-sm text-[#8B96A5]">
            Your authenticated NIE account has been verified. Complete your
            academic profile once before registering your squad.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form
          onSubmit={handleCreateStudentProfile}
          className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#36D9FF]/10 border border-[#36D9FF]/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#36D9FF]" />
            </div>

            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Account Verification
              </h2>

              <p className="text-xs text-[#8B96A5] font-mono">
                {authEmail}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                FULL NAME
              </label>

              <input
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                USN
              </label>

              <input
                value={leaderUsn}
                onChange={(e) =>
                  setLeaderUsn(e.target.value.toUpperCase())
                }
                required
                placeholder="4NI24CS001"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                NIE EMAIL
              </label>

              <input
                type="email"
                value={leaderEmail}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23]/60 border border-white/10 text-[#8B96A5] text-sm font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                PHONE NUMBER
              </label>

              <input
                type="tel"
                value={leaderPhone}
                onChange={(e) => setLeaderPhone(e.target.value)}
                required
                placeholder="+91 98450 00000"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                BRANCH / DEPARTMENT
              </label>

              <select
                value={leaderBranch}
                onChange={(e) => {
                  const nextBranch = e.target.value;
                  setLeaderBranch(nextBranch);
                  setCampus(getCampusForBranch(nextBranch));
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono"
              >
                {BRANCHES.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                SECTION
              </label>

              <input
                value={leaderSection}
                onChange={(e) =>
                  setLeaderSection(e.target.value.toUpperCase())
                }
                required
                placeholder="A"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono uppercase"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#36D9FF]/5 border border-[#36D9FF]/20">
            <p className="text-xs font-mono text-[#8B96A5] leading-relaxed">
              <span className="text-[#36D9FF] font-bold">
                ELIGIBILITY:
              </span>{' '}
              NIErnaya is currently configured for 2nd Year / 3rd Semester
              NIE students.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-xl hover:shadow-[#FF7A30]/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>CREATING PROFILE...</span>
                </>
              ) : (
                <>
                  <span>CREATE STUDENT PROFILE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  /*
   * -----------------------------------------------------------
   * Main registration UI
   * -----------------------------------------------------------
   */
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#FF7A30] uppercase tracking-wider font-bold mb-1">
            <Users className="w-4 h-4" />
            <span>SQUAD REGISTRATION ENGINE</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            {existingTeam
              ? `Manage Squad: ${existingTeam.team_name}`
              : 'Register New Data Detective Challenge Squad'}
          </h1>

          <p className="text-xs text-[#8B96A5] font-mono mt-2">
            AUTHENTICATED LEADER:{' '}
            <span className="text-[#36D9FF]">{student.email}</span>
          </p>
        </div>

        {existingTeam && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-[#8B96A5]">
              STATUS:{' '}
              <strong
                className={
                  isLocked
                    ? 'text-green-400'
                    : 'text-[#36D9FF]'
                }
              >
                {existingTeam.registration_status.toUpperCase()}
              </strong>
            </span>

            {!isLocked && (
              <button
                type="button"
                onClick={handleLockTeam}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>FINAL LOCK-IN</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {isLocked && (
        <div className="p-4 rounded-xl bg-[#121A23] border border-[#36D9FF]/30 text-[#36D9FF] text-xs font-mono flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />

          <span>
            This team registration is officially LOCKED. Member lists and
            participation parameters cannot be modified by the student.
          </span>
        </div>
      )}

      {/* Existing team read-only notice */}
      {hasExistingTeam && !isLocked && (
        <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-300 text-xs font-mono">
          Registration has already been submitted. The database currently
          treats submitted registrations as fixed until an administrator makes
          an override.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1 */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FF7A30] text-[#07090D] flex items-center justify-center text-xs font-mono font-bold">
              1
            </span>

            <span>Squad Identity & Parameters</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                TEAM SQUAD NAME
              </label>

              <input
                type="text"
                disabled={hasExistingTeam || isLocked}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. CyberVanguard, NeuralNodes"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/40 text-sm focus:outline-none focus:border-[#36D9FF] font-mono disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                PRIMARY CAMPUS
              </label>

              <select
                disabled
                value={campus}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm font-mono disabled:opacity-70"
              >
                <option value="North">
                  North Campus (CSE, AIML)
                </option>

                <option value="South">
                  South Campus (ECE, EEE, ME, CV)
                </option>
              </select>

              <p className="text-[10px] text-[#8B96A5] font-mono">
                Determined from the leader's branch.
              </p>
            </div>


          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-[#121A23]/60 px-4 py-3">
            <p className="text-[10px] font-mono font-bold text-[#8B96A5]">YEAR</p>
            <p className="mt-1 text-sm font-mono font-bold text-white">2nd Year</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#121A23]/60 px-4 py-3">
            <p className="text-[10px] font-mono font-bold text-[#8B96A5]">SEMESTER</p>
            <p className="mt-1 text-sm font-mono font-bold text-white">3rd Semester</p>
          </div>
        </div>

        {/* Phase 1: Problem Statement & SDG */}

        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6">
          <div>
            <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#36D9FF]">PHASE 1</p>
            <h2 className="mt-1 font-display font-bold text-lg text-white">Problem Statement & SDG</h2>
            <p className="mt-1 text-xs leading-5 text-[#8B96A5]">
              Select one permitted SDG and describe the real-world problem your team intends to investigate.
            </p>
          </div>

          <div>
            <label className="text-xs font-mono text-[#8B96A5] font-bold">PROBLEM STATEMENT</label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              disabled={hasExistingTeam || isLocked}
              required
              minLength={20}
              rows={5}
              placeholder="Describe the problem, its societal need in India, and the data challenge you intend to investigate..."
              className="w-full mt-2 px-4 py-3 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/40 text-sm font-mono focus:outline-none focus:border-[#36D9FF] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-[#8B96A5] font-bold">SELECT ONE SDG</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {SDG_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    selectedSdg === option.value
                      ? 'border-[#36D9FF]/60 bg-[#36D9FF]/10'
                      : 'border-white/10 bg-[#121A23] hover:border-white/20'
                  } ${hasExistingTeam || isLocked ? 'cursor-default opacity-70' : ''}`}
                >
                  <input
                    type="radio"
                    name="selected-sdg"
                    value={option.value}
                    checked={selectedSdg === option.value}
                    onChange={() => setSelectedSdg(option.value)}
                    disabled={hasExistingTeam || isLocked}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selectedSdg === option.value ? 'border-[#36D9FF] bg-[#36D9FF]' : 'border-white/20'
                    }`}>
                      {selectedSdg === option.value && <span className="h-2 w-2 rounded-full bg-[#07090D]" />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-white">{option.title}</span>
                      <span className="mt-1 block text-[10px] leading-4 text-[#8B96A5]">{option.description}</span>
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-mono text-[#8B96A5]">
              Phase 1 also gives priority to datasets encountering real-time challenges. These criteria must be satisfied to clear Phase 1.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#36D9FF] text-[#07090D] flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>

              <span>Team Leader Details</span>
            </h2>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#36D9FF]/20 text-[#36D9FF]">
              AUTHENTICATED LEADER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                FULL NAME
              </label>

              <input
                type="text"
                disabled
                value={leaderName}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23]/60 border border-white/10 text-[#8B96A5] text-sm font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                USN
              </label>

              <input
                type="text"
                disabled
                value={leaderUsn}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23]/60 border border-white/10 text-[#8B96A5] text-sm font-mono cursor-not-allowed uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                NIE EMAIL
              </label>

              <input
                type="email"
                disabled
                value={leaderEmail}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23]/60 border border-white/10 text-[#8B96A5] text-sm font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                PHONE NUMBER
              </label>

              <input
                type="tel"
                disabled
                value={leaderPhone}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23]/60 border border-white/10 text-[#8B96A5] text-sm font-mono cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                BRANCH / DEPARTMENT
              </label>

              <select
                disabled
                value={leaderBranch}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23]/60 border border-white/10 text-[#8B96A5] text-sm font-mono cursor-not-allowed"
              >
                {BRANCHES.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-[#8B96A5] font-bold">
                SECTION
              </label>

              <input
                type="text"
                disabled
                value={leaderSection}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121A23]/60 border border-white/10 text-[#8B96A5] text-sm font-mono cursor-not-allowed uppercase"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#36D9FF]/5 border border-[#36D9FF]/10 text-[10px] font-mono text-[#8B96A5]">
            CAMPUS RESOLUTION:{' '}
            <span className="text-[#36D9FF] font-bold">
              {leaderCampus} CAMPUS
            </span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-mono font-bold">
                3
              </span>

              <span>Squad Members</span>
            </h2>

            {!hasExistingTeam && !isLocked && members.length < 2 && (
              <button
                type="button"
                onClick={addMember}
                className="px-3 py-1.5 rounded-lg bg-[#FF7A30]/20 border border-[#FF7A30]/40 text-[#FF7A30] hover:bg-[#FF7A30]/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member 3</span>
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-[#8B96A5]">
            TEAM SIZE:{' '}
            <span className="text-white font-bold">
              {members.length + 1}
            </span>{' '}
            / 3
          </div>

          <div className="space-y-6">
            {members.map((member, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#121A23] border border-white/5 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#FF7A30]">
                    MEMBER 0{idx + 2} DETAILS
                  </span>

                  {!hasExistingTeam &&
                    !isLocked &&
                    members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8B96A5]">
                      NAME
                    </label>

                    <input
                      type="text"
                      disabled={hasExistingTeam || isLocked}
                      value={member.name}
                      onChange={(e) =>
                        updateMember(idx, 'name', e.target.value)
                      }
                      placeholder="Student Name"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8B96A5]">
                      USN
                    </label>

                    <input
                      type="text"
                      disabled={hasExistingTeam || isLocked}
                      value={member.usn}
                      onChange={(e) =>
                        updateMember(
                          idx,
                          'usn',
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="4NI24CS002"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono uppercase disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8B96A5]">
                      NIE EMAIL
                    </label>

                    <input
                      type="email"
                      disabled={hasExistingTeam || isLocked}
                      value={member.email}
                      onChange={(e) =>
                        updateMember(
                          idx,
                          'email',
                          e.target.value.toLowerCase()
                        )
                      }
                      placeholder="member@nie.ac.in"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8B96A5]">
                      PHONE
                    </label>

                    <input
                      type="tel"
                      disabled={hasExistingTeam || isLocked}
                      value={member.phone}
                      onChange={(e) =>
                        updateMember(idx, 'phone', e.target.value)
                      }
                      placeholder="+91..."
                      className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8B96A5]">
                      BRANCH
                    </label>

                    <select
                      disabled={hasExistingTeam || isLocked}
                      value={member.branch}
                      onChange={(e) =>
                        updateMember(idx, 'branch', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono disabled:opacity-50"
                    >
                      {BRANCHES.map((branch) => (
                        <option
                          key={branch.value}
                          value={branch.value}
                        >
                          {branch.value
                            .replace(' & Engineering', '')
                            .replace('Engineering', '')
                            .replace('Artificial Intelligence & Machine Learning', 'AIML')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8B96A5]">
                      SECTION
                    </label>

                    <input
                      type="text"
                      disabled={hasExistingTeam || isLocked}
                      value={member.section}
                      onChange={(e) =>
                        updateMember(
                          idx,
                          'section',
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="A / B"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono uppercase disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 md:col-span-3">
                    <label className="text-[10px] font-mono text-[#8B96A5]">
                      CAMPUS
                    </label>

                    <select
                      disabled
                      value={member.campus}
                      className="w-full px-3 py-2 rounded-lg bg-[#07090D]/60 border border-white/10 text-[#8B96A5] text-xs font-mono"
                    >
                      <option value="North">
                        North Campus
                      </option>

                      <option value="South">
                        South Campus
                      </option>
                    </select>

                    <p className="text-[9px] text-[#8B96A5] font-mono">
                      Automatically determined from branch.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        {!hasExistingTeam && !isLocked && (
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-xl hover:shadow-[#FF7A30]/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>REGISTERING...</span>
                </>
              ) : (
                <>
                  <span>SUBMIT SQUAD REGISTRATION</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {existingTeam && (
          <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono text-[#8B96A5] uppercase">
                  Registered Team ID
                </p>

                <p className="text-2xl font-display font-black text-[#36D9FF]">
                  {existingTeam.team_code}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[10px] font-mono text-[#8B96A5] uppercase">
                  Squad Members
                </p>

                <p className="text-sm font-mono text-white">
                  {teamMembers.length} registered
                </p>
              </div>

              {isLocked && (
                <div className="flex items-center gap-2 text-green-400 text-xs font-mono">
                  <CheckCircle className="w-4 h-4" />
                  LOCKED
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Refresh */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={loadRegistrationData}
          disabled={authLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[#8B96A5] hover:text-white hover:border-white/20 text-xs font-mono transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              authLoading ? 'animate-spin' : ''
            }`}
          />
          REFRESH REGISTRATION STATUS
        </button>
      </div>
    </div>
  );
};