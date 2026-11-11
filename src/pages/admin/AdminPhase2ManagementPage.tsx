import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Search, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

type Faculty = { id: string; name: string; designation: string | null; email: string; active: boolean; sort_order: number };
type Panel = { id: string; coordinator_id: string; coordinator_photo_url: string | null; jury_name: string; jury_designation: string; jury_photo_url: string | null };
type Team = { id: string; team_code: string; team_name: string; leader_student_id: string; problem_statement: string | null; selected_sdg: number | null; branch: string; leader_name: string; shortlist_faculty: string; panel_id: string | null; panel_name: string | null; decision: string | null };

export const AdminPhase2ManagementPage: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [panelFilter, setPanelFilter] = useState('all');
  const [coordinatorFilter, setCoordinatorFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Partial<Panel>>>({});

  const load = useCallback(async () => {
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [facultyRes, panelRes, shortlistRes, decisionRes] = await Promise.all([
        supabase.from('faculty').select('id,name,designation,email,active,sort_order').eq('active', true).order('sort_order'),
        supabase.from('phase2_panels').select('id,coordinator_id,coordinator_photo_url,jury_name,jury_designation,jury_photo_url'),
        supabase.from('phase1_faculty_shortlists').select('faculty_id,selected_team_ids,confirmed_at').order('confirmed_at'),
        supabase.from('phase2_decisions').select('team_id,decision')
      ]);
      if (facultyRes.error) throw facultyRes.error;
      if (panelRes.error) throw panelRes.error;
      if (shortlistRes.error) throw shortlistRes.error;
      if (decisionRes.error) throw decisionRes.error;
      const fac = (facultyRes.data ?? []) as Faculty[];
      const pan = (panelRes.data ?? []) as Panel[];
      setFaculty(fac); setPanels(pan);
      const ids = Array.from(new Set((shortlistRes.data ?? []).flatMap((s: any) => s.selected_team_ids ?? [])));
      if (ids.length === 0) { setTeams([]); return; }
      const [teamRes, memberRes, studentRes, assignmentRes] = await Promise.all([
        supabase.from('teams').select('id,team_code,team_name,leader_student_id,problem_statement,selected_sdg').in('id', ids),
        supabase.from('team_members').select('team_id,student_id').in('team_id', ids),
        supabase.from('students').select('id,name,branch').order('name'),
        supabase.from('phase2_team_assignments').select('team_id,panel_id')
      ]);
      if (teamRes.error) throw teamRes.error;
      if (memberRes.error) throw memberRes.error;
      if (studentRes.error) throw studentRes.error;
      if (assignmentRes.error) throw assignmentRes.error;
      const students = new Map((studentRes.data ?? []).map((s: any) => [s.id, s]));
      const assignment = new Map((assignmentRes.data ?? []).map((a: any) => [a.team_id, a.panel_id]));
      const decision = new Map((decisionRes.data ?? []).map((d: any) => [d.team_id, d.decision]));
      const shortlistOwner = new Map<string, string>();
      (shortlistRes.data ?? []).forEach((s: any) => (s.selected_team_ids ?? []).forEach((id: string) => shortlistOwner.set(id, s.faculty_id)));
      const membersByTeam = new Map<string, string[]>();
      (memberRes.data ?? []).forEach((m: any) => membersByTeam.set(m.team_id, [...(membersByTeam.get(m.team_id) ?? []), m.student_id]));
      const panelById = new Map(pan.map(p => [p.id, p]));
      const mapped = (teamRes.data ?? []).map((t: any) => {
        const roster = (membersByTeam.get(t.id) ?? []).map(id => students.get(id)).filter(Boolean);
        const leader: any = students.get(t.leader_student_id);
        const panelId = assignment.get(t.id) ?? null;
        const panel = panelId ? panelById.get(panelId) : undefined;
        return { ...t, branch: leader?.branch ?? roster[0]?.branch ?? '—', leader_name: leader?.name ?? 'Not available',
          shortlist_faculty: fac.find(f => f.id === shortlistOwner.get(t.id))?.name ?? '—',
          panel_id: panelId, panel_name: panel ? fac.find(f => f.id === panel.coordinator_id)?.name ?? '—' : null,
          decision: decision.get(t.id) ?? null } as Team;
      }).sort((a,b) => a.team_code.localeCompare(b.team_code));
      setTeams(mapped);
    } catch (e: any) { setError(e?.message ?? 'Unable to load Phase 2 management data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const savePanel = async (coordinatorId: string) => {
    if (!supabase) return;
    const existing = panels.find(p => p.coordinator_id === coordinatorId);
    const draft = drafts[coordinatorId] ?? {};
    const coordinator = faculty.find(f => f.id === coordinatorId);
    setBusy(true); setError(''); setSuccess('');
    try {
      const payload = {
        coordinator_id: coordinatorId,
        coordinator_photo_url: draft.coordinator_photo_url ?? existing?.coordinator_photo_url ?? '',
        jury_name: draft.jury_name ?? existing?.jury_name ?? '',
        jury_designation: draft.jury_designation ?? existing?.jury_designation ?? '',
        jury_photo_url: draft.jury_photo_url ?? existing?.jury_photo_url ?? ''
      };
      const { error } = await supabase.from('phase2_panels').upsert(payload, { onConflict: 'coordinator_id' });
      if (error) throw error;
      setSuccess(`Panel details saved for ${coordinator?.name ?? 'coordinator'}.`);
      setDrafts(current => { const next = { ...current }; delete next[coordinatorId]; return next; });
      await load();
    } catch (e: any) { setError(e?.message ?? 'Unable to save panel.'); }
    finally { setBusy(false); }
  };

  const assignTeam = async (teamId: string, panelId: string) => {
    if (!supabase) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      if (!panelId) {
        const { error } = await supabase.from('phase2_team_assignments').delete().eq('team_id', teamId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('phase2_team_assignments').upsert(
          { team_id: teamId, panel_id: panelId, assigned_by: (await supabase.auth.getUser()).data.user?.id ?? null },
          { onConflict: 'team_id' }
        );
        if (error) throw error;
      }
      setSuccess('Team panel assignment updated.');
      await load();
    } catch (e: any) { setError(e?.message ?? 'Unable to assign team.'); }
    finally { setBusy(false); }
  };

  const branches = useMemo(() => Array.from(new Set(teams.map(t => t.branch))).sort(), [teams]);
  const filtered = teams.filter(t => {
    const q = search.toLowerCase();
    return (!q || `${t.team_code} ${t.team_name} ${t.leader_name}`.toLowerCase().includes(q))
      && (branchFilter === 'all' || t.branch === branchFilter)
      && (panelFilter === 'all' || t.panel_id === panelFilter)
      && (coordinatorFilter === 'all' || panels.find(p => p.id === t.panel_id)?.coordinator_id === coordinatorFilter)
      && (assignmentFilter === 'all' || (assignmentFilter === 'assigned' ? Boolean(t.panel_id) : !t.panel_id));
  });
  const panelCount = (id: string) => teams.filter(t => t.panel_id === id).length;

  return <div className="space-y-6">
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div><p className="text-xs font-mono text-[#FF7A30]">ADMIN / PHASE 2</p><h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">Phase 2 Management</h1>
        <p className="mt-1 text-sm text-[#8B96A5]">Configure seven coordinator–jury panels and allocate confirmed shortlisted teams.</p></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white text-sm"><RefreshCw className="w-4 h-4"/>Refresh</button>
    </header>
    {error && <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm"><AlertCircle className="inline w-4 h-4 mr-2"/>{error}</div>}
    {success && <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-sm"><CheckCircle2 className="inline w-4 h-4 mr-2"/>{success}</div>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10"><p className="text-xs text-[#8B96A5]">Shortlisted teams</p><p className="text-2xl font-black text-white">{teams.length}</p></div>
      <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10"><p className="text-xs text-[#8B96A5]">Assigned</p><p className="text-2xl font-black text-green-300">{teams.filter(t=>t.panel_id).length}</p></div>
      <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10"><p className="text-xs text-[#8B96A5]">Unassigned</p><p className="text-2xl font-black text-amber-300">{teams.filter(t=>!t.panel_id).length}</p></div>
      <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10"><p className="text-xs text-[#8B96A5]">Panels configured</p><p className="text-2xl font-black text-white">{panels.length}/{faculty.length}</p></div>
    </div>
    <section className="space-y-3">
      <div><h2 className="font-bold text-white">Coordinator and jury panel details</h2><p className="text-xs text-[#8B96A5] mt-1">Jury information is display-only. Add image URLs for coordinator and jury photographs.</p></div>
      <div className="grid lg:grid-cols-2 gap-4">
        {faculty.map((f,index) => {
          const panel = panels.find(p=>p.coordinator_id===f.id);
          const draft = drafts[f.id] ?? {};
          const val = (key: keyof Panel) => (draft as any)[key] ?? (panel as any)?.[key] ?? '';
          const field = (label:string,key:keyof Panel,placeholder:string) => <label className="block"><span className="block mb-1 text-[11px] text-[#8B96A5]">{label}</span><input value={val(key)} onChange={e=>setDrafts(cur=>({...cur,[f.id]:{...(cur[f.id]??{}),[key]:e.target.value}}))} placeholder={placeholder} className="w-full rounded-lg bg-[#07090D] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#FF7A30]"/></label>;
          return <div key={f.id} className="p-4 rounded-xl bg-[#0D1219] border border-white/10 space-y-3">
            <div className="flex justify-between gap-3"><div><p className="text-[10px] font-mono text-[#FF7A30]">PANEL {String(index+1).padStart(2,'0')}</p><h3 className="font-bold text-white">{f.name}</h3><p className="text-xs text-[#8B96A5]">{f.designation ?? 'Faculty Coordinator'}</p></div><span className="text-xs text-[#8B96A5]">{panelCount(panel?.id ?? '')} teams</span></div>
            <div className="grid sm:grid-cols-2 gap-2">{field('Coordinator photo URL','coordinator_photo_url','https://...')}{field('Jury member name','jury_name','Full name')}{field('Jury designation','jury_designation','Designation')}{field('Jury photo URL','jury_photo_url','https://...')}</div>
            <button onClick={()=>void savePanel(f.id)} disabled={busy} className="px-3 py-2 rounded-lg bg-[#FF7A30] text-[#07090D] text-xs font-bold disabled:opacity-50">Save panel details</button>
          </div>;
        })}
      </div>
    </section>
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"><div><h2 className="font-bold text-white">Shortlisted team allocation</h2><p className="text-xs text-[#8B96A5] mt-1">Only teams from confirmed Phase 1 faculty shortlists appear here. Reassignment updates the existing team assignment.</p></div>
        <div className="text-xs text-[#8B96A5] flex items-center gap-1"><Users className="w-4 h-4"/> {filtered.length} teams shown</div></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <label className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-[#8B96A5]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team or leader" className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0D1219] border border-white/10 text-sm text-white"/></label>
        <select value={branchFilter} onChange={e=>setBranchFilter(e.target.value)} className="rounded-lg bg-[#0D1219] border border-white/10 px-3 py-2 text-sm text-white"><option value="all">All branches</option>{branches.map(b=><option key={b}>{b}</option>)}</select>
        <select value={panelFilter} onChange={e=>setPanelFilter(e.target.value)} className="rounded-lg bg-[#0D1219] border border-white/10 px-3 py-2 text-sm text-white"><option value="all">All panels</option>{panels.map((p,i)=><option key={p.id} value={p.id}>Panel {String(i+1).padStart(2,'0')}</option>)}</select>
        <select value={coordinatorFilter} onChange={e=>setCoordinatorFilter(e.target.value)} className="rounded-lg bg-[#0D1219] border border-white/10 px-3 py-2 text-sm text-white"><option value="all">All coordinators</option>{faculty.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select value={assignmentFilter} onChange={e=>setAssignmentFilter(e.target.value)} className="rounded-lg bg-[#0D1219] border border-white/10 px-3 py-2 text-sm text-white"><option value="all">All assignment statuses</option><option value="assigned">Assigned</option><option value="unassigned">Unassigned</option></select>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {loading ? <p className="p-8 text-center text-[#8B96A5]">Loading shortlisted teams…</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#121A23] text-[#8B96A5] text-xs"><tr><th className="p-3 text-left">Team</th><th className="p-3 text-left">Branch / Leader</th><th className="p-3 text-left">Phase 1 coordinator</th><th className="p-3 text-left">Phase 2 panel</th><th className="p-3 text-left">Decision</th></tr></thead><tbody className="divide-y divide-white/5">{filtered.map(t=><tr key={t.id} className="bg-[#0D1219]"><td className="p-3"><p className="font-bold text-white">{t.team_code} · {t.team_name}</p><p className="text-[11px] text-[#8B96A5] line-clamp-2">{t.problem_statement ?? 'No problem statement'}</p></td><td className="p-3 text-[#D6DCE5]">{t.branch}<p className="text-[11px] text-[#8B96A5]">{t.leader_name}</p></td><td className="p-3 text-[#8B96A5]">{t.shortlist_faculty}</td><td className="p-3"><select value={t.panel_id ?? ''} disabled={busy} onChange={e=>void assignTeam(t.id,e.target.value)} className="max-w-[220px] w-full rounded-lg bg-[#07090D] border border-white/10 px-2 py-2 text-xs text-white"><option value="">Unassigned</option>{panels.map(p=><option key={p.id} value={p.id}>{faculty.find(f=>f.id===p.coordinator_id)?.name ?? 'Coordinator'}</option>)}</select></td><td className="p-3 text-xs">{t.decision ? <span className={t.decision==='selected'?'text-green-300':'text-red-300'}>{t.decision==='selected'?'Selected':'Not Selected'}</span> : <span className="text-[#8B96A5]">Pending</span>}</td></tr>)}</tbody></table>{filtered.length===0&&<p className="p-8 text-center text-[#8B96A5]">No shortlisted teams match these filters.</p>}</div>}
      </div>
    </section>
  </div>;
};
export default AdminPhase2ManagementPage;
