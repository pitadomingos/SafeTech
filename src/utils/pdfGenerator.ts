/**
 * ============================================================
 *  CARS MANAGER — PDF DOCUMENT GENERATOR
 *  Professional PDF generation for security access documents
 *  using jsPDF (client-side, no server required).
 * ============================================================
 */

import { jsPDF } from 'jspdf';
import { RecruitmentProcess, RecruitmentStatus } from '../types';

// ─── Logo helpers ─────────────────────────────────────────────────────────────

async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

// Cache loaded logos
let vulcanLogoCache: string | null = null;
let appLogoCache: string | null = null;

async function getLogos(companyLogo?: string): Promise<{ vulcan: string | null; app: string | null }> {
    if (companyLogo) {
        const customLogo = await loadImageAsBase64(companyLogo);
        if (customLogo) return { vulcan: customLogo, app: appLogoCache || (appLogoCache = await loadImageAsBase64('/logos/app_logo.png')) };
    }
    
    if (!vulcanLogoCache) vulcanLogoCache = await loadImageAsBase64('/logos/vulcan_logo.png');
    if (!appLogoCache) appLogoCache = await loadImageAsBase64('/logos/app_logo.png');
    return { vulcan: vulcanLogoCache, app: appLogoCache };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateDocRef(): string {
    const prefix = 'DOC';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${date}-${rand}`;
}

function formatDate(iso: string | undefined, lang: 'en' | 'pt'): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
}

function daysBetween(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(ms / 86400000));
}

function drawLogos(doc: jsPDF, logos: { vulcan: string | null; app: string | null }, y: number, pageWidth: number) {
    const logoH = 14;
    const logoW = 30;
    if (logos.vulcan) {
        try { doc.addImage(logos.vulcan, 'PNG', 15, y, logoW, logoH); } catch { /* fallback below */ }
    }
    // Fallback text if no logo image
    if (!logos.vulcan) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('VULCAN', 15, y + 9);
    }
    if (logos.app) {
        try { doc.addImage(logos.app, 'PNG', pageWidth - 15 - logoW, y, logoW, logoH); } catch { /* fallback below */ }
    }
    if (!logos.app) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('ZEROGATE', pageWidth - 15 - 25, y + 9);
    }
}

// ─── 1. Personnel Access Badge (ID-sized: 86mm x 54mm) ──────────────────────

export async function generatePersonnelBadgePDF(
    process: RecruitmentProcess,
    language: 'en' | 'pt',
    companyLogo?: string
): Promise<void> {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [86, 54] });
    const logos = await getLogos(companyLogo);
    const isGranted = process.accessStatus !== 'denied';
    const accentColor = isGranted ? [16, 185, 129] : [239, 68, 68]; // emerald / red

    // Border
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(1.5);
    doc.roundedRect(1.5, 1.5, 83, 51, 3, 3, 'S');

    // Inner accent stripe
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 0, 86, 6, 'F');

    // Logos in top stripe
    if (logos.vulcan) {
        try { doc.addImage(logos.vulcan, 'PNG', 3, 0.5, 12, 5); } catch { /* skip */ }
    }
    if (logos.app) {
        try { doc.addImage(logos.app, 'PNG', 71, 0.5, 12, 5); } catch { /* skip */ }
    }
    // Header text
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(language === 'pt' ? 'ACESSO DE PESSOAL' : 'PERSONNEL ACCESS', 43, 4, { align: 'center' });

    // Photo placeholder circle
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.circle(16, 20, 8);
    doc.setFontSize(4);
    doc.setTextColor(180, 180, 180);
    doc.text('PHOTO', 16, 21, { align: 'center' });

    // Name
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(process.candidateName.toUpperCase(), 30, 14);

    // Company
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(process.company || process.primeCompany, 30, 18);

    // Badge No
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(process.temporaryBadgeNumber || '—', 30, 23);

    // ID Number
    if (process.candidateIdNumber || process.recordId) {
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`ID: ${process.candidateIdNumber || process.recordId || '—'}`, 30, 27);
    }

    // Details section
    const detailY = 32;
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(language === 'pt' ? 'DEPARTAMENTO' : 'DEPARTMENT', 6, detailY);
    doc.text(language === 'pt' ? 'FUNÇÃO' : 'ROLE', 35, detailY);
    doc.text(language === 'pt' ? 'DATA' : 'DATE', 60, detailY);

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(process.department || '—', 6, detailY + 4);
    doc.text(process.role || '—', 35, detailY + 4);
    doc.text(formatDate(new Date().toISOString(), language), 60, detailY + 4);

    // Access status badge
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(5, 42, 76, 9, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const statusText = isGranted
        ? (language === 'pt' ? '✓ ACESSO CONCEDIDO' : '✓ ACCESS GRANTED')
        : (language === 'pt' ? '✗ ACESSO NEGADO' : '✗ ACCESS DENIED');
    doc.text(statusText, 43, 48, { align: 'center' });

    // Doc ref at bottom
    const docRef = process.accessDocumentRef || generateDocRef();
    doc.setFontSize(3);
    doc.setTextColor(180, 180, 180);
    doc.text(`REF: ${docRef}`, 43, 53, { align: 'center' });

    doc.save(`Personnel_Badge_${process.candidateName.replace(/\s+/g, '_')}.pdf`);
}

// ─── 2. Equipment Access Disc (Windscreen Disc, ~120mm on A4) ───────────────

export async function generateEquipmentDiscPDF(
    process: RecruitmentProcess,
    language: 'en' | 'pt',
    companyLogo?: string
): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logos = await getLogos(companyLogo);
    const pageW = 210;
    const cx = pageW / 2;
    const cy = 130;
    const radius = 55;
    const isGranted = process.accessStatus !== 'denied';
    const accent = isGranted ? [16, 185, 129] : [239, 68, 68];

    // Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(language === 'pt' ? 'DOCUMENTO DE ACESSO — CORTAR PELA LINHA PONTILHADA' : 'ACCESS DOCUMENT — CUT ALONG DOTTED LINE', cx, 20, { align: 'center' });

    // Cut guide — dashed outer circle
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.circle(cx, cy, radius + 3);
    doc.setLineDashPattern([], 0);

    // Outer ring
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(3);
    doc.circle(cx, cy, radius);

    // Inner ring
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, radius - 5);

    // Logos in disc
    if (logos.vulcan) {
        try { doc.addImage(logos.vulcan, 'PNG', cx - 25, cy - radius + 8, 20, 8); } catch { /* skip */ }
    }
    if (logos.app) {
        try { doc.addImage(logos.app, 'PNG', cx + 5, cy - radius + 8, 20, 8); } catch { /* skip */ }
    }
    // Fallback text logos
    if (!logos.vulcan) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('VULCAN', cx - 18, cy - radius + 14, { align: 'center' });
    }
    if (!logos.app) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('ZEROGATE', cx + 18, cy - radius + 14, { align: 'center' });
    }

    // Header text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(language === 'pt' ? 'ACESSO DE EQUIPAMENTO' : 'EQUIPMENT ACCESS', cx, cy - radius + 23, { align: 'center' });

    // Separator
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.3);
    doc.line(cx - 30, cy - radius + 26, cx + 30, cy - radius + 26);

    // Equipment details
    let textY = cy - 18;
    const labelSize = 5.5;
    const valueSize = 8;

    const fields = [
        { label: language === 'pt' ? 'EQUIPAMENTO' : 'EQUIPMENT', value: process.equipmentType || process.role || '—' },
        { label: 'ID / TAG', value: process.equipmentId || process.temporaryBadgeNumber || '—' },
        { label: language === 'pt' ? 'EMPRESA' : 'COMPANY', value: process.contractorCompany || process.company || process.primeCompany },
        { label: language === 'pt' ? 'RESPONSÁVEL' : 'RESPONSIBLE', value: process.responsiblePersonName || process.candidateName },
    ];

    for (const field of fields) {
        doc.setFontSize(labelSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(field.label, cx, textY, { align: 'center' });
        doc.setFontSize(valueSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(field.value, cx, textY + 5, { align: 'center' });
        textY += 13;
    }

    // Dates (for temporal equipment access)
    doc.setFontSize(labelSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(language === 'pt' ? 'VÁLIDO' : 'VALID', cx, textY, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    if (process.accessStartDate && process.accessEndDate) {
        const days = daysBetween(process.accessStartDate, process.accessEndDate);
        doc.text(`${formatDate(process.accessStartDate, language)} — ${formatDate(process.accessEndDate, language)} (${days} ${language === 'pt' ? 'dias' : 'days'})`, cx, textY + 5, { align: 'center' });
    } else {
        doc.text(language === 'pt' ? 'ACESSO TOTAL (PERMANENTE)' : 'FULL ACCESS (PERMANENT)', cx, textY + 5, { align: 'center' });
    }

    // Status badge at bottom of disc
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(cx - 25, cy + radius - 20, 50, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const statusText = isGranted
        ? (language === 'pt' ? '✓ ACESSO CONCEDIDO' : '✓ ACCESS GRANTED')
        : (language === 'pt' ? '✗ ACESSO NEGADO' : '✗ ACCESS DENIED');
    doc.text(statusText, cx, cy + radius - 14, { align: 'center' });

    // Doc ref
    const docRef = process.accessDocumentRef || generateDocRef();
    doc.setFontSize(4);
    doc.setTextColor(180, 180, 180);
    doc.text(`REF: ${docRef}`, cx, cy + radius - 3, { align: 'center' });

    doc.save(`Equipment_Disc_${(process.equipmentId || process.candidateName).replace(/\s+/g, '_')}.pdf`);
}

// ─── 3. Temporal Access Document (A4 full page) ─────────────────────────────

export async function generateTemporalAccessPDF(
    process: RecruitmentProcess,
    language: 'en' | 'pt',
    companyLogo?: string
): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logos = await getLogos(companyLogo);
    const pageW = 210;
    const isGranted = process.accessStatus !== 'denied';
    const accent = isGranted ? [16, 185, 129] : [239, 68, 68];
    const docRef = process.accessDocumentRef || generateDocRef();

    // ── Header band ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 35, 'F');

    // Logos
    if (logos.vulcan) {
        try { doc.addImage(logos.vulcan, 'PNG', 15, 5, 35, 14); } catch { /* skip */ }
    } else {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('VULCAN', 15, 15);
    }
    if (logos.app) {
        try { doc.addImage(logos.app, 'PNG', pageW - 50, 5, 35, 14); } catch { /* skip */ }
    } else {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('ZEROGATE', pageW - 50, 15);
    }

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(language === 'pt' ? 'AUTORIZAÇÃO DE ACESSO TEMPORÁRIO' : 'TEMPORARY ACCESS AUTHORIZATION', pageW / 2, 14, { align: 'center' });

    // Subtitle
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${language === 'pt' ? 'Referência' : 'Reference'}: ${docRef}  |  ${language === 'pt' ? 'Data de Emissão' : 'Issue Date'}: ${formatDate(new Date().toISOString(), language)}`, pageW / 2, 22, { align: 'center' });

    // Accent line
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 35, pageW, 2, 'F');

    // ── Person Details Section ──
    let y = 48;
    const leftCol = 20;
    const rightCol = 110;
    const labelFont = 7;
    const valueFont = 10;
    const lineH = 18;

    function drawField(x: number, yPos: number, label: string, value: string, width: number = 80) {
        doc.setFontSize(labelFont);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(label.toUpperCase(), x, yPos);

        doc.setFontSize(valueFont);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(value || '—', x, yPos + 6);

        // Underline
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(x, yPos + 8, x + width, yPos + 8);
    }

    // Section header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— DADOS DO VISITANTE / TRABALHADOR' : '— VISITOR / WORKER DETAILS', leftCol, y);
    y += 10;

    drawField(leftCol, y, language === 'pt' ? 'Nome Completo' : 'Full Name', process.candidateName, 170);
    y += lineH;

    drawField(leftCol, y, language === 'pt' ? 'Número de Identificação' : 'ID Number', process.candidateIdNumber || process.recordId || '—');
    drawField(rightCol, y, language === 'pt' ? 'Telemóvel' : 'Cell Number', process.candidatePhone);
    y += lineH;

    drawField(leftCol, y, language === 'pt' ? 'Empresa' : 'Company', process.company || process.primeCompany);
    drawField(rightCol, y, language === 'pt' ? 'Função' : 'Role', process.role);
    y += lineH;

    // ── Area Manager & Department Section ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— GESTOR DE ÁREA E DEPARTAMENTO' : '— AREA MANAGER & DEPARTMENT', leftCol, y);
    y += 10;

    drawField(leftCol, y, language === 'pt' ? 'Gestor de Área' : 'Area Manager', process.areaManagerName || process.requestedBy);
    drawField(rightCol, y, language === 'pt' ? 'Telemóvel do Gestor' : 'Manager Cell', process.areaManagerPhone || '—');
    y += lineH;

    drawField(leftCol, y, language === 'pt' ? 'Departamento' : 'Department', process.areaManagerDepartment || process.department);
    y += lineH;

    // ── Dates Section ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— PERÍODO DE ACESSO' : '— ACCESS PERIOD', leftCol, y);
    y += 10;

    if (process.requestType === 'EquipmentAccess' && !process.accessStartDate && !process.accessEndDate) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(language === 'pt' ? 'ACESSO TOTAL (PERMANENTE)' : 'FULL ACCESS (PERMANENT)', leftCol, y);
        y += lineH;
    } else {
        const days = (process.accessStartDate && process.accessEndDate)
            ? daysBetween(process.accessStartDate, process.accessEndDate) : 0;

        drawField(leftCol, y, language === 'pt' ? 'Data de Início' : 'Start Date', formatDate(process.accessStartDate, language), 50);
        drawField(85, y, language === 'pt' ? 'Data de Fim' : 'End Date', formatDate(process.accessEndDate, language), 50);
        drawField(rightCol + 40, y, language === 'pt' ? 'Nº de Dias' : 'Number of Days', days > 0 ? `${days}` : '—', 30);
        y += lineH;
    }

    // ── Canteen Section ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— REFEITÓRIO' : '— CANTEEN', leftCol, y);
    y += 10;

    const canteen = process.canteen || { breakfast: false, lunch: false, supper: false, lunchPack: false };
    const canteenItems = [
        { label: language === 'pt' ? 'Pequeno-Almoço' : 'Breakfast', checked: canteen.breakfast },
        { label: language === 'pt' ? 'Almoço' : 'Lunch', checked: canteen.lunch },
        { label: language === 'pt' ? 'Jantar' : 'Supper / Dinner', checked: canteen.supper },
        { label: language === 'pt' ? 'Marmita' : 'Lunch Pack', checked: canteen.lunchPack },
    ];

    let canteenX = leftCol;
    for (const item of canteenItems) {
        // Checkbox
        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.4);
        doc.rect(canteenX, y - 3, 4, 4);
        if (item.checked) {
            doc.setFillColor(16, 185, 129);
            doc.rect(canteenX + 0.5, y - 2.5, 3, 3, 'F');
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('✓', canteenX + 2, y + 0.5, { align: 'center' });
        }
        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(item.label, canteenX + 6, y);
        canteenX += 42;
    }
    y += lineH;

    // ── Reason of Access ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— MOTIVO DO ACESSO' : '— REASON OF ACCESS', leftCol, y);
    y += 8;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftCol, y, 170, 20, 2, 2);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const reasonLines = doc.splitTextToSize(process.accessReason || '—', 165);
    doc.text(reasonLines, leftCol + 3, y + 6);
    y += 28;

    // ── Denial reason (if denied) ──
    if (!isGranted && process.denialReason) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text(language === 'pt' ? '— MOTIVO DA RECUSA' : '— REASON FOR DENIAL', leftCol, y);
        y += 8;

        doc.setDrawColor(254, 202, 202);
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(leftCol, y, 170, 16, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 29, 29);
        const denialLines = doc.splitTextToSize(process.denialReason, 165);
        doc.text(denialLines, leftCol + 3, y + 6);
        y += 24;
    }

    // ── ACCESS STATUS BADGE ──
    const badgeW = 170;
    const badgeH = 22;
    const badgeX = leftCol;
    const badgeY = Math.min(y + 5, 255);

    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const mainStatusText = isGranted
        ? (language === 'pt' ? '✓  ACESSO CONCEDIDO' : '✓  ACCESS GRANTED')
        : (language === 'pt' ? '✗  ACESSO NEGADO' : '✗  ACCESS DENIED');
    doc.text(mainStatusText, badgeX + badgeW / 2, badgeY + 14, { align: 'center' });

    // ── Footer ──
    doc.setFontSize(5);
    doc.setTextColor(180, 180, 180);
    doc.text(
        `Vulcan Resources Mozambique  ·  ZeroGate Security Management System  ·  REF: ${docRef}`,
        pageW / 2, 290, { align: 'center' }
    );

    doc.save(`Temporal_Access_${process.candidateName.replace(/\s+/g, '_')}.pdf`);
}

