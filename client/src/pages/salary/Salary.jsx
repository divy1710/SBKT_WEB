import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryAPI } from '../../services/api';
import { Loader2, Play, CheckCircle, DollarSign, FileText, Printer, Download, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

const statusColors = { GENERATED: 'bg-indigo-100 text-indigo-700', APPROVED: 'bg-amber-100 text-amber-700', PAID: 'bg-emerald-100 text-emerald-700' };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const SalarySlipModal = ({ salary, onClose }) => {
  const slipRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: slipRef,
    documentTitle: `salary-slip-${salary?.employee?.employeeCode || 'unknown'}-${format(new Date(salary?.year || 2026, (salary?.month || 1) - 1, 1), 'MMMM-yyyy')}`,
  });

  const handleDownloadPDF = async () => {
    try {
      const input = slipRef.current;
      document.body.classList.add("pdf-mode");

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const fileName = `salary-slip-${salary.employee?.employeeCode || 'unknown'}-${format(new Date(salary.year, salary.month - 1, 1), 'MMMM-yyyy')}.pdf`;
      pdf.save(fileName);
      
      document.body.classList.remove("pdf-mode");
      toast.success('Salary slip PDF downloaded successfully!');
    } catch (error) {
      document.body.classList.remove("pdf-mode");
      console.error("PDF Generation Error:", error);
      toast.error('Failed to generate PDF. Try print instead.');
    }
  };

  if (!salary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh]"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 rounded-t-2xl no-print">
          <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2"><Receipt size={18} className="text-indigo-600" /> Document Preview</h2>
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadPDF} className="btn btn-secondary bg-white shadow-sm hover:shadow-md transition-shadow text-[13px] py-1.5 px-3"><Download size={15} className="mr-1.5 text-indigo-600" /> Download PDF</button>
            <button onClick={handlePrint} className="btn btn-primary shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30 text-[13px] py-1.5 px-4"><Printer size={15} className="mr-1.5" /> Print</button>
            <div className="w-px h-5 bg-slate-200 mx-1"></div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
          </div>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar bg-slate-100 p-6 flex justify-center">
          <div 
            ref={slipRef} 
            className="print-area bg-white w-full max-w-2xl shadow-sm border border-slate-200"
            style={{
              color: "#0f172a",
              padding: "2.5rem",
              fontFamily: "Inter, sans-serif"
            }}
          >
            {/* Header */}
            <div className="text-center pb-5 mb-8" style={{ borderBottom: "3px solid #1e1b4b" }}>
              <h1 className="text-2xl font-black uppercase tracking-wider" style={{ color: "#1e1b4b" }}>Shree Brahmnikrupa Textile</h1>
              <p className="text-[13px] mt-1.5 font-medium" style={{ color: "#475569" }}>Surat, Gujarat | GSTIN: 24XXXXX0000X1Z5</p>
              <div className="inline-block mt-4 px-5 py-1.5 rounded-md text-[13px] font-bold tracking-widest" style={{ backgroundColor: "#4f46e5", color: "#ffffff" }}>
                SALARY SLIP • {format(new Date(salary.year, salary.month - 1, 1), 'MMMM yyyy').toUpperCase()}
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 mb-8 text-[13px]">
              <div className="space-y-2.5 p-4 rounded-lg border" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9" }}>
                <div className="flex gap-3"><span className="w-24 font-semibold uppercase text-[11px] tracking-wider" style={{ color: "#64748b" }}>Employee</span><span className="font-bold" style={{ color: "#0f172a" }}>{salary.employee?.fullName}</span></div>
                <div className="flex gap-3"><span className="w-24 font-semibold uppercase text-[11px] tracking-wider" style={{ color: "#64748b" }}>Emp. Code</span><span className="font-mono font-medium" style={{ color: "#0f172a" }}>{salary.employee?.employeeCode}</span></div>
                <div className="flex gap-3"><span className="w-24 font-semibold uppercase text-[11px] tracking-wider" style={{ color: "#64748b" }}>Role</span><span className="font-medium" style={{ color: "#0f172a" }}>{salary.employee?.role?.replace(/_/g, ' ')}</span></div>
              </div>
              <div className="space-y-2.5 p-4 rounded-lg border" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9" }}>
                <div className="flex gap-3"><span className="w-24 font-semibold uppercase text-[11px] tracking-wider" style={{ color: "#64748b" }}>Pay Period</span><span className="font-medium" style={{ color: "#0f172a" }}>{format(new Date(salary.year, salary.month - 1, 1), 'MMM yyyy')}</span></div>
                <div className="flex gap-3"><span className="w-24 font-semibold uppercase text-[11px] tracking-wider" style={{ color: "#64748b" }}>Salary Type</span><span className="font-medium" style={{ color: "#0f172a" }}>{salary.employee?.salaryType?.replace(/_/g, ' ')}</span></div>
                <div className="flex gap-3"><span className="w-24 font-semibold uppercase text-[11px] tracking-wider" style={{ color: "#64748b" }}>Payment Sts</span><span className="font-bold uppercase text-[11px]" style={{ color: salary.status === 'PAID' ? "#059669" : "#d97706" }}>{salary.status}</span></div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="mb-8">
              <h3 className="font-bold mb-3 text-[14px] uppercase tracking-wider" style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>Attendance Record</h3>
              <div className="grid grid-cols-4 gap-4 text-center text-[13px]">
                <div className="border rounded-md p-2.5" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}><p className="font-black text-xl" style={{ color: "#16a34a" }}>{salary.presentDays}</p><p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#15803d" }}>Present</p></div>
                <div className="border rounded-md p-2.5" style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}><p className="font-black text-xl" style={{ color: "#dc2626" }}>{salary.absentDays}</p><p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#b91c1c" }}>Absent</p></div>
                <div className="border rounded-md p-2.5" style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb" }}><p className="font-black text-xl" style={{ color: "#d97706" }}>{salary.halfDays}</p><p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#b45309" }}>Half Day</p></div>
                <div className="border rounded-md p-2.5" style={{ borderColor: "#e9d5ff", backgroundColor: "#faf5ff" }}><p className="font-black text-xl" style={{ color: "#9333ea" }}>{salary.overtimeHours}h</p><p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#7e22ce" }}>Overtime</p></div>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold mb-3 text-[14px] uppercase tracking-wider" style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>Earnings</h3>
                <div className="text-[13px]">
                  <div className="flex justify-between py-2 border-b" style={{ borderBottomColor: "#f1f5f9" }}><span style={{ color: "#475569" }}>Basic Salary</span><span className="font-bold" style={{ color: "#0f172a" }}>₹{salary.grossSalary?.toLocaleString('en-IN')}</span></div>
                  {salary.overtimeAmount > 0 && <div className="flex justify-between py-2 border-b" style={{ borderBottomColor: "#f1f5f9" }}><span style={{ color: "#475569" }}>Overtime Pay</span><span className="font-bold" style={{ color: "#16a34a" }}>₹{salary.overtimeAmount?.toLocaleString('en-IN')}</span></div>}
                  {salary.bonus > 0 && <div className="flex justify-between py-2"><span style={{ color: "#475569" }}>Bonus / Incentives</span><span className="font-bold" style={{ color: "#16a34a" }}>₹{salary.bonus?.toLocaleString('en-IN')}</span></div>}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-3 text-[14px] uppercase tracking-wider" style={{ color: "#334155", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>Deductions</h3>
                <div className="text-[13px]">
                  {salary.deductions > 0 && <div className="flex justify-between py-2 border-b" style={{ borderBottomColor: "#f1f5f9" }}><span style={{ color: "#475569" }}>Leave / Other Deductions</span><span className="font-bold" style={{ color: "#dc2626" }}>-₹{salary.deductions?.toLocaleString('en-IN')}</span></div>}
                  {salary.advanceDeducted > 0 && <div className="flex justify-between py-2"><span style={{ color: "#475569" }}>Advance Repayment</span><span className="font-bold" style={{ color: "#dc2626" }}>-₹{salary.advanceDeducted?.toLocaleString('en-IN')}</span></div>}
                  {salary.deductions === 0 && salary.advanceDeducted === 0 && <div className="py-2 italic" style={{ color: "#94a3b8" }}>No deductions for this period.</div>}
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="rounded-xl p-5 flex items-center justify-between" style={{ backgroundColor: "#1e1b4b", color: "#ffffff" }}>
              <div>
                <p className="text-[12px] font-bold tracking-widest uppercase" style={{ color: "#818cf8" }}>Net Payable Salary</p>
                <p className="text-[11px] mt-1 opacity-80" style={{ color: "#e0e7ff" }}>Amount transferred to employee</p>
              </div>
              <p className="text-[32px] font-black tracking-tight" style={{ color: "#ffffff" }}>₹{salary.finalSalary?.toLocaleString('en-IN')}</p>
            </div>

            {/* Signature line */}
            <div className="mt-14 flex justify-between text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#64748b" }}>
              <div className="text-center w-40"><div className="pt-2" style={{ borderTop: "2px solid #cbd5e1" }}>Employee Signature</div></div>
              <div className="text-center w-40"><div className="pt-2" style={{ borderTop: "2px solid #cbd5e1" }}>Authorized Signatory</div></div>
            </div>
            
            <div className="mt-10 text-center text-[10px]" style={{ color: "#94a3b8" }}>
              This is a computer-generated document. No physical signature is required.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Salary = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'HR_MANAGER');
  const canApprove = hasRole('ADMIN');
  const canPay = hasRole('ADMIN', 'ACCOUNTANT');

  const today = new Date();
  const [filters, setFilters] = useState({ month: today.getMonth() + 1, year: today.getFullYear(), status: '', page: 1 });
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genForm, setGenForm] = useState({ month: today.getMonth() + 1, year: today.getFullYear() });
  const [selectedSlip, setSelectedSlip] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['salaries', filters],
    queryFn: () => salaryAPI.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  });

  const generateMutation = useMutation({
    mutationFn: salaryAPI.generate,
    onSuccess: (res) => { queryClient.invalidateQueries(['salaries']); toast.success(`Payroll generated for ${res.data.data.length} employees!`); setShowGenerateModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to generate payroll'),
  });

  const approveMutation = useMutation({
    mutationFn: salaryAPI.approve,
    onSuccess: () => { queryClient.invalidateQueries(['salaries']); toast.success('Salary approved!'); },
  });

  const payMutation = useMutation({
    mutationFn: salaryAPI.markPaid,
    onSuccess: () => { queryClient.invalidateQueries(['salaries']); toast.success('Marked as paid!'); },
  });

  const salaries = data?.data || [];
  const pagination = data?.pagination || {};
  const totalExpense = salaries.reduce((s, sal) => s + sal.finalSalary, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll & Salaries</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Generate monthly payroll and manage salary slips</p>
        </div>
        {canManage && (
          <button onClick={() => setShowGenerateModal(true)} className="btn btn-primary shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30">
            <Play size={18} fill="currentColor" className="mr-1" /> <span className="font-semibold">Run Payroll Engine</span>
          </button>
        )}
      </div>

      {/* Summary card */}
      {salaries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
          <div className="flex gap-10">
            <div>
              <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-1">Payroll Month</p>
              <p className="text-xl font-black text-slate-800">{format(new Date(filters.year, filters.month - 1, 1), 'MMMM yyyy')}</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div>
              <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-1">Total Employees</p>
              <p className="text-xl font-black text-slate-800">{pagination.total || salaries.length}</p>
            </div>
            <div className="w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block">
              <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase mb-1">Status</p>
              <div className="flex gap-3">
                <p className="text-[14px] font-bold text-emerald-600"><span className="text-slate-400 font-medium mr-1 text-[12px]">PAID:</span> {salaries.filter(s => s.status === 'PAID').length}</p>
                <p className="text-[14px] font-bold text-amber-500"><span className="text-slate-400 font-medium mr-1 text-[12px]">PENDING:</span> {salaries.filter(s => s.status !== 'PAID').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex-1 md:flex-none text-right">
            <p className="text-indigo-600 text-[11px] font-bold tracking-wider uppercase mb-1">Total Outflow</p>
            <p className="text-2xl font-black text-indigo-700 leading-none">₹{totalExpense.toLocaleString('en-IN')}</p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <select value={filters.month} onChange={e => setFilters({ ...filters, month: parseInt(e.target.value), page: 1 })} className="form-input flex-1 min-w-[140px] bg-slate-50 hover:bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 transition-colors font-medium">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{format(new Date(2024, m - 1, 1), 'MMMM')}</option>
            ))}
          </select>
          <select value={filters.year} onChange={e => setFilters({ ...filters, year: parseInt(e.target.value), page: 1 })} className="form-input w-32 bg-slate-50 hover:bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 transition-colors font-medium">
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })} className="form-input w-full sm:w-48 bg-slate-50 hover:bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 transition-colors font-medium">
          <option value="">All Statuses</option>
          <option value="GENERATED">Generated</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 size={40} className="animate-spin text-indigo-600" /></div>
        ) : salaries.length === 0 ? (
          <div className="p-16 text-center border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <DollarSign size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No payroll data</h3>
            <p className="text-slate-500 text-sm">Run the payroll engine to generate salaries for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Attendance Summary</th>
                  <th>Gross Earnings</th>
                  <th>Adjustments (OT/Ded)</th>
                  <th>Net Payable</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 group">
                    <td>
                      <div>
                        <p className="font-semibold text-slate-900 text-[14px]">{s.employee?.fullName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5"><span className="font-mono text-slate-400">{s.employee?.employeeCode}</span> • {s.employee?.role?.replace(/_/g, ' ')}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded bg-emerald-50 text-emerald-600 font-bold text-[11px]" title="Present">{s.presentDays}P</span>
                        <span className="flex items-center justify-center w-6 h-6 rounded bg-rose-50 text-rose-500 font-bold text-[11px]" title="Absent">{s.absentDays}A</span>
                        <span className="flex items-center justify-center w-6 h-6 rounded bg-amber-50 text-amber-600 font-bold text-[11px]" title="Half Days">{s.halfDays}H</span>
                      </div>
                    </td>
                    <td className="font-medium text-slate-700 text-[13px]">₹{s.grossSalary?.toLocaleString('en-IN')}</td>
                    <td>
                      <div className="flex flex-col gap-1 text-[12px]">
                        {(s.overtimeAmount + s.bonus) > 0 && <span className="font-medium text-emerald-600 flex items-center gap-1">+ ₹{(s.overtimeAmount + s.bonus).toLocaleString('en-IN')}</span>}
                        {(s.deductions + s.advanceDeducted) > 0 && <span className="font-medium text-rose-500 flex items-center gap-1">- ₹{(s.deductions + s.advanceDeducted).toLocaleString('en-IN')}</span>}
                        {((s.overtimeAmount + s.bonus) === 0 && (s.deductions + s.advanceDeducted) === 0) && <span className="text-slate-400 italic">No adj.</span>}
                      </div>
                    </td>
                    <td>
                      <span className="font-black text-indigo-700 text-[16px]">₹{s.finalSalary?.toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span className={`badge text-[11px] px-2 py-0.5 ${statusColors[s.status]}`}>{s.status}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedSlip(s)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" title="View Salary Slip">
                          <FileText size={15} />
                        </button>
                        {canApprove && s.status === 'GENERATED' && (
                          <button onClick={() => approveMutation.mutate(s.id)} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Approve Salary">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {canPay && s.status === 'APPROVED' && (
                          <button onClick={() => { if (window.confirm('Mark this salary as paid?')) payMutation.mutate(s.id); }} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Mark as Paid">
                            <DollarSign size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-[13px] text-slate-500 bg-slate-50/50">
            <span className="font-medium">Showing <strong className="text-slate-900">{salaries.length}</strong> records</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${p === filters.page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-200 text-slate-600'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowGenerateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2"><Play size={16} fill="currentColor" className="text-indigo-600" /> Run Payroll Engine</h2>
                <button onClick={() => setShowGenerateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
              </div>
              <form onSubmit={e => { e.preventDefault(); generateMutation.mutate(genForm); }}>
                <div className="p-6 space-y-5">
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-4 rounded-xl text-[13px] font-medium leading-relaxed">
                    This action will calculate salaries for all active employees based on their attendance records for the selected period.
                  </div>
                  <div>
                    <label className="form-label">Payroll Month</label>
                    <select value={genForm.month} onChange={e => setGenForm(f => ({ ...f, month: parseInt(e.target.value) }))} className="form-input">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{format(new Date(2024, m - 1, 1), 'MMMM')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Payroll Year</label>
                    <select value={genForm.year} onChange={e => setGenForm(f => ({ ...f, year: parseInt(e.target.value) }))} className="form-input">
                      {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowGenerateModal(false)} className="btn btn-secondary bg-white">Cancel</button>
                  <button type="submit" disabled={generateMutation.isPending} className="btn btn-primary px-6 shadow-indigo-600/20 shadow-lg">
                    {generateMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Generate Payroll'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedSlip && <SalarySlipModal salary={selectedSlip} onClose={() => setSelectedSlip(null)} />}
    </motion.div>
  );
};

export default Salary;
