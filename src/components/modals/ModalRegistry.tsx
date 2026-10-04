import React from 'react';
import { useModalStore } from './useModalStore';

// Modal component imports
import { SettingsModal } from '../SettingsModal';
import { SolidarityTrackerModal } from '../../features/workout/components/SolidarityTrackerModal';
import { EliteReelsHub } from '../../features/reels/EliteReelsHub';
import { CardioTelemetryModal } from '../../features/workout/components/CardioTelemetryModal';
import { ProgramDetailModal } from '../../features/workout/components/ProgramDetailModal';
import { RoutineSwapperModal } from '../../features/workout/components/RoutineSwapperModal';
import { HydrationIntelligenceModal } from '../../features/workout/components/HydrationIntelligenceModal';
import { BioSyncIntelligenceModal as BioSyncModal } from '../../features/workout/components/BioSyncIntelligenceModal';
import { SupplementTimingModal } from '../../features/workout/components/SupplementTimingModal';
import { ProgramReelsModal } from './ProgramReelsModal';
import { AIMealScanModal } from '../AIMealScanModal';

import {
  CardioScannerPayload,
  MealScannerPayload,
  TravelPassPayload,
  ExerciseSwapperPayload,
  HydrationPayload,
  BioSyncPayload,
  GenericToastPayload,
  ProgramReelsStoryPayload,
} from './types';

/**
 * Unified Modal Registry
 * Renders the active modal based on centralized store state.
 * Eliminates prop drilling and bloated layout states while preserving 100% visual parity and animations.
 */
export const ModalRegistry: React.FC = () => {
  const { activeModal, payload, closeModal } = useModalStore();

  if (!activeModal) return null;

  return (
    <>
      {/* 1. Settings Modal */}
      <SettingsModal
        isOpen={activeModal === 'SETTINGS'}
        onClose={closeModal}
        onShowToast={(payload as GenericToastPayload)?.onShowToast}
      />

      {/* 2. Biometric Sheet (SolidarityTrackerModal) */}
      <SolidarityTrackerModal
        isOpen={activeModal === 'BIOMETRIC_SHEET'}
        onClose={closeModal}
        onShowToast={(payload as GenericToastPayload)?.onShowToast}
      />

      {/* 3. Full Elite Reels Modal (EliteReelsHub) */}
      <EliteReelsHub
        isOpen={activeModal === 'FULL_ELITE_REELS'}
        onClose={closeModal}
      />

      {/* 4. Cardio Scanner Modal (CardioTelemetryModal) */}
      <CardioTelemetryModal
        isOpen={activeModal === 'CARDIO_SCANNER'}
        onClose={closeModal}
        onPostCardio={(data) => {
          const cb = (payload as CardioScannerPayload)?.onPostCardio;
          if (cb) {
            cb({
              type: data.deviceType === 'watch' ? 'Smartwatch Pedometer' : 'Console Telemetry',
              calories: data.caloriesBurned || 0,
              durationMins: data.elapsedMinutes != null ? Math.max(1, Math.round(data.elapsedMinutes)) : 0,
              avgHr: data.avgHeartRateBpm || 0,
              steps: data.steps || (data.distanceKm != null ? Math.round(data.distanceKm * 1312) : 0),
            });
          }
          closeModal();
        }}
      />

      {/* 4B. Gemini 2.5 Flash Meal Scanner Modal (AIMealScanModal) */}
      <AIMealScanModal
        isOpen={activeModal === 'MEAL_SCANNER'}
        onClose={closeModal}
        targetSlot={(payload as MealScannerPayload)?.defaultSlot}
        defaultSlot={(payload as MealScannerPayload)?.defaultSlot}
        onConfirmMeal={(name, kcal, p, c, f) => {
          const cb = (payload as MealScannerPayload)?.onConfirmMeal;
          if (cb) cb(name, kcal, p, c, f);
          closeModal();
        }}
      />

      {/* 5. Travel Pass / Program Detail Modal (ProgramDetailModal) */}
      <ProgramDetailModal
        isOpen={activeModal === 'TRAVEL_PASS'}
        onClose={closeModal}
        programTitle={(payload as TravelPassPayload)?.programTitle || 'BOOTY BUILDER'}
        onLoadWorkouts={(title) => {
          const cb = (payload as TravelPassPayload)?.onLoadWorkouts;
          if (cb) cb(title);
          closeModal();
        }}
      />

      {/* 6. Exercise Swapper Modal (RoutineSwapperModal) */}
      <RoutineSwapperModal
        isOpen={activeModal === 'EXERCISE_SWAPPER'}
        onClose={closeModal}
        activePreset={(payload as ExerciseSwapperPayload)?.activePreset || 'Functional Hypertrophy'}
        onSelectPreset={(preset) => {
          const cb = (payload as ExerciseSwapperPayload)?.onSelectPreset;
          if (cb) cb(preset);
          closeModal();
        }}
      />

      {/* 7. Hydration Intelligence Modal */}
      <HydrationIntelligenceModal
        isOpen={activeModal === 'HYDRATION'}
        onClose={closeModal}
        currentLiters={(payload as HydrationPayload)?.currentLiters ?? 0}
        onAddLiters={(amount) => {
          const cb = (payload as HydrationPayload)?.onAddLiters;
          if (cb) cb(amount);
        }}
      />

      {/* 8. BioSync Cycle Tracking Modal */}
      <BioSyncModal
        isOpen={activeModal === 'BIO_SYNC'}
        onClose={closeModal}
        onAutoRegulate={() => {
          const cb = (payload as BioSyncPayload)?.onAutoAdjust;
          if (cb) cb();
          closeModal();
        }}
      />

      {/* 9. Supplement Timing Modal */}
      <SupplementTimingModal
        isOpen={activeModal === 'SUPPLEMENTS'}
        onClose={closeModal}
        onShowToast={(payload as GenericToastPayload)?.onShowToast}
      />

      {/* 10. Program Reels Story Viewer Modal */}
      <ProgramReelsModal
        isOpen={activeModal === 'PROGRAM_REELS_STORY'}
        onClose={closeModal}
        initialStoryId={(payload as ProgramReelsStoryPayload)?.initialStoryId}
        onAdoptBlueprint={(title) => {
          const cb = (payload as ProgramReelsStoryPayload)?.onAdoptBlueprint;
          if (cb) cb(title);
        }}
      />
    </>
  );
};
