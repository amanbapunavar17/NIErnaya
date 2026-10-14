import React, {
  useEffect,
  useState,
} from 'react';

import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
  ShieldCheck,
  Download,
  Loader2,
  ArrowLeft,
  Clock,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

const SUBMISSION_BUCKET =
  'drushtix-submissions';

const MAX_FILE_SIZE =
  20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  '.ppt',
  '.pptx',
  '.pdf',
];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

type StudentRow = {
  id: string;
  profile_id: string | null;
  name: string;
  usn: string;
  email: string;
};

type TeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  mode: 'Offline';
  campus: 'North' | 'South';
  registration_status:
    | 'draft'
    | 'submitted'
    | 'locked';
};

type SubmissionRow = {
  id: string;
  team_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  submitted_at: string;
  submitted_by: string;
  status:
    | 'submitted'
    | 'reviewed'
    | 'shortlisted'
    | 'rejected';
};

const getExtension = (
  fileName: string
) => {
  const lastDot =
    fileName.lastIndexOf('.');

  if (lastDot === -1) {
    return '';
  }

  return fileName
    .substring(lastDot)
    .toLowerCase();
};

const formatFileSize = (
  bytes: number
) =>
  (bytes / (1024 * 1024)).toFixed(2);

const sanitizeFileName = (
  fileName: string
) => {
  const lastDot =
    fileName.lastIndexOf('.');

  const extension =
    lastDot !== -1
      ? fileName
          .substring(lastDot)
          .toLowerCase()
      : '';

  const baseName =
    lastDot !== -1
      ? fileName.substring(
          0,
          lastDot
        )
      : fileName;

  const sanitizedBase =
    baseName
      .trim()
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        '-'
      )
      .replace(/-+/g, '-')
      .replace(
        /^-|-$/g,
        ''
      )
      .slice(0, 80);

  return `${
    sanitizedBase || 'submission'
  }${extension}`;
};

