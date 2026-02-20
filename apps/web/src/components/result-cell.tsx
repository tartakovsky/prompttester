'use client';

import { type CellResult } from '@/types';
import { CopyButton } from '@/components/copy-button';
import { cn } from '@/lib/utils';

export function ResultCellContent({
  cell,
  cellKey,
  isExpanded,
  onToggle,
  unfolded,
}: {
  cell: CellResult | undefined;
  cellKey: string;
  isExpanded: boolean;
  onToggle: (key: string) => void;
  unfolded: boolean;
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
  const showFull = unfolded || isExpanded;

  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 h-full flex flex-col hover:shadow-md transition-shadow relative group',
      !unfolded && 'max-h-[300px]',
    )}>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {cell.output && (
          <>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {showFull ? cell.output : cell.output.slice(0, maxLength)}
              {isLong && !showFull && '...'}
            </p>
            {isLong && !unfolded && (
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
