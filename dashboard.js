// Dashboard Analytics JavaScript
// Real Supabase Integration with Business Intelligence

class DashboardAnalytics {
    constructor() {
        // Supabase configuration
        this.supabaseUrl = 'https://ykoemhbgswbwskhrvezq.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb2VtaGJnc3did3NraHJ2ZXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDc2NjUsImV4cCI6MjA2NzM4MzY2NX0.GRlz8yO6I_NVKt6PrNpd-iEblRNqswNDr5wDR93e-Hk';
        
        // Initialize Supabase client
        this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        
        // Charts
        this.salesTrendChart = null;
        
        // User and role management
        this.currentUser = null;
        this.isOwnerMode = false;
        
        // Get selected store from localStorage or default
        this.currentStoreId = localStorage.getItem('selectedStoreId') || '4ad17318-4ee4-4f7c-ad3f-f6a571c7a0da';
        this.currentStoreName = localStorage.getItem('selectedStoreName') || 'KOPI JOGJAG';
        
        // Data cache
        this.cache = {
            transactions: [],
            menu: [],
            customers: [],
            lastUpdated: null
        };
        
        this.init();
    }

    async init() {
        try {
            // Check authentication first
            if (!this.checkAuthentication()) {
                this.redirectToLogin();
                return;
            }
            
            // Check if store is selected
            if (!this.currentStoreId || this.currentStoreId === 'null') {
                this.redirectToStoreSelection();
                return;
            }
            
            // Set current date
            this.setCurrentDate();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('Dashboard Analytics initialized successfully for store:', this.currentStoreName);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Gagal memuat dashboard. Silakan refresh halaman.');
        }
    }

    checkAuthentication() {
        const userSession = localStorage.getItem('userSession');
        
        if (!userSession) {
            console.log('❌ No user session found');
            return false;
        }
        
        try {
            const sessionData = JSON.parse(userSession);
            const loginTime = sessionData.loginTime;
            const currentTime = new Date().getTime();
            const sessionTimeout = 3600; // 1 hour in seconds
            
            // Check if session is still valid
            if (currentTime - loginTime < sessionTimeout * 1000) {
                console.log('✅ Valid session found for user:', sessionData.user.username);
                console.log('🔑 User role:', sessionData.user.role);
                console.log('🏪 Store:', sessionData.user.store_name);
                
                // Store user data for role-based access
                this.currentUser = sessionData.user;
                this.currentStoreId = sessionData.user.store_id;
                this.currentStoreName = sessionData.user.store_name;
                
                // Show user info and logout button in sidebar
                const userInfoContainer = document.getElementById('userInfo');
                if (userInfoContainer) {
                    try {
                        const roleIcon = sessionData.user.role === 'Owner' ? '🏪' : '👑';
                        const roleColor = sessionData.user.role === 'Owner' ? 'text-blue-400' : 'text-green-400';
                        
                        userInfoContainer.innerHTML = `
                            <div class="p-4 border-t border-gray-700">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center">
                                        <span class="text-sm text-gray-300">👤 ${sessionData.user.username}</span>
                                        <span class="ml-2 text-xs ${roleColor}">${roleIcon} ${sessionData.user.role}</span>
                                    </div>
                                    <button onclick="logout()" class="text-red-400 hover:text-red-300 text-sm">
                                        <i class="fas fa-sign-out-alt"></i>
                                    </button>
                                </div>
                                <div class="text-xs text-gray-400">
                                    🏪 ${sessionData.user.store_name}
                                </div>
                                ${sessionData.user.role === 'Owner' ? '<div class="text-xs text-yellow-400 mt-1">⚠️ Akses terbatas ke toko ini</div>' : ''}
                            </div>
                        `;
                    } catch (error) {
                        console.error('❌ Error parsing user session for sidebar:', error);
                    }
                }
                
                // Role-based access control
                if (sessionData.user.role === 'Owner') {
                    console.log('👤 Owner access - Restricted to:', sessionData.user.store_name);
                    // Owner can only access their own store
                    this.isOwnerMode = true;
                } else if (sessionData.user.role === 'Admin') {
                    console.log('👤 Admin access - Can access all stores');
                    this.isOwnerMode = false;
                } else {
                    console.log('⚠️ Unknown role, defaulting to owner mode');
                    this.isOwnerMode = true;
                }
                
                return true;
            } else {
                console.log('⏰ Session expired');
                this.clearSession();
                return false;
            }
        } catch (error) {
            console.error('❌ Error parsing session data:', error);
            this.clearSession();
            return false;
        }
    }
    