export const SubmissionPage: React.FC =
  () => {
    /* ========================================================
       STATE
    ======================================================== */

    const [
      submissionOpen,
      setSubmissionOpen,
    ] = useState(false);

    const [
      teamOverrideOpen,
      setTeamOverrideOpen,
    ] = useState(false);

    const [
      overrideExpiresAt,
      setOverrideExpiresAt,
    ] = useState<string | null>(
      null
    );

    const [
      overrideReason,
      setOverrideReason,
    ] = useState<string | null>(
      null
    );

    const [
      selectedFile,
      setSelectedFile,
    ] = useState<File | null>(
      null
    );

    const [
      loading,
      setLoading,
    ] = useState(true);

    const [
      uploading,
      setUploading,
    ] = useState(false);

    const [
      downloading,
      setDownloading,
    ] = useState(false);

    const [
      error,
      setError,
    ] = useState<string | null>(
      null
    );

    const [
      success,
      setSuccess,
    ] = useState<string | null>(
      null
    );

    const [
      student,
      setStudent,
    ] = useState<StudentRow | null>(
      null
    );

    const [
      team,
      setTeam,
    ] = useState<TeamRow | null>(
      null
    );

    const [
      existingSubmission,
      setExistingSubmission,
    ] =
      useState<SubmissionRow | null>(
        null
      );

    /* ========================================================
       LOAD SUBMISSION DATA
    ======================================================== */

    const loadSubmissionData =
      async () => {
        if (
          !isSupabaseConfigured ||
          !supabase
        ) {
          setError(
            'Supabase is not configured.'
          );

          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          /* -----------------------------------------------
             AUTHENTICATION
          ----------------------------------------------- */

          const {
            data: {
              user,
            },
            error: authError,
          } =
            await supabase.auth.getUser();

          if (authError) {
            throw authError;
          }

          if (!user) {
            throw new Error(
              'Your login session has expired.'
            );
          }

          /* -----------------------------------------------
             STUDENT
          ----------------------------------------------- */

          const {
            data: studentData,
            error: studentError,
          } =
            await supabase
              .from('students')
              .select(`
                id,
                profile_id,
                name,
                usn,
                email
              `)
              .eq(
                'profile_id',
                user.id
              )
              .maybeSingle();

          if (studentError) {
            throw studentError;
          }

          if (!studentData) {
            throw new Error(
              'Student profile not found.'
            );
          }

          const currentStudent =
            studentData as StudentRow;

          setStudent(
            currentStudent
          );

          /* -----------------------------------------------
             TEAM MEMBERSHIP
          ----------------------------------------------- */

          const {
            data: membership,
            error: membershipError,
          } =
            await supabase
              .from('team_members')
              .select(`
                id,
                team_id,
                student_id
              `)
              .eq(
                'student_id',
                currentStudent.id
              )
              .maybeSingle();

          if (membershipError) {
            throw membershipError;
          }

          /* -----------------------------------------------
             NO TEAM
          ----------------------------------------------- */

          if (!membership) {
            setTeam(null);
            setExistingSubmission(
              null
            );

            setSubmissionOpen(false);
            setTeamOverrideOpen(false);
            setOverrideExpiresAt(null);
            setOverrideReason(null);

            return;
          }

          /* -----------------------------------------------
             TEAM
          ----------------------------------------------- */

          const {
            data: teamData,
            error: teamError,
          } =
            await supabase
              .from('teams')
              .select(`
                id,
                team_code,
                team_name,
                leader_student_id,
                mode,
                campus,
                registration_status
              `)
              .eq(
                'id',
                membership.team_id
              )
              .maybeSingle();

          if (teamError) {
            throw teamError;
          }

          if (!teamData) {
            throw new Error(
              'Your team could not be found.'
            );
          }

          const currentTeam =
            teamData as TeamRow;

          setTeam(currentTeam);

          /* -----------------------------------------------
             EXISTING SUBMISSION
          ----------------------------------------------- */

          const {
            data: submissionData,
            error: submissionError,
          } =
            await supabase
              .from('submissions')
              .select(`
                id,
                team_id,
                storage_path,
                file_name,
                file_type,
                file_size,
                submitted_at,
                submitted_by,
                status
              `)
              .eq(
                'team_id',
                currentTeam.id
              )
              .maybeSingle();

          if (submissionError) {
            throw submissionError;
          }

          setExistingSubmission(
            submissionData
              ? (submissionData as SubmissionRow)
              : null
          );

          /* -----------------------------------------------
             ADMIN CONTROLLED SUBMISSION ACCESS

             The backend decides whether:
             1. Global submission portal is open
             2. This specific team has an override
             3. This team is currently allowed to submit
          ----------------------------------------------- */

          const {
            data: accessState,
            error: accessError,
          } =
            await supabase.rpc(
              'get_team_submission_access',
              {
                p_team_id:
                  currentTeam.id,
              }
            );

          if (accessError) {
            throw accessError;
          }

          const access =
            Array.isArray(
              accessState
            )
              ? accessState[0]
              : accessState;

          const globalOpen =
            Boolean(
              access?.global_open
            );

          const teamOverride =
            Boolean(
              access?.team_override_open
            );

          const currentlyAccepting =
            Boolean(
              access?.currently_accepting
            );

          setSubmissionOpen(
            currentlyAccepting
          );

          setTeamOverrideOpen(
            teamOverride
          );

          setOverrideExpiresAt(
            access?.override_expires_at ??
              null
          );

          setOverrideReason(
            access?.override_reason ??
              null
          );

          if (
            !currentlyAccepting
          ) {
            setSelectedFile(null);
          }

          console.log(
            'Submission access:',
            {
              globalOpen,
              teamOverride,
              currentlyAccepting,
              expiresAt:
                access?.override_expires_at,
            }
          );
        } catch (err) {
          console.error(
            'Failed to load submission data:',
            err
          );

          const message =
            err &&
            typeof err === 'object' &&
            'message' in err
              ? String(
                  (
                    err as {
                      message?: unknown;
                    }
                  ).message
                )
              : 'Unable to load submission information.';

          setError(message);
        } finally {
          setLoading(false);
        }
      };

    /* ========================================================
       INITIAL LOAD
    ======================================================== */

    useEffect(() => {
      void loadSubmissionData();
    }, []);

    /* ========================================================
       FILE SELECTION
    ======================================================== */

    const handleFileChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      setError(null);
      setSuccess(null);

      const file =
        e.target.files?.[0];

      if (!file) {
        setSelectedFile(null);
        return;
      }

      const extension =
        getExtension(file.name);

      if (
        !ALLOWED_EXTENSIONS.includes(
          extension
        )
      ) {
        setError(
          'Only .ppt, .pptx or .pdf files are accepted.'
        );

        setSelectedFile(null);
        e.target.value = '';

        return;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setError(
          'File size exceeds the 20 MB maximum.'
        );

        setSelectedFile(null);
        e.target.value = '';

        return;
      }

      if (
        file.type &&
        !ALLOWED_MIME_TYPES.includes(
          file.type
        )
      ) {
        setError(
          'The selected file type is not supported.'
        );

        setSelectedFile(null);
        e.target.value = '';

        return;
      }

      setSelectedFile(file);
    };

    /* ========================================================
       UPLOAD
    ======================================================== */

    const handleUpload = async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      setError(null);
      setSuccess(null);

      if (!supabase) {
        setError(
          'Supabase is not configured.'
        );

        return;
      }

      /*
       * Client-side gate.
       * Backend RPC also validates this.
       */
      if (!submissionOpen) {
        setError(
          'Submission Portal is currently closed for your team.'
        );

        return;
      }

      if (!student || !team) {
        setError(
          'Please register your team before submitting.'
        );

        return;
      }

      if (
        team.leader_student_id !==
        student.id
      ) {
        setError(
          'Only the registered team leader can submit.'
        );

        return;
      }

      if (existingSubmission) {
        setError(
          'Your team has already submitted a file.'
        );

        return;
      }

      if (!selectedFile) {
        setError(
          'Please select your presentation file.'
        );

        return;
      }

      if (
        selectedFile.size >
        MAX_FILE_SIZE
      ) {
        setError(
          'File size exceeds 20 MB.'
        );

        return;
      }

      setUploading(true);

      let uploadedStoragePath:
        | string
        | null = null;

      try {
        /* -----------------------------------------------
           AUTHENTICATION
        ----------------------------------------------- */

        const {
          data: {
            user,
          },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error(
            'Your login session has expired.'
          );
        }

        /* -----------------------------------------------
           STORAGE PATH
        ----------------------------------------------- */

        const safeName =
          sanitizeFileName(
            selectedFile.name
          );

        /*
         * IMPORTANT:
         * Storage path begins with TEAM UUID.
         * This matches Storage RLS.
         */
        const storagePath =
          `${team.id}/${crypto.randomUUID()}-${safeName}`;

        uploadedStoragePath =
          storagePath;

        /* -----------------------------------------------
           STORAGE UPLOAD
        ----------------------------------------------- */

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              SUBMISSION_BUCKET
            )
            .upload(
              storagePath,
              selectedFile,
              {
                cacheControl:
                  '3600',

                upsert: false,

                contentType:
                  selectedFile.type ||
                  'application/octet-stream',
              }
            );

        if (uploadError) {
          throw new Error(
            `File upload failed: ${uploadError.message}`
          );
        }

        /* -----------------------------------------------
           DATABASE SUBMISSION
        ----------------------------------------------- */

        const {
          data: submissionData,
          error: rpcError,
        } =
          await supabase.rpc(
            'submit_team_submission',
            {
              p_team_id:
                team.id,

              p_storage_path:
                storagePath,

              p_file_name:
                selectedFile.name,

              p_file_type:
                selectedFile.type ||
                'application/octet-stream',

              p_file_size:
                selectedFile.size,
            }
          );

        if (rpcError) {
          throw new Error(
            `Submission registration failed: ${rpcError.message}`
          );
        }

        if (!submissionData) {
          throw new Error(
            'The submission could not be confirmed.'
          );
        }

        setExistingSubmission(
          submissionData as SubmissionRow
        );

        setSelectedFile(null);

        setSuccess(
          'Your project submission has been successfully uploaded.'
        );

        const input =
          document.getElementById(
            'file-upload'
          ) as HTMLInputElement | null;

        if (input) {
          input.value = '';
        }
      } catch (err) {
        console.error(
          'Submission upload error:',
          err
        );

        /* -----------------------------------------------
           STORAGE CLEANUP
        ----------------------------------------------- */

        if (
          uploadedStoragePath
        ) {
          try {
            await supabase.storage
              .from(
                SUBMISSION_BUCKET
              )
              .remove([
                uploadedStoragePath,
              ]);
          } catch {
            // Ignore cleanup failure.
          }
        }

        const message =
          err &&
          typeof err === 'object' &&
          'message' in err
            ? String(
                (
                  err as {
                    message?: unknown;
                  }
                ).message
              )
            : 'Failed to submit project.';

        setError(message);
      } finally {
        setUploading(false);
      }
    };

    /* ========================================================
       DOWNLOAD
    ======================================================== */

    const handleDownload =
      async () => {
        if (
          !supabase ||
          !existingSubmission
        ) {
          return;
        }

        setDownloading(true);
        setError(null);

        try {
          const {
            data,
            error:
              downloadError,
          } =
            await supabase.storage
              .from(
                SUBMISSION_BUCKET
              )
              .createSignedUrl(
                existingSubmission.storage_path,
                300
              );

          if (downloadError) {
            throw downloadError;
          }

          if (
            !data?.signedUrl
          ) {
            throw new Error(
              'Unable to generate secure download link.'
            );
          }

          window.open(
            data.signedUrl,
            '_blank',
            'noopener,noreferrer'
          );
        } catch (err) {
          const message =
            err &&
            typeof err === 'object' &&
            'message' in err
              ? String(
                  (
                    err as {
                      message?: unknown;
                    }
                  ).message
                )
              : 'Unable to download submission.';

          setError(message);
        } finally {
          setDownloading(false);
        }
      };

    /* ========================================================
       LOADING
    ======================================================== */

    if (loading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-7 h-7 text-[#36D9FF] animate-spin" />

            <p className="text-xs font-mono text-[#8B96A5]">
              LOADING SUBMISSION HUB...
            </p>
          </div>
        </div>
      );
    }

    /* ========================================================
       PAGE
    ======================================================== */

    return (
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div>
          <Link
            to="/student"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-[#8B96A5] hover:text-white mb-5"
          >
            <ArrowLeft className="w-3 h-3" />
            BACK TO LEADER DESK
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-[#36D9FF] font-bold">
            <UploadCloud className="w-4 h-4" />
            SUBMISSION HUB
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Project Submission
          </h1>

          <p className="text-xs text-[#8B96A5] mt-2">
            Upload your official NIErnaya project
            presentation when the submission portal is
            open.
          </p>
        </div>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />

            <span>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />

            <span>
              {success}
            </span>
          </div>
        )}

        {/* ====================================================
            NO TEAM
        ==================================================== */}

        {!team && (
          <div className="p-8 rounded-3xl bg-[#0D1219] border border-[#FF7A30]/30 text-center">
            <AlertCircle className="w-10 h-10 text-[#FF7A30] mx-auto" />

            <h2 className="font-display font-bold text-white mt-4">
              Team Registration Required
            </h2>

            <p className="text-xs text-[#8B96A5] mt-2">
              Register your team before accessing the
              submission hub.
            </p>

            <Link
              to="/student/team"
              className="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-[#FF7A30] text-[#07090D] text-xs font-mono font-bold"
            >
              REGISTER YOUR TEAM
            </Link>
          </div>
        )}

        {/* ====================================================
            PORTAL CLOSED
        ==================================================== */}

        {team &&
          !existingSubmission &&
          !submissionOpen && (
            <div className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-[#0D1219] border border-red-500/20 text-center">

              <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />

              <div className="relative">

                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center">
                  <Lock className="w-10 h-10 text-red-400" />
                </div>

                <p className="text-[10px] font-mono font-bold tracking-[0.25em] text-red-400 mt-6">
                  SUBMISSION PORTAL
                </p>

                <h2 className="font-display font-black text-3xl text-white mt-2">
                  CURRENTLY CLOSED
                </h2>

                <p className="max-w-xl mx-auto text-sm text-[#8B96A5] mt-4 leading-relaxed">
                  The Data Detective Challenge Admin has not opened the
                  submission portal for your team.
                </p>

                <div className="mt-7 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#121A23] border border-white/10 text-xs font-mono text-[#8B96A5]">
                  <Clock className="w-4 h-4 text-[#FF7A30]" />
                  Please check back later
                </div>

                <div className="mt-7 text-[10px] font-mono text-[#8B96A5]">
                  TEAM:{' '}
                  <span className="text-[#36D9FF]">
                    {team.team_code}
                  </span>
                </div>

              </div>
            </div>
          )}

        {/* ====================================================
            EXISTING SUBMISSION
        ==================================================== */}

        {existingSubmission && (
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border-2 border-green-500/30 space-y-5">

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>

              <div>
                <p className="text-[10px] font-mono text-green-400 font-bold">
                  SUBMISSION SUCCESSFUL
                </p>

                <h2 className="font-display font-bold text-lg text-white">
                  {existingSubmission.file_name}
                </h2>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#121A23] border border-white/5 text-xs font-mono text-[#8B96A5]">
              Uploaded:{' '}
              {new Date(
                existingSubmission.submitted_at
              ).toLocaleString(
                'en-IN'
              )}
              {' • '}
              {formatFileSize(
                existingSubmission.file_size
              )}{' '}
              MB
            </div>

            <div className="p-4 rounded-xl bg-[#121A23] border border-white/5 text-xs text-[#8B96A5] flex gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />

              <span>
                Your submission is stored securely in the
                private NIErnaya repository. The team
                cannot upload another file through the
                student portal.
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleDownload()
              }
              disabled={
                downloading
              }
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 hover:border-[#36D9FF]/50 hover:text-[#36D9FF] disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}

              {downloading
                ? 'GENERATING LINK...'
                : 'DOWNLOAD SUBMISSION'}
            </button>
          </div>
        )}

        {/* ====================================================
            UPLOAD FORM
        ==================================================== */}

        {team &&
          !existingSubmission &&
          submissionOpen && (
            <form
              onSubmit={handleUpload}
              className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6"
            >

              {/* ---------------------------------------------
                  ACCESS STATUS
              --------------------------------------------- */}

              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  teamOverrideOpen
                    ? 'bg-orange-500/5 border border-orange-500/30'
                    : 'bg-green-500/5 border border-green-500/20'
                }`}
              >
                {teamOverrideOpen ? (
                  <Clock className="w-5 h-5 text-[#FF7A30]" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}

                <div>
                  <p
                    className={`text-xs font-mono font-bold ${
                      teamOverrideOpen
                        ? 'text-[#FF7A30]'
                        : 'text-green-400'
                    }`}
                  >
                    {teamOverrideOpen
                      ? 'SPECIAL TEAM ACCESS GRANTED'
                      : 'SUBMISSION PORTAL OPEN'}
                  </p>

                  <p className="text-[10px] text-[#8B96A5] mt-1">
                    {teamOverrideOpen
                      ? overrideReason ||
                        'Temporary administrative submission access has been granted to your team.'
                      : 'Your team can now upload the official project presentation.'}
                  </p>

                  {teamOverrideOpen &&
                    overrideExpiresAt && (
                      <p className="text-[10px] font-mono text-orange-300 mt-2">
                        ACCESS UNTIL:{' '}
                        {new Date(
                          overrideExpiresAt
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </p>
                    )}
                </div>
              </div>

              {/* ---------------------------------------------
                  LEADER WARNING
              --------------------------------------------- */}

              {student &&
                team.leader_student_id !==
                  student.id && (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-mono">
                    Only the registered team leader can
                    upload the official submission.
                  </div>
                )}

              {/* ---------------------------------------------
                  FILE PICKER
              --------------------------------------------- */}

              <div className="border-2 border-dashed border-[#FF7A30]/40 rounded-2xl p-8 flex flex-col items-center text-center gap-4">

                <div className="w-16 h-16 rounded-full bg-[#121A23] border border-white/10 flex items-center justify-center">
                  <UploadCloud className="w-8 h-8 text-[#FF7A30]" />
                </div>

                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <span className="font-display font-bold text-sm text-white hover:text-[#36D9FF]">
                    Click to choose your presentation
                  </span>

                  <input
                    id="file-upload"
                    type="file"
                    accept=".ppt,.pptx,.pdf"
                    onChange={
                      handleFileChange
                    }
                    className="sr-only"
                    disabled={
                      uploading ||
                      team.leader_student_id !==
                        student?.id
                    }
                  />
                </label>

                <p className="text-xs text-[#8B96A5] font-mono">
                  .PPT • .PPTX • .PDF • MAX 20 MB
                </p>

                {selectedFile && (
                  <div className="p-3 px-4 rounded-xl bg-[#07090D] border border-[#36D9FF]/40 text-xs font-mono text-[#36D9FF] flex gap-2 max-w-full">
                    <FileText className="w-4 h-4 shrink-0" />

                    <span className="truncate">
                      {selectedFile.name}
                      {' • '}
                      {formatFileSize(
                        selectedFile.size
                      )}{' '}
                      MB
                    </span>
                  </div>
                )}
              </div>

              {/* ---------------------------------------------
                  SECURITY INFO
              --------------------------------------------- */}

              <div className="p-4 rounded-xl bg-[#121A23] border border-white/5 text-xs text-[#8B96A5] flex gap-2">
                <ShieldCheck className="w-4 h-4 text-[#36D9FF] shrink-0" />

                <span>
                  One submission per team. After successful
                  upload, the student submission is stored
                  and cannot be replaced from the student
                  portal.
                </span>
              </div>

              {/* ---------------------------------------------
                  SUBMIT
              --------------------------------------------- */}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                <div className="text-xs font-mono text-[#8B96A5]">
                  TEAM:{' '}
                  <span className="text-white">
                    {team.team_code}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={
                    uploading ||
                    !selectedFile ||
                    team.leader_student_id !==
                      student?.id
                  }
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      UPLOADING...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      SUBMIT PROJECT
                    </>
                  )}
                </button>

              </div>
            </form>
          )}

        {/* ====================================================
            INFO
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
            <ShieldCheck className="w-5 h-5 text-[#36D9FF] mb-3" />

            <p className="text-[10px] font-mono text-[#8B96A5]">
              STORAGE
            </p>

            <p className="text-sm font-bold text-white mt-1">
              Private Repository
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
            <Lock className="w-5 h-5 text-green-400 mb-3" />

            <p className="text-[10px] font-mono text-[#8B96A5]">
              SUBMISSION
            </p>

            <p className="text-sm font-bold text-white mt-1">
              One Upload Per Team
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
            <FileText className="w-5 h-5 text-[#FF7A30] mb-3" />

            <p className="text-[10px] font-mono text-[#8B96A5]">
              LIMIT
            </p>

            <p className="text-sm font-bold text-white mt-1">
              20 MB Maximum
            </p>
          </div>

        </div>
      </div>
    );
  };