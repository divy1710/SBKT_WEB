import { useState } from 'react';
import { reportsAPI } from '../../services/api';
import { Download, Filter, BarChart3, Loader2, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState('purchases');
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const [purchaseFilters, setPurchaseFilters] = useState({
    startDate: format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
    materialType: '',
    paymentStatus: '',
  });
  const [attendanceFilters, setAttendanceFilters] = useState({ month: today.getMonth() + 1, year: today.getFullYear() });
  const [salaryFilters, setSalaryFilters] = useState({ month: today.getMonth() + 1, year: today.getFullYear(), status: '' });
  const [inventoryFilters, setInventoryFilters] = useState({ category: '' });

  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let res;
      const filters = activeTab === 'purchases' ? purchaseFilters
        : activeTab === 'attendance' ? attendanceFilters
        : activeTab === 'salary' ? salaryFilters
        : inventoryFilters;

      res = await reportsAPI[activeTab](filters);
      setReportData(res.data.data);
      setReportType(activeTab);
      toast.success('Report generated successfully!');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    setLoading(true);
    try {
      const filters = activeTab === 'purchases' ? purchaseFilters
        : activeTab === 'attendance' ? attendanceFilters
        : activeTab === 'salary' ? salaryFilters
        : inventoryFilters;

      const res = await reportsAPI.downloadExcel(activeTab, filters);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${format(today, 'yyyy-MM-dd')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded!');
    } catch {
      toast.error('Failed to download Excel');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'purchases', label: 'Purchases' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'salary', label: 'Salary & Payroll' },
    { key: 'inventory', label: 'Inventory' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Generate, analyze, and export business data</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadExcel} disabled={loading} className="btn btn-secondary bg-white shadow-sm border-slate-200 text-slate-700 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
            <FileSpreadsheet size={16} className="mr-1.5" /> <span className="font-semibold">Export Excel</span>
          </button>
          <button onClick={fetchReport} disabled={loading} className="btn btn-primary shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30">
            {loading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <BarChart3 size={16} className="mr-1.5" />}
            <span className="font-semibold">Generate Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Controls & Filters */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Module Selection */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setReportData(null); }}
                className={`text-left px-4 py-3 rounded-xl text-[13px] font-semibold transition-all ${
                  activeTab === tab.key 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/10' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {tab.label} Report
              </button>
            ))}
          </div>

          {/* Filters Configuration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-[13px] font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Filter size={14} className="text-indigo-600" /> Filter Criteria
            </h3>
            
            <div className="space-y-4">
              {activeTab === 'purchases' && (
                <>
                  <div>
                    <label className="form-label">From Date</label>
                    <input type="date" value={purchaseFilters.startDate} onChange={e => setPurchaseFilters(f => ({ ...f, startDate: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">To Date</label>
                    <input type="date" value={purchaseFilters.endDate} onChange={e => setPurchaseFilters(f => ({ ...f, endDate: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Material Type</label>
                    <select value={purchaseFilters.materialType} onChange={e => setPurchaseFilters(f => ({ ...f, materialType: e.target.value }))} className="form-input">
                      <option value="">All Materials</option>
                      {['YARN', 'BEAM', 'DYE_CHEMICAL', 'FABRIC', 'PACKING_MATERIAL'].map(m => <option key={m}>{m.replace(/_/g,' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Payment Status</label>
                    <select value={purchaseFilters.paymentStatus} onChange={e => setPurchaseFilters(f => ({ ...f, paymentStatus: e.target.value }))} className="form-input">
                      <option value="">All Statuses</option>
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </>
              )}
              
              {(activeTab === 'attendance' || activeTab === 'salary') && (
                <>
                  <div>
                    <label className="form-label">Target Month</label>
                    <select value={activeTab === 'attendance' ? attendanceFilters.month : salaryFilters.month}
                      onChange={e => activeTab === 'attendance' ? setAttendanceFilters(f => ({ ...f, month: parseInt(e.target.value) })) : setSalaryFilters(f => ({ ...f, month: parseInt(e.target.value) }))}
                      className="form-input">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{format(new Date(2024, m - 1, 1), 'MMMM')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Target Year</label>
                    <select value={activeTab === 'attendance' ? attendanceFilters.year : salaryFilters.year}
                      onChange={e => activeTab === 'attendance' ? setAttendanceFilters(f => ({ ...f, year: parseInt(e.target.value) })) : setSalaryFilters(f => ({ ...f, year: parseInt(e.target.value) }))}
                      className="form-input">
                      {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
              
              {activeTab === 'inventory' && (
                <div>
                  <label className="form-label">Material Category</label>
                  <select value={inventoryFilters.category} onChange={e => setInventoryFilters({ category: e.target.value })} className="form-input">
                    <option value="">All Categories</option>
                    {['YARN', 'BEAM', 'FABRIC', 'CHEMICALS', 'PACKING_MATERIALS'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full min-h-[50vh] flex flex-col items-center justify-center">
              <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
              <p className="text-slate-500 font-medium">Crunching data for your report...</p>
            </div>
          )}

          {!loading && !reportData && (
            <div className="bg-white border border-slate-200 border-dashed rounded-2xl shadow-sm h-full min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                <BarChart3 size={32} className="text-slate-300" />
              </div>
              <h3 className="text-[18px] font-bold text-slate-800 mb-1">Ready to Generate</h3>
              <p className="text-[14px] text-slate-500 max-w-sm">Configure your filters on the left and click 'Generate Report' to view insights.</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!loading && reportData && (
              <motion.div key="report-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Summary Cards Top */}
                {reportData.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(reportData.summary).map(([k, v]) => (
                      <div key={k} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{k.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-2xl font-black text-slate-800 relative z-10">{typeof v === 'number' && (k.toLowerCase().includes('amount') || k.toLowerCase().includes('salary')) ? `₹${v.toLocaleString('en-IN')}` : v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Data Tables */}
                <div className="card overflow-hidden">
                  
                  {reportType === 'purchases' && (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead><tr><th>Code & Date</th><th>Supplier</th><th>Material Info</th><th>Total Amt</th><th>Payment</th></tr></thead>
                        <tbody>
                          {(reportData.purchases || reportData).map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td>
                                <p className="font-mono text-[11px] text-slate-500">{p.purchaseCode}</p>
                                <p className="text-[13px] font-medium text-slate-800 mt-0.5">{p.date ? format(new Date(p.date), 'dd MMM yyyy') : '—'}</p>
                              </td>
                              <td className="text-[13px] font-medium">{p.supplier?.name}</td>
                              <td>
                                <span className="badge bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5">{p.materialType}</span>
                                <p className="text-[12px] text-slate-500 mt-1">{p.quantity} {p.unit}</p>
                              </td>
                              <td className="font-bold text-[14px]">₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                              <td><span className={`badge text-[11px] px-2 py-0.5 ${p.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{p.paymentStatus}</span></td>
                            </tr>
                          ))}
                          {(!reportData.purchases && reportData.length === 0) && <tr><td colSpan={5} className="text-center py-10 text-slate-400">No data found for these filters</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportType === 'attendance' && (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead><tr><th>Employee</th><th>Date</th><th>Shift</th><th>Status</th><th>OT Hours</th></tr></thead>
                        <tbody>
                          {(Array.isArray(reportData) ? reportData : []).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="text-[13px] font-semibold text-slate-800">{r.employee?.fullName}</td>
                              <td className="text-[13px] text-slate-600">{r.date ? format(new Date(r.date), 'dd MMM yyyy') : '—'}</td>
                              <td><span className="badge bg-indigo-50 text-indigo-700 text-[11px]">{r.shift}</span></td>
                              <td><span className={`badge text-[11px] ${r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : r.status === 'ABSENT' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                              <td className="text-[13px] font-medium">{r.overtimeHours}h</td>
                            </tr>
                          ))}
                          {Array.isArray(reportData) && reportData.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400">No data found for these filters</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportType === 'salary' && (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead><tr><th>Employee</th><th>Present</th><th>Earnings</th><th>Deductions</th><th>Net Payout</th><th>Status</th></tr></thead>
                        <tbody>
                          {(reportData.salaries || reportData || []).map((s, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td>
                                <p className="text-[13px] font-bold text-slate-800">{s.employee?.fullName}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{s.employee?.role?.replace(/_/g,' ')}</p>
                              </td>
                              <td className="text-[13px] font-medium">{s.presentDays} Days</td>
                              <td>
                                <p className="text-[13px] font-medium">₹{s.grossSalary?.toLocaleString('en-IN')} <span className="text-[11px] text-slate-400">Base</span></p>
                                {s.bonus > 0 && <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">+₹{s.bonus?.toLocaleString('en-IN')} Bonus</p>}
                              </td>
                              <td className="text-[13px] text-rose-500 font-medium">₹{(s.deductions + s.advanceDeducted)?.toLocaleString('en-IN')}</td>
                              <td className="font-black text-indigo-700 text-[15px]">₹{s.finalSalary?.toLocaleString('en-IN')}</td>
                              <td><span className={`badge text-[11px] ${s.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span></td>
                            </tr>
                          ))}
                          {(!reportData.salaries && reportData.length === 0) && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No data found for these filters</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportType === 'inventory' && (
                    <div className="p-5 bg-slate-50/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(Array.isArray(reportData) ? reportData : []).map((item, i) => (
                          <div key={i} className={`bg-white rounded-xl p-5 border shadow-sm transition-all ${item.isLowStock ? 'border-red-200 shadow-red-500/5' : 'border-slate-200 hover:border-indigo-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <p className="font-bold text-[14px] text-slate-900 leading-tight">{item.materialName?.replace(/_/g,' ')}</p>
                                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{item.category}</p>
                              </div>
                              {item.isLowStock && <span className="badge bg-red-100 text-red-700 text-[10px] px-2 py-0.5 uppercase tracking-widest font-bold">Low</span>}
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 text-center mb-4 border border-slate-100">
                              <p className={`text-[28px] font-black leading-none ${item.isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                                {item.currentStock}
                              </p>
                              <p className="text-[12px] font-medium text-slate-500 mt-1">{item.unit}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
                              <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded">
                                IN: {item.monthInward}
                              </div>
                              <div className="bg-rose-50 text-rose-700 p-1.5 rounded">
                                OUT: {item.monthOutward}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {Array.isArray(reportData) && reportData.length === 0 && <div className="text-center py-10 text-slate-400">No inventory data found</div>}
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  );
};

export default Reports;
