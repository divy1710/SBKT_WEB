import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Users, ClipboardList,
  DollarSign, Truck, BarChart3, Settings, X, Factory, Wallet,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN', 'PURCHASE_MANAGER', 'HR_MANAGER', 'ACCOUNTANT', 'STORE_MANAGER'] },
    ],
  },
  {
    title: 'Purchase & Inventory',
    items: [
      { label: 'Purchases', icon: ShoppingCart, path: '/purchases', roles: ['ADMIN', 'PURCHASE_MANAGER', 'ACCOUNTANT'] },
      { label: 'Suppliers', icon: Truck, path: '/suppliers', roles: ['ADMIN', 'PURCHASE_MANAGER'] },
      { label: 'Inventory', icon: Package, path: '/inventory', roles: ['ADMIN', 'PURCHASE_MANAGER', 'STORE_MANAGER'] },
    ],
  },
  {
    title: 'HR & Payroll',
    items: [
      { label: 'Employees', icon: Users, path: '/employees', roles: ['ADMIN', 'HR_MANAGER'] },
      { label: 'Attendance', icon: ClipboardList, path: '/attendance', roles: ['ADMIN', 'HR_MANAGER'] },
      { label: 'Salary & Payroll', icon: DollarSign, path: '/salary', roles: ['ADMIN', 'HR_MANAGER', 'ACCOUNTANT'] },
      { label: 'Advances', icon: Wallet, path: '/advances', roles: ['ADMIN', 'HR_MANAGER', 'ACCOUNTANT'] },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['ADMIN', 'ACCOUNTANT', 'HR_MANAGER', 'PURCHASE_MANAGER', 'STORE_MANAGER'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'User Management', icon: Settings, path: '/users', roles: ['ADMIN'] },
    ],
  },
];

const Sidebar = ({ isOpen, onClose, isCollapsed, toggleCollapse }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarVariants = {
    expanded: { width: '260px' },
    collapsed: { width: '80px' }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside 
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        className={`fixed left-0 top-0 z-40 min-h-screen bg-[#0f172a] shadow-xl transition-transform duration-300 ease-in-out border-r border-slate-800 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: isCollapsed ? '80px' : '260px' }}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 justify-between border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
              <Factory size={20} className="text-white" />
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                <p className="text-white font-bold text-[15px] tracking-tight leading-tight">SBKT ERP</p>
                <p className="text-indigo-200 text-[11px] font-medium tracking-wider uppercase">Textile Mfg</p>
              </motion.div>
            )}
          </div>
          
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* User Profile Mini */}
        {!isCollapsed && (
          <div className="p-4 shrink-0">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate font-medium">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4">
          <nav className="space-y-6 px-3">
            {navGroups.map((group, idx) => {
              const visibleItems = group.items.filter(item => hasRole(...item.roles));
              if (!visibleItems.length) return null;
              
              return (
                <div key={group.title}>
                  {!isCollapsed && (
                    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {group.title}
                    </p>
                  )}
                  {isCollapsed && idx !== 0 && <div className="h-px bg-slate-800/60 my-4 mx-4" />}
                  
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => window.innerWidth < 1024 && onClose()}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                            isActive 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                          } ${isCollapsed ? 'justify-center' : ''}`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
                          
                          {!isCollapsed && (
                            <span className="text-sm font-medium whitespace-nowrap flex-1">
                              {item.label}
                            </span>
                          )}

                          {/* Active Indicator for collapsed mode */}
                          {isCollapsed && isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800/60 shrink-0 space-y-2">
          {/* Collapse Toggle (Desktop only) */}
          <button 
            onClick={toggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
