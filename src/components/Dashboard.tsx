import React, { useState, useEffect } from 'react';
import { DollarSign, Package, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

const chartColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

interface DashboardProps {
  db: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ db }) => {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    todayProfit: 0,
    lowStock: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (db) {
      loadDashboardData();
    }
  }, [db, selectedDate]);

  const loadDashboardData = () => {
    try {
      // Today's sales
      const today = new Date().toISOString().split('T')[0];
      const todaySalesResult = db.exec(`
        SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
        FROM sales 
        WHERE date(created_at) = ?
      `, [today]);
      
      const todaySales = todaySalesResult[0]?.values[0] || [0, 0];
      
      // Total products
      const productsResult = db.exec('SELECT COUNT(*) as count FROM products');
      const totalProducts = productsResult[0]?.values[0][0] || 0;
      
      // Low stock products (less than 10)
      const lowStockResult = db.exec('SELECT COUNT(*) as count FROM products WHERE stock < 10');
      const lowStock = lowStockResult[0]?.values[0][0] || 0;
      
      // Calculate today's profit
      const profitResult = db.exec(`
        SELECT s.items, s.total
        FROM sales s
        WHERE date(s.created_at) = ?
      `, [today]);
      
      let todayProfit = 0;
      if (profitResult[0]?.values) {
        profitResult[0].values.forEach(([items, total]: [string, number]) => {
          try {
            const saleItems = JSON.parse(items);
            saleItems.forEach((item: any) => {
              const productResult = db.exec('SELECT cost FROM products WHERE id = ?', [item.id]);
              if (productResult[0]?.values[0]) {
                const cost = productResult[0].values[0][0] as number;
                todayProfit += (item.price - cost) * item.quantity;
              }
            });
          } catch (e) {
            console.error('Error parsing sale items:', e);
          }
        });
      }
      
      setStats({
        todaySales: todaySales[0] as number,
        totalProducts: totalProducts as number,
        todayProfit,
        lowStock: lowStock as number
      });
      
      // Weekly sales data
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const weeklyData = weekDays.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayResult = db.exec(`
          SELECT COALESCE(SUM(total), 0) as total
          FROM sales 
          WHERE date(created_at) = ?
        `, [dayStr]);
        
        return {
          day: format(day, 'dd/MM'),
          sales: dayResult[0]?.values[0][0] || 0
        };
      });
      
      setSalesData(weeklyData);
      
      // Top products
      const topProductsResult = db.exec(`
        SELECT p.name, SUM(json_extract(value, '$.quantity')) as sold
        FROM sales s, json_each(s.items) j
        JOIN products p ON p.id = json_extract(value, '$.id')
        WHERE date(s.created_at) >= date('now', '-30 days')
        GROUP BY p.id, p.name
        ORDER BY sold DESC
        LIMIT 5
      `);
      
      const topProductsData = topProductsResult[0]?.values?.map(([name, sold]) => ({
        name: name as string,
        sold: sold as number
      })) || [];
      
      setTopProducts(topProductsData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Resumen de tu negocio</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ventas Hoy</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">${stats.todaySales.toFixed(2)}</p>
            </div>
            <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Productos</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProducts}</p>
            </div>
            <Package className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ganancia Hoy</p>
              <p className="text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">${stats.todayProfit.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Stock Bajo</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">{stats.lowStock}</p>
            </div>
            <ShoppingBag className="w-6 h-6 lg:w-8 lg:h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Sales Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Ventas de la Semana</h2>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gray-900 dark:text-white">Productos Más Vendidos</h2>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  stroke="#6b7280" 
                  fontSize={10}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} 
                />
                <Bar dataKey="sold" fill="#059669">
                  {topProducts.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Calendar Section */}
      <div className="mt-6 lg:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Calendario de Ventas</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 opacity-50" />
          <p>Selecciona una fecha para ver las ventas del día</p>
        </div>
      </div>
    </div>
  );
};