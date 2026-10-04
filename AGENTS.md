# Oblivion 1 Fitness Club - Engineering Standards & Operational Directives

## Architecture & Code Quality Directives (Grade A+ Senior Standards)
All future agents and contributors MUST adhere strictly to these rules:

1. **Single Genuine Application (100% Clean)**:
   - Absolutely NO secondary, mock, demo, or placeholder apps.
   - All tabs in the main layout (`Workout`, `Fuel`, `Radar`, `Coach`, `Log`) connect directly to production feature modules in `/src/features/`.
   - Never introduce speculative frameworks, dummy sidebars, or mock views.

2. **Dual-Theme Support & Natural Organic Colors (Zero Neon)**:
   - Full dual-theme architecture supporting both Light mode and Dark OLED tactical mode.
   - Natural, organic athletic palette: Zero neon, no electric glows or over-saturated radiants.
   - Page Canvas: `bg-[#F4F4F7] dark:bg-[#09090b]`.
   - Card Surfaces: `bg-white dark:bg-[#121214]`.
   - Inner Wells & Inputs: `bg-neutral-100 dark:bg-[#18181b] border-neutral-200 dark:border-neutral-800`.
   - Structural Borders: `border-neutral-200 dark:border-neutral-800` (or `border-black/5 dark:border-white/10`).
   - High-Contrast Accents: Oblivion 1 Crimson `#C4121A` (hover `#A30F16`, active `#800C11`, glow/border `rgba(196, 18, 26, 0.4)`), slate blue `#0284c7`, natural amber `#d97706`/`#f59e0b`, natural emerald `#059669`/`#10b981`.
   - Text Palette: `text-neutral-900 dark:text-white` for primary copy, `text-neutral-600 dark:text-neutral-400` for secondary metadata.
   - Navigation Dock: Adaptive frosted backdrop with clean active crimson state and high-contrast inactive icons.
   - Visual Assets: High-contrast hero media, colored badges, and tactile dials maintained with sharp contrast across both themes.

3. **Single Source of Truth State Management**:
   - Workout and telemetry operations must bind cleanly through Zustand stores.
   - No split-brain state or duplicate mutations.
   - All numerical inputs (KG, Reps, RPE, RIR) must update metrics reactively and mathematically.

4. **Code Quality & Build Verification**:
   - Zero TypeScript compilation errors (`tsc --noEmit` must pass cleanly).
   - Zero unused imports or dead variable references.
   - All interactive controls (buttons, inputs, sliders, toggles) must have complete, robust event handlers.

5. **Android Production Baseline & Permission Lockdown (Version 69 Golden Baseline)**:
   - `android/app/src/main/AndroidManifest.xml` on `main` is the locked golden baseline. Never revert, overwrite, or mutate it without explicit instructions.
   - STRICT FORBIDDEN PERMISSIONS (Never add under any circumstance):
     * `android.permission.READ_MEDIA_IMAGES`
     * `android.permission.RECORD_AUDIO`
     * `android.permission.MODIFY_AUDIO_SETTINGS`
     * `android.permission.ACTIVITY_RECOGNITION`
     * `android.permission.BODY_SENSORS`
   - ONLY PERMITTED PERMISSIONS:
     * `android.permission.INTERNET`
     * `android.permission.CAMERA`
     * `android.permission.BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_SCAN` (`neverForLocation`), `BLUETOOTH_CONNECT`

6. **Permanent Rule (Optical Vision Engine)**:
   - Optical Vision Engine must return `null` for non-visible metrics on watches and gym consoles. Never apply zero or estimated fallbacks. Unread metrics must render as '--'.
