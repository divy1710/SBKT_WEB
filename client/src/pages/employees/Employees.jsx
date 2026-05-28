import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Search, Loader2, User, Phone, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const ROLES = ['MASTER', 'RUNNING_MASTER', 'KARIGAR', 'HELPER', 'SAFAI_KAMDAR', 'BEAM_GETTER', 'ACCOUNTANT', 'STORE_MANAGER'];
const SALARY_TYPES = ['MONTHLY', 'DAILY_WAGE', 'PIECE_RATE', 'OVERTIME_BASED'];
const SHIFTS = ['MORNING', 'EVENING', 'NIGHT'];

const emptyForm = {
  fullName: '', mobile: '', address: '', aadharNumber: '', role: 'KARIGAR',
  joiningDate: format(new Date(), 'yyyy-MM-dd'), salaryType: 'MONTHLY',
  basicSalary: '', shift: 'MORNING', photo: null,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Employees = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'HR_MANAGER');

  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1 });
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => employeeAPI.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: (fd) => employeeAPI.create(fd),
    onSuccess: () => { queryClient.invalidateQueries(['employees']); toast.success('Employee added!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add employee'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => employeeAPI.update(id, fd),
    onSuccess: () => { queryClient.invalidateQueries(['employees']); toast.success('Employee updated!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update employee'),
  });

  const deleteMutation = useMutation({
    mutationFn: employeeAPI.delete,
    onSuccess: () => { 
      queryClient.invalidateQueries(['employees']); 
      toast.success('Employee permanently deleted!'); 
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete employee permanently'),
  });

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? {
      fullName: item.fullName, mobile: item.mobile, address: item.address,
      aadharNumber: item.aadharNumber || '', role: item.role,
      joiningDate: format(new Date(item.joiningDate), 'yyyy-MM-dd'),
      salaryType: item.salaryType, basicSalary: item.basicSalary, shift: item.shift,
    } : emptyForm);
    setPhotoFile(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(emptyForm); setPhotoFile(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
    if (photoFile) fd.append('photo', photoFile);

    if (editItem) {
      updateMutation.mutate({ id: editItem.id, fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  const employees = data?.employees || [];
  const pagination = data?.pagination || {};
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const shiftBadge = { MORNING: 'badge-info', EVENING: 'badge-warning', NIGHT: 'badge-purple' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Manage workforce records and profiles</p>
        </div>
        {canManage && (
          <button onClick={() => openModal()} className="btn btn-primary shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30">
            <Plus size={18} strokeWidth={2.5} /> <span className="font-semibold">Add Employee</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, mobile..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-48">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={filters.role} 
              onChange={e => setFilters({ ...filters, role: e.target.value, page: 1 })} 
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">All Roles</option>
              {ROLES.map(r => <option key={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="relative flex-1 md:w-40">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={filters.status} 
              onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })} 
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center bg-red-50 border-red-200">
          <p className="text-red-600 font-medium">Failed to load employees: {error.message}</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="card p-16 text-center border-dashed border-2">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No employees found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your filters or add a new employee.</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {employees.map(emp => (
            <motion.div variants={cardVariants} key={emp.id} className="card p-5 group hover:border-indigo-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0 shadow-sm">
                    {emp.photoUrl ? (
                      <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                    ) : emp.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-[15px] leading-tight">{emp.fullName}</p>
                    <p className="text-[12px] text-slate-500 font-medium tracking-wide">{emp.employeeCode}</p>
                  </div>
                </div>
                <span className={`badge ${emp.status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} text-[11px] px-2 py-1`}>
                  {emp.status ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2.5 text-[13px] text-slate-600 mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2.5"><span className="w-4 flex justify-center text-slate-400">👤</span><span className="font-medium text-slate-700">{emp.role.replace(/_/g, ' ')}</span></div>
                <div className="flex items-center gap-2.5"><Phone size={14} className="text-slate-400 shrink-0" /><span>{emp.mobile}</span></div>
                <div className="flex items-center gap-2.5"><Calendar size={14} className="text-slate-400 shrink-0" /><span>{format(new Date(emp.joiningDate), 'dd MMM yyyy')}</span></div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`badge text-[10px] ${shiftBadge[emp.shift]}`}>{emp.shift}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{emp.salaryType.replace(/_/g, ' ')}</span>
                </div>
                {canManage && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(emp)} className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { setDeleteTargetId(emp.id); setShowConfirmModal(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-sm text-slate-500 bg-white p-3 px-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="font-medium">Showing <strong className="text-slate-900">{employees.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> employees</span>
          <div className="flex gap-1.5">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                className={`w-8 h-8 rounded-lg text-[13px] font-bold transition-all ${p === filters.page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-100 text-slate-600'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals using Framer Motion */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h2 className="text-lg font-bold text-slate-900">{editItem ? 'Edit Employee' : 'Add New Employee'}</h2>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar p-6">
                <form id="employeeForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                    <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="form-input" required placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="form-label">Mobile Number <span className="text-red-500">*</span></label>
                    <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="form-input" required placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="form-label">Aadhar Number</label>
                    <input value={form.aadharNumber} onChange={e => setForm({ ...form, aadharNumber: e.target.value })} className="form-input" placeholder="XXXX XXXX XXXX" />
                  </div>
                  <div>
                    <label className="form-label">Role <span className="text-red-500">*</span></label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-input">
                      {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Joining Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Salary Type <span className="text-red-500">*</span></label>
                    <select value={form.salaryType} onChange={e => setForm({ ...form, salaryType: e.target.value })} className="form-input">
                      {SALARY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">
                      {form.salaryType === 'MONTHLY' ? 'Monthly Salary (₹)' :
                       form.salaryType === 'DAILY_WAGE' ? 'Daily Wage (₹)' :
                       form.salaryType === 'PIECE_RATE' ? 'Rate per Piece (₹)' : 'Basic Salary (₹)'} <span className="text-red-500">*</span>
                    </label>
                    <input type="number" step="0.01" min="0" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} className="form-input" required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">Shift <span className="text-red-500">*</span></label>
                    <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })} className="form-input">
                      {SHIFTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Profile Photo</label>
                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="form-input" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Address <span className="text-red-500">*</span></label>
                    <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="form-input resize-none" rows={2} required placeholder="Full residential address" />
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={closeModal} className="btn btn-secondary bg-white">Cancel</button>
                <button type="submit" form="employeeForm" disabled={isSaving} className="btn btn-primary px-6 shadow-indigo-600/20 shadow-lg">
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editItem ? 'Save Changes' : 'Create Employee')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden text-center p-6"
            >
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4 border-4 border-red-50">
                <Trash2 size={24} />
              </div>
              <h3 className="text-[17px] font-bold text-slate-900 mb-2">Delete Employee?</h3>
              <p className="text-sm text-slate-500 mb-6 px-2">
                This action cannot be undone. All data related to this employee will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowConfirmModal(false)} className="btn btn-secondary flex-1 bg-slate-50">Cancel</button>
                <button 
                  type="button" 
                  onClick={() => {
                    deleteMutation.mutate(deleteTargetId);
                    setShowConfirmModal(false);
                  }} 
                  className="btn btn-danger flex-1"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Employees;
