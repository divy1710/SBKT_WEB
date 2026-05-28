import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../../services/api';
import { Plus, Edit2, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['ADMIN', 'PURCHASE_MANAGER', 'HR_MANAGER', 'ACCOUNTANT', 'STORE_MANAGER'];

const emptyForm = { name: '', email: '', password: '', role: 'PURCHASE_MANAGER' };
const roleColors = {
  ADMIN: 'badge-danger',
  PURCHASE_MANAGER: 'badge-blue',
  HR_MANAGER: 'badge-purple',
  ACCOUNTANT: 'badge-warning',
  STORE_MANAGER: 'badge-info',
};

const Users = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authAPI.getUsers().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: authAPI.createUser,
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User created!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => authAPI.updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User updated!'); closeModal(); },
    onError: () => toast.error('Failed to update user'),
  });

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, email: item.email, password: '', role: item.role, isActive: item.isActive } : emptyForm);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditItem(null); setForm(emptyForm); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: { name: form.name, role: form.role, isActive: form.isActive } });
    } else {
      createMutation.mutate(form);
    }
  };

  const users = data || [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-slate-500 text-sm">Manage system users and permissions</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary" id="add-user-btn">
          <Plus size={17} /> Add User
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={32} className="animate-spin text-blue-600" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-slate-600">{u.email}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Shield size={13} className="text-slate-400" />
                      <span className={`badge text-xs ${roleColors[u.role] || 'badge-gray'}`}>{u.role.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-gray'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <button onClick={() => openModal(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="text-lg font-bold text-slate-800">{editItem ? 'Edit User' : 'Add User'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" required />
                </div>
                {!editItem && (
                  <>
                    <div>
                      <label className="form-label">Email *</label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input" required />
                    </div>
                    <div>
                      <label className="form-label">Password *</label>
                      <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="form-input" required minLength={6} placeholder="Min 6 characters" />
                    </div>
                  </>
                )}
                <div>
                  <label className="form-label">Role *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-input">
                    {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                {editItem && (
                  <div className="flex items-center gap-3">
                    <label className="form-label mb-0">Active</label>
                    <input type="checkbox" checked={form.isActive !== false} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  {isSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : (editItem ? 'Update' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
