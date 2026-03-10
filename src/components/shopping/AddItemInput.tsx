import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddItemInputProps {
  onAdd: (name: string) => void;
  disabled?: boolean;
}

/**
 * Inline input for adding manual items to the shopping list.
 * Submits on Enter key or "Add" button click. Clears after submit.
 */
export default function AddItemInput({ onAdd, disabled }: AddItemInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" noValidate>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add an item (e.g. Paper towels)"
        disabled={disabled}
        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
        aria-label="Add a manual item to your shopping list"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shrink-0"
      >
        <Plus size={16} aria-hidden="true" />
        Add
      </button>
    </form>
  );
}
