import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useApp } from '../contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { unreadNotifications } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto flex min-h-screen">
      <Sidebar 
        unreadNotifications={unreadNotifications} 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 max-w-2xl border-x border-gray-700/50 md:ml-0">
        {children}
      </main>
      <div className="hidden lg:block w-80 h-screen sticky top-0 p-6 bg-black/20 backdrop-blur-sm">
        {/* Right sidebar content can be added here */}
      </div>
    </div>
  );
};

export default Layout;