import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  X,
  Download,
  Printer,
  Stethoscope,
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import { useToast } from '../../context/ToastContext';

// Native Canvas 2D Staff ID Card Generator (High-resolution, zero CSS/oklch parser issues)
// Features Green & Red combination background palette as explicitly required
const generateStaffCardCanvas = async (staff, clinicName) => {
  const canvas = document.createElement('canvas');
  // Dimensions: 880 x 520 px (Retina 2x of 440x260)
  canvas.width = 880;
  canvas.height = 520;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Helper for drawing rounded rectangle
  const drawRoundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y + w, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const cardX = 20;
  const cardY = 20;
  const cardW = 840;
  const cardH = 480;
  const cardRadius = 28;

  // 1. Base Card Shape Clip
  drawRoundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.save();
  ctx.clip();

  // 2. Green and Red Combination Gradient Background
  // Diagonal gradient transitioning from rich Emerald Green to Midnight to Crimson/Ruby Red
  const bg = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  bg.addColorStop(0, '#022c22');     // Deep Emerald Forest Green
  bg.addColorStop(0.3, '#064e3b');   // Vibrant Emerald Green
  bg.addColorStop(0.55, '#090d16');  // Midnight Slate Core
  bg.addColorStop(0.8, '#4c0519');   // Deep Ruby Red
  bg.addColorStop(1, '#881337');     // Rich Crimson Rose Red
  ctx.fillStyle = bg;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // 3. Ambient Specular Light Glows (Emerald Green on top-left, Ruby Red on bottom-right)
  const glowGreen = ctx.createRadialGradient(140, 90, 10, 140, 90, 260);
  glowGreen.addColorStop(0, 'rgba(16, 185, 129, 0.40)'); // Emerald
  glowGreen.addColorStop(0.5, 'rgba(5, 150, 105, 0.20)');
  glowGreen.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = glowGreen;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  const glowRed = ctx.createRadialGradient(740, 430, 10, 740, 430, 260);
  glowRed.addColorStop(0, 'rgba(244, 63, 94, 0.38)'); // Ruby / Rose
  glowRed.addColorStop(0.5, 'rgba(225, 29, 72, 0.20)');
  glowRed.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = glowRed;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // Diagonal subtle light streak
  const streak = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  streak.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  streak.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
  streak.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
  ctx.fillStyle = streak;
  ctx.fillRect(cardX, cardY, cardW, cardH);

  ctx.restore();

  // 4. Dual-Tone Luminous Card Border (Emerald top-left to Ruby bottom-right)
  drawRoundRect(cardX, cardY, cardW, cardH, cardRadius);
  const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  borderGrad.addColorStop(0, 'rgba(52, 211, 153, 0.6)');  // Emerald border
  borderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
  borderGrad.addColorStop(1, 'rgba(251, 113, 133, 0.6)'); // Rose border
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 5. Header Section
  // Dual-tone Green & Red Icon Badge
  drawRoundRect(55, 52, 54, 54, 15);
  const badgeGrad = ctx.createLinearGradient(55, 52, 109, 106);
  badgeGrad.addColorStop(0, '#10b981'); // Emerald
  badgeGrad.addColorStop(1, '#e11d48'); // Rose
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Caduceus / Clinical Shield Icon inside badge
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  // Shield outline
  ctx.moveTo(82, 64);
  ctx.lineTo(95, 68);
  ctx.quadraticCurveTo(95, 86, 82, 94);
  ctx.quadraticCurveTo(69, 86, 69, 68);
  ctx.closePath();
  ctx.stroke();
  // Medical cross inside shield
  ctx.beginPath();
  ctx.moveTo(82, 73);
  ctx.lineTo(82, 85);
  ctx.moveTo(76, 79);
  ctx.lineTo(88, 79);
  ctx.stroke();
  ctx.restore();

  // Header Title & Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Staff Identification Card', 124, 76);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace, system-ui, sans-serif';
  const branchInfo = staff.clinic?.branch_name ? ` • ${staff.clinic.branch_name}` : '';
  const clinicText = `Medical Staff • ${clinicName || 'Iniya Clinic'}${branchInfo}`;
  ctx.fillText(clinicText.length > 44 ? clinicText.slice(0, 42) + '...' : clinicText, 124, 98);

  // 3D Gold EMV Microchip
  drawRoundRect(670, 60, 46, 36, 6);
  const goldGrad = ctx.createLinearGradient(670, 60, 716, 96);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.5, '#f59e0b');
  goldGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = goldGrad;
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chip Pad Divisions
  ctx.save();
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(672, 78);
  ctx.lineTo(714, 78);
  ctx.moveTo(693, 62);
  ctx.lineTo(693, 94);
  ctx.stroke();
  ctx.restore();

  // Staff Code Pill Badge (Emerald-tinted)
  const staffCode = staff.staff_code || `STF-${String(staff.id || 1).padStart(4, '0')}`;
  drawRoundRect(726, 60, 108, 36, 8);
  ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(staffCode, 780, 83);
  ctx.textAlign = 'left';

  // Divider Line 1
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 126);
  ctx.lineTo(825, 126);
  ctx.stroke();

  // 6. Middle Section: Staff Avatar & Primary Details
  const avatarX = 55;
  const avatarY = 150;
  const avatarSize = 98;
  const avatarRadius = 20;

  let imageDrawn = false;
  const staffImgUrl = staff.image_url || staff.profile_photo || staff.image
    ? getImageUrl(staff.image_url || staff.profile_photo || staff.image)
    : null;

  if (staffImgUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = staffImgUrl;
      const loaded = await new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 1200);
      });
      if (loaded) {
        ctx.save();
        drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        imageDrawn = true;
      }
    } catch {
      imageDrawn = false;
    }
  }

  if (!imageDrawn) {
    drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
    const avGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    avGrad.addColorStop(0, '#059669'); // Emerald Green
    avGrad.addColorStop(1, '#e11d48'); // Rose Red
    ctx.fillStyle = avGrad;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      staff.name?.charAt(0).toUpperCase() || 'S',
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2 + 2
    );
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Avatar Ring (Emerald & Rose glow)
  drawRoundRect(avatarX, avatarY, avatarSize, avatarSize, avatarRadius);
  const ringGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
  ringGrad.addColorStop(0, 'rgba(52, 211, 153, 0.7)');
  ringGrad.addColorStop(1, 'rgba(251, 113, 133, 0.7)');
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Staff Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  const nameText = staff.name || 'Staff Member';
  ctx.fillText(nameText.length > 28 ? nameText.slice(0, 26) + '...' : nameText, 175, 190);

  // Designation Pill (Emerald-accented)
  const desigText = staff.designation || 'Clinical Practitioner';
  const desigWidth = Math.min(220, Math.max(90, ctx.measureText(desigText).width + 26));
  drawRoundRect(175, 208, desigWidth, 30, 8);
  ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(desigText.length > 22 ? desigText.slice(0, 20) + '...' : desigText, 187, 228);

  // Department Pill (Rose-accented)
  const deptText = staff.department || 'General Medicine';
  const deptX = 175 + desigWidth + 12;
  const deptWidth = Math.min(220, Math.max(84, ctx.measureText(deptText).width + 26));
  drawRoundRect(deptX, 208, deptWidth, 30, 8);
  ctx.fillStyle = 'rgba(136, 19, 55, 0.85)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#fecdd3';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(deptText.length > 22 ? deptText.slice(0, 20) + '...' : deptText, deptX + 12, 228);

  // Employment Type (e.g. Full-Time)
  const empText = staff.employment_type || 'Full-Time';
  const empX = deptX + deptWidth + 12;
  drawRoundRect(empX, 208, 90, 30, 8);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(empText, empX + 45, 227);
  ctx.textAlign = 'left';

  // Divider Line 2
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 275);
  ctx.lineTo(825, 275);
  ctx.stroke();

  // 7. Bottom Section: Contact & Verification Status
  // Contact Channels
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('CONTACT DETAILS', 55, 305);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px monospace, system-ui, sans-serif';
  ctx.fillText(staff.mobile || '—', 55, 332);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '13px monospace, system-ui, sans-serif';
  const emailText = staff.email || '—';
  ctx.fillText(emailText.length > 34 ? emailText.slice(0, 32) + '...' : emailText, 55, 355);

  // Status & Authorization
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('CLINICAL CLEARANCE', 470, 305);

  const isActive = staff.status === 'active' || staff.is_active;
  if (isActive) {
    // Active Green Pill
    drawRoundRect(470, 318, 146, 34, 8);
    const actGrad = ctx.createLinearGradient(470, 318, 616, 352);
    actGrad.addColorStop(0, 'rgba(6, 78, 59, 0.95)');
    actGrad.addColorStop(1, 'rgba(16, 185, 129, 0.85)');
    ctx.fillStyle = actGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Pulsing Green Beacon
    ctx.beginPath();
    ctx.arc(490, 335, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#34d399';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('Active Staff', 506, 340);
  } else {
    // Inactive / Blocked Red-tinted Pill
    drawRoundRect(470, 318, 146, 34, 8);
    const inactGrad = ctx.createLinearGradient(470, 318, 616, 352);
    inactGrad.addColorStop(0, 'rgba(136, 19, 55, 0.95)');
    inactGrad.addColorStop(1, 'rgba(225, 29, 72, 0.85)');
    ctx.fillStyle = inactGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 113, 133, 0.6)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(staff.status ? staff.status.toUpperCase() : 'Inactive', 492, 340);
  }

  // Joining Date / Location text
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  const joinText = staff.joining_date ? `Joined: ${staff.joining_date}` : 'Verified Clinical Record';
  ctx.fillText(joinText, 470, 375);

  // 8. Micro Security Strip & Verification Barcode
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 410);
  ctx.lineTo(825, 410);
  ctx.stroke();

  ctx.fillStyle = '#6ee7b7';
  ctx.font = '11px monospace';
  ctx.fillText(`STAFF-ID: ${staffCode}`, 55, 442);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  const locText = staff.clinic?.location || staff.clinic?.city || 'Main Branch';
  ctx.fillText(`Location: ${locText}`, 310, 442);

  ctx.fillStyle = '#fecdd3';
  ctx.font = '11px monospace';
  ctx.fillText('VERIFIED CLINICAL STAFF  [ ☤ ]', 630, 442);

  return canvas;
};

