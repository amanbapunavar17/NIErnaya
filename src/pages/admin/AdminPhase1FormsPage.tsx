import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Eye, EyeOff, Loader2, RefreshCw, Save, Sheet, ClipboardList } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

type FacultyRow = { id: string; name: string; email: string; active: boolean };
type ConfigRow = { faculty_id: string; form_url: string | null; is_visible: boolean; is_accepting_submissions: boolean };
type SheetRow = { faculty_id: string; response_sheet_url: string | null };
type Draft = { form_url: string; response_sheet_url: string; is_visible: boolean; is_accepting_submissions: boolean };
const emptyDraft = (): Draft => ({ form_url: '', response_sheet_url: '', is_visible: false, is_accepting_submissions: false });
const validHttpUrl = (value: string) => { if (!value.trim()) return true; try { const u = new URL(value); return u.protocol === 'https:'; } catch { return false; } };

export const AdminPhase1FormsPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [facultyResult, configResult, sheetResult] = await Promise.all([
        supabase.from('faculty').select('id,name,email,active').eq('active', true).order('sort_order', { ascending: true }),
        supabase.from('phase_submission_configs').select('faculty_id,form_url,is_visible,is_accepting_submissions').eq('phase_number', 1),
        supabase.from('faculty_phase_response_sheets').select('faculty_id,response_sheet_url').eq('phase_number', 1),
      ]);
      if (facultyResult.error) throw facultyResult.error;
      if (configResult.error) throw configResult.error;
      if (sheetResult.error) throw sheetResult.error;
      const rows = (facultyResult.data ?? []) as FacultyRow[];
      const configs = (configResult.data ?? []) as ConfigRow[];
      const sheets = (sheetResult.data ?? []) as SheetRow[];
      const next: Record<string, Draft> = {};
      rows.forEach((person) => {
        const config = configs.find((x) => x.faculty_id === person.id);
        const sheet = sheets.find((x) => x.faculty_id === person.id);
        next[person.id] = { form_url: config?.form_url ?? '', response_sheet_url: sheet?.response_sheet_url ?? '', is_visible: config?.is_visible ?? false, is_accepting_submissions: config?.is_accepting_submissions ?? false };
      });
      setFaculty(rows); setDrafts(next);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load Phase 1 form settings.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const update = (id: string, patch: Partial<Draft>) => setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  const save = async (person: FacultyRow) => {
    if (!supabase) return;
    const draft = drafts[person.id] ?? emptyDraft();
    if (!validHttpUrl(draft.form_url) || !validHttpUrl(draft.response_sheet_url)) { setError('Enter valid HTTPS URLs for Google Forms and Google Sheets.'); return; }
    setSavingId(person.id); setError(''); setMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: configError } = await supabase.from('phase_submission_configs').upsert({ phase_number: 1, faculty_id: person.id, form_url: draft.form_url.trim() || null, is_visible: draft.is_visible, is_accepting_submissions: draft.is_accepting_submissions, updated_by: user?.id ?? null }, { onConflict: 'phase_number,faculty_id' });
      if (configError) throw configError;
      const { error: sheetError } = await supabase.from('faculty_phase_response_sheets').upsert({ phase_number: 1, faculty_id: person.id, response_sheet_url: draft.response_sheet_url.trim() || null, updated_by: user?.id ?? null }, { onConflict: 'phase_number,faculty_id' });
      if (sheetError) throw sheetError;
      setMessage(`Saved Phase 1 settings for ${person.name}.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save settings.'); }
    finally { setSavingId(null); }
  };

  return <div className="space-y-6 text-[#F5F7FA]">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div><div className="text-xs font-mono tracking-[0.2em] text-[#FF7A30]">SUBMISSION CONFIGURATION</div><h1 className="mt-2 text-2xl sm:text-3xl font-black">Phase 1 · Google Forms</h1><p className="mt-2 text-sm text-[#8B96A5] max-w-2xl">Configure one form and response spreadsheet for each assigned faculty member. Student visibility and the accepting-submissions flag are controlled separately.</p></div>
      <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/5"><RefreshCw size={16}/> Refresh</button>
    </div>
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">Important: “Accepting submissions” is only a website status flag. It does not open or close the Google Form. Manage the actual response setting in Google Forms. Ensure each faculty member has access only to their own response spreadsheet.</div>
    {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{message}</div>}
    {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</div>}
    {loading ? <div className="flex items-center gap-3 p-8 text-[#8B96A5]"><Loader2 className="animate-spin"/> Loading faculty configuration…</div> : <div className="grid gap-5 xl:grid-cols-2">{faculty.map((person) => { const d = drafts[person.id] ?? emptyDraft(); return <section key={person.id} className="rounded-2xl border border-white/10 bg-[#0D1219] p-5 space-y-4">
      <div><h2 className="font-bold text-lg">{person.name}</h2><p className="text-xs text-[#8B96A5]">{person.email}</p></div>
      <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><ClipboardList size={16} className="text-[#FF7A30]"/> Google Form URL</span><input value={d.form_url} onChange={(e) => update(person.id, { form_url: e.target.value })} placeholder="https://docs.google.com/forms/…" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-[#FF7A30]" /></label>
      <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sheet size={16} className="text-emerald-300"/> Google Sheets response URL</span><input value={d.response_sheet_url} onChange={(e) => update(person.id, { response_sheet_url: e.target.value })} placeholder="https://docs.google.com/spreadsheets/…" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-[#FF7A30]" /></label>
      <label className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"><input type="checkbox" checked={d.is_visible} onChange={(e) => update(person.id, { is_visible: e.target.checked })} className="mt-1 accent-orange-500"/><span className="flex-1"><span className="flex items-center gap-2 text-sm font-semibold">{d.is_visible ? <Eye size={15}/> : <EyeOff size={15}/>} Show form link to assigned team</span><span className="mt-1 block text-xs text-[#8B96A5]">Only students whose team is assigned to this faculty should see the link.</span></span></label>
      <label className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"><input type="checkbox" checked={d.is_accepting_submissions} onChange={(e) => update(person.id, { is_accepting_submissions: e.target.checked })} className="mt-1 accent-orange-500"/><span><span className="block text-sm font-semibold">Mark submissions as open on website</span><span className="mt-1 block text-xs text-[#8B96A5]">This does not change the Google Form’s own accepting-responses setting.</span></span></label>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1"><div className="flex gap-3 text-xs">{d.form_url && <a className="inline-flex items-center gap-1 text-[#FF7A30] hover:underline" href={d.form_url} target="_blank" rel="noreferrer">Preview form <ExternalLink size={13}/></a>}{d.response_sheet_url && <a className="inline-flex items-center gap-1 text-emerald-300 hover:underline" href={d.response_sheet_url} target="_blank" rel="noreferrer">Open sheet <ExternalLink size={13}/></a>}</div><button disabled={savingId === person.id} onClick={() => void save(person)} className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A30] px-4 py-2.5 text-sm font-bold text-[#07090D] disabled:opacity-50">{savingId === person.id ? <Loader2 size={15} className="animate-spin"/> : <Save size={15}/>} Save settings</button></div>
    </section>; })}</div>}
  </div>;
};
