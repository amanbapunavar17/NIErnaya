import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Save,
  LockKeyhole,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

type Team = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  problem_statement: string | null;
  selected_sdg: number | null;
};

type Marks = {
  dataset_relevance: number;
  dataset_quality: number;
  authenticity_credibility: number;
  data_volume_diversity: number;
  analytical_potential: number;
  sdg_relevance: number;
};

type Evaluation = Marks & {
  team_id: string;
  total_marks: number;
  updated_at: string;
};

type TeamRow = Team & {
  leaderName: string;
  marks: Evaluation | null;
};

const CRITERIA: {
  key: keyof Marks;
  label: string;
  max: number;
  description: string;
}[] = [
  {
    key: 'dataset_relevance',
    label: 'Dataset relevance to the problem statement',
    max: 12,
    description: 'How closely does the dataset address the stated problem?',
  },
  {
    key: 'dataset_quality',
    label: 'Dataset quality and completeness',
    max: 10,
    description: 'Completeness, consistency, missing values and usability.',
  },
  {
    key: 'authenticity_credibility',
    label: 'Dataset authenticity and source credibility',
    max: 8,
    description: 'Trustworthiness, source, provenance and authenticity.',
  },
  {
    key: 'data_volume_diversity',
    label: 'Data volume and diversity',
    max: 5,
    description: 'Adequate volume, variety and representation.',
  },
  {
    key: 'analytical_potential',
    label: 'Analytical potential for EDA',
    max: 10,
    description: 'Potential to discover patterns, trends and insights.',
  },
  {
    key: 'sdg_relevance',
    label: 'Problem statement and dataset relevance to proper SDG',
    max: 5,
    description: 'Correct and meaningful alignment with the selected SDG.',
  },
];

const emptyMarks: Marks = {
  dataset_relevance: 0,
  dataset_quality: 0,
  authenticity_credibility: 0,
  data_volume_diversity: 0,
  analytical_potential: 0,
  sdg_relevance: 0,
};

const total = (m: Marks) =>
  CRITERIA.reduce((sum, c) => sum + Number(m[c.key] || 0), 0);

const requiredFor = (n: number) =>
  ({ 13: 6, 14: 7, 15: 5, 16: 8 } as Record<number, number>)[n] ?? 0;

