import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, KeyRound, Search, Mail, MessageCircle, X } from 'lucide-react';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { Input, Select, PrimaryButton, SecondaryButton, IconButton } from '../components/shared/FormElements';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const emptyForm = { name: '', email: '', password: '', role: 'Sales Executive', team: '', status: 'Active' };

export default function Team() {
  const navigate = useNavigate();
  const { teamMembers, allUsers, addUser, updateUser, deleteUser } = useAuth();
  const { leads } = useData();

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [selectedMember, setSelectedMember] = useState(null); // for member leads modal
  const [leadSearch, setLeadSearch] = useState('');

  const members = allUsers.filter(u => u.role !== 'Super Admin');
  const filteredMembers = members.filter(m =>
    ((m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())) &&
    (filterRole ? m.role === filterRole : true) &&
    (filterTeam ? m.team === filterTeam : true)
  );

  // Leads count excluding 'New' status
  const getActiveLeadsCount = (member) => member.leadsCount ?? leads.filter(l => l.assignedTo === member.name && l.status !== 'New').length;
  const getConvertedCount = (member) => member.convertedCount ?? leads.filter(l => l.assignedTo === member.name && l.status === 'Won').length;

  // Member leads for modal — all statuses, from DataContext
  const getMemberLeads = (memberName) => leads.filter(l => l.assignedTo === memberName);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setFormError(''); setModal('form'); };
  const openEdit = (m) => { setForm({ ...m, password: '' }); setEditId(m.id || m._id); setFormError(''); setModal('form'); };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { setFormError('Name and Email are required.'); return; }
    if (!editId && !form.password.trim()) { setFormError('Password is required for new members.'); return; }
    const duplicate = allUsers.find(u => u.email.toLowerCase() === form.email.toLowerCase() && (u.id !== editId && u._id !== editId));
    if (duplicate) { setFormError('This email is already registered.'); return; }
    if (editId) updateUser(editId, form);
    else addUser(form);
    setModal(null);
    setFormError('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this member?')) deleteUser(id);
  };

  const openMemberLeads = (member) => {
    setSelectedMember(member);
    setLeadSearch('');
    setModal('memberLeads');
  };

  const teams = [...new Set(members.map(m => m.team).filter(Boolean))];

  const memberLeads = selectedMember ? getMemberLeads(selectedMember.name) : [];
  const filteredMemberLeads = memberLeads.filter(l => {
    const s = leadSearch.toLowerCase();
    return !s || (l.name || '').toLowerCase().includes(s) || (l.company || '').toLowerCase().includes(s) || (l.status || '').toLowerCase().includes(s);
  });

  const columns = [
    {
      key: 'name', label: 'Name', sortable: true, render: (v, row) => (
        <button
          onClick={() => openMemberLeads(row)}
          className="flex items-center gap-2.5 hover:text-blue-600 transition-colors group"
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 group-hover:bg-blue-200">{row.avatar}</div>
          <span className="font-medium text-gray-800 group-hover:text-blue-600">{v}</span>
        </button>
      )
    },
    { key: 'email', label: 'Email', render: v => <span className="text-gray-500">{v}</span> },
    {
      key: 'role', label: 'Role', render: v => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${v === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{v}</span>
      )
    },
    { key: 'team', label: 'Team' },
    {
      key: 'leads', label: 'Leads (Active)', sortable: true,
      render: (_, row) => (
        <button onClick={() => openMemberLeads(row)} className="font-semibold text-blue-600 hover:underline">
          {getActiveLeadsCount(row)}
        </button>
      )
    },
    { key: 'converted', label: 'Converted', sortable: true, render: (_, row) => getConvertedCount(row) },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'contact', label: 'Contact', render: (_, row) => (
        <div className="flex gap-1.5">
          <a href={`mailto:${row.email}`} title={`Email ${row.name}`}
            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center border border-blue-200 transition-all">
            <Mail size={14} />
          </a>
          <a href={row.phone ? `https://wa.me/${row.phone.replace(/\D/g, '')}` : '#'}
            title={row.phone ? `WhatsApp ${row.name}` : 'No phone'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${row.phone ? 'bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}
            onClick={e => !row.phone && e.preventDefault()}>
            <MessageCircle size={14} />
          </a>
        </div>
      )
    },
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex gap-1">
          <IconButton onClick={() => openEdit(row)} variant="blue" title="Edit Member"><Edit2 size={14} /></IconButton>
          <IconButton onClick={() => handleDelete(row.id || row._id)} variant="red" title="Remove Member"><Trash2 size={14} /></IconButton>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-4">
      {teams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {teams.map(team => {
            const teamList = members.filter(m => m.team === team);
            return (
              <Card key={team} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{team}</h3>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">{teamList.length} members</span>
                </div>
                <div className="flex -space-x-2">
                  {teamList.map(m => (
                    <div key={m.id || m._id} title={m.name}
                      className="w-8 h-8 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {m.avatar}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  {teamList.reduce((s, m) => s + getActiveLeadsCount(m), 0)} active leads · {teamList.reduce((s, m) => s + getConvertedCount(m), 0)} converted
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <span className="text-sm font-semibold text-gray-700">{filteredMembers.length} Team Members</span>
          <PrimaryButton onClick={openAdd}><Plus size={14} /> Add Member</PrimaryButton>
        </div>
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 min-w-48 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none bg-white" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Sales Executive">Sales Executive</option>
            </select>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none">
              <option value="">All Teams</option>
              {teams.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <DataTable columns={columns} data={filteredMembers} />
      </Card>

      {/* Member Leads Modal */}
      <Modal isOpen={modal === 'memberLeads'} onClose={() => setModal(null)}
        title={selectedMember ? `${selectedMember.name}'s Leads` : ''} size="xl">
        {selectedMember && (
          <div className="space-y-4">
            {/* Member summary */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {selectedMember.avatar}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{selectedMember.name}</p>
                <p className="text-xs text-gray-500">{selectedMember.role} · {selectedMember.team || '—'}</p>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-blue-600">{memberLeads.length}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{memberLeads.filter(l => l.status === 'Won').length}</p>
                  <p className="text-xs text-gray-400">Won</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-500">{memberLeads.filter(l => l.status === 'Lost').length}</p>
                  <p className="text-xs text-gray-400">Lost</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                placeholder="Search by name, company or status..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none bg-white" />
            </div>

            {/* Leads table */}
            <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-100">
              {filteredMemberLeads.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No leads found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                    <tr>
                      {['Lead Name', 'Company', 'Status', 'Value', 'Follow-up', 'Notes'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredMemberLeads.map(lead => (
                      <tr key={lead._id || lead.id}
                        onClick={() => { setModal(null); navigate(`/leads/${lead._id || lead.id}`); }}
                        className="hover:bg-blue-50 cursor-pointer transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-blue-600 hover:underline">{lead.name}</p>
                          <p className="text-xs text-gray-400">{lead.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{lead.company || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{lead.value ? `₹${lead.value}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{lead.followUpDate || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {lead.notes?.length > 0
                            ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-semibold">{lead.notes.length} note{lead.notes.length > 1 ? 's' : ''}</span>
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="text-xs text-gray-400 text-center">Click any lead row to view full details</p>
          </div>
        )}
      </Modal>

      {/* Add/Edit Member Modal */}
      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Member' : 'Add Team Member'} size="md">
        <div className="space-y-4">
          <Input label="Full Name" value={form.name}
            onChange={e => { setForm({ ...form, name: e.target.value }); setFormError(''); }} placeholder="Enter full name" />
          <Input label="Email Address" type="email" value={form.email}
            onChange={e => { setForm({ ...form, email: e.target.value }); setFormError(''); }} placeholder="Enter email address" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <KeyRound size={13} className="text-gray-400" />
              {editId ? 'New Password (leave blank to keep)' : 'Login Password'}
            </label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setFormError(''); }}
                placeholder="Enter login password"
                className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all pr-16" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 hover:text-blue-600 font-semibold">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-400">Member will use this password to login.</p>
          </div>
          <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            {['Admin', 'Sales Executive'].map(r => <option key={r}>{r}</option>)}
          </Select>
          <Select label="Team" value={form.team} onChange={e => setForm({ ...form, team: e.target.value })}>
            <option value="">Select Team / Enter below</option>
            {teams.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Or enter new team name" value={teams.includes(form.team) ? '' : form.team}
            onChange={e => setForm({ ...form, team: e.target.value })} placeholder="e.g. Team Delta" />
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </Select>
          {formError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{formError}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave}>{editId ? 'Save Changes' : 'Add Member'}</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
