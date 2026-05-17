import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function DataTable({ columns, data, selectable = false, onSelectionChange }) {
  const [selected, setSelected] = useState([]);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const v = String(a[sortKey]).localeCompare(String(b[sortKey]));
        return sortDir === 'asc' ? v : -v;
      })
    : data;

  const toggleRow = (id) => {
    const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
    setSelected(next);
    onSelectionChange?.(next);
  };

  const toggleAll = () => {
    const next = selected.length === data.length ? [] : data.map(r => r.id);
    setSelected(next);
    onSelectionChange?.(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={selected.length === data.length && data.length > 0}
                  onChange={toggleAll} className="rounded border-gray-300 text-blue-500 focus:ring-blue-200" />
              </th>
            )}
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                {col.sortable ? (
                  <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                    {col.label}
                    <span className="flex flex-col">
                      <ChevronUp size={10} className={sortKey === col.key && sortDir === 'asc' ? 'text-blue-500' : 'text-gray-300'} />
                      <ChevronDown size={10} className={sortKey === col.key && sortDir === 'desc' ? 'text-blue-500' : 'text-gray-300'} />
                    </span>
                  </button>
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(row => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {selectable && (
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-200" />
                </td>
              )}
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">No records found</div>
      )}
    </div>
  );
}
