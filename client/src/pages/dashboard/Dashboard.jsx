import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  ShoppingCart, Package, Users, DollarSign, AlertTriangle,
  TrendingUp, Truck, UserCheck, UserX, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, change }) => (
  <motion.div variants={itemVariants} className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-[13px] font-semibold tracking-wide uppercase mb-1">{title}</p>
        <p className="text-[28px] font-bold text-slate-900 tracking-tight leading-none mb-2">{value}</p>
        
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-[12px] font-bold px-1.5 py-0.5 rounded-md ${
              change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(change)}%
            </span>
          )}
          {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

const formatCurrency = (v) => {
  if (!v) return '₹0';
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
};

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label, isCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg">
        <p className="text-slate-500 text-[12px] font-bold uppercase tracking-wider mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-slate-900 text-[14px] font-semibold">
            {entry.name}: <span className="text-indigo-600">{isCurrency ? formatCurrency(entry.value) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats().then(r => r.data.data),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium tracking-wide">Syncing ERP Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
        <AlertTriangle size={20} />
        <p className="font-medium">Failed to load dashboard data. Please refresh the page.</p>
      </motion.div>
    );
  }

  const stats = data || {};
  const purchases = stats.purchases || {};
  const hr = stats.hr || {};
  const inventory = stats.inventory || {};
  const salary = stats.salary || {};
  const charts = stats.charts || {};

  const monthlyPurchases = (charts.monthlyPurchases || []).map(d => ({
    month: d.month ? format(new Date(d.month), 'MMM') : '',
    total: parseFloat(d.total) || 0,
    count: parseInt(d.count) || 0,
  }));

  const attendancePie = [
    { name: 'Present', value: hr.present || 0 },
    { name: 'Absent', value: hr.absent || 0 },
    { name: 'Half Day', value: hr.halfDay || 0 },
    { name: 'Leave', value: hr.leave || 0 },
  ].filter(d => d.value > 0);

  const inventoryByCategory = {};
  (inventory.items || []).forEach(item => {
    if (!inventoryByCategory[item.category]) {
      inventoryByCategory[item.category] = 0;
    }
    inventoryByCategory[item.category] += item.currentStock;
  });
  const inventoryChartData = Object.entries(inventoryByCategory).map(([name, value]) => ({ name, value }));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-10"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="page-header mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {format(new Date(), "EEEE, dd MMMM yyyy")} <span className="mx-2 text-slate-300">|</span> Shree Brahmnikrupa Textile
          </p>
        </div>
      </motion.div>

      {/* Alerts */}
      {inventory.lowStockCount > 0 && (
        <motion.div variants={itemVariants} className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-700">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <p className="font-medium text-sm">
              <strong className="font-bold">{inventory.lowStockCount} material{inventory.lowStockCount > 1 ? 's' : ''}</strong> running low on stock
            </p>
          </div>
          <a href="/inventory" className="text-[13px] font-bold text-amber-700 hover:text-amber-800 bg-amber-100/50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors">
            View Inventory
          </a>
        </motion.div>
      )}

      {/* Grid: Purchase Stats */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Purchase & Suppliers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Purchases" value={purchases.total || 0} subtitle={formatCurrency(purchases.totalAmount)} icon={ShoppingCart} colorClass="bg-indigo-50 text-indigo-600" />
          <StatCard title="Today Purchases" value={purchases.todayCount || 0} subtitle={formatCurrency(purchases.todayAmount)} icon={TrendingUp} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard title="Pending Bills" value={purchases.pendingBills || 0} subtitle="Missing uploads" icon={AlertTriangle} colorClass="bg-amber-50 text-amber-600" />
          <StatCard title="Total Suppliers" value={purchases.totalSuppliers || 0} subtitle="Active network" icon={Truck} colorClass="bg-cyan-50 text-cyan-600" />
        </div>
      </motion.div>

      {/* Grid: HR & Payroll Stats */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">HR & Payroll</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Employees" value={hr.totalEmployees || 0} subtitle="Active workforce" icon={Users} colorClass="bg-blue-50 text-blue-600" />
          <StatCard title="Present Today" value={hr.present || 0} subtitle={`of ${hr.totalEmployees || 0}`} icon={UserCheck} colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard title="Absent Today" value={hr.absent || 0} subtitle="Absent & Leave" icon={UserX} colorClass="bg-rose-50 text-rose-600" />
          <StatCard title="Monthly Salary" value={formatCurrency(salary.monthlyExpense || 0)} subtitle={`${salary.pendingSalaries || 0} pending`} icon={DollarSign} colorClass="bg-purple-50 text-purple-600" />
        </div>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Purchase Chart */}
        <div className="card p-6">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 text-[16px]">Monthly Purchases</h3>
            <p className="text-slate-500 text-[13px] mt-1">Last 6 months expenditure trend</p>
          </div>
          <div className="h-[260px] w-full">
            {monthlyPurchases.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPurchases} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip isCurrency />} />
                  <Area type="monotone" dataKey="total" name="Amount" stroke="#4f46e5" strokeWidth={3} fill="url(#colorTotal)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium bg-slate-50 rounded-xl">No purchase data yet</div>
            )}
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="card p-6">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 text-[16px]">Today's Attendance</h3>
            <p className="text-slate-500 text-[13px] mt-1">Employee presence distribution</p>
          </div>
          <div className="h-[260px] w-full">
            {attendancePie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendancePie}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {attendancePie.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '13px', color: '#475569', fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium bg-slate-50 rounded-xl">No attendance marked today</div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Inventory Bar Chart */}
      {inventoryChartData.length > 0 && (
        <motion.div variants={itemVariants} className="card p-6">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 text-[16px]">Inventory Stock Levels</h3>
            <p className="text-slate-500 text-[13px] mt-1">Current stock quantity by material category</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Stock" radius={[6, 6, 0, 0]}>
                  {inventoryChartData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
};

export default Dashboard;
