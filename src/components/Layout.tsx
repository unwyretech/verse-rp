import React from 'react';
import Sidebar from './Sidebar';
import { useApp } from '../contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { unreadNotifications } = useApp();

  return (
    <div className="max-w-7xl mx-auto flex min-h-screen">
      <Sidebar unreadNotifications={unreadNotifications} />
      <main className="flex-1 max-w-2xl border-x border-gray-700/50">
        {children}
      </main>
      <div className="w-80 h-screen sticky top-0 p-6 bg-black/20 backdrop-blur-sm">
        {/* Right sidebar content can be added here */}
      </div>
    </div>
  );
};

export default Layout;