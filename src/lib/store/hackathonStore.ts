import { useState, useEffect } from 'react';
import type { 
  Team, 
  Faculty, 
  Submission, 
  Phase, 
  TimelineEvent, 
  RuleItem, 
  PrizeItem, 
  FAQItem, 
  Announcement, 
  HackathonResult, 
  AuditLog, 
  LiveStats,
  UserProfile,
  ContactConfig
} from '../../types';
import { 
  SITE_CONFIG, 
  PHASES_DATA, 
  TIMELINE_EVENTS, 
  RULES_DATA, 
  PRIZES_DATA, 
  FAQ_DATA, 
  FACULTY_ORGANIZERS 
} from '../../config/site';

const STORAGE_KEYS = {
  TEAMS: 'niernaya_teams_v2',
  FACULTY: 'niernaya_faculty_v2',
  SUBMISSIONS: 'niernaya_submissions_v2',
  PHASES: 'niernaya_phases_v2',
  TIMELINE: 'niernaya_timeline_v2',
  RULES: 'niernaya_rules_v2',
  PRIZES: 'niernaya_prizes_v2',
  FAQS: 'niernaya_faqs_v2',
  ANNOUNCEMENTS: 'niernaya_announcements_v2',
  RESULTS: 'niernaya_results_v2',
  AUDIT_LOGS: 'niernaya_audit_logs_v2',
  CURRENT_USER: 'niernaya_current_user_v2',
  CONTACT_CONFIG: 'niernaya_contact_config_v2',
};

// Initial Faculty Seed (8 faculty members as specified)
const INITIAL_FACULTY: Faculty[] = FACULTY_ORGANIZERS.map((f, i) => ({
  id: `fac-${i + 1}`,
  name: f.name,
  role: f.role,
  email: f.email || `faculty${i + 1}@nie.ac.in`,
  phone: f.phone || `+91 821 248 040${i + 1}`,
  designation: f.designation,
  department: f.department,
  active: true,
  assigned_count: 0,
  sort_order: i + 1,
}));

// Initial Announcements
const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "REGISTRATIONS ARE OFFICIALLY LIVE",
    message: "2nd Year (3rd Sem) NIE students are invited to register in squads of 2–3 members.",
    priority: "high",
    published: true,
    created_at: new Date().toISOString()
  },
  {
    id: "ann-2",
    title: "PHASE 1 BRIEFING SESSION",
    message: "Data Hunt orientation webinar schedule will be announced in the official WhatsApp community.",
    priority: "medium",
    published: true,
    created_at: new Date().toISOString()
  }
];

class HackathonStoreService {
  private listeners: Set<() => void> = new Set();

  private teams: Team[] = [];
  private faculty: Faculty[] = [];
  private submissions: Submission[] = [];
  private phases: Phase[] = [];
  private timeline: TimelineEvent[] = [];
  private rules: RuleItem[] = [];
  private prizes: PrizeItem[] = [];
  private faqs: FAQItem[] = [];
  private announcements: Announcement[] = [];
  private results: HackathonResult[] = [];
  private auditLogs: AuditLog[] = [];
  private currentUser: UserProfile | null = null;
  private contactConfig: ContactConfig = { ...SITE_CONFIG.contact, whatsappCommunityLink: SITE_CONFIG.whatsappCommunityLink };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
      const storedFaculty = localStorage.getItem(STORAGE_KEYS.FACULTY);
      const storedSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      const storedPhases = localStorage.getItem(STORAGE_KEYS.PHASES);
      const storedTimeline = localStorage.getItem(STORAGE_KEYS.TIMELINE);
      const storedRules = localStorage.getItem(STORAGE_KEYS.RULES);
      const storedPrizes = localStorage.getItem(STORAGE_KEYS.PRIZES);
      const storedFaqs = localStorage.getItem(STORAGE_KEYS.FAQS);
      const storedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      const storedResults = localStorage.getItem(STORAGE_KEYS.RESULTS);
      const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const storedContact = localStorage.getItem(STORAGE_KEYS.CONTACT_CONFIG);

