import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { MainAppLayout } from './MainAppLayout';
import { useThemeStore } from './stores/useThemeStore';
import { useAuthStore } from './stores/useAuthStore';
import { initMidnightRolloverListener } from './utils/midnightRollover';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AuthProvider } from './context/AuthContext';
import { ClubPassPaywallModal } from './features/membership/components/ClubPassPaywallModal';
import { ProAccessModal } from './components/modals/ProAccessModal';
import { OnboardingCoordinator } from './features/onboarding/OnboardingCoordinator';
import { revenueCatService } from './services/revenueCatService';
import { tactileEngine } from './services/tactileEngine';
import { safeStorage } from './utils/safeStorage';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProAccess, setShowProAccess] = useState(false);
  const [membershipSuccessBanner, setMembershipSuccessBanner] = useState(false);

  useEffect(() => {
    useThemeStore.getState().initTheme();
    useAuthStore.getState().initialize();
    const cleanupRollover = initMidnightRolloverListener();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success' || params.get('payment') === 'success') {
        setMembershipSuccessBanner(true);
        revenueCatService.getCustomerEntitlements().catch(() => null);
        tactileEngine.playPRCelebration();
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Pure client-side routing guard: prevent full-page server roundtrips & preserve auth state
      const handleGlobalLinkClicks = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement)?.closest('a');
        if (!anchor) return;
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('blob:') || anchor.hasAttribute('download') || anchor.getAttribute('target') === '_blank') return;
        let path = href;
        if (path.startsWith(window.location.origin)) path = path.slice(window.location.origin.length);
        else if (path.startsWith('http://') || path.startsWith('https://')) return;

        e.preventDefault();
        const tabTarget = path.replace(/^#\/?/, '').replace(/^\//, '').toLowerCase();
        if (tabTarget === 'dashboard' || tabTarget === 'tracker' || tabTarget === 'workout') {
          window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: 'tracker' }));
          window.history.pushState(null, '', '#workout');
        } else if (tabTarget) {
          window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: tabTarget }));
          window.history.pushState(null, '', `#${tabTarget}`);
        }
      };
      window.addEventListener('click', handleGlobalLinkClicks);

      // In-app popstate & hash change listener for flawless client-side back/forward transitions
      const handlePopState = () => {
        const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
        if (raw) {
          const target = (raw === 'dashboard' || raw === 'workout') ? 'tracker' : raw;
          window.dispatchEvent(new CustomEvent('app_navigate_tab', { detail: target }));
        }
      };
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('hashchange', handlePopState);

      const isCompleted = safeStorage.getItem('o1fc_onboarding_completed') === 'true' || safeStorage.getItem('olfc_onboarding_completed') === 'true';
      if (!isCompleted) safeStorage.setItem('o1fc_onboarding_completed', 'true');

      const handleRelaunch = () => setShowOnboarding(true);
      window.addEventListener('o1fc_relaunch_onboarding', handleRelaunch);
      window.addEventListener('o1fc_account_deleted', handleRelaunch);

      return () => {
        cleanupRollover();
        window.removeEventListener('click', handleGlobalLinkClicks);
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('hashchange', handlePopState);
        window.removeEventListener('o1fc_relaunch_onboarding', handleRelaunch);
        window.removeEventListener('o1fc_account_deleted', handleRelaunch);
      };
    }
    return () => cleanupRollover();
  }, []);

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <MainAppLayout />
        <ClubPassPaywallModal />
        <ProAccessModal isOpen={showProAccess} onClose={() => setShowProAccess(false)} />
        {showOnboarding && (
          <OnboardingCoordinator
            onComplete={() => {
              setShowOnboarding(false);
              setShowProAccess(true);
            }}
          />
        )}
        {membershipSuccessBanner && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-[#080808] border border-[#D4AF37] rounded-2xl p-4 shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#F5D061] shrink-0" />
              <div>
                <p className="text-xs font-tactical font-black text-white uppercase tracking-wider">MEMBERSHIP ACTIVATED</p>
                <p className="text-[10px] font-mono text-[#D4AF37]">REVENUECAT IN-APP PURCHASE VERIFIED</p>
              </div>
            </div>
            <button onClick={() => setMembershipSuccessBanner(false)} className="p-1 text-neutral-400 hover:text-white rounded-full cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </SubscriptionProvider>
    </AuthProvider>
  );
}
