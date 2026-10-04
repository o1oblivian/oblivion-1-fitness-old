import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ExerciseItem } from '../types';

export interface ProgramDaySchedule {
  dayIndex: number;
  dayName: string; // e.g., 'Day 1', 'Day 2', 'Monday', 'Push Day'
  title: string; // e.g., 'Push Day • Chest & Shoulder Overload'
  focus: string; // e.g., 'Chest, Shoulders & Triceps'
  isRestDay: boolean;
  notes?: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weightKg: number;
    rpe: number;
    restSecs?: number;
    equipment?: string;
    targetMuscle?: string;
  }>;
}

export interface ActiveProgramState {
  hasActiveProgram: boolean;
  programId: string;
  programTitle: string;
  coachName: string;
  coachAvatar?: string;
  currentDayIndex: number; // 0-indexed day
  totalDays: number;
  schedule: ProgramDaySchedule[];
  lastCompletedDate: string | null;

  // Actions
  enrollProgram: (program: {
    id: string;
    title: string;
    coachName: string;
    coachAvatar?: string;
    schedule: ProgramDaySchedule[];
  }) => void;
  advanceToNextDay: (completedSessionTonnageKg?: number) => ProgramDaySchedule;
  completeTodayAndAdvance: () => { nextDay: ProgramDaySchedule; isRestDay: boolean };
  getCurrentDayWorkout: () => ProgramDaySchedule | null;
  getNextDayWorkout: () => ProgramDaySchedule | null;
  clearActiveProgram: () => void;
}

// Default standard Head Coach protocol & cycle
export const DEFAULT_PROGRAM_SCHEDULE: ProgramDaySchedule[] = [
  {
    dayIndex: 0,
    dayName: 'Day 1',
    title: 'Push Day • Chest & Shoulder Overload',
    focus: 'Hypertrophy (8–12 reps)',
    isRestDay: false,
    notes: '[Hypertrophy (8–12)] Control eccentric tempo. Full mechanical stretch on every rep.',
    exercises: [
      {
        name: 'Barbell Flat Bench Press',
        sets: 4,
        reps: 10,
        weightKg: 80,
        rpe: 8.5,
        restSecs: 90,
        equipment: 'barbell',
        targetMuscle: 'Chest',
      },
      {
        name: 'Incline Dumbbell Press',
        sets: 3,
        reps: 10,
        weightKg: 28,
        rpe: 8.5,
        restSecs: 90,
        equipment: 'dumbbell',
        targetMuscle: 'Upper Chest',
      },
      {
        name: 'Cable Lateral Raise (Behind Body)',
        sets: 3,
        reps: 15,
        weightKg: 12,
        rpe: 9.0,
        restSecs: 60,
        equipment: 'cable',
        targetMuscle: 'Lateral Deltoids',
      },
    ],
  },
  {
    dayIndex: 1,
    dayName: 'Day 2',
    title: 'Pull Day • Back & Posterior Chain',
    focus: 'Lat Width & Scapular Retraction',
    isRestDay: false,
    notes: 'Drive elbows into back pockets. Explosive concentric, 3-second eccentric.',
    exercises: [
      {
        name: 'Weighted Neutral Pull-Ups',
        sets: 4,
        reps: 8,
        weightKg: 15,
        rpe: 8.5,
        restSecs: 90,
        equipment: 'barbell',
        targetMuscle: 'Lats',
      },
      {
        name: 'Chest-Supported T-Bar Row',
        sets: 3,
        reps: 10,
        weightKg: 65,
        rpe: 8.5,
        restSecs: 90,
        equipment: 'barbell',
        targetMuscle: 'Upper Back',
      },
      {
        name: 'Incline Dumbbell Bicep Curl',
        sets: 3,
        reps: 12,
        weightKg: 16,
        rpe: 9.0,
        restSecs: 60,
        equipment: 'dumbbell',
        targetMuscle: 'Biceps',
      },
    ],
  },
  {
    dayIndex: 2,
    dayName: 'Day 3',
    title: 'Active Recovery & CNS Decompression',
    focus: 'Mobility, Sauna & Hydration Refill',
    isRestDay: true,
    notes: 'Scheduled Rest Day. Hydrate with electrolytes and complete 20 min tissue flossing.',
    exercises: [],
  },
  {
    dayIndex: 3,
    dayName: 'Day 4',
    title: 'Legs & Core Power Block',
    focus: 'Squat Kinematics & Quad Overload',
    isRestDay: false,
    notes: 'Parallel depth mandatory. Brace abdominal pressure throughout descent.',
    exercises: [
      {
        name: 'Barbell High-Bar Back Squat',
        sets: 4,
        reps: 8,
        weightKg: 100,
        rpe: 8.5,
        restSecs: 120,
        equipment: 'barbell',
        targetMuscle: 'Quads & Glutes',
      },
      {
        name: 'Romanian Deadlift',
        sets: 3,
        reps: 10,
        weightKg: 90,
        rpe: 8.0,
        restSecs: 90,
        equipment: 'barbell',
        targetMuscle: 'Hamstrings',
      },
      {
        name: 'Hanging Leg Raises to Bar',
        sets: 3,
        reps: 15,
        weightKg: 0,
        rpe: 8.0,
        restSecs: 60,
        equipment: 'bodyweight',
        targetMuscle: 'Core',
      },
    ],
  },
];

