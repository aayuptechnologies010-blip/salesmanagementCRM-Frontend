import { useState } from 'react';
import { Shuffle, UserCheck, Users } from 'lucide-react';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { Select, PrimaryButton, SecondaryButton } from '../components/shared/FormElements';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function AssignLeads() {
  const { leads, assignLead } = useData();
  const { teamMembers } = useAuth();

  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null);
  const [assignTo, setAssignTo] = useState('');

  const unassigned = leads.filter(l => !l.assignedTo);

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
        ? <span className="text-blue-600 font-medium">{v}</span>
        : <span className="text-gray-400 italic">Unassigned</span>
    },
    {
      key: 'id', label: 'Action', render: (_, row) => (
        <button onClick={() => { setSelected([row.id]); setAssignTo(''); setModal('single'); }}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg px-2.5 py-1 font-medium transition-colors">
          Assign
        </button>
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
          { label: 'Unassigned', value: unassigned.length, icon: Users, color: 'bg-blue-100 text-blue-600' },
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
          <PrimaryButton onClick={() => { setAssignTo(''); setModal('bulk'); }} className="flex items-center gap-1.5">
            <UserCheck size={14} /> Bulk Assign ({selected.length})
          </PrimaryButton>
        )}
        <SecondaryButton onClick={() => setModal('roundrobin')} className="flex items-center gap-1.5">
          <Shuffle size={14} /> Round-Robin Auto Assign
        </SecondaryButton>
      </div>

      {/* Table */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">All Leads — Assignment View</span>
        </div>
        <DataTable columns={columns} data={leads} selectable onSelectionChange={setSelected} />
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
          <PrimaryButton onClick={handleBulkAssign}>Assign</PrimaryButton>
        </div>
      </Modal>

      {/* Round Robin Modal */}
      <Modal isOpen={modal === 'roundrobin'} onClose={() => setModal(null)} title="Round-Robin Auto Assignment" size="sm">
        <div className="p-4 bg-blue-50 rounded-xl mb-4">
          <p className="text-sm text-blue-700 font-medium">Auto-assign {unassigned.length} unassigned leads</p>
          <p className="text-xs text-blue-500 mt-1">Leads will be distributed evenly across all Sales Executives.</p>
        </div>
        <div className="space-y-2">
          {teamMembers.filter(m => m.role === 'Sales Executive').map(m => (
            <div key={m.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700">{m.name}</span>
              <span className="text-xs text-blue-500 font-medium">
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
          <PrimaryButton onClick={handleRoundRobin} className="flex items-center gap-1.5">
            <Shuffle size={14} /> Auto Assign
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
