import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, AlertTriangle, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { inventoryAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryAPI.getLowStock().then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000, // every 5 min
  });

  const lowStockItems = lowStockData || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="flex items-center justify-between px-4 lg:px-8 h-[72px] lg:max-w-7xl mx-auto">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="relative hidden md:flex items-center max-w-md w-full group">
            <Search size={18} className="absolute left-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-[14px] outline-none transition-all shadow-sm focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)]"
            />
            <div className="absolute right-3 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-400 shadow-sm">
              ⌘K
            </div>
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3 md:gap-5">

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <Bell size={20} />
              {lowStockItems.length > 0 && (
                <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-[calc(100%+8px)] w-[360px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="font-semibold text-[15px] text-slate-800">Notifications</span>
                    {lowStockItems.length > 0 && (
                      <span className="badge badge-danger text-[11px]">{lowStockItems.length} new</span>
                    )}
                  </div>
                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                    {lowStockItems.length === 0 ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <Bell size={20} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium text-sm">All caught up!</p>
                        <p className="text-slate-400 text-xs mt-1">No new notifications right now.</p>
                      </div>
                    ) : (
                      lowStockItems.map(item => (
                        <div
                          key={item.id}
                          className="px-5 py-4 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors group"
                          onClick={() => { navigate('/inventory'); setShowNotifications(false); }}
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-red-100 transition-colors">
                              <AlertTriangle size={16} className="text-red-600" />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-slate-800">Low Stock Alert</p>
                              <p className="text-[13px] text-slate-500 mt-1 leading-snug">
                                <span className="font-medium text-slate-700">{item.materialName.replace(/_/g, ' ')}</span> is running low. Only <span className="font-semibold text-red-600">{item.currentStock} {item.unit}</span> remaining.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {lowStockItems.length > 0 && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50">
                      <button 
                        onClick={() => { navigate('/inventory'); setShowNotifications(false); }}
                        className="w-full text-center text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 py-1.5"
                      >
                        View Inventory
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:block text-left mr-1">
                <p className="text-[13px] font-bold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="font-semibold text-[14px] text-slate-800">{user?.name}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <User size={16} className="text-slate-400" /> My Profile
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-3" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="text-red-500" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
