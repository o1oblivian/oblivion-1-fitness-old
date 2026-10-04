import React, { useState } from 'react';
import { Edit3, Check } from 'lucide-react';

export interface MetricItem {
  id: string;
  label: string;
  num: string | number | null | undefined;
  unit: string;
}

interface Props {
  metrics: MetricItem[];
  onUpdateMetric?: (id: string, newVal: number | string) => void;
}

export const CardioMetricsGrid: React.FC<Props> = ({ metrics, onUpdateMetric }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempVal, setTempVal] = useState<string>('');

  const startEdit = (m: MetricItem) => {
    if (!onUpdateMetric) return;
    setEditingId(m.id);
    setTempVal(m.num === '--' || m.num == null ? '' : String(m.num));
  };

  const saveEdit = (id: string) => {
    if (tempVal.trim() !== '') {
      const numVal = parseFloat(tempVal.replace(/,/g, ''));
      onUpdateMetric?.(id, isNaN(numVal) ? tempVal.trim() : numVal);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        {metrics.map((m) => {
          const isEditing = editingId === m.id;
          const isMissing = m.num == null || m.num === '--' || m.num === '';
          const displayText = isMissing ? '--' : m.num;

          return (
            <div
              key={m.id}
              onClick={() => !isEditing && startEdit(m)}
              className={`p-2 rounded-xl bg-neutral-100 dark:bg-[#18181b] border transition-all text-center flex flex-col justify-center relative group cursor-pointer ${
                isEditing
                  ? 'border-[#C4121A] ring-1 ring-[#C4121A]'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[8px] font-tactical font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block truncate">
                  {m.label}
                </span>
                {onUpdateMetric && !isEditing && (
                  <Edit3 className="w-2.5 h-2.5 text-neutral-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {isEditing ? (
                <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={tempVal}
                    onChange={(e) => setTempVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(m.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full text-xs font-mono font-bold text-neutral-900 dark:text-white bg-white dark:bg-[#121214] border border-[#C4121A] rounded px-1 py-0.5 outline-none text-center"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(m.id)}
                    className="p-1 rounded bg-[#C4121A] text-white hover:bg-[#A30F16]"
                  >
                    <Check className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-mono font-bold text-neutral-900 dark:text-white truncate block tracking-tight">
                  {displayText}{' '}
                  {!isMissing && (
                    <span className="text-[8.5px] text-neutral-500 dark:text-neutral-400 font-normal">
                      {m.unit}
                    </span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {onUpdateMetric && (
        <p className="text-[9.5px] font-sans text-neutral-500 dark:text-neutral-400 text-center">
          Optical vision calibrated. Tap any metric to fine-tune before saving.
        </p>
      )}
    </div>
  );
};

export default CardioMetricsGrid;
