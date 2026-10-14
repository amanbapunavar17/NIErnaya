import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Users,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { CertificateService } from '../../lib/services/certificateService';
import type { CertificateCategory } from '../../lib/services/certificateService';
import { supabase } from '../../lib/supabase/client';

type TeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  campus: string;
  registration_status: string;
};

type StudentRow = {
  id: string;
  name: string;
  usn: string;
  email: string;
  branch: string | null;
  year: number | null;
  semester: number | null;
  section: string | null;
  campus: string | null;
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

export const AdminCertificatesPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);

  const [category, setCategory] =
    useState<CertificateCategory>('participant');

  const [recipientName, setRecipientName] =
    useState('');

  const [teamCode, setTeamCode] =
    useState('');

  const [positionTitle, setPositionTitle] =
    useState('WINNER — 1ST PLACE');

  const [department, setDepartment] =
    useState('Computer Science & Engineering');

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  /*
   * ------------------------------------------------------------
   * LOAD CERTIFICATE DATA
   * ------------------------------------------------------------
   */

  const loadCertificateData = async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        teamsResponse,
        studentsResponse,
        facultyResponse,
      ] = await Promise.all([
        supabase
          .from('teams')
          .select(
            `
              id,
              team_code,
              team_name,
              leader_student_id,
              campus,
              registration_status
            `
          )
          .neq('registration_status', 'draft')
          .order('team_code', {
            ascending: true,
          }),

        supabase
          .from('students')
          .select(
            `
              id,
              name,
              usn,
              email,
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
          .eq('active', true)
          .order('sort_order', {
            ascending: true,
          }),
      ]);

      if (teamsResponse.error) {
        throw teamsResponse.error;
      }

      if (studentsResponse.error) {
        throw studentsResponse.error;
      }

      if (facultyResponse.error) {
        throw facultyResponse.error;
      }

      setTeams(
        (teamsResponse.data ||
          []) as TeamRow[]
      );

      setStudents(
        (studentsResponse.data ||
          []) as StudentRow[]
      );

      setFaculty(
        (facultyResponse.data ||
          []) as FacultyRow[]
      );
    } catch (err: any) {
      console.error(
        'Certificate data loading error:',
        err
      );

      setError(
        err?.message ||
          'Failed to load certificate data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificateData();
  }, []);

  /*
   * ------------------------------------------------------------
   * LOOKUPS
   * ------------------------------------------------------------
   */

  const selectedTeam = useMemo(() => {
    if (!teamCode.trim()) {
      return undefined;
    }

    return teams.find(
      (team) =>
        team.team_code.toLowerCase() ===
        teamCode.trim().toLowerCase()
    );
  }, [teams, teamCode]);

  const selectedFaculty = useMemo(() => {
    return faculty.find(
      (member) =>
        member.name.toLowerCase() ===
        recipientName.trim().toLowerCase()
    );
  }, [faculty, recipientName]);

  /*
   * ------------------------------------------------------------
   * CATEGORY CHANGE
   * ------------------------------------------------------------
   */

  const handleCategoryChange = (
    nextCategory: CertificateCategory
  ) => {
    setCategory(nextCategory);
    setError(null);

    if (nextCategory === 'winner') {
      setPositionTitle(
        'WINNER — 1ST PLACE'
      );
    }

    if (
      nextCategory === 'faculty' ||
      nextCategory === 'organizer' ||
      nextCategory === 'volunteer'
    ) {
      setTeamCode('');
    }
  };

  /*
   * ------------------------------------------------------------
   * GENERATE CERTIFICATE
   * ------------------------------------------------------------
   */

  const handleGenerateCertificate = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const trimmedName =
      recipientName.trim();

    if (!trimmedName) {
      setError(
        'Please enter the recipient name.'
      );
      return;
    }

    if (
      category === 'winner' &&
      !teamCode.trim()
    ) {
      setError(
        'Please enter a valid team code for the winner certificate.'
      );
      return;
    }

    if (
      category === 'winner' &&
      !selectedTeam
    ) {
      setError(
        `Team ${teamCode.trim()} was not found in the registered teams.`
      );
      return;
    }

    setGenerating(true);

    try {
      /*
       * If a team code is supplied, use the actual
       * Supabase team record.
       */

      const matchedTeam =
        selectedTeam;

      /*
       * Faculty certificate:
       * If the entered recipient matches an active faculty
       * member, use the faculty's department automatically.
       */

      const matchedFaculty =
        category === 'faculty'
          ? selectedFaculty
          : undefined;

      const certificateDepartment =
        matchedFaculty?.department ||
        department;

      /*
       * Existing CertificateService remains responsible
       * for producing the PDF.
       */

      await CertificateService.downloadCertificate(
        {
          recipientName: trimmedName,

          category,

          teamName:
            matchedTeam?.team_name,

          teamCode:
            matchedTeam?.team_code ||
            (teamCode.trim()
              ? teamCode.trim()
              : undefined),

          positionTitle:
            category === 'winner'
              ? positionTitle
              : undefined,

          department:
            certificateDepartment,
        }
      );

      setSuccess(
        `Official ${category} certificate successfully generated and downloaded for ${trimmedName}.`
      );

      setTimeout(
        () => setSuccess(null),
        4500
      );
    } catch (err: any) {
      console.error(
        'Certificate generation error:',
        err
      );

      setError(
        err?.message ||
          'Failed to generate certificate.'
      );
    } finally {
      setGenerating(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Official Certificate Generation Engine
          </h1>

          <p className="text-xs sm:text-sm text-[#8B96A5]">
            Generate printable participant, winner, faculty, organizer, and volunteer certificates.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCertificateData}
          disabled={loading}
          className="self-start px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-[#8B96A5] hover:text-white hover:border-white/20 transition-colors flex items-center gap-2 text-xs font-mono"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          REFRESH
        </button>

      </div>

      {/* SUCCESS */}
      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />

          <span>{success}</span>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <span>{error}</span>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center rounded-3xl bg-[#0D1219] border border-white/10">

          <div className="flex items-center gap-3 text-[#8B96A5] text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />

            LOADING CERTIFICATE DATABASE...
          </div>

        </div>
      ) : (
        <>

          {/* DATABASE STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">

              <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
                <Users className="w-3.5 h-3.5" />
                REGISTERED TEAMS
              </div>

              <div className="text-white text-xl font-display font-bold mt-2">
                {teams.length}
              </div>

            </div>

            <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">

              <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
                <GraduationCap className="w-3.5 h-3.5" />
                STUDENT RECORDS
              </div>

              <div className="text-white text-xl font-display font-bold mt-2">
                {students.length}
              </div>

            </div>

            <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">

              <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                ACTIVE FACULTY
              </div>

              <div className="text-white text-xl font-display font-bold mt-2">
                {faculty.length}
              </div>

            </div>

          </div>

          {/* GENERATOR FORM */}
          <form
            onSubmit={
              handleGenerateCertificate
            }
            className="p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6"
          >

            {/* CATEGORY */}
            <div className="space-y-2">

              <label className="text-xs font-mono font-bold text-[#8B96A5] uppercase">
                CERTIFICATE CATEGORY
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">

                <button
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      'participant'
                    )
                  }
                  className={`p-3 rounded-xl border text-center transition-all ${
                    category === 'participant'
                      ? 'bg-[#36D9FF]/20 border-[#36D9FF] text-[#36D9FF] font-bold'
                      : 'bg-[#121A23] border-white/10 text-[#8B96A5] hover:border-white/20'
                  }`}
                >
                  Participant
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      'winner'
                    )
                  }
                  className={`p-3 rounded-xl border text-center transition-all ${
                    category === 'winner'
                      ? 'bg-[#FF7A30]/20 border-[#FF7A30] text-[#FF7A30] font-bold'
                      : 'bg-[#121A23] border-white/10 text-[#8B96A5] hover:border-white/20'
                  }`}
                >
                  Winner Podium
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      'faculty'
                    )
                  }
                  className={`p-3 rounded-xl border text-center transition-all ${
                    category === 'faculty'
                      ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6] font-bold'
                      : 'bg-[#121A23] border-white/10 text-[#8B96A5] hover:border-white/20'
                  }`}
                >
                  Faculty Mentor
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      'organizer'
                    )
                  }
                  className={`p-3 rounded-xl border text-center transition-all ${
                    category === 'organizer'
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold'
                      : 'bg-[#121A23] border-white/10 text-[#8B96A5] hover:border-white/20'
                  }`}
                >
                  Organizer
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange('volunteer')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    category === 'volunteer'
                      ? 'bg-[#36D9FF]/20 border-[#36D9FF] text-[#36D9FF] font-bold'
                      : 'bg-[#121A23] border-white/10 text-[#8B96A5] hover:border-white/20'
                  }`}
                >
                  Volunteer
                </button>

              </div>
            </div>

            {/* RECIPIENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-1 sm:col-span-2">

                <label className="text-xs font-mono text-[#8B96A5]">
                  RECIPIENT FULL NAME
                </label>

                <input
                  type="text"
                  placeholder="e.g. John Doe / Dr. Jane Smith"
                  value={recipientName}
                  onChange={(e) =>
                    setRecipientName(
                      e.target.value
                    )
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#36D9FF]"
                />

                {category === 'faculty' &&
                  selectedFaculty && (
                    <p className="text-[10px] text-green-400 font-mono pt-1">
                      Faculty record matched:{' '}
                      {
                        selectedFaculty.name
                      }
                    </p>
                  )}

              </div>

              {/* WINNER FIELDS */}
              {category === 'winner' && (
                <>
                  <div className="space-y-1">

                    <label className="text-xs font-mono text-[#8B96A5]">
                      TEAM CODE
                    </label>

                    <input
                      type="text"
                      placeholder="DAV26-001"
                      value={teamCode}
                      onChange={(e) =>
                        setTeamCode(
                          e.target.value
                        )
                      }
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#FF7A30]"
                    />

                    {selectedTeam && (
                      <p className="text-[10px] text-green-400 font-mono pt-1">
                        {selectedTeam.team_name}
                      </p>
                    )}

                  </div>

                  <div className="space-y-1">

                    <label className="text-xs font-mono text-[#8B96A5]">
                      POSITION TITLE
                    </label>

                    <input
                      type="text"
                      value={positionTitle}
                      onChange={(e) =>
                        setPositionTitle(
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#FF7A30]"
                    />

                  </div>
                </>
              )}

              {/* DEPARTMENT */}
              <div className="space-y-1 sm:col-span-2">

                <label className="text-xs font-mono text-[#8B96A5]">
                  DEPARTMENT / DIVISION
                </label>

                <select
                  value={department}
                  onChange={(e) =>
                    setDepartment(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#36D9FF]"
                >
                  <option value="Computer Science & Engineering">
                    Computer Science & Engineering
                  </option>

                  <option value="Artificial Intelligence & Machine Learning">
                    Artificial Intelligence & Machine Learning
                  </option>

                  <option value="Electronics & Communication Engineering">
                    Electronics & Communication Engineering
                  </option>

                  <option value="Electrical & Electronics Engineering">
                    Electrical & Electronics Engineering
                  </option>

                  <option value="Mechanical Engineering">
                    Mechanical Engineering
                  </option>

                  <option value="Civil Engineering">
                    Civil Engineering
                  </option>
                </select>

              </div>

            </div>

            {/* SELECTED TEAM PREVIEW */}
            {category === 'winner' &&
              selectedTeam && (
                <div className="p-4 rounded-2xl bg-[#121A23] border border-[#FF7A30]/20">

                  <div className="text-[10px] font-mono text-[#8B96A5] mb-2">
                    CERTIFICATE TEAM RECORD
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                    <div>
                      <div className="text-white font-display font-bold">
                        {
                          selectedTeam.team_name
                        }
                      </div>

                      <div className="text-[#36D9FF] text-[10px] font-mono mt-1">
                        {
                          selectedTeam.team_code
                        }
                      </div>
                    </div>

                    <div className="text-[#8B96A5] text-[10px] font-mono">
                      {
                        selectedTeam.campus
                      } Campus
                    </div>

                  </div>

                </div>
              )}

            {/* ACTION */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="text-[10px] text-[#8B96A5] font-mono">
                SOURCE: SUPABASE • CERTIFICATE SERVICE
              </div>

              <button
                type="submit"
                disabled={generating}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-xl hover:shadow-[#FF7A30]/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >

                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Award className="w-4 h-4" />
                )}

                <span>
                  {generating
                    ? 'GENERATING...'
                    : 'GENERATE & DOWNLOAD CERTIFICATE PDF'}
                </span>

              </button>

            </div>

          </form>

        </>
      )}

    </div>
  );
};