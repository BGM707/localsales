import React from 'react';
import { format } from 'date-fns';
import { Printer, Download } from 'lucide-react';

interface ReceiptProps {
  sale: {
    id: number;
    total: number;
    items: any[];
    payment_method: string;
    created_at: string;
  };
  onClose: () => void;
}

export const Receipt: React.FC<ReceiptProps> = ({ sale, onClose }) => {
  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Boleta de Venta #${sale.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>POS SYSTEM</h2>
              <p>Boleta de Venta #${sale.id}</p>
              <p>${format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div class="items">
              ${sale.items.map(item => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total">
              <div class="item">
                <span>TOTAL:</span>
                <span>$${sale.total.toFixed(2)}</span>
              </div>
              <div class="item">
                <span>Método de Pago:</span>
                <span>${sale.payment_method === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</span>
              </div>
            </div>
            <div class="footer">
              <p>¡Gracias por su compra!</p>
              <p>Conserve esta boleta</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadReceipt = () => {
    const receiptContent = `
POS SYSTEM
Boleta de Venta #${sale.id}
${format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}
${'='.repeat(40)}

${sale.items.map(item => 
  `${item.name} x${item.quantity}${' '.repeat(20 - item.name.length - item.quantity.toString().length)}$${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

${'='.repeat(40)}
TOTAL:${' '.repeat(30)}$${sale.total.toFixed(2)}
Método de Pago: ${sale.payment_method === 'efectivo' ? 'Efectivo' : 'Tarjeta'}

¡Gracias por su compra!
Conserve esta boleta
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boleta_${sale.id}_${format(new Date(sale.created_at), 'yyyy-MM-dd_HH-mm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Boleta de Venta</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Receipt Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg font-mono text-sm mb-6">
            <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-3 mb-3">
              <h4 className="font-bold text-gray-900 dark:text-white">POS SYSTEM</h4>
              <p className="text-gray-600 dark:text-gray-300">Boleta de Venta #{sale.id}</p>
              <p className="text-gray-600 dark:text-gray-300">{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            
            <div className="space-y-1 mb-3">
              {sale.items.map((item, index) => (
                <div key={index} className="flex justify-between text-gray-900 dark:text-white">
                  <span>{item.name} x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
              <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                <span>TOTAL:</span>
                <span>${sale.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Método de Pago:</span>
                <span>{sale.payment_method === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</span>
              </div>
            </div>
            
            <div className="text-center mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
              <p>¡Gracias por su compra!</p>
              <p>Conserve esta boleta</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={printReceipt}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={downloadReceipt}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Descargar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};