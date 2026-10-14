import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  FileCode,
  Loader2,
  RefreshCw,
  AlertCircle,
  Users,
  Trophy,
  Presentation,
  UserRound,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../../lib/supabase/client';

type ReportFormat = 'pdf' | 'docx';

type TeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  mode: string;
  campus: string;
  registration_status: string;
};

type StudentRow = {
  id: string;
  name: string;
  usn: string;
  email: string;
  phone?: string | null;
  branch?: string | null;
  year?: number | null;
  semester?: number | null;
  section?: string | null;
  campus?: string | null;
};

type TeamMemberRow = {
  team_id: string;
  student_id: string;
};

type FacultyRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  active: boolean;
};

type FacultyAssignmentRow = {
  team_id: string;
  faculty_id: string;
};

type PhaseRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  focus: string;
  campus_info: string;
  status: string;
  sort_order: number;
};

type SubmissionRow = {
  id: string;
  team_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  submitted_at: string;
  status: string;
};

type ResultRow = {
  id: string;
  team_id: string;
  team_code: string;
  team_name: string;
  leader_name: string;
  campus: string;
  position: string;
  prize_title: string;
  published: boolean;
};

type ReportData = {
  teams: TeamRow[];
  students: StudentRow[];
  teamMembers: TeamMemberRow[];
  faculty: FacultyRow[];
  assignments: FacultyAssignmentRow[];
  phases: PhaseRow[];
  submissions: SubmissionRow[];
  results: ResultRow[];
};

type ReportStats = {
  registeredTeams: number;
  totalParticipants: number;
  offlineTeams: number;
  northCampusTeams: number;
  southCampusTeams: number;
  submissions: number;
  faculty: number;
};

