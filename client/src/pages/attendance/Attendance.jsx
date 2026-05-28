import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceAPI } from '../../services/api';
import { Loader2, Save, Calendar, CheckCircle2, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, subDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const STATUSES = [
  { value: 'PRESENT', label: 'P', color: 'bg-emerald-500 text-white shadow-emerald-500/30', title: 'Present' },
  { value: 'ABSENT', label: 'A', color: 'bg-rose-500 text-white shadow-rose-500/30', title: 'Absent' },
  { value: 'HALF_DAY', label: 'H', color: 'bg-amber-400 text-white shadow-amber-400/30', title: 'Half Day' },
  { value: 'LEAVE', label: 'L', color: 'bg-blue-400 text-white shadow-blue-400/30', title: 'Leave' },
  { value: 'OVERTIME', label: 'OT', color: 'bg-purple-500 text-white shadow-purple-500/30', title: 'Overtime' },
];

const statusConfig = STATUSES.reduce((acc, s) => { acc[s.value] = s; return acc; }, {});

const Attendance = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'HR_MANAGER');

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceMap, setAttendanceMap] = useState({});
  const [overtimeMap, setOvertimeMap] = useState({});
  const [view, setView] = useState('daily'); // 'daily' or 'monthly'
  const [monthYear, setMonthYear] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const { data: dailyData, isLoading } = useQuery({
    queryKey: ['daily-attendance', selectedDate],
    queryFn: () => attendanceAPI.getDaily(selectedDate).then(r => r.data.data),
    onSuccess: (data) => {
      const map = {};
      const otMap = {};
      data.forEach(({ employee, attendance }) => {
        map[employee.id] = attendance?.status || 'PRESENT';
        otMap[employee.id] = attendance?.overtimeHours || 0;
      });
      setAttendanceMap(map);
      setOvertimeMap(otMap);
    },
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['monthly-summary', monthYear],
    queryFn: () => attendanceAPI.getMonthlySummary(monthYear).then(r => r.data.data),
    enabled: view === 'monthly',
  });

  const markMutation = useMutation({
    mutationFn: attendanceAPI.mark,
    onSuccess: () => { queryClient.invalidateQueries(['daily-attendance']); toast.success('Attendance saved!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save attendance'),
  });

  const handleSave = () => {
    if (!dailyData) return;
    const records = dailyData.map(({ employee }) => ({
      employeeId: employee.id,
      date: selectedDate,
      shift: employee.shift || 'MORNING',
      status: attendanceMap[employee.id] || 'PRESENT',
      overtimeHours: parseFloat(overtimeMap[employee.id] || 0),
    }));
    markMutation.mutate(records);
  };

  const toggleStatus = (empId) => {
    const order = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'OVERTIME'];
    const current = attendanceMap[empId] || 'PRESENT';
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];
    setAttendanceMap(prev => ({ ...prev, [empId]: next }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Register</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Mark daily presence or review monthly summary</p>
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-sm">
          <button 
            onClick={() => setView('daily')} 
            className={`px-5 py-2 text-[13px] font-semibold rounded-lg transition-all ${view === 'daily' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Daily Entry
          </button>
          <button 
            onClick={() => setView('monthly')} 
            className={`px-5 py-2 text-[13px] font-semibold rounded-lg transition-all ${view === 'monthly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      {view === 'daily' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Controls & Legend */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Date selector */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <button onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all">
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <div className="flex flex-col items-center min-w-[160px]">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent text-[14px] font-bold text-slate-800 outline-none cursor-pointer text-center"
                />
                <p className="text-slate-400 text-[11px] font-medium tracking-wide uppercase mt-0.5">
                  {format(new Date(selectedDate), 'EEEE')}
                </p>
              </div>
              <button onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))} className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all">
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3.5 flex-wrap justify-center bg-slate-50 py-2 px-4 rounded-xl border border-slate-100">
              {STATUSES.map(s => (
                <div key={s.value} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${s.color.split(' ')[0]} text-white`}>{s.label}</span>
                  <span className="text-[12px] font-medium text-slate-600">{s.title}</span>
                </div>
              ))}
              <span className="text-[11px] text-slate-400 font-medium italic border-l border-slate-200 pl-3 ml-1">Click circle to cycle</span>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[40vh]"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Role Details</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Overtime (Hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dailyData || []).map(({ employee, attendance }) => {
                      const status = attendanceMap[employee.id] || 'PRESENT';
                      const cfg = statusConfig[status];
                      return (
                        <tr key={employee.id} className="hover:bg-slate-50/50">
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-[13px] font-bold shadow-sm">
                                {employee.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-[14px] leading-tight">{employee.fullName}</p>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{employee.employeeCode}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex flex-col gap-1 text-[13px]">
                              <span className="font-medium text-slate-700">{employee.role.replace(/_/g, ' ')}</span>
                              <span className="text-slate-400">{employee.shift}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            {canManage ? (
                              <button
                                onClick={() => toggleStatus(employee.id)}
                                className={`w-11 h-11 rounded-full mx-auto font-bold text-[14px] shadow-md transition-all hover:scale-105 active:scale-95 ${cfg.color} flex items-center justify-center border-2 border-white`}
                                title={cfg.title}
                              >
                                {cfg.label}
                              </button>
                            ) : (
                              <span className={`badge text-[11px] ${cfg.color} mx-auto`}>{cfg.title}</span>
                            )}
                          </td>
                          <td className="text-center">
                            {(status === 'PRESENT' || status === 'OVERTIME') && canManage ? (
                              <input
                                type="number"
                                min="0"
                                max="12"
                                step="0.5"
                                value={overtimeMap[employee.id] || 0}
                                onChange={e => setOvertimeMap(prev => ({ ...prev, [employee.id]: e.target.value }))}
                                className="form-input w-20 text-center mx-auto bg-slate-50 hover:bg-white transition-colors"
                                placeholder="0"
                              />
                            ) : (
                              <span className="text-slate-500 text-[13px] font-medium">{overtimeMap[employee.id] || 0}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {canManage && dailyData?.length > 0 && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={handleSave} disabled={markMutation.isPending} className="btn btn-primary px-6 shadow-indigo-600/20 shadow-lg">
                      {markMutation.isPending ? <><Loader2 size={16} className="animate-spin mr-1" /> Saving...</> : <><Save size={16} className="mr-1" /> Save Attendance</>}
                    </button>
                  </div>
                )}
                {dailyData?.length === 0 && (
                  <div className="py-16 text-center text-slate-400">
                    <p>No employees found to mark attendance.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        /* Monthly Summary */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center justify-center gap-4">
            <select value={monthYear.month} onChange={e => setMonthYear(m => ({ ...m, month: parseInt(e.target.value) }))} className="form-input w-40 font-semibold text-center bg-slate-50">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{format(new Date(2024, m - 1, 1), 'MMMM')}</option>
              ))}
            </select>
            <select value={monthYear.year} onChange={e => setMonthYear(m => ({ ...m, year: parseInt(e.target.value) }))} className="form-input w-28 font-semibold text-center bg-slate-50">
              {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          <div className="card overflow-hidden">
            {summaryLoading ? (
              <div className="flex items-center justify-center min-h-[40vh]"><Loader2 size={32} className="animate-spin text-indigo-600" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee Profile</th>
                      <th>Role</th>
                      <th className="text-center text-emerald-600">Present (P)</th>
                      <th className="text-center text-rose-500">Absent (A)</th>
                      <th className="text-center text-amber-500">Half Day (H)</th>
                      <th className="text-center text-blue-500">Leave (L)</th>
                      <th className="text-center text-purple-500">OT (Hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summaryData || []).map(row => (
                      <tr key={row.employee.id} className="hover:bg-slate-50/50">
                        <td>
                          <div>
                            <p className="font-semibold text-slate-800 text-[14px]">{row.employee.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{row.employee.employeeCode}</p>
                          </div>
                        </td>
                        <td className="text-[13px] text-slate-600 font-medium">{row.employee.role?.replace(/_/g, ' ')}</td>
                        <td className="text-center"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[13px]">{row.present}</span></td>
                        <td className="text-center"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-500 font-bold text-[13px]">{row.absent}</span></td>
                        <td className="text-center"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600 font-bold text-[13px]">{row.halfDay}</span></td>
                        <td className="text-center"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-500 font-bold text-[13px]">{row.leave}</span></td>
                        <td className="text-center"><span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-bold text-[13px]">{row.overtimeHours?.toFixed(1)}</span></td>
                      </tr>
                    ))}
                    {(!summaryData || summaryData.length === 0) && (
                      <tr><td colSpan={7} className="text-center py-16 text-slate-500 font-medium">No attendance records found for this month</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Attendance;
