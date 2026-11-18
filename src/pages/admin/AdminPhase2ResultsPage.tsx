
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

type ResultTeam = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  leader_name: string;
  leader_email: string;
  coordinator_name: string;
  jury_name: string;
  decision: 'selected' | 'not_selected' | null;
  submitted_at: string | null;
};

type FilterStatus = 'all' | 'selected' | 'not_selected' | 'pending';

//const csvCell = (value: unknown) =>
//  `"${String(value ?? '').replace(/"/g, '""')}"`;

export const AdminPhase2ResultsPage: React.FC = () => {
  const [teams, setTeams] = useState<ResultTeam[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [coordinatorFilter, setCoordinatorFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [
        shortlistRes,
        facultyRes,
        panelRes,
        assignmentRes,
        decisionRes,
      ] = await Promise.all([
        supabase
          .from('phase1_faculty_shortlists')
          .select('faculty_id,selected_team_ids,confirmed_at')
          .order('confirmed_at'),

        supabase
          .from('faculty')
          .select('id,name')
          .eq('active', true),

        supabase
          .from('phase2_panels')
          .select(
            'id,coordinator_id,jury_name,jury_designation'
          ),

        supabase
          .from('phase2_team_assignments')
          .select('team_id,panel_id'),

        supabase
          .from('phase2_decisions')
          .select(
            'team_id,decision,submitted_at,coordinator_id'
          ),
      ]);

      if (shortlistRes.error) throw shortlistRes.error;
      if (facultyRes.error) throw facultyRes.error;
      if (panelRes.error) throw panelRes.error;
      if (assignmentRes.error) throw assignmentRes.error;
      if (decisionRes.error) throw decisionRes.error;

      const shortlists = shortlistRes.data ?? [];
      const faculty = facultyRes.data ?? [];
      const panels = panelRes.data ?? [];
      const assignments = assignmentRes.data ?? [];
      const decisions = decisionRes.data ?? [];

      // Build the confirmed Phase 1 shortlist.
      const shortlistOwner = new Map<string, string>();
      const teamIds = new Set<string>();

      shortlists.forEach((row: any) => {
        (row.selected_team_ids ?? []).forEach((id: string) => {
          teamIds.add(id);

          if (!shortlistOwner.has(id)) {
            shortlistOwner.set(id, row.faculty_id);
          }
        });
      });

      if (teamIds.size === 0) {
        setTeams([]);
        setLastUpdated(new Date().toISOString());
        return;
      }

      const ids = Array.from(teamIds);

      const [
        teamRes,
      ] = await Promise.all([
        supabase
          .from('teams')
          .select(
            'id,team_code,team_name,leader_student_id'
          )
          .in('id', ids),

        supabase
          .from('students')
          .select('id,name,email')
          .in(
            'id',
            Array.from(
              new Set(
                (await Promise.resolve([] as string[]))
                  .concat(
                    []
                  )
              )
            )
          ),
      ]);

      if (teamRes.error) throw teamRes.error;

      // Fetch the actual leaders after the team records are available.
      const leaderIds = Array.from(
        new Set(
          (teamRes.data ?? []).map(
            (team: any) => team.leader_student_id
          )
        )
      );

      const { data: leaderRows, error: leaderError } =
        leaderIds.length > 0
          ? await supabase
              .from('students')
              .select('id,name,email')
              .in('id', leaderIds)
          : { data: [], error: null };

      if (leaderError) throw leaderError;

      const facultyMap = new Map(
        faculty.map((f: any) => [f.id, f.name])
      );

      const panelMap = new Map(
        panels.map((p: any) => [p.id, p])
      );

      const assignmentMap = new Map(
        assignments.map((a: any) => [a.team_id, a.panel_id])
      );

      const decisionMap = new Map(
        decisions.map((d: any) => [d.team_id, d])
      );

      const leaderMap = new Map(
        (leaderRows ?? []).map((s: any) => [s.id, s])
      );

      const mapped: ResultTeam[] = (teamRes.data ?? []).map(
        (team: any) => {
          const panelId = assignmentMap.get(team.id);
          const panel: any = panelId
            ? panelMap.get(panelId)
            : null;

          const leader: any = leaderMap.get(
            team.leader_student_id
          );

          const decision: any = decisionMap.get(team.id);

          return {
            id: team.id,
            team_code: team.team_code,
            team_name: team.team_name,
            leader_student_id: team.leader_student_id,
            leader_name: leader?.name ?? 'Not available',
            leader_email: leader?.email ?? 'Not available',
            coordinator_name: panel
              ? String(facultyMap.get(panel.coordinator_id) ?? 'Unknown')
              : 'Not assigned',
            jury_name: panel?.jury_name?.trim() || 'Not configured',
            decision: decision?.decision ?? null,
            submitted_at: decision?.submitted_at ?? null,
          };
        }
      );

      mapped.sort((a, b) =>
        a.team_code.localeCompare(b.team_code)
      );

      setTeams(mapped);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Phase 2 results loading error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load Phase 2 results.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const coordinators = useMemo(
    () =>
      Array.from(
        new Set(teams.map((t) => t.coordinator_name))
      ).sort(),
    [teams]
  );

  const counts = useMemo(
    () => ({
      total: teams.length,
      selected: teams.filter(
        (t) => t.decision === 'selected'
      ).length,
      rejected: teams.filter(
        (t) => t.decision === 'not_selected'
      ).length,
      pending: teams.filter((t) => !t.decision).length,
    }),
    [teams]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesSearch =
        !q ||
        [
          team.team_code,
          team.team_name,
          team.leader_name,
          team.leader_email,
          team.coordinator_name,
          team.jury_name,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'selected' &&
          team.decision === 'selected') ||
        (statusFilter === 'not_selected' &&
          team.decision === 'not_selected') ||
        (statusFilter === 'pending' && !team.decision);

      const matchesCoordinator =
        coordinatorFilter === 'all' ||
        team.coordinator_name === coordinatorFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCoordinator
      );
    });
  }, [teams, search, statusFilter, coordinatorFilter]);


