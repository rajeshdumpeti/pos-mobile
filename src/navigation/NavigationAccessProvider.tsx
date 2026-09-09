import React, { createContext, useContext } from 'react';

import type { NavigationAccessStatus } from './navigationPolicy';

const NavigationAccessContext = createContext<NavigationAccessStatus>('signedOut');

export function NavigationAccessProvider({
  children,
  status = 'signedOut',
}: React.PropsWithChildren<{ status?: NavigationAccessStatus }>) {
  return (
    <NavigationAccessContext.Provider value={status}>{children}</NavigationAccessContext.Provider>
  );
}

export function useNavigationAccess(): NavigationAccessStatus {
  return useContext(NavigationAccessContext);
}
