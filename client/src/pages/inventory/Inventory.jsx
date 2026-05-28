import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI } from '../../services/api';
import { Package, AlertTriangle, Search, TrendingDown, Loader2, Edit2, Activity, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const categoryColors = {
  YARN: 'indigo', BEAM: 'purple', FABRIC: 'emerald', CHEMICALS: 'amber', PACKING_MATERIALS: 'cyan'
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Inventory = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'STORE_MANAGER');

  const [filters, setFilters] = useState({ search: '', category: '', page: 1 });
  const [showOutwardModal, setShowOutwardModal] = useState(false);
  const [outwardForm, setOutwardForm] = useState({ inventoryId: '', quantity: '', notes: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ minStockLevel: '', maxStockLevel: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryAPI.getAll(filters).then(r => r.data),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryAPI.getLowStock().then(r => r.data.data),
  });

  const outwardMutation = useMutation({
    mutationFn: inventoryAPI.createOutward,
    onSuccess: () => { queryClient.invalidateQueries(['inventory']); toast.success('Outward entry created!'); setShowOutwardModal(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventoryAPI.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['inventory']); toast.success('Updated!'); setShowEditModal(false); },
    onError: () => toast.error('Failed to update'),
  });

  const items = data?.data || [];
  const lowStockItems = lowStockData || [];
  const pagination = data?.pagination || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Track material stock levels and consumption</p>
        </div>
        {canManage && (
          <button onClick={() => setShowOutwardModal(true)} className="btn btn-primary shadow-indigo-600/20 shadow-lg hover:shadow-indigo-600/30">
            <TrendingDown size={18} strokeWidth={2.5} /> <span className="font-semibold">New Outward</span>
          </button>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="font-bold text-amber-800 text-[14px]">Low Stock Alert</h3>
            <p className="text-amber-700 text-[13px] mt-0.5">
              <strong>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''}</strong> running low on stock: 
              <span className="font-medium ml-1">{lowStockItems.map(i => i.materialName.replace(/_/g, ' ')).join(', ')}</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search material..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-48">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border border-transparent focus:border-indigo-500 rounded-xl text-sm outline-none appearance-none cursor-pointer transition-all focus:ring-4 focus:ring-indigo-500/10"
            >
              <option value="">All Categories</option>
              <option value="YARN">Yarn</option>
              <option value="BEAM">Beam</option>
              <option value="FABRIC">Fabric</option>
              <option value="CHEMICALS">Chemicals</option>
              <option value="PACKING_MATERIALS">Packing Materials</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Package size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No inventory found</h3>
          <p className="text-slate-500 text-sm">Inventory is automatically added upon purchase.</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map(item => {
            const color = categoryColors[item.category] || 'indigo';
            const isLow = item.currentStock <= item.minStockLevel;
            const stockPct = item.maxStockLevel ? Math.min(100, (item.currentStock / item.maxStockLevel) * 100) : null;
            return (
              <motion.div variants={cardVariants} key={item.id} className={`card p-5 group hover:border-${color}-200 transition-all ${isLow ? 'border-red-200 bg-red-50/10 shadow-red-500/5' : ''}`}>
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${color}-100 shadow-sm`}>
                      <Package size={22} className={`text-${color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-[15px] leading-tight">{item.materialName.replace(/_/g, ' ')}</h3>
                      <p className="text-[11px] text-slate-500 font-semibold tracking-wider mt-0.5">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManage && (
                      <button
                        onClick={() => { setEditItem(item); setEditForm({ minStockLevel: item.minStockLevel, maxStockLevel: item.maxStockLevel || '' }); setShowEditModal(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Stock Levels"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                  <p className={`text-[32px] leading-none font-bold tracking-tight ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                    {item.currentStock.toLocaleString('en-IN')}
                  </p>
                  <p className="text-slate-500 text-[13px] font-medium mt-1">{item.unit}</p>
                </div>

                {stockPct !== null && (
                  <div className="mb-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${stockPct < 20 ? 'bg-red-500' : stockPct < 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1.5 text-right tracking-wide">{stockPct.toFixed(0)}% CAPACITY</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100/80 flex justify-between items-center text-[12px] font-medium text-slate-500">
                  <div className="flex flex-col gap-0.5">
                    <span>Min: <strong className="text-slate-700">{item.minStockLevel}</strong> {item.unit}</span>
                    {item.maxStockLevel && <span>Max: <strong className="text-slate-700">{item.maxStockLevel}</strong> {item.unit}</span>}
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isLow ? 'LOW STOCK' : 'OPTIMAL'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-[13px] text-slate-500 bg-white p-3 px-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="font-medium">Showing <strong className="text-slate-900">{items.length}</strong> of <strong className="text-slate-900">{pagination.total}</strong> items</span>
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                className={`w-8 h-8 rounded-lg font-bold transition-all ${p === filters.page ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'hover:bg-slate-100 text-slate-600'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showOutwardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowOutwardModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><TrendingDown size={20} className="text-indigo-600" /> New Outward Entry</h2>
                <button onClick={() => setShowOutwardModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
              </div>
              <form onSubmit={e => { e.preventDefault(); outwardMutation.mutate(outwardForm); }}>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="form-label">Material <span className="text-red-500">*</span></label>
                    <select value={outwardForm.inventoryId} onChange={e => setOutwardForm({ ...outwardForm, inventoryId: e.target.value })} className="form-input" required>
                      <option value="">Select material</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.materialName.replace(/_/g, ' ')} — ({i.currentStock} {i.unit} available)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Quantity <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" min="0.01" value={outwardForm.quantity} onChange={e => setOutwardForm({ ...outwardForm, quantity: e.target.value })} className="form-input text-lg font-semibold" required placeholder="0.00" />
                  </div>
                  <div>
                    <label className="form-label">Reason / Notes</label>
                    <textarea value={outwardForm.notes} onChange={e => setOutwardForm({ ...outwardForm, notes: e.target.value })} className="form-input resize-none" rows={3} placeholder="Production batch, wastage, etc..." />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowOutwardModal(false)} className="btn btn-secondary bg-white">Cancel</button>
                  <button type="submit" disabled={outwardMutation.isPending} className="btn btn-primary px-6 shadow-indigo-600/20 shadow-lg">
                    {outwardMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Create Outward'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showEditModal && editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <h2 className="text-[16px] font-bold text-slate-900">Edit Stock Limits</h2>
                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">✕</button>
              </div>
              <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ id: editItem.id, data: editForm }); }}>
                <div className="p-6 space-y-5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                    <p className="text-[12px] text-slate-500 font-semibold tracking-wide uppercase">Material</p>
                    <p className="font-bold text-slate-800 text-[15px]">{editItem.materialName.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="form-label">Minimum Stock Alert Level</label>
                    <input type="number" step="0.01" value={editForm.minStockLevel} onChange={e => setEditForm({ ...editForm, minStockLevel: e.target.value })} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Maximum Stock Capacity</label>
                    <input type="number" step="0.01" value={editForm.maxStockLevel} onChange={e => setEditForm({ ...editForm, maxStockLevel: e.target.value })} className="form-input" />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary bg-white">Cancel</button>
                  <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary px-6">
                    {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Limits'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Inventory;
