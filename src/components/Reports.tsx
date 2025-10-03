import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, DollarSign, TrendingUp, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface ReportsProps {
  db: any;
}

export const Reports: React.FC<ReportsProps> = ({ db }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    reportType: 'sales',
    includeDetails: true,
    groupBy: 'day'
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (db) {
      generateReport();
    }
  }, [db, filters]);

  const generateReport = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      
      switch (filters.reportType) {
        case 'sales':
          data = await generateSalesReport();
          break;
        case 'products':
          data = await generateProductsReport();
          break;
        case 'profits':
          data = await generateProfitsReport();
          break;
        case 'inventory':
          data = await generateInventoryReport();
          break;
        case 'cash':
          data = await generateCashReport();
          break;
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSalesReport = async () => {
    const result = db.exec(`
      SELECT 
        s.id,
        s.total,
        s.payment_method,
        s.created_at,
        s.items
      FROM sales s
      WHERE date(s.created_at) BETWEEN ? AND ?
      ORDER BY s.created_at DESC
    `, [filters.dateFrom, filters.dateTo]);

    if (!result[0]?.values) return [];

    return result[0].values.map((row: any) => {
      const items = JSON.parse(row[4] || '[]');
      const itemsText = items.map((item: any) => `${item.name} (${item.quantity})`).join(', ');
      
      return {
        'ID Venta': row[0],
        'Total': `$${row[1].toFixed(2)}`,
        'Método de Pago': row[2],
        'Fecha': format(new Date(row[3]), 'dd/MM/yyyy HH:mm'),
        'Productos': itemsText,
        'Cantidad Items': items.length
      };
    });
  };

  const generateProductsReport = async () => {
    const result = db.exec(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.cost,
        p.stock,
        COALESCE(sold.quantity, 0) as sold_quantity,
        COALESCE(sold.revenue, 0) as revenue
      FROM products p
      LEFT JOIN (
        SELECT 
          json_extract(value, '$.id') as product_id,
          SUM(json_extract(value, '$.quantity')) as quantity,
          SUM(json_extract(value, '$.quantity') * json_extract(value, '$.price')) as revenue
        FROM sales s, json_each(s.items)
        WHERE date(s.created_at) BETWEEN ? AND ?
        GROUP BY json_extract(value, '$.id')
      ) sold ON p.id = sold.product_id
      ORDER BY sold_quantity DESC
    `, [filters.dateFrom, filters.dateTo]);

    if (!result[0]?.values) return [];

    return result[0].values.map((row: any) => ({
      'ID': row[0],
      'Producto': row[1],
      'Categoría': row[2],
      'Precio': `$${row[3].toFixed(2)}`,
      'Costo': `$${row[4].toFixed(2)}`,
      'Stock Actual': row[5],
      'Cantidad Vendida': row[6],
      'Ingresos': `$${row[7].toFixed(2)}`,
      'Margen': `$${(row[3] - row[4]).toFixed(2)}`
    }));
  };

  const generateProfitsReport = async () => {
    const result = db.exec(`
      SELECT 
        date(s.created_at) as sale_date,
        SUM(s.total) as total_sales,
        s.items
      FROM sales s
      WHERE date(s.created_at) BETWEEN ? AND ?
      GROUP BY date(s.created_at)
      ORDER BY sale_date DESC
    `, [filters.dateFrom, filters.dateTo]);

    if (!result[0]?.values) return [];

    const profitData = [];
    
    for (const row of result[0].values) {
      const saleDate = row[0];
      const totalSales = row[1];
      
      // Calculate costs for this date
      const salesResult = db.exec(`
        SELECT items FROM sales WHERE date(created_at) = ?
      `, [saleDate]);
      
      let totalCost = 0;
      if (salesResult[0]?.values) {
        for (const saleRow of salesResult[0].values) {
          const items = JSON.parse(saleRow[0] || '[]');
          for (const item of items) {
            const productResult = db.exec('SELECT cost FROM products WHERE id = ?', [item.id]);
            if (productResult[0]?.values[0]) {
              totalCost += productResult[0].values[0][0] * item.quantity;
            }
          }
        }
      }
      
      const profit = totalSales - totalCost;
      const margin = totalSales > 0 ? ((profit / totalSales) * 100) : 0;
      
      profitData.push({
        'Fecha': format(new Date(saleDate), 'dd/MM/yyyy'),
        'Ventas Totales': `$${totalSales.toFixed(2)}`,
        'Costo Total': `$${totalCost.toFixed(2)}`,
        'Ganancia': `$${profit.toFixed(2)}`,
        'Margen %': `${margin.toFixed(2)}%`
      });
    }
    
    return profitData;
  };

  const generateInventoryReport = async () => {
    const result = db.exec(`
      SELECT 
        id,
        name,
        category,
        price,
        cost,
        stock,
        created_at
      FROM products
      ORDER BY stock ASC
    `);

    if (!result[0]?.values) return [];

    return result[0].values.map((row: any) => ({
      'ID': row[0],
      'Producto': row[1],
      'Categoría': row[2],
      'Precio': `$${row[3].toFixed(2)}`,
      'Costo': `$${row[4].toFixed(2)}`,
      'Stock': row[5],
      'Valor Inventario': `$${(row[3] * row[5]).toFixed(2)}`,
      'Estado': row[5] < 10 ? 'Stock Bajo' : row[5] < 20 ? 'Stock Medio' : 'Stock Alto',
      'Fecha Registro': format(new Date(row[6]), 'dd/MM/yyyy')
    }));
  };

  const generateCashReport = async () => {
    const result = db.exec(`
      SELECT 
        id,
        type,
        amount,
        description,
        created_at
      FROM cash_movements
      WHERE date(created_at) BETWEEN ? AND ?
      ORDER BY created_at DESC
    `, [filters.dateFrom, filters.dateTo]);

    if (!result[0]?.values) return [];

    return result[0].values.map((row: any) => ({
      'ID': row[0],
      'Tipo': row[1] === 'ingreso' ? 'Ingreso' : 'Salida',
      'Monto': `$${row[2].toFixed(2)}`,
      'Descripción': row[3],
      'Fecha': format(new Date(row[4]), 'dd/MM/yyyy HH:mm')
    }));
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    
    // Auto-size columns
    const colWidths = Object.keys(reportData[0]).map(key => ({
      wch: Math.max(key.length, ...reportData.map(row => String(row[key]).length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, getReportTitle());
    
    const fileName = `${getReportTitle()}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getReportTitle = () => {
    const titles = {
      sales: 'Reporte_Ventas',
      products: 'Reporte_Productos',
      profits: 'Reporte_Ganancias',
      inventory: 'Reporte_Inventario',
      cash: 'Reporte_Caja'
    };
    return titles[filters.reportType as keyof typeof titles] || 'Reporte';
  };

  const setQuickFilter = (type: string) => {
    const today = new Date();
    let dateFrom, dateTo;

    switch (type) {
      case 'today':
        dateFrom = dateTo = format(today, 'yyyy-MM-dd');
        break;
      case 'week':
        dateFrom = format(startOfWeek(today), 'yyyy-MM-dd');
        dateTo = format(endOfWeek(today), 'yyyy-MM-dd');
        break;
      case 'month':
        dateFrom = format(startOfMonth(today), 'yyyy-MM-dd');
        dateTo = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reportes</h1>
            <p className="text-gray-600 dark:text-gray-300">Genera y exporta reportes personalizados</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </button>
            <button
              onClick={exportToExcel}
              disabled={reportData.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setQuickFilter('today')}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            Hoy
          </button>
          <button
            onClick={() => setQuickFilter('week')}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            Esta Semana
          </button>
          <button
            onClick={() => setQuickFilter('month')}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50"
          >
            Este Mes
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Configurar Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Reporte</label>
                <select
                  value={filters.reportType}
                  onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="sales">Ventas</option>
                  <option value="products">Productos</option>
                  <option value="profits">Ganancias</option>
                  <option value="inventory">Inventario</option>
                  <option value="cash">Movimientos de Caja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agrupar Por</label>
                <select
                  value={filters.groupBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="day">Día</option>
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{getReportTitle().replace('_', ' ')}</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {reportData.length} registros encontrados
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Generando reporte...</p>
            </div>
          ) : reportData.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos para mostrar con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    {Object.keys(reportData[0]).map(key => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.slice(0, 50).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length > 50 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  Mostrando 50 de {reportData.length} registros. Exporta a Excel para ver todos.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};