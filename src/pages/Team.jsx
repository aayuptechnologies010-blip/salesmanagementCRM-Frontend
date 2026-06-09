import { useState } from 'react';
import { Plus, Edit2, Trash2, KeyRound, Search, Mail, MessageCircle } from 'lucide-react';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { Input, Select, PrimaryButton, SecondaryButton, IconButton } from '../components/shared/FormElements';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'Sales Executive', team: '', status: 'Active' };

export default function Team() {
  const { teamMembers, allUsers, addUser, updateUser, deleteUser } = useAuth();

  const getStats = (member) => ({
    leads:     member.leadsCount     ?? 0,
    converted: member.convertedCount ?? 0,
  });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter states
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const members = allUsers.filter(u => u.role !== 'Super Admin');
  const filteredMembers = members.filter(m =>
    ((m.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase())) &&
    (filterRole ? m.role === filterRole : true) &&
    (filterTeam ? m.team === filterTeam : true)
  );

  const openAdd = () => { setForm(emptyForm); setEditId(null); setFormError(''); setModal('form'); };
  const openEdit = (m) => { setForm({ ...m, password: m.password || '' }); setEditId(m.id); setFormError(''); setModal('form'); };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { setFormError('Name and Email are required.'); return; }
    if (!editId && !form.password.trim()) { setFormError('Password is required for new members.'); return; }
    const duplicate = allUsers.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editId);
    if (duplicate) { setFormError('This email is already registered.'); return; }
    if (editId) updateUser(editId, form);
    else addUser(form);
    setModal(null);
    setFormError('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this member?')) deleteUser(id);
  };

  const teams = [...new Set(members.map(m => m.team).filter(Boolean))];

  const columns = [
    {
      key: 'name', label: 'Name', sortable: true, render: (v, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">{row.avatar}</div>
          <span className="font-medium text-gray-800">{v}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email', render: v => <span className="text-gray-500">{v}</span> },
    {
      key: 'role', label: 'Role', render: v => (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${v === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{v}</span>
      )
    },
    { key: 'team', label: 'Team' },
    { key: 'leads',     label: 'Leads',     sortable: true, render: (_, row) => getStats(row).leads },
    { key: 'converted', label: 'Converted', sortable: true, render: (_, row) => getStats(row).converted },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'contact', label: 'Contact', render: (_, row) => (
        <div className="flex gap-1.5">
          <a href={`mailto:${row.email}`} title={`Email ${row.name}`}
            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center border border-blue-200 transition-all">
            <Mail size={14} />
          </a>
          <a href={row.phone ? `https://wa.me/${row.phone.replace(/\D/g, '')}` : `tel:${row.phone || ''}`} 
            title={row.phone ? `WhatsApp ${row.name}` : `No phone number set`}
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
          <IconButton onClick={() => handleDelete(row.id)} variant="red" title="Remove Member"><Trash2 size={14} /></IconButton>
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
                    <div key={m.id} title={m.name}
                      className="w-8 h-8 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {m.avatar}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  {teamList.reduce((s, m) => s + getStats(m).leads, 0)} total leads · {teamList.reduce((s, m) => s + getStats(m).converted, 0)} converted
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <span className="text-sm font-semibold text-gray-700">{filteredMembers.length} Team Members</span>
          <PrimaryButton onClick={openAdd}>
            <Plus size={14} /> Add Member
          </PrimaryButton>
        </div>
        
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 min-w-48 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none bg-white" 
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={filterRole} 
              onChange={e => setFilterRole(e.target.value)}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Sales Executive">Sales Executive</option>
            </select>
            <select 
              value={filterTeam} 
              onChange={e => setFilterTeam(e.target.value)}
              className="flex-1 sm:flex-initial border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-200 outline-none"
            >
              <option value="">All Teams</option>
              {teams.length > 0
                ? teams.map(t => <option key={t}>{t}</option>)
                : null
              }
            </select>
          </div>
        </div>

        <DataTable columns={columns} data={filteredMembers} />
      </Card>

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
            <p className="text-xs text-gray-400">Member will use this password to login from the same login page.</p>
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
