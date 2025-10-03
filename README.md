# 🏪 Sistema de Punto de Venta (POS) - SQLite Local

Un sistema completo de punto de venta desarrollado con React, TypeScript y SQLite local. Diseñado para pequeñas y medianas empresas que necesitan una solución robusta, offline y fácil de usar.

## ✨ Características Principales

### 🔐 **Sistema de Autenticación**
- Login seguro con usuarios y contraseñas
- Roles diferenciados: Administrador y Usuario
- Persistencia de sesión en localStorage
- Logs de seguridad completos
- Gestión avanzada de usuarios (activar/desactivar)

### 💰 **Gestión de Ventas**
- Carrito de compras intuitivo
- Procesamiento de ventas con múltiples métodos de pago
- Generación automática de boletas (impresión y descarga)
- Actualización automática de inventario
- Historial completo de transacciones

### 📦 **Control de Inventario**
- Registro completo de productos con códigos de barras
- Control de stock en tiempo real
- Alertas de stock bajo
- Categorización de productos
- Gestión de costos y precios

### 🚚 **Gestión de Proveedores**
- Registro detallado de proveedores
- Historial de compras y órdenes
- Actualización automática de stock por compras
- Seguimiento de costos por proveedor

### 📊 **Reportes y Analytics**
- Dashboard con métricas en tiempo real
- Gráficos de ventas y productos más vendidos
- Exportación a Excel con filtros personalizables
- Reportes de ganancias y márgenes
- Análisis de inventario y rotación

### 💵 **Caja Diaria**
- Control de ingresos y salidas de efectivo
- Balance diario automático
- Registro de movimientos con descripción
- Integración con ventas del día

### ✅ **Sistema de Tareas**
- Asignación de tareas por administradores
- Seguimiento de completado por usuarios
- Fechas de vencimiento y recordatorios
- Historial de tareas completadas

### 📱 **Escáner de Códigos de Barras**
- Soporte para cámara web y lectores USB
- Múltiples formatos: Code 128, EAN, UPC, Code 39
- Registro automático de productos no encontrados
- Integración directa con ventas

### 🌙 **Interfaz Moderna**
- Modo oscuro/claro con persistencia
- Diseño completamente responsive
- Navegación móvil optimizada
- Colores sobrios y profesionales

### 💾 **Base de Datos Local**
- SQLite completamente local (sin internet)
- Backup automático cada 30 segundos
- Exportación/importación manual de datos
- Integridad referencial completa

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone [url-del-repositorio]
cd pos-system

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

### Primer Uso
1. Al iniciar por primera vez, usa las credenciales por defecto:
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`

2. **¡IMPORTANTE!** Cambia la contraseña por defecto inmediatamente:
   - Ve a Configuración → Usuarios
   - Haz clic en "Cambiar Contraseña"

## 👥 Roles y Permisos

### 🔧 **Administrador**
- ✅ Gestión completa de usuarios
- ✅ CRUD de productos y proveedores
- ✅ Asignación de tareas
- ✅ Acceso a todos los reportes
- ✅ Configuración del sistema
- ✅ Logs de seguridad

### 👤 **Usuario**
- ✅ Realizar ventas
- ✅ Escanear productos
- ✅ Ver inventario (solo lectura)
- ✅ Completar tareas asignadas
- ✅ Cambiar su propia contraseña
- ❌ No puede modificar productos
- ❌ No puede ver proveedores
- ❌ No puede acceder a reportes completos

## 📋 Guía de Uso

### Realizar una Venta
1. Ve a la sección **Ventas**
2. Busca productos o usa el escáner
3. Agrega productos al carrito
4. Selecciona método de pago
5. Confirma la venta
6. Imprime o descarga la boleta

### Gestionar Inventario
1. Ve a **Productos**
2. Agrega nuevos productos con código de barras
3. Configura precios, costos y stock inicial
4. Usa el escáner para registro rápido

### Generar Reportes
1. Ve a **Reportes**
2. Selecciona el tipo de reporte
3. Configura filtros de fecha
4. Previsualiza los datos
5. Exporta a Excel

### Backup de Datos
1. Ve a **Configuración**
2. En la sección "Base de Datos"
3. Haz clic en "Exportar" para backup
4. Usa "Importar" para restaurar datos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Base de Datos**: SQLite (sql.js)
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Exportación**: XLSX
- **Escáner**: Quagga.js, React Webcam
- **Fechas**: date-fns
- **Build**: Vite

## 🔒 Seguridad

### Características de Seguridad
- Autenticación obligatoria
- Roles y permisos granulares
- Logs de seguridad detallados
- Sesiones con timeout automático
- Validación de permisos en tiempo real

### Logs de Seguridad
El sistema registra automáticamente:
- Intentos de login (exitosos y fallidos)
- Cambios de contraseña
- Creación/eliminación de usuarios
- Cambios de estado de usuarios
- Acciones administrativas

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.tsx    # Panel principal
│   ├── Sales.tsx        # Módulo de ventas
│   ├── Products.tsx     # Gestión de productos
│   ├── Reports.tsx      # Reportes y exportación
│   ├── BarcodeScanner.tsx # Escáner de códigos
│   └── ...
├── hooks/              # Custom hooks
│   ├── useAuth.ts      # Autenticación
│   ├── useDatabase.ts  # Base de datos
│   └── useTheme.ts     # Tema oscuro/claro
└── types/              # Definiciones TypeScript
```

## 🔧 Configuración Avanzada

### Variables de Entorno
El sistema funciona completamente offline, no requiere variables de entorno.

### Personalización
- Modifica `tailwind.config.js` para cambiar colores
- Ajusta `src/index.css` para estilos globales
- Personaliza logos en `public/`

## 🐛 Solución de Problemas

### Problemas Comunes

**Error de base de datos**
- Verifica que el navegador soporte WebAssembly
- Limpia localStorage si hay corrupción de datos

**Escáner no funciona**
- Verifica permisos de cámara
- Asegúrate de usar HTTPS en producción

**Exportación falla**
- Verifica que hay datos para exportar
- Revisa la consola del navegador para errores

## 📈 Roadmap

### Próximas Características
- [ ] Integración con impresoras térmicas
- [ ] Sincronización en la nube (opcional)
- [ ] Módulo de facturación electrónica
- [ ] App móvil nativa
- [ ] Integración con balanzas electrónicas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Crea un issue en GitHub
- Revisa la documentación en el README
- Consulta los logs de seguridad para debugging

---

**Desarrollado con ❤️ para pequeñas y medianas empresas**