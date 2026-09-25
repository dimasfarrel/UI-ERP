/**
 * ERP System Web Application (Project Malang)
 * Complete interactive logic for:
 * - Onboarding (Login, Select Business, Cost Center, Gudang)
 * - Navigation across Modules (Overview, Sales, Purchasing, Inventory)
 * - Interactive Form Penjualan (Sales Invoices) & Form Pembelian (Purchase Orders)
 * - Dynamic line items, real-time calculations (PPN 11%, discounts, subtotal, grand total)
 * - Transaction creation and state updates
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentView: 'view-login',
    activeModule: 'overview',
    auth: {
      isLoggedIn: true,
      username: 'admin_malang',
      database: 'ERP_MALANG_PROD',
      location: 'Malang Sentral',
      port: '8080'
    },
    selection: {
      business: null,
      costCenter: null,
      warehouse: null
    },
    tableFilter: 'all',
    searchQuery: '',

    // Dynamic Lists
    salesInvoices: [
      { id: 'INV-2026-001', date: '2026-09-19', customer: 'PT Surya Gemilang Kencana', warehouse: 'Gudang Utama Malang', amount: 'Rp 48.500.000', status: 'Lunas', badgeClass: 'badge-success' },
      { id: 'INV-2026-002', date: '2026-09-17', customer: 'PT Bintang Mitra Sejahtera', warehouse: 'Gudang Transit Singosari', amount: 'Rp 32.200.000', status: 'Lunas', badgeClass: 'badge-success' },
      { id: 'INV-2026-003', date: '2026-09-15', customer: 'CV Cipta Karya Mandiri', warehouse: 'Gudang Distribusi Retail', amount: 'Rp 18.750.000', status: 'Belum Lunas', badgeClass: 'badge-warning' },
      { id: 'INV-2026-004', date: '2026-09-12', customer: 'Toko Makmur Sentosa Malang', warehouse: 'Gudang Utama Malang', amount: 'Rp 9.400.000', status: 'Lunas', badgeClass: 'badge-success' }
    ],

    purchaseOrders: [
      { id: 'PO-2026-088', date: '2026-09-18', vendor: 'CV Multi Baja Nusantara', warehouse: 'Gudang Bahan Baku (Batu)', amount: 'Rp 112.000.000', status: 'Menunggu Otorisasi', badgeClass: 'badge-warning' },
      { id: 'PO-2026-087', date: '2026-09-16', vendor: 'PT Delta Elektronik Utama', warehouse: 'Gudang Utama Malang', amount: 'Rp 84.750.000', status: 'Selesai Diterima', badgeClass: 'badge-success' },
      { id: 'PO-2026-086', date: '2026-09-14', vendor: 'PT Logam Presisi Abadi', warehouse: 'Gudang Transit Singosari', amount: 'Rp 45.000.000', status: 'Selesai Diterima', badgeClass: 'badge-success' }
    ],

    recentTransactions: [
      { id: 'INV-2026-001', date: '19 Sep 2026', partner: 'PT Surya Gemilang Kencana', type: 'Sales Order', amount: 'Rp 48.500.000', status: 'Completed', badgeClass: 'badge-success' },
      { id: 'PO-2026-088', date: '18 Sep 2026', partner: 'CV Multi Baja Nusantara', type: 'Purchase Order', amount: 'Rp 112.000.000', status: 'Processing', badgeClass: 'badge-info' },
      { id: 'TRF-2026-034', date: '18 Sep 2026', partner: 'Gudang Singosari → Malang', type: 'Stock Transfer', amount: '350 Units', status: 'In Transit', badgeClass: 'badge-warning' },
      { id: 'INV-2026-002', date: '17 Sep 2026', partner: 'PT Bintang Mitra Sejahtera', type: 'Sales Order', amount: 'Rp 32.200.000', status: 'Completed', badgeClass: 'badge-success' },
      { id: 'PO-2026-087', date: '16 Sep 2026', partner: 'PT Delta Elektronik Utama', type: 'Purchase Order', amount: 'Rp 84.750.000', status: 'Completed', badgeClass: 'badge-success' },
      { id: 'RET-2026-005', date: '15 Sep 2026', partner: 'Toko Makmur Sentosa', type: 'Customer Return', amount: 'Rp 4.100.000', status: 'Pending Review', badgeClass: 'badge-danger' }
    ]
  };

  // Mock Business Entities
  const businessEntities = [
    {
      id: 'biz-1',
      name: 'PT Malang Manufaktur Utama',
      code: 'MMU-01',
      desc: 'Pusat operasional manufaktur, perakitan komponen, dan jalur produksi terpadu Jawa Timur.',
      icon: '🏭',
      category: 'Manufaktur & Pabrikasi',
      activeProjects: '14 Proyek Aktif'
    },
    {
      id: 'biz-2',
      name: 'PT Distribusi Logistik Malang',
      code: 'DLM-02',
      desc: 'Unit distribusi rantai pasok, armada pengiriman regional, dan pengelolaan kargo antarkota.',
      icon: '🚚',
      category: 'Distribusi & Ekspedisi',
      activeProjects: '8 Rute Distribusi'
    },
    {
      id: 'biz-3',
      name: 'Malang Retail & Niaga Prima',
      code: 'RNP-03',
      desc: 'Jaringan gerai retail, point of sale langsung konsumen, dan pusat penjualan produk jadi.',
      icon: '🛒',
      category: 'Retail & Komersial',
      activeProjects: '6 Outlet Cabang'
    },
    {
      id: 'biz-4',
      name: 'PT Solusi Agrobisnis Malang',
      code: 'SAM-04',
      desc: 'Pengolahan hasil komoditas, pendingin sentral, dan pengadaan bahan baku primer industri.',
      icon: '🌱',
      category: 'Agrobisnis & Pangan',
      activeProjects: '5 Sentra Tani'
    }
  ];

  // Mock Cost Centers
  const costCenters = [
    {
      id: 'cc-1',
      name: 'CC-101: Divisi Pabrikasi & Produksi',
      code: 'CC-PROD',
      desc: 'Pusat biaya perakitan mesin, pemeliharaan lini pabrik, dan overhead utilitas.',
      icon: '⚙️',
      budget: 'Rp 4.250.000.000 / th',
      utilization: '68% Terpakai'
    },
    {
      id: 'cc-2',
      name: 'CC-201: Divisi Logistik, Armada & Kargo',
      code: 'CC-LOG',
      desc: 'Biaya operasional bahan bakar armada, pemeliharaan truk box, dan tim kurir regional.',
      icon: '📦',
      budget: 'Rp 2.100.000.000 / th',
      utilization: '74% Terpakai'
    },
    {
      id: 'cc-3',
      name: 'CC-301: Manajemen Operasional & Kantor Pusat',
      code: 'CC-HQ',
      desc: 'Administrasi perusahaan, SDM, perizinan legal, IT, dan pengadaan perlengkapan kantor.',
      icon: '🏢',
      budget: 'Rp 1.850.000.000 / th',
      utilization: '52% Terpakai'
    },
    {
      id: 'cc-4',
      name: 'CC-401: Penjualan, Marketing & Relasi Pelanggan',
      code: 'CC-MKT',
      desc: 'Anggaran promosi, retargeting pasar, pameran industri B2B, dan komisi tim sales.',
      icon: '📈',
      budget: 'Rp 950.000.000 / th',
      utilization: '81% Terpakai'
    }
  ];

  // Mock Warehouses (Gudang)
  const warehouses = [
    {
      id: 'wh-1',
      name: 'Gudang Utama Malang (Kepanjen)',
      code: 'WH-MLG-01',
      desc: 'Gudang sentral kapasitas 15.000 m² untuk penyimpanan barang jadi dan suku cadang.',
      icon: '🏬',
      capacity: '84% Terisi (12.600 m²)',
      status: 'Aktif / Optimal'
    },
    {
      id: 'wh-2',
      name: 'Gudang Transit Singosari',
      code: 'WH-SGS-02',
      desc: 'Pusat sorting cepat untuk pengiriman harian menuju Surabaya Raya & Jalur Pantura.',
      icon: '🚛',
      capacity: '58% Terisi (4.600 m²)',
      status: 'Operasional 24 Jam'
    },
    {
      id: 'wh-3',
      name: 'Gudang Bahan Baku & Komponen (Batu)',
      code: 'WH-BTU-03',
      desc: 'Fasilitas penyimpanan beriklim khusus untuk raw material dan sparepart sensitif.',
      icon: '🧊',
      capacity: '42% Terisi (3.200 m²)',
      status: 'Suhu Terkontrol'
    },
    {
      id: 'wh-4',
      name: 'Gudang Distribusi Retail (Lowokwaru)',
      code: 'WH-LKW-04',
      desc: 'Hub pemenuhan pesanan retail lokal Malang Kota dan instant dispatch.',
      icon: '⚡',
      capacity: '91% Terisi (2.800 m²)',
      status: 'High Turnover'
    }
  ];

  // Helpers: Currency Formatter
  function formatRupiah(number) {
    return 'Rp ' + Math.round(number).toLocaleString('id-ID');
  }

  // Toast Notifications
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <div style="font-size: 1.25rem;">${type === 'success' ? '✓' : 'ℹ'}</div>
      <div style="font-size: 0.9rem; font-weight: 500;">${message}</div>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Switch View Function (Onboarding vs Dashboard)
  function switchView(targetViewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    const targetEl = document.getElementById(targetViewId);
    if (targetEl) {
      targetEl.classList.add('active');
      state.currentView = targetViewId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Switch Active ERP Module (Overview, Sales, Purchasing, Inventory, etc.)
  function switchModule(moduleName) {
    state.activeModule = moduleName;

    // Update Sidebar Active state
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      const mod = item.getAttribute('data-module');
      if (mod === moduleName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle Module Sections
    document.querySelectorAll('.module-section').forEach(section => {
      section.style.display = 'none';
    });

    const targetSection = document.getElementById(`module-${moduleName}`);
    if (targetSection) {
      targetSection.style.display = 'block';
    } else {
      // Default fallback
      const overviewSec = document.getElementById('module-overview');
      if (overviewSec) overviewSec.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Render Selection Grids
  function renderBusinessGrid() {
    const grid = document.getElementById('grid-business-list');
    if (!grid) return;
    grid.innerHTML = businessEntities.map(biz => `
      <div class="selection-card ${state.selection.business?.id === biz.id ? 'active-selected' : ''}" data-id="${biz.id}">
        <div class="card-icon-bubble">${biz.icon}</div>
        <h3>${biz.name}</h3>
        <p class="card-desc">${biz.desc}</p>
        <div class="card-meta-list">
          <div class="meta-item">
            <span class="meta-label">Kode Entitas</span>
            <span class="meta-val">${biz.code}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Kategori</span>
            <span class="meta-val">${biz.category}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="meta-val" style="color: var(--success);">${biz.activeProjects}</span>
          </div>
        </div>
        <div class="card-action-bar">
          <button class="btn-card-select" data-id="${biz.id}">Pilih Bisnis Ini →</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.selection-card, .btn-card-select').forEach(elem => {
      elem.addEventListener('click', (e) => {
        const id = elem.getAttribute('data-id') || elem.closest('.selection-card').getAttribute('data-id');
        const selected = businessEntities.find(b => b.id === id);
        if (selected) {
          state.selection.business = selected;
          showToast(`Bisnis terpilih: ${selected.name}`, 'info');
          renderCostCenterGrid();
          switchView('view-costcenter');
        }
      });
    });
  }

  function renderCostCenterGrid() {
    const grid = document.getElementById('grid-costcenter-list');
    if (!grid) return;
    grid.innerHTML = costCenters.map(cc => `
      <div class="selection-card ${state.selection.costCenter?.id === cc.id ? 'active-selected' : ''}" data-id="${cc.id}">
        <div class="card-icon-bubble">${cc.icon}</div>
        <h3>${cc.name}</h3>
        <p class="card-desc">${cc.desc}</p>
        <div class="card-meta-list">
          <div class="meta-item">
            <span class="meta-label">Kode CC</span>
            <span class="meta-val">${cc.code}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Alokasi Anggaran</span>
            <span class="meta-val">${cc.budget}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Utilisasi</span>
            <span class="meta-val" style="color: var(--primary);">${cc.utilization}</span>
          </div>
        </div>
        <div class="card-action-bar">
          <button class="btn-card-select" data-id="${cc.id}">Gunakan Cost Center →</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.selection-card, .btn-card-select').forEach(elem => {
      elem.addEventListener('click', (e) => {
        const id = elem.getAttribute('data-id') || elem.closest('.selection-card').getAttribute('data-id');
        const selected = costCenters.find(c => c.id === id);
        if (selected) {
          state.selection.costCenter = selected;
          showToast(`Cost Center: ${selected.name}`, 'info');
          renderGudangGrid();
          switchView('view-gudang');
        }
      });
    });
  }

  function renderGudangGrid() {
    const grid = document.getElementById('grid-gudang-list');
    if (!grid) return;
    grid.innerHTML = warehouses.map(wh => `
      <div class="selection-card ${state.selection.warehouse?.id === wh.id ? 'active-selected' : ''}" data-id="${wh.id}">
        <div class="card-icon-bubble">${wh.icon}</div>
        <h3>${wh.name}</h3>
        <p class="card-desc">${wh.desc}</p>
        <div class="card-meta-list">
          <div class="meta-item">
            <span class="meta-label">Kode Gudang</span>
            <span class="meta-val">${wh.code}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Kapasitas</span>
            <span class="meta-val">${wh.capacity}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Kondisi</span>
            <span class="meta-val" style="color: var(--success);">${wh.status}</span>
          </div>
        </div>
        <div class="card-action-bar">
          <button class="btn-card-select" data-id="${wh.id}">Buka Gudang Ini →</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.selection-card, .btn-card-select').forEach(elem => {
      elem.addEventListener('click', (e) => {
        const id = elem.getAttribute('data-id') || elem.closest('.selection-card').getAttribute('data-id');
        const selected = warehouses.find(w => w.id === id);
        if (selected) {
          state.selection.warehouse = selected;
          updateDashboardContext();
          showToast(`Sistem ERP Siap! Selamat datang di ${selected.name}`, 'success');
          switchView('view-dashboard');
          switchModule('overview');
        }
      });
    });
  }

  // Update Topbar Context tags in Dashboard
  function updateDashboardContext() {
    const tagBiz = document.getElementById('tag-current-biz');
    const tagCC = document.getElementById('tag-current-cc');
    const tagWh = document.getElementById('tag-current-wh');
    const userLabel = document.getElementById('user-display-name');

    if (tagBiz && state.selection.business) tagBiz.textContent = state.selection.business.name;
    if (tagCC && state.selection.costCenter) tagCC.textContent = state.selection.costCenter.code;
    if (tagWh && state.selection.warehouse) tagWh.textContent = state.selection.warehouse.name.split(' (')[0];
    if (userLabel && state.auth.username) userLabel.textContent = state.auth.username;
  }

  // =========================================================================
  // TABLES RENDERING (Dashboard Overview, Sales, Purchase)
  // =========================================================================
  function renderOverviewTable() {
    const tbody = document.getElementById('table-transactions-body');
    if (!tbody) return;

    const filtered = state.recentTransactions.filter(item => {
      if (state.tableFilter === 'sales') return item.type.includes('Sales');
      if (state.tableFilter === 'purchase') return item.type.includes('Purchase');
      if (state.tableFilter === 'transfer') return item.type.includes('Transfer');
      return true;
    });

    tbody.innerHTML = filtered.map(row => `
      <tr>
        <td style="font-weight: 600; font-family: monospace; color: var(--primary);">${row.id}</td>
        <td>${row.date}</td>
        <td><strong>${row.partner}</strong></td>
        <td>${row.type}</td>
        <td style="font-weight: 600;">${row.amount}</td>
        <td><span class="badge-status ${row.badgeClass}">● ${row.status}</span></td>
        <td>
          <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" title="Lihat Detail">🔍</button>
        </td>
      </tr>
    `).join('');
  }

  function renderSalesTable() {
    const tbody = document.getElementById('sales-table-body');
    if (!tbody) return;

    const statusFilter = document.getElementById('filter-sales-status')?.value || 'all';
    const whFilter = document.getElementById('filter-sales-warehouse')?.value || 'all';
    const searchQuery = (document.getElementById('search-sales-input')?.value || '').toLowerCase().trim();

    const filtered = state.salesInvoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (whFilter !== 'all' && !inv.warehouse.includes(whFilter.split(' (')[0])) return false;
      if (searchQuery) {
        const matchId = inv.id.toLowerCase().includes(searchQuery);
        const matchCust = inv.customer.toLowerCase().includes(searchQuery);
        const matchWh = inv.warehouse.toLowerCase().includes(searchQuery);
        if (!matchId && !matchCust && !matchWh) return false;
      }
      return true;
    });

    const countEl = document.getElementById('sales-record-count');
    if (countEl) countEl.textContent = `${filtered.length} Faktur Terdata`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 2rem; color: #94A3B8;">Tidak ada faktur yang sesuai filter</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(inv => `
      <tr>
        <td style="font-weight: 600; font-family: monospace; color: var(--primary);">${inv.id}</td>
        <td>${inv.date}</td>
        <td><strong>${inv.customer}</strong></td>
        <td>${inv.warehouse}</td>
        <td style="font-weight: 600; color: #0F172A;">${inv.amount}</td>
        <td><span class="badge-status ${inv.badgeClass}">● ${inv.status}</span></td>
        <td>
          <button style="background:none; border:none; color:var(--primary); font-weight: 600; cursor:pointer;" onclick="alert('Mencetak faktur: ${inv.id}')">Cetak Faktur</button>
        </td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // FIGMA OVERLAY: CALCULATIONS & DYNAMIC ROWS (#2038:6036)
  // =========================================================================
  function calculateOverlaySalesTotals() {
    const tbody = document.getElementById('overlay-sales-items-tbody');
    if (!tbody) return;

    let subtotal = 0;
    tbody.querySelectorAll('tr').forEach(row => {
      const qty = parseFloat(row.querySelector('.overlay-item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.overlay-item-price')?.value) || 0;
      const discount = parseFloat(row.querySelector('.overlay-item-disc')?.value) || 0;
      const taxRate = parseFloat(row.querySelector('.overlay-item-tax')?.value) || 0;

      const baseAmount = Math.max(0, (qty * price) - discount);
      const rowTax = baseAmount * (taxRate / 100);
      const rowTotal = baseAmount + rowTax;
      subtotal += baseAmount;

      const totalField = row.querySelector('.overlay-item-total');
      if (totalField) totalField.value = formatRupiah(rowTotal);
    });

    const tax = subtotal * 0.11; // 11% PPN
    const grandTotal = subtotal + tax;

    const subtotalEl = document.getElementById('overlay-calc-subtotal');
    const taxEl = document.getElementById('overlay-calc-tax');
    const grandTotalEl = document.getElementById('overlay-calc-grandtotal');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
    if (taxEl) taxEl.textContent = formatRupiah(tax);
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);
  }

  function addOverlaySalesRow(product = '', desc = '', qty = 1, unit = 'Pcs', price = 0, disc = 0, tax = 11) {
    const tbody = document.getElementById('overlay-sales-items-tbody');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <input type="text" class="table-input-cell overlay-item-name" value="${product}" placeholder="Nama Produk..." required>
      </td>
      <td>
        <input type="text" class="table-input-cell overlay-item-desc" value="${desc}" placeholder="Deskripsi item...">
      </td>
      <td>
        <input type="number" class="table-input-cell overlay-item-qty" value="${qty}" min="1" required style="text-align: center;">
      </td>
      <td>
        <select class="table-input-cell overlay-item-unit">
          <option value="Pcs" ${unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
          <option value="Unit" ${unit === 'Unit' ? 'selected' : ''}>Unit</option>
          <option value="Box" ${unit === 'Box' ? 'selected' : ''}>Box</option>
          <option value="Set" ${unit === 'Set' ? 'selected' : ''}>Set</option>
        </select>
      </td>
      <td>
        <input type="number" class="table-input-cell overlay-item-price" value="${price}" min="0" required style="text-align: right;">
      </td>
      <td>
        <input type="number" class="table-input-cell overlay-item-disc" value="${disc}" min="0" style="text-align: right;">
      </td>
      <td>
        <select class="table-input-cell overlay-item-tax">
          <option value="11" ${tax === 11 ? 'selected' : ''}>11%</option>
          <option value="0" ${tax === 0 ? 'selected' : ''}>0%</option>
        </select>
      </td>
      <td>
        <input type="text" class="table-input-cell overlay-item-total" readonly style="background: #F8F9FA; font-weight: 700; text-align: right; color: #1E293B;">
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-remove-overlay-row" style="background:none; border:none; color:#EF4444; font-size:1.1rem; cursor:pointer;" title="Hapus Baris">&times;</button>
      </td>
    `;

    tbody.appendChild(row);

    row.querySelectorAll('input, select').forEach(elem => {
      elem.addEventListener('input', calculateOverlaySalesTotals);
      elem.addEventListener('change', calculateOverlaySalesTotals);
    });

    row.querySelector('.btn-remove-overlay-row').addEventListener('click', () => {
      if (tbody.querySelectorAll('tr').length > 1) {
        row.remove();
        calculateOverlaySalesTotals();
      } else {
        showToast('Minimal harus ada 1 baris produk', 'info');
      }
    });

    calculateOverlaySalesTotals();
  }

  // =========================================================================
  // FIGMA OVERLAY: PURCHASE CALCULATIONS & DYNAMIC ROWS
  // =========================================================================
  function calculateOverlayPurchaseTotals() {
    const tbody = document.getElementById('overlay-purchase-items-tbody');
    if (!tbody) return;

    let subtotal = 0;
    tbody.querySelectorAll('tr').forEach(row => {
      const qty = parseFloat(row.querySelector('.overlay-item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.overlay-item-price')?.value) || 0;
      const discount = parseFloat(row.querySelector('.overlay-item-disc')?.value) || 0;
      const taxRate = parseFloat(row.querySelector('.overlay-item-tax')?.value) || 0;

      const baseAmount = Math.max(0, (qty * price) - discount);
      const rowTax = baseAmount * (taxRate / 100);
      const rowTotal = baseAmount + rowTax;
      subtotal += baseAmount;

      const totalField = row.querySelector('.overlay-item-total');
      if (totalField) totalField.value = formatRupiah(rowTotal);
    });

    const tax = subtotal * 0.11; // 11% PPN
    const grandTotal = subtotal + tax;

    const subtotalEl = document.getElementById('overlay-purchase-calc-subtotal');
    const taxEl = document.getElementById('overlay-purchase-calc-tax');
    const grandTotalEl = document.getElementById('overlay-purchase-calc-grandtotal');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
    if (taxEl) taxEl.textContent = formatRupiah(tax);
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);
  }

  function addOverlayPurchaseRow(product = '', desc = '', qty = 1, unit = 'Pcs', price = 0, disc = 0, tax = 11) {
    const tbody = document.getElementById('overlay-purchase-items-tbody');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <input type="text" class="table-input-cell overlay-item-name" value="${product}" placeholder="Nama Produk..." required>
      </td>
      <td>
        <input type="text" class="table-input-cell overlay-item-desc" value="${desc}" placeholder="Deskripsi item...">
      </td>
      <td>
        <input type="number" class="table-input-cell overlay-item-qty" value="${qty}" min="1" required style="text-align: center;">
      </td>
      <td>
        <select class="table-input-cell overlay-item-unit">
          <option value="Pcs" ${unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
          <option value="Unit" ${unit === 'Unit' ? 'selected' : ''}>Unit</option>
          <option value="Box" ${unit === 'Box' ? 'selected' : ''}>Box</option>
          <option value="Set" ${unit === 'Set' ? 'selected' : ''}>Set</option>
        </select>
      </td>
      <td>
        <input type="number" class="table-input-cell overlay-item-price" value="${price}" min="0" required style="text-align: right;">
      </td>
      <td>
        <input type="number" class="table-input-cell overlay-item-disc" value="${disc}" min="0" style="text-align: right;">
      </td>
      <td>
        <select class="table-input-cell overlay-item-tax">
          <option value="11" ${tax === 11 ? 'selected' : ''}>11%</option>
          <option value="0" ${tax === 0 ? 'selected' : ''}>0%</option>
        </select>
      </td>
      <td>
        <input type="text" class="table-input-cell overlay-item-total" readonly style="background: #F8F9FA; font-weight: 700; text-align: right; color: #1E293B;">
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-remove-overlay-row" style="background:none; border:none; color:#EF4444; font-size:1.1rem; cursor:pointer;" title="Hapus Baris">&times;</button>
      </td>
    `;

    tbody.appendChild(row);

    row.querySelectorAll('input, select').forEach(elem => {
      elem.addEventListener('input', calculateOverlayPurchaseTotals);
      elem.addEventListener('change', calculateOverlayPurchaseTotals);
    });

    row.querySelector('.btn-remove-overlay-row').addEventListener('click', () => {
      if (tbody.querySelectorAll('tr').length > 1) {
        row.remove();
        calculateOverlayPurchaseTotals();
      } else {
        showToast('Minimal harus ada 1 baris produk', 'info');
      }
    });

    calculateOverlayPurchaseTotals();
  }


  function renderPurchaseTable() {
    const tbody = document.getElementById('purchase-table-body');
    if (!tbody) return;

    tbody.innerHTML = state.purchaseOrders.map(po => `
      <tr>
        <td style="font-weight: 600; font-family: monospace; color: var(--primary);">${po.id}</td>
        <td>${po.date}</td>
        <td><strong>${po.vendor}</strong></td>
        <td>${po.warehouse}</td>
        <td style="font-weight: 600;">${po.amount}</td>
        <td><span class="badge-status ${po.badgeClass}">● ${po.status}</span></td>
        <td>
          <button style="background:none; border:none; color:var(--primary); font-weight: 600; cursor:pointer;">Cetak PO</button>
        </td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // SALES FORM: CALCULATIONS & DYNAMIC ROWS
  // =========================================================================
  function calculateSalesTotals() {
    const tbody = document.getElementById('sales-items-tbody');
    if (!tbody) return;

    let subtotal = 0;
    tbody.querySelectorAll('tr').forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
      const total = qty * price;
      subtotal += total;

      const totalField = row.querySelector('.item-total');
      if (totalField) totalField.value = formatRupiah(total);
    });

    const discountInput = document.getElementById('sales-discount-input');
    const discount = parseFloat(discountInput?.value) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * 0.11; // 11% PPN
    const grandTotal = taxableAmount + tax;

    const subtotalEl = document.getElementById('sales-calc-subtotal');
    const taxEl = document.getElementById('sales-calc-tax');
    const grandTotalEl = document.getElementById('sales-calc-grandtotal');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
    if (taxEl) taxEl.textContent = formatRupiah(tax);
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);
  }

  function addSalesRow(name = '', qty = 1, unit = 'Pcs', price = 0) {
    const tbody = document.getElementById('sales-items-tbody');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <input type="text" class="table-input item-name" placeholder="Nama / Kode Produk" value="${name}" required>
      </td>
      <td>
        <input type="number" class="table-input item-qty" value="${qty}" min="1" required>
      </td>
      <td>
        <select class="table-input item-unit">
          <option value="Pcs" ${unit === 'Pcs' ? 'selected' : ''}>Pcs</option>
          <option value="Box" ${unit === 'Box' ? 'selected' : ''}>Box</option>
          <option value="Set" ${unit === 'Set' ? 'selected' : ''}>Set</option>
          <option value="Unit" ${unit === 'Unit' ? 'selected' : ''}>Unit</option>
        </select>
      </td>
      <td>
        <input type="number" class="table-input item-price" value="${price}" min="0" required>
      </td>
      <td>
        <input type="text" class="table-input item-total" value="${formatRupiah(qty * price)}" readonly style="background: #F1F5F9; font-weight: 600;">
      </td>
      <td>
        <button type="button" class="btn-remove-row" title="Hapus Baris">✕</button>
      </td>
    `;
    tbody.appendChild(row);

    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', calculateSalesTotals);
    });

    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (tbody.querySelectorAll('tr').length > 1) {
        row.remove();
        calculateSalesTotals();
      } else {
        showToast('Faktur harus memiliki minimal 1 baris item', 'info');
      }
    });

    calculateSalesTotals();
  }

  // =========================================================================
  // PURCHASE FORM: CALCULATIONS & DYNAMIC ROWS
  // =========================================================================
  function calculatePurchaseTotals() {
    const tbody = document.getElementById('purchase-items-tbody');
    if (!tbody) return;

    let subtotal = 0;
    tbody.querySelectorAll('tr').forEach(row => {
      const qty = parseFloat(row.querySelector('.purchase-item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.purchase-item-price')?.value) || 0;
      const total = qty * price;
      subtotal += total;

      const totalField = row.querySelector('.purchase-item-total');
      if (totalField) totalField.value = formatRupiah(total);
    });

    const tax = subtotal * 0.11; // 11% PPN
    const grandTotal = subtotal + tax;

    const subtotalEl = document.getElementById('purchase-calc-subtotal');
    const taxEl = document.getElementById('purchase-calc-tax');
    const grandTotalEl = document.getElementById('purchase-calc-grandtotal');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
    if (taxEl) taxEl.textContent = formatRupiah(tax);
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);
  }

  function addPurchaseRow(name = '', qty = 1, unit = 'Lembar', price = 0) {
    const tbody = document.getElementById('purchase-items-tbody');
    if (!tbody) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <input type="text" class="table-input purchase-item-name" placeholder="Nama Komponen" value="${name}" required>
      </td>
      <td>
        <input type="number" class="table-input purchase-item-qty" value="${qty}" min="1" required>
      </td>
      <td>
        <select class="table-input purchase-item-unit">
          <option value="Lembar" ${unit === 'Lembar' ? 'selected' : ''}>Lembar</option>
          <option value="Batang" ${unit === 'Batang' ? 'selected' : ''}>Batang</option>
          <option value="Kg" ${unit === 'Kg' ? 'selected' : ''}>Kg</option>
          <option value="Roll" ${unit === 'Roll' ? 'selected' : ''}>Roll</option>
        </select>
      </td>
      <td>
        <input type="number" class="table-input purchase-item-price" value="${price}" min="0" required>
      </td>
      <td>
        <input type="text" class="table-input purchase-item-total" value="${formatRupiah(qty * price)}" readonly style="background: #F1F5F9; font-weight: 600;">
      </td>
      <td>
        <button type="button" class="btn-remove-row" title="Hapus Baris">✕</button>
      </td>
    `;
    tbody.appendChild(row);

    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', calculatePurchaseTotals);
    });

    row.querySelector('.btn-remove-row').addEventListener('click', () => {
      if (tbody.querySelectorAll('tr').length > 1) {
        row.remove();
        calculatePurchaseTotals();
      } else {
        showToast('PO harus memiliki minimal 1 baris bahan', 'info');
      }
    });

    calculatePurchaseTotals();
  }

  // =========================================================================
  // EVENT LISTENERS & WIRING
  // =========================================================================

  // Login Form Submission
  const loginForm = document.getElementById('form-erp-login');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.auth.username = document.getElementById('login-username')?.value || 'admin_malang';
      state.auth.database = document.getElementById('login-database')?.value || 'erp_db_production';
      state.auth.location = document.getElementById('login-location')?.value || 'Malang Central Office';
      state.auth.port = document.getElementById('login-port')?.value || '5432';
      state.auth.isLoggedIn = true;

      showToast(`Login Berhasil! Mengakses Database: ${state.auth.database}`, 'success');
      renderBusinessGrid();
      switchView('view-business');
    });
  }

  // Demo Autofill Button for Login
  const demoAutofillBtn = document.getElementById('btn-demo-autofill');
  if (demoAutofillBtn) {
    demoAutofillBtn.addEventListener('click', () => {
      document.getElementById('login-username').value = 'admin_malang';
      document.getElementById('login-password').value = '••••••••••••';
      document.getElementById('login-location').value = 'Kantor Pusat Malang (Jl. Ijen No. 45)';
      document.getElementById('login-port').value = '5432';
      document.getElementById('login-database').value = 'erp_malang_prod_v2';
      showToast('Form terisi otomatis dengan profil Demo Malang', 'info');
    });
  }

  // Navigation Back Buttons
  document.querySelectorAll('[data-action="back-to-login"]').forEach(btn => {
    btn.addEventListener('click', () => switchView('view-login'));
  });
  document.querySelectorAll('[data-action="back-to-business"]').forEach(btn => {
    btn.addEventListener('click', () => switchView('view-business'));
  });
  document.querySelectorAll('[data-action="back-to-costcenter"]').forEach(btn => {
    btn.addEventListener('click', () => switchView('view-costcenter'));
  });

  // Topbar context change buttons
  document.querySelectorAll('[data-change-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-change-target');
      if (target === 'business') switchView('view-business');
      if (target === 'costcenter') switchView('view-costcenter');
      if (target === 'gudang') switchView('view-gudang');
    });
  });

  // Sidebar Menu Click Handlers
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const mod = item.getAttribute('data-module') || 'overview';
      switchModule(mod);
      showToast(`Navigasi ke Modul: ${item.querySelector('span')?.textContent}`, 'info');
    });
  });

  // Dashboard Overview Action Buttons
  document.querySelectorAll('[data-action="navigate-sales"]').forEach(btn => {
    btn.addEventListener('click', () => switchModule('sales'));
  });
  document.querySelectorAll('[data-action="navigate-purchase"]').forEach(btn => {
    btn.addEventListener('click', () => switchModule('purchasing'));
  });

  // Modal: Quick Transaction
  const modalBackdrop = document.getElementById('modal-quick-transaction');
  const btnOpenModal = document.getElementById('btn-open-quick-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');

  if (btnOpenModal && modalBackdrop) {
    btnOpenModal.addEventListener('click', () => modalBackdrop.classList.add('open'));
  }
  if (btnCloseModal && modalBackdrop) {
    btnCloseModal.addEventListener('click', () => modalBackdrop.classList.remove('open'));
  }
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) modalBackdrop.classList.remove('open');
    });
  }

  const cardModalSales = document.getElementById('card-modal-sales');
  if (cardModalSales && modalBackdrop) {
    cardModalSales.addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
      switchModule('sales');
    });
  }

  const cardModalPurchase = document.getElementById('card-modal-purchase');
  if (cardModalPurchase && modalBackdrop) {
    cardModalPurchase.addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
      switchModule('purchasing');
    });
  }

  // =========================================================================
  // FIGMA PENJUALAN & PROTOTYPE OVERLAY EVENT LISTENERS
  // =========================================================================
  const modalPenjualanOverlay = document.getElementById('modal-penjualan-overlay');
  const btnOpenPenjualanOverlay = document.getElementById('btn-open-penjualan-overlay');
  const btnClosePenjualanOverlay = document.getElementById('btn-close-penjualan-overlay');
  const btnBatalOverlay = document.getElementById('btn-batal-overlay');
  const btnAddOverlaySalesRow = document.getElementById('btn-add-overlay-sales-row');
  const formSalesOverlay = document.getElementById('form-sales-overlay');

  function openPenjualanOverlayModal() {
    if (!modalPenjualanOverlay) return;
    const tbody = document.getElementById('overlay-sales-items-tbody');
    if (tbody && tbody.children.length === 0) {
      addOverlaySalesRow('Komponen Mesin MX-4', 'Modul perakitan hidrolik', 10, 'Pcs', 2500000, 0, 11);
      addOverlaySalesRow('Inverter Listrik Industri 5KW', 'Inverter 3-phase', 2, 'Unit', 4100000, 0, 11);
    }
    calculateOverlaySalesTotals();
    modalPenjualanOverlay.classList.add('open');
  }

  function closePenjualanOverlayModal() {
    if (modalPenjualanOverlay) {
      modalPenjualanOverlay.classList.remove('open');
    }
  }

  if (btnOpenPenjualanOverlay) {
    btnOpenPenjualanOverlay.addEventListener('click', openPenjualanOverlayModal);
  }
  if (btnClosePenjualanOverlay) {
    btnClosePenjualanOverlay.addEventListener('click', closePenjualanOverlayModal);
  }
  if (btnBatalOverlay) {
    btnBatalOverlay.addEventListener('click', closePenjualanOverlayModal);
  }

  // =========================================================================
  // FIGMA PEMBELIAN OVERLAY EVENT LISTENERS
  // =========================================================================
  const modalPembelianOverlay = document.getElementById('modal-pembelian-overlay');
  const btnOpenPembelianOverlay = document.getElementById('btn-open-pembelian-overlay');
  const btnClosePembelianOverlay = document.getElementById('btn-close-pembelian-overlay');
  const btnBatalPurchaseOverlay = document.getElementById('btn-batal-purchase-overlay');

  function openPembelianOverlayModal(e) {
    if (e) e.preventDefault();
    if (!modalPembelianOverlay) return;
    const tbody = document.getElementById('overlay-purchase-items-tbody');
    if (tbody && tbody.children.length === 0) {
      if (typeof addOverlayPurchaseRow === 'function') {
        addOverlayPurchaseRow('', '', 1, 'Pcs', 0, 0, 11);
      }
    }
    if (typeof calculateOverlayPurchaseTotals === 'function') calculateOverlayPurchaseTotals();
    modalPembelianOverlay.classList.add('open');
  }

  function closePembelianOverlayModal() {
    if (modalPembelianOverlay) {
      modalPembelianOverlay.classList.remove('open');
    }
  }

  if (btnOpenPembelianOverlay) {
    btnOpenPembelianOverlay.addEventListener('click', openPembelianOverlayModal);
  }
  if (btnClosePembelianOverlay) {
    btnClosePembelianOverlay.addEventListener('click', closePembelianOverlayModal);
  }
  if (btnBatalPurchaseOverlay) {
    btnBatalPurchaseOverlay.addEventListener('click', closePembelianOverlayModal);
  }
  if (modalPenjualanOverlay) {
    modalPenjualanOverlay.addEventListener('click', (e) => {
      if (e.target === modalPenjualanOverlay) closePenjualanOverlayModal();
    });
  }

  if (btnAddOverlaySalesRow) {
    btnAddOverlaySalesRow.addEventListener('click', () => {
      addOverlaySalesRow('Komponen Tambahan / Jasa', 'Deskripsi item baru', 1, 'Pcs', 500000, 0, 11);
    });
  }

  if (formSalesOverlay) {
    formSalesOverlay.addEventListener('submit', (e) => {
      e.preventDefault();
      const customer = document.getElementById('overlay-sales-customer')?.value || 'PT Surya Gemilang Kencana';
      const invNo = document.getElementById('overlay-sales-invoice-no')?.value || ('INV-2026-00' + (state.salesInvoices.length + 1));
      const wh = document.getElementById('overlay-sales-warehouse')?.value || 'Gudang Utama Malang';
      const date = document.getElementById('overlay-sales-date')?.value || '2026-09-22';
      const grandTotalText = document.getElementById('overlay-calc-grandtotal')?.textContent || 'Rp 0';

      const newInv = {
        id: invNo,
        date: date.split('-').reverse().join('/'),
        customer: customer,
        warehouse: wh.split(' (')[0],
        amount: grandTotalText,
        status: 'Belum Bayar',
        badgeClass: 'badge-warning'
      };

      state.salesInvoices.unshift(newInv);
      state.recentTransactions.unshift({
        id: invNo,
        date: '22 Sep 2026',
        partner: customer,
        type: 'Sales Order',
        amount: grandTotalText,
        status: 'Processing',
        badgeClass: 'badge-info'
      });

      renderSalesTable();
      renderOverviewTable();
      showToast(`Faktur ${invNo} berhasil diterbitkan dan disimpan!`, 'success');
      closePenjualanOverlayModal();
    });
  }

  // Sales Sub-Tabs from Figma
  document.querySelectorAll('.penjualan-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.penjualan-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tabKey = e.currentTarget.getAttribute('data-sales-tab');
      showToast(`Menampilkan tab: ${e.currentTarget.textContent}`, 'info');
    });
  });

  // Filters & Search for Penjualan Table
  const filterSalesStatus = document.getElementById('filter-sales-status');
  const filterSalesWarehouse = document.getElementById('filter-sales-warehouse');
  const searchSalesInput = document.getElementById('search-sales-input');

  if (filterSalesStatus) filterSalesStatus.addEventListener('change', renderSalesTable);
  if (filterSalesWarehouse) filterSalesWarehouse.addEventListener('change', renderSalesTable);
  if (searchSalesInput) searchSalesInput.addEventListener('input', renderSalesTable);

  // Purchase Dynamic Row Actions
  const btnAddPurchaseItem = document.getElementById('btn-add-purchase-item');
  if (btnAddPurchaseItem) {
    btnAddPurchaseItem.addEventListener('click', () => {
      addPurchaseRow('Material Baja / Komponen Baru', 10, 'Lembar', 450000);
    });
  }

  // Purchase Demo Fill
  const btnPurchaseDemoFill = document.getElementById('btn-purchase-demo-fill');
  if (btnPurchaseDemoFill) {
    btnPurchaseDemoFill.addEventListener('click', () => {
      document.getElementById('purchase-vendor').value = 'CV Multi Baja Nusantara';
      document.getElementById('purchase-po-no').value = 'PO-2026-0' + (state.purchaseOrders.length + 90);
      document.getElementById('purchase-notes').value = 'Kualitas baja standar ASTM A36 dengan sertifikat uji tarik dari pabrik.';
      const tbody = document.getElementById('purchase-items-tbody');
      if (tbody) tbody.innerHTML = '';
      addPurchaseRow('Pelat Baja Cold-Rolled 3mm', 60, 'Lembar', 850000);
      addPurchaseRow('Baja Profil H-Beam 150', 20, 'Batang', 1450000);
      showToast('Form purchase order terisi dengan data pesanan material baja', 'info');
    });
  }

  // Submit Purchase Form
  const formPurchase = document.getElementById('form-purchase-transaction');
  if (formPurchase) {
    formPurchase.addEventListener('submit', (e) => {
      e.preventDefault();
      const vendor = document.getElementById('purchase-vendor')?.value || 'Vendor Pemasok';
      const poNo = document.getElementById('purchase-po-no')?.value || 'PO-2026-999';
      const wh = document.getElementById('purchase-warehouse')?.value || 'Gudang Bahan Baku';
      const date = document.getElementById('purchase-date')?.value || '2026-09-19';
      const grandTotalText = document.getElementById('purchase-calc-grandtotal')?.textContent || 'Rp 0';

      const newPo = {
        id: poNo,
        date: date,
        vendor: vendor,
        warehouse: wh.split(' (')[0],
        amount: grandTotalText,
        status: 'Menunggu Otorisasi',
        badgeClass: 'badge-warning'
      };

      state.purchaseOrders.unshift(newPo);
      state.recentTransactions.unshift({
        id: poNo,
        date: '19 Sep 2026',
        partner: vendor,
        type: 'Purchase Order',
        amount: grandTotalText,
        status: 'Processing',
        badgeClass: 'badge-info'
      });

      renderPurchaseTable();
      renderOverviewTable();
      showToast(`Purchase Order ${poNo} berhasil diajukan ke ${vendor}!`, 'success');
      formPurchase.reset();
      calculatePurchaseTotals();
    });
  }

  // Filter Pills on Overview Table
  document.querySelectorAll('.filter-btn-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn-pill').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.tableFilter = e.currentTarget.getAttribute('data-filter');
      renderOverviewTable();
    });
  });

  // Sidebar Logout
  const logoutBtn = document.getElementById('btn-sidebar-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin keluar dari sistem ERP?')) {
        state.auth.isLoggedIn = false;
        showToast('Anda telah logout dengan aman.', 'info');
        switchView('view-login');
      }
    });
  }

  
  const btnAddPurchaseOverlayRow = document.getElementById('btn-add-overlay-purchase-row');
  if (btnAddPurchaseOverlayRow) {
    btnAddPurchaseOverlayRow.addEventListener('click', () => {
      addOverlayPurchaseRow();
    });
  }

  // Initial calculation and bindings for existing table rows
  document.querySelectorAll('#sales-items-tbody input').forEach(inp => {
    inp.addEventListener('input', calculateSalesTotals);
  });
  document.querySelectorAll('#sales-items-tbody .btn-remove-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tbody = document.getElementById('sales-items-tbody');
      if (tbody.querySelectorAll('tr').length > 1) {
        e.currentTarget.closest('tr').remove();
        calculateSalesTotals();
      }
    });
  });

  document.querySelectorAll('#purchase-items-tbody input').forEach(inp => {
    inp.addEventListener('input', calculatePurchaseTotals);
  });
  document.querySelectorAll('#purchase-items-tbody .btn-remove-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tbody = document.getElementById('purchase-items-tbody');
      if (tbody.querySelectorAll('tr').length > 1) {
        e.currentTarget.closest('tr').remove();
        calculatePurchaseTotals();
      }
    });
  });

  // Lain Button functionality in Overlays
  const btnLainOverlays = document.querySelectorAll('.btn-lain-purple');
  const modalLain = document.getElementById('modal-lain-overlay');
  const btnCloseLain = document.getElementById('btn-close-lain');

  const LAIN_FIELDS = [
    'lain-sumber', 'lain-model', 'lain-yourhold', 'lain-eurow',
    'lain-express', 'lain-nopo', 'lain-oddgroup', 'lain-mainparts',
    'lain-tulip', 'lain-kontak1', 'lain-kontak2', 'lain-partner',
    'lain-alamat', 'lain-texth1h2'
  ];
  const LAIN_STORAGE_KEY = 'erp_lain_data';

  btnLainOverlays.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modalLain) modalLain.classList.add('open');
    });
  });

  if (btnCloseLain && modalLain) {
    btnCloseLain.addEventListener('click', () => {
      modalLain.classList.remove('open');
    });
  }

  // Close lain modal on backdrop click
  if (modalLain) {
    modalLain.addEventListener('click', (e) => {
      if (e.target === modalLain) modalLain.classList.remove('open');
    });
  }

  // Save Local
  document.getElementById('btn-lain-save-local')?.addEventListener('click', () => {
    const data = {};
    LAIN_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) data[id] = el.value;
    });
    localStorage.setItem(LAIN_STORAGE_KEY, JSON.stringify(data));
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const statusEl = document.getElementById('lain-status-text');
    if (statusEl) statusEl.textContent = `Tersimpan pukul ${timeStr}`;
    showToast('Data lain-lain berhasil disimpan!', 'success');
  });

  // Load Local
  document.getElementById('btn-lain-load-local')?.addEventListener('click', () => {
    const raw = localStorage.getItem(LAIN_STORAGE_KEY);
    if (!raw) {
      showToast('Tidak ada data tersimpan di lokal.', 'info');
      return;
    }
    try {
      const data = JSON.parse(raw);
      LAIN_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && data[id] !== undefined) el.value = data[id];
      });
      const statusEl = document.getElementById('lain-status-text');
      if (statusEl) statusEl.textContent = 'Data berhasil dimuat';
      showToast('Data lain-lain berhasil dimuat!', 'success');
    } catch(e) {
      showToast('Gagal memuat data.', 'danger');
    }
  });


  // Dropdown Logic for Penjualan and Pembelian
  const btnTogglePenjualan = document.getElementById('btn-toggle-penjualan-dropdown');
  const menuPenjualan = document.getElementById('dropdown-menu-penjualan');
  
  const btnTogglePembelian = document.getElementById('btn-toggle-pembelian-dropdown');
  const menuPembelian = document.getElementById('dropdown-menu-pembelian');

  function setupDropdown(btn, menu) {
    if (!btn || !menu) return;
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      // Close other menus if any
      if (menuPenjualan && menuPenjualan !== menu) menuPenjualan.classList.remove('show');
      if (menuPembelian && menuPembelian !== menu) menuPembelian.classList.remove('show');
      
      menu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (menu.classList.contains('show') && !menu.contains(e.target) && e.target !== btn) {
        menu.classList.remove('show');
      }
    });

    menu.querySelectorAll('a').forEach(item => {
      item.addEventListener('click', () => {
        menu.classList.remove('show');
      });
    });
  }

  setupDropdown(btnTogglePenjualan, menuPenjualan);
  setupDropdown(btnTogglePembelian, menuPembelian);

  // =========================================================================
  // MASTER DATA STATE (Settings CRUD)
  // =========================================================================
  const masterData = {
    produk: [
      { id: 1, sku: 'SKU-MCH-001', nama: 'Komponen Mesin Seri MX-400', kategori: 'Mesin & Sparepart', satuan: 'Pcs', harga: 2500000, stok: 48, status: 'Aktif' },
      { id: 2, sku: 'SKU-RAW-009', nama: 'Pelat Baja Cold-Rolled 3mm', kategori: 'Bahan Baku', satuan: 'Lembar', harga: 850000, stok: 8, status: 'Aktif' },
      { id: 3, sku: 'SKU-ELC-042', nama: 'Inverter Listrik Industri 5KW', kategori: 'Elektronik', satuan: 'Unit', harga: 4100000, stok: 14, status: 'Aktif' },
      { id: 4, sku: 'SKU-FLX-012', nama: 'Hydraulic Hose Tube 1/2 Inch', kategori: 'Pneumatik', satuan: 'Roll', harga: 1200000, stok: 6, status: 'Tidak Aktif' },
    ],
    pelanggan: [
      { id: 1, kode: 'CST-001', nama: 'PT Surya Gemilang Kencana', kontak: '0341-512001', kota: 'Malang', tipe: 'B2B Industri', limitKredit: 500000000, status: 'Aktif' },
      { id: 2, kode: 'CST-002', nama: 'PT Bintang Mitra Sejahtera', kontak: '031-723451', kota: 'Surabaya', tipe: 'B2B Distribusi', limitKredit: 350000000, status: 'Aktif' },
      { id: 3, kode: 'CST-003', nama: 'CV Cipta Karya Mandiri', kontak: '0341-789012', kota: 'Malang', tipe: 'B2B Retail', limitKredit: 100000000, status: 'Aktif' },
      { id: 4, kode: 'CST-004', nama: 'Toko Makmur Sentosa Malang', kontak: '0341-445566', kota: 'Batu', tipe: 'Retail Langsung', limitKredit: 50000000, status: 'Aktif' },
    ],
    vendor: [
      { id: 1, kode: 'VND-001', nama: 'CV Multi Baja Nusantara', kontak: '021-8001234', kota: 'Jakarta', kategori: 'Material Baja', leadTime: '7 Hari', status: 'Aktif' },
      { id: 2, kode: 'VND-002', nama: 'PT Delta Elektronik Utama', kontak: '031-5561890', kota: 'Surabaya', kategori: 'Komponen Elektronik', leadTime: '3 Hari', status: 'Aktif' },
      { id: 3, kode: 'VND-003', nama: 'PT Logam Presisi Abadi', kontak: '0341-221100', kota: 'Malang', kategori: 'Besi & Logam', leadTime: '5 Hari', status: 'Aktif' },
    ],
    gudang: [
      { id: 1, kode: 'WH-MLG-01', nama: 'Gudang Utama Malang', lokasi: 'Kepanjen, Malang', pic: 'Budi Santoso', kapasitas: '15.000 m²', utilisasi: '84%', status: 'Aktif' },
      { id: 2, kode: 'WH-SGS-02', nama: 'Gudang Transit Singosari', lokasi: 'Singosari, Malang', pic: 'Deni Kurniawan', kapasitas: '8.000 m²', utilisasi: '58%', status: 'Aktif' },
      { id: 3, kode: 'WH-BTU-03', nama: 'Gudang Bahan Baku (Batu)', lokasi: 'Batu, Malang', pic: 'Rani Dewi', kapasitas: '7.500 m²', utilisasi: '42%', status: 'Aktif' },
      { id: 4, kode: 'WH-LKW-04', nama: 'Gudang Distribusi Retail', lokasi: 'Lowokwaru, Malang', pic: 'Ahmad Fauzi', kapasitas: '3.100 m²', utilisasi: '91%', status: 'Hampir Penuh' },
    ],
    pengguna: [
      { id: 1, username: 'admin_malang', nama: 'Agus Administrator', email: 'admin@erp-malang.id', role: 'Super Admin', unit: 'PT Distribusi Logistik', lastLogin: '26 Sep 2026', status: 'Aktif' },
      { id: 2, username: 'sales_01', nama: 'Wulan Pratiwi', email: 'wulan@erp-malang.id', role: 'Staff Penjualan', unit: 'Malang Retail & Niaga', lastLogin: '25 Sep 2026', status: 'Aktif' },
      { id: 3, username: 'purchaser_02', nama: 'Randi Susanto', email: 'randi@erp-malang.id', role: 'Staff Pembelian', unit: 'PT Manufaktur Utama', lastLogin: '24 Sep 2026', status: 'Aktif' },
      { id: 4, username: 'finance_mgr', nama: 'Sri Handayani', email: 'sri@erp-malang.id', role: 'Manager Keuangan', unit: 'PT Distribusi Logistik', lastLogin: '26 Sep 2026', status: 'Aktif' },
    ],
    bisnis: [
      { id: 1, kode: 'MMU-01', nama: 'PT Malang Manufaktur Utama', jenis: 'Manufaktur', pic: 'Hendra Wijaya', kota: 'Malang', status: 'Aktif' },
      { id: 2, kode: 'DLM-02', nama: 'PT Distribusi Logistik Malang', jenis: 'Distribusi', pic: 'Sari Indah', kota: 'Malang', status: 'Aktif' },
      { id: 3, kode: 'RNP-03', nama: 'Malang Retail & Niaga Prima', jenis: 'Retail', pic: 'Budi Cahyono', kota: 'Malang', status: 'Aktif' },
      { id: 4, kode: 'SAM-04', nama: 'PT Solusi Agrobisnis Malang', jenis: 'Agrobisnis', pic: 'Tono Prasetyo', kota: 'Batu', status: 'Aktif' },
    ],
  };

  // =========================================================================
  // SETTINGS CRUD RENDERS
  // =========================================================================
  function renderSettingsProduk() {
    const tbody = document.getElementById('settings-produk-tbody');
    if (!tbody) return;
    tbody.innerHTML = masterData.produk.map(p => `
      <tr>
        <td style="font-family:monospace; font-weight:600; color:var(--primary);">${p.sku}</td>
        <td><strong>${p.nama}</strong></td>
        <td>${p.kategori}</td>
        <td>${p.satuan}</td>
        <td style="text-align:right; font-weight:600;">${formatRupiah(p.harga)}</td>
        <td style="text-align:right;">${p.stok}</td>
        <td><span class="badge-status ${p.status === 'Aktif' ? 'badge-success' : 'badge-danger'}">● ${p.status}</span></td>
        <td style="text-align:center;">
          <button class="btn-crud-edit" data-entity="produk" data-id="${p.id}" style="background:none; border:1px solid var(--primary); color:var(--primary); border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px;">Edit</button>
          <button class="btn-crud-delete" data-entity="produk" data-id="${p.id}" data-name="${p.nama}" style="background:none; border:1px solid #EF4444; color:#EF4444; border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer;">Hapus</button>
        </td>
      </tr>
    `).join('');
    bindCrudButtons();
  }

  function renderSettingsPelanggan() {
    const tbody = document.getElementById('settings-pelanggan-tbody');
    if (!tbody) return;
    tbody.innerHTML = masterData.pelanggan.map(p => `
      <tr>
        <td style="font-family:monospace; font-weight:600; color:var(--primary);">${p.kode}</td>
        <td><strong>${p.nama}</strong></td>
        <td>${p.kontak}</td>
        <td>${p.kota}</td>
        <td>${p.tipe}</td>
        <td>${formatRupiah(p.limitKredit)}</td>
        <td><span class="badge-status ${p.status === 'Aktif' ? 'badge-success' : 'badge-danger'}">● ${p.status}</span></td>
        <td style="text-align:center;">
          <button class="btn-crud-edit" data-entity="pelanggan" data-id="${p.id}" style="background:none; border:1px solid var(--primary); color:var(--primary); border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px;">Edit</button>
          <button class="btn-crud-delete" data-entity="pelanggan" data-id="${p.id}" data-name="${p.nama}" style="background:none; border:1px solid #EF4444; color:#EF4444; border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer;">Hapus</button>
        </td>
      </tr>
    `).join('');
    bindCrudButtons();
  }

  function renderSettingsVendor() {
    const tbody = document.getElementById('settings-vendor-tbody');
    if (!tbody) return;
    tbody.innerHTML = masterData.vendor.map(v => `
      <tr>
        <td style="font-family:monospace; font-weight:600; color:var(--primary);">${v.kode}</td>
        <td><strong>${v.nama}</strong></td>
        <td>${v.kontak}</td>
        <td>${v.kota}</td>
        <td>${v.kategori}</td>
        <td>${v.leadTime}</td>
        <td><span class="badge-status ${v.status === 'Aktif' ? 'badge-success' : 'badge-danger'}">● ${v.status}</span></td>
        <td style="text-align:center;">
          <button class="btn-crud-edit" data-entity="vendor" data-id="${v.id}" style="background:none; border:1px solid var(--primary); color:var(--primary); border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px;">Edit</button>
          <button class="btn-crud-delete" data-entity="vendor" data-id="${v.id}" data-name="${v.nama}" style="background:none; border:1px solid #EF4444; color:#EF4444; border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer;">Hapus</button>
        </td>
      </tr>
    `).join('');
    bindCrudButtons();
  }

  function renderSettingsGudang() {
    const tbody = document.getElementById('settings-gudang-tbody');
    if (!tbody) return;
    tbody.innerHTML = masterData.gudang.map(g => `
      <tr>
        <td style="font-family:monospace; font-weight:600; color:var(--primary);">${g.kode}</td>
        <td><strong>${g.nama}</strong></td>
        <td>${g.lokasi}</td>
        <td>${g.pic}</td>
        <td>${g.kapasitas}</td>
        <td><span class="${parseFloat(g.utilisasi) > 85 ? 'badge-status badge-danger' : 'badge-status badge-success'}">${g.utilisasi}</span></td>
        <td><span class="badge-status ${g.status === 'Aktif' ? 'badge-success' : 'badge-warning'}">● ${g.status}</span></td>
        <td style="text-align:center;">
          <button class="btn-crud-edit" data-entity="gudang" data-id="${g.id}" style="background:none; border:1px solid var(--primary); color:var(--primary); border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px;">Edit</button>
          <button class="btn-crud-delete" data-entity="gudang" data-id="${g.id}" data-name="${g.nama}" style="background:none; border:1px solid #EF4444; color:#EF4444; border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer;">Hapus</button>
        </td>
      </tr>
    `).join('');
    bindCrudButtons();
  }

  function renderSettingsPengguna() {
    const tbody = document.getElementById('settings-pengguna-tbody');
    if (!tbody) return;
    tbody.innerHTML = masterData.pengguna.map(u => `
      <tr>
        <td style="font-family:monospace; font-weight:600;">${u.username}</td>
        <td><strong>${u.nama}</strong></td>
        <td>${u.email}</td>
        <td><span class="badge-status ${u.role === 'Super Admin' ? 'badge-info' : 'badge-success'}">${u.role}</span></td>
        <td>${u.unit}</td>
        <td style="color:var(--text-muted); font-size:0.85rem;">${u.lastLogin}</td>
        <td><span class="badge-status ${u.status === 'Aktif' ? 'badge-success' : 'badge-danger'}">● ${u.status}</span></td>
        <td style="text-align:center;">
          <button class="btn-crud-edit" data-entity="pengguna" data-id="${u.id}" style="background:none; border:1px solid var(--primary); color:var(--primary); border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px;">Edit</button>
          <button class="btn-crud-delete" data-entity="pengguna" data-id="${u.id}" data-name="${u.nama}" style="background:none; border:1px solid #EF4444; color:#EF4444; border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer;">Hapus</button>
        </td>
      </tr>
    `).join('');
    bindCrudButtons();
  }

  function renderSettingsBisnis() {
    const tbody = document.getElementById('settings-bisnis-tbody');
    if (!tbody) return;
    tbody.innerHTML = masterData.bisnis.map(b => `
      <tr>
        <td style="font-family:monospace; font-weight:600; color:var(--primary);">${b.kode}</td>
        <td><strong>${b.nama}</strong></td>
        <td>${b.jenis}</td>
        <td>${b.pic}</td>
        <td>${b.kota}</td>
        <td><span class="badge-status ${b.status === 'Aktif' ? 'badge-success' : 'badge-danger'}">● ${b.status}</span></td>
        <td style="text-align:center;">
          <button class="btn-crud-edit" data-entity="bisnis" data-id="${b.id}" style="background:none; border:1px solid var(--primary); color:var(--primary); border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer; margin-right:4px;">Edit</button>
          <button class="btn-crud-delete" data-entity="bisnis" data-id="${b.id}" data-name="${b.nama}" style="background:none; border:1px solid #EF4444; color:#EF4444; border-radius:4px; padding:0.25rem 0.6rem; font-size:0.75rem; cursor:pointer;">Hapus</button>
        </td>
      </tr>
    `).join('');
    bindCrudButtons();
  }

  function renderAllSettings() {
    renderSettingsProduk();
    renderSettingsPelanggan();
    renderSettingsVendor();
    renderSettingsGudang();
    renderSettingsPengguna();
    renderSettingsBisnis();
  }

  // =========================================================================
  // CRUD MODAL FORMS
  // =========================================================================
  const crudFormTemplates = {
    produk: (data = {}) => `
      <div class="overlay-inputs-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 1.5rem;">
        <div class="overlay-field"><label>Kode SKU *</label><input type="text" id="f-sku" class="form-input-figma" value="${data.sku || ''}" placeholder="SKU-XXX-000" required></div>
        <div class="overlay-field"><label>Nama Produk *</label><input type="text" id="f-nama" class="form-input-figma" value="${data.nama || ''}" placeholder="Nama produk..." required></div>
        <div class="overlay-field"><label>Kategori</label><select id="f-kategori" class="form-input-figma"><option ${data.kategori === 'Mesin & Sparepart' ? 'selected' : ''}>Mesin & Sparepart</option><option ${data.kategori === 'Bahan Baku' ? 'selected' : ''}>Bahan Baku</option><option ${data.kategori === 'Elektronik' ? 'selected' : ''}>Elektronik</option><option ${data.kategori === 'Pneumatik' ? 'selected' : ''}>Pneumatik</option><option ${data.kategori === 'Lainnya' ? 'selected' : ''}>Lainnya</option></select></div>
        <div class="overlay-field"><label>Satuan</label><select id="f-satuan" class="form-input-figma"><option ${data.satuan === 'Pcs' ? 'selected' : ''}>Pcs</option><option ${data.satuan === 'Unit' ? 'selected' : ''}>Unit</option><option ${data.satuan === 'Lembar' ? 'selected' : ''}>Lembar</option><option ${data.satuan === 'Roll' ? 'selected' : ''}>Roll</option><option ${data.satuan === 'Box' ? 'selected' : ''}>Box</option></select></div>
        <div class="overlay-field"><label>Harga Jual (Rp)</label><input type="number" id="f-harga" class="form-input-figma" value="${data.harga || 0}" min="0"></div>
        <div class="overlay-field"><label>Stok Awal</label><input type="number" id="f-stok" class="form-input-figma" value="${data.stok || 0}" min="0"></div>
        <div class="overlay-field"><label>Status</label><select id="f-status" class="form-input-figma"><option ${data.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${data.status === 'Tidak Aktif' ? 'selected' : ''}>Tidak Aktif</option></select></div>
      </div>`,
    pelanggan: (data = {}) => `
      <div class="overlay-inputs-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 1.5rem;">
        <div class="overlay-field"><label>Kode Pelanggan *</label><input type="text" id="f-kode" class="form-input-figma" value="${data.kode || ''}" placeholder="CST-000" required></div>
        <div class="overlay-field"><label>Nama Perusahaan *</label><input type="text" id="f-nama" class="form-input-figma" value="${data.nama || ''}" placeholder="PT / CV ..." required></div>
        <div class="overlay-field"><label>No. Kontak</label><input type="text" id="f-kontak" class="form-input-figma" value="${data.kontak || ''}" placeholder="0341-..."></div>
        <div class="overlay-field"><label>Kota</label><input type="text" id="f-kota" class="form-input-figma" value="${data.kota || ''}" placeholder="Malang"></div>
        <div class="overlay-field"><label>Tipe Pelanggan</label><select id="f-tipe" class="form-input-figma"><option ${data.tipe === 'B2B Industri' ? 'selected' : ''}>B2B Industri</option><option ${data.tipe === 'B2B Distribusi' ? 'selected' : ''}>B2B Distribusi</option><option ${data.tipe === 'B2B Retail' ? 'selected' : ''}>B2B Retail</option><option ${data.tipe === 'Retail Langsung' ? 'selected' : ''}>Retail Langsung</option></select></div>
        <div class="overlay-field"><label>Limit Kredit (Rp)</label><input type="number" id="f-limit" class="form-input-figma" value="${data.limitKredit || 0}" min="0"></div>
        <div class="overlay-field"><label>Status</label><select id="f-status" class="form-input-figma"><option ${data.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${data.status === 'Tidak Aktif' ? 'selected' : ''}>Tidak Aktif</option></select></div>
      </div>`,
    vendor: (data = {}) => `
      <div class="overlay-inputs-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 1.5rem;">
        <div class="overlay-field"><label>Kode Vendor *</label><input type="text" id="f-kode" class="form-input-figma" value="${data.kode || ''}" placeholder="VND-000" required></div>
        <div class="overlay-field"><label>Nama Vendor *</label><input type="text" id="f-nama" class="form-input-figma" value="${data.nama || ''}" placeholder="PT / CV ..." required></div>
        <div class="overlay-field"><label>No. Kontak</label><input type="text" id="f-kontak" class="form-input-figma" value="${data.kontak || ''}" placeholder="021-..."></div>
        <div class="overlay-field"><label>Kota</label><input type="text" id="f-kota" class="form-input-figma" value="${data.kota || ''}" placeholder="Jakarta"></div>
        <div class="overlay-field"><label>Kategori Suplai</label><input type="text" id="f-kategori" class="form-input-figma" value="${data.kategori || ''}" placeholder="Material Baja..."></div>
        <div class="overlay-field"><label>Lead Time</label><input type="text" id="f-lead" class="form-input-figma" value="${data.leadTime || ''}" placeholder="7 Hari"></div>
        <div class="overlay-field"><label>Status</label><select id="f-status" class="form-input-figma"><option ${data.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${data.status === 'Tidak Aktif' ? 'selected' : ''}>Tidak Aktif</option></select></div>
      </div>`,
    gudang: (data = {}) => `
      <div class="overlay-inputs-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 1.5rem;">
        <div class="overlay-field"><label>Kode Gudang *</label><input type="text" id="f-kode" class="form-input-figma" value="${data.kode || ''}" placeholder="WH-XXX-00" required></div>
        <div class="overlay-field"><label>Nama Gudang *</label><input type="text" id="f-nama" class="form-input-figma" value="${data.nama || ''}" placeholder="Gudang ..." required></div>
        <div class="overlay-field"><label>Lokasi</label><input type="text" id="f-lokasi" class="form-input-figma" value="${data.lokasi || ''}" placeholder="Kecamatan, Kota"></div>
        <div class="overlay-field"><label>PIC (Person in Charge)</label><input type="text" id="f-pic" class="form-input-figma" value="${data.pic || ''}" placeholder="Nama PIC"></div>
        <div class="overlay-field"><label>Kapasitas (m²)</label><input type="text" id="f-kapasitas" class="form-input-figma" value="${data.kapasitas || ''}" placeholder="10.000 m²"></div>
        <div class="overlay-field"><label>Status</label><select id="f-status" class="form-input-figma"><option ${data.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${data.status === 'Hampir Penuh' ? 'selected' : ''}>Hampir Penuh</option><option ${data.status === 'Tidak Aktif' ? 'selected' : ''}>Tidak Aktif</option></select></div>
      </div>`,
    pengguna: (data = {}) => `
      <div class="overlay-inputs-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 1.5rem;">
        <div class="overlay-field"><label>Username *</label><input type="text" id="f-username" class="form-input-figma" value="${data.username || ''}" placeholder="user_name" required></div>
        <div class="overlay-field"><label>Nama Lengkap *</label><input type="text" id="f-nama" class="form-input-figma" value="${data.nama || ''}" placeholder="Nama Lengkap" required></div>
        <div class="overlay-field"><label>Email</label><input type="email" id="f-email" class="form-input-figma" value="${data.email || ''}" placeholder="email@domain.id"></div>
        <div class="overlay-field"><label>Role</label><select id="f-role" class="form-input-figma"><option ${data.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option><option ${data.role === 'Manager Keuangan' ? 'selected' : ''}>Manager Keuangan</option><option ${data.role === 'Staff Penjualan' ? 'selected' : ''}>Staff Penjualan</option><option ${data.role === 'Staff Pembelian' ? 'selected' : ''}>Staff Pembelian</option><option ${data.role === 'Kepala Gudang' ? 'selected' : ''}>Kepala Gudang</option></select></div>
        <div class="overlay-field"><label>Unit Bisnis</label><select id="f-unit" class="form-input-figma">${masterData.bisnis.map(b => `<option ${data.unit === b.nama ? 'selected' : ''}>${b.nama}</option>`).join('')}</select></div>
        <div class="overlay-field"><label>Status</label><select id="f-status" class="form-input-figma"><option ${data.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${data.status === 'Tidak Aktif' ? 'selected' : ''}>Tidak Aktif</option></select></div>
      </div>`,
    bisnis: (data = {}) => `
      <div class="overlay-inputs-grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem 1.5rem;">
        <div class="overlay-field"><label>Kode Unit *</label><input type="text" id="f-kode" class="form-input-figma" value="${data.kode || ''}" placeholder="XXX-00" required></div>
        <div class="overlay-field"><label>Nama Unit *</label><input type="text" id="f-nama" class="form-input-figma" value="${data.nama || ''}" placeholder="PT / CV ..." required></div>
        <div class="overlay-field"><label>Jenis Unit</label><select id="f-jenis" class="form-input-figma"><option ${data.jenis === 'Manufaktur' ? 'selected' : ''}>Manufaktur</option><option ${data.jenis === 'Distribusi' ? 'selected' : ''}>Distribusi</option><option ${data.jenis === 'Retail' ? 'selected' : ''}>Retail</option><option ${data.jenis === 'Agrobisnis' ? 'selected' : ''}>Agrobisnis</option><option ${data.jenis === 'Jasa' ? 'selected' : ''}>Jasa</option></select></div>
        <div class="overlay-field"><label>PIC</label><input type="text" id="f-pic" class="form-input-figma" value="${data.pic || ''}" placeholder="Nama PIC"></div>
        <div class="overlay-field"><label>Kota</label><input type="text" id="f-kota" class="form-input-figma" value="${data.kota || ''}" placeholder="Malang"></div>
        <div class="overlay-field"><label>Status</label><select id="f-status" class="form-input-figma"><option ${data.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option ${data.status === 'Tidak Aktif' ? 'selected' : ''}>Tidak Aktif</option></select></div>
      </div>`,
  };

  const entityLabels = {
    produk: 'Produk', pelanggan: 'Pelanggan', vendor: 'Vendor',
    gudang: 'Gudang', pengguna: 'Pengguna', bisnis: 'Unit Bisnis'
  };

  let crudState = { entity: null, mode: null, id: null };

  function openCrudModal(entity, mode, id = null) {
    const modal = document.getElementById('modal-crud-settings');
    const titleEl = document.getElementById('crud-modal-title');
    const bodyEl = document.getElementById('crud-modal-body');
    if (!modal) return;

    crudState = { entity, mode, id };
    const label = entityLabels[entity];
    titleEl.textContent = mode === 'add' ? `Tambah ${label} Baru` : `Edit ${label}`;

    let data = {};
    if (mode === 'edit' && id) {
      data = masterData[entity].find(d => d.id === id) || {};
    }
    bodyEl.innerHTML = crudFormTemplates[entity](data);
    modal.classList.add('open');
  }

  function closeCrudModal() {
    const modal = document.getElementById('modal-crud-settings');
    if (modal) modal.classList.remove('open');
    crudState = { entity: null, mode: null, id: null };
  }

  function saveCrudData() {
    const { entity, mode, id } = crudState;
    if (!entity) return;

    let newData = {};
    const nextId = Math.max(...masterData[entity].map(d => d.id), 0) + 1;

    try {
      if (entity === 'produk') {
        newData = { id: id || nextId, sku: document.getElementById('f-sku').value, nama: document.getElementById('f-nama').value, kategori: document.getElementById('f-kategori').value, satuan: document.getElementById('f-satuan').value, harga: parseFloat(document.getElementById('f-harga').value) || 0, stok: parseInt(document.getElementById('f-stok').value) || 0, status: document.getElementById('f-status').value };
      } else if (entity === 'pelanggan') {
        newData = { id: id || nextId, kode: document.getElementById('f-kode').value, nama: document.getElementById('f-nama').value, kontak: document.getElementById('f-kontak').value, kota: document.getElementById('f-kota').value, tipe: document.getElementById('f-tipe').value, limitKredit: parseFloat(document.getElementById('f-limit').value) || 0, status: document.getElementById('f-status').value };
      } else if (entity === 'vendor') {
        newData = { id: id || nextId, kode: document.getElementById('f-kode').value, nama: document.getElementById('f-nama').value, kontak: document.getElementById('f-kontak').value, kota: document.getElementById('f-kota').value, kategori: document.getElementById('f-kategori').value, leadTime: document.getElementById('f-lead').value, status: document.getElementById('f-status').value };
      } else if (entity === 'gudang') {
        newData = { id: id || nextId, kode: document.getElementById('f-kode').value, nama: document.getElementById('f-nama').value, lokasi: document.getElementById('f-lokasi').value, pic: document.getElementById('f-pic').value, kapasitas: document.getElementById('f-kapasitas').value, utilisasi: '0%', status: document.getElementById('f-status').value };
      } else if (entity === 'pengguna') {
        newData = { id: id || nextId, username: document.getElementById('f-username').value, nama: document.getElementById('f-nama').value, email: document.getElementById('f-email').value, role: document.getElementById('f-role').value, unit: document.getElementById('f-unit').value, lastLogin: '-', status: document.getElementById('f-status').value };
      } else if (entity === 'bisnis') {
        newData = { id: id || nextId, kode: document.getElementById('f-kode').value, nama: document.getElementById('f-nama').value, jenis: document.getElementById('f-jenis').value, pic: document.getElementById('f-pic').value, kota: document.getElementById('f-kota').value, status: document.getElementById('f-status').value };
      }

      const requiredField = Object.values(newData).find((v, i) => i > 0 && typeof v === 'string' && v.trim() === '' && i < 3);
      if (!newData.nama || newData.nama.trim() === '') {
        showToast('Nama tidak boleh kosong!', 'danger');
        return;
      }

      if (mode === 'add') {
        masterData[entity].push(newData);
        showToast(`${entityLabels[entity]} berhasil ditambahkan!`, 'success');
      } else {
        const idx = masterData[entity].findIndex(d => d.id === id);
        if (idx !== -1) masterData[entity][idx] = newData;
        showToast(`${entityLabels[entity]} berhasil diperbarui!`, 'success');
      }

      closeCrudModal();
      renderAllSettings();
    } catch (e) {
      showToast('Terjadi kesalahan saat menyimpan data.', 'danger');
    }
  }

  function bindCrudButtons() {
    document.querySelectorAll('.btn-crud-edit').forEach(btn => {
      btn.onclick = () => {
        const entity = btn.dataset.entity;
        const id = parseInt(btn.dataset.id);
        openCrudModal(entity, 'edit', id);
      };
    });

    document.querySelectorAll('.btn-crud-delete').forEach(btn => {
      btn.onclick = () => {
        const entity = btn.dataset.entity;
        const id = parseInt(btn.dataset.id);
        const name = btn.dataset.name;
        const modal = document.getElementById('modal-confirm-delete');
        const textEl = document.getElementById('delete-confirm-text');
        if (modal && textEl) {
          textEl.textContent = `Data "${name}" akan dihapus secara permanen dari sistem.`;
          modal._deleteCallback = () => {
            masterData[entity] = masterData[entity].filter(d => d.id !== id);
            showToast(`Data "${name}" berhasil dihapus.`, 'success');
            renderAllSettings();
          };
          modal.classList.add('open');
        }
      };
    });
  }

  // CRUD Modal Events
  const crudModal = document.getElementById('modal-crud-settings');
  document.getElementById('btn-close-crud-modal')?.addEventListener('click', closeCrudModal);
  document.getElementById('btn-cancel-crud')?.addEventListener('click', closeCrudModal);
  document.getElementById('btn-save-crud')?.addEventListener('click', saveCrudData);

  const deleteModal = document.getElementById('modal-confirm-delete');
  document.getElementById('btn-cancel-delete')?.addEventListener('click', () => deleteModal?.classList.remove('open'));
  document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
    if (deleteModal?._deleteCallback) deleteModal._deleteCallback();
    deleteModal?.classList.remove('open');
  });

  // Close modals on backdrop click
  [crudModal, deleteModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
          if (modal === crudModal) crudState = { entity: null, mode: null, id: null };
        }
      });
    }
  });

  // Add buttons for each settings entity
  document.getElementById('btn-add-produk')?.addEventListener('click', () => openCrudModal('produk', 'add'));
  document.getElementById('btn-add-pelanggan')?.addEventListener('click', () => openCrudModal('pelanggan', 'add'));
  document.getElementById('btn-add-vendor')?.addEventListener('click', () => openCrudModal('vendor', 'add'));
  document.getElementById('btn-add-gudang')?.addEventListener('click', () => openCrudModal('gudang', 'add'));
  document.getElementById('btn-add-pengguna')?.addEventListener('click', () => openCrudModal('pengguna', 'add'));
  document.getElementById('btn-add-bisnis')?.addEventListener('click', () => openCrudModal('bisnis', 'add'));

  // =========================================================================
  // SETTINGS TABS NAVIGATION
  // =========================================================================
  document.querySelectorAll('[data-settings-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-settings-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.settingsTab;
      document.querySelectorAll('.settings-tab-content').forEach(c => c.style.display = 'none');
      const targetTab = document.getElementById(`settings-tab-${tabName}`);
      if (targetTab) targetTab.style.display = 'block';
    });
  });

  // =========================================================================
  // ACCOUNTING TABS (simple tab toggle, no separate data needed)
  // =========================================================================
  document.querySelectorAll('[data-accounting-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-accounting-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // =========================================================================
  // REPORT: Print / Download (simulated)
  // =========================================================================
  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    showToast('Menyiapkan dokumen cetak...', 'info');
    setTimeout(() => window.print(), 500);
  });

  document.getElementById('btn-download-report')?.addEventListener('click', () => {
    showToast('Laporan PDF sedang diunduh...', 'info');
  });

  document.getElementById('btn-export-finance')?.addEventListener('click', () => {
    showToast('Export laporan keuangan berhasil!', 'success');
  });

  // =========================================================================
  // INVENTORY: Make table interactive (add CRUD for inventory items)
  // =========================================================================
  function syncInventoryWithProducts() {
    const tbody = document.querySelector('#module-inventory table tbody');
    if (!tbody) return;
    tbody.innerHTML = masterData.produk.map(p => {
      const stokStatus = p.stok <= 5 ? 'badge-danger' : p.stok <= 15 ? 'badge-warning' : 'badge-success';
      const stokLabel = p.stok <= 5 ? '● Menipis (Restock)' : p.stok <= 15 ? '● Mendekati Batas' : '● Aman';
      const stokMin = Math.ceil(p.stok * 0.3);
      return `<tr>
        <td style="font-family:monospace; font-weight:600; color:var(--primary);">${p.sku}</td>
        <td><strong>${p.nama}</strong></td>
        <td>${p.kategori}</td>
        <td><strong>${p.stok} ${p.satuan}</strong></td>
        <td>${stokMin} ${p.satuan}</td>
        <td>${formatRupiah(p.harga)}</td>
        <td><span class="badge-status ${stokStatus}">${stokLabel}</span></td>
      </tr>`;
    }).join('');
  }

  // =========================================================================
  // SEARCH FUNCTIONALITY
  // =========================================================================
  document.getElementById('search-sales-input')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const tbody = document.getElementById('sales-table-body');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });

  document.getElementById('search-purchase-input')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const tbody = document.getElementById('purchase-table-body');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // =========================================================================
  // PURCHASE TABS (tab highlight only)
  // =========================================================================
  document.querySelectorAll('[data-purchase-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-purchase-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // =========================================================================
  // SALES TABS (tab highlight only)
  // =========================================================================
  document.querySelectorAll('[data-sales-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-sales-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Initial Render Calls
  calculateSalesTotals();
  calculatePurchaseTotals();
  renderOverviewTable();
  renderSalesTable();
  renderPurchaseTable();
  renderBusinessGrid();
  renderCostCenterGrid();
  renderGudangGrid();
  renderAllSettings();
  syncInventoryWithProducts();
});
