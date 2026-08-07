import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { appConfig } from '../config/env';
import { demoData } from '../mock/demo';
import { DemoData, Item } from '../types';

type Context = {
  data: DemoData; offline: boolean;
  toggle: (group: keyof Pick<DemoData, 'tasks' | 'timeline' | 'priorities'>, id: string) => void;
  add: (group: keyof Pick<DemoData, 'tasks' | 'meals' | 'transactions'>, item: Item) => void;
  reset: () => void;
};
const AppContext = createContext<Context | null>(null);

export function AppProvider({ children }: React.PropsWithChildren) {
  const [data, setData] = useState(demoData);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const controller = new AbortController();

    fetch(`${appConfig.apiUrl}/dashboard`, { signal: controller.signal })
      .then(response => (response.ok ? response.json() : Promise.reject()))
      .then(() => setOffline(false))
      .catch(() => {
        if (!controller.signal.aborted) {
          setOffline(true);
        }
      });

    return () => controller.abort();
  }, []);
  const value = useMemo<Context>(() => ({
    data, offline,
    toggle: (group, id) => setData(d => ({ ...d, [group]: d[group].map(x => x.id === id ? { ...x, done: !x.done } : x) })),
    add: (group, item) => setData(d => ({ ...d, [group]: [item, ...d[group]] })),
    reset: () => setData(demoData),
  }), [data, offline]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export const useApp = () => {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be inside AppProvider');
  return value;
};
