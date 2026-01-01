'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpenState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setCollapsedState(saved === 'true');
    }
  }, []);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    localStorage.setItem('sidebar_collapsed', String(value));
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const setMobileOpen = (value: boolean) => {
    console.log('[Context] setMobileOpen called with:', value);
    setMobileOpenState(value);
  };

  const toggleMobile = () => {
    console.log('[Context] toggleMobile called, current:', mobileOpen, 'will set to:', !mobileOpen);
    setMobileOpenState(!mobileOpen);
  };

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // During SSR and initial hydration, return default state
  // This prevents hydration mismatch
  const value = {
    collapsed: mounted ? collapsed : false,
    setCollapsed,
    toggleCollapsed,
    mobileOpen: mounted ? mobileOpen : false,
    setMobileOpen,
    toggleMobile,
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