const escapeHtml = (value: unknown) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatDate = (value: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 KB';

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export const AdminReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [stats, setStats] = useState<ReportStats>({
    registeredTeams: 0,
    totalParticipants: 0,
    offlineTeams: 0,
    northCampusTeams: 0,
    southCampusTeams: 0,
    submissions: 0,
    faculty: 0,
  });

  const [downloading, setDownloading] = useState(false);
  const [reportFormat, setReportFormat] = useState<ReportFormat>('pdf');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /*
   * ------------------------------------------------------------
   * LOAD REPORT DATA FROM SUPABASE
   * ------------------------------------------------------------
   */

  const loadReportData = async () => {
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
        membersResponse,
        facultyResponse,
        assignmentsResponse,
        phasesResponse,
        submissionsResponse,
        resultsResponse,
      ] = await Promise.all([
        supabase
          .from('teams')
          .select(
            `
              id,
              team_code,
              team_name,
              leader_student_id,
              mode,
              campus,
              registration_status
            `
          )
          .order('team_code', { ascending: true }),

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
          .order('name', { ascending: true }),

        supabase
          .from('team_members')
          .select('team_id, student_id'),

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
          .order('sort_order', { ascending: true }),

        supabase
          .from('faculty_assignments')
          .select('team_id, faculty_id'),

        supabase
          .from('phases')
          .select(
            `
              id,
              name,
              start_date,
              end_date,
              focus,
              campus_info,
              status,
              sort_order
            `
          )
          .order('sort_order', { ascending: true }),

        supabase
          .from('submissions')
          .select(
            `
              id,
              team_id,
              file_name,
              file_type,
              file_size,
              submitted_at,
              status
            `
          )
          .order('submitted_at', { ascending: true }),

        supabase.rpc('get_all_results'),
      ]);

      const responses = [
        teamsResponse,
        studentsResponse,
        membersResponse,
        facultyResponse,
        assignmentsResponse,
        phasesResponse,
        submissionsResponse,
        resultsResponse,
      ];

      const failedResponse = responses.find((response) => response.error);

      if (failedResponse?.error) {
        throw failedResponse.error;
      }

      const teams = (teamsResponse.data || []) as TeamRow[];
      const students = (studentsResponse.data || []) as StudentRow[];
      const teamMembers = (membersResponse.data || []) as TeamMemberRow[];
      const faculty = (facultyResponse.data || []) as FacultyRow[];
      const assignments = (assignmentsResponse.data ||
        []) as FacultyAssignmentRow[];
      const phases = (phasesResponse.data || []) as PhaseRow[];
      const submissions = (submissionsResponse.data ||
        []) as SubmissionRow[];
      const results = (resultsResponse.data || []) as ResultRow[];

      const registeredTeams = teams.filter(
        (team) => team.registration_status !== 'draft'
      );

      const registeredTeamIds = new Set(
        registeredTeams.map((team) => team.id)
      );

      const registeredMembers = teamMembers.filter((member) =>
        registeredTeamIds.has(member.team_id)
      );

      const uniqueParticipants = new Set(
        registeredMembers.map((member) => member.student_id)
      );

      const statsData: ReportStats = {
        registeredTeams: registeredTeams.length,

        totalParticipants: uniqueParticipants.size,

        offlineTeams: registeredTeams.filter(
          (team) => team.mode === 'Offline'
        ).length,

        northCampusTeams: registeredTeams.filter(
          (team) => team.campus === 'North'
        ).length,

        southCampusTeams: registeredTeams.filter(
          (team) => team.campus === 'South'
        ).length,

        submissions: submissions.length,

        faculty: faculty.filter((member) => member.active).length,
      };

      setReportData({
        teams: registeredTeams,
        students,
        teamMembers,
        faculty,
        assignments,
        phases,
        submissions,
        results,
      });

      setStats(statsData);
    } catch (err: any) {
      console.error('Report data loading error:', err);

      setError(
        err?.message ||
          'Failed to load report data from Supabase.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  /*
   * ------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------
   */

  const getStudent = (
    studentId: string,
    data: ReportData
  ) => {
    return data.students.find(
      (student) => student.id === studentId
    );
  };

  const getTeamMembers = (
    teamId: string,
    data: ReportData
  ) => {
    const memberIds = data.teamMembers
      .filter((member) => member.team_id === teamId)
      .map((member) => member.student_id);

    return data.students.filter((student) =>
      memberIds.includes(student.id)
    );
  };

  const getAssignedFaculty = (
    teamId: string,
    data: ReportData
  ) => {
    const assignment = data.assignments.find(
      (item) => item.team_id === teamId
    );

    if (!assignment) {
      return null;
    }

    return data.faculty.find(
      (faculty) => faculty.id === assignment.faculty_id
    );
  };



  /*
   * ------------------------------------------------------------
   * PDF GENERATION
   * ------------------------------------------------------------
   */

  const generatePDF = (data: ReportData) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;

    let y = 20;

    const addHeader = () => {
      doc.setFillColor(7, 9, 13);
      doc.rect(0, 0, pageWidth, 45, 'F');

      doc.setFillColor(255, 122, 48);
      doc.rect(0, 44, pageWidth, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 122, 48);
      doc.setFontSize(10);

      doc.text(
        'THE NATIONAL INSTITUTE OF ENGINEERING, MYSORE',
        15,
        15
      );

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);

      doc.text(
        "NIErnaya — OFFICIAL DATA DETECTIVE CHALLENGE REPORT",
        15,
        25
      );

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(54, 217, 255);

      doc.text(
        'DATA DETECTIVE CHALLENGE | 2026',
        15,
        34
      );
    };

    const addSectionTitle = (title: string) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(23, 58, 140);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 15, y);

      y += 8;
    };

    const addText = (
      text: string,
      x = 15,
      width = 180,
      fontSize = 9.5
    ) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(50, 50, 50);

      const lines = doc.splitTextToSize(text, width);

      doc.text(lines, x, y);

      y += lines.length * 5 + 5;
    };

    const ensureSpace = (height: number) => {
      if (y + height > 275) {
        doc.addPage();
        y = 20;
      }
    };

    /*
     * PAGE 1
     */

    addHeader();

    y = 55;

    addSectionTitle(
      '1. EXECUTIVE SUMMARY & OBJECTIVES'
    );

    addText(
      "NIErnaya is the Data Detective Challenge conducted by The National Institute of Engineering (NIE), Mysore. The event is designed for eligible second-year, third-semester NIE students and is structured across three progressive phases: Data Hunt, Data Lab & Visualization War, and the Live Data Battle finale."
    );

    addSectionTitle(
      '2. EVENT PARTICIPATION METRICS'
    );

    ensureSpace(38);

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(
      15,
      y,
      180,
      34,
      3,
      3,
      'F'
    );

    doc.setDrawColor(200, 210, 220);
    doc.roundedRect(
      15,
      y,
      180,
      34,
      3,
      3,
      'D'
    );

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);

    doc.text(
      `Registered Teams: ${stats.registeredTeams}`,
      22,
      y + 9
    );

    doc.text(
      `Participants: ${stats.totalParticipants}`,
      22,
      y + 20
    );

    doc.text(
      `Offline Teams: ${stats.offlineTeams}`,
      85,
      y + 20
    );

    doc.text(
      `North Campus: ${stats.northCampusTeams}`,
      145,
      y + 9
    );

    doc.text(
      `South Campus: ${stats.southCampusTeams}`,
      145,
      y + 20
    );

    doc.text(
      `Submissions: ${stats.submissions}`,
      145,
      y + 29
    );

    y += 44;

    addSectionTitle(
      '3. DATA DETECTIVE CHALLENGE PHASES & STRUCTURE'
    );

    data.phases.forEach((phase) => {
      ensureSpace(20);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      doc.text(
        `${phase.name}: ${phase.focus}`,
        18,
        y
      );

      y += 5;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 90);

      doc.text(
        `${formatDate(phase.start_date)} – ${formatDate(
          phase.end_date
        )} | ${phase.campus_info} | Status: ${phase.status}`,
        18,
        y
      );

      y += 8;
    });

    addSectionTitle(
      '4. FACULTY ORGANIZING COMMITTEE'
    );

    data.faculty
      .filter((faculty) => faculty.active)
      .forEach((faculty, index) => {
        ensureSpace(10);

        const assignedCount = data.assignments.filter(
          (assignment) =>
            assignment.faculty_id === faculty.id
        ).length;

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        doc.text(
          `${index + 1}. ${faculty.name} — ${
            faculty.designation || 'Faculty'
          }, ${
            faculty.department || 'NIE'
          } | Assigned Teams: ${assignedCount}`,
          18,
          y
        );

        y += 5;
      });

    /*
     * PAGE 2 — TEAMS
     */

    doc.addPage();
    y = 20;

    addSectionTitle(
      '5. REGISTERED SQUADS & TEAM DIRECTORY'
    );

    if (data.teams.length === 0) {
      addText(
        'No registered teams recorded at this moment.'
      );
    } else {
      data.teams.forEach((team, index) => {
        ensureSpace(32);

        const leader = getStudent(
          team.leader_student_id,
          data
        );

        const members = getTeamMembers(
          team.id,
          data
        );

        const faculty = getAssignedFaculty(
          team.id,
          data
        );

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        doc.text(
          `${index + 1}. [${team.team_code}] ${
            team.team_name
          }`,
          18,
          y
        );

        y += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);

        doc.text(
          `Leader: ${
            leader?.name || 'Unknown'
          } (${leader?.usn || '—'}) | ${
            team.campus
          } Campus | Offline`,
          18,
          y
        );

        y += 4.5;

        const memberText = members
          .map(
            (member) =>
              `${member.name} (${member.usn})`
          )
          .join(', ');

        const memberLines =
          doc.splitTextToSize(
            `Members: ${memberText || '—'}`,
            174
          );

        doc.text(
          memberLines,
          18,
          y
        );

        y += memberLines.length * 4;

        doc.text(
          `Assigned Faculty: ${
            faculty?.name || 'Pending Assignment'
          }`,
          18,
          y
        );

        y += 7;
      });
    }

    /*
     * SUBMISSIONS
     */

    addSectionTitle(
      '6. SUBMISSION REGISTER'
    );

    if (data.submissions.length === 0) {
      addText(
        'No submissions recorded at this moment.'
      );
    } else {
      data.submissions.forEach(
        (submission, index) => {
          ensureSpace(14);

          const team = data.teams.find(
            (item) =>
              item.id === submission.team_id
          );

          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);

          doc.text(
            `${index + 1}. ${
              team?.team_code || 'UNKNOWN'
            } — ${
              submission.file_name
            } | ${formatFileSize(
              submission.file_size
            )} | ${
              submission.status
            }`,
            18,
            y
          );

          y += 5;
        }
      );
    }

    /*
     * RESULTS
     */

    addSectionTitle(
      '7. RESULTS & MERIT HONORS'
    );

    const publishedResults =
      data.results.filter(
        (result) => result.published
      );

    if (publishedResults.length === 0) {
      addText(
        'Official final results have not yet been published by the jury committee.'
      );
    } else {
      publishedResults.forEach(
        (result) => {
          ensureSpace(12);

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 122, 48);

          doc.text(
            `${result.position}: Team ${
              result.team_code
            } — "${result.team_name}"`,
            18,
            y
          );

          y += 5;

          doc.setFontSize(8.5);
          doc.setTextColor(60, 60, 60);
          doc.setFont('helvetica', 'normal');

          doc.text(
            `Award: ${result.prize_title}`,
            18,
            y
          );

          y += 7;
        }
      );
    }

    /*
     * SIGNATURES
     */

    ensureSpace(35);

    y = Math.max(y + 10, 245);

    doc.setDrawColor(180, 180, 180);

    doc.line(20, y, 70, y);
    doc.line(135, y, 190, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    doc.text(
      'Chief Faculty Convener',
      28,
      y + 5
    );

    doc.text(
      'Principal / Dean Academic, NIE',
      138,
      y + 5
    );

    return doc;
  };

  /*
   * ------------------------------------------------------------
   * DOC / WORD GENERATION
   * ------------------------------------------------------------
   */

  const generateDOCX = (data: ReportData) => {
    const registeredTeams = data.teams;

    const teamRows = registeredTeams
      .map((team) => {
        const leader = getStudent(
          team.leader_student_id,
          data
        );

        const faculty = getAssignedFaculty(
          team.id,
          data
        );

        return `
          <tr>
            <td>${escapeHtml(team.team_code)}</td>
            <td>${escapeHtml(team.team_name)}</td>
            <td>
              ${escapeHtml(
                leader?.name || 'Unknown'
              )}
              <br />
              <small>
                ${escapeHtml(
                  leader?.usn || ''
                )}
              </small>
            </td>
            <td>Offline</td>
            <td>${escapeHtml(team.campus)}</td>
            <td>
              ${escapeHtml(
                faculty?.name ||
                  'Unassigned'
              )}
            </td>
          </tr>
        `;
      })
      .join('');

    const phaseRows = data.phases
      .map(
        (phase) => `
          <tr>
            <td>${escapeHtml(
              phase.name
            )}</td>
            <td>${escapeHtml(
              phase.focus
            )}</td>
            <td>
              ${escapeHtml(
                formatDate(
                  phase.start_date
                )
              )}
              –
              ${escapeHtml(
                formatDate(
                  phase.end_date
                )
              )}
            </td>
            <td>${escapeHtml(
              phase.campus_info
            )}</td>
          </tr>
        `
      )
      .join('');

    const facultyRows = data.faculty
      .filter((faculty) => faculty.active)
      .map((faculty) => {
        const assignedCount =
          data.assignments.filter(
            (assignment) =>
              assignment.faculty_id ===
              faculty.id
          ).length;

        return `
          <tr>
            <td>${escapeHtml(
              faculty.name
            )}</td>
            <td>${escapeHtml(
              faculty.designation ||
                'Faculty'
            )}</td>
            <td>${escapeHtml(
              faculty.department ||
                'NIE'
            )}</td>
            <td>${assignedCount}</td>
          </tr>
        `;
      })
      .join('');

    const resultRows = data.results
      .filter((result) => result.published)
      .map(
        (result) => `
          <tr>
            <td>${escapeHtml(
              result.position
            )}</td>
            <td>${escapeHtml(
              result.team_code
            )}</td>
            <td>${escapeHtml(
              result.team_name
            )}</td>
            <td>${escapeHtml(
              result.prize_title
            )}</td>
          </tr>
        `
      )
      .join('');

    const htmlContent = `
      <html
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns="http://www.w3.org/TR/REC-html40"
      >
        <head>
          <meta charset="utf-8" />

          <title>
            NIErnaya Official Event Report
          </title>

          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
              margin: 40px;
              color: #111;
              line-height: 1.5;
            }

            h1 {
              color: #173A8C;
              font-size: 22pt;
              margin-bottom: 4pt;
            }

            h2 {
              color: #FF7A30;
              font-size: 14pt;
              margin-top: 22pt;
              border-bottom: 1px solid #ddd;
              padding-bottom: 4pt;
            }

            .sub {
              color: #555;
              font-size: 11pt;
              margin-bottom: 18pt;
            }

            .summary {
              background: #f5f7fa;
              border: 1px solid #d9dee5;
              padding: 14px;
              margin: 10px 0 20px 0;
            }

            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 10pt;
            }

            th,
            td {
              border: 1px solid #ccc;
              padding: 6pt;
              font-size: 10pt;
              text-align: left;
              vertical-align: top;
            }

            th {
              background-color: #f2f5f9;
              color: #173A8C;
            }

            .footer {
              margin-top: 40pt;
              color: #666;
              font-size: 9pt;
            }
          </style>
        </head>

        <body>

          <h1>
            NIErnaya — OFFICIAL DATA DETECTIVE CHALLENGE REPORT
          </h1>

          <div class="sub">
            The National Institute of Engineering (NIE), Mysore |
            Data Detective Challenge
          </div>

          <h2>
            1. Executive Summary
          </h2>

          <p>
            NIErnaya is the Data Analytics & Visualization
            Data Detective Challenge conducted by The National Institute of
            Engineering, Mysore for eligible second-year,
            third-semester students across the institute.
          </p>

          <p>
            The event is structured across three progressive
            phases covering problem identification, data
            exploration, visualization, analytics and the
            final offline data challenge.
          </p>

          <h2>
            2. Participation Statistics
          </h2>

          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Metric</th>
              <th>Value</th>
            </tr>

            <tr>
              <td>Total Registered Teams</td>
              <td>${stats.registeredTeams}</td>

              <td>Total Participants</td>
              <td>${stats.totalParticipants}</td>
            </tr>

            <tr>
              <td>Participation Format</td>
              <td colspan="3">Offline</td>
            </tr>

            <tr>
              <td>North Campus Teams</td>
              <td>${stats.northCampusTeams}</td>

              <td>South Campus Teams</td>
              <td>${stats.southCampusTeams}</td>
            </tr>

            <tr>
              <td>Submissions</td>
              <td>${stats.submissions}</td>

              <td>Active Faculty</td>
              <td>${stats.faculty}</td>
            </tr>
          </table>

          <h2>
            3. Event Phases
          </h2>

          <table>
            <tr>
              <th>Phase</th>
              <th>Focus</th>
              <th>Dates</th>
              <th>Campus / Mode</th>
            </tr>

            ${phaseRows}
          </table>

          <h2>
            4. Faculty Organizing Committee
          </h2>

          <table>
            <tr>
              <th>Faculty</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Assigned Teams</th>
            </tr>

            ${facultyRows}
          </table>

          <h2>
            5. Registered Teams
          </h2>

          <table>
            <tr>
              <th>Team Code</th>
              <th>Team Name</th>
              <th>Leader</th>
              <th>Mode</th>
              <th>Campus</th>
              <th>Assigned Faculty</th>
            </tr>

            ${
              teamRows ||
              `
                <tr>
                  <td colspan="6">
                    No registered teams recorded.
                  </td>
                </tr>
              `
            }
          </table>

          <h2>
            6. Submission Register
          </h2>

          <table>
            <tr>
              <th>Team</th>
              <th>File</th>
              <th>Type</th>
              <th>Size</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>

            ${
              data.submissions
                .map((submission) => {
                  const team =
                    data.teams.find(
                      (item) =>
                        item.id ===
                        submission.team_id
                    );

                  return `
                    <tr>
                      <td>${escapeHtml(
                        team?.team_code ||
                          'Unknown'
                      )}</td>

                      <td>${escapeHtml(
                        submission.file_name
                      )}</td>

                      <td>${escapeHtml(
                        submission.file_type
                      )}</td>

                      <td>${escapeHtml(
                        formatFileSize(
                          submission.file_size
                        )
                      )}</td>

                      <td>${escapeHtml(
                        submission.status
                      )}</td>

                      <td>${escapeHtml(
                        formatDate(
                          submission.submitted_at
                        )
                      )}</td>
                    </tr>
                  `;
                })
                .join('') ||
              `
                <tr>
                  <td colspan="6">
                    No submissions recorded.
                  </td>
                </tr>
              `
            }
          </table>

          <h2>
            7. Results & Merit Honors
          </h2>

          <table>
            <tr>
              <th>Position</th>
              <th>Team Code</th>
              <th>Team Name</th>
              <th>Prize / Honor</th>
            </tr>

            ${
              resultRows ||
              `
                <tr>
                  <td colspan="4">
                    Official final results have not yet
                    been published.
                  </td>
                </tr>
              `
            }
          </table>

          <div class="footer">
            <p>
              Generated from the NIErnaya administrative
              database.
            </p>

            <p>
              The National Institute of Engineering, Mysore
            </p>

            <br /><br />

            ____________________________
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            ____________________________

            <br />

            Chief Faculty Convener
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Principal / Dean Academic, NIE
          </div>

        </body>
      </html>
    `;

    const blob = new Blob(
      ['\ufeff', htmlContent],
      {
        type: 'application/msword',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      'NIErnaya_Official_Report.doc';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * ------------------------------------------------------------
   * DOWNLOAD
   * ------------------------------------------------------------
   */

  const handleDownload = async () => {
    if (!reportData) {
      setError(
        'Report data is not available. Refresh and try again.'
      );
      return;
    }

    setDownloading(true);
    setError(null);
    setSuccess(null);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      if (reportFormat === 'pdf') {
        const doc =
          generatePDF(reportData);

        doc.save(
          'NIErnaya_Official_Report.pdf'
        );
      } else {
        generateDOCX(reportData);
      }

      setSuccess(
        `Official ${reportFormat.toUpperCase()} report generated successfully from live Supabase data.`
      );

      setTimeout(
        () => setSuccess(null),
        4000
      );
    } catch (err: any) {
      console.error(
        'Report generation error:',
        err
      );

      setError(
        err?.message ||
          'Failed to generate the official report.'
      );
    } finally {
      setDownloading(false);
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
            Official College Data Detective Challenge Reports Engine
          </h1>

          <p className="text-xs sm:text-sm text-[#8B96A5]">
            Generate official printable and editable documentation
            for NIE college archives and Dean reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReportData}
          disabled={loading}
          className="self-start px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-[#8B96A5] hover:text-white hover:border-white/20 transition-colors flex items-center gap-2 text-xs font-mono"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              loading ? 'animate-spin' : ''
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
        <div className="min-h-[360px] flex items-center justify-center rounded-3xl bg-[#0D1219] border border-white/10">
          <div className="flex items-center gap-3 text-[#8B96A5] text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            LOADING LIVE REPORT DATA...
          </div>
        </div>
      ) : (
        <>

          {/* REPORT GENERATOR */}
          <div className="p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#36D9FF]/10 border border-[#36D9FF]/30 flex items-center justify-center text-[#36D9FF]">
                <FileText className="w-7 h-7" />
              </div>

              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  NIErnaya Comprehensive Event Dossier
                </h2>

                <p className="text-xs text-[#8B96A5] font-mono">
                  Generated directly from the live Supabase
                  administrative database.
                </p>
              </div>
            </div>

            {/* LIVE INCLUSION CHECKPOINTS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">

              <div className="p-3 rounded-xl bg-[#121A23] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#8B96A5]">
                  <Users className="w-3.5 h-3.5" />
                  TEAMS INCLUDED
                </div>

                <div className="font-bold text-white text-sm">
                  {stats.registeredTeams} Squads
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121A23] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#8B96A5]">
                  <UserRound className="w-3.5 h-3.5" />
                  STUDENTS
                </div>

                <div className="font-bold text-white text-sm">
                  {stats.totalParticipants} Students
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121A23] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#8B96A5]">
                  <Presentation className="w-3.5 h-3.5" />
                  SUBMISSIONS
                </div>

                <div className="font-bold text-white text-sm">
                  {stats.submissions} Decks
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121A23] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-[#8B96A5]">
                  <Trophy className="w-3.5 h-3.5" />
                  FACULTY
                </div>

                <div className="font-bold text-white text-sm">
                  {stats.faculty} Faculty Members
                </div>
              </div>

            </div>

            {/* OUTPUT FORMAT */}
            <div className="space-y-3 pt-4 border-t border-white/10">

              <label className="text-xs font-mono font-bold text-[#8B96A5] uppercase">
                CHOOSE DOCUMENT EXPORT FORMAT
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">

                {/* PDF */}
                <button
                  type="button"
                  onClick={() =>
                    setReportFormat('pdf')
                  }
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    reportFormat === 'pdf'
                      ? 'bg-[#121A23] border-[#36D9FF] shadow-lg shadow-[#36D9FF]/10'
                      : 'bg-[#07090D] border-white/10 hover:border-white/20'
                  }`}
                >
                  <FileText className="w-5 h-5 text-[#36D9FF] shrink-0 mt-0.5" />

                  <div>
                    <div className="font-bold text-white">
                      Official Printable PDF
                    </div>

                    <div className="text-[#8B96A5] text-[11px] mt-0.5">
                      Live database report with institutional
                      formatting and signatures.
                    </div>
                  </div>
                </button>

                {/* WORD */}
                <button
                  type="button"
                  onClick={() =>
                    setReportFormat('docx')
                  }
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    reportFormat === 'docx'
                      ? 'bg-[#121A23] border-[#FF7A30] shadow-lg shadow-[#FF7A30]/10'
                      : 'bg-[#07090D] border-white/10 hover:border-white/20'
                  }`}
                >
                  <FileCode className="w-5 h-5 text-[#FF7A30] shrink-0 mt-0.5" />

                  <div>
                    <div className="font-bold text-white">
                      Editable Word Document
                    </div>

                    <div className="text-[#8B96A5] text-[11px] mt-0.5">
                      Editable administrative report generated
                      from live Supabase records.
                    </div>
                  </div>
                </button>

              </div>
            </div>

            {/* DOWNLOAD */}
            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="text-[10px] text-[#8B96A5] font-mono">
                SOURCE: SUPABASE • LIVE DATA • ADMIN AUTHENTICATED
              </div>

              <button
                onClick={handleDownload}
                disabled={
                  downloading ||
                  !reportData
                }
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#36D9FF] to-[#00A3FF] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-xl hover:shadow-[#36D9FF]/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}

                <span>
                  {downloading
                    ? 'GENERATING DOSSIER...'
                    : `DOWNLOAD OFFICIAL ${reportFormat.toUpperCase()} REPORT`}
                </span>
              </button>

            </div>

          </div>

          {/* DATA SNAPSHOT */}
          <div className="p-6 rounded-3xl bg-[#0D1219] border border-white/10">

            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-green-400" />

              <h3 className="text-sm font-display font-bold text-white">
                Report Data Snapshot
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono">

              <div className="p-3 rounded-xl bg-[#121A23]">
                <span className="text-[#8B96A5]">
                  PHASES
                </span>

                <div className="text-white font-bold mt-1">
                  {reportData?.phases.length || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121A23]">
                <span className="text-[#8B96A5]">
                  FACULTY ASSIGNMENTS
                </span>

                <div className="text-white font-bold mt-1">
                  {reportData?.assignments.length || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121A23]">
                <span className="text-[#8B96A5]">
                  PUBLISHED RESULTS
                </span>

                <div className="text-white font-bold mt-1">
                  {reportData?.results.filter(
                    (result) => result.published
                  ).length || 0}
                </div>
              </div>

            </div>

          </div>

        </>
      )}

    </div>
  );
};