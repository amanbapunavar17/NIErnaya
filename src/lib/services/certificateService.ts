import { jsPDF } from 'jspdf';

export type CertificateCategory =
  | 'participant'
  | 'winner'
  | 'faculty'
  | 'organizer'
  | 'volunteer';

export interface CertificateData {
  recipientName: string;
  category: CertificateCategory;
  teamName?: string;
  teamCode?: string;
  positionTitle?: string;
  usn?: string;
  department?: string;
  certificateNumber?: string;
  issuedDate?: string;
}

const BRAND = {
  cream: '#F5EED8',
  dark: '#171717',
  orange: '#FF6A1A',
  blue: '#1D5D8F',
};

async function assetToDataUri(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString(36)
    .toUpperCase()
    .slice(0, 6);

  return `NIERNAYA-CERT-${timestamp}-${randomPart}`;
}

function getCertificateTitle(category: CertificateCategory): string {
  switch (category) {
    case 'winner':
      return 'CERTIFICATE OF EXCELLENCE';
    case 'faculty':
      return 'CERTIFICATE OF FACULTY RECOGNITION';
    case 'organizer':
      return 'CERTIFICATE OF ORGANIZING EXCELLENCE';
    case 'volunteer':
      return 'CERTIFICATE OF VOLUNTEER APPRECIATION';
    case 'participant':
    default:
      return 'CERTIFICATE OF PARTICIPATION';
  }
}

function getCertificateDescription(data: CertificateData): string {
  switch (data.category) {
    case 'winner':
      return `for securing ${data.positionTitle || 'TOP HONORS'} as part of Team "${data.teamName || 'Squad'}" [${data.teamCode || 'NIErnaya'}], in recognition of outstanding analytical thinking, data interpretation, visualization, and presentation.`;
    case 'faculty':
      return 'for valuable academic guidance and mentorship provided during NIErnaya — From Data to Decision.';
    case 'organizer':
      return 'in recognition of outstanding leadership, coordination, technical contribution, and dedication towards the successful execution of NIErnaya — Data Detective Challenge.';
    case 'volunteer':
      return 'in appreciation of valuable volunteer service, teamwork, and dedicated support in conducting NIErnaya — From Data to Decision.';
    case 'participant':
    default:
      return `for active and commendable participation in NIErnaya — Data Detective Challenge at The National Institute of Engineering, Mysuru.`;
  }
}

export class CertificateService {
  public static async generateCertificatePDF(data: CertificateData): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const [nieLogo, cseLogo] = await Promise.all([
      assetToDataUri('/assets/branding/nie-logo.png'),
      assetToDataUri('/assets/branding/cse-logo.png'),
    ]);

    const certificateNumber = data.certificateNumber || generateCertificateNumber();
    const issuedDate = data.issuedDate || new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Clean institutional certificate background.
    doc.setFillColor(BRAND.cream);
    doc.rect(0, 0, 297, 210, 'F');

    // Minimal double-line frame.
    doc.setDrawColor(BRAND.dark);
    doc.setLineWidth(0.8);
    doc.rect(10, 10, 277, 190);
    doc.setDrawColor(BRAND.orange);
    doc.setLineWidth(0.35);
    doc.rect(14, 14, 269, 182);

    // Institutional logos.
    try {
      if (nieLogo) doc.addImage(nieLogo, 'PNG', 24, 23, 28, 28, undefined, 'FAST');
    } catch {}
    try {
      if (cseLogo) doc.addImage(cseLogo, 'PNG', 245, 23, 28, 28, undefined, 'FAST');
    } catch {}

    // Institution.
    doc.setTextColor(BRAND.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('THE NATIONAL INSTITUTE OF ENGINEERING, MYSURU', 148.5, 27, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND.blue);
    doc.text('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING', 148.5, 34, { align: 'center' });

    // Event.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(27);
    doc.setTextColor(BRAND.orange);
    doc.text('NIErnaya', 148.5, 54, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setTextColor(BRAND.dark);
    doc.text('DATA DETECTIVE CHALLENGE • 2026', 148.5, 62, { align: 'center' });

    // Certificate title.
    doc.setFontSize(16);
    doc.setTextColor(BRAND.dark);
    doc.text(getCertificateTitle(data.category), 148.5, 78, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#555555');
    doc.text('This certificate is proudly presented to', 148.5, 91, { align: 'center' });

    // Recipient.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(25);
    doc.setTextColor(BRAND.blue);
    const recipient = data.recipientName.trim().toUpperCase();
    doc.text(recipient, 148.5, 106, { align: 'center' });

    // Underline.
    const recipientWidth = Math.min(doc.getTextWidth(recipient) + 16, 210);
    doc.setDrawColor(BRAND.orange);
    doc.setLineWidth(0.6);
    doc.line(148.5 - recipientWidth / 2, 110, 148.5 + recipientWidth / 2, 110);

    // Description.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor('#444444');
    const description = doc.splitTextToSize(getCertificateDescription(data), 205);
    doc.text(description, 148.5, 122, { align: 'center' });

    // Verification line.
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor('#666666');
    doc.text(`Certificate ID: ${certificateNumber}  •  Issued: ${issuedDate}`, 148.5, 145, { align: 'center' });

    if (data.teamName || data.teamCode || data.usn) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const meta = [
        data.teamName ? `Team: ${data.teamName}` : '',
        data.teamCode ? `Team ID: ${data.teamCode}` : '',
        data.usn ? `USN: ${data.usn}` : '',
      ].filter(Boolean).join('   •   ');
      doc.text(meta, 148.5, 153, { align: 'center' });
    }

    // Signatures.
    const y = 176;
    doc.setDrawColor('#777777');
    doc.setLineWidth(0.35);
    doc.line(42, y, 92, y);
    doc.line(123.5, y, 173.5, y);
    doc.line(205, y, 255, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND.dark);
    doc.text('Faculty Convener', 67, y + 5, { align: 'center' });
    doc.text('Head of Department', 148.5, y + 5, { align: 'center' });
    doc.text('Principal / Dean, NIE', 230, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor('#666666');
    doc.text('NIErnaya Committee', 67, y + 9, { align: 'center' });
    doc.text('Department of CSE', 148.5, y + 9, { align: 'center' });
    doc.text('The National Institute of Engineering', 230, y + 9, { align: 'center' });

    return doc;
  }

  public static async downloadCertificate(data: CertificateData): Promise<void> {
    const doc = await this.generateCertificatePDF(data);
    const cleanName = data.recipientName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`NIErnaya_Certificate_${cleanName}.pdf`);
  }
}
