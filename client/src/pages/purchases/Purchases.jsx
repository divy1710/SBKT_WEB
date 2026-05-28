import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseAPI, supplierAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Search, Upload, Eye, Loader2, Download, Filter, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const MATERIAL_TYPES = ['YARN', 'BEAM', 'DYE_CHEMICAL', 'FABRIC', 'PACKING_MATERIAL', 'COTTON', 'POLYESTER'];
const UNITS = ['KG', 'MTR', 'PCS', 'LTR', 'BAG', 'TON', 'ROLL'];
const GST_RATES = [0, 5, 12, 18, 28];

const emptyForm = {
  date: format(new Date(), 'yyyy-MM-dd'),
  supplierId: '',
  invoiceNumber: '',
  materialType: 'YARN',
  quantity: '',
  unit: 'KG',
  rate: '',
  gstPercent: 18,
  transportDetails: '',
  paymentStatus: 'PENDING',
  paidAmount: 0,
  notes: '',
};

const paymentBadge = { PAID: 'bg-emerald-100 text-emerald-700', PARTIAL: 'bg-amber-100 text-amber-700', PENDING: 'bg-rose-100 text-rose-700' };

const Purchases = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'PURCHASE_MANAGER');

  const [filters, setFilters] = useState({ search: '', materialType: '', paymentStatus: '', page: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [billFile, setBillFile] = useState(null);
  const [uploadingBill, setUploadingBill] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', filters],
    queryFn: () => purchaseAPI.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => supplierAPI.getList().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: purchaseAPI.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['inventory']);
      toast.success('Purchase recorded!');
      if (billFile) {
        handleBillUpload(res.data.data.id, billFile);
      }
      closeModal();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create purchase'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => purchaseAPI.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['purchases']); toast.success('Purchase updated!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update purchase'),
  });

  const deleteMutation = useMutation({
    mutationFn: purchaseAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['inventory']);
      toast.success('Purchase deleted!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete purchase'),
  });

  const handleBillUpload = async (id, file) => {
    setUploadingBill(id);
    try {
      const fd = new FormData();
      fd.append('bill', file);
      await purchaseAPI.uploadBill(id, fd);
      queryClient.invalidateQueries(['purchases']);
      toast.success('Bill uploaded!');
    } catch {
      toast.error('Failed to upload bill');
    } finally {
      setUploadingBill(null);
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? {
      date: format(new Date(item.date), 'yyyy-MM-dd'),
      supplierId: item.supplierId,
      invoiceNumber: item.invoiceNumber,
      materialType: item.materialType,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      gstPercent: item.gstPercent,
      transportDetails: item.transportDetails || '',
      paymentStatus: item.paymentStatus,
      paidAmount: item.paidAmount || 0,
      notes: item.notes || '',
    } : emptyForm);
    setBillFile(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(emptyForm); setBillFile(null); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const qty = parseFloat(form.quantity) || 0;
  const rate = parseFloat(form.rate) || 0;
  const gstPct = parseFloat(form.gstPercent) || 0;
  const taxable = qty * rate;
  const gstAmt = taxable * gstPct / 100;
  const total = taxable + gstAmt;

  const purchases = data?.data || [];
  const pagination = data?.pagination || {};
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const suppliers = suppliersData || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchases & Invoices</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Track material purchases, bills, and payments</p>
        </div>
        {canManage && (
          <button onClick={() => openModal()} className="btn btn-primary shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30">
            <Plus size={18} strokeWidth={2.5} /> <span className="font-semibold">New Purchase</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, code, supplier..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-48">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filters.materialType}
              onChange={e => setFilters({ ...filters, materialType: e.target.value, page: 1 })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">All Materials</option>
              {MATERIAL_TYPES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="relative flex-1 md:w-40">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filters.paymentStatus}
              onChange={e => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 size={40} className="animate-spin text-indigo-600" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-16 text-center border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No purchases found</h3>
            <p className="text-slate-500 text-sm">Create a new purchase entry to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice details</th>
                  <th>Supplier</th>
                  <th>Material Info</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Document</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="group">
                    <td>
                      <p className="text-[13px] font-semibold text-slate-800">{p.invoiceNumber}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.purchaseCode}</p>
                      <p className="text-[12px] text-slate-500 mt-1 flex items-center gap-1">
                        {format(new Date(p.date), 'dd MMM yyyy')}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-slate-800 text-[13px]">{p.supplier?.name}</p>
                    </td>
                    <td>
                      <span className="badge bg-indigo-50 text-indigo-700 text-[11px] px-2 py-0.5">{p.materialType.replace(/_/g, ' ')}</span>
                      <p className="text-[13px] font-medium text-slate-700 mt-1.5">{p.quantity} {p.unit}</p>
                    </td>
                    <td>
                      <p className="font-bold text-slate-900 text-[14px]">₹{p.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        +GST {p.gstPercent}%
                      </p>
                    </td>
                    <td>
                      <span className={`badge text-[11px] px-2 py-0.5 ${paymentBadge[p.paymentStatus]}`}>{p.paymentStatus}</span>
                    </td>
                    <td>
                      {p.billUrl ? (
                        <a href={p.billUrl} target="_blank" rel="noreferrer" className="btn btn-secondary bg-slate-50 text-slate-600 text-[12px] py-1.5 px-3 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 border-transparent transition-colors">
                          <Eye size={14} className="mr-1" /> View Bill
                        </a>
                      ) : canManage ? (
                        <label className="btn btn-secondary bg-slate-50 text-slate-500 text-[12px] py-1.5 px-3 rounded-lg border-dashed border-slate-300 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-all">
                          {uploadingBill === p.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => e.target.files[0] && handleBillUpload(p.id, e.target.files[0])}
                          />
                        </label>
                      ) : <span className="text-[12px] text-slate-400 italic">No bill</span>}
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(p)} className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          {hasRole('ADMIN') && (
                            <button onClick={() => { if (window.confirm('Delete purchase? This will reverse inventory.')) deleteMutation.mutate(p.id); }} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
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
            <span className="font-medium">Showing <strong className="text-slate-900">{purchases.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> purchases</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                  className={`w-8 h-8 rounded-lg font-bold transition-all ${p === filters.page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-200 text-slate-600'}`}>
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
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h2 className="text-lg font-bold text-slate-900">{editItem ? 'Edit Purchase Entry' : 'New Purchase Entry'}</h2>
                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar p-6">
                <form id="purchaseForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Purchase Date <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">Supplier <span className="text-red-500">*</span></label>
                    <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} className="form-input" required>
                      <option value="">Select supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Invoice Number <span className="text-red-500">*</span></label>
                    <input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} className="form-input uppercase" required placeholder="INV-2024-001" />
                  </div>
                  <div>
                    <label className="form-label">Material Type <span className="text-red-500">*</span></label>
                    <select value={form.materialType} onChange={e => setForm({ ...form, materialType: e.target.value })} className="form-input">
                      {MATERIAL_TYPES.map(m => <option key={m}>{m.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Quantity <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" min="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="form-input" required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">Unit <span className="text-red-500">*</span></label>
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="form-input">
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Rate per Unit (₹) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" min="0" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} className="form-input" required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">GST %</label>
                    <select value={form.gstPercent} onChange={e => setForm({ ...form, gstPercent: e.target.value })} className="form-input">
                      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                  
                  {/* Live Calculation Block */}
                  <div className="md:col-span-2 bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 mt-2">
                    <p className="text-[12px] font-bold text-indigo-800 uppercase tracking-wider mb-3">Amount Summary</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Taxable</p>
                        <p className="font-bold text-slate-800 text-[15px]">₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">GST ({gstPct}%)</p>
                        <p className="font-bold text-slate-800 text-[15px]">₹{gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-indigo-600 text-[11px] font-bold uppercase tracking-wider">Total Amount</p>
                        <p className="font-bold text-indigo-700 text-[18px] leading-none">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 h-px bg-slate-100 my-2" />

                  <div>
                    <label className="form-label">Payment Status</label>
                    <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} className="form-input">
                      <option value="PENDING">Pending</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Paid Amount (₹)</label>
                    <input type="number" step="0.01" min="0" value={form.paidAmount} onChange={e => setForm({ ...form, paidAmount: e.target.value })} className="form-input" placeholder="0.00" disabled={form.paymentStatus === 'PENDING'} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Transport Details</label>
                    <input value={form.transportDetails} onChange={e => setForm({ ...form, transportDetails: e.target.value })} className="form-input" placeholder="Vehicle No, Driver Name, etc." />
                  </div>
                  {!editItem && (
                    <div className="md:col-span-2">
                      <label className="form-label">Upload Bill (PDF/Image)</label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setBillFile(e.target.files[0])} className="form-input file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[12px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                    </div>
                  )}
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={closeModal} className="btn btn-secondary bg-white">Cancel</button>
                <button type="submit" form="purchaseForm" disabled={isSaving} className="btn btn-primary px-6 shadow-indigo-600/20 shadow-lg">
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editItem ? 'Save Changes' : 'Confirm Purchase')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Purchases;
