import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, X, Search, CreditCard, Banknote, Scan } from 'lucide-react';
import { Product } from '../hooks/useDatabase';
import { BarcodeScanner } from './BarcodeScanner';
import { Receipt } from './Receipt';

interface SalesProps {
  db: any;
  onSave: () => void;
  currentUser: any;
}

interface CartItem extends Product {
  quantity: number;
}

export const Sales: React.FC<SalesProps> = ({ db, onSave, currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [showScanner, setShowScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    if (db) {
      loadProducts();
    }
  }, [db]);

  const loadProducts = () => {
    try {
      const result = db.exec(`
        SELECT id, name, price, cost, stock, category, barcode, created_at
        FROM products
        WHERE stock > 0
        ORDER BY name
      `);
      
      if (result[0]?.values) {
        const productsData = result[0].values.map((row: any) => ({
          id: row[0],
          name: row[1],
          price: row[2],
          cost: row[3],
          stock: row[4],
          category: row[5],
          barcode: row[6],
          created_at: row[7]
        }));
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prev.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prev;
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      const product = products.find(p => p.id === id);
      if (product && quantity <= product.stock) {
        setCart(prev =>
          prev.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        );
      }
    }
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const completeSale = () => {
    try {
      const saleItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      // Insert sale
      const result = db.run(
        'INSERT INTO sales (total, items, payment_method) VALUES (?, ?, ?)',
        [getTotal(), JSON.stringify(saleItems), paymentMethod]
      );

      // Update stock
      cart.forEach(item => {
        db.run(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.id]
        );
      });

      // Get the inserted sale for receipt
      const saleId = result.lastInsertRowid;
      const saleData = {
        id: saleId,
        total: getTotal(),
        items: saleItems,
        payment_method: paymentMethod,
        created_at: new Date().toISOString()
      };
      
      setLastSale(saleData);
      onSave();
      setCart([]);
      setShowCheckout(false);
      setShowReceipt(true);
      loadProducts(); // Refresh products to show updated stock
    } catch (error) {
      console.error('Error completing sale:', error);
      alert('Error al completar la venta');
    }
  };

  const handleScannedProduct = (product: Product) => {
    addToCart(product);
    setShowScanner(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">Ventas</h1>
        <p className="text-gray-600 dark:text-gray-300">Registra nuevas ventas</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Products */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setShowScanner(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 whitespace-nowrap"
                >
                  <Scan className="w-5 h-5" />
                  <span>Escanear</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                    onClick={() => addToCart(product)}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm lg:text-base">{product.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mb-2">{product.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-base lg:text-lg font-bold text-green-600 dark:text-green-400">${product.price}</span>
                      <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Stock: {product.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-fit sticky top-4 lg:top-6">
            <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Carrito</h2>
                <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            
            <div className="p-4 lg:p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">Carrito vacío</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <div className="flex-1">
                        <h4 className="font-medium text-xs lg:text-sm text-gray-900 dark:text-white">{item.name}</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">${item.price}</p>
                      </div>
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity - 1);
                          }}
                          className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Minus className="w-3 h-3 lg:w-4 lg:h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <span className="w-6 lg:w-8 text-center font-medium text-sm text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Plus className="w-3 h-3 lg:w-4 lg:h-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.id);
                          }}
                          className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                        >
                          <X className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">${getTotal().toFixed(2)}</span>
                    </div>
                    
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="w-full bg-blue-600 text-white py-2 lg:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm lg:text-base"
                    >
                      Procesar Venta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Confirmar Venta</h3>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 lg:p-6">
              <div className="mb-6">
                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Método de Pago</h4>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <button
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`p-3 lg:p-4 border rounded-lg flex flex-col items-center ${
                      paymentMethod === 'efectivo' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Banknote className="w-6 h-6 lg:w-8 lg:h-8 mb-2" />
                    <span className="font-medium text-sm lg:text-base">Efectivo</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`p-3 lg:p-4 border rounded-lg flex flex-col items-center ${
                      paymentMethod === 'tarjeta' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 mb-2" />
                    <span className="font-medium text-sm lg:text-base">Tarjeta</span>
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Total a Pagar:</span>
                  <span className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">${getTotal().toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={completeSale}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <Receipt 
          sale={lastSale} 
          onClose={() => setShowReceipt(false)} 
        />
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Escanear Producto</h3>
                <button
                  onClick={() => setShowScanner(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 lg:p-6">
              <BarcodeScanner 
                db={db} 
                onSave={onSave}
                onProductFound={handleScannedProduct}
                mode="sale"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};