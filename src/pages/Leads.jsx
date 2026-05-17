import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Upload, Plus, Trash2, UserCheck } from 'lucide-react';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { Input, Select, PrimaryButton, SecondaryButton } from '../components/shared/FormElements';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', company: '', phone: '', email: '', source: '', status: 'New', assignedTo: '', followUpDate: '' };

export default function Leads() {
  const navigate = useNavigate();
  const { leads, addLead, updateLead, deleteLead, assignLead } = useData();
  const { teamMembers } = useAuth();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [assignTo, setAssignTo] = useState('');

  const filtered = leads.filter(l =>
    (l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus ? l.status === filterStatus : true)
  );

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal('form'); };
  const openEdit = (lead) => { setForm({ ...lead }); setEditId(lead.id); setModal('form'); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editId) updateLead(editId, form);
    else addLead(form);
    setModal(null);
  };

  const handleDelete = () => {
    deleteLead(selected);
    setSelected([]);
    setModal(null);
  };

  const handleAssign = () => {
    if (!assignTo) return;
    assignLead(selected, assignTo);
    setSelected([]);
    setAssignTo('');
    setModal(null);
  };

  const columns = [
    {
      key: 'name', label: 'Name', sortable: true, render: (v, row) => (
        <button onClick={() => navigate(`/leads/${row.id}`)}
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-left">{v}</button>
      )
    },
    { key: 'company', label: 'Company', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', render: v => <span className="text-gray-500">{v}</span> },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'assignedTo', label: 'Assigned To', render: v => v || <span className="text-gray-400 italic text-xs">Unassigned</span> },
    { key: 'followUpDate', label: 'Follow-up', sortable: true },
    {
      key: 'id', label: '', render: (_, row) => (
        <button onClick={() => openEdit(row)} className="text-xs text-blue-500 hover:text-blue-600 font-medium">Edit</button>
      )
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
            <option value="">All Status</option>
            {['New', 'Interested', 'Won', 'Lost'].map(s => <option key={s}>{s}</option>)}
          </select>
          {selected.length > 0 && (
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setModal('assign')} className="flex items-center gap-1.5">
                <UserCheck size={14} /> Assign ({selected.length})
              </SecondaryButton>
              <button onClick={() => setModal('delete')}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <SecondaryButton className="flex items-center gap-1.5">
            <Upload size={14} /> Import
          </SecondaryButton>
          <PrimaryButton onClick={openAdd} className="flex items-center gap-1.5">
            <Plus size={14} /> Add Lead
          </PrimaryButton>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{filtered.length} Leads</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter size={12} /> Filtered
          </div>
        </div>
        <DataTable columns={columns} data={filtered} selectable onSelectionChange={setSelected} />
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Lead' : 'Add New Lead'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
          <Input label="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Enter company name" />
          <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone number" />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter email address" />
          <Select label="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
            <option value="">Select source</option>
            {['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign'].map(s => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['New', 'Interested', 'Won', 'Lost'].map(s => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Assign To" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Select member</option>
            {teamMembers.map(m => <option key={m.id}>{m.name}</option>)}
          </Select>
          <Input label="Follow-up Date" type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave}>{editId ? 'Save Changes' : 'Add Lead'}</PrimaryButton>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Leads" size="sm">
        <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{selected.length}</strong> selected lead(s)? This cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton>
          <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">Delete</button>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={modal === 'assign'} onClose={() => setModal(null)} title="Assign Leads" size="sm">
        <p className="text-sm text-gray-500 mb-4">Assign <strong>{selected.length}</strong> selected lead(s) to:</p>
        <Select label="Sales Executive" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
          <option value="">Select member</option>
          {teamMembers.map(m => <option key={m.id}>{m.name}</option>)}
        </Select>
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleAssign}>Assign</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
