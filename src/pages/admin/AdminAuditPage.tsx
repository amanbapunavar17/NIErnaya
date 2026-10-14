import React, { useEffect, useState } from 'react';
import {
  History,
  Shield,
  Activity,
  Terminal,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type ActorProfile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

type AuditLogDisplay = AuditLogRow & {
  actor: string;
};

export const AdminAuditPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /*
   * ------------------------------------------------------------
   * LOAD AUDIT LOGS
   * ------------------------------------------------------------
   */

  const loadAuditLogs = async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select(
          `
            id,
            actor_id,
            action,
            entity_type,
            entity_id,
            details,
            created_at
          `
        )
        .order('created_at', { ascending: false });

      if (logsError) {
        throw logsError;
      }

      const auditRows = (logs || []) as AuditLogRow[];

      /*
       * Fetch actor profiles separately.
       *
       * We intentionally do not depend on a foreign-table
       * relationship here because actor_id references auth.users
       * while profiles contains the public profile information.
       */

      const actorIds = Array.from(
        new Set(
          auditRows
            .map((log) => log.actor_id)
            .filter(
              (id): id is string =>
                Boolean(id)
            )
        )
      );

      let profiles: ActorProfile[] = [];

      if (actorIds.length > 0) {
        const { data: profileData, error: profileError } =
          await supabase
            .from('profiles')
            .select('id, name, email, role')
            .in('id', actorIds);

        if (profileError) {
          throw profileError;
        }

        profiles = (profileData || []) as ActorProfile[];
      }

      const displayRows: AuditLogDisplay[] =
        auditRows.map((log) => {
          const profile = profiles.find(
            (item) => item.id === log.actor_id
          );

          let actor = 'SYSTEM';

          if (profile) {
            actor =
              profile.name ||
              profile.email ||
              'Authenticated User';
          } else if (log.actor_id) {
            actor = log.actor_id;
          }

          return {
            ...log,
            actor,
          };
        });

      setAuditLogs(displayRows);
    } catch (err: any) {
      console.error(
        'Audit log loading error:',
        err
      );

      setError(
        err?.message ||
          'Failed to load audit logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  /*
   * ------------------------------------------------------------
   * HELPERS
   * ------------------------------------------------------------
   */

  const formatTimestamp = (
    timestamp: string
  ) => {
    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  };

  const formatDetails = (
    details: Record<string, unknown> | null
  ) => {
    if (!details) {
      return '—';
    }

    try {
      return JSON.stringify(details);
    } catch {
      return 'Unable to display metadata';
    }
  };

  const getActionClass = (
    action: string
  ) => {
    const normalized =
      action.toUpperCase();

    if (
      normalized.includes('DELETE') ||
      normalized.includes('REMOVE') ||
      normalized.includes('REJECT')
    ) {
      return 'text-red-400';
    }

    if (
      normalized.includes('PUBLISH') ||
      normalized.includes('CREATE') ||
      normalized.includes('ADD')
    ) {
      return 'text-green-400';
    }

    if (
      normalized.includes('UPDATE') ||
      normalized.includes('EDIT') ||
      normalized.includes('ASSIGN')
    ) {
      return 'text-[#FF7A30]';
    }

    return 'text-[#36D9FF]';
  };

  /*
   * ------------------------------------------------------------
   * REFRESH
   * ------------------------------------------------------------
   */

  const handleRefresh = async () => {
    setSuccess(null);
    await loadAuditLogs();

    if (!error) {
      setSuccess('Audit trail refreshed.');
      setTimeout(
        () => setSuccess(null),
        2500
      );
    }
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

        <div>
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#36D9FF]/10 border border-[#36D9FF]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#36D9FF]" />
            </div>

            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
                System Action & Audit Log Trail ({auditLogs.length})
              </h1>

              <p className="text-xs text-[#8B96A5]">
                Chronological telemetry recording administrative
                and authenticated system operations.
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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
          <CheckCircle className="w-4 h-4" />
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

      {/* SUMMARY BAR */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
            <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
              <History className="w-3.5 h-3.5" />
              TOTAL EVENTS
            </div>

            <div className="text-white text-xl font-display font-bold mt-2">
              {auditLogs.length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
            <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
              <Activity className="w-3.5 h-3.5" />
              LATEST ACTIVITY
            </div>

            <div className="text-white text-xs font-mono mt-2">
              {auditLogs.length > 0
                ? formatTimestamp(
                    auditLogs[0].created_at
                  )
                : 'No activity'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
            <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
              <Terminal className="w-3.5 h-3.5" />
              DATA SOURCE
            </div>

            <div className="text-green-400 text-xs font-mono font-bold mt-2">
              SUPABASE AUDIT LOGS
            </div>
          </div>

        </div>
      )}

      {/* AUDIT TABLE */}
      <div className="rounded-2xl bg-[#0D1219] border border-white/10 overflow-hidden shadow-xl">

        {loading ? (
          <div className="min-h-[350px] flex items-center justify-center">
            <div className="flex items-center gap-3 text-[#8B96A5] text-xs font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              LOADING AUDIT TELEMETRY...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs font-mono">

              <thead className="bg-[#121A23] text-[#8B96A5] uppercase border-b border-white/5">
                <tr>
                  <th className="p-4 whitespace-nowrap">
                    Timestamp
                  </th>

                  <th className="p-4 whitespace-nowrap">
                    Action
                  </th>

                  <th className="p-4 whitespace-nowrap">
                    Actor
                  </th>

                  <th className="p-4 whitespace-nowrap">
                    Target Entity
                  </th>

                  <th className="p-4 min-w-[280px]">
                    Details / Metadata
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-[#F5F7FA]">

                {auditLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">

                        <Shield className="w-8 h-8 text-[#374151]" />

                        <div className="text-[#8B96A5]">
                          No audit records registered yet.
                        </div>

                        <div className="text-[#4B5563] text-[10px]">
                          Administrative actions will appear
                          here automatically.
                        </div>

                      </div>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#121A23]/50 transition-colors"
                    >

                      {/* TIMESTAMP */}
                      <td className="p-4 text-[11px] text-[#8B96A5] whitespace-nowrap align-top">
                        {formatTimestamp(
                          log.created_at
                        )}
                      </td>

                      {/* ACTION */}
                      <td
                        className={`p-4 font-bold whitespace-nowrap align-top ${getActionClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </td>

                      {/* ACTOR */}
                      <td className="p-4 text-white align-top">
                        <div className="font-bold">
                          {log.actor}
                        </div>

                        {log.actor_id && (
                          <div className="text-[9px] text-[#4B5563] mt-1 max-w-[150px] truncate">
                            {log.actor_id}
                          </div>
                        )}
                      </td>

                      {/* ENTITY */}
                      <td className="p-4 text-[#36D9FF] align-top">
                        <div>
                          {log.entity_type ||
                            'SYSTEM'}
                        </div>

                        {log.entity_id && (
                          <div className="text-[9px] text-[#4B5563] mt-1 max-w-[180px] truncate">
                            {log.entity_id}
                          </div>
                        )}
                      </td>

                      {/* DETAILS */}
                      <td className="p-4 align-top">
                        <div
                          className="text-[11px] text-[#8B96A5] max-w-[420px] whitespace-pre-wrap break-all"
                          title={formatDetails(
                            log.details
                          )}
                        >
                          {formatDetails(
                            log.details
                          )}
                        </div>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default AdminAuditPage;