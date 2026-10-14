import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================

type StudentRow = {
  id: string;
  name: string;
  usn: string;
  email: string;
  phone: string | null;
  branch: string | null;
  year: number;
  semester: number;
  section: string | null;
  campus: 'North' | 'South';
};

type TeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  mode: 'Offline';
  campus: 'North' | 'South';
  registration_status: 'draft' | 'submitted' | 'locked';
};

type TeamMemberRow = {
  id: string;
  team_id: string;
  student_id: string;
  role: 'leader' | 'member';
};

type StudentView = StudentRow & {
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
  team_mode: 'Offline' | null;
  team_status:
    | 'draft'
    | 'submitted'
    | 'locked'
    | null;
  role: 'leader' | 'member' | 'unassigned';
};

// ============================================================
// COMPONENT
// ============================================================

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentView[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampus, setFilterCampus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // LOAD STUDENT ROSTER
  // ==========================================================

  const loadStudents = useCallback(
    async (showRefreshState = false) => {
      if (!isSupabaseConfigured || !supabase) {
        setError(
          'Supabase is not configured. Check your environment variables.'
        );
        setLoading(false);
        return;
      }

      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        // ------------------------------------------------------
        // Fetch students, team memberships and teams.
        // ------------------------------------------------------

        const [
          studentsResult,
          membersResult,
          teamsResult,
        ] = await Promise.all([
          supabase
            .from('students')
            .select(
              `
                id,
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
            .order('name', {
              ascending: true,
            }),

          supabase
            .from('team_members')
            .select(
              `
                id,
                team_id,
                student_id,
                role
              `
            ),

          supabase
            .from('teams')
            .select(
              `
                id,
                team_code,
                team_name,
                mode,
                campus,
                registration_status
              `
            ),
        ]);

        // ------------------------------------------------------
        // Check database errors
        // ------------------------------------------------------

        const firstError =
          studentsResult.error ||
          membersResult.error ||
          teamsResult.error;

        if (firstError) {
          throw firstError;
        }

        const studentRows =
          (studentsResult.data ??
            []) as StudentRow[];

        const memberRows =
          (membersResult.data ??
            []) as TeamMemberRow[];

        const teamRows =
          (teamsResult.data ??
            []) as TeamRow[];

        // ------------------------------------------------------
        // Lookup maps
        // ------------------------------------------------------

        const teamsById = new Map<
          string,
          TeamRow
        >();

        teamRows.forEach((team) => {
          teamsById.set(team.id, team);
        });

        // A student should only belong to one team
        // because the database enforces unique student_id.
        const membershipByStudent =
          new Map<
            string,
            TeamMemberRow
          >();

        memberRows.forEach((member) => {
          membershipByStudent.set(
            member.student_id,
            member
          );
        });

        // ------------------------------------------------------
        // Build admin roster
        // ------------------------------------------------------

        const mappedStudents: StudentView[] =
          studentRows.map((student) => {
            const membership =
              membershipByStudent.get(
                student.id
              );

            const team = membership
              ? teamsById.get(
                  membership.team_id
                )
              : undefined;

            return {
              ...student,

              team_id:
                team?.id ?? null,

              team_code:
                team?.team_code ?? null,

              team_name:
                team?.team_name ?? null,

              team_mode:
                team?.mode ?? null,

              team_status:
                team?.registration_status ??
                null,

              role:
                membership?.role ??
                'unassigned',
            };
          });

        setStudents(mappedStudents);
      } catch (err: unknown) {
        console.error(
          'Student roster loading error:',
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load student roster.';

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const branchOptions = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.branch)
          .filter(
            (branch): branch is string =>
              Boolean(branch)
          )
      )
    ).sort();
  }, [students]);

  const sectionOptions = useMemo(() => {
    return Array.from(
      new Set(
        students
          .map((student) => student.section)
          .filter(
            (section): section is string =>
              Boolean(section)
          )
      )
    ).sort();
  }, [students]);

  // ==========================================================
  // FILTER STUDENTS
  // ==========================================================

  const filteredStudents = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !search ||
        student.name
          .toLowerCase()
          .includes(search) ||
        student.usn
          .toLowerCase()
          .includes(search) ||
        student.email
          .toLowerCase()
          .includes(search) ||
        (student.branch ?? '')
          .toLowerCase()
          .includes(search) ||
        (student.team_code ?? '')
          .toLowerCase()
          .includes(search) ||
        (student.team_name ?? '')
          .toLowerCase()
          .includes(search);

      const matchesCampus =
        filterCampus === 'all' ||
        student.campus === filterCampus;

      const matchesBranch =
        filterBranch === 'all' ||
        student.branch === filterBranch;

      const matchesSection =
        filterSection === 'all' ||
        student.section === filterSection;

      return (
        matchesSearch &&
        matchesCampus &&
        matchesBranch &&
        matchesSection
      );
    });
  }, [
    students,
    searchTerm,
    filterCampus,
    filterBranch,
    filterSection,
  ]);

  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const exportStudentsCSV = () => {
    const headers = [
      'Name',
      'USN',
      'NIE Email',
      'Phone',
      'Branch',
      'Year',
      'Semester',
      'Section',
      'Campus',
      'Team Code',
      'Team Name',
      'Mode',
      'Team Status',
      'Role',
    ];

    const escapeCSV = (
      value: unknown
    ) => {
      const text =
        value === null ||
        value === undefined
          ? ''
          : String(value);

      return `"${text.replace(
        /"/g,
        '""'
      )}"`;
    };

    const rows = filteredStudents.map(
      (student) => [
        escapeCSV(student.name),
        escapeCSV(student.usn),
        escapeCSV(student.email),
        escapeCSV(student.phone ?? ''),
        escapeCSV(student.branch ?? ''),
        escapeCSV(student.year),
        escapeCSV(student.semester),
        escapeCSV(student.section ?? ''),
        escapeCSV(student.campus),
        escapeCSV(student.team_code ?? ''),
        escapeCSV(student.team_name ?? ''),
        escapeCSV(student.team_mode ?? ''),
        escapeCSV(student.team_status ?? ''),
        escapeCSV(student.role),
      ]
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.join(',')
      ),
    ].join('\n');

    const blob = new Blob(
      [csvContent],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      'NIErnaya_Students_Roster.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">

          <AlertCircle className="w-5 h-5 shrink-0" />

          <div className="flex-1">
            <div className="font-mono text-xs font-bold">
              STUDENT ROSTER ERROR
            </div>

            <div className="text-xs mt-1 opacity-80">
              {error}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadStudents(true)
            }
            disabled={refreshing}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono disabled:opacity-50"
          >
            {refreshing
              ? 'RETRYING...'
              : 'RETRY'}
          </button>
        </div>
      )}

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Participant Student Roster (
            {loading ? '—' : students.length}
            )
          </h1>

          <p className="text-xs text-[#8B96A5]">
            Complete registry of 2nd Year (3rd Semester)
            students registered in NIErnaya.
          </p>
        </div>

        <div className="flex gap-2">

          {/* Refresh */}
          <button
            type="button"
            onClick={() =>
              loadStudents(true)
            }
            disabled={
              refreshing ||
              loading
            }
            className="px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 hover:border-[#36D9FF] text-[#36D9FF] font-mono text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            <span>
              {refreshing
                ? 'REFRESHING'
                : 'REFRESH'}
            </span>
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={
              exportStudentsCSV
            }
            disabled={
              filteredStudents.length === 0
            }
            className="px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 hover:border-[#36D9FF] text-[#36D9FF] font-mono text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />

            <span>
              EXPORT CSV
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================
          ROSTER SUMMARY
      ======================================================= */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">

          <div className="text-[10px] font-mono text-[#8B96A5]">
            TOTAL STUDENTS
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {loading
              ? '—'
              : students.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">

          <div className="text-[10px] font-mono text-[#8B96A5]">
            NORTH CAMPUS
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {loading
              ? '—'
              : students.filter(
                  (student) =>
                    student.campus ===
                    'North'
                ).length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">

          <div className="text-[10px] font-mono text-[#8B96A5]">
            SOUTH CAMPUS
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {loading
              ? '—'
              : students.filter(
                  (student) =>
                    student.campus ===
                    'South'
                ).length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">

          <div className="text-[10px] font-mono text-[#8B96A5]">
            SHOWN
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {filteredStudents.length}
          </div>
        </div>
      </div>

      {/* ======================================================
          SEARCH & FILTERS
      ======================================================= */}

      <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">

        <div className="flex flex-col lg:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">

            <Search className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

            <input
              type="text"
              placeholder="Search by student name, USN, email, branch, or team code..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white placeholder:text-[#8B96A5]/50 focus:outline-none focus:border-[#36D9FF]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">

            {/* Campus */}
            <select
              value={filterCampus}
              onChange={(e) =>
                setFilterCampus(
                  e.target.value
                )
              }
              className="px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none"
            >
              <option value="all">
                All Campuses
              </option>

              <option value="North">
                North Campus
              </option>

              <option value="South">
                South Campus
              </option>
            </select>

            {/* Branch */}
            <select
              value={filterBranch}
              onChange={(e) =>
                setFilterBranch(
                  e.target.value
                )
              }
              className="px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none"
            >
              <option value="all">
                All Branches
              </option>

              {branchOptions.map(
                (branch) => (
                  <option
                    key={branch}
                    value={branch}
                  >
                    {branch}
                  </option>
                )
              )}
            </select>

            {/* Section */}
            <select
              value={filterSection}
              onChange={(e) =>
                setFilterSection(
                  e.target.value
                )
              }
              className="px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none"
            >
              <option value="all">
                All Sections
              </option>

              {sectionOptions.map(
                (section) => (
                  <option
                    key={section}
                    value={section}
                  >
                    Section {section}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================
          STUDENT TABLE
      ======================================================= */}

      <div className="rounded-2xl bg-[#0D1219] border border-white/10 overflow-hidden shadow-xl">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs font-mono">

            <thead className="bg-[#121A23] text-[#8B96A5] uppercase border-b border-white/5">

              <tr>
                <th className="p-4">
                  Student Name
                </th>

                <th className="p-4">
                  USN & Email
                </th>

                <th className="p-4">
                  Department & Section
                </th>

                <th className="p-4">
                  Campus
                </th>

                <th className="p-4">
                  Assigned Squad
                </th>

                <th className="p-4">
                  Role
                </th>
              </tr>

            </thead>

            <tbody className="divide-y divide-white/5 text-[#F5F7FA]">

              {/* Loading */}
              {loading ? (

                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-[#8B96A5]"
                  >
                    <div className="flex flex-col items-center gap-3">

                      <RefreshCw className="w-5 h-5 animate-spin text-[#36D9FF]" />

                      <span className="font-mono text-xs">
                        LOADING STUDENT ROSTER...
                      </span>

                    </div>
                  </td>
                </tr>

              ) : filteredStudents.length === 0 ? (

                /* Empty */
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-[#8B96A5]"
                  >

                    <GraduationCap className="w-8 h-8 mx-auto mb-3 opacity-40" />

                    <div className="font-mono text-xs">
                      {students.length === 0
                        ? 'No student records found.'
                        : 'No students match the current search/filter criteria.'}
                    </div>

                  </td>
                </tr>

              ) : (

                /* Students */
                filteredStudents.map(
                  (student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-[#121A23]/50 transition-colors"
                    >

                      {/* Student */}
                      <td className="p-4 font-bold text-white font-sans text-sm align-top">

                        {student.name}

                        <div className="text-[10px] text-[#8B96A5] font-mono mt-1">
                          Year {student.year} · Semester{' '}
                          {student.semester}
                        </div>
                      </td>

                      {/* USN / Email */}
                      <td className="p-4 align-top">

                        <div className="text-[#36D9FF] font-bold">
                          {student.usn}
                        </div>

                        <div className="text-[10px] text-[#8B96A5] break-all">
                          {student.email}
                        </div>

                        {student.phone && (
                          <div className="text-[10px] text-[#8B96A5]">
                            {student.phone}
                          </div>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="p-4 align-top">

                        <div>
                          {student.branch ??
                            '—'}
                        </div>

                        <div className="text-[10px] text-[#8B96A5]">
                          Section:{' '}
                          {student.section ??
                            '—'}
                        </div>
                      </td>

                      {/* Campus */}
                      <td className="p-4 align-top">

                        <div>
                          {student.campus}{' '}
                          Campus
                        </div>
                      </td>

                      {/* Team */}
                      <td className="p-4 align-top">

                        {student.team_code ? (
                          <>
                            <div className="text-[#FF7A30] font-bold">
                              {student.team_code}
                            </div>

                            <div className="text-[10px] text-[#8B96A5]">
                              {student.team_name}
                            </div>

                            {student.team_mode && (
                              <div className="text-[9px] text-[#8B96A5] mt-1">
                                {student.team_mode}{' '}
                                ·{' '}
                                {student.team_status}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[#8B96A5]">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="p-4 align-top">

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            student.role ===
                            'leader'
                              ? 'bg-[#FF7A30]/20 text-[#FF7A30] border border-[#FF7A30]/30'
                              : student.role ===
                                'member'
                              ? 'bg-white/5 text-[#8B96A5] border border-white/5'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {student.role}
                        </span>
                      </td>
                    </tr>
                  )
                )
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};