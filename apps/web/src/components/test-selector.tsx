'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { type TestConfig } from '@/types';

export function TestSelector({
  tests,
  activeTestId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}: {
  tests: TestConfig[];
  activeTestId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const finish = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tests.map((test) => (
        <div
          key={test.id}
          className={cn(
            'group flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm cursor-pointer select-none transition-colors',
            test.id === activeTestId
              ? 'border-primary bg-primary/10 text-foreground font-medium'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
          onClick={() => onSelect(test.id)}
          onDoubleClick={() => {
            setEditingId(test.id);
            setEditName(test.name);
          }}
        >
          {editingId === test.id ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={finish}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finish();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-24 bg-transparent text-sm outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate max-w-[150px]">{test.name}</span>
          )}
          {tests.length > 1 && editingId !== test.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(test.id);
              }}
              className="ml-0.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
            >
              &times;
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
      >
        + New Test
      </button>
    </div>
  );
}
