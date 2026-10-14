// ============================================================
// NIErnaya — CENTRAL TYPE DEFINITIONS
// ============================================================

// ------------------------------------------------------------
// ENUM / UNION TYPES
// ------------------------------------------------------------

export type UserRole = 'student' | 'faculty' | 'admin';

export type CampusType = 'North' | 'South';

export type ParticipationMode = 'Offline';

export type RegistrationStatus = 'draft' | 'submitted' | 'locked';

export type PhaseStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'hidden';

export type TimelineStatus =
  | 'upcoming'
  | 'active'
  | 'completed';

export type SubmissionStatus =
  | 'submitted'
  | 'reviewed'
  | 'shortlisted'
  | 'rejected';

export type AnnouncementPriority =
  | 'low'
  | 'medium'
  | 'high';

export type TrophyStyle =
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'special';


// ============================================================
// AUTH / USER
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}


// ============================================================
// STUDENT
// ============================================================

export interface Student {
  id: string;
  profile_id?: string | null;

  name: string;
  usn: string;
  email: string;
  phone: string;

  branch: string;

  // Display-friendly values
  // Example: "2nd Year / 3rd Semester"
  year: string;

  // Example: "3rd Semester"
  semester: string;

  section: string;

  campus: CampusType;

  created_at: string;
  updated_at?: string;
}


// ============================================================
// TEAM MEMBER
// ============================================================

export interface TeamMember {
  id: string;
  team_id: string;

  name: string;
  usn: string;
  email: string;
  phone?: string | null;

  branch: string;
  year: string;
  semester?: string;
  section: string;
  campus: CampusType;

  role: 'leader' | 'member';

  created_at: string;
  updated_at?: string;
}


// ============================================================
// TEAM
// ============================================================

export interface Team {
  id: string;

  // Example: DAV26-001
  team_code: string;

  team_name: string;

  // NIErnaya Phase 1
  problem_statement?: string | null;
  selected_sdg?: 2 | 3 | 4 | 5 | 13 | null;

  leader_student_id: string;

  // Joined / derived information
  leader_name: string;
  leader_email: string;
  leader_phone: string;

  mode: ParticipationMode;
  campus: CampusType;

  registration_status: RegistrationStatus;

  locked_at?: string | null;

  created_at: string;
  updated_at?: string;

  members: TeamMember[];

  // Faculty allocation
  assigned_faculty_id?: string | null;
  assigned_faculty_name?: string | null;
  meeting_link?: string | null;

}


// ============================================================
// FACULTY
// ============================================================

export interface Faculty {
  id: string;

  profile_id?: string | null;

  name: string;
  email: string;
  phone: string;

  designation: string;
  department: string;

  // Internal role in the Data Detective Challenge
  // Example: "Chief Faculty Convener"
  role?: string | null;

  active: boolean;

  assigned_count?: number;

  photo_url?: string | null;

  sort_order?: number;
}


// ============================================================
// SUBMISSION
// ============================================================

export interface Submission {
  id: string;

  team_id: string;

  // Joined team information
  team_code: string;
  team_name: string;

  storage_path: string;

  file_name: string;
  file_type: string;
  file_size: number;

  submitted_at: string;
  submitted_by: string;

  status: SubmissionStatus;


  created_at?: string;
  updated_at?: string;
}


// ============================================================
// PHASE
// ============================================================

export interface Phase {
  id: string;

  name: string;
  slug: string;

  // Database stores actual dates.
  start_date?: string;
  end_date?: string;

  // Public display format.
  // Example: "21st – 24th October"
  dates: string;

  focus: string;
  description: string;
  campus_info: string;

  status: PhaseStatus;

  sort_order: number;

  public_visible: boolean;

  created_at?: string;
  updated_at?: string;
}


// ============================================================
// TIMELINE
// ============================================================

export interface TimelineEvent {
  id: string;

  station_number: string;

  date_badge: {
    day: string;
    month: string;
    year: string;
  };

  title: string;
  description: string;

  phase_id?: string | null;

  status: TimelineStatus;

  sort_order: number;

  created_at?: string;
  updated_at?: string;
}


// ============================================================
// RULES
// ============================================================

export interface RuleItem {
  id: string;

  category: string;
  title: string;
  content: string;

  sort_order: number;

  published: boolean;

  created_at?: string;
  updated_at?: string;
}


// ============================================================



// ============================================================
// PRIZES
// ============================================================

export interface PrizeItem {
  id: string;

  position: string;
  title: string;

  amount: string;
  amount_num: number;

  description: string;

  trophy_style: TrophyStyle;

  perks: string[];

  sort_order?: number;

  published?: boolean;