// ─── 4. Mobilization Process Stages PDF (A4 multi-stage report) ─────────────

export async function generateRecruitmentStagesPDF(
    process: RecruitmentProcess,
    language: 'en' | 'pt',
    companyLogo?: string
): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logos = await getLogos(companyLogo);
    const pageW = 210;
    const docRef = process.accessDocumentRef || generateDocRef();

    // ── Header band ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 35, 'F');

    // Logos
    if (logos.vulcan) {
        try { doc.addImage(logos.vulcan, 'PNG', 15, 5, 35, 14); } catch { /* skip */ }
    } else {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('VULCAN', 15, 15);
    }
    if (logos.app) {
        try { doc.addImage(logos.app, 'PNG', pageW - 50, 5, 35, 14); } catch { /* skip */ }
    } else {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('ZEROGATE', pageW - 50, 15);
    }

    // Title
    let titleEN = 'MOBILIZATION & COMPLIANCE STAGES REPORT';
    let titlePT = 'RELATÓRIO DE MOBILIZAÇÃO E CONFORMIDADE';
    if (process.requestType === 'Recruitment') {
        titleEN = 'RECRUITMENT STAGES REPORT';
        titlePT = 'RELATÓRIO DE ETAPAS DE RECRUTAMENTO';
    } else if (process.requestType === 'PersonnelAccess') {
        titleEN = 'PERSONNEL ACCESS STAGES REPORT';
        titlePT = 'RELATÓRIO DE ETAPAS DE ACESSO DE PESSOAL';
    } else if (process.requestType === 'EquipmentAccess') {
        titleEN = 'EQUIPMENT ACCESS STAGES REPORT';
        titlePT = 'RELATÓRIO DE ETAPAS DE ACESSO DE EQUIPAMENTO';
    } else if (process.requestType === 'DeliveryAccess') {
        titleEN = 'DELIVERY ACCESS STAGES REPORT';
        titlePT = 'RELATÓRIO DE ETAPAS DE ACESSO DE ENTREGA';
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
        language === 'pt' ? titlePT : titleEN,
        pageW / 2, 14, { align: 'center' }
    );

    // Subtitle
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
        `${language === 'pt' ? 'ID do Registo' : 'Record ID'}: ${process.recordId || '—'}  |  ${language === 'pt' ? 'Referência' : 'Reference'}: ${docRef}  |  ${language === 'pt' ? 'Data de Emissão' : 'Issue Date'}: ${formatDate(new Date().toISOString(), language)}`,
        pageW / 2, 22, { align: 'center' }
    );

    // Accent line (indigo)
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 35, pageW, 2, 'F');

    let y = 46;
    const leftCol = 15;
    const blockW = 180;

    // Helper to draw a stage block
    function drawStageHeader(stageNum: number, titleEN: string, titlePT: string, isDone: boolean, doneDate?: string) {
        // Background for block header
        doc.setFillColor(248, 250, 252);
        doc.rect(leftCol, y, blockW, 7, 'F');

        // Status indicator
        if (isDone) {
            doc.setFillColor(16, 185, 129); // Green
            doc.rect(leftCol, y, 3, 7, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text(language === 'pt' ? 'CONCLUÍDO' : 'COMPLETED', leftCol + 6, y + 5);
        } else {
            doc.setFillColor(245, 158, 11); // Amber
            doc.rect(leftCol, y, 3, 7, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(245, 158, 11);
            doc.text(language === 'pt' ? 'PENDENTE' : 'PENDING', leftCol + 6, y + 5);
        }

        // Title
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(
            `${language === 'pt' ? `Etapa ${stageNum}: ${titlePT}` : `Stage ${stageNum}: ${titleEN}`}`,
            leftCol + 35, y + 5
        );

        // Date if done
        if (isDone && doneDate) {
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(
                `${language === 'pt' ? 'Data' : 'Date'}: ${formatDate(doneDate, language)}`,
                leftCol + blockW - 5, y + 5, { align: 'right' }
            );
        }

        y += 9;
    }

    function drawStageField(label: string, value: string, xOffset: number, width: number) {
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(label.toUpperCase(), leftCol + xOffset, y);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const textLines = doc.splitTextToSize(value || '—', width);
        doc.text(textLines, leftCol + xOffset, y + 4);
    }

    // --- Candidate Profile ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? 'PERFIL DO CANDIDATO / EQUIPAMENTO' : 'CANDIDATE / EQUIPMENT PROFILE', leftCol, y);
    y += 5;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(process.candidateName.toUpperCase(), leftCol, y);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
        `${language === 'pt' ? 'Empresa' : 'Company'}: ${process.company || process.primeCompany}  |  ${language === 'pt' ? 'Função' : 'Role'}: ${process.role}  |  ${language === 'pt' ? 'Departamento' : 'Department'}: ${process.department}`,
        leftCol, y + 4
    );
    y += 12;

    // --- Stage 1: AM Requisition ---
    const isStage1Done = !!process.requestedAt;
    drawStageHeader(1, 'AM Requisition Requisition', 'Requisição do Gestor de Área', isStage1Done, process.requestedAt);
    drawStageField(language === 'pt' ? 'Solicitado Por' : 'Requested By', process.requestedBy, 5, 50);
    drawStageField(language === 'pt' ? 'Tipo de Pedido' : 'Request Type', process.requestType || 'Recruitment', 60, 50);
    drawStageField(language === 'pt' ? 'Telemóvel' : 'Contact Phone', process.candidatePhone, 115, 50);
    y += 9;

    // --- Stage 2: HR Documents ---
    const hasHrDocs = (process.documents && process.documents.length > 0) || (process.amDocuments && process.amDocuments.length > 0);
    const isStage2Done = process.status !== 'AM Requested' && process.status !== 'HR Pending' && hasHrDocs;
    
    // Get HR verified document list
    const docsList = [...(process.amDocuments || []), ...(process.documents || [])];
    const docNames = docsList.map(d => `${d.type} (${d.status === 'Verified' ? 'OK' : d.status})`).join(', ');

    drawStageHeader(2, 'HR Document Verification', 'Verificação de Documentos de RH', isStage2Done, process.requestedAt);
    drawStageField(language === 'pt' ? 'Estado RH' : 'HR Review Status', isStage2Done ? 'PASSED / VERIFIED' : 'PENDING REVIEW', 5, 50);
    drawStageField(language === 'pt' ? 'Documentos Enviados' : 'Uploaded Documents', docNames || 'None / Nenhum', 60, 110);
    y += 9;

    // --- Stage 3: Security Portal ---
    const isStage3Done = !!process.temporaryBadgeNumber;
    drawStageHeader(3, 'Security Access Clearance', 'Liberação de Acesso de Segurança', isStage3Done, process.requestedAt);
    drawStageField(language === 'pt' ? 'Cartão / Badge' : 'Access Card / Tag', process.temporaryBadgeNumber || 'PENDING / PENDENTE', 5, 50);
    
    const validityText = (process.accessStartDate && process.accessEndDate) 
        ? `${formatDate(process.accessStartDate, language)} — ${formatDate(process.accessEndDate, language)}` 
        : (process.requestType === 'EquipmentAccess' ? (language === 'pt' ? 'Acesso Total (Permanente)' : 'Full Access (Permanent)') : 'Permanent Staff Access');
    drawStageField(language === 'pt' ? 'Período Acesso' : 'Access Period', validityText, 60, 110);
    y += 9;

    // --- Stage 4: Clinic / Medical Fitness ---
    const isStage4Done = process.clinicFitnessCleared || !!process.fitnessCertificate || !!process.medicalExam;
    drawStageHeader(4, 'Occupational Clinic Exam', 'Exame de Saúde Ocupacional', isStage4Done, process.fitnessCertificate?.issuedAt || process.medicalExam?.checkedAt);
    
    let medDetailsText = 'Pending Clinic Appointment / Consulta Pendente';
    if (isStage4Done) {
        if (process.fitnessCertificate) {
            const fc = process.fitnessCertificate;
            medDetailsText = `Certificate #${fc.certificateNo} issued by ${fc.issuedBy}. Fit-for-work: ${fc.fitForWork ? 'YES' : 'NO'}. Valid until ${formatDate(fc.validUntil, language)}. Restriction: ${fc.restrictions || 'None'}`;
        } else if (process.medicalExam) {
            const me = process.medicalExam;
            medDetailsText = `BP: ${me.bloodPressure} | HR: ${me.heartRate} bpm | Drugs: ${me.drugScreen} | Vision: ${me.visionTest} | Musculoskeletal: ${me.musculoskeletal || 'Normal'} | Fit: ${me.fitForWork ? 'YES' : 'NO'}`;
        } else {
            medDetailsText = 'Cleared Fit-for-Work / Aprovado Apto para o Trabalho';
        }
    }
    
    drawStageField(language === 'pt' ? 'Aptidão Médica' : 'Medical Fitness Status', process.clinicFitnessCleared ? 'CLEARED FIT FOR WORK' : isStage4Done ? 'EXAM COMMITTED' : 'PENDING CLINIC', 5, 50);
    drawStageField(language === 'pt' ? 'Detalhes Clínicos' : 'Clinical Details', medDetailsText, 60, 110);
    y += 12;

    // --- Stage 5: HSE Induction ---
    const isStage5Done = process.inductionConfirmed || !!process.inductionDate;
    drawStageHeader(5, 'HSE Site Induction & Checklist', 'Briefing e Integração de Segurança HSE', isStage5Done, process.inductionDate);
    drawStageField(language === 'pt' ? 'Indução HSE' : 'HSE Induction', isStage5Done ? 'CERTIFIED & SIGNED OFF' : 'PENDING INDUCTION', 5, 50);
    drawStageField(language === 'pt' ? 'Data Integrada' : 'Induction Scheduled Date', process.inductionDate ? formatDate(process.inductionDate, language) : 'Not Scheduled / Não Agendado', 60, 110);
    y += 9;

    // --- Stage 6: CARS training ---
    const isStage6Done = process.status === RecruitmentStatus.COMPLETED || process.status === RecruitmentStatus.RECEIVED || !!process.trainingCompletedAt;
    drawStageHeader(6, 'RAC Compliance Training', 'Treinamento de Conformidade RAC', isStage6Done, process.trainingCompletedAt);
    drawStageField(language === 'pt' ? 'Conformidade RAC' : 'RAC Training Compliance', isStage6Done ? 'ALL MANDATORY RAC CERTIFIED ✓' : 'PENDING CLASSROOM / TEST', 5, 50);
    
    const racText = (process.requiredRacs && process.requiredRacs.length > 0)
        ? `Mandatory RACs: ${process.requiredRacs.join(', ')}`
        : 'No RAC modules required for this Access Request.';
    drawStageField(language === 'pt' ? 'Módulos Exigidos' : 'Required RAC Modules', racText, 60, 110);
    y += 9;

    // --- Stage 7: Final Mobilization Confirmation ---
    const isStage7Done = process.status === RecruitmentStatus.RECEIVED;
    drawStageHeader(7, 'Area Manager Final Receipt', 'Confirmação Final do Gestor de Área', isStage7Done, process.receivedAt);
    drawStageField(language === 'pt' ? 'Estado Onboarding' : 'Onboarding Status', isStage7Done ? 'MOBILIZED & ACTIVE ON SITE' : 'AWAITING ARRIVAL & AM CONFIRMATION', 5, 50);
    drawStageField(language === 'pt' ? 'Ref Registo Interno' : 'Internal Badge Registry', process.employeeId ? `Employee UID: ${process.employeeId} | Tag: ${process.temporaryBadgeNumber}` : 'Registry entry pending final receipt confirmation', 60, 110);
    y += 15;

    // Signature blocks at bottom
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 255, 80, 255);
    doc.line(130, 255, 195, 255);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(language === 'pt' ? 'GESTOR DE ÁREA REQUISITANTE' : 'REQUESTING AREA MANAGER', 15, 259);
    doc.text(language === 'pt' ? 'DEPARTAMENTO DE SEGURANÇA E RH' : 'SECURITY & HR COMPLIANCE DEPT', 130, 259);

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${process.requestedBy}`, 15, 263);
    doc.text('CARS Systems Auditor Signature', 130, 263);

    // ── Footer ──
    doc.setFontSize(5);
    doc.setTextColor(180, 180, 180);
    doc.text(
        `Vulcan Resources Mozambique  ·  ZeroGate Security & Compliance Lifecycle  ·  REF: ${docRef}`,
        pageW / 2, 290, { align: 'center' }
    );

    doc.save(`Mobilization_Stages_Report_${process.candidateName.replace(/\s+/g, '_')}.pdf`);
}

export async function generateDeliveryAccessPDF(
    process: RecruitmentProcess,
    language: 'en' | 'pt',
    companyLogo?: string
): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logos = await getLogos(companyLogo);
    const pageW = 210;
    const isGranted = process.accessStatus !== 'denied';
    const accent = isGranted ? [16, 185, 129] : [239, 68, 68];
    const docRef = process.accessDocumentRef || generateDocRef();

    // ── Header band ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 35, 'F');

    // Logos
    if (logos.vulcan) {
        try { doc.addImage(logos.vulcan, 'PNG', 15, 5, 35, 14); } catch { /* skip */ }
    } else {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('VULCAN', 15, 15);
    }
    if (logos.app) {
        try { doc.addImage(logos.app, 'PNG', pageW - 50, 5, 35, 14); } catch { /* skip */ }
    } else {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('ZEROGATE', pageW - 50, 15);
    }

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(language === 'pt' ? 'AUTORIZAÇÃO DE ACESSO DE ENTREGA' : 'DELIVERY ACCESS PERMIT', pageW / 2, 14, { align: 'center' });

    // Subtitle
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${language === 'pt' ? 'Referência' : 'Reference'}: ${docRef}  |  ${language === 'pt' ? 'Data de Emissão' : 'Issue Date'}: ${formatDate(new Date().toISOString(), language)}`, pageW / 2, 22, { align: 'center' });

    // Accent line
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 35, pageW, 2, 'F');

    // ── Driver Details Section ──
    let y = 48;
    const leftCol = 20;
    const rightCol = 110;
    const labelFont = 7;
    const valueFont = 10;
    const lineH = 18;

    function drawField(x: number, yPos: number, label: string, value: string, width: number = 80) {
        doc.setFontSize(labelFont);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(label.toUpperCase(), x, yPos);

        doc.setFontSize(valueFont);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(value || '—', x, yPos + 6);

        // Underline
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(x, yPos + 8, x + width, yPos + 8);
    }

    // Section header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— DADOS DO MOTORISTA' : '— DRIVER DETAILS', leftCol, y);
    y += 10;

    drawField(leftCol, y, language === 'pt' ? 'Nome do Motorista' : 'Driver Name', process.candidateName, 170);
    y += lineH;

    drawField(leftCol, y, language === 'pt' ? 'Número de Identificação/Passaporte' : 'ID / Passport Number', process.candidateIdNumber || '—');
    drawField(rightCol, y, language === 'pt' ? 'Empresa' : 'Company', process.company || process.primeCompany);
    y += lineH;

    // ── Vehicle Details Section ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— DADOS DO VEÍCULO E ENTREGA' : '— VEHICLE & DELIVERY DETAILS', leftCol, y);
    y += 10;

    drawField(leftCol, y, language === 'pt' ? 'Modelo do Camião' : 'Truck Make / Model', process.truckModel || '—');
    drawField(rightCol, y, language === 'pt' ? 'Matrícula' : 'Registration Number', process.truckRegNumber || '—');
    y += lineH;

    drawField(leftCol, y, language === 'pt' ? 'Número da Ordem de Compra (PO)' : 'Purchase Order (PO) Number', process.poNumber || '—', 170);
    y += lineH;

    // ── Area Manager & Department Section ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— GESTOR DE ÁREA REQUISITANTE' : '— REQUESTING AREA MANAGER', leftCol, y);
    y += 10;

    drawField(leftCol, y, language === 'pt' ? 'Gestor de Área' : 'Area Manager', process.areaManagerName || process.requestedBy);
    drawField(rightCol, y, language === 'pt' ? 'Telemóvel do Gestor' : 'Manager Cell', process.areaManagerPhone || '—');
    y += lineH;

    drawField(leftCol, y, language === 'pt' ? 'Departamento' : 'Department', process.areaManagerDepartment || process.department);
    y += lineH;

    // ── Reason of Access ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(language === 'pt' ? '— MOTIVO DO ACESSO / DESCRIÇÃO DA CARGA' : '— ACCESS REASON / CARGO DESCRIPTION', leftCol, y);
    y += 8;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftCol, y, 170, 20, 2, 2);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const reasonLines = doc.splitTextToSize(process.accessReason || '—', 165);
    doc.text(reasonLines, leftCol + 3, y + 6);
    y += 28;

    // ── ACCESS STATUS BADGE ──
    const badgeW = 170;
    const badgeH = 22;
    const badgeX = leftCol;
    const badgeY = Math.min(y + 5, 255);

    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const mainStatusText = isGranted
        ? (language === 'pt' ? '✓  ACESSO CONCEDIDO (ENTREGA)' : '✓  ACCESS GRANTED (DELIVERY)')
        : (language === 'pt' ? '✗  ACESSO NEGADO' : '✗  ACCESS DENIED');
    doc.text(mainStatusText, badgeX + badgeW / 2, badgeY + 14, { align: 'center' });

    // ── Footer ──
    doc.setFontSize(5);
    doc.setTextColor(180, 180, 180);
    doc.text(
        `Vulcan Resources Mozambique  ·  ZeroGate Security Management System  ·  REF: ${docRef}`,
        pageW / 2, 290, { align: 'center' }
    );

    doc.save(`Delivery_Access_${process.candidateName.replace(/\s+/g, '_')}.pdf`);
}

// ─── Auto-select document type ───────────────────────────────────────────────

export async function generateAccessDocument(
    process: RecruitmentProcess,
    language: 'en' | 'pt',
    companyLogo?: string
): Promise<void> {
    if (process.requestType === 'PersonnelAccess') {
        await generatePersonnelBadgePDF(process, language, companyLogo);
    } else if (process.requestType === 'EquipmentAccess') {
        await generateEquipmentDiscPDF(process, language, companyLogo);
    } else if (process.requestType === 'DeliveryAccess') {
        await generateDeliveryAccessPDF(process, language, companyLogo);
    } else {
        // Recruitment (temporal access / contractor)
        await generateTemporalAccessPDF(process, language, companyLogo);
    }
}

