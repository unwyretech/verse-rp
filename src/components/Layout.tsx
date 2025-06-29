import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useApp } from '../contexts/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { unreadNotifications } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Check if we're on messages page and if there's a selected chat
  // We'll pass this info through URL params or context
  const isMessagesPage = location.pathname === '/messages';
  
  return (
    <div className="max-w-7xl mx-auto flex min-h-screen">
      <Sidebar 
        unreadNotifications={unreadNotifications} 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        hideOnMobile={false} // We'll handle this in the Messages page itself
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