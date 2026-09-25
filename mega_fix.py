import re

# =====================================================================
# 1. PATCH app.js
# =====================================================================
with open('js/app.js', 'r') as f:
    js = f.read()

# 1a. Upgrade renderSalesTable with Edit/Delete CRUD buttons
old_render_sales = '''    tbody.innerHTML = filtered.map(inv => `
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
    `).join('');'''

new_render_sales = '''    tbody.innerHTML = filtered.map(inv => `
      <tr>
        <td style="font-weight: 600; font-family: monospace; color: var(--primary);">${inv.id}</td>
        <td>${inv.date}</td>
        <td><strong>${inv.customer}</strong></td>
        <td>${inv.warehouse}</td>
        <td style="font-weight: 600; color: #0F172A;">${inv.amount}</td>
        <td><span class="badge-status ${inv.badgeClass}">● ${inv.status}</span></td>
        <td style="white-space:nowrap;">
          <button class="btn-inv-edit" data-inv-id="${inv.id}" style="background:none; border:1px solid var(--primary); color:var(--primary); border-radius:4px; padding:0.2rem 0.55rem; font-size:0.72rem; cursor:pointer; margin-right:3px; font-weight:600;">Edit</button>
          <button class="btn-inv-delete" data-inv-id="${inv.id}" style="background:none; border:1px solid #EF4444; color:#EF4444; border-radius:4px; padding:0.2rem 0.55rem; font-size:0.72rem; cursor:pointer; font-weight:600;">Hapus</button>
        </td>
      </tr>
    `).join('');

    // Bind edit/delete after render
    tbody.querySelectorAll('.btn-inv-edit').forEach(btn => {
      btn.onclick = () => {
        const inv = state.salesInvoices.find(i => i.id === btn.dataset.invId);
        if (!inv) return;
        openEditSalesModal(inv);
      };
    });
    tbody.querySelectorAll('.btn-inv-delete').forEach(btn => {
      btn.onclick = () => {
        const inv = state.salesInvoices.find(i => i.id === btn.dataset.invId);
        if (!inv) return;
        const modal = document.getElementById('modal-confirm-delete');
        const textEl = document.getElementById('delete-confirm-text');
        if (modal && textEl) {
          textEl.textContent = `Faktur "${inv.id}" (${inv.customer}) akan dihapus secara permanen.`;
          modal._deleteCallback = () => {
            state.salesInvoices = state.salesInvoices.filter(i => i.id !== inv.id);
            renderSalesTable();
            showToast(`Faktur ${inv.id} berhasil dihapus.`, 'success');
          };
          modal.classList.add('open');
        }
      };
    });'''

if old_render_sales in js:
    js = js.replace(old_render_sales, new_render_sales)
    print("OK: renderSalesTable patched with CRUD buttons")
else:
    print("ERROR: renderSalesTable old string not found")

# 1b. Add openEditSalesModal function right after renderSalesTable closing brace
old_after_render = '''  // =========================================================================
  // FIGMA OVERLAY: CALCULATIONS & DYNAMIC ROWS (#2038:6036)
  // =========================================================================
  function calculateOverlaySalesTotals() {'''

new_after_render = '''  // =========================================================================
  // SALES INVOICE EDIT
  // =========================================================================
  function openEditSalesModal(inv) {
    // Open the penjualan overlay and pre-fill header fields with existing invoice data
    const modal = document.getElementById('modal-penjualan-overlay');
    if (!modal) return;

    // Store the id being edited so on submit we update instead of add
    modal.dataset.editId = inv.id;

    // Pre-fill fields
    const customerEl = document.getElementById('overlay-sales-customer');
    if (customerEl) {
      // Try to match existing option or add temp
      let found = false;
      for (let opt of customerEl.options) {
        if (opt.value === inv.customer || opt.text === inv.customer) {
          customerEl.value = opt.value;
          found = true;
          break;
        }
      }
      if (!found) {
        const opt = new Option(inv.customer, inv.customer, true, true);
        customerEl.add(opt);
      }
    }
    const warehouseEl = document.getElementById('overlay-sales-warehouse');
    if (warehouseEl) {
      for (let opt of warehouseEl.options) {
        if (opt.value.includes(inv.warehouse.split(' (')[0])) {
          warehouseEl.value = opt.value;
          break;
        }
      }
    }
    const invNoEl = document.getElementById('overlay-sales-invoice-no');
    if (invNoEl) invNoEl.value = inv.id;

    const dateEl = document.getElementById('overlay-sales-date');
    if (dateEl) dateEl.value = inv.date;

    calculateOverlaySalesTotals();
    modal.classList.add('open');
    showToast(`Mengedit faktur ${inv.id}`, 'info');
  }

  // =========================================================================
  // FIGMA OVERLAY: CALCULATIONS & DYNAMIC ROWS (#2038:6036)
  // =========================================================================
  function calculateOverlaySalesTotals() {'''

if old_after_render in js:
    js = js.replace(old_after_render, new_after_render)
    print("OK: openEditSalesModal added")
else:
    print("ERROR: anchor for openEditSalesModal not found")

# 1c. Update calculateOverlaySalesTotals to include DISC GROUP from Lain
old_calc_sales_end = '''    const tax = subtotal * 0.11; // 11% PPN
    const grandTotal = subtotal + tax;

    const subtotalEl = document.getElementById('overlay-calc-subtotal');
    const taxEl = document.getElementById('overlay-calc-tax');
    const grandTotalEl = document.getElementById('overlay-calc-grandtotal');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
    if (taxEl) taxEl.textContent = formatRupiah(tax);
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);
  }'''

new_calc_sales_end = '''    // Check if PPN is included via Lain checkbox
    const includePPN = document.getElementById('lain-termasuk-ppn')?.checked !== false;
    const discPersen = document.getElementById('lain-disc-persen')?.checked || false;
    const discGroup = parseFloat(document.getElementById('lain-disc-group')?.value) || 0;

    let tax = 0;
    if (includePPN) tax = subtotal * 0.11; // 11% PPN

    // DISC GROUP: if disc-persen checked, treat as %, else as nominal
    let discAmount = 0;
    if (discGroup > 0) {
      discAmount = discPersen ? (subtotal * discGroup / 100) : discGroup;
    }

    const grandTotal = subtotal + tax - discAmount;

    const subtotalEl = document.getElementById('overlay-calc-subtotal');
    const taxEl = document.getElementById('overlay-calc-tax');
    const grandTotalEl = document.getElementById('overlay-calc-grandtotal');
    const discGroupDisplayEl = document.getElementById('overlay-calc-discgroup');

    if (subtotalEl) subtotalEl.textContent = formatRupiah(subtotal);
    if (taxEl) taxEl.textContent = includePPN ? formatRupiah(tax) : 'Tidak dikenakan';
    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(Math.max(0, grandTotal));

    // Show/hide disc group row
    if (discGroupDisplayEl) {
      const discRow = document.getElementById('overlay-discgroup-row');
      if (discRow) discRow.style.display = discAmount > 0 ? 'flex' : 'none';
      discGroupDisplayEl.textContent = `- ${formatRupiah(discAmount)}${discPersen ? ` (${discGroup}%)` : ''}`;
    }
  }'''

if old_calc_sales_end in js:
    js = js.replace(old_calc_sales_end, new_calc_sales_end)
    print("OK: calculateOverlaySalesTotals updated with DISC GROUP")
else:
    print("ERROR: old_calc_sales_end not found")

with open('js/app.js', 'w') as f:
    f.write(js)

print("JS patching done.")
