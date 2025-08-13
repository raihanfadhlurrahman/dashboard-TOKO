# Action Plan: Dashboard Keuangan POS
## HTML/CSS/JS + Supabase Implementation

---

## 🎯 Phase 1: Setup & Infrastructure (Week 1)

### 1.1 Project Structure Setup
```
pos-dashboard/
├── index.html                 # Landing/login page
├── dashboard.html             # Main dashboard
├── transactions.html          # Transaction list page
├── reports.html              # Reports page
├── css/
│   ├── main.css              # Global styles
│   ├── dashboard.css         # Dashboard specific
│   ├── components.css        # Reusable components
│   └── responsive.css        # Mobile responsive
├── js/
│   ├── main.js               # App initialization
│   ├── auth.js               # Authentication
│   ├── supabase-client.js    # Supabase configuration
│   ├── dashboard.js          # Dashboard logic
│   ├── transactions.js       # Transaction management
│   ├── reports.js            # Reports logic
│   ├── charts.js             # Chart implementations
│   └── utils.js              # Helper functions
├── assets/
│   └── images/
└── config/
    └── environment.js        # Environment variables
```

### 1.2 Supabase Setup Checklist
- [ ] Create Supabase project
- [ ] Import schema dari PRD (toko, menu, transaksi, transaksi_detail, dll)
- [ ] Setup RLS (Row Level Security) policies
- [ ] Create database functions untuk laporan kompleks
- [ ] Setup storage untuk file export (opsional)
- [ ] Generate API keys dan simpan di environment



### 1.3 Basic HTML Structure
```html
<!-- Template struktur dasar -->
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard POS</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div id="app">
        <!-- Navigation -->
        <nav class="navbar">
            <div class="nav-brand">POS Dashboard</div>
            <div class="nav-user">
                <select id="toko-selector"></select>
                <button id="logout-btn">Logout</button>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main id="main-content">
            <!-- Page content akan di-inject di sini -->
        </main>
    </div>
    
    <!-- Loading spinner -->
    <div id="loading" class="hidden">
        <div class="spinner"></div>
    </div>
    
    <!-- Toast notifications -->
    <div id="toast-container"></div>
    
    <script src="js/supabase-client.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

---

## 🚀 Phase 2: Core Dashboard (Week 2-3)

### 2.1 Authentication Implementation
**File: `js/auth.js`**
```javascript
// Implementasi login/logout dengan Supabase Auth
class AuthManager {
    constructor() {
        this.supabase = window.supabase;
    }
    
    async login(email, password) {
        // Login implementation
    }
    
    async logout() {
        // Logout implementation
    }
    
    async getCurrentUser() {
        // Get current user
    }
    
    async checkAuth() {
        // Check if user is authenticated
    }
}
```

**Tasks:**
- [ ] Buat halaman login (index.html)
- [ ] Implementasi login/logout functionality
- [ ] Setup session management
- [ ] Redirect logic untuk protected pages
- [ ] Error handling untuk auth failures

### 2.2 Supabase Client Setup
**File: `js/supabase-client.js`**
```javascript
// Konfigurasi Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Database query helpers
class DatabaseService {
    constructor() {
        this.supabase = supabase;
    }
    
    // Revenue queries
    async getRevenueByPeriod(tokoId, fromDate, toDate) {
        // Implementation
    }
    
    // Transaction queries
    async getTransactions(filters = {}) {
        // Implementation
    }
    
    // Top menu queries
    async getTopMenus(tokoId, fromDate, toDate, limit = 10) {
        // Implementation
    }
}
```

**Tasks:**
- [ ] Setup Supabase client initialization
- [ ] Create database service class
- [ ] Implement core query functions
- [ ] Add error handling dan retry logic
- [ ] Test connection dan basic queries

### 2.3 Dashboard Summary Cards
**File: `js/dashboard.js`**

**Tasks:**
- [ ] Create KPI cards HTML structure:
  - Total Pendapatan Hari Ini
  - Transaksi Hari Ini
  - Average Order Value
  - Items Sold Today
- [ ] Implement real-time data fetching
- [ ] Add loading states
- [ ] Format currency dan numbers
- [ ] Add comparison dengan periode sebelumnya

### 2.4 Revenue Chart Implementation
**File: `js/charts.js`**
```javascript
// Menggunakan Chart.js atau library chart lainnya
class ChartManager {
    constructor() {
        this.charts = {};
    }
    
