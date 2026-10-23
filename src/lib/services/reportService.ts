import { jsPDF } from 'jspdf';
import { hackathonStore } from '../store/hackathonStore';


async function imagePathToDataUri(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function addInstitutionLogos(doc: jsPDF) {
  const [nieLogo, cseLogo] = await Promise.all([
    imagePathToDataUri('/assets/branding/nie-logo.png'),
    imagePathToDataUri('/assets/branding/cse-logo.png'),
  ]);

  try {
    if (nieLogo) doc.addImage(nieLogo, 'PNG', 166, 7, 18, 18, undefined, 'FAST');
  } catch {
    // Branding is optional at runtime if the asset is unavailable.
  }

  try {
    if (cseLogo) doc.addImage(cseLogo, 'PNG', 145, 7, 18, 18, undefined, 'FAST');
  } catch {
    // Branding is optional at runtime if the asset is unavailable.
  }
}

export interface ReportGenerationOptions {
  includeTeams?: boolean;
  includeFaculty?: boolean;
  includeSubmissions?: boolean;
  includeResults?: boolean;
  format?: 'pdf' | 'docx';
}

export class ReportService {
  public static generateOfficialReportPDF(_options: ReportGenerationOptions = {}): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const stats = hackathonStore.getLiveStats();
    const teams = hackathonStore.getTeams();
    const faculty = hackathonStore.getFaculty();
    const phases = hackathonStore.getPhases();
    const results = hackathonStore.getResults();

    let yPos = 20;

    // Header Background Accent
    doc.setFillColor(7, 9, 13);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setFillColor(255, 122, 48);
    doc.rect(0, 44, 210, 2, 'F');

    // Header Titles
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 122, 48);
    doc.setFontSize(10);
    doc.text("THE NATIONAL INSTITUTE OF ENGINEERING, MYSORE", 15, 15);

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("NIErnaya — OFFICIAL REPORT", 15, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(54, 217, 255);
    doc.text("FROM DATA TO DECISION | 26 OCT – 13 NOV 2026", 15, 34);

    yPos = 55;

    // Section 1: Executive Overview
    doc.setTextColor(23, 58, 140);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. EXECUTIVE SUMMARY & OBJECTIVES", 15, yPos);
    yPos += 7;

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const summaryText = "NIErnaya was organized by The National Institute of Engineering (NIE), Mysuru as a team-based competition targeting 2nd Year (3rd Semester) engineering students across North and South campuses. The event was structured across three specialized phases: Data Hunt (Problem Formulation), Data Lab (EDA & Visualization), and Live Data Battle (Offline Finale at North Campus).";
    const splitSummary = doc.splitTextToSize(summaryText, 180);
    doc.text(splitSummary, 15, yPos);
    yPos += (splitSummary.length * 5) + 6;

    // Section 2: Key Registration Telemetry & Metrics
    doc.setTextColor(23, 58, 140);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. EVENT PARTICIPATION METRICS", 15, yPos);
    yPos += 7;

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, yPos, 180, 26, 3, 3, 'F');
    doc.setDrawColor(200, 210, 220);
    doc.roundedRect(15, yPos, 180, 26, 3, 3, 'D');

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Registered Teams: ${stats.registered_teams}`, 22, yPos + 8);
    doc.text(`Total Participants: ${stats.total_participants}`, 22, yPos + 18);

    doc.text(`Participation Format: Offline`, 85, yPos + 18);

    doc.text(`North Campus Teams: ${stats.north_campus_teams}`, 145, yPos + 8);
    doc.text(`South Campus Teams: ${stats.south_campus_teams}`, 145, yPos + 18);

    yPos += 34;

    // Section 3: Phase Progression
    doc.setTextColor(23, 58, 140);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. NIErnaya PHASES & STRUCTURE", 15, yPos);
    yPos += 7;

    // Phase 1 criteria supplied by the CSE faculty committee.
    if (phases.some((phase) => phase.id === 'phase-1')) {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(23, 58, 140);
      doc.text('PHASE 1 CLEARANCE CRITERIA', 18, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      const criteria = 'The problem statement must address SDG 2 – Zero Hunger, SDG 3 – Good Health and Well-being, SDG 4 – Quality Education, SDG 5 – Gender Equality, or SDG 13 – Climate Action; demonstrate strong societal impact or social need in India; and have good scope for an interdisciplinary student project. Priority is given to datasets encountering real-time challenges. These criteria must be satisfied to clear Phase 1.';
      const criteriaLines = doc.splitTextToSize(criteria, 174);
      doc.text(criteriaLines, 18, yPos);
      yPos += criteriaLines.length * 4 + 5;
    }

    phases.forEach((phase) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${phase.name}: ${phase.focus} (${phase.dates})`, 18, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text(`Venue / Mode: ${phase.campus_info} | Status: ${phase.status.toUpperCase()}`, 18, yPos);
      yPos += 6;
    });

    yPos += 4;

    // Section 4: Faculty Organizing Committee
    doc.setTextColor(23, 58, 140);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("4. FACULTY MENTOR COMMITTEE (8 MEMBERS)", 15, yPos);
    yPos += 7;

    faculty.slice(0, 8).forEach((fac, idx) => {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`${idx + 1}. ${fac.name} — ${fac.designation}, Dept. of ${fac.department} (Assigned Teams: ${fac.assigned_count || 0})`, 18, yPos);
      yPos += 5;
    });

    // Add page for Teams and Results
    doc.addPage();
    let p2Y = 20;

    doc.setTextColor(23, 58, 140);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("5. REGISTERED SQUADS & TEAM DIRECTORY", 15, p2Y);
    p2Y += 8;

    if (teams.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("No registered teams recorded at this moment.", 18, p2Y);
      p2Y += 10;
    } else {
      teams.slice(0, 12).forEach((team) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`[${team.team_code}] ${team.team_name} — Leader: ${team.leader_name} (${team.campus} Campus | Offline)`, 18, p2Y);
        p2Y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const membersList = team.members.map(m => `${m.name} (${m.usn})`).join(', ');
        doc.text(`Members: ${membersList} | Faculty: ${team.assigned_faculty_name || 'Pending Assignment'}`, 18, p2Y);
        p2Y += 6;
      });
    }

    p2Y += 8;

    // Section 6: Results & Awards
    doc.setTextColor(23, 58, 140);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("6. RESULTS & MERIT HONORS", 15, p2Y);
    p2Y += 8;

    if (results.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("Official final results have not yet been published by the jury committee.", 18, p2Y);
    } else {
      results.forEach(res => {
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 122, 48);
        doc.text(`${res.position}: Team ${res.team_code} — "${res.team_name}" (${res.prize_title})`, 18, p2Y);
        p2Y += 6;
      });
    }

    // Signatures
    p2Y = 250;
    doc.setDrawColor(180, 180, 180);
    doc.line(20, p2Y, 70, p2Y);
    doc.line(135, p2Y, 190, p2Y);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Chief Faculty Convener", 28, p2Y + 5);
    doc.text("Principal / Dean Academic, NIE", 138, p2Y + 5);

    return doc;
  }

  public static async downloadReportPDF(filename = "NIErnaya_Official_Report.pdf") {
    const doc = this.generateOfficialReportPDF();
    await addInstitutionLogos(doc);
    doc.save(filename);
  }

  public static async downloadReportDOCX(filename = "NIErnaya_Official_Report.doc") {
    // Generate standard formatted Word Document HTML blob
    const stats = hackathonStore.getLiveStats();
    const teams = hackathonStore.getTeams();
    const faculty = hackathonStore.getFaculty();
    const phases = hackathonStore.getPhases();
    const [nieLogo, cseLogo] = await Promise.all([
      imagePathToDataUri('/assets/branding/nie-logo.png'),
      imagePathToDataUri('/assets/branding/cse-logo.png'),
    ]);

    const logoMarkup = `
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-bottom:12pt;">
        ${nieLogo ? `<img src="${nieLogo}" style="height:55px;max-width:120px;object-fit:contain;" />` : ''}
        ${cseLogo ? `<img src="${cseLogo}" style="height:55px;max-width:120px;object-fit:contain;" />` : ''}
      </div>`;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>NIErnaya Official Event Report</title>
      <style>
        body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; color: #111; line-height: 1.5; }
        h1 { color: #173A8C; font-size: 22pt; margin-bottom: 2pt; }
        h2 { color: #FF7A30; font-size: 14pt; margin-top: 20pt; border-bottom: 1px solid #ddd; padding-bottom: 4pt; }
        .sub { color: #555; font-size: 11pt; margin-bottom: 18pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 10pt; }
        th, td { border: 1px solid #ccc; padding: 6pt; font-size: 10pt; text-align: left; }
        th { background-color: #f2f5f9; color: #173A8C; }
      </style>
      </head>
      <body>
        ${logoMarkup}
        <h1>NIErnaya — OFFICIAL REPORT</h1>
        <div class="sub">The National Institute of Engineering (NIE), Mysuru | Computer Science and Engineering</div>
        
        <h2>1. Executive Summary</h2>
        <p>NIErnaya was organized by Department of Computer Science and Engineering, The National Institute of Engineering, Mysore for 2nd Year (3rd Semester) engineering students across all branches. The Data Detective Challenge was conducted in three progressive phases with structured phases and balanced faculty allocations.</p>

        <h2>2. Participation Statistics</h2>
        <table>
          <tr><th>Metric</th><th>Value</th><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Registered Teams</td><td>${stats.registered_teams}</td><td>Total Participants</td><td>${stats.total_participants}</td></tr>
          <tr><td>Participation Format</td><td colspan="3">Offline</td></tr>
          <tr><td>North Campus Teams</td><td>${stats.north_campus_teams}</td><td>South Campus Teams</td><td>${stats.south_campus_teams}</td></tr>
        </table>

        <h2>3. Event Phases</h2>
        <ul>
          ${phases.map(p => `<li><strong>${p.name}: ${p.focus}</strong> (${p.dates}) - <em>${p.campus_info}</em></li>`).join('')}
        </ul>

        <h2>4. Faculty Mentor Committee</h2>
        <ol>
          ${faculty.map(f => `<li>${f.name} — ${f.designation}, Dept. of ${f.department}</li>`).join('')}
        </ol>

        <h2>5. Registered Teams</h2>
        <table>
          <tr><th>Team Code</th><th>Team Name</th><th>Leader</th><th>Mode</th><th>Campus</th><th>Assigned Faculty</th></tr>
          ${teams.map(t => `
            <tr>
              <td>${t.team_code}</td>
              <td>${t.team_name}</td>
              <td>${t.leader_name} (${t.leader_email})</td>
              <td>Offline</td>
              <td>${t.campus}</td>
              <td>${t.assigned_faculty_name || 'Unassigned'}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