  created_at?: string;
  updated_at?: string;
}


// ============================================================
// FAQ
// ============================================================

export interface FAQItem {
  id: string;

  question: string;
  answer: string;

  category: string;

  sort_order: number;

  published: boolean;

  created_at?: string;
  updated_at?: string;
}


// ============================================================
// ORGANIZERS / FACULTY COMMITTEE
// ============================================================

export interface OrganizerMember {
  id: string;

  name: string;

  role: string;

  designation: string;

  department: string;

  phone?: string | null;
  email?: string | null;

  photo_url?: string | null;

  sort_order: number;

  published: boolean;

  created_at?: string;
  updated_at?: string;
}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

export interface Announcement {
  id: string;

  title: string;
  message: string;

  priority: AnnouncementPriority;

  published: boolean;

  created_at: string;

  expires_at?: string | null;

  updated_at?: string;
}


// ============================================================
// RESULTS
// ============================================================

export interface HackathonResult {
  id: string;

  team_id: string;

  team_code: string;
  team_name: string;

  position: string;

  prize_title: string;

  leader_name: string;

  campus: CampusType;

  published: boolean;

  announced_at?: string | null;

  created_at?: string;
  updated_at?: string;
}


// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLog {
  id: string;

  actor_id?: string | null;

  // Joined actor information for UI
  actor?: string | null;

  action: string;

  entity_type: string;
  entity?: string;

  entity_id?: string | null;

  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;

  created_at: string;
}


// ============================================================
// LIVE / DASHBOARD STATISTICS
// ============================================================

export interface LiveStats {
  registered_teams: number;

  total_participants: number;

  offline_teams: number;

  north_campus_teams: number;
  south_campus_teams: number;

  submissions_count: number;
}


// ============================================================
// CONTACT CONFIGURATION
// ============================================================

export interface ContactConfig {
  email: string;

  phone: string;

  address: string;

  northCampusVenue: string;

  southCampusVenue: string;

  whatsappCommunityLink: string;

  workingHours: string;
}


// ============================================================
// EVENT SETTINGS
// ============================================================

export interface EventSettings {
  id?: string;

  registration_open: boolean;

  registration_deadline: string;

  event_start_date: string;

  event_end_date: string;

  timezone: string;

  created_at?: string;
  updated_at?: string;
}


// ============================================================
// FACULTY ASSIGNMENT
// ============================================================

export interface FacultyAssignment {
  id: string;

  team_id: string;

  faculty_id: string;

  assigned_at?: string;

  assigned_by?: string | null;
}


// ============================================================
// TEAM REGISTRATION INPUT
// ============================================================

export interface TeamRegistrationMemberInput {
  name: string;
  usn: string;
  email: string;
  phone?: string;
  branch: string;
  year: string;
  semester?: string;
  section: string;
  campus: CampusType;
}


export interface TeamRegistrationInput {
  team_name: string;

  mode: ParticipationMode;

  campus: CampusType;

  members: TeamRegistrationMemberInput[];
}


// ============================================================
// SUBMISSION INPUT
// ============================================================

export interface SubmissionUploadInput {
  team_id: string;

  storage_path: string;

  file_name: string;

  file_type: string;

  file_size: number;
}


// ============================================================
// ADMIN DASHBOARD
// ============================================================

export interface AdminDashboardStats {
  registered_teams: number;

  total_students: number;

  active_faculty: number;

  allocated_teams: number;

  unallocated_teams: number;

  submissions: number;

  shortlisted_teams: number;

  published_results: number;
}


// ============================================================
// FACULTY DASHBOARD
// ============================================================

export interface FacultyDashboardStats {
  assigned_teams: number;

  submitted_teams: number;

  pending_submissions: number;

  shortlisted_teams: number;
}


// ============================================================
// CERTIFICATE
// ============================================================

export type CertificateType =
  | 'participant'
  | 'winner'
  | 'faculty'
  | 'organizer';


export interface CertificateData {
  certificate_id: string;

  recipient_name: string;

  team_name?: string;

  team_code?: string;

  certificate_type: CertificateType;

  position?: string;

  prize_title?: string;

  issued_date: string;

  issued_by?: string;

  remarks?: string;
}


// ============================================================
// REPORT
// ============================================================

export type ReportType =
  | 'official'
  | 'teams'
  | 'students'
  | 'faculty'
  | 'submissions'
  | 'results'
  | 'complete';


export interface ReportGenerationOptions {
  report_type: ReportType;

  include_students?: boolean;

  include_teams?: boolean;

  include_faculty?: boolean;

  include_submissions?: boolean;

  include_results?: boolean;

  include_phases?: boolean;

  include_audit_logs?: boolean;
}