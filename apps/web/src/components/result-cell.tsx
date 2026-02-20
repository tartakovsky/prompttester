'use client';

import { type CellResult } from '@/types';
import { CopyButton } from '@/components/copy-button';

export function ResultCellContent({
  cell,
  cellKey,
  isExpanded,
  onToggle,
}: {
  cell: CellResult | undefined;
  cellKey: string;
  isExpanded: boolean;
  onToggle: (key: string) => void;
}) {
  if (!cell) {
    return (
      <div className="p-4 text-xs text-muted-foreground bg-muted rounded-md border border-dashed border-border text-center">
        No result
      </div>
    );
  }

  if (cell.error) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-destructive">{cell.error.length > 150 ? cell.error.slice(0, 150) + '...' : cell.error}</p>
      </div>
    );
  }

  const maxLength = 200;
  const isLong = (cell.output?.length ?? 0) > maxLength;

  return (
    <div className="rounded-lg border border-border bg-card p-4 h-full flex flex-col hover:shadow-md transition-shadow max-h-[300px] relative group">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {cell.output && (
          <>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {isExpanded ? cell.output : cell.output.slice(0, maxLength)}
              {isLong && !isExpanded && '...'}
            </p>
            {isLong && (
              <button
                onClick={() => onToggle(cellKey)}
                className="text-xs text-primary hover:underline mt-2 font-medium"
              >
                {isExpanded ? 'show less' : 'show more'}
              </button>
            )}
          </>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
        {cell.input_tokens != null && cell.output_tokens != null ? (
          <span>{cell.input_tokens}+{cell.output_tokens} tok</span>
        ) : <span />}
        <CopyButton value={cell.output ?? ''} className="opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}
