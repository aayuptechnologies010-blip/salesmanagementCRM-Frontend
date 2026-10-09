const statusStyles = {
  New: 'bg-blue-100 text-blue-700',
  Assigned: 'bg-indigo-100 text-indigo-700',
  Contacted: 'bg-purple-100 text-purple-700',
  Interested: 'bg-teal-100 text-teal-700',
  Qualified: 'bg-orange-100 text-orange-700',
  Proposal: 'bg-pink-100 text-pink-700',
  Negotiation: 'bg-indigo-100 text-indigo-700',
  Won: 'bg-green-100 text-green-700',
  'Not Interested': 'bg-red-100 text-red-700',
  Invalid: 'bg-gray-200 text-gray-700',
  Duplicate: 'bg-gray-300 text-gray-800',
  'No Response': 'bg-yellow-100 text-yellow-700',
  Lost: 'bg-gray-100 text-gray-600',
  Active: 'bg-blue-100 text-blue-700',
  Inactive: 'bg-gray-200 text-gray-500',
  Pending: 'bg-blue-100 text-blue-700',
  Done: 'bg-gray-100 text-gray-600',
  High: 'bg-blue-500 text-white',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
