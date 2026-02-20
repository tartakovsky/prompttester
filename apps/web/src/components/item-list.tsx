'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { type ListItem, type SectionAccent, accentStyles } from '@/types';

export function ItemList({
  items,
  activeId,
  onSelect,
  onAdd,
  onRemove,
  onRename,
  onToggle,
  readOnly = false,
  accent = 'neutral',
}: {
  items: (ListItem & { enabled?: boolean })[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onToggle?: (id: string) => void;
  readOnly?: boolean;
  accent?: SectionAccent;
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
      onRename?.(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex w-[170px] min-w-[170px] md:w-[200px] md:min-w-[200px] flex-col gap-0.5">
      {items.map((item) => {
        const isDisabled = item.enabled === false;
        return (
          <div
            key={item.id}
            className={cn(
              'group flex items-center rounded-md border px-2.5 py-1.5 text-sm cursor-pointer select-none transition-colors',
              isDisabled && 'opacity-40',
              item.id === activeId && !isDisabled
                ? accentStyles[accent].active
                : `border-border text-muted-foreground ${accentStyles[accent].hover} hover:text-foreground`
            )}
            onClick={() => onSelect(item.id)}
            onDoubleClick={() => {
              if (readOnly) return;
              setEditingId(item.id);
              setEditName(item.name);
            }}
          >
            {onToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.id);
                }}
                className={cn(
                  'mr-1.5 shrink-0 h-3.5 w-3.5 rounded-sm border transition-colors',
                  isDisabled
                    ? 'border-muted-foreground/30 bg-transparent'
                    : 'border-current bg-current'
                )}
                title={isDisabled ? 'Enable' : 'Disable'}
              >
                {!isDisabled && (
                  <svg viewBox="0 0 14 14" className="h-full w-full text-white dark:text-black">
                    <path d="M3 7l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )}
            {editingId === item.id ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={finish}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finish();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="w-full bg-transparent text-sm outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={cn('flex-1 truncate', isDisabled && 'line-through')}>{item.name}</span>
            )}
            {!readOnly && !onToggle && items.length > 1 && editingId !== item.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.(item.id);
                }}
                className="ml-1 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
              >
                &times;
              </button>
            )}
          </div>
        );
      })}
      {!readOnly && onAdd && (
        <button
          onClick={onAdd}
          className={cn('flex items-center justify-center rounded-md border border-dashed border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors', accentStyles[accent].add)}
        >
          +
        </button>
      )}
    </div>
  );
}
