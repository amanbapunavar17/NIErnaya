import React, { useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  Plus,
  Trash2,
  CheckCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
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
  published_at?: string | null;
  created_at?: string;
};

export const AdminResultsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [position, setPosition] = useState('1ST PLACE — WINNER');
  const [prizeTitle, setPrizeTitle] = useState('Grand Champion — ₹5,000 Cash');

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /*
   * ------------------------------------------------------------
   * LOAD DATA
   * ------------------------------------------------------------
   */

  const loadData = async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        { data: teamData, error: teamError },
        { data: studentData, error: studentError },
        { data: resultData, error: resultError },
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
          .order('team_code', { ascending: true }),

        supabase
          .from('students')
          .select('id, name, usn'),

        supabase.rpc('get_all_results'),
      ]);

      if (teamError) throw teamError;
      if (studentError) throw studentError;
      if (resultError) throw resultError;

      setTeams((teamData || []) as TeamRow[]);
      setStudents((studentData || []) as StudentRow[]);
setResults(
  (resultData || []).map((row: any) => ({
    ...row,
    id: row.id ?? row.result_id,
  })) as ResultRow[]
);    } catch (err: any) {
      console.error('Admin results load error:', err);
      setError(err?.message || 'Failed to load results data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * ------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------
   */

  const getLeader = (leaderStudentId: string) => {
    return students.find((student) => student.id === leaderStudentId);
  };

  const availableTeams = useMemo(() => {
    const publishedTeamIds = new Set(results.map((result) => result.team_id));

    return teams.filter(
      (team) =>
        team.registration_status !== 'draft' &&
        !publishedTeamIds.has(team.id)
    );
  }, [teams, results]);

  /*
   * ------------------------------------------------------------
   * UI STATUS MESSAGES
   * ------------------------------------------------------------
   */

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3500);
  };

  /*
   * ------------------------------------------------------------
   * PUBLISH RESULT
   * ------------------------------------------------------------
   */

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    if (!selectedTeamId) {
      setError('Please select a valid team.');
      return;
    }

    if (!prizeTitle.trim()) {
      setError('Please enter a prize or honor title.');
      return;
    }

    const team = teams.find((t) => t.id === selectedTeamId);

    if (!team) {
      setError('Selected team could not be found.');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc('save_result', {
        p_team_id: team.id,
        p_position: position,
        p_prize_title: prizeTitle.trim(),
        p_published: true,
      });

      if (rpcError) {
        throw rpcError;
      }

      showSuccess(
        `Result published for ${team.team_name}. It is now publicly visible.`
      );

      setSelectedTeamId('');
      setPosition('1ST PLACE — WINNER');
      setPrizeTitle('Grand Champion — ₹5,000 Cash');

      await loadData();
    } catch (err: any) {
      console.error('Publish result error:', err);
      setError(err?.message || 'Failed to publish result.');
    } finally {
      setPublishing(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * DELETE RESULT
   * ------------------------------------------------------------
   */
const handleDelete = async (id: string) => {
  if (!supabase) {
    setError('Supabase is not configured.');
    return;
  }

  // Prevent undefined / empty IDs from ever reaching Supabase.
  if (!id || id === 'undefined' || id === 'null') {
    console.error('Delete result called with invalid ID:', id);
    setError('Unable to delete result: invalid result ID.');
    return;
  }

  const confirmed = window.confirm(
    'Delete this result?\n\nThis will remove the result from the public website and permanently delete the result record.'
  );

  if (!confirmed) return;

  setDeletingId(id);
  setError(null);

  try {
    console.log('Deleting result:', id);

    // Check the current result first.
    const { data: currentResult, error: fetchError } = await supabase
      .from('results')
      .select('id, published')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!currentResult?.id) {
      throw new Error('Result record was not found.');
    }

    // The database protects published results from direct deletion.
    // Unpublish first if necessary.
    if (currentResult.published) {
      const { error: unpublishError } = await supabase.rpc(
        'unpublish_result',
        {
          p_result_id: currentResult.id,
        }
      );

      if (unpublishError) {
        throw unpublishError;
      }
    }

    // Delete using the confirmed UUID.
    const { error: deleteError } = await supabase.rpc('delete_result', {
      p_result_id: currentResult.id,
    });

    if (deleteError) {
      throw deleteError;
    }

    showSuccess('Result deleted successfully.');

    await loadData();
  } catch (err: any) {
    console.error('Delete result error:', err);

    setError(
      err?.message ||
        err?.error_description ||
        'Failed to delete result.'
    );
  } finally {
    setDeletingId(null);
  }
};
  /*
   * ------------------------------------------------------------
   * PUBLISH / UNPUBLISH
   * ------------------------------------------------------------
   */

  const handleTogglePublish = async (result: ResultRow) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setError(null);

    try {
      const rpcName = result.published
        ? 'unpublish_result'
        : 'publish_result';

      const { error: rpcError } = await supabase.rpc(rpcName, {
        p_result_id: result.id,
      });

      if (rpcError) {
        throw rpcError;
      }

      showSuccess(
        result.published
          ? `${result.team_name} has been hidden from the public website.`
          : `${result.team_name} is now publicly visible.`
      );

      await loadData();
    } catch (err: any) {
      console.error('Toggle result visibility error:', err);
      setError(err?.message || 'Failed to update result visibility.');
    }
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Data Detective Challenge Results & Podium Publisher
          </h1>

          <p className="text-xs text-[#8B96A5] mt-1">
            Publish official winners and finalists to the public landing page.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-[#8B96A5] hover:text-white hover:border-white/20 transition-colors flex items-center gap-2 text-xs font-mono"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
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
        <div className="min-h-[300px] flex items-center justify-center rounded-3xl bg-[#0D1219] border border-white/10">
          <div className="flex items-center gap-3 text-[#8B96A5] text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            LOADING RESULTS CONTROL ROOM...
          </div>
        </div>
      ) : (
        <>
          {/* PUBLISH FORM */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-4">

            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FF7A30]" />
              <span>Confer Winning Podium Position</span>
            </h2>

            <p className="text-[11px] text-[#8B96A5] font-mono">
              Results are stored in Supabase and automatically audited.
            </p>

            <form
              onSubmit={handlePublishResult}
              className="p-5 rounded-2xl bg-[#121A23] border border-white/5 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                {/* TEAM */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#8B96A5]">
                    SELECT WINNING SQUAD
                  </label>

                  <select
                    value={selectedTeamId}
                    onChange={(e) => {
                      setSelectedTeamId(e.target.value);
                      setError(null);
                    }}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-xs font-mono text-white"
                  >
                    <option value="">
                      -- Choose Team --
                    </option>

                    {availableTeams.map((team) => {
                      const leader = getLeader(team.leader_student_id);

                      return (
                        <option key={team.id} value={team.id}>
                          [{team.team_code}] {team.team_name}
                          {leader ? ` (${leader.name})` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {availableTeams.length === 0 && (
                    <p className="text-[9px] text-[#8B96A5] font-mono pt-1">
                      No eligible unpublished teams available.
                    </p>
                  )}
                </div>

                {/* POSITION */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#8B96A5]">
                    PODIUM POSITION
                  </label>

                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-xs font-mono text-white"
                  >
                    <option value="1ST PLACE — WINNER">
                      1st Place — Winner
                    </option>

                    <option value="2ND PLACE — 1ST RUNNER UP">
                      2nd Place — 1st Runner Up
                    </option>

                    <option value="3RD PLACE — 2ND RUNNER UP">
                      3rd Place — 2nd Runner Up
                    </option>

                    <option value="SPECIAL JURY MENTION">
                      Special Jury Mention
                    </option>
                  </select>
                </div>

                {/* PRIZE */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#8B96A5]">
                    PRIZE & HONOR TITLE
                  </label>

                  <input
                    type="text"
                    value={prizeTitle}
                    onChange={(e) => setPrizeTitle(e.target.value)}
                    required
                    placeholder="Example: Grand Champion — ₹5,000 Cash"
                    className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-xs font-mono text-white placeholder:text-[#4B5563]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={publishing || availableTeams.length === 0}
                className="px-4 py-2 rounded-xl bg-[#FF7A30] text-[#07090D] font-mono text-xs font-bold hover:bg-[#FF8C4B] transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>PUBLISHING...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>PUBLISH TO PUBLIC VERDICT</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CURRENT RESULTS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  Publicly Declared Results ({results.length})
                </h2>

                <p className="text-[10px] text-[#8B96A5] font-mono mt-1">
                  Manage publication visibility and official result records.
                </p>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-[#121A23] border border-white/5">
                <Trophy className="w-8 h-8 text-[#374151] mx-auto mb-3" />

                <div className="text-[#8B96A5] text-xs font-mono">
                  No results published yet.
                </div>

                <div className="text-[#4B5563] text-[10px] font-mono mt-1">
                  Published results will appear here.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-5 rounded-2xl bg-[#121A23] space-y-3 font-mono text-xs flex flex-col justify-between ${
                      result.published
                        ? 'border border-[#FF7A30]/30'
                        : 'border border-white/10 opacity-70'
                    }`}
                  >

                    <div>
                      {/* TOP BAR */}
                      <div className="flex items-center justify-between gap-2">

                        <span
                          className={`font-bold ${
                            result.published
                              ? 'text-[#FF7A30]'
                              : 'text-[#8B96A5]'
                          }`}
                        >
                          {result.position}
                        </span>

                        <div className="flex items-center gap-2">

                          {/* VISIBILITY */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(result)}
                            title={
                              result.published
                                ? 'Hide from public website'
                                : 'Publish to public website'
                            }
                            className="text-[#8B96A5] hover:text-white transition-colors"
                          >
                            {result.published ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => handleDelete(result.id)}
                            disabled={deletingId === result.id}
                            title="Delete result"
                            className="text-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            {deletingId === result.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                        </div>
                      </div>

                      {/* TEAM */}
                      <h3 className="font-display font-bold text-lg text-white my-1">
                        {result.team_name}
                      </h3>

                      <div className="text-[#36D9FF] text-[11px]">
                        CODE: {result.team_code}
                      </div>

                      <div className="text-[#8B96A5] text-[10px]">
                        Leader: {result.leader_name}
                      </div>

                      <div className="text-[#8B96A5] text-[10px]">
                        {result.campus} Campus
                      </div>
                    </div>

                    {/* PRIZE */}
                    <div className="pt-2 border-t border-white/5">

                      <div className="text-[#10B981] font-bold text-[11px]">
                        {result.prize_title}
                      </div>

                      <div className="mt-1 text-[9px]">
                        {result.published ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            PUBLICLY VISIBLE
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            HIDDEN
                          </span>
                        )}
                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};