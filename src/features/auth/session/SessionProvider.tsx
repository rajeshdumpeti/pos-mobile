import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

import { NavigationAccessProvider } from '@/navigation/NavigationAccessProvider';

import { productionSessionState, SessionState, sessionToNavigationAccess } from './sessionState';
import { useAuthenticationCapabilities } from '../integration/AuthenticationIntegrationProvider';

const SessionContext = createContext<SessionState>(productionSessionState);

export function SessionProvider({
  children,
  state,
}: React.PropsWithChildren<{ state?: SessionState }>) {
  if (state) return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
  return <LiveSessionProvider>{children}</LiveSessionProvider>;
}

function LiveSessionProvider({ children }: React.PropsWithChildren) {
  const { session } = useAuthenticationCapabilities();
  const liveState = useSyncExternalStore(session.subscribe, session.getState, session.getState);
  useEffect(() => {
    void session.initialize();
  }, [session]);
  return <SessionContext.Provider value={liveState}>{children}</SessionContext.Provider>;
}

export function SessionNavigationAccess({ children }: React.PropsWithChildren) {
  const session = useSession();
  return (
    <NavigationAccessProvider status={sessionToNavigationAccess(session)}>
      {children}
    </NavigationAccessProvider>
  );
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
