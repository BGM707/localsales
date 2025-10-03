import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Scan, X, Plus, Check, AlertCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  db: any;
  onSave: () => void;
  onProductFound?: (product: any) => void;
  mode?: 'register' | 'sale';
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  db, 
  onSave, 
  onProductFound,
  mode = 'register' 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [foundProduct, setFoundProduct] = useState<any>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [scanMethod, setScanMethod] = useState<'camera' | 'usb'>('camera');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  const webcamRef = useRef<Webcam>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '',
    category: ''
  });

  useEffect(() => {
    // Listen for USB barcode scanner input
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isScanning && scanMethod === 'usb') {
        if (e.key === 'Enter') {
          if (scannedCode.length > 0) {
            handleBarcodeDetected(scannedCode);
            setScannedCode('');
          }
        } else if (e.key.length === 1) {
          setScannedCode(prev => prev + e.key);
        }
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [isScanning, scanMethod, scannedCode]);

  const startCameraScanning = useCallback(() => {
    if (scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          }
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        }
      }, (err) => {
        if (err) {
          console.error('Error initializing Quagga:', err);
          setMessage('Error al inicializar la cámara');
          setMessageType('error');
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((data) => {
        const code = data.codeResult.code;
        handleBarcodeDetected(code);
        Quagga.stop();
      });
    }
  }, []);

  const stopCameraScanning = () => {
    Quagga.stop();
  };

  const handleBarcodeDetected = async (code: string) => {
    setScannedCode(code);
    setMessage(`Código escaneado: ${code}`);
    setMessageType('info');

    try {
      // Search for product in database
      const result = db.exec('SELECT * FROM products WHERE barcode = ?', [code]);
      
      if (result[0]?.values && result[0].values.length > 0) {
        const productData = result[0].values[0];
        const product = {
          id: productData[0],
          name: productData[1],
          price: productData[2],
          cost: productData[3],
          stock: productData[4],
          category: productData[5],
          barcode: productData[6],
          created_at: productData[7]
        };
        
        setFoundProduct(product);
        setMessage(`Producto encontrado: ${product.name}`);
        setMessageType('success');
        
        if (mode === 'sale' && onProductFound) {
          onProductFound(product);
        }
      } else {
        setFoundProduct(null);
        setMessage('Producto no encontrado. ¿Deseas registrarlo?');
        setMessageType('error');
        
        if (mode === 'register') {
          setShowRegisterForm(true);
          setFormData(prev => ({ ...prev, barcode: code }));
        }
      }
    } catch (error) {
      console.error('Error searching product:', error);
      setMessage('Error al buscar el producto');
      setMessageType('error');
    }
    
    setIsScanning(false);
  };

  const startScanning = () => {
    setIsScanning(true);
    setScannedCode('');
    setFoundProduct(null);
    setMessage('');
    
    if (scanMethod === 'camera') {
      setTimeout(() => startCameraScanning(), 100);
    } else {
      setMessage('Escanea el código con tu lector USB...');
      setMessageType('info');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scanMethod === 'camera') {
      stopCameraScanning();
    }
    setScannedCode('');
  };

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      db.run(
        'INSERT INTO products (name, price, cost, stock, category, barcode) VALUES (?, ?, ?, ?, ?, ?)',
        [
          formData.name,
          parseFloat(formData.price),
          parseFloat(formData.cost),
          parseInt(formData.stock),
          formData.category,
          scannedCode
        ]
      );
      
      onSave();
      setMessage('Producto registrado exitosamente');
      setMessageType('success');
      setShowRegisterForm(false);
      setFormData({ name: '', price: '', cost: '', stock: '', category: '' });
      
      // Refresh product search
      handleBarcodeDetected(scannedCode);
    } catch (error) {
      console.error('Error registering product:', error);
      setMessage('Error al registrar el producto');
      setMessageType('error');
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Escáner de Códigos</h1>
        <p className="text-gray-600 dark:text-gray-300">Escanea códigos de barras para registrar o vender productos</p>
      </div>

      {/* Scanner Method Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Método de Escaneo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setScanMethod('camera')}
            className={`p-4 border rounded-lg flex flex-col items-center ${
              scanMethod === 'camera' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Camera className="w-8 h-8 mb-2" />
            <span className="font-medium">Cámara Web</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Usar cámara del dispositivo</span>
          </button>
          <button
            onClick={() => setScanMethod('usb')}
            className={`p-4 border rounded-lg flex flex-col items-center ${
              scanMethod === 'usb' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Scan className="w-8 h-8 mb-2" />
            <span className="font-medium">Lector USB</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Usar escáner de códigos USB</span>
          </button>
        </div>
      </div>

      {/* Scanner Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Control de Escaneo</h2>
          <div className="flex space-x-3">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Scan className="w-5 h-5" />
                <span>Iniciar Escaneo</span>
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Detener</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-4 flex items-center ${
            messageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' :
            messageType === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
            'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}>
            {messageType === 'success' && <Check className="w-5 h-5 mr-2" />}
            {messageType === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
            {messageType === 'info' && <Scan className="w-5 h-5 mr-2" />}
            <span>{message}</span>
          </div>
        )}

        {/* Scanner Display */}
        {isScanning && (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
            {scanMethod === 'camera' ? (
              <div>
                <div ref={scannerRef} className="w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden">
                  {/* Quagga will inject the camera feed here */}
                </div>
                <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                  Apunta la cámara hacia el código de barras
                </p>
              </div>
            ) : (
              <div className="text-center">
                <Scan className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">Esperando escaneo USB...</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Código actual: <span className="font-mono">{scannedCode}</span>
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  className="opacity-0 absolute -left-full"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {/* Found Product Display */}
        {foundProduct && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Producto Encontrado</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                <span className="ml-2 font-medium">{foundProduct.name}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Categoría:</span>
                <span className="ml-2 font-medium">{foundProduct.category}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                <span className="ml-2 font-medium">${foundProduct.price}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                <span className="ml-2 font-medium">{foundProduct.stock}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Register Product Form */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Registrar Nuevo Producto</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Código: {scannedCode}</p>
            </div>
            
            <form onSubmit={handleRegisterProduct} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterForm(false);
                    setFormData({ name: '', price: '', cost: '', stock: '', category: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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