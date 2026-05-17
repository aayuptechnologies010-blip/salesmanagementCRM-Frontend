export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all bg-white ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        className={`border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button className={`bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button className={`bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${className}`} {...props}>
      {children}
    </button>
  );
}
