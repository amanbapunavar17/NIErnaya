import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Shuffle, 
  UploadCloud, 
  FileText, 
  Activity, 
  Building, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useHackathonStore } from '../../lib/store/hackathonStore';
import { ReportService } from '../../lib/services/reportService';

export const AdminDashboard: React.FC = () => {
  const store = useHackathonStore();
  const stats = store.getLiveStats();
  const faculty = store.getFaculty();
  const auditLogs = store.getAuditLogs();

  const handleQuickAllocation = () => {
    try {
      const res = store.autoAllocateTeamsToFaculty('Admin Officer');
      alert(`Auto-allocation completed across 8 faculty members for ${res.allocationsCount} teams.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Welcome & Quick Actions */}
      <div className="p-8 rounded-3xl bg-[#0D1219] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#36D9FF]/10 border border-[#36D9FF]/30 text-[#36D9FF] font-mono text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>COMMAND CONTROL ACTIVE</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-white">
            NIErnaya Control Room
          </h1>
          <p className="text-xs sm:text-sm text-[#8B96A5]">
            Central command for registration locking, faculty balanced allocation, submission auditing, and reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleQuickAllocation}
            className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#9d74f8] text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#8B5CF6]/20"
          >
            <Shuffle className="w-4 h-4" />
            <span>AUTO-ALLOCATE FACULTY</span>
          </button>
          <button
            onClick={() => ReportService.downloadReportPDF()}
            className="px-4 py-2.5 rounded-xl bg-[#36D9FF] hover:bg-[#5ce1ff] text-[#07090D] font-mono text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#36D9FF]/20"
          >
            <FileText className="w-4 h-4" />
            <span>GENERATE REPORT</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[#8B96A5] text-xs font-mono">
            <span>REGISTERED SQUADS</span>
            <Users className="w-4 h-4 text-[#36D9FF]" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-white">{stats.registered_teams}</div>
          <div className="text-[11px] font-mono text-[#8B96A5]">{stats.total_participants} Verified Students</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[#8B96A5] text-xs font-mono">
            <span>FACULTY COMMITTEE</span>
            <GraduationCap className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-white">{faculty.length}</div>
          <div className="text-[11px] font-mono text-[#8B96A5]">Active Faculty Mentors (NIE)</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[#8B96A5] text-xs font-mono">
            <span>SUBMISSIONS FILED</span>
            <UploadCloud className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="font-display font-black text-3xl sm:text-4xl text-white">{stats.submissions_count}</div>
          <div className="text-[11px] font-mono text-[#8B96A5]">Phase 1 Presentation Decks</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[#8B96A5] text-xs font-mono">
            <span>CAMPUS SPLIT</span>
            <Building className="w-4 h-4 text-[#FF7A30]" />
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            {stats.north_campus_teams}N / {stats.south_campus_teams}S
          </div>
          <div className="text-[11px] font-mono text-[#8B96A5]">North (CSE/AIML) vs South</div>
        </div>
      </div>

      {/* Control Room Module Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Teams Management Card */}
        <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white mb-1">Squads & Registrations</h3>
            <p className="text-xs text-[#8B96A5]">
              Inspect member rosters, toggle lock status, override USNs, or inspect contact records.
            </p>
          </div>
          <Link
            to="/admin/teams"
            className="text-xs font-mono text-[#FF7A30] hover:underline font-bold inline-flex items-center gap-1.5"
          >
            <span>Manage All Squads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Balanced Faculty Allocation Card */}
        <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white mb-1">Faculty Allocation Engine</h3>
            <p className="text-xs text-[#8B96A5]">
              Run balanced distribution (max diff ≤ 1) across the 8 faculty members or assign manually.
            </p>
          </div>
          <Link
            to="/admin/allocation"
            className="text-xs font-mono text-[#8B5CF6] hover:underline font-bold inline-flex items-center gap-1.5"
          >
            <span>Launch Allocation Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Content CMS & Settings */}
        <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-white mb-1">Live Website CMS</h3>
            <p className="text-xs text-[#8B96A5]">
              Update rules, event timeline settings, prize amounts, WhatsApp broadcast link, and announcements.
            </p>
          </div>
          <Link
            to="/admin/content"
            className="text-xs font-mono text-[#36D9FF] hover:underline font-bold inline-flex items-center gap-1.5"
          >
            <span>Open Content Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Recent Chronological Audit Trail */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#36D9FF]" />
            <span>Recent System Actions & Audit Trail</span>
          </h3>
          <Link to="/admin/audit" className="text-xs font-mono text-[#8B96A5] hover:text-white">
            View All Logs ›
          </Link>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-[#8B96A5]">
            No administrative events recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-[#121A23] border border-white/5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-[#FF7A30] font-bold">[{log.action}]</span>
                  <span className="text-white">{log.actor}</span>
                  <span className="text-[#8B96A5]">on {log.entity}</span>
                </div>
                <span className="text-[#8B96A5] text-[10px]">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default AdminDashboard;