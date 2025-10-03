import React, { useRef } from 'react';
import { Download, Upload, Database, Shield, AlertTriangle } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { User } from '../hooks/useAuth';

interface SettingsProps {
  exportDatabase: () => void;
  importDatabase: (file: File) => Promise<any>;
  currentUser: User;
  getUsers: () => User[];
  createUser: (username: string, password: string, role: 'admin' | 'user') => Promise<boolean>;
  deleteUser: (userId: number) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  exportDatabase, 
  importDatabase, 
  currentUser,
  getUsers,
  createUser,
  toggleUserStatus,
  deleteUser,
  changePassword,
  getSecurityLogs
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = React.useState('database');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (confirm('¿Estás seguro? Esta acción reemplazará toda la base de datos actual.')) {
        importDatabase(file)
          .then(() => {
            alert('Base de datos importada exitosamente');
            window.location.reload();
          })
          .catch((error) => {
            console.error('Error importing database:', error);
            alert('Error al importar la base de datos');
          });
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">Gestiona usuarios, base de datos y configuraciones del sistema</p>
      </div>

      {/* Section Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSection('database')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'database'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Base de Datos
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Usuarios
            </button>
          </nav>
        </div>
      </div>

      {activeSection === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Database Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <Database className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Gestión de Base de Datos</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Exportar Base de Datos</h3>
                  <p className="text-sm text-gray-500">Descarga una copia de seguridad de tus datos</p>
                </div>
                <button
                  onClick={exportDatabase}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Importar Base de Datos</h3>
                  <p className="text-sm text-gray-500">Restaura desde un archivo de respaldo</p>
                  <div className="flex items-center mt-1 text-yellow-700">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="text-xs">Esta acción reemplazará todos los datos actuales</span>
                  </div>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sqlite,.db"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Información del Sistema</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Versión</p>
                  <p className="font-medium">POS System v1.0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Base de Datos</p>
                  <p className="font-medium">SQLite Local</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Almacenamiento</p>
                  <p className="font-medium">Local Storage</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                    Activo
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Características</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Base de datos SQLite local</li>
                <li>• Exportación/Importación de datos</li>
                <li>• Gestión completa de inventario</li>
                <li>• Sistema de ventas integrado</li>
                <li>• Reportes y analytics</li>
                <li>• Gestión de tareas</li>
                <li>• Backup automático</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeSection === 'users' && (
        <UserManagement
          currentUser={currentUser}
          getUsers={getUsers}
          createUser={createUser}
          toggleUserStatus={toggleUserStatus}
          deleteUser={deleteUser}
          changePassword={changePassword}
          getSecurityLogs={getSecurityLogs}
        />
      )}

      {/* Usage Instructions */}
      {activeSection === 'database' && (
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Instrucciones de Uso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Exportar Datos</h3>
            <p className="text-sm text-gray-600 mb-2">
              Para crear una copia de seguridad de tus datos:
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Haz clic en el botón "Exportar"</li>
              <li>El archivo .sqlite se descargará automáticamente</li>
              <li>Guarda el archivo en un lugar seguro</li>
            </ol>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Importar Datos</h3>
            <p className="text-sm text-gray-600 mb-2">
              Para restaurar desde una copia de seguridad:
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Haz clic en el botón "Importar"</li>
              <li>Selecciona tu archivo .sqlite</li>
              <li>Confirma la acción</li>
              <li>El sistema se recargará automáticamente</li>
            </ol>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};