      this.teams = storedTeams ? JSON.parse(storedTeams) : [];
      this.faculty = storedFaculty ? JSON.parse(storedFaculty) : INITIAL_FACULTY;
      this.submissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];
      this.phases = storedPhases ? JSON.parse(storedPhases) : PHASES_DATA;
      this.timeline = storedTimeline ? JSON.parse(storedTimeline) : TIMELINE_EVENTS;
      this.rules = storedRules ? JSON.parse(storedRules) : RULES_DATA;
      this.prizes = storedPrizes ? JSON.parse(storedPrizes) : PRIZES_DATA;
      this.faqs = storedFaqs ? JSON.parse(storedFaqs) : FAQ_DATA;
      this.announcements = storedAnnouncements ? JSON.parse(storedAnnouncements) : INITIAL_ANNOUNCEMENTS;
      this.results = storedResults ? JSON.parse(storedResults) : [];
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : [];
      this.currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (storedContact) {
        this.contactConfig = JSON.parse(storedContact);
      }
    } catch (e) {
      console.warn("Could not load from localStorage, using defaults", e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(this.teams));
      localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(this.faculty));
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(this.submissions));
      localStorage.setItem(STORAGE_KEYS.PHASES, JSON.stringify(this.phases));
      localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(this.timeline));
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(this.rules));
      localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(this.prizes));
      localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(this.faqs));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcements));
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(this.results));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.CONTACT_CONFIG, JSON.stringify(this.contactConfig));
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error("Storage save failed", e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // CONTACT & HELPDESK CONFIG
  public getContactConfig(): ContactConfig {
    return { ...this.contactConfig };
  }

  public updateContactConfig(updates: Partial<ContactConfig>, actorName: string = 'Admin') {
    this.contactConfig = { ...this.contactConfig, ...updates };
    this.addAuditLog(actorName, 'UPDATE_CONTACT_CONFIG', 'contact_config', 'site', updates);
    this.saveToStorage();
  }

  // AUDIT LOGGING
  public addAuditLog(actor: string, action: string, entity: string, entity_id: string, metadata?: any) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor,
      action,
      entity_type: entity,
      entity,
      entity_id,
      metadata,
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    this.saveToStorage();
  }

  // AUTH STATE
  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public login(email: string, role: 'student' | 'faculty' | 'admin', name?: string): UserProfile {
    const user: UserProfile = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase().trim(),
      name: name || (role === 'admin' ? 'Admin Officer' : role === 'faculty' ? 'Faculty Mentor' : 'Team Leader'),
      role,
      created_at: new Date().toISOString()
    };
    this.currentUser = user;
    this.addAuditLog(user.name, 'USER_LOGIN', 'auth', user.id, { role, email });
    this.saveToStorage();
    return user;
  }

  public logout() {
    if (this.currentUser) {
      this.addAuditLog(this.currentUser.name, 'USER_LOGOUT', 'auth', this.currentUser.id);
    }
    this.currentUser = null;
    this.saveToStorage();
  }

  // LIVE STATS (derived from real database records)
  public getLiveStats(): LiveStats {
    const totalParticipants = this.teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
    const offlineTeams = this.teams.filter(t => t.mode === 'Offline').length;
    const northCampusTeams = this.teams.filter(t => t.campus === 'North').length;
    const southCampusTeams = this.teams.filter(t => t.campus === 'South').length;

    return {
      registered_teams: this.teams.length,
      total_participants: totalParticipants,
      offline_teams: offlineTeams,
      north_campus_teams: northCampusTeams,
      south_campus_teams: southCampusTeams,
      submissions_count: this.submissions.length,
    };
  }

  // TEAM REGISTRATION
  public getTeams(): Team[] {
    return [...this.teams];
  }

  public getTeamById(id: string): Team | undefined {
    return this.teams.find(t => t.id === id || t.team_code === id);
  }

  public getTeamByLeaderEmail(email: string): Team | undefined {
    const clean = email.toLowerCase().trim();
    return this.teams.find(t => t.leader_email.toLowerCase() === clean);
  }

  public generateNextTeamCode(): string {
    const count = this.teams.length + 1;
    return `DAV26-${count.toString().padStart(3, '0')}`;
  }

  public validateNewTeam(teamData: Omit<Team, 'id' | 'team_code' | 'created_at'>): { valid: boolean; error?: string } {
    if (!teamData.team_name || teamData.team_name.trim().length < 3) {
      return { valid: false, error: "Team name must be at least 3 characters long." };
    }

    if (!teamData.members || teamData.members.length < 2 || teamData.members.length > 3) {
      return { valid: false, error: "Team must have between 2 and 3 members." };
    }

    // Check NIE Email domain on all members
    for (const member of teamData.members) {
      if (!member.email || !member.email.toLowerCase().endsWith('@nie.ac.in')) {
        return { valid: false, error: `Invalid email for ${member.name}. Must be an official @nie.ac.in email.` };
      }
      if (!member.usn || member.usn.trim().length < 5) {
        return { valid: false, error: `Valid USN required for member ${member.name}.` };
      }
    }

    // Check duplicate USNs in existing teams
    const allExistingUSNs = new Set<string>();
    const allExistingEmails = new Set<string>();

    for (const t of this.teams) {
      for (const m of t.members) {
        allExistingUSNs.add(m.usn.toUpperCase().trim());
        allExistingEmails.add(m.email.toLowerCase().trim());
      }
    }

    for (const m of teamData.members) {
      const usnUpper = m.usn.toUpperCase().trim();
      const emailLower = m.email.toLowerCase().trim();
      if (allExistingUSNs.has(usnUpper)) {
        return { valid: false, error: `USN ${usnUpper} is already registered in another team.` };
      }
      if (allExistingEmails.has(emailLower)) {
        return { valid: false, error: `Email ${emailLower} is already registered in another team.` };
      }
    }

    return { valid: true };
  }

  public registerTeam(teamData: Omit<Team, 'id' | 'team_code' | 'created_at'>): Team {
    const validation = this.validateNewTeam(teamData);
    if (!validation.valid) {
      throw new Error(validation.error || "Registration validation failed.");
    }

    const team_code = this.generateNextTeamCode();
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      team_code,
      registration_status: 'submitted',
      created_at: new Date().toISOString(),
      members: teamData.members.map((m, idx) => ({
        ...m,
        id: `mem-${Date.now()}-${idx}`,
        team_id: '',
        created_at: new Date().toISOString()
      }))
    };

    newTeam.members.forEach(m => m.team_id = newTeam.id);

    this.teams.push(newTeam);
    this.addAuditLog(newTeam.leader_name, 'REGISTER_TEAM', 'teams', newTeam.id, {
      team_code: newTeam.team_code,
      members_count: newTeam.members.length,
      mode: newTeam.mode,
      campus: newTeam.campus
    });
    this.saveToStorage();
    return newTeam;
  }

  public updateTeam(id: string, updates: Partial<Team>, actorName: string = 'Admin'): Team {
    const idx = this.teams.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Team not found");

    const existing = this.teams[idx];
    if (existing.registration_status === 'locked' && actorName !== 'Admin') {
      throw new Error("Team registration is locked. Contact NIErnaya admin to unlock.");
    }

    const updated = { ...existing, ...updates };
    this.teams[idx] = updated;
    this.addAuditLog(actorName, 'UPDATE_TEAM', 'teams', id, updates);
    this.saveToStorage();
    return updated;
  }

  public lockTeam(id: string, actorName: string = 'Team Leader'): Team {
    return this.updateTeam(id, { registration_status: 'locked', locked_at: new Date().toISOString() }, actorName);
  }

  // FACULTY MANAGEMENT & BALANCED ALLOCATION
  public getFaculty(): Faculty[] {
    return this.faculty.map(f => {
      const count = this.teams.filter(t => t.assigned_faculty_id === f.id).length;
      return { ...f, assigned_count: count };
    }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  public updateFaculty(id: string, updates: Partial<Faculty>, actorName: string = 'Admin'): Faculty {
    const idx = this.faculty.findIndex(f => f.id === id);
    if (idx === -1) throw new Error("Faculty not found");

    const updated = { ...this.faculty[idx], ...updates };
    this.faculty[idx] = updated;

    // Also update team references if name changed
    if (updates.name) {
      this.teams.forEach(t => {
        if (t.assigned_faculty_id === id) {
          t.assigned_faculty_name = updates.name;
        }
      });
    }

    this.addAuditLog(actorName, 'UPDATE_FACULTY', 'faculty', id, updates);
    this.saveToStorage();
    return updated;
  }

  public addFaculty(facultyData: Omit<Faculty, 'id'>, actorName: string = 'Admin'): Faculty {
    const newFac: Faculty = {
      ...facultyData,
      id: `fac-${Date.now()}`,
      sort_order: this.faculty.length + 1
    };
    this.faculty.push(newFac);
    this.addAuditLog(actorName, 'ADD_FACULTY', 'faculty', newFac.id, { name: newFac.name });
    this.saveToStorage();
    return newFac;
  }

  public deleteFaculty(id: string, actorName: string = 'Admin') {
    this.faculty = this.faculty.filter(f => f.id !== id);
    this.addAuditLog(actorName, 'DELETE_FACULTY', 'faculty', id);
    this.saveToStorage();
  }

  public autoAllocateTeamsToFaculty(actorName: string = 'Admin'): { success: boolean; allocationsCount: number } {
    const activeFaculty = this.faculty.filter(f => f.active);
    if (activeFaculty.length === 0) throw new Error("No active faculty available for allocation.");

    const unassignedTeams = [...this.teams];
    if (unassignedTeams.length === 0) return { success: true, allocationsCount: 0 };

    const shuffledTeams = [...unassignedTeams].sort(() => Math.random() - 0.5);
    
    shuffledTeams.forEach((team, index) => {
      const assignedFaculty = activeFaculty[index % activeFaculty.length];
      team.assigned_faculty_id = assignedFaculty.id;
      team.assigned_faculty_name = assignedFaculty.name;
    });

    this.addAuditLog(actorName, 'AUTO_ALLOCATE_FACULTY', 'faculty_assignments', 'all', {
      teams_count: unassignedTeams.length,
      faculty_count: activeFaculty.length
    });

    this.saveToStorage();
    return { success: true, allocationsCount: unassignedTeams.length };
  }

  public assignFacultyToTeam(teamId: string, facultyId: string, actorName: string = 'Admin') {
    const fac = this.faculty.find(f => f.id === facultyId);
    if (!fac) throw new Error("Faculty not found");

    this.updateTeam(teamId, {
      assigned_faculty_id: fac.id,
      assigned_faculty_name: fac.name
    }, actorName);
  }

  // SUBMISSIONS
  public getSubmissions(): Submission[] {
    return [...this.submissions];
  }

  public getSubmissionByTeamId(teamId: string): Submission | undefined {
    return this.submissions.find(s => s.team_id === teamId);
  }

  public submitProject(submission: Omit<Submission, 'id' | 'submitted_at' | 'status'>, actorName: string): Submission {
    const existingIdx = this.submissions.findIndex(s => s.team_id === submission.team_id);
    if (existingIdx !== -1 && actorName !== 'Admin') {
      throw new Error("Submission already exists. Teams cannot modify submissions once submitted.");
    }

    const newSub: Submission = {
      ...submission,
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    };

    if (existingIdx !== -1) {
      this.submissions[existingIdx] = newSub;
    } else {
      this.submissions.push(newSub);
    }

    this.addAuditLog(actorName, 'SUBMIT_PROJECT', 'submissions', newSub.id, {
      team_code: submission.team_code,
      file_name: submission.file_name,
      file_size: submission.file_size
    });

    this.saveToStorage();
    return newSub;
  }


  // CMS MANAGEMENT
  public getPhases(): Phase[] {
    return [...this.phases].sort((a, b) => a.sort_order - b.sort_order);
  }

  public updatePhase(id: string, updates: Partial<Phase>, actorName: string = 'Admin') {
    const idx = this.phases.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.phases[idx] = { ...this.phases[idx], ...updates };
      this.addAuditLog(actorName, 'UPDATE_PHASE', 'phases', id, updates);
      this.saveToStorage();
    }
  }

  public getTimeline(): TimelineEvent[] {
    return [...this.timeline].sort((a, b) => a.sort_order - b.sort_order);
  }

  public updateTimelineEvent(id: string, updates: Partial<TimelineEvent>, actorName: string = 'Admin') {
    const idx = this.timeline.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.timeline[idx] = { ...this.timeline[idx], ...updates };
      this.addAuditLog(actorName, 'UPDATE_TIMELINE', 'timeline', id, updates);
      this.saveToStorage();
    }
  }

  public getRules(): RuleItem[] {
    return [...this.rules].sort((a, b) => a.sort_order - b.sort_order);
  }

  public updateRule(id: string, updates: Partial<RuleItem>, actorName: string = 'Admin') {
    const idx = this.rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.rules[idx] = { ...this.rules[idx], ...updates };
      this.addAuditLog(actorName, 'UPDATE_RULE', 'rules', id, updates);
      this.saveToStorage();
    }
  }

  public getPrizes(): PrizeItem[] {
    return [...this.prizes].sort((a, b) => a.amount_num < b.amount_num ? 1 : -1);
  }

  public updatePrize(id: string, updates: Partial<PrizeItem>, actorName: string = 'Admin') {
    const idx = this.prizes.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.prizes[idx] = { ...this.prizes[idx], ...updates };
      this.addAuditLog(actorName, 'UPDATE_PRIZE', 'prizes', id, updates);
      this.saveToStorage();
    }
  }

  public getFAQs(): FAQItem[] {
    return [...this.faqs].sort((a, b) => a.sort_order - b.sort_order);
  }

  public updateFAQ(id: string, updates: Partial<FAQItem>, actorName: string = 'Admin') {
    const idx = this.faqs.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.faqs[idx] = { ...this.faqs[idx], ...updates };
      this.addAuditLog(actorName, 'UPDATE_FAQ', 'faqs', id, updates);
      this.saveToStorage();
    }
  }

  public getAnnouncements(): Announcement[] {
    return [...this.announcements];
  }

  public addAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>, actorName: string = 'Admin') {
    const newAnn: Announcement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.announcements.unshift(newAnn);
    this.addAuditLog(actorName, 'CREATE_ANNOUNCEMENT', 'announcements', newAnn.id, { title: announcement.title });
    this.saveToStorage();
    return newAnn;
  }

  public deleteAnnouncement(id: string, actorName: string = 'Admin') {
    this.announcements = this.announcements.filter(a => a.id !== id);
    this.addAuditLog(actorName, 'DELETE_ANNOUNCEMENT', 'announcements', id);
    this.saveToStorage();
  }

  // RESULTS
  public getResults(): HackathonResult[] {
    return [...this.results];
  }

  public publishResult(result: Omit<HackathonResult, 'id' | 'announced_at'>, actorName: string = 'Admin') {
    const newRes: HackathonResult = {
      ...result,
      id: `res-${Date.now()}`,
      announced_at: new Date().toISOString()
    };
    this.results.push(newRes);
    this.addAuditLog(actorName, 'PUBLISH_RESULT', 'results', newRes.id, { position: result.position, team_code: result.team_code });
    this.saveToStorage();
    return newRes;
  }

  public deleteResult(id: string, actorName: string = 'Admin') {
    this.results = this.results.filter(r => r.id !== id);
    this.addAuditLog(actorName, 'DELETE_RESULT', 'results', id);
    this.saveToStorage();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }
}

export const hackathonStore = new HackathonStoreService();

// Custom React hook for state reactivity
export function useHackathonStore() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = hackathonStore.subscribe(() => {
      setVersion(v => v + 1);
    });
    return unsubscribe;
  }, []);

  return hackathonStore;
}
