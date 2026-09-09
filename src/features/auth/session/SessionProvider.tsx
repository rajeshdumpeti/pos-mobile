import React, { createContext, useContext } from 'react';

import { NavigationAccessProvider } from '@/navigation/NavigationAccessProvider';

import { productionSessionState, SessionState, sessionToNavigationAccess } from './sessionState';

const SessionContext = createContext<SessionState>(productionSessionState);

export function SessionProvider({
  children,
  state = productionSessionState,
}: React.PropsWithChildren<{ state?: SessionState }>) {
  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
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
