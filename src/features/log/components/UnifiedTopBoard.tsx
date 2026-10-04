import React from 'react';
import { UserPlus, Calendar, Play, ChevronRight, Share2, Camera, Sparkles, CheckCircle2 } from 'lucide-react';
import { tactileEngine } from '../../../services/tactileEngine';
import { useUserStore } from '../../../stores/useUserStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { useLogStore } from '../../../stores/useLogStore';
import { useWorkoutStore } from '../../workout/store/useWorkoutStore';
import { useActiveProgramStore } from '../../../stores/useActiveProgramStore';
import { SplitOption } from '../types';

interface UnifiedTopBoardProps {
  onOpenInvite: () => void;
  onChooseRoutine: (split: SplitOption) => void;
  onShareProgress: () => void;
  onOpenPhotoVault: () => void;
  onOpenSettings?: () => void;
}

export const UnifiedTopBoard: React.FC<UnifiedTopBoardProps> = ({
  onOpenInvite,
  onChooseRoutine,
  onShareProgress,
  onOpenPhotoVault,
}) => {
  const user = useUserStore();
  const assignedWorkouts = useCoachStore((s) => s.assignedWorkouts);
  const microcycleStats = useLogStore((s) => s.microcycleStats);
  const sessionTonnageKg = useWorkoutStore((s) => s.sessionTonnageKg);
  const activeProgram = useActiveProgramStore();
  const currentProgramDay = activeProgram.getCurrentDayWorkout();
  const nextProgramDay = activeProgram.getNextDayWorkout();

  // Genuine athlete profile details
  const athleteName = user.name || 'Athlete';
  const athleteWeight = user.weightKg > 0 ? user.weightKg.toFixed(1) : '--';
  const targetWeight = user.targetWeightKg > 0 ? user.targetWeightKg.toFixed(1) : '--';

  // Genuine check for coach dispatch OR active enrolled program
  const hasGenuineDispatch = (assignedWorkouts && assignedWorkouts.length > 0) || (activeProgram.hasActiveProgram && !!currentProgramDay);
  const hasCoachDispatch = hasGenuineDispatch;
  const coachDispatch = (assignedWorkouts && assignedWorkouts.length > 0) ? assignedWorkouts[0] : null;

  // Active workout title to display
  const activeTitle = coachDispatch?.title || currentProgramDay?.title || null;
  const targetRpe = coachDispatch?.exercises?.[0]?.rpe || currentProgramDay?.exercises?.[0]?.rpe || null;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const totalVolume = sessionTonnageKg > 0 ? sessionTonnageKg : microcycleStats.totalVolumeKg;

  const handleStartDispatched = () => {
    tactileEngine.playPRCelebration();
    // Ingest the dispatched workout into the active workout store and switch to tracker
    const exercisesToLoad = coachDispatch?.exercises || currentProgramDay?.exercises || [];
    const hydrated = exercisesToLoad.map((ex: any, idx: number) => ({
      id: `dispatched-ex-${idx}-${Date.now()}`,
      name: ex.name,
      exerciseName: ex.name,
      targetMuscle: ex.targetMuscle || 'Compound',
      equipment: ex.equipment || 'barbell',
      tier: 'Coach Directive',
      restSecs: ex.restSecs || 90,
      sets: Array.from({ length: ex.sets || 3 }, (_, sIdx) => ({
        id: `set-${Date.now()}-${sIdx}`,
        setNumber: sIdx + 1,
        reps: ex.reps || 10,
        weightKg: ex.weightKg || 60,
        rpe: ex.rpe || 8.5,
        completed: false,
      })),
    }));

    useWorkoutStore.getState().setActiveLogs(hydrated);
    useWorkoutStore.getState().setActiveRoutine(activeTitle || 'Coach Dispatched Protocol');
    useWorkoutStore.getState().setActiveSession(true);
    useWorkoutStore.getState().setMode('Lift');

    // Sync live session start to Coach Hub
    useCoachStore.getState().updateLiveTelemetry({
      athleteId: 'ath-current',
      athleteName: athleteName,
      activeExercise: hydrated[0]?.name || activeTitle || 'Prescribed Protocol',
      currentSet: 1,
      currentWeightKg: hydrated[0]?.sets[0]?.weightKg || 60,
      currentRpe: Number(targetRpe) || 8.5,
      sessionTonnageKg: 0,
      isLive: true,
      lastUpdated: 'Live right now',
    });

    // Smoothly route to Workout tab
    window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-[#121214] border border-neutral-200/90 dark:border-neutral-800 p-4 sm:p-5 shadow-sm space-y-4 select-none relative overflow-hidden transition-colors">
      {/* Subtle top crimson accent line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C4121A] to-transparent opacity-80" />

      {/* ============================================================== */}
      {/* 1. ATHLETE PROFILE ROW (NON-CLICKABLE, REAL AVATAR PHOTO)      */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-3">
          {/* Avatar: Displays genuine athlete photo from user profile settings */}
          <div className="relative w-12 h-12 rounded-full bg-[#141416] border-2 border-[#C4121A] flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'Athlete Profile'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="font-sans font-bold text-white text-base tracking-tight select-none">
                O1
              </span>
            )}

            {/* Red live status dot on bottom right */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#C4121A] border-2 border-white dark:border-[#121214]" />
          </div>

          {/* Profile Details: Athlete Name */}
          <div className="flex items-center gap-2 cursor-default">
            <span className="font-bold text-base text-neutral-900 dark:text-white tracking-tight">
              {athleteName}
            </span>
          </div>
        </div>

        {/* Right: Actions (Add / INVITE) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenInvite();
            }}
            className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
            aria-label="Invite friends"
          >
            <div className="flex flex-col text-right leading-tight">
              <span className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#C4121A] transition-colors">
                Add
              </span>
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                INVITE
              </span>
            </div>

            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 group-hover:bg-[#C4121A] group-hover:text-white group-hover:border-[#C4121A] transition-colors shadow-xs">
              <UserPlus className="w-5 h-5 stroke-[2]" />
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. COACH ROUTINE DISPATCH / READY TO TRAIN SECTION             */}
      {/* ============================================================== */}
      <div className="space-y-3.5">
        {/* Date & Dispatch Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>{formattedDate}</span>
          </div>

          {hasCoachDispatch ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>COACH DISPATCH READY</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold uppercase tracking-wider">
              AWAITING DISPATCH
            </span>
          )}
        </div>

        {/* Headline & Target RPE Gauge */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
              {hasCoachDispatch && activeTitle ? activeTitle.toUpperCase() : 'READY TO TRAIN'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {hasCoachDispatch
                ? 'Coach-prescribed protocol ready to load into log & execute'
                : 'Awaiting your coach\'s dispatch or select a training routine'}
            </p>
          </div>

          {/* TARGET RPE Box */}
          <div className="shrink-0 bg-neutral-50 dark:bg-[#16161a] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2.5 flex flex-col items-center justify-center min-w-[76px] space-y-0.5">
            <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-center">
              TARGET RPE
            </span>
            <span className="text-lg font-black text-[#C4121A] tracking-wider leading-none">
              {typeof targetRpe === 'number' ? targetRpe.toFixed(1) : '--'}
            </span>
            <div className="flex items-center gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((dot) => {
                const active = targetRpe ? dot <= Math.round(Number(targetRpe) / 2) : false;
                return (
                  <span
                    key={dot}
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? 'bg-[#C4121A]' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Primary CTA: START DISPATCHED WORKOUT OR CHOOSE ROUTINE */}
        {hasCoachDispatch && activeTitle ? (
          <button
            type="button"
            id="choose-routine-start-btn"
            onClick={handleStartDispatched}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#C4121A] hover:bg-[#a50f16] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between shadow-md shadow-red-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              </div>
              <span>START DISPATCHED: {activeTitle}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/90 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <button
            type="button"
            id="choose-routine-start-btn"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onChooseRoutine('Push');
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#C4121A] hover:bg-[#a50f16] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between shadow-md shadow-red-500/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              </div>
              <span>CHOOSE ROUTINE &amp; START</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/90 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Upcoming Day Ahead / Rest Day Preview Card */}
        {hasCoachDispatch && nextProgramDay && (
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-bold block">
                DAY AHEAD PREPARATION ({nextProgramDay?.dayName || 'Tomorrow'})
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {nextProgramDay?.title || 'Scheduled Protocol'}
              </span>
            </div>
            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                nextProgramDay?.isRestDay
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {nextProgramDay?.isRestDay ? 'REST DAY' : 'NEXT PROTOCOL'}
            </span>
          </div>
        )}
      </div>

      {/* Structural Divider */}
      <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

      {/* ============================================================== */}
      {/* 3. KINEMATIC BENCHMARK & PROGRESS HUB                          */}
      {/* ============================================================== */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
                {athleteWeight}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
                KG
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
              BENCHMARK MATRIX · {user.weightKg > 0 ? '1 BENCHMARK' : '0 BENCHMARKS'}
            </span>
          </div>

          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-black text-neutral-950 dark:text-white tracking-tight">
                {targetWeight}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400">
                KG
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
              TARGET: GOAL WEIGHT
            </span>
          </div>
        </div>

        {/* 1RM Curve Calibration Bar */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 space-y-1.5 text-center">
          <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">
            {totalVolume > 0 ? 'CALIBRATING 1RM MATRIX' : '1RM MATRIX'}
          </span>
          <div className="relative h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className={`absolute inset-y-0 left-0 ${totalVolume > 0 ? 'w-1/2' : 'w-0'} bg-emerald-500 rounded-full`} />
          </div>
          <span className="text-[10px] font-mono text-neutral-400 block pt-0.5">
            {totalVolume > 0 ? 'Session metrics registered in matrix' : 'Record your first max set to plot curve'}
          </span>
        </div>

        {/* 3 Metric Inset Chips */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold">
          <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>{user.weightKg > 0 ? '1 Benchmark' : '0 Benchmarks'}</span>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{microcycleStats.streakDays || 0}-Day Streak</span>
          </div>
          <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C4121A]" />
            <span>{totalVolume > 0 ? totalVolume.toLocaleString() : 0} kg Volume</span>
          </div>
        </div>

        {/* Dual Actions: Share Progress & Photo Vault */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onShareProgress();
            }}
            className="py-3 px-3 rounded-2xl bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Share2 className="w-4 h-4 text-[#C4121A]" />
            <span>SHARE PROGRESS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              tactileEngine.triggerSelectionBuzz();
              onOpenPhotoVault();
            }}
            className="py-3 px-3 rounded-2xl bg-neutral-100 dark:bg-[#18181b] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Camera className="w-4 h-4 text-[#C4121A]" />
            <span>PHOTO VAULT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTopBoard;
