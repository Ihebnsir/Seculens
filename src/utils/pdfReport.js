import { SEVERITY_ORDER, countFindings, sortFindingsBySeverity } from './severity';
import { formatScanDate } from './date';
import { formatScannerVersion } from './scanner';

// Mise en page A4 en millimètres : document noir sur blanc, pensé pour l'impression.
const PAGE_MARGIN = 18;
const LINE_HEIGHT_RATIO = 0.42; // hauteur d'une ligne en mm pour une taille de police donnée (pt)
const TEXT_COLOR = [20, 20, 20];
const MUTED_COLOR = [100, 100, 100];
const RULE_COLOR = [200, 200, 200];

// Couleurs sobres par gravité : lisibles à l'écran et encore distinctes imprimées en niveaux de gris.
const SEVERITY_COLORS = {
  critical: [176, 0, 32],
  high: [191, 72, 0],
  medium: [150, 110, 0],
  low: [0, 90, 150],
  info: [90, 90, 90]
};

// Les polices standard du PDF ne connaissent que l'alphabet latin (WinAnsi) : on remplace les
// caractères courants hors de cet alphabet, et on retire les autres pour éviter du texte illisible.
export function toPdfText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/→/g, '->')
    .replace(/…/g, '...')
    .replace(/[^\n\t\x20-\x7E -ÿ]/g, '');
}

// Nom du fichier : seculens-report-{cible}-{AAAA-MM-JJ}.pdf, sans schéma ni caractères interdits.
export function buildReportFileName(target, dateValue) {
  const cleanedTarget = String(target || 'scan')
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/[^a-z0-9.]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'scan';
  const date = new Date(dateValue || Date.now());
  const day = Number.isNaN(date.getTime()) ? new Date() : date;
  const isoDay = [
    day.getFullYear(),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0')
  ].join('-');
  return `seculens-report-${cleanedTarget}-${isoDay}.pdf`;
}

// Construit le rapport avec une instance jsPDF déjà créée (injectée pour pouvoir la simuler en test).
export function writeScanReport(doc, scan) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = PAGE_MARGIN;

  // Saut de page automatique si le bloc suivant ne tient pas dans la place restante.
  const ensureSpace = (height) => {
    if (y + height > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  // Écrit un paragraphe ligne par ligne : un long texte peut ainsi continuer sur la page suivante.
  const writeText = (text, { size = 10, style = 'normal', color = TEXT_COLOR, indent = 0, gapAfter = 1.5 } = {}) => {
    const clean = toPdfText(text);
    if (!clean) return;
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lineHeight = size * LINE_HEIGHT_RATIO;
    const lines = doc.splitTextToSize(clean, contentWidth - indent);
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, PAGE_MARGIN + indent, y + lineHeight * 0.8);
      y += lineHeight;
    });
    y += gapAfter;
  };

  const drawRule = () => {
    ensureSpace(4);
    doc.setDrawColor(...RULE_COLOR);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, y + 1, pageWidth - PAGE_MARGIN, y + 1);
    y += 4;
  };

  // En-tête : ce qui a été scanné, quand, par quelle version, et le verdict.
  writeText('SecuLens Security Report', { size: 20, style: 'bold', gapAfter: 3 });
  writeText(scan.target, { size: 11, style: 'bold', gapAfter: 1 });
  writeText(`Scanned on ${formatScanDate(scan.createdAt)}  |  HTTP ${scan.status ?? '-'}  |  ${formatScannerVersion(scan.scannerVersion)}`, {
    size: 9,
    color: MUTED_COLOR,
    gapAfter: 4
  });
  writeText(`Security score: ${scan.score ?? '-'} / 100`, { size: 14, style: 'bold', gapAfter: 2 });

  if (scan.scoreRegression) {
    const { drop, previousScore } = scan.scoreRegression;
    writeText(`Score dropped by ${drop} points since the last scan (${previousScore} -> ${scan.score}).`, {
      size: 10,
      style: 'bold',
      color: SEVERITY_COLORS.critical,
      gapAfter: 2
    });
  }

  // Résumé par gravité : findings encore ouverts, plus le nombre de corrigés.
  const { open, fixed } = countFindings(scan.findings);
  const summary = SEVERITY_ORDER.map((severity) => `${open[severity]} ${severity}`).join('   ');
  writeText(`Open findings: ${summary}${fixed ? `   (${fixed} fixed)` : ''}`, { size: 10, gapAfter: 3 });
  drawRule();

  const findings = sortFindingsBySeverity(scan.findings);
  writeText(`Findings (${findings.length})`, { size: 13, style: 'bold', gapAfter: 3 });

  if (findings.length === 0) {
    writeText('No findings for this scan.', { color: MUTED_COLOR });
  }

  findings.forEach((finding, index) => {
    // Garde au moins le titre et la ligne de méta ensemble en bas de page.
    ensureSpace(22);
    const severity = SEVERITY_ORDER.includes(finding.severity) ? finding.severity : 'info';
    writeText(`${index + 1}. [${severity.toUpperCase()}] ${finding.title}${finding.fixed ? '  (fixed)' : ''}`, {
      size: 11,
      style: 'bold',
      color: SEVERITY_COLORS[severity],
      gapAfter: 1
    });

    const meta = [finding.ruleId, finding.cwe, finding.owasp && `OWASP ${finding.owasp.code} ${finding.owasp.name}`]
      .filter(Boolean)
      .join('  |  ');
    writeText(meta, { size: 9, color: MUTED_COLOR, indent: 4, gapAfter: 2 });

    writeText('Description', { size: 9, style: 'bold', indent: 4, gapAfter: 0.5 });
    writeText(finding.description, { size: 10, indent: 4, gapAfter: 2 });
    writeText('Remediation', { size: 9, style: 'bold', indent: 4, gapAfter: 0.5 });
    writeText(finding.remediation, { size: 10, indent: 4, gapAfter: 2 });

    // L'explication IA reste dans l'application pour garder le rapport concis.
    if (finding.aiExplanation?.simpleExplanation) {
      writeText('AI-generated explanation available in the app.', { size: 8, style: 'italic', color: MUTED_COLOR, indent: 4 });
    }
    y += 2;
  });

  // Pied de page ajouté à la fin, quand le nombre total de pages est connu.
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(`SecuLens - ${toPdfText(scan.target)}`, PAGE_MARGIN, pageHeight - 8, { maxWidth: contentWidth - 30 });
    doc.text(`Page ${page} / ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 8, { align: 'right' });
  }

  return doc;
}

// Point d'entrée du bouton : jsPDF est chargé à la demande pour ne pas alourdir le premier affichage.
export async function downloadScanReport(scan) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  writeScanReport(doc, scan);
  doc.save(buildReportFileName(scan.target, scan.createdAt));
}
