import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, X } from 'lucide-react';
import { tactileEngine } from '../../services/tactileEngine';

export interface LaunchProtocolModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: () => void;
}

export const LaunchProtocolModal: React.FC<LaunchProtocolModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  if (!isOpen) return null;

  const handleLaunch = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    tactileEngine.playPRCelebration();
    try {
      localStorage.setItem('o1fc_onboarding_completed', 'true');
      localStorage.setItem('olfc_onboarding_completed', 'true');
    } catch {}
    // Seamless SPA client-side state transition into dashboard (zero page reload)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
    }
    if (onComplete) {
      onComplete();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#09090b]">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#C4121A]">
            <span className="w-2 h-2 rounded-full bg-[#C4121A] animate-ping" />
            <span>O1FC PROTOCOL IGNITION</span>
          </div>
          <button
            type="button"
            onClick={handleLaunch}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="text-center space-y-1.5">
            <div className="inline-flex p-3 rounded-2xl bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/30 mb-1">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black tracking-tight text-white uppercase font-tactical">
              Training OS Pro Calibrated
            </h3>
            <p className="text-xs font-mono text-neutral-400">
              Biometric telemetry and adaptive training engine primed.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleLaunch}
              className="w-full py-4 rounded-full bg-[#C4121A] hover:bg-[#A30F16] active:scale-[0.98] text-white font-tactical font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-[0_4px_30px_rgba(196,18,26,0.55)] border border-rose-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ENTER TRAINING OS PRO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[10px] font-sans text-neutral-500 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Zero-cloud air-gapped encryption. Ready for deployment.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchProtocolModal;
