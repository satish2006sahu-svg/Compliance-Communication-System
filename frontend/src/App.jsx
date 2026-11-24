import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AdminDashboard from './pages/admin/Dashboard';
import History from './pages/admin/History';
import SystemStatus from './pages/admin/SystemStatus';
import EmployeeDashboard from './pages/employee/Dashboard';
import FaqsView from './pages/employee/FaqsView';
import Chatbot from './pages/employee/Chatbot';

function MainApp() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatbotQuery, setChatbotQuery] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-teal-accent/30 border-t-teal-accent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-text-secondary">Initializing ReguComply AI...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleOpenChatbot = (query = '') => {
    setChatbotQuery(query);
    setActiveTab('chatbot');
  };

  return (
    <div className="min-h-screen bg-bg-light flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {isAdmin ? (
              <>
                {activeTab === 'dashboard' && (
                  <AdminDashboard
                    onNavigateToHistory={() => setActiveTab('history')}
                  />
                )}
                {activeTab === 'history' && <History />}
                {activeTab === 'system' && <SystemStatus />}
              </>
            ) : (
              <>
                {activeTab === 'dashboard' && <EmployeeDashboard onOpenChatbot={() => handleOpenChatbot()} />}
                {activeTab === 'faqs' && <FaqsView onAskInChatbot={(q) => handleOpenChatbot(q)} />}
                {activeTab === 'chatbot' && <Chatbot initialQuery={chatbotQuery} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
