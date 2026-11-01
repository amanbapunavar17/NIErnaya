import React, { useCallback, useEffect, useState } from 'react';
import {
  Download,
  RefreshCw,
  AlertCircle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../../lib/supabase/client';

type Shortlist = {
  id: string;
  faculty_id: string;
  assigned_team_count: number;
  required_selection_count: number;
  selected_team_ids: string[];
  confirmed_at: string;
};

type Team = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  problem_statement: string | null;
  selected_sdg: number | null;
};

type Evaluation = {
  team_id: string;
  faculty_id: string;
  dataset_relevance: number;
  dataset_quality: number;
  authenticity_credibility: number;
  data_volume_diversity: number;
  analytical_potential: number;
  sdg_relevance: number;
  total_marks: number;
};

type Item = {
  team: Team;
  facultyName: string;
  leaderName: string;
  marks: Evaluation | null;
  confirmedAt: string;
};

export const AdminPhase1ShortlistPage: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

  const [facultyStatus, setFacultyStatus] = useState<
    {
      name: string;
      submitted: boolean;
      selected: number;
      required: number;
    }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [
        { data: shortlists, error: shErr },
        { data: faculty, error: fErr },
        { data: evaluations, error: eErr },
      ] = await Promise.all([
        supabase
          .from('phase1_faculty_shortlists')
          .select(
            'id,faculty_id,assigned_team_count,required_selection_count,selected_team_ids,confirmed_at'
          )
          .order('confirmed_at'),

        supabase
          .from('faculty')
          .select('id,name')
          .eq('active', true)
          .order('name'),

        supabase
          .from('phase1_evaluations')
          .select(
            'team_id,faculty_id,dataset_relevance,dataset_quality,authenticity_credibility,data_volume_diversity,analytical_potential,sdg_relevance,total_marks'
          ),
      ]);

      if (shErr) throw shErr;
      if (fErr) throw fErr;
      if (eErr) throw eErr;

      const short = (shortlists ?? []) as Shortlist[];
      const fac = faculty ?? [];

      const ids = Array.from(
        new Set(
          short.flatMap((s) => s.selected_team_ids ?? [])
        )
      );

      const { data: teams, error: tErr } = ids.length
        ? await supabase
            .from('teams')
            .select(
              'id,team_code,team_name,leader_student_id,problem_statement,selected_sdg'
            )
            .in('id', ids)
        : { data: [], error: null };

      if (tErr) throw tErr;

      const teamRows = (teams ?? []) as Team[];

      const leaderIds = teamRows
        .map((t) => t.leader_student_id)
        .filter(Boolean);

      const { data: students, error: stErr } = leaderIds.length
        ? await supabase
            .from('students')
            .select('id,name')
            .in('id', leaderIds)
        : { data: [], error: null };

      if (stErr) throw stErr;

      const evalRows = (evaluations ?? []) as Evaluation[];

      const result: Item[] = [];

      for (const s of short) {
        for (const id of s.selected_team_ids ?? []) {
          const team = teamRows.find((t) => t.id === id);

          if (!team) continue;

          result.push({
            team,
            facultyName:
              fac.find((f) => f.id === s.faculty_id)?.name ??
              'Unknown faculty',

            leaderName:
              students?.find(
                (st) => st.id === team.leader_student_id
              )?.name ?? 'Not available',

            marks:
              evalRows.find(
                (e) =>
                  e.team_id === id &&
                  e.faculty_id === s.faculty_id
              ) ?? null,

            confirmedAt: s.confirmed_at,
          });
        }
      }

      result.sort(
        (a, b) =>
          (b.marks?.total_marks ?? -1) -
          (a.marks?.total_marks ?? -1)
      );

      setItems(result);

      setFacultyStatus(
        fac.map((f) => {
          const s = short.find(
            (x) => x.faculty_id === f.id
          );

          return {
            name: f.name ?? 'Faculty',
            submitted: Boolean(s),
            selected: s?.selected_team_ids?.length ?? 0,
            required: s?.required_selection_count ?? 0,
          };
        })
      );
    } catch (e: any) {
      setError(
        e?.message ??
          'Unable to load consolidated shortlist.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadPdf = () => {
    if (!items.length) return;

    setExporting(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      doc.setFontSize(18);

      doc.text(
        'NIErnaya 2026 - Phase 1 Shortlisted Teams',
        14,
        16
      );

      doc.setFontSize(9);

      doc.text(
        `Confirmed faculty shortlists: ${
          facultyStatus.filter((f) => f.submitted).length
        }/${facultyStatus.length} | Teams: ${items.length}`,
        14,
        23
      );

      let y = 33;

      const headers = [
        '#',
        'Team Code / Name',
        'Team Leader',
        'Faculty',
        'Marks / 50',
        'SDG',
      ];

      const widths = [10, 75, 40, 48, 25, 20];

      let x = 14;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      headers.forEach((h, i) => {
        doc.text(h, x, y);
        x += widths[i];
      });

      y += 5;

      doc.line(14, y, 282, y);

      y += 6;

      doc.setFont('helvetica', 'normal');

      items.forEach((it, index) => {
        if (y > 190) {
          doc.addPage();
          y = 18;
        }

        const vals = [
          String(index + 1),
          `${it.team.team_code} - ${it.team.team_name}`,
          it.leaderName,
          it.facultyName,
          `${it.marks?.total_marks ?? '—'}/50`,
          String(it.team.selected_sdg ?? '—'),
        ];

        x = 14;

        vals.forEach((v, i) => {
          doc.text(
            doc.splitTextToSize(v, widths[i] - 3)[0] ?? '',
            x,
            y
          );

          x += widths[i];
        });

        y += 7;
      });

      doc.save(
        'NIErnaya_Phase1_Shortlisted_Teams.pdf'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-[#36D9FF]">
            ADMIN / PHASE 1
          </p>

          <h1 className="text-2xl font-black text-white mt-1">
            Faculty Shortlists
          </h1>

          <p className="text-sm text-[#8B96A5] mt-1">
            Consolidated teams confirmed by the seven faculty
            evaluators.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-white/10 text-white text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={downloadPdf}
            disabled={!items.length || exporting}
            className="px-3 py-2 rounded-lg bg-[#36D9FF] text-[#07090D] text-sm font-bold flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />

            {exporting
              ? 'Preparing...'
              : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center text-[#8B96A5] py-16">
          Loading faculty submissions...
        </p>
      ) : (
        <>
          {/* Statistics */}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">
              <p className="text-xs text-[#8B96A5]">
                Faculty confirmed
              </p>

              <p className="text-2xl font-bold text-white">
                {
                  facultyStatus.filter((f) => f.submitted)
                    .length
                }
                /{facultyStatus.length}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">
              <p className="text-xs text-[#8B96A5]">
                Shortlisted teams
              </p>

              <p className="text-2xl font-bold text-white">
                {items.length}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">
              <p className="text-xs text-[#8B96A5]">
                Pending faculty
              </p>

              <p className="text-2xl font-bold text-white">
                {
                  facultyStatus.filter((f) => !f.submitted)
                    .length
                }
              </p>
            </div>
          </div>

          {/* Faculty status */}

          <section className="rounded-2xl bg-[#0D1219] border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-bold text-white">
                Faculty submission status
              </h2>
            </div>

            <div className="divide-y divide-white/5">
              {facultyStatus.map((f) => (
                <div
                  key={f.name}
                  className="p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-white text-sm">
                    {f.submitted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Users className="w-4 h-4 text-amber-400" />
                    )}

                    {f.name}
                  </div>

                  <span
                    className={`text-xs ${
                      f.submitted
                        ? 'text-green-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {f.submitted
                      ? `${f.selected} selected (base ${f.required})`
                      : 'Awaiting confirmation'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Consolidated shortlist */}

          <section className="rounded-2xl bg-[#0D1219] border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-bold text-white">
                Consolidated shortlisted teams
              </h2>

              <p className="text-xs text-[#8B96A5] mt-1">
                Only teams in confirmed faculty shortlists appear
                here.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[#8B96A5] bg-black/20">
                  <tr>
                    {[
                      'Team',
                      'Leader',
                      'Faculty',
                      'Marks',
                      'SDG',
                    ].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {items.map((it) => (
                    <tr
                      key={`${it.team.id}-${it.facultyName}`}
                    >
                      <td className="p-3">
                        <p className="text-white font-semibold">
                          {it.team.team_name}
                        </p>

                        <p className="text-xs text-[#8B96A5]">
                          {it.team.team_code}
                        </p>

                        {it.marks && (
                          <p className="text-[10px] text-[#8B96A5] mt-1">
                            Relevance {it.marks.dataset_relevance}/12
                            {' · '}Quality {it.marks.dataset_quality}/10
                            {' · '}Authenticity {it.marks.authenticity_credibility}/8
                            {' · '}Volume {it.marks.data_volume_diversity}/5
                            {' · '}EDA {it.marks.analytical_potential}/10
                            {' · '}SDG {it.marks.sdg_relevance}/5
                          </p>
                        )}
                      </td>

                      <td className="p-3 text-[#C5CCD5]">
                        {it.leaderName}
                      </td>

                      <td className="p-3 text-[#C5CCD5]">
                        {it.facultyName}
                      </td>

                      <td className="p-3 text-white font-bold">
                        {it.marks?.total_marks ?? '—'}/50
                      </td>

                      <td className="p-3 text-[#C5CCD5]">
                        {it.team.selected_sdg ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!items.length && (
                <p className="p-8 text-center text-sm text-[#8B96A5]">
                  No faculty shortlists have been confirmed yet.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminPhase1ShortlistPage;