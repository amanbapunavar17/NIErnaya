import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

type Panel = { id:string; coordinator_id:string; coordinator_photo_url:string|null; jury_name:string; jury_designation:string; jury_photo_url:string|null };
type Team = { id:string; team_code:string; team_name:string; problem_statement:string|null; selected_sdg:number|null; leader_student_id:string; panel_id:string; leader:{name:string;usn:string;email:string;phone:string|null;branch:string}|null; members:{name:string;usn:string;branch:string;section:string}[]; submission:{file_name:string;file_type:string;submitted_at:string;status:string}|null; decision:string|null };

export const FacultyPhase2Page: React.FC = () => {
  const [panel,setPanel]=useState<Panel|null>(null);
  const [coordinator,setCoordinator]=useState<any>(null);
  const [teams,setTeams]=useState<Team[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState<string|null>(null);
  const [confirm,setConfirm]=useState<{team:Team;decision:'selected'|'not_selected'}|null>(null);
  const [notice,setNotice]=useState('');

  const load=useCallback(async()=>{
    if(!supabase){setError('Supabase is not configured.');setLoading(false);return;}
    setLoading(true);setError('');
    try{
      const {data:facultyId,error:idError}=await supabase.rpc('get_current_faculty_id');
      if(idError)throw idError;
      if(!facultyId)throw new Error('Your account is not linked to a faculty coordinator record.');
      const [{data:faculty,error:facultyError},{data:panelRow,error:panelError}]=await Promise.all([
        supabase.from('faculty').select('id,name,email,designation,department').eq('id',facultyId).maybeSingle(),
        supabase.from('phase2_panels').select('id,coordinator_id,coordinator_photo_url,jury_name,jury_designation,jury_photo_url').eq('coordinator_id',facultyId).maybeSingle()
      ]);
      if(facultyError)throw facultyError;if(panelError)throw panelError;
      setCoordinator(faculty);
      if(!panelRow){setPanel(null);setTeams([]);return;}
      setPanel(panelRow as Panel);
      const {data:assignments,error:assignError}=await supabase.from('phase2_team_assignments').select('team_id,panel_id').eq('panel_id',panelRow.id);
      if(assignError)throw assignError;
      const ids=(assignments??[]).map(a=>a.team_id);
      if(!ids.length){setTeams([]);return;}
      const [teamRes,memberRes,submissionRes,decisionRes]=await Promise.all([
        supabase.from('teams').select('id,team_code,team_name,problem_statement,selected_sdg,leader_student_id').in('id',ids).order('team_code'),
        supabase.from('team_members').select('team_id,student_id,role').in('team_id',ids),
        supabase.from('submissions').select('team_id,file_name,file_type,submitted_at,status').in('team_id',ids),
        supabase.from('phase2_decisions').select('team_id,decision').in('team_id',ids)
      ]);
      if(teamRes.error)throw teamRes.error;if(memberRes.error)throw memberRes.error;if(submissionRes.error)throw submissionRes.error;if(decisionRes.error)throw decisionRes.error;
      const studentIds=Array.from(new Set([...(memberRes.data??[]).map(m=>m.student_id),...(teamRes.data??[]).map(t=>t.leader_student_id)]));
      const {data:studentRows,error:studentError}=await supabase.from('students').select('id,name,usn,email,phone,branch,section').in('id',studentIds);
      if(studentError)throw studentError;
      const students=new Map((studentRows??[]).map(s=>[s.id,s]));
      const composed=(teamRes.data??[]).map(t=>{
        const roster=(memberRes.data??[]).filter(m=>m.team_id===t.id).map(m=>students.get(m.student_id)).filter(Boolean) as any[];
        const leader=students.get(t.leader_student_id)??null;
        return {...t,panel_id:panelRow.id,leader,members:roster,submission:(submissionRes.data??[]).find(s=>s.team_id===t.id)??null,decision:(decisionRes.data??[]).find(d=>d.team_id===t.id)?.decision??null} as Team;
      });
      setTeams(composed);
    }catch(e:any){setError(e?.message??'Unable to load Phase 2 assignments.');}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{void load();},[load]);

  const submit=async()=>{
    if(!supabase||!confirm)return;
    setBusy(confirm.team.id);setError('');setNotice('');
    try{
      const {error}=await supabase.rpc('submit_phase2_decision',{p_team_id:confirm.team.id,p_decision:confirm.decision});
      if(error)throw error;
      setNotice(`Final decision submitted for ${confirm.team.team_code}.`);
      setConfirm(null);await load();
    }catch(e:any){setError(e?.message??'Decision could not be submitted.');}
    finally{setBusy(null);}
  };

  return <div className="space-y-6">
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"><div><p className="text-xs font-mono text-[#FF7A30]">FACULTY / PHASE 2</p><h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">Phase 2 Faculty</h1><p className="mt-1 text-sm text-[#8B96A5]">Review your assigned teams and submit the final panel decision.</p></div><button onClick={()=>void load()} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white text-sm"><RefreshCw className="w-4 h-4"/>Refresh</button></header>
    {error&&<div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm"><AlertCircle className="inline w-4 h-4 mr-2"/>{error}</div>}
    {notice&&<div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-sm"><CheckCircle2 className="inline w-4 h-4 mr-2"/>{notice}</div>}
    {loading?<p className="py-16 text-center text-[#8B96A5]">Loading Phase 2 panel…</p>:!panel?<div className="p-8 rounded-2xl bg-[#0D1219] border border-white/10 text-center"><Users className="w-10 h-10 mx-auto text-[#FF7A30] mb-3"/><h2 className="font-bold text-white">Panel not configured yet</h2><p className="text-sm text-[#8B96A5] mt-2">The administrator has not configured your Phase 2 panel.</p></div>:<>
      <section className="p-5 rounded-2xl bg-[#0D1219] border border-white/10"><p className="text-xs text-[#8B96A5] mb-4">WELCOME, {coordinator?.name??'FACULTY COORDINATOR'}</p><div className="grid md:grid-cols-2 gap-5">
        <div className="flex items-center gap-4">{panel.coordinator_photo_url?<img src={panel.coordinator_photo_url} alt={coordinator?.name??'Coordinator'} className="w-20 h-20 rounded-xl object-cover"/>:<div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-[#8B96A5]">Photo</div>}<div><p className="text-[10px] text-[#FF7A30] font-mono">FACULTY COORDINATOR</p><h2 className="font-bold text-white">{coordinator?.name??'—'}</h2><p className="text-xs text-[#8B96A5]">{coordinator?.designation??'Faculty Coordinator'}</p></div></div>
        <div className="flex items-center gap-4">{panel.jury_photo_url?<img src={panel.jury_photo_url} alt={panel.jury_name||'Jury member'} className="w-20 h-20 rounded-xl object-cover"/>:<div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-[#8B96A5]">Photo</div>}<div><p className="text-[10px] text-[#FF7A30] font-mono">JURY MEMBER · DISPLAY ONLY</p><h2 className="font-bold text-white">{panel.jury_name||'Jury details pending'}</h2><p className="text-xs text-[#8B96A5]">{panel.jury_designation}</p></div></div>
      </div></section>
      <div className="grid grid-cols-2 gap-3"><div className="p-4 rounded-xl bg-[#0D1219] border border-white/10"><p className="text-xs text-[#8B96A5]">Assigned teams</p><p className="text-2xl font-black text-white">{teams.length}</p></div><div className="p-4 rounded-xl bg-[#0D1219] border border-white/10"><p className="text-xs text-[#8B96A5]">Decisions submitted</p><p className="text-2xl font-black text-green-300">{teams.filter(t=>t.decision).length}</p></div></div>
      {teams.length===0?<p className="p-8 rounded-xl bg-[#0D1219] border border-white/10 text-center text-[#8B96A5]">No teams have been assigned to this panel yet.</p>:<div className="space-y-4">{teams.map(team=><article key={team.id} className="p-5 rounded-2xl bg-[#0D1219] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"><div><p className="text-xs font-mono text-[#FF7A30]">{team.team_code}</p><h3 className="text-lg font-bold text-white">{team.team_name}</h3><p className="text-xs text-[#8B96A5] mt-1">SDG {team.selected_sdg??'—'}</p></div><span className={`text-xs font-bold ${team.decision==='selected'?'text-green-300':team.decision==='not_selected'?'text-red-300':'text-amber-300'}`}>{team.decision==='selected'?'SELECTED':team.decision==='not_selected'?'NOT SELECTED':'DECISION PENDING'}</span></div>
        <div><p className="text-[10px] font-mono text-[#8B96A5] mb-1">PROBLEM STATEMENT</p><p className="text-sm text-[#D6DCE5] whitespace-pre-wrap">{team.problem_statement||'No problem statement submitted.'}</p></div>
        <div className="grid md:grid-cols-2 gap-4"><div className="p-3 rounded-xl bg-[#07090D]"><p className="text-[10px] text-[#FF7A30] font-mono mb-2">TEAM LEADER</p><p className="font-semibold text-white">{team.leader?.name??'Not available'}</p><p className="text-xs text-[#8B96A5]">{team.leader?.usn??'—'} · {team.leader?.branch??'—'}</p><p className="text-xs text-[#8B96A5]">{team.leader?.email??''}</p><div className="mt-2">{team.leader?.phone?<a href={`tel:${team.leader.phone}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF9A5C] hover:text-[#FFB27F] underline underline-offset-2">Contact: {team.leader.phone}</a>:<p className="text-xs text-amber-300">Contact number not available</p>}</div></div><div className="p-3 rounded-xl bg-[#07090D]"><p className="text-[10px] text-[#FF7A30] font-mono mb-2">TEAM MEMBERS ({team.members.length})</p>{team.members.map(m=><p key={m.usn} className="text-sm text-white">{m.name}<span className="text-xs text-[#8B96A5]"> · {m.usn} · {m.branch} / {m.section}</span></p>)}</div></div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-white/5 pt-3"><div className="text-xs text-[#8B96A5] flex items-center gap-2"><FileText className="w-4 h-4"/>{team.submission?<><span>{team.submission.file_name}</span><span>· {new Date(team.submission.submitted_at).toLocaleDateString('en-IN')}</span></>:<span>Phase 1 submission record unavailable</span>}</div><div className="flex gap-2"><button onClick={()=>setConfirm({team,decision:'selected'})} disabled={Boolean(busy)} className="px-4 py-2 rounded-lg bg-green-600/20 border border-green-500/40 text-green-300 text-xs font-bold disabled:opacity-50">Selected</button><button onClick={()=>setConfirm({team,decision:'not_selected'})} disabled={Boolean(busy)} className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold disabled:opacity-50">Not Selected</button></div></div>
      </article>)}</div>}
    </>}
    {confirm&&<div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="w-full max-w-md p-5 rounded-2xl bg-[#0D1219] border border-white/10"><h2 className="font-bold text-white text-lg">Confirm final decision</h2><p className="text-sm text-[#8B96A5] mt-2">Submit <strong className={confirm.decision==='selected'?'text-green-300':'text-red-300'}>{confirm.decision==='selected'?'Selected':'Not Selected'}</strong> for {confirm.team.team_code} · {confirm.team.team_name}?</p><p className="text-xs text-[#8B96A5] mt-2">Only the assigned faculty coordinator can submit this decision. The jury member has display-only access.</p><div className="flex justify-end gap-2 mt-5"><button onClick={()=>setConfirm(null)} className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm">Cancel</button><button onClick={()=>void submit()} disabled={Boolean(busy)} className="px-4 py-2 rounded-lg bg-[#FF7A30] text-[#07090D] text-sm font-bold">{busy?'Submitting…':'Confirm decision'}</button></div></div></div>}
  </div>;
};
export default FacultyPhase2Page;
