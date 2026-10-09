import { useState, useEffect } from 'react';
import { Target, Search, Building2, User } from 'lucide-react';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpps();
  }, []);

  const fetchOpps = async () => {
    try {
      const data = await api.get('/opportunities');
      setOpportunities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const convertToCustomer = async (id) => {
    try {
      await api.post(`/opportunities/${id}/convert-customer`);
      alert('Successfully converted to Customer!');
      fetchOpps();
    } catch (err) {
      alert(err.message || 'Failed to convert to Customer. Make sure stage is "Won".');
    }
  };

  const filtered = opportunities.filter(o => 
    (o.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (o.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'name', label: 'Deal Name', sortable: true, render: v => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'company', label: 'Company' },
    { key: 'stage', label: 'Stage', render: (v, row) => (
      <select 
        value={v}
        onChange={async (e) => {
          const newStage = e.target.value;
          try {
            await api.patch(`/opportunities/${row._id}`, { stage: newStage });
            fetchOpps();
          } catch(err) {
            alert('Failed to update stage');
          }
        }}
        className={`px-2 py-1 rounded-lg text-xs font-semibold border outline-none cursor-pointer transition-colors
          ${v === 'Won' ? 'bg-green-50 text-green-700 border-green-200' : 
            v === 'Lost' ? 'bg-gray-100 text-gray-600 border-gray-200' :
            'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
      >
        {['Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    )},
    { key: 'value', label: 'Value', render: v => v ? `₹${v}` : '—' },
    { key: 'assignedTo', label: 'Assigned To', render: v => v || '—' },
    { key: 'id', label: 'Action', render: (_, row) => (
      <button 
        onClick={() => convertToCustomer(row._id)}
        disabled={row.stage !== 'Won'}
        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${row.stage === 'Won' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
      >
        Make Customer
      </button>
    )}
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Target className="text-indigo-500" size={24} /> Opportunities
        </h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search deals..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none" 
          />
        </div>
      </div>
      <Card>
        <DataTable columns={columns} data={filtered} />
      </Card>
    </div>
  );
}
