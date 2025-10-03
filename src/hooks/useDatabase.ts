import { useState, useEffect, useCallback } from 'react';
import initSqlJs from 'sql.js';

export interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  barcode?: string;
  created_at: string;
}

export interface Sale {
  id: number;
  total: number;
  items: string; // JSON string
  created_at: string;
  payment_method: string;
}

export interface CashMovement {
  id: number;
  type: 'ingreso' | 'salida';
  amount: number;
  description: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
  due_date?: string;
}

let SQL: any = null;

export const useDatabase = () => {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const initDB = useCallback(async () => {
    try {
      if (!SQL) {
        SQL = await initSqlJs({
          locateFile: (file: string) => `https://sql.js.org/dist/${file}`
        });
      }

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('pos_database');
      let database;
      
      if (savedDb) {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        database = new SQL.Database(uint8Array);
      } else {
        database = new SQL.Database();
        await createTables(database);
      }

      setDb(database);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing database:', error);
      setLoading(false);
    }
  }, []);

  const createTables = async (database: any) => {
    const queries = [
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL,
        barcode TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        items TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS cash_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        due_date TEXT
      )`
    ];

    queries.forEach(query => {
      database.exec(query);
    });

    // Insert sample data
    const sampleProducts = [
      { name: 'Coca Cola 600ml', price: 2.5, cost: 1.5, stock: 50, category: 'Bebidas' },
      { name: 'Pan Integral', price: 3.0, cost: 2.0, stock: 20, category: 'Panadería' },
      { name: 'Leche Entera 1L', price: 4.0, cost: 3.0, stock: 30, category: 'Lácteos' }
    ];

    sampleProducts.forEach(product => {
      database.run(
        'INSERT INTO products (name, price, cost, stock, category) VALUES (?, ?, ?, ?, ?)',
        [product.name, product.price, product.cost, product.stock, product.category]
      );
    });

    saveDatabase(database);
  };

  const saveDatabase = useCallback((database: any) => {
    if (database) {
      const data = database.export();
      const dataArray = Array.from(data);
      localStorage.setItem('pos_database', JSON.stringify(dataArray));
    }
  }, []);

  const exportDatabase = useCallback(() => {
    if (db) {
      const data = db.export();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos_backup_${new Date().toISOString().split('T')[0]}.sqlite`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [db]);

  const importDatabase = useCallback((file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          if (!SQL) {
            SQL = await initSqlJs({
              locateFile: (file: string) => `https://sql.js.org/dist/${file}`
            });
          }

          const newDb = new SQL.Database(uint8Array);
          setDb(newDb);
          saveDatabase(newDb);
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }, [saveDatabase]);

  useEffect(() => {
    initDB();
  }, [initDB]);

  useEffect(() => {
    if (db) {
      const interval = setInterval(() => {
        saveDatabase(db);
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [db, saveDatabase]);

  return {
    db,
    loading,
    saveDatabase,
    exportDatabase,
    importDatabase,
    initDB
  };
};