export const useActiveProgramStore = create<ActiveProgramState>()(
  persist(
    (set, get) => ({
      hasActiveProgram: false,
      programId: '',
      programTitle: '',
      coachName: '',
      coachAvatar: '',
      currentDayIndex: 0,
      totalDays: 0,
      schedule: [],
      lastCompletedDate: null,

      enrollProgram: (program) => {
        set({
          hasActiveProgram: true,
          programId: program.id,
          programTitle: program.title,
          coachName: program.coachName,
          coachAvatar: program.coachAvatar || 'CV',
          currentDayIndex: 0,
          totalDays: program.schedule.length,
          schedule: program.schedule,
          lastCompletedDate: null,
        });
      },

      getCurrentDayWorkout: () => {
        const { schedule, currentDayIndex, hasActiveProgram } = get();
        if (!hasActiveProgram || !schedule || schedule.length === 0) return null;
        const safeIdx = currentDayIndex % (schedule.length || 1);
        return schedule[safeIdx] || null;
      },

      getNextDayWorkout: () => {
        const { schedule, currentDayIndex, hasActiveProgram } = get();
        const activeSchedule = (schedule && schedule.length > 0) ? schedule : (hasActiveProgram ? DEFAULT_PROGRAM_SCHEDULE : []);
        if (activeSchedule.length === 0) return null;
        const nextIdx = (currentDayIndex + 1) % activeSchedule.length;
        return activeSchedule[nextIdx] || null;
      },

      advanceToNextDay: (_completedSessionTonnageKg) => {
        const { schedule, currentDayIndex } = get();
        const activeSchedule = (schedule && schedule.length > 0) ? schedule : DEFAULT_PROGRAM_SCHEDULE;
        const nextIdx = (currentDayIndex + 1) % (activeSchedule.length || 1);
        const todayStr = new Date().toISOString().split('T')[0];
        set({
          currentDayIndex: nextIdx,
          lastCompletedDate: todayStr,
        });
        return activeSchedule[nextIdx] || activeSchedule[0];
      },

      completeTodayAndAdvance: () => {
        const nextDay = get().advanceToNextDay();
        return {
          nextDay,
          isRestDay: Boolean(nextDay?.isRestDay),
        };
      },

      clearActiveProgram: () => {
        set({
          hasActiveProgram: false,
          currentDayIndex: 0,
        });
      },
    }),
    {
      name: 'o1fc_active_program_store',
    }
  )
);
