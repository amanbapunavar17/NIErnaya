import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  GraduationCap,
  Edit3,
  Trash2,
  Plus,
  CheckCircle,
  Building2,
  Phone,
  Mail,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

type Faculty = {
  id: string;
  profile_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

type FacultyAssignment = {
  id: string;
  team_id: string;
  faculty_id: string;
  assigned_at: string;
  assigned_by: string | null;
};

type FacultyView = Faculty & {
  assigned_count: number;
};

const DEFAULT_DEPARTMENT =
  'Computer Science & Engineering';

export const AdminFacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [assignments, setAssignments] = useState<
    FacultyAssignment[]
  >([]);

  const [editingFaculty, setEditingFaculty] =
    useState<Faculty | null>(null);

  const [isAddingNew, setIsAddingNew] =
    useState(false);

  const [success, setSuccess] = useState<string | null>(
    null
  );

  const [error, setError] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // =========================================================
  // FORM STATE
  // =========================================================

  const [name, setName] = useState('');
  const [designation, setDesignation] = useState(
    'Assistant Professor'
  );
  const [department, setDepartment] =
    useState(DEFAULT_DEPARTMENT);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  // =========================================================
  // HELPERS
  // =========================================================

  const clearMessages = () => {
    setSuccess(null);
    setError(null);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);

    window.setTimeout(() => {
      setSuccess(null);
    }, 3500);
  };

  const closeForm = () => {
    setEditingFaculty(null);
    setIsAddingNew(false);

    setName('');
    setDesignation('Assistant Professor');
    setDepartment(DEFAULT_DEPARTMENT);
    setEmail('');
    setPhone('');
    setActive(true);
  };

  // =========================================================
  // LOAD FACULTY
  // =========================================================

  const loadFaculty = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase is not configured. Check your environment variables.'
      );
    }

    const {
      data,
      error: facultyError,
    } = await supabase
      .from('faculty')
      .select(
        `
          id,
          profile_id,
          name,
          email,
          phone,
          designation,
          department,
          active,
          sort_order,
          created_at,
          updated_at
        `
      )
      .order('sort_order', {
        ascending: true,
      });

    if (facultyError) {
      throw facultyError;
    }

    setFaculty((data || []) as Faculty[]);
  }, []);

  // =========================================================
  // LOAD FACULTY ASSIGNMENTS
  // =========================================================

  const loadAssignments =
    useCallback(async () => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error(
          'Supabase is not configured.'
        );
      }

      const {
        data,
        error: assignmentError,
      } = await supabase
        .from('faculty_assignments')
        .select(
          `
            id,
            team_id,
            faculty_id,
            assigned_at,
            assigned_by
          `
        );

      if (assignmentError) {
        throw assignmentError;
      }

      setAssignments(
        (data || []) as FacultyAssignment[]
      );
    }, []);

  // =========================================================
  // LOAD EVERYTHING
  // =========================================================

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadFaculty(),
        loadAssignments(),
      ]);
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to load faculty committee data.'
      );
    } finally {
      setLoading(false);
    }
  }, [loadFaculty, loadAssignments]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // =========================================================
  // FACULTY WITH ASSIGNMENT COUNTS
  // =========================================================

  const facultyView = useMemo<FacultyView[]>(() => {
    return faculty.map((member) => ({
      ...member,
      assigned_count: assignments.filter(
        (assignment) =>
          assignment.faculty_id === member.id
      ).length,
    }));
  }, [faculty, assignments]);

  // =========================================================
  // START EDIT
  // =========================================================

  const startEdit = (fac: Faculty) => {
    clearMessages();

    setEditingFaculty(fac);
    setIsAddingNew(false);

    setName(fac.name);
    setDesignation(
      fac.designation || 'Assistant Professor'
    );
    setDepartment(
      fac.department || DEFAULT_DEPARTMENT
    );
    setEmail(fac.email);
    setPhone(fac.phone || '');
    setActive(fac.active);
  };

  // =========================================================
  // START ADD
  // =========================================================

  const startAddNew = () => {
    clearMessages();

    setEditingFaculty(null);
    setIsAddingNew(true);

    setName('');
    setDesignation('Assistant Professor');
    setDepartment(DEFAULT_DEPARTMENT);
    setEmail('');
    setPhone('');
    setActive(true);
  };

  // =========================================================
  // SAVE FACULTY
  // =========================================================

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    clearMessages();

    const cleanName = name.trim();
    const cleanDesignation =
      designation.trim();
    const cleanDepartment =
      department.trim();
    const cleanEmail =
      email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail) {
      setError(
        'Faculty name and official email are required.'
      );
      return;
    }

    if (!cleanDesignation) {
      setError('Designation is required.');
      return;
    }

    if (!cleanDepartment) {
      setError('Department is required.');
      return;
    }

    if (!cleanEmail.endsWith('@nie.ac.in')) {
      setError(
        'Faculty email must use the official @nie.ac.in domain.'
      );
      return;
    }

    setSaving(true);

    try {
      // =====================================================
      // UPDATE EXISTING FACULTY
      // =====================================================

      if (editingFaculty) {
        const {
          error: updateError,
        } = await supabase
          .from('faculty')
          .update({
            name: cleanName,
            designation: cleanDesignation,
            department: cleanDepartment,
            email: cleanEmail,
            phone: cleanPhone || null,
            active,
          })
          .eq('id', editingFaculty.id);

        if (updateError) {
          throw updateError;
        }

        await loadFaculty();

        showSuccess(
          `Faculty details for "${cleanName}" updated successfully.`
        );

        closeForm();

        return;
      }

      // =====================================================
      // CREATE NEW FACULTY
      // =====================================================

      if (isAddingNew) {
        /*
         * Determine the next display order.
         *
         * Example:
         * Existing sort_order:
         * 1,2,3,4,5,6,7,8
         *
         * New faculty:
         * 9
         */
        const maxSortOrder =
          faculty.reduce(
            (maximum, member) =>
              Math.max(
                maximum,
                member.sort_order || 0
              ),
            0
          );

        const {
          error: insertError,
        } = await supabase
          .from('faculty')
          .insert({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || null,
            designation: cleanDesignation,
            department: cleanDepartment,
            active,
            sort_order:
              maxSortOrder + 1,
          });

        if (insertError) {
          throw insertError;
        }

        await loadFaculty();

        showSuccess(
          `New faculty coordinator "${cleanName}" added to the committee.`
        );

        closeForm();
      }
    } catch (err: any) {
      const message =
        err?.message ||
        'Failed to save faculty record.';

      if (
        message
          .toLowerCase()
          .includes('duplicate')
      ) {
        setError(
          'A faculty record with these details already exists.'
        );
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DEACTIVATE FACULTY
  // =========================================================

  const handleDelete = async (
    id: string,
    facName: string
  ) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    const member = faculty.find(
      (item) => item.id === id
    );

    if (!member) {
      setError(
        'Faculty record could not be found.'
      );
      return;
    }

    const assignedCount =
      assignments.filter(
        (assignment) =>
          assignment.faculty_id === id
      ).length;

    const confirmationMessage =
      assignedCount > 0
        ? `"${facName}" currently has ${assignedCount} assigned squad${
            assignedCount === 1 ? '' : 's'
          }.\n\nThey will be deactivated rather than deleted. Existing assignment records will remain intact.\n\nContinue?`
        : `Deactivate "${facName}" from the faculty committee?`;

    if (
      !window.confirm(
        confirmationMessage
      )
    ) {
      return;
    }

    setDeletingId(id);
    clearMessages();

    try {
      /*
       * IMPORTANT:
       *
       * We intentionally DO NOT hard-delete faculty.
       *
       * Faculty records may be referenced by:
       * - faculty_assignments
       * - audit logs
       * - historical reports
       * - future certificates
       *
       * Therefore inactive=true/false is safer.
       */
      const {
        error: updateError,
      } = await supabase
        .from('faculty')
        .update({
          active: false,
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await Promise.all([
        loadFaculty(),
        loadAssignments(),
      ]);

      showSuccess(
        `"${facName}" has been deactivated. Historical records were preserved.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to deactivate faculty member.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // REACTIVATE FACULTY
  // =========================================================

  const handleReactivate = async (
    id: string,
    facName: string
  ) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setDeletingId(id);
    clearMessages();

    try {
      const {
        error: updateError,
      } = await supabase
        .from('faculty')
        .update({
          active: true,
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await loadFaculty();

      showSuccess(
        `"${facName}" is active again and eligible for allocation.`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to reactivate faculty member.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Faculty Coordination Committee Manager
          </h1>

          <p className="text-xs sm:text-sm text-[#8B96A5] mt-1">
            Loading the live faculty committee from Supabase...
          </p>
        </div>

        <div className="min-h-[360px] rounded-3xl bg-[#0D1219] border border-white/10 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />

          <span className="text-xs font-mono text-[#8B96A5] uppercase tracking-wider">
            Loading faculty records...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8B5CF6] uppercase tracking-wider font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>FACULTY COMMITTEE CONTROL</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Faculty Coordination Committee Manager
          </h1>

          <p className="text-xs sm:text-sm text-[#8B96A5] mt-1">
            Manage official NIE faculty mentors and contact details,
            active status, and allocation eligibility.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading || saving}
            className="px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 hover:border-[#36D9FF]/40 transition-all disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>REFRESH</span>
          </button>

          <button
            type="button"
            onClick={startAddNew}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-mono text-xs font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-[#8B5CF6]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ADD FACULTY COORDINATOR</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8B96A5] uppercase">
            <GraduationCap className="w-4 h-4 text-[#8B5CF6]" />
            Total Faculty
          </div>

          <div className="text-2xl font-display font-black text-white mt-2">
            {faculty.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8B96A5] uppercase">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Active
          </div>

          <div className="text-2xl font-display font-black text-green-400 mt-2">
            {
              faculty.filter(
                (member) => member.active
              ).length
            }
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8B96A5] uppercase">
            <Users className="w-4 h-4 text-[#36D9FF]" />
            Assigned Squads
          </div>

          <div className="text-2xl font-display font-black text-[#36D9FF] mt-2">
            {assignments.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#8B96A5] uppercase">
            <AlertCircle className="w-4 h-4 text-[#FF7A30]" />
            Inactive
          </div>

          <div className="text-2xl font-display font-black text-[#FF7A30] mt-2">
            {
              faculty.filter(
                (member) => !member.active
              ).length
            }
          </div>
        </div>
      </div>

      {/* Edit / Add Form */}
      {(editingFaculty || isAddingNew) && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border-2 border-[#8B5CF6] space-y-6 shadow-2xl shadow-[#8B5CF6]/15 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#8B5CF6]" />

              <span>
                {editingFaculty
                  ? `Edit Faculty Record: ${editingFaculty.name}`
                  : 'Add New Faculty Coordinator'}
              </span>
            </h2>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="p-2 rounded-lg bg-[#121A23] text-[#8B96A5] hover:text-white disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={handleSave}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B96A5] font-bold">
                  FULL NAME
                </label>

                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  disabled={saving}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                />
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B96A5] font-bold">
                  DESIGNATION
                </label>

                <input
                  type="text"
                  placeholder="e.g. Professor / Associate Professor"
                  value={designation}
                  onChange={(e) =>
                    setDesignation(
                      e.target.value
                    )
                  }
                  required
                  disabled={saving}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B96A5] font-bold">
                  DEPARTMENT
                </label>

                <select
                  value={department}
                  onChange={(e) =>
                    setDepartment(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                >
                  <option value="Computer Science & Engineering">
                    Computer Science & Engineering
                  </option>

                  <option value="Artificial Intelligence & Machine Learning">
                    Artificial Intelligence & Machine Learning
                  </option>

                  <option value="Electronics & Communication">
                    Electronics & Communication
                  </option>

                  <option value="Electrical & Electronics">
                    Electrical & Electronics
                  </option>

                  <option value="Mechanical Engineering">
                    Mechanical Engineering
                  </option>

                  <option value="Civil Engineering">
                    Civil Engineering
                  </option>
                </select>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B96A5] font-bold">
                  OFFICIAL EMAIL
                </label>

                <input
                  type="email"
                  placeholder="name@nie.ac.in"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  disabled={saving}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B96A5] font-bold">
                  CONTACT PHONE
                </label>

                <input
                  type="text"
                  placeholder="+91 98450 00000"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  disabled={saving}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#8B5CF6] disabled:opacity-50"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#8B96A5] font-bold">
                  COMMITTEE STATUS
                </label>

                <label className="h-[38px] flex items-center gap-3 px-3.5 rounded-xl bg-[#121A23] border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) =>
                      setActive(
                        e.target.checked
                      )
                    }
                    disabled={saving}
                    className="rounded text-[#8B5CF6] focus:ring-0"
                  />

                  <span className="text-xs font-mono text-white">
                    Active
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-[10px] font-mono text-[#8B96A5]">
                {editingFaculty
                  ? 'Changes are written directly to Supabase.'
                  : 'New faculty records become part of the committee immediately.'}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/5 text-[#8B96A5] hover:text-white text-xs font-mono disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#8B5CF6] text-white font-mono text-xs font-bold hover:bg-[#9d74f8] flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}

                  <span>
                    {saving
                      ? 'SAVING...'
                      : editingFaculty
                      ? 'SAVE UPDATES'
                      : 'CREATE FACULTY RECORD'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Faculty Cards */}
      {facultyView.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#0D1219] border border-white/10 text-center">
          <GraduationCap className="w-10 h-10 text-[#8B96A5] mx-auto mb-3" />

          <h3 className="font-display font-bold text-white">
            No faculty records found
          </h3>

          <p className="text-xs font-mono text-[#8B96A5] mt-1">
            Add a faculty coordinator to begin building
            the committee.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {facultyView.map((fac, idx) => (
            <div
              key={fac.id}
              className={`p-5 rounded-2xl bg-[#0D1219] border transition-all flex flex-col justify-between group shadow-lg ${
                fac.active
                  ? 'border-white/10 hover:border-[#8B5CF6]/50'
                  : 'border-red-500/20 opacity-75'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] text-[#FF7A30] font-bold">
                    EVALUATOR{' '}
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(fac)
                      }
                      className="p-1.5 rounded hover:bg-white/10 text-[#36D9FF]"
                      title="Edit Faculty Record"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {fac.active ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            fac.id,
                            fac.name
                          )
                        }
                        disabled={
                          deletingId === fac.id
                        }
                        className="p-1.5 rounded hover:bg-white/10 text-red-400 disabled:opacity-50"
                        title="Deactivate Faculty"
                      >
                        {deletingId === fac.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleReactivate(
                            fac.id,
                            fac.name
                          )
                        }
                        disabled={
                          deletingId === fac.id
                        }
                        className="p-1.5 rounded hover:bg-white/10 text-green-400 disabled:opacity-50"
                        title="Reactivate Faculty"
                      >
                        {deletingId === fac.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-3">
                  {fac.active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-mono font-bold">
                      <CheckCircle className="w-3 h-3" />
                      ACTIVE / ALLOCATION ELIGIBLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-mono font-bold">
                      <X className="w-3 h-3" />
                      INACTIVE
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-display font-bold text-base text-white mb-1 group-hover:text-[#8B5CF6] transition-colors">
                  {fac.name}
                </h3>

                {/* Designation */}
                <div className="text-[11px] font-mono text-[#36D9FF] font-semibold mb-1">
                  {fac.designation ||
                    'Faculty Coordinator'}
                </div>

                {/* Department */}
                <div className="text-[11px] text-[#8B96A5]/80 flex items-center gap-1 mt-2">
                  <Building2 className="w-3 h-3 text-[#FF7A30]" />

                  <span>
                    {fac.department ||
                      'Department not specified'}
                  </span>
                </div>
              </div>

              {/* Contact + Load */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-[11px] font-mono text-[#8B96A5]">
                <div className="truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#36D9FF] shrink-0" />

                  <span className="truncate">
                    {fac.email}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#FF7A30] shrink-0" />

                  <span>
                    {fac.phone || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span>
                    Assigned Squads:
                  </span>

                  <span className="font-bold text-white">
                    {fac.assigned_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Committee Rules */}
      <div className="p-5 rounded-2xl bg-[#121A23] border border-[#8B5CF6]/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />

          <div>
            <h3 className="font-display font-bold text-sm text-white">
              Faculty Committee Rules
            </h3>

            <ul className="mt-2 space-y-1.5 text-[11px] text-[#8B96A5] font-mono">
              <li>
                • Active faculty members are eligible for
                automatic allocation.
              </li>

              <li>
                • Faculty deactivation preserves historical
                assignment records.
              </li>

              <li>
                • Existing faculty assignments are managed
                through the Allocation module.
              </li>

              <li>
                • Faculty records are stored in Supabase and
                are no longer dependent on localStorage.
              </li>

              <li>
                • Official faculty email addresses must use
                the @nie.ac.in domain.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};