const exportSelectedPDF = () => {
  const selectedTeams = teams
    .filter((team) => team.decision === 'selected')
    .sort((a, b) => a.team_code.localeCompare(b.team_code));

  if (selectedTeams.length === 0) {
    alert('No selected teams are available for PDF export.');
    return;
  }

  const escapeHTML = (value: string) =>
    value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char] ?? char);

  const rows = selectedTeams.map((team, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${escapeHTML(team.team_code)}</strong></td>
      <td>${escapeHTML(team.team_name)}</td>
      <td>${escapeHTML(team.leader_name)}</td>
      <td>${escapeHTML(team.leader_email)}</td>
      <td>${escapeHTML(team.coordinator_name)}</td>
      <td>${escapeHTML(team.jury_name)}</td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow pop-ups to download the PDF.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>NIErnaya 2026 - Selected Teams</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          color: #172033;
          padding: 10px;
        }

        .header {
          text-align: center;
          border-bottom: 3px solid #FF7A30;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .header h1 {
          margin: 0;
          font-size: 27px;
          letter-spacing: 1px;
        }

        .header h2 {
          margin: 8px 0;
          font-size: 17px;
          color: #FF7A30;
        }

        .header p {
          margin: 5px;
          font-size: 11px;
          color: #64748b;
        }

        .summary {
          margin: 15px 0;
          padding: 12px;
          background: #f1f5f9;
          border-left: 4px solid #FF7A30;
          font-size: 13px;
          font-weight: bold;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }

        thead {
          display: table-header-group;
        }

        th {
          background: #101a29;
          color: white;
          padding: 10px 7px;
          text-align: left;
        }

        td {
          padding: 9px 7px;
          border: 1px solid #dce2e9;
          overflow-wrap: anywhere;
        }

        tr {
          break-inside: avoid;
        }

        tbody tr:nth-child(even) {
          background: #f1f5f9;
        }

        .footer {
          margin-top: 25px;
          padding-top: 12px;
          border-top: 1px solid #cbd5e1;
          text-align: center;
          font-size: 10px;
          color: #64748b;
        }

        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>

    <body>
      <div class="header">
        <h1>NIERNAYA 2026</h1>
        <h2>PHASE 2 – SELECTED TEAMS</h2>
        <p>The National Institute of Engineering, Mysuru</p>
        <p>Department of Computer Science and Engineering</p>
      </div>

      <div class="summary">
        TOTAL SELECTED TEAMS: ${selectedTeams.length}
      </div>

      <table>
        <thead>
          <tr>
            <th>Sl. No.</th>
            <th>Team ID</th>
            <th>Team Name</th>
            <th>Team Leader</th>
            <th>Leader Email</th>
            <th>Faculty Coordinator</th>
            <th>Jury Member</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="footer">
        Official Phase 2 Selection List | NIErnaya 2026
        <br/>
        Generated on ${new Date().toLocaleString('en-IN')}
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
};


  const decisionBadge = (decision: ResultTeam['decision']) => {
    if (decision === 'selected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Selected
        </span>
      );
    }

    if (decision === 'not_selected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
          <XCircle className="w-3.5 h-3.5" />
          Not Selected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono font-bold tracking-widest text-[#FF7A30]">
            ADMIN / PHASE 2 / FINAL RESULTS
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">
            Phase 2 Results
          </h1>

          <p className="mt-2 text-sm text-[#8B96A5]">
            Review shortlisted teams and final decisions submitted by their assigned faculty coordinators.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadResults()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#121A23] px-4 py-3 text-xs font-bold text-white hover:border-[#36D9FF]/50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
  type="button"
  onClick={exportSelectedPDF}
  disabled={!teams.some((team) => team.decision === 'selected')}
  className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A30] px-4 py-3 text-xs font-bold text-[#07090D] hover:bg-[#FF8C4B] disabled:opacity-40"
>
  <Download className="w-4 h-4" />
  Download Selected Teams PDF
</button>

        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="mr-2 inline w-4 h-4" />
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-[#0D1219] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8B96A5]">Shortlisted Teams</p>
            <Users className="w-4 h-4 text-[#36D9FF]" />
          </div>
          <p className="mt-3 text-3xl font-black text-white">{counts.total}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#0D1219] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8B96A5]">Selected</p>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-300">{counts.selected}</p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-[#0D1219] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8B96A5]">Not Selected</p>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="mt-3 text-3xl font-black text-red-300">{counts.rejected}</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-[#0D1219] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#8B96A5]">Pending Decisions</p>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-black text-amber-300">{counts.pending}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">
              Shortlisted Team Records
            </h2>
            <p className="mt-1 text-xs text-[#8B96A5]">
              Showing {filtered.length} of {teams.length} teams.
            </p>
          </div>

          {lastUpdated && (
            <p className="text-[10px] text-[#8B96A5] font-mono">
              UPDATED: {new Date(lastUpdated).toLocaleString('en-IN')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="relative">
            <span className="sr-only">Search team records</span>
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#8B96A5]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team, leader or email..."
              className="w-full rounded-xl border border-white/10 bg-[#0D1219] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-[#36D9FF]"
            />
          </label>

          <label>
            <span className="sr-only">Filter by decision</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full rounded-xl border border-white/10 bg-[#0D1219] px-3 py-2.5 text-sm text-white"
            >
              <option value="all">All decisions</option>
              <option value="selected">Selected</option>
              <option value="not_selected">Not Selected</option>
              <option value="pending">Pending</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Filter by coordinator</span>
            <select
              value={coordinatorFilter}
              onChange={(e) => setCoordinatorFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0D1219] px-3 py-2.5 text-sm text-white"
            >
              <option value="all">All coordinators</option>
              {coordinators.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1219]">
          {loading ? (
            <div className="p-12 text-center text-sm text-[#8B96A5]">
              <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin text-[#36D9FF]" />
              Loading Phase 2 results...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-[#8B96A5]" />
              <p className="font-bold text-white">No teams found</p>
              <p className="mt-1 text-xs text-[#8B96A5]">
                Check your filters or confirm the Phase 1 shortlist.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-[#121A23] text-[11px] uppercase tracking-wider text-[#8B96A5]">
                  <tr>
                    <th className="p-4">Team ID</th>
                    <th className="p-4">Team Name</th>
                    <th className="p-4">Team Leader</th>
                    <th className="p-4">Leader Email</th>
                    <th className="p-4">Faculty Coordinator</th>
                    <th className="p-4">Jury Member</th>
                    <th className="p-4">Final Decision</th>
                    <th className="p-4">Submitted At</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filtered.map((team) => (
                    <tr
                      key={team.id}
                      className="transition hover:bg-white/[0.025]"
                    >
                      <td className="p-4">
                        <span className="font-mono font-bold text-[#36D9FF]">
                          {team.team_code}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-white">
                          {team.team_name}
                        </span>
                      </td>

                      <td className="p-4 text-[#D6DCE5]">
                        {team.leader_name}
                      </td>

                      <td className="p-4 text-xs text-[#8B96A5]">
                        {team.leader_email}
                      </td>

                      <td className="p-4 text-[#D6DCE5]">
                        {team.coordinator_name}
                      </td>

                      <td className="p-4 text-[#8B96A5]">
                        {team.jury_name}
                      </td>

                      <td className="p-4">
                        {decisionBadge(team.decision)}
                      </td>

                      <td className="p-4 text-xs text-[#8B96A5]">
                        {team.submitted_at
                          ? new Date(team.submitted_at).toLocaleString('en-IN')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminPhase2ResultsPage;
