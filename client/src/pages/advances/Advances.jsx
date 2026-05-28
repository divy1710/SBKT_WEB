import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advanceAPI, employeeAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Loader2, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const emptyForm = { employeeId: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), reason: '' };

const Advances = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'HR_MANAGER', 'ACCOUNTANT');

  const [filters, setFilters] = useState({ employeeId: '', isDeducted: '', page: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['advances', filters],
    queryFn: () => advanceAPI.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => employeeAPI.getList().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: advanceAPI.create,
    onSuccess: () => { queryClient.invalidateQueries(['advances']); toast.success('Advance recorded!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => advanceAPI.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['advances']); toast.success('Updated!'); closeModal(); },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: advanceAPI.delete,
    onSuccess: () => { queryClient.invalidateQueries(['advances']); toast.success('Advance deleted!'); },
    onError: () => toast.error('Failed to delete'),
  });

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { employeeId: item.employeeId, amount: item.amount, date: format(new Date(item.date), 'yyyy-MM-dd'), reason: item.reason || '' } : emptyForm);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(emptyForm); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const advances = data?.data || [];
  const pagination = data?.pagination || {};
  const employees = employeesData || [];
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const totalPending = advances.filter(a => !a.isDeducted).reduce((s, a) => s + a.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary Advances</h1>
          <p className="text-slate-500 text-sm">Track and manage advance salary payments</p>
        </div>
        {canManage && (
          <button onClick={() => openModal()} className="btn btn-primary" id="add-advance-btn">
            <Plus size={17} /> New Advance
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4"><p className="text-slate-500 text-xs">Total Advances</p><p className="text-2xl font-bold text-slate-800">{pagination.total || advances.length}</p></div>
        <div className="card p-4"><p className="text-slate-500 text-xs">Pending Amount</p><p className="text-2xl font-bold text-amber-600">₹{totalPending.toLocaleString('en-IN')}</p></div>
        <div className="card p-4"><p className="text-slate-500 text-xs">Deducted</p><p className="text-2xl font-bold text-green-600">{advances.filter(a => a.isDeducted).length}</p></div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value, page: 1 })} className="form-input w-auto">
          <option value="">All Employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
        </select>
        <select value={filters.isDeducted} onChange={e => setFilters({ ...filters, isDeducted: e.target.value, page: 1 })} className="form-input w-auto">
          <option value="">All Status</option>
          <option value="false">Pending</option>
          <option value="true">Deducted</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-blue-600" /></div>
        ) : advances.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No advances found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {advances.map(a => (
                <tr key={a.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{a.employee?.fullName}</p>
                      <p className="text-xs text-slate-400">{a.employee?.employeeCode}</p>
                    </div>
                  </td>
                  <td className="text-sm text-slate-600">{format(new Date(a.date), 'dd MMM yyyy')}</td>
                  <td><span className="font-bold text-slate-800">₹{a.amount?.toLocaleString('en-IN')}</span></td>
                  <td className="text-sm text-slate-600">{a.reason || '—'}</td>
                  <td>
                    {a.isDeducted ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="badge badge-success text-xs">Deducted</span>
                        {a.deductedIn && <span className="text-xs text-slate-400">{a.deductedIn}/{a.deductedYear}</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-500" />
                        <span className="badge badge-warning text-xs">Pending</span>
                      </div>
                    )}
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex gap-1">
                        {!a.isDeducted && (
                          <button onClick={() => openModal(a)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                            <Edit2 size={14} />
                          </button>
                        )}
                        {hasRole('ADMIN') && !a.isDeducted && (
                          <button onClick={() => { if (window.confirm('Delete this advance?')) deleteMutation.mutate(a.id); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold text-slate-800">{editItem ? 'Edit Advance' : 'New Advance'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Employee *</label>
                  <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="form-input" required disabled={!!editItem}>
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" step="1" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="form-input" required placeholder="Amount" />
                </div>
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Reason</label>
                  <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="form-input" rows={2} placeholder="Medical, personal, etc." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : (editItem ? 'Update' : 'Create Advance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advances;