    createRevenueChart(canvasId, data) {
        // Implementation using Chart.js
        const ctx = document.getElementById(canvasId).getContext('2d');
        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                // Chart options
            }
        });
    }
    
    updateChart(chartName, newData) {
        // Update existing chart
    }
}
```

**Tasks:**
- [ ] Choose chart library (Chart.js, ApexCharts, atau D3.js)
- [ ] Implement revenue trend chart (30 days)
- [ ] Add interactive features (hover, click)
- [ ] Make charts responsive
- [ ] Add chart loading states

---

## 📊 Phase 3: Transaction Management (Week 4-5)

### 3.1 Transaction List Page
**File: `transactions.html`**
```html
<!-- Transaction list dengan filtering -->
<div class="transaction-page">
    <div class="filters-section">
        <div class="filter-row">
            <input type="date" id="date-from">
            <input type="date" id="date-to">
            <select id="toko-filter"></select>
            <input type="text" id="search-customer" placeholder="Cari nama/HP pembeli">
            <button id="apply-filter">Filter</button>
            <button id="reset-filter">Reset</button>
        </div>
    </div>
    
    <div class="table-container">
        <table id="transactions-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tanggal</th>
                    <th>Pembeli</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody id="transactions-body">
                <!-- Data akan di-inject di sini -->
            </tbody>
        </table>
    </div>
    
    <div class="pagination">
        <!-- Pagination controls -->
    </div>
</div>
```

**File: `js/transactions.js`**
```javascript
class TransactionManager {
    constructor() {
        this.currentPage = 1;
        this.perPage = 20;
        this.filters = {};
        this.db = new DatabaseService();
    }
    
    async loadTransactions() {
        // Load dan display transactions
    }
    
    async showTransactionDetail(transactionId) {
        // Show modal dengan detail transaksi
    }
    
    setupFilters() {
        // Setup filter event listeners
    }
    
    setupPagination() {
        // Setup pagination
    }
}
```

**Tasks:**
- [ ] Create transaction list HTML structure
- [ ] Implement filtering (toko, tanggal, pembeli)
- [ ] Add pagination (client-side atau server-side)
- [ ] Create transaction detail modal
- [ ] Add sorting functionality
- [ ] Implement search functionality

### 3.2 Transaction Detail Modal
**Tasks:**
- [ ] Design modal layout untuk transaction details
- [ ] Show transaksi_detail items
- [ ] Display menu names, quantities, prices
- [ ] Add variasi information jika ada
- [ ] Format currency dan calculations
- [ ] Add close/navigation controls

---

## 📈 Phase 4: Reports & Analytics (Week 6-7)

### 4.1 Top Menu Performance
**File: `reports.html` (section)**
```html
<div class="top-menu-section">
    <div class="section-header">
        <h3>Top Performing Menu</h3>
        <div class="controls">
            <select id="sort-by">
                <option value="qty">By Quantity</option>
                <option value="revenue">By Revenue</option>
            </select>
            <select id="limit">
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
            </select>
        </div>
    </div>
    
    <div class="menu-performance-table">
        <!-- Table untuk top menu -->
    </div>
</div>
```

**Tasks:**
- [ ] Implement top menu queries
- [ ] Create sortable table (by qty/revenue)
- [ ] Add menu category filtering
- [ ] Show percentage contribution
- [ ] Add visual indicators (bars, colors)

### 4.2 Export Functionality
**File: `js/export.js`**
```javascript
class ExportManager {
    constructor() {
        this.db = new DatabaseService();
    }
    
    async exportToCSV(type, filters = {}) {
        // Generate dan download CSV
        const data = await this.getData(type, filters);
        const csv = this.convertToCSV(data);
        this.downloadCSV(csv, `export-${type}-${Date.now()}.csv`);
    }
    
    convertToCSV(data) {
        // Convert array ke CSV format
    }
    
    downloadCSV(csvContent, filename) {
        // Trigger download
    }
}
```

**Tasks:**
- [ ] Implement CSV export for transactions
- [ ] Add Excel export (menggunakan library seperti SheetJS)
- [ ] Create export progress indicator
- [ ] Add date range validation
- [ ] Handle large dataset exports
- [ ] Add export format options

---

## 🎨 Phase 5: UI/UX & Responsive Design (Week 8)

### 5.1 CSS Framework & Design System
**File: `css/main.css`**
```css
/* CSS Variables untuk consistent theming */
:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --success-color: #059669;
    --warning-color: #d97706;
    --error-color: #dc2626;
    
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    
    --border-radius: 8px;
    --box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Component classes */
.card {
    background: var(--bg-primary);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 1.5rem;
}

.btn {
    /* Button styles */
}

.table {
    /* Table styles */
}
```

**Tasks:**
- [ ] Create consistent design system
- [ ] Implement responsive grid system
- [ ] Add loading states dan skeletons
- [ ] Create reusable components (cards, buttons, modals)
- [ ] Add animations dan transitions
- [ ] Test di berbagai device sizes

### 5.2 Mobile Responsive Design
**File: `css/responsive.css`**

**Tasks:**
- [ ] Mobile-first approach
- [ ] Collapsible navigation
- [ ] Touch-friendly buttons dan inputs
- [ ] Swipe gestures untuk tables
- [ ] Responsive charts
- [ ] Mobile-optimized modals

---

## ⚡ Phase 6: Performance & Optimization (Week 9)

### 6.1 Performance Optimizations
**Tasks:**
- [ ] Implement caching untuk frequently accessed data
- [ ] Add debouncing untuk search inputs
- [ ] Lazy loading untuk large datasets
- [ ] Optimize database queries
- [ ] Add service worker untuk offline capability
- [ ] Minimize dan compress assets

### 6.2 Error Handling & User Experience
**File: `js/utils.js`**
```javascript
class ErrorHandler {
    static showError(message, type = 'error') {
        // Show toast notification
    }
    
