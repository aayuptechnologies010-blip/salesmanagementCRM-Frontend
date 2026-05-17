import { useState } from 'react';
import { Calendar, Clock, CheckCircle, Bell, Plus, Trash2, Edit2 } from 'lucide-react';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { Input, Select, PrimaryButton, SecondaryButton, IconButton } from '../components/shared/FormElements';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const today = new Date();

function MiniCalendar({ followUps }) {
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const followUpDays = new Set(
    followUps.filter(f => {
      const d = new Date(f.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).map(f => new Date(f.date).getDate())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
        <span className="text-sm font-semibold text-gray-700">
          {current.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div key={i} className={`aspect-square flex items-center justify-center text-xs rounded-lg cursor-pointer transition-colors relative
            ${!day ? '' : day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              ? 'bg-blue-500 text-white font-bold'
              : 'hover:bg-gray-100 text-gray-700'}`}>
            {day}
            {day && followUpDays.has(day) && !(day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const emptyForm = { lead: '', company: '', date: '', time: '', assignedTo: '', priority: 'Medium', status: 'Pending' };

export default function FollowUps() {
  const { followUps, addFollowUp, updateFollowUp, deleteFollowUp } = useData();
  const { teamMembers } = useAuth();
  const [filter, setFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const filtered = followUps.filter(f => filter === 'All' || f.status === filter);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setModal('form'); };
  const openEdit = (f) => { setForm({ ...f }); setEditId(f.id); setModal('form'); };

  const handleSave = () => {
    if (!form.lead.trim()) return;
    if (editId) updateFollowUp(editId, form);
    else addFollowUp(form);
    setModal(null);
  };

  const toggleDone = (f) => {
    updateFollowUp(f.id, { ...f, status: f.status === 'Done' ? 'Pending' : 'Done' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800">Calendar</h3>
          </div>
          <MiniCalendar followUps={followUps} />
        </Card>

        {/* Follow-ups list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              {['All', 'Pending', 'Done'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all
                    ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {f}
                </button>
              ))}
            </div>
            <PrimaryButton onClick={openAdd}>
              <Plus size={14} /> Add Follow-up
            </PrimaryButton>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <Card className="p-8 text-center text-gray-400 text-sm">No follow-ups found.</Card>
            )}
            {filtered.map(f => (
              <Card key={f.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleDone(f)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                      ${f.status === 'Done' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-blue-50 hover:bg-blue-100'}`}>
                    {f.status === 'Done'
                      ? <CheckCircle size={18} className="text-gray-400" />
                      : <Bell size={18} className="text-blue-500" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-800">{f.lead}</p>
                        <p className="text-sm text-gray-500">{f.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={f.priority} />
                        <StatusBadge status={f.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {f.time}</span>
                      <span>{f.date}</span>
                      <span>Assigned: {f.assignedTo}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <IconButton onClick={() => openEdit(f)} variant="blue" title="Edit Follow-up"><Edit2 size={14} /></IconButton>
                    <IconButton onClick={() => deleteFollowUp(f.id)} variant="red" title="Delete Follow-up"><Trash2 size={14} /></IconButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Follow-up' : 'Add Follow-up'} size="md">
        <div className="space-y-4">
          <Input label="Lead Name" value={form.lead} onChange={e => setForm({ ...form, lead: e.target.value })} placeholder="Enter lead name" />
          <Input label="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Enter company name" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Time" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>
          <Select label="Assign To" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Select member</option>
            {teamMembers.map(m => <option key={m.id}>{m.name}</option>)}
          </Select>
          <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['Pending', 'Done'].map(s => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <SecondaryButton onClick={() => setModal(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSave}>{editId ? 'Save Changes' : 'Add Follow-up'}</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
