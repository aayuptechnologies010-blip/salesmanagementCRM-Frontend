import { useState } from 'react';
import { Shuffle, UserCheck, Users, Search } from 'lucide-react';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { Select, PrimaryButton, SecondaryButton, BadgeButton } from '../components/shared/FormElements';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function AssignLeads() {
  const { leads, assignLead } = useData();
  const { teamMembers, currentUser } = useAuth();

  // Only Super Admin and Admin can access this page
  const canAccess = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  if (!canAccess) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
        <UserCheck size={28} className="text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">Access Restricted</p>
      <p className="text-sm text-gray-400">Only Admins can assign leads.</p>
    </div>
  );

  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null);
  const [assignTo, setAssignTo] = useState('');

  // Filter states
  const [search, setSearch] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('All');
  const [filterSource, setFilterSource] = useState('');

  const unassigned = leads.filter(l => !l.assignedTo);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.company.toLowerCase().includes(search.toLowerCase());
    const matchesAssignment = filterAssignment === 'All' ? true 
                            : filterAssignment === 'Assigned' ? !!l.assignedTo 
                            : !l.assignedTo;
    const matchesSource = filterSource ? l.source === filterSource : true;
    return matchesSearch && matchesAssignment && matchesSource;
  });

  const handleBulkAssign = () => {
    if (!assignTo) return;
    assignLead(selected, assignTo);
    setSelected([]);
    setAssignTo('');
    setModal(null);
  };

  const handleRoundRobin = () => {
    const execs = teamMembers.filter(m => m.role === 'Sales Executive');
    if (execs.length === 0) return;
    const unassignedIds = unassigned.map(l => l.id);
    const assignments = {};
    unassignedIds.forEach((id, idx) => {
      const exec = execs[idx % execs.length].name;
      if (!assignments[exec]) assignments[exec] = [];
      assignments[exec].push(id);
    });
    Object.entries(assignments).forEach(([exec, ids]) => assignLead(ids, exec));
    setModal(null);
  };

  const columns = [
    { key: 'name', label: 'Lead Name', sortable: true },
    { key: 'company', label: 'Company' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'assignedTo', label: 'Assigned To', render: v => v
        ? <span className="text-blue-600 font-semibold">{v}</span>
        : <span className="text-gray-400 italic text-xs">Unassigned</span>
    },
    {
      key: 'id', label: 'Action', render: (_, row) => (
        <BadgeButton
          color={row.assignedTo ? 'gray' : 'blue'}
          onClick={() => { setSelected([row.id]); setAssignTo(''); setModal('single'); }}
        >
          {row.assignedTo ? 'Reassign' : 'Assign'}
        </BadgeButton>
      )
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Leads', value: leads.length, icon: Users, color: 'bg-gray-100 text-gray-500' },
          { label: 'Assigned', value: leads.filter(l => l.assignedTo).length, icon: UserCheck, color: 'bg-blue-50 text-blue-500' },
          { label: 'Unassigned', value: unassigned.length, icon: Users, color: 'bg-orange-50 text-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        {selected.length > 0 && (
          <PrimaryButton onClick={() => { setAssignTo(''); setModal('bulk'); }}>
            <UserCheck size={14} /> Bulk Assign ({selected.length})
          </PrimaryButton>
        )}
        <SecondaryButton onClick={() => setModal('roundrobin')}>
          <Shuffle size={14} /> Round-Robin Auto Assign
        </SecondaryButton>
      </div>

      {/* Table */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <span className="text-sm font-semibold text-gray-700">{filteredLeads.length} Leads — Assignment View</span>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 min-w-48 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search leads by name or company..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none bg-white" 
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={filterAssignment} 
              onChange={e => setFilterAssignment(e.target.value)}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <option value="All">All Assignment Status</option>
              <option value="Assigned">Assigned Only</option>
              <option value="Unassigned">Unassigned Only</option>
            </select>
            <select 
              value={filterSource} 
              onChange={e => setFilterSource(e.target.value)}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <option value="">All Sources</option>
              {['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Conference'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <DataTable columns={columns} data={filteredLeads} selectable onSelectionChange={setSelected} />
      </Card>

      {/* Team Workload */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Team Workload</h3>
        <div className="space-y-3">
          {teamMembers.map(m => {
            const count = leads.filter(l => l.assignedTo === m.name).length;
            const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
            return (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">{m.avatar}</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{m.name}</span>
                    <span className="text-xs text-gray-400">{count} leads</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {teamMembers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No team members added yet.</p>
          )}
        </div>
      </Card>

      {/* Single / Bulk Assign Modal */}
      <Modal isOpen={modal === 'single' || modal === 'bulk'} onClose={() => setModal(null)}
        title={modal === 'bulk' ? `Bulk Assign (${selected.length} leads)` : 'Assign Lead'} size="sm">
        <Select label="Assign To" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
          <option value="">Select sales executive</option>
          {teamMembers.map(m => <option key={m.id}>{m.name}</option>)}
        </Select>
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleBulkAssign}><UserCheck size={14} /> Assign</PrimaryButton>
        </div>
      </Modal>

      {/* Round Robin Modal */}
      <Modal isOpen={modal === 'roundrobin'} onClose={() => setModal(null)} title="Round-Robin Auto Assignment" size="sm">
        <div className="p-4 bg-blue-50 rounded-xl mb-4">
          <p className="text-sm text-blue-700 font-semibold">Auto-assign {unassigned.length} unassigned leads</p>
          <p className="text-xs text-blue-500 mt-1">Leads will be distributed evenly across all Sales Executives.</p>
        </div>
        <div className="space-y-2">
          {teamMembers.filter(m => m.role === 'Sales Executive').map(m => (
            <div key={m.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700">{m.name}</span>
              <span className="text-xs text-blue-500 font-semibold">
                ~{teamMembers.filter(x => x.role === 'Sales Executive').length > 0
                  ? Math.ceil(unassigned.length / teamMembers.filter(x => x.role === 'Sales Executive').length)
                  : 0} leads
              </span>
            </div>
          ))}
          {teamMembers.filter(m => m.role === 'Sales Executive').length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No Sales Executives found.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleRoundRobin}>
            <Shuffle size={14} /> Auto Assign
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
