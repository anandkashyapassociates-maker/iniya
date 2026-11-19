import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ReceiptIndianRupee,
  Wallet,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  History,
  Printer,
  ChevronDown,
  Layers,
} from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import { useToast } from '../../context/ToastContext';

export default function AppointmentCollectionModal({
  isOpen,
  onClose,
  appointment,
  onPaymentSuccess,
  onOpenReceipt,
}) {
  const toast = useToast();

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Derive appointment summary
  const sessions = useMemo(() => {
    return Array.isArray(appointment?.sessions) ? appointment.sessions : [];
  }, [appointment]);

  const totalFees = useMemo(() => {
    if (!appointment) return 0;
    if (sessions.length > 0) {
      const sum = sessions.reduce((acc, s) => {
        const p = s.consultation_fee ?? s.service?.price ?? s.payment_amount ?? 0;
        return acc + Number(p || 0);
      }, 0);
      if (sum > 0) return sum;
    }
    return Number(appointment.appointment_fees || 0);
  }, [appointment, sessions]);

  const totalPaid = useMemo(() => {
    if (!appointment) return 0;
    if (appointment.total_paid !== undefined) {
      return Number(appointment.total_paid || 0);
    }
    if (Array.isArray(appointment.payments) && appointment.payments.length > 0) {
      return appointment.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    }
    return sessions.reduce((acc, s) => acc + Number(s.payment_amount || 0), 0);
  }, [appointment, sessions]);

  const balanceRemaining = useMemo(() => {
    return Math.max(0, totalFees - totalPaid);
  }, [totalFees, totalPaid]);

  // Load payment history when modal opens
  useEffect(() => {
    if (isOpen && appointment?.id) {
      setAmount(balanceRemaining > 0 ? String(balanceRemaining) : '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('cash');
      setPaymentNotes('');
      setIsLoadingHistory(true);

      adminMasterAppointmentService.getPayments(appointment.id)
        .then((res) => {
          if (res?.success && Array.isArray(res.data)) {
            setPaymentsHistory(res.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load payments history:', err);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [isOpen, appointment?.id, balanceRemaining]);

  // Live Real-Time Cascade FIFO Simulation
  const liveAllocation = useMemo(() => {
    const inputVal = parseFloat(amount) || 0;
    const newCumulative = totalPaid + inputVal;
    let unallocated = newCumulative;

    return sessions.map((s) => {
      const fee = Number(s.consultation_fee ?? s.service?.price ?? s.payment_amount ?? 0);
      const prevPaid = Number(s.payment_amount || 0);
      const allocated = Math.min(unallocated, fee);
      const balance = Math.max(0, fee - allocated);
      unallocated = Math.max(0, unallocated - allocated);

      const thisContribution = Math.max(0, allocated - prevPaid);

      return {
        id: s.id,
        session_number: s.session_number,
        name: s.service?.name || s.treatment_details || `Session #${s.session_number}`,
        fee,
        prevPaid,
        thisContribution,
        totalAllocated: allocated,
        balance,
        status: (allocated >= fee && fee > 0) ? 'paid' : (allocated > 0 ? 'partial' : 'unpaid'),
      };
    });
  }, [amount, totalPaid, sessions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.warning('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (numAmount > balanceRemaining + 0.01 && balanceRemaining > 0) {
      toast.warning(`Amount cannot exceed the remaining balance of ₹${balanceRemaining.toLocaleString('en-IN')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        amount: numAmount,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        payment_mode: paymentMode,
        payment_notes: paymentNotes.trim() || undefined,
      };

      const res = await adminMasterAppointmentService.collectPayment(appointment.id, payload);
      if (res?.success) {
        toast.success(res.message || 'Payment recorded successfully!');
        setAmount('');
        setPaymentNotes('');
        onClose();
        try {
          if (onPaymentSuccess) {
            onPaymentSuccess(res.appointment, res.payment);
          }
        } catch (cbErr) {
          console.error('Error in onPaymentSuccess callback:', cbErr);
        }
      }
    } catch (err) {
      console.error('Failed to collect payment:', err);
      toast.error(err.response?.data?.message || 'Failed to record payment collection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const customer = appointment.customer || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <ReceiptIndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-wide">Receive Patient Collection</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OPD Desk
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {appointment.appointment_number} • Patient: <strong className="text-white">{customer.name || 'N/A'}</strong> ({customer.mobile || 'No mobile'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* 1. FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Fees */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Consultation Fees
              </span>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                ₹{totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'} registered
              </span>
            </div>

            {/* Total Paid So Far */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Total Collected (Paid)
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-600/80 block mt-0.5 font-medium">
                {totalFees > 0 ? `${Math.round((totalPaid / totalFees) * 100)}% Settled` : '0%'}
              </span>
            </div>

            {/* Current Balance Due */}
            <div className={`p-3.5 rounded-2xl border shadow-2xs ${
              balanceRemaining <= 0
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : 'bg-gradient-to-br from-rose-50 to-amber-50/50 border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  balanceRemaining <= 0 ? 'text-slate-600' : 'text-rose-800'
                }`}>
                  Outstanding Due Balance
                </span>
                <Clock className={`w-3.5 h-3.5 ${balanceRemaining <= 0 ? 'text-slate-400' : 'text-rose-600'}`} />
              </div>
              <div className={`text-lg font-black font-mono mt-0.5 ${
                balanceRemaining <= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                ₹{balanceRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className={`text-[10px] block mt-0.5 font-medium ${
                balanceRemaining <= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {balanceRemaining <= 0 ? '✓ Fully Cleared' : 'Payment Pending'}
              </span>
            </div>
          </div>

          {/* 2. COLLECTION FORM */}
          {balanceRemaining > 0 ? (
            <form onSubmit={handleSubmit} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  New Payment Transaction
                </h4>
              </div>

              {/* Amount Input & Quick Fill Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Payment Amount to Collect (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balanceRemaining}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>

                {/* Quick Fill Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => setAmount(String(balanceRemaining))}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Full Balance (₹{balanceRemaining.toLocaleString('en-IN')})
                  </button>
                  {balanceRemaining > 500 && (
                    <button
                      type="button"
                      onClick={() => setAmount('500')}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      ₹500
                    </button>
                  )}
                  {balanceRemaining > 1000 && (
                    <button
                      type="button"
                      onClick={() => setAmount('1000')}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      ₹1,000
                    </button>
                  )}
                  {balanceRemaining > 2000 && (
                    <button
                      type="button"
                      onClick={() => setAmount('2000')}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      ₹2,000
                    </button>
                  )}
                </div>
              </div>

              {/* Grid: Payment Date & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Payment Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Payment Mode Pills */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Payment Channel / Mode *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'cash', label: 'Cash' },
                      { id: 'upi', label: 'UPI / QR' },
                      { id: 'card', label: 'Card' },
                      { id: 'bank', label: 'Bank' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMode(m.id)}
                        className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          paymentMode === m.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Note / Receipt Remark */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Payment Note / Receipt Remark (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received via GPay, 1st installment for sessions"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !parseFloat(amount) || parseFloat(amount) <= 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
                >
                  <ReceiptIndianRupee className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Recording...'
                      : `Record Payment of ₹${(parseFloat(amount) || 0).toLocaleString('en-IN')}`}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-xs">All Payments Cleared!</p>
                <p className="text-[11px] text-emerald-700">
                  Total consultation fee of ₹{totalFees.toLocaleString('en-IN')} has been fully collected. No balance is pending.
                </p>
              </div>
            </div>
          )}

          {/* 3. LIVE SESSION ALLOCATION PREVIEW (FIFO CASCADE) */}
          {sessions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Session Payment Allocation Breakdown (Sequential FIFO)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Payments cascade session-by-session
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Session #</th>
                      <th className="py-2.5 px-3">Treatment / Procedure</th>
                      <th className="py-2.5 px-3 text-right">Fee (₹)</th>
                      <th className="py-2.5 px-3 text-right">Already Paid</th>
                      {parseFloat(amount) > 0 && (
                        <th className="py-2.5 px-3 text-right text-emerald-700 font-bold bg-emerald-50/50">
                          This Payment (+)
                        </th>
                      )}
                      <th className="py-2.5 px-3 text-right">New Balance</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {liveAllocation.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-700">
                          #{item.session_number}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          ₹{item.fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          ₹{item.prevPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        {parseFloat(amount) > 0 && (
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                            {item.thisContribution > 0 ? `+₹${item.thisContribution.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                        )}
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                          {item.balance > 0 ? `₹${item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : (
                            <span className="text-emerald-600 font-semibold text-[11px]">₹0.00 (Cleared)</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. PREVIOUS PAYMENT TRANSACTIONS & RECEIPTS */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Payment History &amp; Individual Receipts ({paymentsHistory.length})
                </h4>
              </div>
            </div>

            {isLoadingHistory ? (
              <p className="text-[11px] text-slate-400 italic">Loading transaction history...</p>
            ) : paymentsHistory.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                No payment transactions recorded yet. Use the form above to record collection.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance After</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paymentsHistory.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">
                          {p.receipt_number}
                        </td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap">
                          {p.payment_date}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {p.payment_mode || 'Cash'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          ₹{Number(p.balance_remaining || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-slate-500 italic max-w-xs truncate">
                          {p.payment_notes || '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenReceipt) {
                                onOpenReceipt(p, appointment);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            title="View / Print Payment Receipt"
                          >
                            <Printer className="w-3 h-3 text-emerald-600" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Official Patient Collection Ledger • Iniya Health Care
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