export const FacultyPhase1EvaluationPage: React.FC = () => {
  const [rows, setRows] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [draft, setDraft] = useState<Marks>(emptyMarks);

  const required = requiredFor(rows.length);
  const maxAllowed = required ? required + 2 : 0;

  const ranked = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          (b.marks?.total_marks ?? -1) -
          (a.marks?.total_marks ?? -1)
      ),
    [rows]
  );

  const evaluatedCount = rows.filter((r) => r.marks).length;

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: fid, error: fidErr } =
        await supabase.rpc('get_current_faculty_id');

      if (fidErr) throw fidErr;

      if (!fid) {
        throw new Error(
          'Your account is not linked to an active faculty record.'
        );
      }

      const { data: assignments, error: aErr } = await supabase
        .from('faculty_assignments')
        .select('team_id')
        .eq('faculty_id', fid);

      if (aErr) throw aErr;

      const ids = (assignments ?? []).map((x) => x.team_id);

      if (!ids.length) {
        setRows([]);
        return;
      }

      const [
        { data: teams, error: tErr },
        { data: evals, error: eErr },
        { data: shortlist, error: sErr },
      ] = await Promise.all([
        supabase
          .from('teams')
          .select(
            'id,team_code,team_name,leader_student_id,problem_statement,selected_sdg'
          )
          .in('id', ids)
          .order('team_code'),

        supabase
          .from('phase1_evaluations')
          .select(
            'team_id,dataset_relevance,dataset_quality,authenticity_credibility,data_volume_diversity,analytical_potential,sdg_relevance,total_marks,updated_at'
          )
          .eq('faculty_id', fid),

        supabase
          .from('phase1_faculty_shortlists')
          .select('id')
          .eq('faculty_id', fid)
          .maybeSingle(),
      ]);

      if (tErr) throw tErr;
      if (eErr) throw eErr;
      if (sErr) throw sErr;

      const teamRows = teams ?? [];

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

      const evaluationMap = new Map(
        (evals ?? []).map((e) => [e.team_id, e as Evaluation])
      );

      const composed = teamRows.map((t) => ({
        ...t,
        leaderName:
          students?.find((s) => s.id === t.leader_student_id)?.name ??
          'Not available',
        marks: evaluationMap.get(t.id) ?? null,
      })) as TeamRow[];

      setRows(composed);
      setConfirmed(Boolean(shortlist));

      if (!shortlist) {
        const alreadySelected = selected.filter((id) =>
          ids.includes(id)
        );

        setSelected(
          alreadySelected.length ? alreadySelected : []
        );
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unable to load evaluation data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (
      !confirmed &&
      rows.length &&
      evaluatedCount === rows.length &&
      required &&
      selected.length === 0
    ) {
      setSelected(
        ranked.slice(0, required).map((r) => r.id)
      );
    }
  }, [
    confirmed,
    rows,
    evaluatedCount,
    required,
    ranked,
    selected.length,
  ]);

  const openEvaluation = (row: TeamRow) => {
    setEditing(row);

    setDraft(
      row.marks
        ? {
            dataset_relevance: row.marks.dataset_relevance,
            dataset_quality: row.marks.dataset_quality,
            authenticity_credibility:
              row.marks.authenticity_credibility,
            data_volume_diversity:
              row.marks.data_volume_diversity,
            analytical_potential:
              row.marks.analytical_potential,
            sdg_relevance: row.marks.sdg_relevance,
          }
        : emptyMarks
    );
  };

  const saveEvaluation = async () => {
    if (!supabase || !editing) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const args = {
        p_team_id: editing.id,
        p_dataset_relevance: draft.dataset_relevance,
        p_dataset_quality: draft.dataset_quality,
        p_authenticity_credibility:
          draft.authenticity_credibility,
        p_data_volume_diversity:
          draft.data_volume_diversity,
        p_analytical_potential:
          draft.analytical_potential,
        p_sdg_relevance: draft.sdg_relevance,
      };

      const { error: rpcError } = await supabase.rpc(
        'save_phase1_evaluation',
        args
      );

      if (rpcError) throw rpcError;

      setEditing(null);
      setNotice(`Evaluation saved for ${editing.team_name}.`);

      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Could not save evaluation.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  };

  const confirmShortlist = async () => {
    if (!supabase) return;

    if (evaluatedCount !== rows.length) {
      setError('Evaluate every assigned team before confirming.');
      return;
    }

    if (
      selected.length < required ||
      selected.length > maxAllowed
    ) {
      setError(
        `Select between ${required} and ${maxAllowed} teams.`
      );
      return;
    }

    const ok = window.confirm(
      `Confirm ${selected.length} shortlisted teams? This submission will be locked and sent to the admin dashboard.`
    );

    if (!ok) return;

    setConfirming(true);
    setError('');

    try {
      const { error: rpcError } = await supabase.rpc(
        'confirm_phase1_shortlist',
        {
          p_selected_team_ids: selected,
        }
      );

      if (rpcError) throw rpcError;

      setConfirmed(true);

      setNotice(
        'Your shortlist has been confirmed and submitted to the admin dashboard.'
      );
    } catch (e: any) {
      setError(
        e?.message ?? 'Unable to confirm shortlist.'
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-[#8B5CF6]">
            PHASE 1 / DATASET EVALUATION
          </p>

          <h1 className="text-2xl font-black text-white mt-1">
            Faculty Evaluation & Shortlisting
          </h1>

          <p className="text-sm text-[#8B96A5] mt-1">
            Evaluate all assigned teams, review the automatic ranking,
            then confirm your shortlist.
          </p>
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 text-sm">
          {notice}
        </div>
      )}

      {loading ? (
        <p className="text-[#8B96A5] py-16 text-center">
          Loading assigned teams...
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Assigned teams', rows.length],
              ['Evaluated', `${evaluatedCount}/${rows.length}`],
              ['Required selections', required || 'Check allocation'],
              ['Maximum selections', maxAllowed || '—'],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="p-4 rounded-xl bg-[#0D1219] border border-white/10"
              >
                <p className="text-xs text-[#8B96A5]">
                  {label}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {!required && rows.length > 0 && (
            <p className="text-amber-300 text-sm">
              Your allocation has {rows.length} teams. The agreed
              selection rules cover 13, 14, 15 and 16 teams.
              Please contact admin.
            </p>
          )}

          <section className="rounded-2xl border border-white/10 bg-[#0D1219] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">
                  Assigned teams
                </h2>
                <p className="text-xs text-[#8B96A5] mt-1">
                  Marks are calculated automatically out of 50.
                </p>
              </div>

              <span className="text-xs text-[#8B96A5]">
                {evaluatedCount} completed
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="p-4 flex flex-col lg:flex-row lg:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#8B5CF6] font-mono">
                      {row.team_code}
                    </p>

                    <h3 className="text-white font-semibold">
                      {row.team_name}
                    </h3>

                    <p className="text-xs text-[#8B96A5]">
                      Leader: {row.leaderName} · SDG{' '}
                      {row.selected_sdg ?? 'Not specified'}
                    </p>

                    <p className="text-xs text-[#8B96A5] mt-1 line-clamp-2">
                      {row.problem_statement ||
                        'No problem statement available'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right min-w-16">
                      <p className="text-xl font-bold text-white">
                        {row.marks?.total_marks ?? '—'}
                        <span className="text-xs text-[#8B96A5]">
                          /50
                        </span>
                      </p>

                      <p className="text-[10px] text-[#8B96A5]">
                        {row.marks ? 'Evaluated' : 'Pending'}
                      </p>
                    </div>

                    <button
                      disabled={confirmed}
                      onClick={() => openEvaluation(row)}
                      className="px-3 py-2 rounded-lg bg-[#8B5CF6] text-white text-xs font-bold disabled:opacity-40"
                    >
                      {row.marks ? 'Edit marks' : 'Evaluate'}
                    </button>
                  </div>
                </div>
              ))}

              {!rows.length && (
                <p className="p-8 text-center text-sm text-[#8B96A5]">
                  No teams are currently assigned to you.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0D1219] overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-bold text-white">
                Shortlist preview
              </h2>

              <p className="text-xs text-[#8B96A5] mt-1">
                Top {required} by marks are recommended automatically.
                You may select up to 2 additional teams.
              </p>
            </div>

            <div className="p-4 space-y-3">
              {ranked.map((row, index) => {
                const recommended = index < required;
                const checked = selected.includes(row.id);

                return (
                  <label
                    key={row.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      checked
                        ? 'border-[#8B5CF6]/60 bg-[#8B5CF6]/10'
                        : 'border-white/10'
                    } ${!row.marks ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={
                        confirmed ||
                        !row.marks ||
                        evaluatedCount !== rows.length ||
                        (!checked && selected.length >= maxAllowed)
                      }
                      onChange={() => toggleSelection(row.id)}
                      className="w-4 h-4 accent-violet-500"
                    />

                    <span className="flex-1 min-w-0">
                      <span className="text-sm text-white font-medium">
                        {row.team_name}
                      </span>

                      <span className="block text-xs text-[#8B96A5]">
                        {row.team_code} ·{' '}
                        {recommended
                          ? 'Marks-based recommendation'
                          : 'Additional faculty selection'}
                      </span>
                    </span>

                    <span className="font-bold text-white">
                      {row.marks?.total_marks ?? '—'}/50
                    </span>
                  </label>
                );
              })}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <p className="text-sm text-[#8B96A5]">
                  Selected:{' '}
                  <b className="text-white">{selected.length}</b>
                  {' · '}Required {required}
                  {' · '}Maximum {maxAllowed}
                </p>

                <button
                  onClick={() => void confirmShortlist()}
                  disabled={
                    confirmed ||
                    confirming ||
                    !required ||
                    evaluatedCount !== rows.length ||
                    selected.length < required ||
                    selected.length > maxAllowed
                  }
                  className="px-5 py-3 rounded-lg bg-[#8B5CF6] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {confirmed ? (
                    <>
                      <LockKeyhole className="w-4 h-4" />
                      Shortlist confirmed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {confirming
                        ? 'Submitting...'
                        : 'Confirm and submit shortlist'}
                    </>
                  )}
                </button>
              </div>

              {confirmed && (
                <p className="text-xs text-green-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Your confirmed shortlist is locked. Contact admin
                  if a correction is required.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-[#101722] border border-white/10 p-5 sm:p-7 my-auto">
            <div className="flex justify-between gap-3 mb-5">
              <div>
                <p className="text-xs text-[#8B5CF6] font-mono">
                  {editing.team_code}
                </p>

                <h2 className="text-xl font-bold text-white">
                  Evaluate {editing.team_name}
                </h2>

                <p className="text-xs text-[#8B96A5] mt-1">
                  Enter marks for each criterion. Total is calculated
                  automatically.
                </p>
              </div>

              <button
                onClick={() => setEditing(null)}
                className="text-[#8B96A5]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {CRITERIA.map((c) => (
                <div
                  key={c.key}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-2 items-center"
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {c.label}{' '}
                      <span className="text-[#8B96A5]">
                        ({c.max})
                      </span>
                    </p>

                    <p className="text-xs text-[#8B96A5]">
                      {c.description}
                    </p>
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={c.max}
                    step="1"
                    value={draft[c.key]}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        [c.key]: Math.min(
                          c.max,
                          Math.max(
                            0,
                            Number(e.target.value) || 0
                          )
                        ),
                      }))
                    }
                    className="w-full rounded-lg bg-[#07090D] border border-white/10 p-3 text-white"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 rounded-xl bg-black/30 flex justify-between items-center">
              <span className="text-sm text-[#8B96A5]">
                Total obtained
              </span>

              <strong className="text-2xl text-white">
                {total(draft)}
                <span className="text-sm text-[#8B96A5]">
                  {' '}/ 50
                </span>
              </strong>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => void saveEvaluation()}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#8B5CF6] text-white text-sm font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyPhase1EvaluationPage;