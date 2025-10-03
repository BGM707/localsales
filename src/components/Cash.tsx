import React, { useState, useEffect } from 'react';
import { Plus, Minus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { CashMovement } from '../hooks/useDatabase';

interface CashProps {
  db: any;
  onSave: () => void;
}

export const Cash: React.FC<CashProps> = ({ db, onSave }) => {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ingreso' as 'ingreso' | 'salida',
    amount: '',
    description: ''
  });
  const [dailyBalance, setDailyBalance] = useState({
    ingresos: 0,
    salidas: 0,
    balance: 0,
    ventas: 0
  });

  useEffect(() => {
    if (db) {
      loadMovements();
      loadDailyBalance();
    }
  }, [db]);

  const loadMovements = () => {
    try {
      const result = db.exec(`
        SELECT id, type, amount, description, created_at
        FROM cash_movements
        WHERE date(created_at) = date('now')
        ORDER BY created_at DESC
      `);
      
      if (result[0]?.values) {
        const movementsData = result[0].values.map((row: any) => ({
          id: row[0],
          type: row[1],
          amount: row[2],
          description: row[3],
          created_at: row[4]
        }));
        setMovements(movementsData);
      }
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const loadDailyBalance = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get cash movements
      const movementsResult = db.exec(`
        SELECT type, COALESCE(SUM(amount), 0) as total
        FROM cash_movements
        WHERE date(created_at) = ?
        GROUP BY type
      `, [today]);
      
      let ingresos = 0;
      let salidas = 0;
      
      if (movementsResult[0]?.values) {
        movementsResult[0].values.forEach(([type, amount]: [string, number]) => {
          if (type === 'ingreso') ingresos = amount;
          if (type === 'salida') salidas = amount;
        });
      }
      
      // Get sales
      const salesResult = db.exec(`
        SELECT COALESCE(SUM(total), 0) as ventas
        FROM sales
        WHERE date(created_at) = ?
      `, [today]);
      
      const ventas = salesResult[0]?.values[0][0] || 0;
      
      setDailyBalance({
        ingresos,
        salidas,
        balance: ingresos - salidas + ventas,
        ventas
      });
      
    } catch (error) {
      console.error('Error loading daily balance:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      db.run(
        'INSERT INTO cash_movements (type, amount, description) VALUES (?, ?, ?)',
        [formData.type, parseFloat(formData.amount), formData.description]
      );
      
      onSave();
      setFormData({ type: 'ingreso', amount: '', description: '' });
      setShowForm(false);
      loadMovements();
      loadDailyBalance();
    } catch (error) {
      console.error('Error saving movement:', error);
      alert('Error al guardar el movimiento');
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Caja Diaria</h1>
            <p className="text-gray-600 dark:text-gray-300">Gestiona los ingresos y salidas de efectivo</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>

        {/* Daily Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Ventas del Día</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${dailyBalance.ventas.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresos Extra</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${dailyBalance.ingresos.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Salidas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">${dailyBalance.salidas.toFixed(2)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Balance Total</p>
                <p className={`text-2xl font-bold ${
                  dailyBalance.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  ${dailyBalance.balance.toFixed(2)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${
                dailyBalance.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Movements List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Movimientos de Hoy</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hora</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {movements.map(movement => (
                <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      movement.type === 'ingreso' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {movement.type === 'ingreso' ? (
                        <Plus className="w-3 h-3 mr-1" />
                      ) : (
                        <Minus className="w-3 h-3 mr-1" />
                      )}
                      {movement.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      movement.type === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${movement.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{movement.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(movement.created_at), 'HH:mm')}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No hay movimientos registrados hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nuevo Movimiento</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'ingreso' }))}
                      className={`p-3 border rounded-lg flex items-center justify-center ${
                        formData.type === 'ingreso' 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'salida' }))}
                      className={`p-3 border rounded-lg flex items-center justify-center ${
                        formData.type === 'salida' 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      Salida
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ type: 'ingreso', amount: '', description: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-md ${
                    formData.type === 'ingreso' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};