    static handleApiError(error) {
        // Handle API errors gracefully
    }
    
    static logError(error, context) {
        // Log errors for debugging
    }
}

class LoadingManager {
    static show(target = 'body') {
        // Show loading indicator
    }
    
    static hide(target = 'body') {
        // Hide loading indicator
    }
}
```

**Tasks:**
- [ ] Implement global error handling
- [ ] Add toast notifications
- [ ] Create loading indicators
- [ ] Add retry mechanisms
- [ ] Handle network failures
- [ ] Add user-friendly error messages

---

## 🔒 Phase 7: Security & Testing (Week 10)

### 7.1 Security Implementation
**Tasks:**
- [ ] Implement RLS policies di Supabase
- [ ] Add input validation dan sanitization
- [ ] Secure API endpoints
- [ ] Add CSRF protection
- [ ] Implement role-based access control
- [ ] Mask sensitive data (phone numbers)

### 7.2 Testing
**Tasks:**
- [ ] Create test data di Supabase
- [ ] Manual testing semua features
- [ ] Cross-browser testing
- [ ] Performance testing dengan large datasets
- [ ] Mobile device testing
- [ ] Accessibility testing

---

## 🚀 Phase 8: Deployment & Production (Week 11)

### 8.1 Production Setup
**Tasks:**
- [ ] Setup production Supabase environment
- [ ] Configure environment variables
- [ ] Optimize assets untuk production
- [ ] Setup CDN untuk static assets
- [ ] Configure domain dan SSL

### 8.2 Deployment Options
**Pilihan deployment:**
1. **Vercel/Netlify** (recommended untuk static sites)
2. **GitHub Pages** (gratis, mudah setup)
3. **Firebase Hosting**
4. **Traditional web hosting**

**Tasks:**
- [ ] Setup CI/CD pipeline
- [ ] Configure auto-deployment
- [ ] Setup monitoring dan logging
- [ ] Create backup strategy
- [ ] Document deployment process

---

## 📝 Additional Implementation Notes

### Database Queries Examples
```sql
-- Revenue per day (implement as Supabase function)
CREATE OR REPLACE FUNCTION get_daily_revenue(toko_id_param INT, days_back INT DEFAULT 30)
RETURNS TABLE(day DATE, revenue DECIMAL, transactions BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('day', t.created_at)::DATE as day,
        SUM(t.total) as revenue,
        COUNT(*) as transactions
    FROM transaksi t
    WHERE t.toko_id = toko_id_param
        AND t.created_at >= now() - (days_back || ' days')::INTERVAL
    GROUP BY date_trunc('day', t.created_at)
    ORDER BY day;
END;
$$ LANGUAGE plpgsql;
```

### Supabase RLS Policies
```sql
-- Example RLS policy
CREATE POLICY "Users can only access their toko data" ON transaksi
FOR ALL USING (
    toko_id IN (
        SELECT toko_id FROM user_toko_access 
        WHERE user_id = auth.uid()
    )
);
```

### Essential JavaScript Libraries
Include via CDN:
- **Supabase JS Client**: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- **Chart.js**: `https://cdn.jsdelivr.net/npm/chart.js`
- **Date manipulation**: `https://cdn.jsdelivr.net/npm/dayjs@1`
- **CSV Export**: `https://cdn.jsdelivr.net/npm/papa-parse@5`

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] Page load time < 3 seconds
- [ ] API response time < 2 seconds
- [ ] Mobile responsiveness score > 95%
- [ ] Zero console errors
- [ ] Cross-browser compatibility

### Business Metrics
- [ ] All MVP features implemented
- [ ] Dashboard shows real-time data
- [ ] Export functionality works
- [ ] User can filter dan search effectively
- [ ] Reports match database calculations

---

## 🔄 Post-Launch Roadmap

### Phase 9: Advanced Features
- [ ] Real-time notifications
- [ ] AI insights using Supabase Edge Functions
- [ ] Advanced forecasting
- [ ] Multi-store management
- [ ] Advanced reporting dengan custom date ranges

### Phase 10: Integrations
- [ ] WhatsApp notifications
- [ ] Email reports
- [ ] Third-party accounting software
- [ ] Mobile app companion

---

## 📚 Learning Resources

### Required Knowledge
- **HTML5/CSS3**: Modern web standards
- **JavaScript ES6+**: Async/await, modules, classes
- **Supabase**: Database, Auth, RLS policies
- **Chart.js**: Data visualization
- **Responsive Design**: Mobile-first approach

### Helpful Tools
- **VS Code Extensions**: 
  - Live Server
  - Prettier
  - ESLint
  - Supabase snippets
- **Browser Dev Tools**: Network, Console, Performance tabs
- **Postman/Insomnia**: API testing

This action plan provides a comprehensive roadmap untuk membangun dashboard keuangan POS sesuai PRD yang Anda berikan. Setiap phase memiliki deliverables yang jelas dan dapat diukur progress-nya.