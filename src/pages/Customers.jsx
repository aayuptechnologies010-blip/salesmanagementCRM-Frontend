import { useState, useEffect } from 'react';
import { Briefcase, Search, Phone, Mail } from 'lucide-react';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import { api } from '../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = customers.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'company', label: 'Company', sortable: true, render: v => <span className="font-bold text-gray-800">{v}</span> },
    { key: 'name', label: 'Contact Person' },
    { key: 'phone', label: 'Phone', render: v => (
      <span className="flex items-center gap-1 text-sm text-gray-600"><Phone size={12}/>{v || '—'}</span>
    )},
    { key: 'email', label: 'Email', render: v => (
      <span className="flex items-center gap-1 text-sm text-gray-600"><Mail size={12}/>{v || '—'}</span>
    )},
    { key: 'onboardingStatus', label: 'Onboarding', render: v => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        v === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {v}
      </span>
    )},
    { key: 'contractValue', label: 'Contract Value', render: v => v ? `₹${v}` : '—' },
    { key: 'assignedTo', label: 'Account Manager', render: v => v || '—' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Briefcase className="text-green-500" size={24} /> Customers
        </h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search customers..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-200 outline-none" 
          />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} data={filtered} />
      </Card>
    </div>
  );
}
