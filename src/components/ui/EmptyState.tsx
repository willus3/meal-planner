interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * Reusable empty state for lists and pages with no data yet.
 * Shows an icon, a message, and an optional call-to-action button.
 */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4 text-gray-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
