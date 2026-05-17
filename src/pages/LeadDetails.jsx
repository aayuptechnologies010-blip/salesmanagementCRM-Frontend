import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Building2, Globe, Calendar, Edit2, Plus, CheckCircle, Clock } from 'lucide-react';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import { Input, Select, PrimaryButton, SecondaryButton } from '../components/shared/FormElements';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, addFollowUp } = useData();
  const { teamMembers } = useAuth();

  const lead = leads.find(l => l.id === Number(id));

  const [status, setStatus] = useState(lead?.status || 'New');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`crm_notes_${id}`)) || []; } catch { return []; }
  });
  const [fuDate, setFuDate] = useState(lead?.followUpDate || '');
  const [fuTime, setFuTime] = useState('10:00');
  const [fuAssign, setFuAssign] = useState('');

  if (!lead) return (
    <div className="text-center py-20 text-gray-400">
      Lead not found. <button onClick={() => navigate('/leads')} className="text-blue-500 underline">Go back</button>
    </div>
  );

  const handleStatusChange = (s) => {
    setStatus(s);
    updateLead(lead.id, { ...lead, status: s });
  };

  const addNote = () => {
    if (!note.trim()) return;
    const updated = [{ text: note, time: new Date().toLocaleString() }, ...notes];
    setNotes(updated);
    localStorage.setItem(`crm_notes_${id}`, JSON.stringify(updated));
    setNote('');
  };

  const handleSchedule = () => {
    if (!fuDate) return;
    addFollowUp({
      lead: lead.name,
      company: lead.company,
      date: fuDate,
      time: fuTime,
      assignedTo: fuAssign || lead.assignedTo || '',
      priority: 'Medium',
      status: 'Pending',
    });
    updateLead(lead.id, { ...lead, followUpDate: fuDate });
    alert('Follow-up scheduled!');
  };

  const timeline = [
    { id: 1, text: `Status: ${status}`, user: 'You', time: 'Now', icon: CheckCircle },
    { id: 2, text: `Assigned to ${lead.assignedTo || 'Unassigned'}`, user: 'Admin', time: lead.createdAt, icon: Edit2 },
    { id: 3, text: `Lead created from ${lead.source}`, user: 'System', time: lead.createdAt, icon: Globe },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/leads')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-800">{lead.name}</h2>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-gray-500">{lead.company}</p>
        </div>
        <SecondaryButton onClick={() => navigate('/leads')} className="flex items-center gap-1.5">
          <Edit2 size={14} /> Back to Leads
        </SecondaryButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="space-y-3">
              {[
                { icon: Phone, label: 'Phone', value: lead.phone },
                { icon: Mail, label: 'Email', value: lead.email },
                { icon: Building2, label: 'Company', value: lead.company },
                { icon: Globe, label: 'Source', value: lead.source },
                { icon: Calendar, label: 'Follow-up', value: lead.followUpDate || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm text-gray-700 font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {['New', 'Interested', 'Won', 'Lost'].map(s => (
                <button key={s} onClick={() => handleStatusChange(s)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all
                    ${status === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Schedule Follow-up</h3>
            <div className="space-y-3">
              <Input label="Date" type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} />
              <Input label="Time" type="time" value={fuTime} onChange={e => setFuTime(e.target.value)} />
              <Select label="Assign To" value={fuAssign} onChange={e => setFuAssign(e.target.value)}>
                <option value="">Select member</option>
                {teamMembers.map(m => <option key={m.id}>{m.name}</option>)}
              </Select>
              <PrimaryButton onClick={handleSchedule} className="w-full flex items-center justify-center gap-1.5">
                <Clock size={14} /> Schedule
              </PrimaryButton>
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Notes</h3>
            <div className="flex gap-2 mb-4">
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Type your note here..."
                onKeyDown={e => e.key === 'Enter' && addNote()}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" />
              <PrimaryButton onClick={addNote} className="flex items-center gap-1">
                <Plus size={14} /> Add
              </PrimaryButton>
            </div>
            <div className="space-y-2">
              {notes.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No notes yet.</p>}
              {notes.map((n, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-700">{n.text || n}</p>
                  {n.time && <p className="text-xs text-gray-400 mt-1">{n.time}</p>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Activity Timeline</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-4">
                {timeline.map((item, i) => (
                  <div key={item.id} className="flex gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10
                      ${i === 0 ? 'bg-blue-500' : 'bg-white border-2 border-gray-200'}`}>
                      <item.icon size={14} className={i === 0 ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm text-gray-700">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.user} · {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
