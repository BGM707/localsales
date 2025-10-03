import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useDatabase } from './hooks/useDatabase';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { MobileMenu } from './components/MobileMenu';
import { ThemeToggle } from './components/ThemeToggle';
import { Dashboard } from './components/Dashboard';
import { Sales } from './components/Sales';
import { Products } from './components/Products';
import { Cash } from './components/Cash';
import { Tasks } from './components/Tasks';
import { Settings } from './components/Settings';
import { Reports } from './components/Reports';
import { BarcodeScanner } from './components/BarcodeScanner';
import { Suppliers } from './components/Suppliers';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { db, loading, saveDatabase, exportDatabase, importDatabase } = useDatabase();

  const { 
    isAuthenticated, 
    currentUser, 
    loading: authLoading, 
    login, 
    logout,
    changePassword,
    createUser,
    getUsers,
    toggleUserStatus,
    deleteUser,
    getSecurityLogs,
    logSecurityEvent
  } = useAuth(db);

  const { isDark } = useTheme();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {loading ? 'Inicializando base de datos...' : 'Verificando autenticación...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={login} loading={authLoading} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard db={db} />;
      case 'sales':
        return <Sales db={db} onSave={() => saveDatabase(db)} currentUser={currentUser} />;
      case 'products':
        return <Products db={db} onSave={() => saveDatabase(db)} currentUser={currentUser} />;
      case 'inventory':
        return <Products db={db} onSave={() => saveDatabase(db)} currentUser={currentUser} />;
      case 'cash':
        return <Cash db={db} onSave={() => saveDatabase(db)} />;
      case 'suppliers':
        return <Suppliers db={db} onSave={() => saveDatabase(db)} currentUser={currentUser} />;
      case 'reports':
        return <Reports db={db} />;
      case 'scanner':
        return <BarcodeScanner db={db} onSave={() => saveDatabase(db)} />;
      case 'tasks':
        return <Tasks 
          db={db} 
          onSave={() => saveDatabase(db)} 
          currentUser={currentUser} 
          getUsers={getUsers} 
        />;
      case 'settings':
        return (
          <Settings 
            exportDatabase={exportDatabase} 
            importDatabase={importDatabase}
            currentUser={currentUser}
            getUsers={getUsers}
            createUser={createUser}
            toggleUserStatus={toggleUserStatus}
            deleteUser={deleteUser}
            changePassword={changePassword}
            getSecurityLogs={getSecurityLogs}
          />
        );
      default:
        return <Dashboard db={db} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                POS System
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={logout}
        />
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