    redirectToLogin() {
        console.log('🔄 Redirecting to login page');
        
        document.body.innerHTML = `
            <div class="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                <div class="text-center text-white">
                    <i class="fas fa-sign-in-alt text-6xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">Sesi Berakhir</h2>
                    <p class="mb-6">Silakan login kembali untuk mengakses dashboard...</p>
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    redirectToStoreSelection() {
        // Clear any invalid store data
        localStorage.removeItem('selectedStoreId');
        localStorage.removeItem('selectedStoreName');
        
        // Show message and redirect
        document.body.innerHTML = `
            <div class="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                <div class="text-center text-white">
                    <i class="fas fa-store text-6xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">Pilih Toko Terlebih Dahulu</h2>
                    <p class="mb-6">Anda akan diarahkan ke halaman pemilihan toko...</p>
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            window.location.href = 'pilih-toko.html';
        }, 2000);
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        
        mobileMenuBtn?.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn?.addEventListener('click', () => {
            this.refreshDashboard();
        });

        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Auto refresh every 5 minutes
        setInterval(() => {
            this.refreshDashboard();
        }, 5 * 60 * 1000);
    }

    setCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'Asia/Jakarta'
        };
        document.getElementById('currentDate').textContent = 
            now.toLocaleDateString('id-ID', options);
    }

    async loadDashboardData() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Load data in parallel for better performance
            const [transactions, menu, stores] = await Promise.all([
                this.fetchTransactions(),
                this.fetchMenu(),
                this.fetchStores()
            ]);

            // Update cache
            this.cache.transactions = transactions;
            this.cache.menu = menu;
            this.cache.lastUpdated = new Date();

            // Calculate and display metrics
            await this.calculateAndDisplayMetrics();
            
            // Create charts
            this.createSalesTrendChart();
            
            // Display top menu list
            this.displayTopMenuList();
            
            console.log('Dashboard data loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Gagal memuat data. Periksa koneksi internet Anda.');
        }
    }

    async fetchTransactions() {
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        const { data, error } = await this.supabase
            .from('transaksi')
            .select(`
                *,
                transaksi_detail (
                    *,
                    menu (nama, harga)
                )
            `)
            .gte('created_at', sevenDaysAgo.toISOString())
            .eq('toko_id', this.currentStoreId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async fetchMenu() {
        const { data, error } = await this.supabase
            .from('menu')
            .select('*')
            .eq('toko_id', this.currentStoreId)
            .order('nama');

        if (error) throw error;
        return data || [];
    }

    async fetchStores() {
        const { data, error } = await this.supabase
            .from('toko')
            .select('*')
            .eq('id', this.currentStoreId);

        if (error) throw error;
        
        // Update store name in sidebar with selected store name
        const storeNameEl = document.getElementById('storeName');
        if (storeNameEl) {
            if (data && data.length > 0) {
                storeNameEl.textContent = data[0].nama_toko.toUpperCase();
                this.currentStoreName = data[0].nama_toko;
            } else {
                storeNameEl.textContent = this.currentStoreName.toUpperCase();
            }
        }
        
        return data || [];
    }

    async calculateAndDisplayMetrics() {
        const today = new Date();
        const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
        
        // Filter transactions for today and yesterday
        const todayTransactions = this.filterTransactionsByDate(this.cache.transactions, today);
        const yesterdayTransactions = this.filterTransactionsByDate(this.cache.transactions, yesterday);
        
        // Calculate metrics
        const metrics = {
            todayRevenue: this.calculateRevenue(todayTransactions),
            yesterdayRevenue: this.calculateRevenue(yesterdayTransactions),
            todayCustomers: this.countUniqueCustomers(todayTransactions),
            yesterdayCustomers: this.countUniqueCustomers(yesterdayTransactions),
            todayProfit: this.calculateProfit(todayTransactions),
            topMenu: this.getTopMenu(todayTransactions),
            newCustomers: this.countNewCustomers(todayTransactions),
            avgTransaction: this.calculateAverageTransaction(todayTransactions),
            peakHour: this.calculatePeakHour(todayTransactions)
        };

        // Update UI
        this.updateKPICards(metrics);
    }

    filterTransactionsByDate(transactions, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const transactionDate = new Date(t.created_at);
            return transactionDate >= startOfDay && transactionDate <= endOfDay;
        });
    }

    calculateRevenue(transactions) {
        return transactions.reduce((sum, t) => sum + (t.total || 0), 0);
    }

    countUniqueCustomers(transactions) {
        const uniqueCustomers = new Set();
        transactions.forEach(t => {
            if (t.pelanggan_id) {
                uniqueCustomers.add(t.pelanggan_id);
            } else if (t.no_hp_pembeli) {
                uniqueCustomers.add(t.no_hp_pembeli);
            } else {
                uniqueCustomers.add(t.nama_pembeli || 'guest_' + t.id);
            }
        });
        return uniqueCustomers.size;
    }

    calculateProfit(transactions) {
        // Simplified profit calculation (assuming 30% margin)
        // In real implementation, you'd calculate based on menu costs
        const revenue = this.calculateRevenue(transactions);
        return Math.round(revenue * 0.3);
    }

    getTopMenu(transactions) {
        const menuCount = {};
        
        transactions.forEach(t => {
            if (t.transaksi_detail) {
                t.transaksi_detail.forEach(detail => {
                    const menuName = detail.nama_menu || 'Unknown';
                    menuCount[menuName] = (menuCount[menuName] || 0) + detail.qty;
                });
            }
        });

        const sortedMenu = Object.entries(menuCount)
            .sort(([,a], [,b]) => b - a);

        return sortedMenu.length > 0 ? {
            name: sortedMenu[0][0],
            count: sortedMenu[0][1]
        } : { name: 'Tidak ada data', count: 0 };
    }

    countNewCustomers(transactions) {
        // Simplified: count transactions without pelanggan_id
        return transactions.filter(t => !t.pelanggan_id).length;
    }

    calculateAverageTransaction(transactions) {
        if (transactions.length === 0) return 0;
        const total = this.calculateRevenue(transactions);
        return Math.round(total / transactions.length);
    }

    calculatePeakHour(transactions) {
        const hourCount = {};
        
        transactions.forEach(t => {
            const hour = new Date(t.created_at).getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });

        const peakHour = Object.entries(hourCount)
            .sort(([,a], [,b]) => b - a)[0];

        if (peakHour) {
            return {
                hour: `${peakHour[0].padStart(2, '0')}:00`,
                orders: peakHour[1]
            };
        }

        return { hour: '--:--', orders: 0 };
    }

    updateKPICards(metrics) {
        // Today Revenue
        document.getElementById('todayRevenue').textContent = 
            this.formatCurrency(metrics.todayRevenue);
        
        const revenueGrowth = this.calculateGrowthPercentage(
            metrics.todayRevenue, 
            metrics.yesterdayRevenue
        );
        this.updateGrowthIndicator('revenueGrowth', revenueGrowth);

        // Today Customers
        document.getElementById('todayCustomers').textContent = metrics.todayCustomers;
        
        const customerGrowth = this.calculateGrowthPercentage(
            metrics.todayCustomers, 
            metrics.yesterdayCustomers
        );
        this.updateGrowthIndicator('customerGrowth', customerGrowth);

        // Top Menu
        document.getElementById('topMenu').textContent = metrics.topMenu.name;
        document.getElementById('topMenuSales').textContent = 
            `${metrics.topMenu.count} terjual`;

        // Today Profit
        document.getElementById('todayProfit').textContent = 
            this.formatCurrency(metrics.todayProfit);
        
        const profitMargin = metrics.todayRevenue > 0 ? 
            Math.round((metrics.todayProfit / metrics.todayRevenue) * 100) : 0;
        document.getElementById('profitMargin').innerHTML = 
            `<span class="text-green-600">Margin: ${profitMargin}%</span>`;

        // Quick Stats
        document.getElementById('peakHour').textContent = metrics.peakHour.hour;
        document.getElementById('peakHourOrders').textContent = 
            `${metrics.peakHour.orders} pesanan`;
        document.getElementById('newCustomers').textContent = metrics.newCustomers;
        document.getElementById('avgTransaction').textContent = 
            this.formatCurrency(metrics.avgTransaction);
    }

    calculateGrowthPercentage(current, previous) {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    updateGrowthIndicator(elementId, growthPercentage) {
        const element = document.getElementById(elementId);
        const isPositive = growthPercentage >= 0;
        const icon = isPositive ? '↗' : '↘';
        const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
        
        element.innerHTML = `<span class="${colorClass}">${icon} ${Math.abs(growthPercentage)}% dari kemarin</span>`;
    }

    createSalesTrendChart() {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;

        // Prepare data for last 7 days
        const last7Days = this.getLast7DaysData();
        
        // Destroy existing chart
        if (this.salesTrendChart) {
            this.salesTrendChart.destroy();
        }

        this.salesTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.labels,
                datasets: [{
                    label: 'Pendapatan (Rp)',
                    data: last7Days.revenue,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3B82F6',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `Pendapatan: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6B7280',
                            callback: (value) => {
                                return this.formatCurrencyShort(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    getLast7DaysData() {
        const labels = [];
        const revenue = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dayTransactions = this.filterTransactionsByDate(this.cache.transactions, date);
            const dayRevenue = this.calculateRevenue(dayTransactions);
            
            labels.push(date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
            revenue.push(dayRevenue);
        }
        
        return { labels, revenue };
    }

    displayTopMenuList() {
        const topMenuList = document.getElementById('topMenuList');
        if (!topMenuList) return;

        // Get top 5 menu items from all transactions
        const menuStats = this.getMenuStatistics();
        const top5Menu = menuStats.slice(0, 5);

        topMenuList.innerHTML = top5Menu.map((menu, index) => `
            <div class="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        ${index + 1}
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">${menu.name}</p>
                        <p class="text-sm text-gray-600">${menu.count} terjual</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-800">${this.formatCurrency(menu.revenue)}</p>
                    <p class="text-sm text-gray-600">Revenue</p>
                </div>
            </div>
        `).join('');
    }

    getMenuStatistics() {
        const menuStats = {};
        
        this.cache.transactions.forEach(t => {
            if (t.transaksi_detail) {
                t.transaksi_detail.forEach(detail => {
                    const menuName = detail.nama_menu || 'Unknown';
                    if (!menuStats[menuName]) {
                        menuStats[menuName] = {
                            name: menuName,
                            count: 0,
                            revenue: 0
                        };
                    }
                    menuStats[menuName].count += detail.qty;
                    menuStats[menuName].revenue += detail.qty * detail.harga_satuan;
                });
            }
        });

        return Object.values(menuStats)
            .sort((a, b) => b.count - a.count);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatCurrencyShort(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)}K`;
        }
        return amount.toString();
    }

    showLoadingState() {
        // Add loading animation to KPI cards
        document.querySelectorAll('[id$="Revenue"], [id$="Customers"], [id$="Profit"]').forEach(el => {
            el.classList.add('animate-pulse-slow');
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    async refreshDashboard() {
        const refreshBtn = document.getElementById('refreshBtn');
        const icon = refreshBtn.querySelector('i');
        
        // Add spinning animation
        icon.classList.add('animate-spin');
        
        try {
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showError('Gagal memperbarui data');
        } finally {
            // Remove spinning animation
            icon.classList.remove('animate-spin');
        }
    }

    switchSection(section) {
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active', 'bg-primary', 'text-white');
            item.classList.add('text-gray-700', 'hover:bg-white/50');
        });
        
        const activeItem = document.querySelector(`[data-section="${section}"]`);
        if (activeItem) {
            activeItem.classList.add('active', 'bg-primary', 'text-white');
            activeItem.classList.remove('text-gray-700', 'hover:bg-white/50');
        }

        // For now, just show a message for other sections
        if (section !== 'dashboard') {
            this.showError(`Fitur ${section} akan segera hadir!`);
        }
    }

    createSalesTrendChart() {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx) return;

        // Prepare data for last 7 days
        const last7Days = this.getLast7DaysData();
        
        // Destroy existing chart
        if (this.salesTrendChart) {
            this.salesTrendChart.destroy();
        }

        this.salesTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.labels,
                datasets: [{
                    label: 'Pendapatan (Rp)',
                    data: last7Days.revenue,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3B82F6',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `Pendapatan: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6B7280',
                            callback: (value) => {
                                return this.formatCurrencyShort(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    getLast7DaysData() {
        const labels = [];
        const revenue = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const dayTransactions = this.filterTransactionsByDate(this.cache.transactions, date);
            const dayRevenue = this.calculateRevenue(dayTransactions);
            
            labels.push(date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
            revenue.push(dayRevenue);
        }
        
        return { labels, revenue };
    }

    displayTopMenuList() {
        const topMenuList = document.getElementById('topMenuList');
        if (!topMenuList) return;

        // Get top 5 menu items from all transactions
        const menuStats = this.getMenuStatistics();
        const top5Menu = menuStats.slice(0, 5);

        topMenuList.innerHTML = top5Menu.map((menu, index) => `
            <div class="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        ${index + 1}
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">${menu.name}</p>
                        <p class="text-sm text-gray-600">${menu.count} terjual</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-800">${this.formatCurrency(menu.revenue)}</p>
                    <p class="text-sm text-gray-600">Revenue</p>
                </div>
            </div>
        `).join('');
    }

    getMenuStatistics() {
        const menuStats = {};
        
        this.cache.transactions.forEach(t => {
            if (t.transaksi_detail) {
                t.transaksi_detail.forEach(detail => {
                    const menuName = detail.nama_menu || 'Unknown';
                    if (!menuStats[menuName]) {
                        menuStats[menuName] = {
                            name: menuName,
                            count: 0,
                            revenue: 0
                        };
                    }
                    menuStats[menuName].count += detail.qty;
                    menuStats[menuName].revenue += detail.qty * detail.harga_satuan;
                });
            }
        });

        return Object.values(menuStats)
            .sort((a, b) => b.count - a.count);
    }

    formatCurrencyShort(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)}K`;
        }
        return amount.toString();
    }

    // Clear session data
    clearSession() {
        console.log('🧹 Clearing session data...');
        localStorage.removeItem('userSession');
        localStorage.removeItem('selectedStoreId');
        localStorage.removeItem('selectedStoreName');
        console.log('✅ Session data cleared');
    }

    // Show store selection button (Admin only)
    showStoreSelectionButton() {
        const storeButton = document.getElementById('storeSelectionButton');
        if (storeButton) {
            storeButton.style.display = 'block';
            console.log('✅ Store selection button shown (Admin access)');
        }
    }

    // Hide store selection button (Owner/restricted access)
    hideStoreSelectionButton() {
        const storeButton = document.getElementById('storeSelectionButton');
        if (storeButton) {
            storeButton.style.display = 'none';
            console.log('🚫 Store selection button hidden (Owner/restricted access)');
        }
    }
}

// Global function to change store (Admin only)
function changeStore() {
    // Check if user is Admin
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
        try {
            const sessionData = JSON.parse(userSession);
            if (sessionData.user.role === 'Owner') {
                alert('⚠️ Owner tidak dapat mengganti toko. Anda hanya dapat mengakses toko yang terdaftar.');
                return;
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }
    
    // Clear current store selection (Admin only)
    localStorage.removeItem('selectedStoreId');
    localStorage.removeItem('selectedStoreName');
    
    // Show loading message
    document.body.innerHTML = `
        <div class="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
            <div class="text-center text-white">
                <i class="fas fa-store text-6xl mb-4"></i>
                <h2 class="text-2xl font-bold mb-2">Mengganti Toko</h2>
                <p class="mb-6">Kembali ke halaman pemilihan toko...</p>
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
        </div>
    `;
    
    // Redirect to store selection page
    setTimeout(() => {
        window.location.href = 'pilih-toko.html';
    }, 1500);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardAnalytics();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardAnalytics;
}
