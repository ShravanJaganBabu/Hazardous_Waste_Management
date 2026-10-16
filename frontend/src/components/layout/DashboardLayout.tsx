import React from 'react';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { VoiceAlertHUD } from '../common/VoiceAlertHUD';
import { InvestigationAlertModal } from '../common/InvestigationAlertModal';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-void text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
      <NotificationDrawer />
      <VoiceAlertHUD />
      <InvestigationAlertModal />
    </div>
  );
};
