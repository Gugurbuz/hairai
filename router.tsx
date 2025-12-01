import React, { useState, useEffect } from 'react';

export type Route = 'patient' | 'clinic-login' | 'clinic-register' | 'clinic-dashboard' | 'admin-login' | 'admin-dashboard';

interface RouterContextType {
  currentRoute: Route;
  navigate: (route: Route) => void;
  params: Record<string, string>;
}

const RouterContext = React.createContext<RouterContextType | null>(null);

export const useRouter = () => {
  const context = React.useContext(RouterContext);
  if (!context) throw new Error('useRouter must be used within RouterProvider');
  return context;
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<Route>('patient');
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const [route, ...paramPairs] = hash.split('?');
      setCurrentRoute(route as Route);

      if (paramPairs.length > 0) {
        const queryParams: Record<string, string> = {};
        paramPairs[0].split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          queryParams[key] = decodeURIComponent(value);
        });
        setParams(queryParams);
      }
    }
  }, []);

  const navigate = (route: Route, queryParams?: Record<string, string>) => {
    let hash = `#${route}`;
    if (queryParams) {
      const query = Object.entries(queryParams)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      hash += `?${query}`;
    }
    window.location.hash = hash;
    setCurrentRoute(route);
    setParams(queryParams || {});
  };

  return (
    <RouterContext.Provider value={{ currentRoute, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Route: React.FC<{ path: Route; component: React.ComponentType }> = ({ path, component: Component }) => {
  const { currentRoute } = useRouter();
  return currentRoute === path ? <Component /> : null;
};
