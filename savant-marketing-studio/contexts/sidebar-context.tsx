'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setStorageItem, getStorageItemSync } from '@/lib/utils/async-storage';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true);
    // Use sync version on mount to avoid flash
    const saved = getStorageItemSync<string>('sidebar_collapsed');
    if (saved !== null) {
      setCollapsedState(saved === 'true');
    }
  }, []);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    // Use async version for updates (non-blocking)
    setStorageItem('sidebar_collapsed', String(value));
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // During SSR and initial hydration, return default state
  // This prevents hydration mismatch
  const value = {
    collapsed: mounted ? collapsed : false,
    setCollapsed,
    toggleCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

