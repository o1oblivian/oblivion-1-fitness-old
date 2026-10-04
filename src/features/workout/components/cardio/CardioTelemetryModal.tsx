import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { analyzeConsoleTelemetry, CardioTelemetryResult } from '../../../../services/geminiVisionService';
import { useLogStore } from '../../../../stores/useLogStore';
import { useFuelStore } from '../../../fuel/store/useFuelStore';
import { useTelemetryHistoryStore } from '../../../log/store/useTelemetryHistoryStore';
import { telemetryArbitrationService } from '../../../telemetry/services/telemetryArbitrationService';
import { tactileEngine } from '../../../../services/tactileEngine';
import { useSubscription } from '../../../../context/SubscriptionContext';
import { CardioMetricsGrid, MetricItem } from './CardioMetricsGrid';

interface Props {
  isOpen: boolean; onClose: () => void; onPostCardio?: (data: CardioTelemetryResult) => void;
}

export const CardioTelemetryModal: React.FC<Props> = ({ isOpen, onClose, onPostCardio }) => {
  const { isPro, openPaywall } = useSubscription();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<CardioTelemetryResult | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessImage = async (base64: string) => {
    setSelectedImage(base64);
    setIsAnalyzing(true);
    setStatusMessage(null);
    tactileEngine.triggerSelectionBuzz();
    try {
      const res = await analyzeConsoleTelemetry(base64);
      setTelemetry(res);
      const hasAny = res.steps != null || res.distanceKm != null || res.caloriesBurned != null || res.elapsedMinutes != null;
      setStatusMessage(res.steps != null && res.steps > 0
        ? `Optical OCR extracted ${res.steps.toLocaleString()} steps directly from display.`
        : hasAny ? 'Display parsed. Review telemetry or tap any tile to fine-tune.'
        : 'No readable numbers detected on image. Tap any metric to enter manually or retake photo.');
      tactileEngine.playPRCelebration();
    } catch {
      setTelemetry(null);
      setStatusMessage('Display could not be resolved automatically. Tap any metric to enter manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPro) return openPaywall('Cardio & Wearable OCR Scanner');
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && handleProcessImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpdateMetric = (id: string, val: number | string) => {
    setTelemetry((prev) => {
      const b = prev || { deviceType: 'watch', elapsedDisplay: null, elapsedMinutes: null, distanceKm: null, caloriesBurned: null, speedKmh: null, inclinePct: null, avgHeartRateBpm: null, steps: null };
      const n = Number(val) || null;
      if (id === 'elapsed') return { ...b, elapsedMinutes: typeof val === 'number' ? val : parseFloat(String(val)) || null, elapsedDisplay: String(val) };
      if (id === 'calories') return { ...b, caloriesBurned: n };
      if (id === 'distance') return { ...b, distanceKm: n };
      if (id === 'speed') return { ...b, speedKmh: n };
      if (id === 'incline') return { ...b, inclinePct: n };
      if (id === 'heartRate') return { ...b, avgHeartRateBpm: n };
      if (id === 'steps') return { ...b, steps: typeof val === 'number' ? val : parseInt(String(val).replace(/,/g, ''), 10) || null };
      return b;
    });
  };

  const handlePost = () => {
    if (!telemetry) return;
    const today = new Date().toISOString().slice(0, 10);
    const steps = telemetry.steps || 0, dist = telemetry.distanceKm || 0, dur = telemetry.elapsedMinutes || 0, cal = telemetry.caloriesBurned || 0, hr = telemetry.avgHeartRateBpm || 0;
    useTelemetryHistoryStore.getState().updateDayRecord(today, 'cardio', { hasData: true, distanceKm: dist, durationMinutes: dur, burnedKcal: cal, avgHeartRateBpm: hr, zone2Minutes: Math.round(dur * 0.7), activityType: telemetry.deviceType === 'watch' ? 'Watch Telemetry' : 'Console Telemetry' });
    try {
      useLogStore.getState().updateSubModule('cardio', { burnedKcal: cal, durationMinutes: dur, avgHeartRateBpm: hr, distanceKm: dist });
      if (cal > 0) useFuelStore.getState().logBurned(cal);
      if (telemetry.deviceType === 'watch' && steps > 0) telemetryArbitrationService.setDailyCumulative(steps);
      else telemetryArbitrationService.recordConsoleSession({ distanceKm: dist, durationMinutes: dur, steps: steps || undefined, burnedKcal: cal });
    } catch {}
    onPostCardio?.(telemetry);
    tactileEngine.playPRCelebration();
    onClose();
  };

  const metrics: MetricItem[] = [
    { id: 'steps', label: 'STEPS', num: telemetry?.steps != null ? telemetry.steps.toLocaleString() : '--', unit: 'steps' },
    { id: 'elapsed', label: 'ELAPSED', num: telemetry?.elapsedDisplay || (telemetry?.elapsedMinutes != null ? `${telemetry.elapsedMinutes} min` : '--'), unit: 'min' },
    { id: 'calories', label: 'CALORIES', num: telemetry?.caloriesBurned != null ? telemetry.caloriesBurned : '--', unit: 'kcal' },
    { id: 'distance', label: 'DISTANCE', num: telemetry?.distanceKm != null ? telemetry.distanceKm : '--', unit: 'km' },
    { id: 'heartRate', label: 'HEART RATE', num: telemetry?.avgHeartRateBpm != null ? telemetry.avgHeartRateBpm : '--', unit: 'bpm' },
    { id: 'speed', label: 'SPEED', num: telemetry?.speedKmh != null ? telemetry.speedKmh : '--', unit: 'km/h' },
    { id: 'incline', label: 'INCLINE', num: telemetry?.inclinePct != null ? telemetry.inclinePct : '--', unit: '%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#121214] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-100 dark:bg-[#09090b] border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-[#C4121A]/20 flex items-center justify-center text-[#C4121A]"><Activity className="w-4 h-4" /></div>
            <div>
              <h2 className="text-xs font-tactical font-black text-neutral-900 dark:text-white uppercase tracking-wider">Cardio & Wearable OCR</h2>
              <p className="text-[10px] font-sans font-medium text-neutral-500 dark:text-neutral-400">Direct Multimodal Console & Watch Telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#C4121A] hover:bg-[#A30F16] text-white text-[11px] font-tactical font-black uppercase tracking-wider cursor-pointer active:scale-95 transition shadow-md"><Camera className="w-3.5 h-3.5" /> Take Photo</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-[#202024] text-neutral-800 dark:text-neutral-200 text-[11px] font-tactical font-bold uppercase tracking-wider cursor-pointer border border-neutral-300 dark:border-neutral-700 active:scale-95 transition"><Upload className="w-3.5 h-3.5" /> Upload Photo</button>
          </div>
          {selectedImage && (
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-48 flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
              <img src={selectedImage} alt="Cardio display" className="max-h-48 object-contain" />
              {isAnalyzing && <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2 text-white font-tactical text-xs tracking-wider uppercase font-bold"><Zap className="w-4 h-4 animate-spin text-[#C4121A]" /> Reading Display...</div>}
            </div>
          )}
          {statusMessage && (
            <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /><span className="font-sans font-medium text-[11px] leading-tight">{statusMessage}</span>
            </div>
          )}
          <CardioMetricsGrid metrics={metrics} onUpdateMetric={handleUpdateMetric} />
        </div>
        <div className="p-4 bg-neutral-100 dark:bg-[#09090b] border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={handlePost} disabled={!telemetry || isAnalyzing} className="w-full py-3 rounded-2xl bg-[#C4121A] hover:bg-[#A30F16] active:bg-[#800C11] disabled:opacity-40 text-white font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition"><Zap className="w-4 h-4 fill-white" /> Save Telemetry to Session</button>
        </div>
      </div>
    </div>
  );
};
export default CardioTelemetryModal;