export default function StaffIdCardModal({
  staff,
  onClose,
  clinicName = 'Iniya Aesthetics & Wellness',
}) {
  const toast = useToast();
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!staff) return null;

  const staffCode = staff.staff_code || `STF-${String(staff.id || 1).padStart(4, '0')}`;
  const rawPhoto = staff.image_url || staff.profile_photo || staff.image;
  const staffImageUrl = rawPhoto ? getImageUrl(rawPhoto) : null;
  const avatarInitial = staff.name?.charAt(0).toUpperCase() || 'S';
  const isActive = staff.status === 'active' || staff.is_active;

  // Native High-Resolution PNG Image Download
  const handleDownloadImage = async () => {
    setIsDownloading(true);

    try {
      const resolvedClinicName = staff.clinic?.name || clinicName;
      const canvas = await generateStaffCardCanvas(staff, resolvedClinicName);

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas to Blob conversion failed');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = (staff.name || 'Staff').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `Staff-ID-Card-${staffCode}-${safeName}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Staff ID Card downloaded successfully as high-resolution image!');
      }, 'image/png');
    } catch (err) {
      console.error('Error generating staff card image:', err);
      toast.error('Unable to export card image. You can use the Print / PDF option.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Clean Print / PDF
  const handlePrintCard = () => {
    if (!cardRef.current) return;

    const oldIframe = document.getElementById('staff-card-print-frame');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'staff-card-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    // Collect all stylesheets
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((s) => s.outerHTML)
      .join('\n');

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${staffCode} - ${staff.name || 'Staff'} ID Card</title>
          ${styles}
          <style>
            @page {
              size: auto;
              margin: 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .print-card-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
              width: 100%;
            }
            .print-target {
              box-shadow: none !important;
              border: 1px solid rgba(0, 0, 0, 0.15) !important;
              page-break-inside: avoid;
              width: 440px !important;
              min-height: 250px !important;
              border-radius: 18px !important;
              background: linear-gradient(135deg, #022c22 0%, #064e3b 30%, #090d16 55%, #4c0519 80%, #881337 100%) !important;
              color: #ffffff !important;
            }
            .print-watermark {
              font-size: 11px;
              color: #64748b;
              font-family: monospace;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="print-card-wrapper">
            <div class="print-target">
              ${cardRef.current.innerHTML}
            </div>
            <div class="print-watermark">
              Iniya ERP Systems &bull; Printed: ${new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })} &bull; Verified Medical Staff ID Card
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print error:', err);
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 transform transition-all relative max-h-[94vh] overflow-y-auto space-y-4">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Staff Identification &amp; ID Card</span>
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/80">
              {staffCode}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Showcase Stage */}
        <div className="relative py-2 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-center">
            {/* Smooth Floating Wrapper */}
            <div className="animate-float-card w-full max-w-[440px]">
              
              {/* THE 3D SMART STAFF ID CARD (Export Target) */}
              {/* GREEN & RED COMBINATION BACKGROUND */}
              <div
                ref={cardRef}
                className="smart-card-3d mx-auto relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-950 to-rose-950 text-white select-none cursor-default group/smartcard space-y-4 border border-emerald-500/30 shadow-2xl"
                style={{
                  minHeight: '250px',
                  boxShadow:
                    '0 20px 45px -12px rgba(2, 44, 34, 0.7), 0 0 0 1px rgba(244, 63, 94, 0.3), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.25)',
                }}
              >
                {/* 3D Holographic Light Beam Sweep */}
                <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent pointer-events-none animate-holographic-sweep" />

                {/* Ambient Specular Glows: Green on top-left, Red on bottom-right */}
                <div className="absolute -top-16 -left-16 w-52 h-52 bg-gradient-to-br from-emerald-500/30 to-teal-500/15 rounded-full blur-3xl pointer-events-none group-hover/smartcard:scale-125 transition-transform duration-700" />
                <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-gradient-to-tl from-rose-500/30 to-red-600/15 rounded-full blur-3xl pointer-events-none group-hover/smartcard:scale-125 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/40 pointer-events-none" />

                {/* Top Section: Card Header & 3D Gold Microchip */}
                <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 ring-1 ring-white/20 shrink-0">
                      <Stethoscope className="w-4.5 h-4.5 drop-shadow-sm" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide font-display block leading-tight">
                        Staff ID Card
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono tracking-tight block">
                        Medical Staff &bull; {staff.clinic?.name || clinicName}
                        {staff.clinic?.branch_name ? ` • ${staff.clinic.branch_name}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* 3D Gold EMV Smart Chip + Staff Code Tag */}
                  <div className="flex items-center gap-2">
                    {/* Simulated 3D Gold Contact Chip */}
                    <div
                      className="w-6.5 h-5 rounded-[4px] bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-[1px] shadow-sm shadow-amber-950/70 shrink-0 opacity-95 group-hover/smartcard:opacity-100 transition-opacity"
                      title="Smart Clinical Staff Chip"
                    >
                      <div className="w-full h-full rounded-[3px] bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 grid grid-cols-2 gap-[1px] p-[1px]">
                        <div className="border-r border-b border-amber-700/50 rounded-tl-[1px]" />
                        <div className="border-l border-b border-amber-700/50 rounded-tr-[1px]" />
                        <div className="border-r border-t border-amber-700/50 rounded-bl-[1px]" />
                        <div className="border-l border-t border-amber-700/50 rounded-br-[1px]" />
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 tracking-wider shadow-xs">
                      {staffCode}
                    </span>
                  </div>
                </div>

                {/* Middle Section: Staff Avatar, Name, Designation & Department */}
                <div className="relative z-10 flex items-center gap-3.5 py-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-900 to-rose-950 overflow-hidden flex items-center justify-center font-bold text-lg text-white border border-emerald-500/40 shadow-md shadow-black/50 ring-2 ring-white/10 shrink-0 group-hover/smartcard:scale-105 transition-transform duration-300">
                    {staffImageUrl && !imgError ? (
                      <img
                        src={staffImageUrl}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <span className="bg-gradient-to-tr from-emerald-300 via-teal-200 to-rose-300 bg-clip-text text-transparent font-extrabold text-xl drop-shadow-sm">
                        {avatarInitial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-base sm:text-lg text-white truncate font-display tracking-tight drop-shadow-xs">
                      {staff.name || 'Staff Member'}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] mt-1">
                      {staff.designation && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shadow-2xs">
                          {staff.designation}
                        </span>
                      )}
                      {staff.department && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] font-bold shadow-2xs">
                          {staff.department}
                        </span>
                      )}
                      <span className="text-slate-400 text-xs">
                        {staff.employment_type || 'Full-Time'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Contact & Verification Status */}
                <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Contact</div>
                    <div className="text-white font-mono font-bold text-xs truncate mt-0.5 tracking-tight">
                      {staff.mobile || '—'}
                    </div>
                    {staff.email && (
                      <div className="text-slate-300 text-[10px] font-mono truncate mt-0.5" title={staff.email}>
                        {staff.email}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Clearance</div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md border shadow-sm ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-950/90 to-teal-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
                            : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                              : 'bg-rose-500'
                          }`}
                        />
                        {isActive ? 'Active Staff' : staff.status ? staff.status.toUpperCase() : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro Security Barcode Strip */}
                <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span className="tracking-widest opacity-80 uppercase text-emerald-400">STAFF-{staffCode}</span>
                  <span className="tracking-tight text-slate-300 font-medium truncate max-w-[150px]">
                    {staff.clinic?.location || staff.clinic?.city || 'Main Branch'}
                  </span>
                  <span className="tracking-widest opacity-80 text-rose-400">VERIFIED STAFF [ ☤ ]</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar: Download PNG & Print/PDF */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'Generating Card...' : 'Download Card (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCard}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
