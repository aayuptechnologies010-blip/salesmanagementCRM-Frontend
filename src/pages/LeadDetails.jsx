import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Building2, Globe, Calendar, Edit2, Plus, CheckCircle, Clock, MessageCircle, DollarSign, User, Tag, Trash2 } from 'lucide-react';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import { Input, Select, PrimaryButton, SecondaryButton, GhostButton, IconButton } from '../components/shared/FormElements';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import CallPanel from '../components/shared/CallPanel';
import { api } from '../utils/api';

const statusOptions = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const statusConfig = {
  New:         { color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700 border-blue-200' },
  Contacted:   { color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200' },
  Qualified:   { color: 'bg-orange-500', light: 'bg-orange-50 text-orange-700 border-orange-200' },
  Proposal:    { color: 'bg-pink-500',   light: 'bg-pink-50 text-pink-700 border-pink-200' },
  Negotiation: { color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  Won:         { color: 'bg-green-500',  light: 'bg-green-50 text-green-700 border-green-200' },
  Lost:        { color: 'bg-gray-400',   light: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, addFollowUp } = useData();
  const { teamMembers, currentUser } = useAuth();

  // id from URL can be _id (mongo string) or numeric id
  const lead = leads.find(l => String(l._id || l.id) === String(id) || String(l.id) === String(id));

  const [status, setStatus]       = useState(lead?.status || 'New');
  const [note, setNote]           = useState('');
  const [notes, setNotes]         = useState(lead?.notes || []);
  const [fuDate, setFuDate]       = useState(lead?.followUpDate || '');
  const [fuTime, setFuTime]       = useState('10:00');
  const [fuAssign, setFuAssign]   = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [callOpen, setCallOpen]   = useState(false);
  const [leadActivities, setLeadActivities] = useState([]);

  useEffect(() => {
    api.get(`/activities?lead=${encodeURIComponent(lead?.name || '')}&limit=20`)
      .then(data => setLeadActivities(data || []))
      .catch(() => {});
  }, [lead?.name]);

  if (!lead) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
        <User size={28} className="text-gray-400" />
      </div>
      <p className="text-gray-500 font-medium">Lead not found</p>
      <SecondaryButton onClick={() => navigate('/leads')}><ArrowLeft size={14} /> Back to Leads</SecondaryButton>
    </div>
  );

  const handleStatusChange = async (s) => {
    setStatus(s);
    await updateLead(lead._id || lead.id, { status: s }, currentUser?.name);
    const data = await api.get(`/activities?lead=${encodeURIComponent(lead.name)}&limit=20`);
    setLeadActivities(data || []);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      const updatedNotes = await api.patch(`/leads/${lead._id || lead.id}/notes`, { text: note });
      setNotes(updatedNotes);
      setNote('');
      // Refresh activities
      const data = await api.get(`/activities?lead=${encodeURIComponent(lead.name)}&limit=20`);
      setLeadActivities(data || []);
    } catch (err) {
      alert(err.message || 'Failed to save note');
    }
  };

  const deleteNote = async (i) => {
    const updated = notes.filter((_, idx) => idx !== i);
    setNotes(updated);
  };

  const handleSchedule = () => {
    if (!fuDate) return;
    addFollowUp({
      lead: lead.name, company: lead.company, date: fuDate, time: fuTime,
      assignedTo: fuAssign || lead.assignedTo || '', priority: 'Medium', status: 'Pending',
    }, currentUser?.name);
    updateLead(lead.id, { ...lead, followUpDate: fuDate }, currentUser?.name);
    setScheduled(true);
    setTimeout(() => setScheduled(false), 2500);
  };

  const typeIcon = { edit: Tag, followup: Clock, add: Plus, assign: User };
  const typeColor = { edit: 'bg-blue-500', followup: 'bg-orange-400', add: 'bg-green-500', assign: 'bg-purple-500' };

  const cfg = statusConfig[status] || statusConfig.New;

  return (
    <div className="space-y-5">

      {/* ── Hero Header ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className={`h-1.5 w-full ${cfg.color}`} />
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <GhostButton onClick={() => navigate('/leads')} className="!px-2 self-start sm:self-auto">
            <ArrowLeft size={18} />
          </GhostButton>

          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${cfg.color}`}>
              {lead.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.light}`}>{status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{lead.company} · Added {lead.createdAt}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center hidden sm:block">
              <p className="text-xs text-gray-400 font-medium">Deal Value</p>
              <p className="text-lg font-bold text-gray-800">₹{lead.value || '—'}</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-xs text-gray-400 font-medium">Source</p>
              <p className="text-sm font-semibold text-gray-700">{lead.source || '—'}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {lead.phone && (
                <button onClick={() => setCallOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-semibold transition-all">
                  <Phone size={15} /> Call
                </button>
              )}
              <a href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}?text=Hi ${lead.name.split(' ')[0]},`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl text-sm font-semibold transition-all">
                <MessageCircle size={15} /> WhatsApp
              </a>
              <a href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-xl text-sm font-semibold transition-all">
                <Mail size={15} /> Email
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

          {/* Contact Info */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Contact Details</h3>
            <div className="space-y-3">
              {[
                { icon: Phone,      label: 'Phone',          value: lead.phone,                       clickable: !!lead.phone },
                { icon: Mail,       label: 'Email',          value: lead.email },
                { icon: Building2,  label: 'Company',        value: lead.company },
                { icon: User,       label: 'Contact Person', value: lead.contactPerson || null },
                { icon: DollarSign, label: 'Deal Value',     value: lead.value ? `₹${lead.value}` : '—' },
                { icon: Globe,      label: 'Source',         value: lead.source },
                { icon: User,       label: 'Assigned',       value: lead.assignedTo || 'Unassigned' },
                { icon: Calendar,   label: 'Follow-up',      value: lead.followUpDate || '—' },
              ].filter(item => item.value !== null && item.value !== undefined).map(({ icon: Icon, label, value, clickable }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">{label}</p>
                    {clickable ? (
                      <button onClick={() => setCallOpen(true)}
                        className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium text-left truncate block w-full">
                        {value}
                      </button>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Client-specific fields — show only if any are filled */}
            {(lead.pinCode || lead.typeOfCare || lead.hospitalZone || lead.tpaName) && (
              <>
                <div className="border-t border-gray-100 mt-4 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Client Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Pin Code',      value: lead.pinCode },
                      { label: 'Type of Care',  value: lead.typeOfCare },
                      { label: 'Hospital Zone', value: lead.hospitalZone },
                      { label: 'TPA Name',      value: lead.tpaName },
                    ].filter(i => i.value).map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Update Status */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(s => {
                const c = statusConfig[s];
                return (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all
                      ${status === s ? `${c.color} text-white border-transparent shadow-sm` : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Schedule Follow-up */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Schedule Follow-up</h3>
            <div className="space-y-3">
              <Input label="Date" type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} />
              <Input label="Time" type="time" value={fuTime} onChange={e => setFuTime(e.target.value)} />
              <Select label="Assign To" value={fuAssign} onChange={e => setFuAssign(e.target.value)}>
                <option value="">Select member</option>
                {teamMembers.map(m => <option key={m.id}>{m.name}</option>)}
              </Select>
              <PrimaryButton onClick={handleSchedule} className="w-full justify-center">
                {scheduled ? <><CheckCircle size={14} /> Scheduled!</> : <><Clock size={14} /> Schedule Follow-up</>}
              </PrimaryButton>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Notes */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</h3>
              <span className="text-xs text-gray-400">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder="Write a note and press Enter or click Add..."
                onKeyDown={e => e.key === 'Enter' && addNote()}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none bg-gray-50 focus:bg-white transition-all" />
              <PrimaryButton onClick={addNote}><Plus size={14} /> Add</PrimaryButton>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notes.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Edit2 size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No notes yet. Add your first note above.</p>
                </div>
              )}
              {notes.map((n, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{n.text || n}</p>
                    {n.time && <p className="text-xs text-gray-400 mt-1">{n.time}</p>}
                  </div>
                  <IconButton onClick={() => deleteNote(i)} variant="red" title="Delete note"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Trash2 size={13} />
                  </IconButton>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Activity Timeline</h3>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-100" />
              <div className="space-y-5">
                {leadActivities.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4 ml-4">No activity yet</p>
                )}
                {leadActivities.map((item) => {
                  const Icon  = typeIcon[item.type]  || Tag;
                  const color = typeColor[item.type] || 'bg-gray-400';
                  return (
                    <div key={item._id || item.id} className="flex gap-4 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${color}`}>
                        <Icon size={13} className="text-white" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-gray-800">{item.action}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.user} · {item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Lead Meta Info */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Lead Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Lead ID',       value: `#${lead.id}` },
                { label: 'Created On',    value: lead.createdAt },
                { label: 'Source',        value: lead.source || '—' },
                { label: 'Assigned To',   value: lead.assignedTo || 'Unassigned' },
                { label: 'Deal Value',    value: lead.value ? `₹${lead.value}` : '—' },
                { label: 'Status',        value: status },
                ...(lead.pinCode      ? [{ label: 'Pin Code',      value: lead.pinCode }] : []),
                ...(lead.typeOfCare   ? [{ label: 'Type of Care',  value: lead.typeOfCare }] : []),
                ...(lead.hospitalZone ? [{ label: 'Hospital Zone', value: lead.hospitalZone }] : []),
                ...(lead.tpaName      ? [{ label: 'TPA Name',      value: lead.tpaName }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {callOpen && <CallPanel lead={lead} onClose={() => setCallOpen(false)} />}
    </div>
  );
}
