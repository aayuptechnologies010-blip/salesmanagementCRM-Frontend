import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Eye, FileText, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import Card from '../components/shared/Card';
import DataTable from '../components/shared/DataTable';
import { PrimaryButton, IconButton } from '../components/shared/FormElements';

export default function Invoices() {
  const { leads } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const invoices = leads.slice(0, 15).map((lead, i) => ({
    id: `INV-2024-${1000 + i}`,
    client: lead.company,
    contact: lead.name,
    amount: lead.value ? parseInt(lead.value.replace(/,/g, '')) * 1.5 : 1500,
    date: new Date(Date.now() - i * 86400000 * 3).toISOString().split('T')[0],
    status: i % 3 === 0 ? 'Paid' : i % 3 === 1 ? 'Pending' : 'Overdue',
  }));

  const filteredInvoices = invoices.filter(inv =>
    (inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus ? inv.status === filterStatus : true)
  );

  const paid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);

  const columns = [
    { key: 'id', label: 'Invoice ID', sortable: true, render: v => <span className="font-semibold text-gray-800">{v}</span> },
    {
      key: 'client', label: 'Client', sortable: true, render: (v, row) => (
        <div>
          <div className="font-semibold text-gray-800">{v}</div>
          <div className="text-gray-500 text-xs mt-0.5">{row.contact}</div>
        </div>
      )
    },
    { key: 'amount', label: 'Amount', sortable: true, render: v => <span className="font-semibold text-gray-800">₹{v.toLocaleString()}</span> },
    { key: 'date', label: 'Issue Date', sortable: true, render: v => <span className="text-gray-600">{v}</span> },
    {
      key: 'status', label: 'Status', render: v => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
          v === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
          v === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
          'bg-red-50 text-red-700 border-red-200'
        }`}>
          {v}
        </span>
      )
    },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-1 justify-end">
          <IconButton onClick={() => navigate(`/invoices/${row.id}`)} variant="blue" title="View Invoice"><Eye size={16} /></IconButton>
          <IconButton onClick={() => navigate(`/invoices/${row.id}?print=true`)} variant="green" title="Download PDF"><Download size={16} /></IconButton>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 sm:flex-initial">
            <div className="pl-3 pr-2 py-2.5 flex items-center text-gray-400">
              <Search size={16} />
            </div>
            <input type="text" placeholder="Search invoices..."
              className="py-2.5 pr-4 outline-none text-sm w-full sm:w-64"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-150 outline-none shadow-sm">
            <option value="">All Statuses</option>
            {['Paid', 'Pending', 'Overdue'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <PrimaryButton>
          <Plus size={16} /> Create Invoice
        </PrimaryButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Paid Invoices', amount: paid, icon: FileText, bg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Pending', amount: pending, icon: FileText, bg: 'bg-yellow-100', color: 'text-yellow-600' },
          { label: 'Overdue', amount: overdue, icon: FileText, bg: 'bg-red-100', color: 'text-red-600' },
        ].map(({ label, amount, icon: Icon, bg, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <h4 className="text-2xl font-bold text-gray-800">₹{amount.toLocaleString()}</h4>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <DataTable columns={columns} data={filteredInvoices} />
      </Card>
    </div>
  );
}
