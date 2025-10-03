import React from 'react';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { User } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  BarChart3, 
  Settings, 
  CheckSquare,
  Archive,
  FileText,
  Scan,
  Truck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Ventas', icon: ShoppingCart },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'inventory', label: 'Inventario', icon: Archive },
  { id: 'scanner', label: 'Escáner', icon: Scan },
  { id: 'cash', label: 'Caja', icon: DollarSign },
  { id: 'suppliers', label: 'Proveedores', icon: Truck },
  { id: 'reports', label: 'Reportes', icon: FileText },
  { id: 'tasks', label: 'Tareas', icon: CheckSquare },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">POS System</h1>
          <ThemeToggle />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Punto de Venta</p>
      </div>
      
      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser.role === 'admin' ? 'Administrador' : 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <nav className="flex-1 pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-400 dark:text-gray-500 text-xs text-center">
          © 2025 POS System v1.0
        </p>
      </div>
    </div>
  );
};