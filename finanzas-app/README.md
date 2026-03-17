# ₱ Finanzas Personales

App web tipo PWA para gestión de finanzas personales (ingresos, gastos, transferencias, presupuestos), optimizada para uso diario en móvil.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (diseño mobile-first)
- **Supabase** (PostgreSQL)
- **Chart.js** (gráficos)
- **PWA** (instalable en iPhone/Android)

---

## 🚀 Deploy paso a paso

### 1. Configurar Supabase

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto (región: South America si estás en Colombia)
3. Ve a **SQL Editor** y ejecuta el contenido de `supabase-schema.sql`
4. Ve a **Settings → API** y copia:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> **Nota:** Como es single-user, NO necesitas configurar RLS ni autenticación.
> Para mayor seguridad, puedes desactivar RLS en cada tabla o crear políticas permisivas.

Para desactivar RLS (recomendado para single-user):
```sql
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
```

### 2. Deploy en Vercel

1. Sube el proyecto a un repositorio en GitHub
2. Ve a [vercel.com](https://vercel.com) y conecta tu repo
3. En la configuración del proyecto, agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key de Supabase
4. Click en **Deploy**

### 3. Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear archivo de variables
cp .env.local.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 4. Instalar como PWA en iPhone

1. Abre la app en Safari
2. Toca el botón de compartir (⬆️)
3. Selecciona **"Añadir a pantalla de inicio"**
4. La app se comportará como una app nativa

---

## 📱 Funcionalidades

| Feature | Descripción |
|---------|-------------|
| **Dashboard** | Balance total, ingresos/gastos del mes, gráfico por categorías |
| **Transacciones** | Crear ingresos, gastos y transferencias entre cuentas |
| **Cuentas** | Múltiples cuentas con balance calculado automáticamente |
| **Presupuestos** | Límites mensuales por categoría con barra de progreso |
| **Filtros** | Por fecha, cuenta, categoría y tipo |
| **Exportar CSV** | Descarga tus transacciones en CSV |
| **PWA** | Instalable en iPhone y Android |

---

## 🗄️ Estructura de la base de datos

- **accounts** — Cuentas (Nequi, Bancolombia, Efectivo...)
- **categories** — Categorías separadas por income/expense
- **transactions** — Todas las transacciones con referencia a cuenta y categoría
- **budgets** — Presupuestos mensuales por categoría
- **account_balances** — Vista SQL que calcula balances desde transacciones

### Lógica de transferencias

Una transferencia crea 2 transacciones vinculadas por `transfer_id`:
- Un **expense** en la cuenta origen
- Un **income** en la cuenta destino

Al eliminar una transferencia, se eliminan ambas partes.

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx          # Root layout + PWA meta
│   ├── page.tsx            # Main page (app shell)
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # Shared UI (Modal, Button, Input, Nav...)
│   ├── dashboard/          # Dashboard con gráficos
│   ├── transactions/       # Lista, formulario, filtros
│   ├── accounts/           # Gestión de cuentas
│   └── budgets/            # Presupuestos mensuales
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   ├── api.ts              # Capa de servicios (CRUD)
│   └── utils.ts            # Utilidades (formateo COP, fechas, CSV)
└── types/
    └── index.ts            # TypeScript interfaces
```
