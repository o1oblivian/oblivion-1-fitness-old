import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Sparkles, Dumbbell } from 'lucide-react';
import { CommitWorkoutModal } from './modals/CommitWorkoutModal';
import { tactileEngine } from '../../../services/tactileEngine';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useActiveProgramStore } from '../../../stores/useActiveProgramStore';
import { useCoachStore } from '../../../stores/useCoachStore';
import { DialInputModal } from '../../../components/common/DialInputModal';
import { ActiveLogExerciseAccordion } from './ActiveLogExerciseAccordion';
import { saveAthleteDayRoutine } from '../services/dayRoutineService';
import { useLogStore } from '../../../stores/useLogStore';
import { useUserStore } from '../../../stores/useUserStore';
import { useTelemetryHistoryStore, getTelemetryHistoryState } from '../../log/store/useTelemetryHistoryStore';
import { syncSessionToSupabase } from '../../../services/supabaseClient';

export interface ActiveLogCardProps {
  onShowToast?: (msg: string) => void;
  [key: string]: any;
}

export const ActiveLogCard: React.FC<ActiveLogCardProps> = ({ onShowToast }) => {
  const exercises = useWorkoutStore((s) => s.exercises);
  const setExercises = useWorkoutStore((s) => s.setExercises);
  const updateExerciseSet = useWorkoutStore((s) => s.updateExerciseSet);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const toggleSetCompleted = useWorkoutStore((s) => s.toggleSetCompleted);
  const clearActiveLog = useWorkoutStore((s) => s.clearActiveLog);
  const showToastFn = useWorkoutStore((s) => s.showToast);

  const notify = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    else showToastFn(msg);
  };

  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [isCommitOpen, setIsCommitOpen] = useState(false);

  const BEGINNER_STARTERS = [
    {
      title: 'Full Body Foundation',
      subtitle: '35 mins • 4 classic movements',
      badge: 'BEGINNER BEST',
      routineName: 'Full Body Foundation (Beginner)',
      exercises: [
        {
          id: 'bg-sq-1',
          name: 'Goblet Squat (Dumbbell)',
          exerciseName: 'Goblet Squat',
          targetMuscle: 'Quadriceps / Glutes',
          equipment: 'Dumbbell',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 10, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 10, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 12, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-bp-2',
          name: 'Dumbbell Flat Bench Press',
          exerciseName: 'Dumbbell Bench Press',
          targetMuscle: 'Chest / Triceps',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 12, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 12, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 14, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-lp-3',
          name: 'Lat Pulldown (Neutral Grip)',
          exerciseName: 'Lat Pulldown',
          targetMuscle: 'Upper Back / Lats',
          equipment: 'Cable Machine',
          sets: [
            { id: 's1', setNumber: 1, reps: 12, weightKg: 30, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 12, weightKg: 30, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 12, weightKg: 35, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-rdl-4',
          name: 'Romanian Deadlift (Dumbbell)',
          exerciseName: 'Romanian Deadlift',
          targetMuscle: 'Hamstrings / Posterior',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 14, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 14, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 16, rpe: 8, completed: false },
          ],
        },
      ],
    },
    {
      title: 'Upper Push & Pull Starter',
      subtitle: '30 mins • Arms & Upper Body',
      badge: 'EASY START',
      routineName: 'Upper Body Starter (Beginner)',
      exercises: [
        {
          id: 'bg-row-1',
          name: 'Seated Cable Row',
          exerciseName: 'Seated Cable Row',
          targetMuscle: 'Upper Back',
          equipment: 'Cable Machine',
          sets: [
            { id: 's1', setNumber: 1, reps: 12, weightKg: 25, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 12, weightKg: 25, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 12, weightKg: 30, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-inc-2',
          name: 'Incline Dumbbell Press',
          exerciseName: 'Incline Dumbbell Press',
          targetMuscle: 'Upper Chest',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 10, weightKg: 10, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 10, weightKg: 10, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 10, weightKg: 12, rpe: 8, completed: false },
          ],
        },
        {
          id: 'bg-lat-3',
          name: 'Standing Lateral Raise',
          exerciseName: 'Lateral Raise',
          targetMuscle: 'Side Delts',
          equipment: 'Dumbbells',
          sets: [
            { id: 's1', setNumber: 1, reps: 12, weightKg: 5, rpe: 7, completed: false },
            { id: 's2', setNumber: 2, reps: 12, weightKg: 5, rpe: 7.5, completed: false },
            { id: 's3', setNumber: 3, reps: 12, weightKg: 6, rpe: 8, completed: false },
          ],
        },
      ],
    },
  ];

  const handleLoadBeginnerStarter = (starter: typeof BEGINNER_STARTERS[0]) => {
    tactileEngine.playPRCelebration();
    setExercises(starter.exercises as any);
    useWorkoutStore.getState().setActiveSession(true);
    useWorkoutStore.getState().setActiveRoutine(starter.routineName);
    setExpandedExerciseId(starter.exercises[0].id);
    notify(`🎉 Loaded ${starter.title}! Tap the checkmark when you complete each set.`);
  };

  // Rotary Dial Input Modal State
  const [dialConfig, setDialConfig] = useState<{
    isOpen: boolean;
    exerciseId: string;
    setNumber: number;
    setId?: string;
    setIndex?: number;
    type: 'weight' | 'reps' | 'rpe';
    initialValue: number;
  }>({
    isOpen: false,
    exerciseId: '',
    setNumber: 1,
    type: 'weight',
    initialValue: 0,
  });

  // Calculate live volume, sets, and reps
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  exercises.forEach((ex) => {
    (ex.sets || []).forEach((s) => {
      totalSets += 1;
      const w = s.weightKg || s.weight || 0;
      const r = s.reps || 0;
      totalVolume += w * r;
      totalReps += r;
    });
  });

  const handleToggleRow = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setExpandedExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  };

  const handleDeleteExercise = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
    if (expandedExerciseId === exerciseId) {
      setExpandedExerciseId(null);
    }
  };

  const handleDuplicateSet = (exerciseId: string) => {
    tactileEngine.triggerSelectionBuzz();
    const targetEx = exercises.find((e) => e.id === exerciseId);
    if (!targetEx || !targetEx.sets || targetEx.sets.length === 0) {
      addSet(exerciseId);
      return;
    }
    const lastSet = targetEx.sets[targetEx.sets.length - 1];
    const newSetNumber = lastSet.setNumber + 1;
    const newSet = {
      ...lastSet,
      id: `set-${Date.now()}-${newSetNumber}-${Math.random().toString(36).slice(2, 6)}`,
      setNumber: newSetNumber,
      completed: false,
    };
    setExercises((prev) =>
      prev.map((e) =>
        e.id === exerciseId ? { ...e, sets: [...(e.sets || []), newSet] } : e
      )
    );
  };

  const handleOpenDial = (
    exerciseId: string,
    setNumber: number,
    type: 'weight' | 'reps' | 'rpe',
    currentVal: number,
    setId?: string,
    setIndex?: number
  ) => {
    tactileEngine.triggerSelectionBuzz();
    setDialConfig({
      isOpen: true,
      exerciseId,
      setNumber,
      setId,
      setIndex,
      type,
      initialValue: currentVal ?? (type === 'reps' ? 10 : type === 'rpe' ? 8 : 0),
    });
  };

  const handleConfirmDial = (val: number) => {
    if (!dialConfig.exerciseId) return;
    tactileEngine.playPRCelebration();
    const numVal = Number(val);
    const fieldKey = dialConfig.type === 'weight' ? 'weightKg' : dialConfig.type;

    // Direct reactive state update matching setId, setNumber, or index
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== dialConfig.exerciseId) return ex;
        const updatedSets = ex.sets.map((s, idx) => {
          const isTarget =
            (dialConfig.setId && s.id === dialConfig.setId) ||
            s.setNumber === dialConfig.setNumber ||
            Number(s.setNumber) === Number(dialConfig.setNumber) ||
            String(s.setNumber) === String(dialConfig.setNumber) ||
            (dialConfig.setIndex !== undefined && idx === dialConfig.setIndex);

          if (isTarget) {
            return {
              ...s,
              [fieldKey]: numVal,
              ...(dialConfig.type === 'weight' ? { weight: numVal, weightKg: numVal } : {}),
              ...(dialConfig.type === 'reps' ? { reps: numVal } : {}),
              ...(dialConfig.type === 'rpe' ? { rpe: numVal } : {}),
            };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const handleFinishAndSave = () => {
    tactileEngine.playPRCelebration();
    setIsCommitOpen(true);
  };

  const handleRegisterLog = () => {
    // 1. Ingest session record into LogStore history
    const activeTitle = useWorkoutStore.getState().activeRoutine || 'Coach Dispatched Protocol';
    const mappedPastExercises = exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.length,
      reps: `${ex.sets[0]?.reps || 10} reps`,
      load: `${ex.sets[0]?.weightKg || 60} KG`,
    }));

    useLogStore.getState().addRecentSession({
      id: `session-${Date.now()}`,
      title: activeTitle,
      timestamp: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '45m',
      tonnageKg: totalVolume,
      totalSets,
      strain: Math.min(18.5, +(8.5 + (totalVolume / 1500)).toFixed(1)),
      exercises: mappedPastExercises,
    });

    const prevStats = useLogStore.getState().microcycleStats;
    useLogStore.getState().updateMicrocycleStats({
      totalVolumeKg: (prevStats.totalVolumeKg || 0) + totalVolume,
      streakDays: Math.max(1, (prevStats.streakDays || 0) + 1),
      strikeRate: `${Math.min(7, parseInt(prevStats.strikeRate?.split('/')[0] || '0', 10) + 1)} / 7`,
    });

    // 2. Dispatch finish notification & workout history log to Coach Store for daily feedback
    const athleteUser = useUserStore.getState();
    useCoachStore.getState().recordFinishedWorkout({
      id: `wlog-${Date.now()}`,
      athleteId: 'ath-current',
      athleteName: athleteUser.name || 'Vance Sterling',
      athleteAvatar: athleteUser.avatarUrl,
      title: activeTitle,
      tonnageKg: totalVolume,
      totalSets,
      totalReps,
      avgRpe: 8.5,
      durationMinutes: 45,
      completedAt: 'Just now',
      exercises: exercises.map((e) => ({
        name: e.name,
        sets: e.sets.length,
        reps: e.sets[0]?.reps || 10,
        weightKg: e.sets[0]?.weightKg || 60,
        rpe: e.sets[0]?.rpe || 8.5,
      })),
    });

    // 3. Register accurately and straight into useTelemetryHistoryStore for Workout History & 7-Day Matrix
    const now = new Date();
    const todayDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    useTelemetryHistoryStore.getState().updateDayRecord(todayDateKey, 'workout', {
      hasData: true,
      tonnageKg: totalVolume,
      completedSets: totalSets,
      durationMinutes: 45,
      routineName: activeTitle,
      intensityRpe: 8.5,
      exercises: exercises.map((e) => ({
        name: e.name || e.exerciseName || 'Exercise',
        sets: (e.sets || []).length,
        reps: e.sets?.[0]?.reps || 10,
        weightKg: e.sets?.[0]?.weightKg || e.sets?.[0]?.weight || 0,
        completed: true,
      })),
    });

    // 4. Persist to live Supabase tables completed_sessions and workout_logs
    syncSessionToSupabase({
      id: `session-${Date.now()}`,
      user_id: athleteUser.userId || 'default-athlete',
      title: activeTitle,
      duration: '45m',
      duration_seconds: 45 * 60,
      tonnage_kg: totalVolume,
      total_sets: totalSets,
      strain: Math.min(18.5, +(8.5 + (totalVolume / 1500)).toFixed(1)),
      exercises: exercises.map((e) => ({
        name: e.name || e.exerciseName || 'Exercise',
        sets: (e.sets || []).length,
        reps: e.sets?.[0]?.reps || 10,
        weightKg: e.sets?.[0]?.weightKg || e.sets?.[0]?.weight || 0,
        rpe: e.sets?.[0]?.rpe || 8.5,
      })),
    }).then((ok) => {
      if (ok) {
        notify('Cloud Sync: Session & sets archived to Supabase.');
      } else {
        notify('Offline Cache: Session saved locally and queued for Supabase.');
      }
    });

    clearActiveLog();
    setIsCommitOpen(false);
    tactileEngine.playPRCelebration();

    // 3. Advance active program day so tomorrow's workout or rest day becomes visible in both My Coach and Log dashboard
    const advanceResult = useActiveProgramStore.getState().completeTodayAndAdvance();

    if (advanceResult?.isRestDay) {
      notify(`Session Log Registered! Tomorrow is a Scheduled Rest Day: "${advanceResult?.nextDay?.title || 'Active Recovery'}".`);
    } else if (advanceResult?.nextDay?.title) {
      notify(`Session Log Registered! Next Day Loaded: "${advanceResult.nextDay.title}". Prepare ahead!`);
    } else {
      notify('Session Log Registered! Excellent performance.');
    }
  };

  const handleSaveRoutineToDay = (selectedDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun') => {
    const success = saveAthleteDayRoutine(selectedDay, '', exercises);
    handleRegisterLog();

    if (success) {
      notify(`Workout saved as repeating ${selectedDay} routine! Tomorrow's program ready.`);
    }
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-[#121214] rounded-3xl p-4 sm:p-5 border border-black/5 dark:border-white/10 shadow-sm space-y-4 text-neutral-900 dark:text-white select-none transition-colors">
        {/* Header Telemetry */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
              Active Log
            </span>
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span>
              V: <strong className="text-[#C4121A]">{totalVolume.toLocaleString()} KG</strong>
            </span>
            <span>
              S: <strong className="text-neutral-900 dark:text-neutral-100">{totalSets}</strong>
            </span>
            <span>
              R: <strong className="text-neutral-900 dark:text-neutral-100">{totalReps}</strong>
            </span>
          </div>
        </div>

        {/* Exercise Rows or Empty State */}
        {exercises.length === 0 ? (
          <div className="space-y-3">
            {/* Beginner Quick-Start Hub */}
            <div className="rounded-2xl bg-neutral-50 dark:bg-[#18181b]/60 border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#C4121A]/10 border border-[#C4121A]/30 flex items-center justify-center text-[#C4121A]">
                    <Sparkles className="w-4 h-4 text-[#C4121A]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Beginner Quick Start • 1-Tap Workouts
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                      New to lifting? Tap a proven blueprint to start immediately:
                    </p>
                  </div>
                </div>
              </div>

              {/* Starter Routine Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BEGINNER_STARTERS.map((starter, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => handleLoadBeginnerStarter(starter)}
                    className="p-3 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 hover:border-[#C4121A] transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-[#C4121A]/10 text-[#C4121A] border border-[#C4121A]/30 uppercase">
                          {starter.badge}
                        </span>
                        <span className="text-[10px] text-neutral-400 group-hover:text-[#C4121A] transition font-bold font-mono">
                          TAP TO LOAD ➔
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-neutral-900 dark:text-white leading-tight">
                        {starter.title}
                      </h5>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {starter.subtitle}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800 text-[9px] font-mono text-neutral-400 flex items-center justify-between">
                      <span>{starter.exercises.length} Exercises Queued</span>
                      <span className="text-[#C4121A] font-bold">Safe &amp; Effective</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hub prompt */}
            <div className="rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800 p-4 text-center text-neutral-500 dark:text-neutral-400 flex flex-col items-center justify-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#18181b] flex items-center justify-center text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                <Dumbbell className="w-4 h-4 text-[#C4121A]" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-neutral-800 dark:text-neutral-200 text-xs">
                  Or pick individual movements
                </p>
                <p className="text-[10px] text-neutral-500 font-mono">
                  Select any exercise from the Exercise Hub above to custom build your session.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {exercises.map((exercise) => {
              const isExpanded = expandedExerciseId === exercise.id;

              return (
                <ActiveLogExerciseAccordion
                  key={exercise.id}
                  exercise={exercise}
                  isExpanded={isExpanded}
                  onToggleExpand={() => handleToggleRow(exercise.id)}
                  onAddSet={(id) => addSet(id)}
                  onDuplicateSet={(id) => handleDuplicateSet(id)}
                  onRemoveSet={(id, setNum) => removeSet(id, setNum)}
                  onRemoveExercise={(id) => handleDeleteExercise(id)}
                  onOpenDial={(id, setNum, type, val, setId, setIndex) =>
                    handleOpenDial(id, setNum, type, val, setId, setIndex)
                  }
                  onToggleSet={(id, setNum) => toggleSetCompleted(id, setNum)}
                  onQuickUpdateSet={(id, setNum, updates) => updateExerciseSet(id, setNum, updates)}
                />
              );
            })}
          </div>
        )}

        {/* Finish & Save Session Button */}
        {exercises.length > 0 && (
          <button
            type="button"
            onClick={handleFinishAndSave}
            className="w-full py-3.5 rounded-2xl bg-[#C4121A] hover:bg-[#a50f16] active:scale-[0.99] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-[#C4121A]/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>⚡ Finish &amp; Save Session</span>
          </button>
        )}
      </div>

      {/* Rotary Dial Input Modal */}
      <DialInputModal
        isOpen={dialConfig.isOpen}
        onClose={() => setDialConfig((prev) => ({ ...prev, isOpen: false }))}
        unit={dialConfig.type === 'weight' ? 'KG' : dialConfig.type === 'reps' ? 'REPS' : 'RPE'}
        initialValue={dialConfig.initialValue}
        onConfirm={handleConfirmDial}
      />

      {/* Commit Workout Modal */}
      <CommitWorkoutModal
        isOpen={isCommitOpen}
        onClose={() => setIsCommitOpen(false)}
        onRegisterLog={handleRegisterLog}
        onSaveRoutineToDay={handleSaveRoutineToDay}
        totalKg={totalVolume}
        totalSets={totalSets}
        totalReps={totalReps}
      />
    </>
  );
};

export default ActiveLogCard;
