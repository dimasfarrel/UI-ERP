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

  // Lain Button functionality in Penjualan Overlay
  const btnLainOverlay = document.querySelector('.btn-lain-purple');
  const modalLain = document.getElementById('modal-lain-overlay');
  const btnCloseLain = document.getElementById('btn-close-lain');

  if (btnLainOverlay && modalLain) {
    btnLainOverlay.addEventListener('click', () => {
      modalLain.classList.add('open');
    });
  }

  if (btnCloseLain && modalLain) {
    btnCloseLain.addEventListener('click', () => {
      modalLain.classList.remove('open');
    });
  }

  // Buat Penjualan Dropdown Logic
  const btnToggleDropdown = document.getElementById('btn-toggle-penjualan-dropdown');
  const dropdownMenu = document.getElementById('dropdown-menu-penjualan');
  
  if (btnToggleDropdown && dropdownMenu) {
    btnToggleDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (dropdownMenu && dropdownMenu.classList.contains('show')) {
      if (!dropdownMenu.contains(e.target) && e.target !== btnToggleDropdown) {
        dropdownMenu.classList.remove('show');
      }
    }
  });

  // Also close dropdown when an item is clicked
  if (dropdownMenu) {
    dropdownMenu.querySelectorAll('.dropdown-item-figma').forEach(item => {
      item.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
      });
    });
  }

  // Initial Render Calls
  calculateSalesTotals();
  calculatePurchaseTotals();
  renderOverviewTable();
  renderSalesTable();
  renderPurchaseTable();
  renderBusinessGrid();
  renderCostCenterGrid();
  renderGudangGrid();
});
