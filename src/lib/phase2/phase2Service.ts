import { supabase } from '../supabase/client';

export type Phase2Decision = 'selected' | 'not_selected';

export type Phase2PanelInput = {
  coordinator_id: string;
  coordinator_photo_url?: string | null;
  jury_name: string;
  jury_designation?: string;
  jury_photo_url?: string | null;
};

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

/** Fetch the configured coordinator/jury panels. */
export async function getPhase2Panels() {
  const db = requireSupabase();
  const { data, error } = await db
    .from('phase2_panels')
    .select('id, coordinator_id, coordinator_photo_url, jury_name, jury_designation, jury_photo_url, created_at, updated_at');
  if (error) throw error;
  return data ?? [];
}

/** Save the display information for one coordinator's jury panel. */
export async function savePhase2Panel(input: Phase2PanelInput) {
  const db = requireSupabase();
  const { data, error } = await db
    .from('phase2_panels')
    .upsert({
      coordinator_id: input.coordinator_id,
      coordinator_photo_url: input.coordinator_photo_url ?? null,
      jury_name: input.jury_name.trim(),
      jury_designation: input.jury_designation?.trim() ?? '',
      jury_photo_url: input.jury_photo_url ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'coordinator_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Assign a shortlisted team to a panel. A team can belong to only one panel. */
export async function assignPhase2Team(teamId: string, panelId: string) {
  const db = requireSupabase();
  const { data: auth } = await db.auth.getUser();
  const { data, error } = await db
    .from('phase2_team_assignments')
    .upsert({ team_id: teamId, panel_id: panelId, assigned_by: auth.user?.id ?? null }, { onConflict: 'team_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Remove an assignment. The database trigger should clear any old decision. */
export async function unassignPhase2Team(teamId: string) {
  const db = requireSupabase();
  const { error } = await db.from('phase2_team_assignments').delete().eq('team_id', teamId);
  if (error) throw error;
}

/** Read assignments for admin reporting. RLS must authorize the caller. */
export async function getPhase2Assignments() {
  const db = requireSupabase();
  const { data, error } = await db
    .from('phase2_team_assignments')
    .select('id, team_id, panel_id, assigned_by, assigned_at, phase2_panels(id, coordinator_id, jury_name, jury_designation)');
  if (error) throw error;
  return data ?? [];
}

/** Coordinator-only database function validates the signed-in faculty identity. */
export async function submitPhase2Decision(teamId: string, decision: Phase2Decision) {
  const db = requireSupabase();
  const { data, error } = await db.rpc('submit_phase2_decision', {
    p_team_id: teamId,
    p_decision: decision,
  });
  if (error) throw error;
  return data;
}

/** Fetch final decisions visible to the current authorized admin/coordinator. */
export async function getPhase2Decisions() {
  const db = requireSupabase();
  const { data, error } = await db
    .from('phase2_decisions')
    .select('id, team_id, panel_id, coordinator_id, decision, submitted_by, submitted_at, updated_at');
  if (error) throw error;
  return data ?? [];
}
