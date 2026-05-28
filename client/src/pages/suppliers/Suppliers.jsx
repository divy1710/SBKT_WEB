import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Search, Loader2, Phone, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const emptyForm = { name: '', gstNumber: '', phone: '', email: '', address: '', paymentTerms: '' };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const Suppliers = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'PURCHASE_MANAGER');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: () => supplierAPI.getAll({ search, page, limit: 15 }).then(r => r.data),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: supplierAPI.create,
    onSuccess: () => { queryClient.invalidateQueries(['suppliers']); toast.success('Supplier created!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create supplier'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supplierAPI.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['suppliers']); toast.success('Supplier updated!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update supplier'),
  });

  const deleteMutation = useMutation({
    mutationFn: supplierAPI.delete,
    onSuccess: () => { queryClient.invalidateQueries(['suppliers']); toast.success('Supplier deleted!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot delete supplier with purchases'),
  });

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, gstNumber: item.gstNumber || '', phone: item.phone, email: item.email || '', address: item.address, paymentTerms: item.paymentTerms || '' } : emptyForm);
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

  const suppliers = data?.data || [];
  const pagination = data?.pagination || {};
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers Network</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Manage vendor relationships and contact profiles</p>
        </div>
        {canManage && (
          <button onClick={() => openModal()} className="btn btn-primary shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30">
            <Plus size={18} strokeWidth={2.5} /> <span className="font-semibold">Add Supplier</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-xl">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name, GST, or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 size={40} className="animate-spin text-indigo-600" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-16 text-center border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Truck size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No suppliers found</h3>
            <p className="text-slate-500 text-sm">Add a new supplier to start purchasing materials.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor Identity</th>
                  <th>Contact Info</th>
                  <th>GST No.</th>
                  <th>Payment Terms</th>
                  <th>Total Orders</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="group hover:bg-slate-50/50">
                    <td>
                      <div>
                        <p className="font-bold text-slate-900 text-[14px]">{s.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.supplierCode}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1.5 text-[13px] text-slate-600">
                        <div className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> {s.phone}</div>
                        {s.email && <div className="text-slate-500 ml-5 text-[12px]">{s.email}</div>}
                      </div>
                    </td>
                    <td className="text-[13px] text-slate-600 font-medium">{s.gstNumber || '—'}</td>
                    <td className="text-[13px] text-slate-600">{s.paymentTerms || '—'}</td>
                    <td>
                      <span className="badge bg-indigo-50 text-indigo-700 text-[12px] font-bold px-3 py-1">
                        {s._count?.purchases || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} text-[11px] px-2 py-0.5`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(s)} className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit Supplier">
                            <Edit2 size={16} />
                          </button>
                          {hasRole('ADMIN') && (
                            <button onClick={() => { setDeleteTargetId(s.id); setShowConfirmModal(true); }} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete Supplier">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between text-[13px] text-slate-500 bg-slate-50/50">
            <span className="font-medium">Showing <strong className="text-slate-900">{suppliers.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> suppliers</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${p === page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-200 text-slate-600'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h2 className="text-lg font-bold text-slate-900">{editItem ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
              </div>
              <div className="overflow-y-auto custom-scrollbar p-6">
                <form id="supplierForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="form-label">Company / Supplier Name <span className="text-red-500">*</span></label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" required placeholder="e.g. ABC Textiles Pvt Ltd" />
                  </div>
                  <div>
                    <label className="form-label">GST Number</label>
                    <input value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} className="form-input uppercase" placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="form-label">Phone <span className="text-red-500">*</span></label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input" required placeholder="10-digit mobile or landline" />
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" placeholder="vendor@company.com" />
                  </div>
                  <div>
                    <label className="form-label">Payment Terms</label>
                    <select value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })} className="form-input">
                      <option value="">Select terms</option>
                      <option>Net 7</option>
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Net 45</option>
                      <option>Net 60</option>
                      <option>Immediate</option>
                      <option>COD</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Full Address <span className="text-red-500">*</span></label>
                    <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="form-input resize-none" rows={3} required placeholder="Complete physical address..." />
                  </div>
                </form>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeModal} className="btn btn-secondary bg-white">Cancel</button>
                <button type="submit" form="supplierForm" disabled={isSaving} className="btn btn-primary px-6 shadow-indigo-600/20 shadow-lg">
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editItem ? 'Save Changes' : 'Create Supplier')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden text-center p-6"
            >
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4 border-4 border-red-50">
                <Trash2 size={24} />
              </div>
              <h3 className="text-[17px] font-bold text-slate-900 mb-2">Delete Supplier?</h3>
              <p className="text-sm text-slate-500 mb-6 px-2">
                This action cannot be undone. You cannot delete a supplier if they have existing purchases attached.
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
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Suppliers;
