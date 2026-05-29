import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Building2, Globe, Calendar, Edit2, Plus, CheckCircle, Clock, MessageCircle, DollarSign, User, Tag, Trash2, Play, Headphones } from 'lucide-react';
import Card from '../components/shared/Card';
import StatusBadge from '../components/shared/StatusBadge';
import { Input, Select, PrimaryButton, SecondaryButton, GhostButton, IconButton } from '../components/shared/FormElements';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import CallPanel from '../components/shared/CallPanel';

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

  const lead = leads.find(l => l.id === Number(id));

  const [status, setStatus] = useState(lead?.status || 'New');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`crm_notes_${id}`)) || []; } catch { return []; }
  });
  const [fuDate, setFuDate] = useState(lead?.followUpDate || '');
  const [fuTime, setFuTime] = useState('10:00');
  const [fuAssign, setFuAssign] = useState('');
  const [scheduled, setScheduled] = useState(false);
  const [callingLead, setCallingLead] = useState(null);
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const data = await api.get(`/recordings/${id}`);
        setRecordings(data);
      } catch (err) {
        console.error('Failed to fetch recordings:', err);
      }
    };
    if (id) {
      fetchRecordings();
    }
  }, [id]);

  const getAudioUrl = (urlPath) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5009/api';
    const host = baseUrl.replace('/api', '');
    return `${host}${urlPath}`;
  };

  const formatDuration = (s) => {
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  if (!lead) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
        <User size={28} className="text-gray-400" />
      </div>
      <p className="text-gray-500 font-medium">Lead not found</p>
      <SecondaryButton onClick={() => navigate('/leads')}><ArrowLeft size={14} /> Back to Leads</SecondaryButton>
    </div>
  );

  const handleStatusChange = (s) => {
    setStatus(s);
    updateLead(lead.id, { ...lead, status: s }, currentUser?.name);
  };

  const addNote = () => {
    if (!note.trim()) return;
    const updated = [{ text: note, time: new Date().toLocaleString() }, ...notes];
    setNotes(updated);
    localStorage.setItem(`crm_notes_${id}`, JSON.stringify(updated));
    setNote('');
  };

  const deleteNote = (i) => {
    const updated = notes.filter((_, idx) => idx !== i);
    setNotes(updated);
    localStorage.setItem(`crm_notes_${id}`, JSON.stringify(updated));
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

  const timeline = [
    { id: 1, text: `Status changed to "${status}"`, user: 'You', time: 'Just now', icon: Tag, color: 'bg-blue-600' },
    { id: 2, text: `Assigned to ${lead.assignedTo || 'Unassigned'}`, user: 'Admin', time: lead.createdAt, icon: User, color: 'bg-purple-500' },
    { id: 3, text: `Lead created via ${lead.source}`, user: 'System', time: lead.createdAt, icon: Globe, color: 'bg-gray-400' },
  ];

  const cfg = statusConfig[status] || statusConfig.New;

  return (
    <div className="space-y-5">

      {/* ── Hero Header ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* color bar */}
        <div className={`h-1.5 w-full ${cfg.color}`} />
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <GhostButton onClick={() => navigate('/leads')} className="!px-2 self-start sm:self-auto">
            <ArrowLeft size={18} />
          </GhostButton>

          {/* Avatar + name */}
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

          {/* Quick stats */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center hidden sm:block">
              <p className="text-xs text-gray-400 font-medium">Deal Value</p>
              <p className="text-lg font-bold text-gray-800">₹{lead.value || '—'}</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-xs text-gray-400 font-medium">Source</p>
              <p className="text-sm font-semibold text-gray-700">{lead.source || '—'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCallingLead(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-xl text-sm font-semibold transition-all">
                <Phone size={15} /> Call
              </button>
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
                { icon: Phone,     label: 'Phone',     value: lead.phone, onClick: () => setCallingLead(lead) },
                { icon: Mail,      label: 'Email',     value: lead.email },
                ...(lead.leadType !== 'Student Training' ? [
                  { icon: Building2, label: 'Company',   value: lead.company },
                  { icon: DollarSign,label: 'Deal Value',value: lead.value ? `₹${lead.value}` : '—' },
                ] : []),
                { icon: Globe,     label: 'Source',    value: lead.source },
                { icon: User,      label: 'Assigned',  value: lead.assignedTo || 'Unassigned' },
                { icon: Calendar,  label: 'Follow-up', value: lead.followUpDate || '—' },
              ].map(({ icon: Icon, label, value, onClick }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400">{label}</p>
                    {onClick ? (
                      <button onClick={onClick} className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium text-left truncate block w-full">
                        {value}
                      </button>
                    ) : (
                      <p className="text-sm text-gray-800 font-medium truncate">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dynamic Lead Type Details */}
          {lead.leadType === 'Student Training' ? (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Training Information</h3>
              <div className="space-y-3">
                {[
                  { label: 'Course', value: lead.course || '—' },
                  { label: 'Branch', value: lead.branch || '—' },
                  { label: 'College', value: lead.college || '—' },
                  { label: 'Year', value: lead.year || '—' },
                  { label: 'Mode', value: lead.trainingType || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-b-0">
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                    <span className="text-sm text-gray-800 font-semibold truncate max-w-[140px] text-right">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Project Requirements</h3>
              <div className="space-y-3">
                {[
                  { label: 'Project Type', value: lead.projectType || '—' },
                  { label: 'Tech Stack', value: lead.techStack || '—' },
                  { label: 'Timeline', value: lead.timeline || '—' },
                  { label: 'Deal Value', value: lead.value ? `₹${lead.value}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-b-0">
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                    <span className="text-sm text-gray-800 font-semibold truncate max-w-[140px] text-right">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

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

        {/* ── RIGHT COLUMN (2 cols) ── */}
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

          {/* Call History & Recordings */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Headphones size={16} className="text-blue-500" /> Call History & Recordings
              </h3>
              <span className="text-xs text-gray-400">{recordings.length} Call{recordings.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {recordings.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Phone size={24} className="mx-auto mb-2 opacity-40 animate-pulse text-gray-300" />
                  <p className="text-sm">No call recordings yet. Start a call to record.</p>
                </div>
              )}
              {recordings.map((rec) => (
                <div key={rec._id || rec.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        <Phone size={12} className="text-green-500" /> Outbound Call
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {formatDuration(rec.duration)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Called by <strong className="text-gray-700 font-semibold">{rec.calledBy?.name || 'User'}</strong> on {new Date(rec.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Sleek Native audio player wrapper */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <audio
                      src={getAudioUrl(rec.url)}
                      controls
                      className="h-8 w-full sm:w-48 outline-none"
                    />
                  </div>
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
                {timeline.map((item) => (
                  <div key={item.id} className="flex gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${item.color}`}>
                      <item.icon size={13} className="text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium text-gray-800">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.user} · {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Lead Meta Info */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Lead Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Lead ID', value: `#${lead.id}` },
                { label: 'Created On', value: lead.createdAt },
                { label: 'Source', value: lead.source || '—' },
                { label: 'Assigned To', value: lead.assignedTo || 'Unassigned' },
                { label: 'Deal Value', value: lead.value ? `₹${lead.value}` : '—' },
                { label: 'Current Status', value: status },
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

      {callingLead && (
        <CallPanel
          lead={callingLead}
          onClose={() => setCallingLead(null)}
          onRecordingSaved={(newRec) => {
            setRecordings(prev => [newRec, ...prev]);
          }}
        />
      )}
    </div>
  );
}
