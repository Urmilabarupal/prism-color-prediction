import React from 'react';
import { ManagerProvider, useManager } from './ManagerContext.js';
import { ManagerLoginView } from './ManagerLoginView.js';
import { ManagerLayout } from './ManagerLayout.js';

interface ManagerPortalAppProps {
  onSwitchToUserApp: () => void;
}

const ManagerInnerPortal: React.FC<ManagerPortalAppProps> = ({ onSwitchToUserApp }) => {
  const { isAuthenticated, loading } = useManager();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-amber-500 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>AUTHENTICATING MANAGER IDENTITY...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ManagerLoginView onBackToUserApp={onSwitchToUserApp} />;
  }

  return <ManagerLayout onSwitchToUserApp={onSwitchToUserApp} />;
};

export const ManagerPortalApp: React.FC<ManagerPortalAppProps> = ({ onSwitchToUserApp }) => {
  return (
    <ManagerProvider>
      <ManagerInnerPortal onSwitchToUserApp={onSwitchToUserApp} />
    </ManagerProvider>
  );
};
