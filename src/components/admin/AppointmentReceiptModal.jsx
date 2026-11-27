import React, { useRef } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Layers,
  Package,
  Building2,
} from 'lucide-react';

// Number to Indian Currency Words helper
function numberToWords(amount) {
  const num = Math.floor(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rem = num % 100;

  if (crore) words += inWords(crore) + ' Crore ';
  if (lakh) words += inWords(lakh) + ' Lakh ';
  if (thousand) words += inWords(thousand) + ' Thousand ';
  if (hundred) words += inWords(hundred) + ' Hundred ';
  if (rem) {
    if (words !== '') words += 'and ';
    words += inWords(rem) + ' ';
  }

  return words.trim() + ' Rupees Only';
}

// Helper to resolve active doctor/practitioner for a session
// Prioritizes executed_by / executedBy (rescheduled executive staff), falling back to original booking staff
const getSessionPractitioner = (s) => {
  if (!s) return null;
  return s.executed_by || s.executedBy || s.staff || null;
};

// Check if a session has been reassigned to a different staff practitioner
const isPractitionerReassigned = (s) => {
  if (!s) return false;
  const originalId = s.staff_id || s.staff?.id;
  const executedId = s.executed_by_staff_id || s.executed_by?.id || s.executedBy?.id;
  if (executedId && originalId && Number(executedId) !== Number(originalId)) {
    return true;
  }
  const execStaff = s.executed_by || s.executedBy;
  if (execStaff && s.staff && Number(execStaff.id) !== Number(s.staff.id)) {
    return true;
  }
  const histories = s.reschedule_histories || s.rescheduleHistories || [];
  return histories.some(
    (h) => h.new_staff_id && h.old_staff_id && Number(h.new_staff_id) !== Number(h.old_staff_id)
  );
};

// Check if a session's date or time has been rescheduled
const isDateTimeRescheduled = (s) => {
  if (!s) return false;
  const histories = s.reschedule_histories || s.rescheduleHistories || [];
  return histories.some(
    (h) => (h.old_date && h.new_date && String(h.old_date).slice(0, 10) !== String(h.new_date).slice(0, 10)) ||
           (h.old_time && h.new_time && String(h.old_time).trim() !== String(h.new_time).trim())
  );
};

export default function AppointmentReceiptModal({
  isOpen,
  onClose,
  appointment,
  session = null,
  payment = null,
  type = 'master', // 'master' (User/Appointment-wise), 'session' (Session-wise), or 'payment' (Transaction-wise)
}) {
  const receiptRef = useRef(null);

  if (!isOpen || !appointment) return null;

  const isPaymentType = Boolean(payment || type === 'payment');
  const isSessionType = !isPaymentType && type === 'session' && session;
  const activeSessionDoctor = isSessionType ? getSessionPractitioner(session) : null;
  const sessionIsStaffReassigned = isSessionType ? isPractitionerReassigned(session) : false;
  const sessionIsDateTimeRescheduled = isSessionType ? isDateTimeRescheduled(session) : false;
  const customer = appointment.customer || {};
  const sessions = appointment.sessions || [];
  const salesTeam = appointment.sales_team || {};
  const admin = appointment.admin || {};
  const clinic = appointment.clinic || session?.master_appointment?.clinic || appointment.master_appointment?.clinic || {};
  const clinicName = clinic.name || 'INIYA CLINIC & OPD CARE';
  const clinicBranch = clinic.branch_name ? `${clinic.branch_name} Branch` : (clinic.name ? 'Clinic Branch' : 'Aesthetics, Wellness & Clinical Care');
  const clinicCode = clinic.clinic_code || 'INIYA-OPD-DEL-8921A';
  const fullClinicLocation = [
    clinic.address,
    clinic.location,
    clinic.city,
    clinic.state,
    clinic.postal_code,
  ].filter(Boolean).join(', ') || clinic.location || clinic.city || '78, Connaught Place, New Delhi - 110001';
  const clinicPhone = clinic.phone || clinic.alternate_phone || '+91 9833003300';
  const clinicEmail = clinic.email || 'care@iniyaclinic.com';

  // Receipt Numbers & Dates
  const receiptNumber = isPaymentType
    ? (payment?.receipt_number || `RCP-P${String(payment?.id || appointment.id).padStart(5, '0')}`)
    : isSessionType
    ? `RCP-S${String(session.id).padStart(5, '0')}`
    : `RCP-M${String(appointment.id).padStart(5, '0')}`;

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const nowTimeFormatted = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const apptDateFormatted = appointment.appointment_date
    ? new Date(appointment.appointment_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const receiptDateFormatted = isPaymentType && payment?.payment_date
    ? new Date(payment.payment_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : todayFormatted;

  const sessionFee = Number(session?.consultation_fee ?? session?.service?.price ?? session?.payment_amount ?? appointment.appointment_fees ?? 0);
  const masterFee = sessions.length > 0
    ? sessions.reduce((acc, s) => acc + Number(s.consultation_fee ?? s.service?.price ?? s.payment_amount ?? 0), 0)
    : Number(appointment.appointment_fees || 0);
  const totalAmount = isSessionType ? sessionFee : (masterFee > 0 ? masterFee : Number(appointment.appointment_fees || 0));

  // Compute cumulative paid and due balance for the whole master appointment
  const appointmentTotalPaid = Number(
    appointment.total_paid !== undefined && appointment.total_paid !== null
      ? appointment.total_paid
      : (Array.isArray(appointment.payments) && appointment.payments.length > 0
          ? appointment.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
          : (Array.isArray(appointment.sessions) && appointment.sessions.length > 0
              ? appointment.sessions.reduce((acc, s) => acc + Number(s.payment_amount || 0), 0)
              : 0))
  );

  const appointmentBalanceRemaining = Number(
    appointment.balance_remaining !== undefined && appointment.balance_remaining !== null
      ? appointment.balance_remaining
      : Math.max(0, totalAmount - appointmentTotalPaid)
  );

  // Financials depending on receipt mode
  let currentPaidAmount = 0;
  let previousPaidAmount = 0;
  let balanceRemaining = 0;

  if (isPaymentType) {
    currentPaidAmount = Number(payment?.amount || 0);
    previousPaidAmount = Number(payment?.previous_paid_amount || 0);
    balanceRemaining = Number(
      payment?.balance_remaining !== undefined && payment?.balance_remaining !== null
        ? payment.balance_remaining
        : Math.max(0, totalAmount - (previousPaidAmount + currentPaidAmount))
    );
  } else if (isSessionType) {
    currentPaidAmount = Number(session?.payment_amount || 0);
    previousPaidAmount = 0;
    balanceRemaining = Math.max(0, sessionFee - currentPaidAmount);
  } else {
    // Master Appointment Receipt
    currentPaidAmount = appointmentTotalPaid;
    previousPaidAmount = 0;
    balanceRemaining = appointmentBalanceRemaining;
  }

  // High-fidelity Single Page Isolated Iframe Print
  const handlePrint = () => {
    const printElement = receiptRef.current;
    if (!printElement) return;

    // Clean up any old iframe
    const oldIframe = document.getElementById('receipt-print-frame');
    if (oldIframe) {
      oldIframe.remove();
    }

    // Create a dedicated isolated print iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'receipt-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    // Collect all active stylesheets and inline styles
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
          <title>${receiptNumber} - ${customer.name || 'Patient'} Receipt</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important; /* Suppresses browser default headers and footers (date, title, URL) */
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
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              color: #0f172a !important;
              width: 100% !important;
              height: auto !important;
            }
            body {
              display: block !important;
              padding: 12mm 15mm !important; /* Clean professional receipt margins */
            }
            .print-receipt-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-receipt-container">
            ${printElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after resources load
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Modal Container: Full Seamless Receipt Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Top Action Header */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display tracking-tight text-white">
                {isSessionType
                  ? `Session #${session.session_number} Payment Receipt`
                  : 'Customer Master Appointment Receipt'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {receiptNumber} &bull; {customer.name || 'Patient'}
                {clinic.name && (
                  <>
                    {' '}&bull;{' '}
                    <span className="text-teal-400 font-sans font-semibold">{clinic.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Seamless Full-Height Document (Extends all the way down) */}
        <div className="overflow-y-auto p-5 sm:p-7 flex-1 bg-white">
          <div
            ref={receiptRef}
            className="w-full text-slate-800 font-sans space-y-4"
          >
            {/* 1. CLINIC HEADER & BRANDING */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b-2 border-slate-900/10">
              <div className="flex items-center space-x-3.5">
                <img
                  src="/logo.png"
                  alt="Iniya Aesthetics & Wellness"
                  className="h-12 w-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-base sm:text-lg font-black font-display text-slate-900 tracking-tight leading-tight">
                    {clinicName}
                  </h1>
                  <p className="text-[10px] text-teal-700 font-semibold flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>{clinicBranch}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5 flex flex-wrap gap-x-2 font-mono">
                    <span>Reg: {clinicCode}</span>
                    <span>&bull;</span>
                    <span>GSTIN: 07AAAAA0000A1Z5</span>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-[10px] text-slate-500 font-medium space-y-0.5 shrink-0 max-w-[280px]">
                <div className="flex items-center sm:justify-end gap-1.5 text-slate-700">
                  <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">{fullClinicLocation}</span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 text-slate-700">
                  <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{clinicPhone}</span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 text-slate-700">
                  <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>{clinicEmail}</span>
                </div>
              </div>
            </div>

            {/* 2. RECEIPT TITLE & META STRIP */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  Document Type
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-display">
                  {isPaymentType
                    ? 'MASTER APPOINTMENT PAYMENT RECEIPT'
                    : isSessionType
                    ? `CLINICAL SESSION RECEIPT (SESSION #${session.session_number})`
                    : 'MASTER APPOINTMENT PAYMENT RECEIPT'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono">
                <div>
                  <span className="text-[9px] font-sans text-slate-400 block font-semibold">RECEIPT NO</span>
                  <span className="font-bold text-slate-900">{receiptNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] font-sans text-slate-400 block font-semibold">DATE &amp; TIME</span>
                  <span className="font-bold text-slate-900">
                    {receiptDateFormatted}, {nowTimeFormatted}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-sans text-slate-400 block font-semibold">PAYMENT STATUS</span>
                  {balanceRemaining <= 0 && currentPaidAmount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>PAID IN FULL</span>
                    </span>
                  ) : currentPaidAmount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-2.5 h-2.5" />
                      <span>PARTIAL PAYMENT</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-200">
                      <Clock className="w-2.5 h-2.5" />
                      <span>PAYMENT DUE</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. PATIENT & APPOINTMENT DETAILS 2-COLUMN GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left Column: Patient / Customer Box */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
                <div className="flex items-center space-x-1.5 pb-1.5 mb-1.5 border-b border-slate-100">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                    Patient Information
                  </span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="font-bold text-slate-900">{customer.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Contact Number:</span>
                    <span className="font-mono text-slate-800">{customer.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email Address:</span>
                    <span className="text-slate-800 truncate max-w-[180px]">{customer.email || 'N/A'}</span>
                  </div>
                  {customer.gender && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <span className="capitalize text-slate-800">{customer.gender}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start justify-between pt-0.5">
                      <span className="text-slate-400 shrink-0">Address:</span>
                      <span className="text-slate-700 text-right truncate max-w-[180px]">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Appointment & Clinical Attribution */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
                <div className="flex items-center space-x-1.5 pb-1.5 mb-1.5 border-b border-slate-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
                    Appointment Details
                  </span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Master Appt Number:</span>
                    <span className="font-mono font-bold text-blue-700">{appointment.appointment_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Clinic Branch:</span>
                    <span className="font-semibold text-teal-800 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate max-w-[170px]">{clinic.name || 'Main Flagship Clinic'}</span>
                    </span>
                  </div>
                  {(clinic.location || clinic.city || clinic.branch_name) && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Branch Location:</span>
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">{clinic.location || clinic.city || clinic.branch_name}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Booking Date:</span>
                    <span className="font-semibold text-slate-800">{apptDateFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sales Attribution:</span>
                    <span className="text-slate-800 font-medium">
                      {salesTeam.name || 'Direct OPD'} {salesTeam.sales_code ? `(${salesTeam.sales_code})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Issued By:</span>
                    <span className="text-slate-800 font-medium">{admin.name || 'Clinic Administrator'}</span>
                  </div>
                  {isSessionType ? (
                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-100">
                      <span className="text-slate-400">Assigned Doctor:</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {activeSessionDoctor?.name || 'Assigned Specialist'}
                        </span>
                        {activeSessionDoctor?.department && (
                          <span className="text-[10px] text-slate-500 block">
                            {activeSessionDoctor.department}
                            {activeSessionDoctor.staff_code ? ` • ${activeSessionDoctor.staff_code}` : ''}
                          </span>
                        )}
                        {sessionIsStaffReassigned && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                            Reassigned
                            {session.staff?.name ? ` (Prev: ${session.staff.name})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-100">
                      <span className="text-slate-400">Assigned Doctor:</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {getSessionPractitioner(sessions[0])?.name || 'Assigned Specialist'}
                        </span>
                        {sessions.length > 1 ? (
                          <span className="text-[10px] text-slate-400 block font-sans">
                            +{sessions.length - 1} more session{sessions.length > 2 ? 's' : ''}
                          </span>
                        ) : getSessionPractitioner(sessions[0])?.department ? (
                          <span className="text-[10px] text-slate-500 block">
                            {getSessionPractitioner(sessions[0]).department}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 4. BREAKDOWN TABLE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-display flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {isSessionType
                      ? `Session #${session.session_number} Procedure Breakdown`
                      : `Master Treatment Plan Sessions (${sessions.length} Sessions)`}
                  </span>
                </h4>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 text-center w-12 whitespace-nowrap">S.NO.</th>
                      <th className="py-2 px-3">Treatment / Procedure Details</th>
                      <th className="py-2 px-3">Scheduled Date & Time</th>
                      <th className="py-2 px-3">Doctor / Specialist</th>
                      <th className="py-2 px-2.5 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Fee (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isSessionType ? (
                      /* Single Session Breakdown */
                      <tr>
                        <td className="py-2 px-2.5 text-center font-bold text-slate-700">
                          {session.session_number}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">
                            {session.treatment_details || (session.service?.name ? session.service.name : 'Clinical Treatment')}
                          </div>
                          {session.service && (
                            <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{session.service.name}</span>
                            </div>
                          )}
                          {session.selected_products?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {session.selected_products.map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-slate-100 rounded text-[9px] text-slate-600 font-mono"
                                >
                                  <Package className="w-2 h-2 text-slate-400" />
                                  <span>{p.product_name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-800">
                            {session.session_date ? String(session.session_date).slice(0, 10) : 'N/A'}
                          </div>
                          <div className="text-slate-500 font-mono text-[10px]">{session.session_time || ''}</div>
                          {sessionIsDateTimeRescheduled && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 rounded">
                              Rescheduled
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">
                            {activeSessionDoctor?.name || 'Unassigned'}
                          </div>
                          <div className="text-slate-400 text-[9px]">
                            {[activeSessionDoctor?.department, activeSessionDoctor?.staff_code].filter(Boolean).join(' • ')}
                          </div>
                          {sessionIsStaffReassigned && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded">
                              Reassigned
                              {session.staff?.name ? ` (Prev: ${session.staff.name})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              session.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : session.status === 'in_progress'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {session.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                          ₹{Number(sessionFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ) : (
                      /* Full Master Appointment Sessions Breakdown */
                      sessions.map((ses) => {
                        const fee = Number(ses.consultation_fee ?? ses.service?.price ?? ses.payment_amount ?? 0);
                        const sesDoctor = getSessionPractitioner(ses);
                        const sesStaffReassigned = isPractitionerReassigned(ses);
                        const sesDateTimeRescheduled = isDateTimeRescheduled(ses);
                        return (
                          <tr key={ses.id}>
                            <td className="py-2 px-2.5 text-center font-bold text-slate-700">
                              {ses.session_number}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-900">
                                {ses.treatment_details || (ses.service?.name ? ses.service.name : 'Procedure')}
                              </div>
                              {ses.service && (
                                <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{ses.service.name}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-800">
                                {ses.session_date ? String(ses.session_date).slice(0, 10) : 'N/A'}
                              </div>
                              <div className="text-slate-500 font-mono text-[10px]">{ses.session_time || ''}</div>
                              {sesDateTimeRescheduled && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 rounded">
                                  Rescheduled
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-medium text-slate-900">
                                {sesDoctor?.name || 'Unassigned'}
                              </div>
                              <div className="text-slate-400 text-[9px]">
                                {[sesDoctor?.department, sesDoctor?.staff_code].filter(Boolean).join(' • ')}
                              </div>
                              {sesStaffReassigned && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded">
                                  Reassigned{ses.staff?.name ? ` (Prev: ${ses.staff.name})` : ''}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                                  ses.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : ses.status === 'in_progress'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {ses.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-slate-700 font-mono">
                              {fee > 0 ? `₹${fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. FINANCIAL TOTALS & AMOUNT IN WORDS */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 border-t border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                  Amount Chargeable (in words)
                </span>
                <p className="text-[11px] font-semibold text-slate-700 italic max-w-sm">
                  {numberToWords(currentPaidAmount > 0 ? currentPaidAmount : totalAmount)}
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span>
                    Payment Mode:{' '}
                    <strong className="uppercase">
                      {payment?.payment_mode || (currentPaidAmount > 0 ? 'OPD Desk / Cleared' : 'Pending Payment')}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>Tax: <strong>Inclusive</strong></span>
                  {payment?.payment_notes && (
                    <>
                      <span>&bull;</span>
                      <span className="italic text-slate-700">"{payment.payment_notes}"</span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-64 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Gross Consultation Fees:</span>
                  <span className="font-mono">
                    ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {isPaymentType && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Previously Collected:</span>
                    <span className="font-mono">
                      ₹{Number(previousPaidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-900 font-display">
                    {isPaymentType ? 'Current Payment Received:' : 'Total Amount Paid:'}
                  </span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    ₹{Number(currentPaidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-slate-200/80 pt-1 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Remaining Due Balance:</span>
                  <span className={`font-mono font-bold ${balanceRemaining <= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    ₹{Number(balanceRemaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. AUTHENTICATION & FOOTER */}
            <div className="pt-3.5 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="font-semibold text-slate-600">Important Instructions & Medical Notice:</p>
                <p>1. This is an official computer-generated clinical receipt, valid for medical & claim records.</p>
                <p>2. Please quote this receipt number during subsequent clinical visits and procedures.</p>
              </div>

              {/* Authorized Signatory Stamp */}
              <div className="flex flex-col items-center text-center shrink-0">
                <div className="w-28 h-8 border-b-2 border-slate-400 border-dashed flex items-end justify-center pb-0.5">
                  <span className="font-serif italic font-bold text-slate-700 text-xs">
                    {admin.name || 'Iniya Clinic OPD'}
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Authorized Signatory
                </span>
                <span className="text-[8px] text-slate-400 font-mono">Iniya Clinic Health System</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline font-mono">
            Official Clinical Receipt &bull; {receiptNumber}
          </span>
          <div className="flex items-center space-x-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer font-display"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
