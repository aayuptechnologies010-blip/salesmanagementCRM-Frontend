import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, UserPlus, UserCheck, Target, ArrowUpRight, Clock } from 'lucide-react';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const COLORS = ['#E5E7EB', '#DBEAFE', '#3B82F6', '#93C5FD', '#60A5FA', '#1D4ED8'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const isSalesExec = currentUser?.role === 'Sales Executive';

  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    api.get('/dashboard').then(data => {
      setStats(data);
    }).catch(() => {});

    // Revenue: last 6 months from Won leads
    api.get('/leads?status=Won&limit=1000').then(data => {
      const allLeads = data.leads || [];
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleString('default', { month: 'short' });
        const y = d.getFullYear();
        const m = d.getMonth();
        const revenue = allLeads
          .filter(l => {
            if (!l.createdAt) return false;
            const ld = new Date(l.createdAt);
            return ld.getFullYear() === y && ld.getMonth() === m;
          })
          .reduce((sum, l) => sum + (parseFloat(String(l.value).replace(/,/g, '')) || 0), 0);
        months.push({ month: label, revenue });
      }
      setRevenueData(months);
    }).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading dashboard...
      </div>
    );
  }

  const { kpis, leadsByStatus, todayFollowUps, recentActivities, teamPerformance } = stats;

  const leadStatusChart = (leadsByStatus || []).map(s => ({ name: s._id, value: s.count }));

  const kpiCards = [
    { label: 'Total Leads', value: kpis?.totalLeads ?? 0, icon: Users, color: 'bg-blue-50 text-blue-500' },
    { label: 'New Today', value: kpis?.newToday ?? 0, icon: UserPlus, color: 'bg-gray-100 text-gray-500' },
    ...(!isSalesExec ? [{ label: 'Assigned', value: kpis?.assigned ?? 0, icon: UserCheck, color: 'bg-blue-50 text-blue-500' }] : []),
    { label: 'Converted', value: kpis?.converted ?? 0, icon: Target, color: 'bg-blue-100 text-blue-600' },
    { label: 'Conversion Rate', value: kpis?.totalLeads > 0 ? `${Math.round((kpis.converted / kpis.totalLeads) * 100)}%` : '0%', icon: TrendingUp, color: 'bg-blue-50 text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <span className="flex items-center gap-0.5 text-xs text-blue-500 font-medium">
                <ArrowUpRight size={12} />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly revenue trend (Won leads)</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-medium">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800">Lead Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution by status</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={leadStatusChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {leadStatusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {leadStatusChart.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {!isSalesExec && (
          <Card className="lg:col-span-2 p-5">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800">Team Performance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Leads vs Conversions</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={teamPerformance || []} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="leads" fill="#DBEAFE" radius={[6, 6, 0, 0]} name="Leads" />
                <Bar dataKey="converted" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Converted" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Today's Follow-ups</h3>
            <Clock size={16} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {(todayFollowUps || []).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No follow-ups today</p>
            )}
            {(todayFollowUps || []).map(f => (
              <div key={f._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={14} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.lead}</p>
                  <p className="text-xs text-gray-400">{f.time} · {f.assignedTo}</p>
                </div>
                <StatusBadge status={f.priority} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Activities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Action', 'Lead', 'Time'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(recentActivities || []).slice(0, 8).map(a => (
                <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                        {(a.user || '?').split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-gray-700 font-medium">{a.user}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{a.action}</td>
                  <td className="px-3 py-3 text-blue-600 font-medium">{a.lead}</td>
                  <td className="px-3 py-3 text-gray-400 text-xs">{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
