import { useState } from 'react';
import { Building2, Bell, Shield, Save } from 'lucide-react';
import Card from '../components/shared/Card';
import { Input, Textarea, Select, PrimaryButton, SecondaryButton } from '../components/shared/FormElements';

const tabs = [
  { id: 'company', label: 'Company Profile', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'permissions', label: 'Role Permissions', icon: Shield },
];

const roles = ['Super Admin', 'Admin / Sales Manager', 'Sales Executive'];
const permissions = [
  'View Dashboard', 'Manage Leads', 'Assign Leads', 'Delete Leads',
  'View Reports', 'Manage Team', 'Export Data', 'Manage Settings',
];

const defaultPerms = {
  'Super Admin': new Set(permissions),
  'Admin / Sales Manager': new Set(['View Dashboard', 'Manage Leads', 'Assign Leads', 'View Reports', 'Manage Team', 'Export Data']),
  'Sales Executive': new Set(['View Dashboard', 'Manage Leads']),
};

export default function Settings() {
  const [tab, setTab] = useState('company');
  const [perms, setPerms] = useState(defaultPerms);
  const [notifs, setNotifs] = useState({
    newLead: true, assignment: true, followup: true, conversion: false, weeklyReport: true,
  });

  const togglePerm = (role, perm) => {
    setPerms(p => {
      const next = new Set(p[role]);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return { ...p, [role]: next };
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Company Profile */}
      {tab === 'company' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-5">Company Profile</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">LF</div>
              <div>
                <p className="text-sm font-medium text-gray-700">Company Logo</p>
                <button className="text-xs text-blue-500 hover:text-blue-600 mt-0.5">Upload new logo</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Company Name" placeholder="Enter company name" />
              <Input label="Website" placeholder="Enter website URL" />
              <Input label="Email" type="email" placeholder="Enter company email" />
              <Input label="Phone" placeholder="Enter phone number" />
            </div>
            <Textarea label="Address" placeholder="Enter full company address" rows={3} />
            <Select label="Timezone">
              <option>Asia/Kolkata (IST)</option>
              <option>America/New_York (EST)</option>
              <option>Europe/London (GMT)</option>
            </Select>
            <div className="flex justify-end">
              <PrimaryButton className="flex items-center gap-1.5"><Save size={14} /> Save Changes</PrimaryButton>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="font-semibold text-gray-800 mb-5">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'newLead', label: 'New Lead Created', desc: 'Get notified when a new lead is added' },
              { key: 'assignment', label: 'Lead Assignment', desc: 'Notify when a lead is assigned to you' },
              { key: 'followup', label: 'Follow-up Reminders', desc: 'Reminders before scheduled follow-ups' },
              { key: 'conversion', label: 'Lead Conversion', desc: 'Notify when a lead is marked as Won' },
              { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive weekly performance summary' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${notifs[key] ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
            <div className="flex justify-end">
              <PrimaryButton className="flex items-center gap-1.5"><Save size={14} /> Save Preferences</PrimaryButton>
            </div>
          </div>
        </Card>
      )}

      {/* Role Permissions */}
      {tab === 'permissions' && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-5">Role Permissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Permission</th>
                  {roles.map(r => (
                    <th key={r} className="text-center px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permissions.map(perm => (
                  <tr key={perm} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-gray-700">{perm}</td>
                    {roles.map(role => (
                      <td key={role} className="px-3 py-3 text-center">
                        <input type="checkbox" checked={perms[role].has(perm)} onChange={() => togglePerm(role, perm)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-200 cursor-pointer" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <PrimaryButton className="flex items-center gap-1.5"><Save size={14} /> Save Permissions</PrimaryButton>
          </div>
        </Card>
      )}
    </div>
  );
}
