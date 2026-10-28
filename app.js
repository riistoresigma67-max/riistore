/**
 * RIISTORE - Frontend Application Logic
 * Toko Akun CarX Street dengan Sistem Pembayaran Otomatis
 */

// Fallback products if accessed offline or directly via file://
const defaultProducts = [
  {
    id: "paket-a",
    name: "PAKET A - CarX Street",
    category: "paket-a",
    badge: "HEMAT 7K",
    badgeColor: "cyan",
    platform: "Android & iOS",
    price: 7000,
    originalPrice: 15000,
    discount: "53%",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    stock: 48,
    description: "Paket paling terjangkau untuk langsung balap dengan Level 50 Max dan modal 3 Juta Silver & 3 Ribu Gold.",
    specs: [
      "Silver 3.000.000 (3M)",
      "Gold 3.000 (3K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Support Akun Android & iOS",
      "Garansi Akun Aman 100%"
    ]
  },
  {
    id: "paket-b",
    name: "PAKET B - CarX Street",
    category: "paket-b",
    badge: "FAVORIT 10K",
    badgeColor: "blue",
    platform: "Android & iOS",
    price: 10000,
    originalPrice: 20000,
    discount: "50%",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    stock: 35,
    description: "Pilihan favorit racer pemula! Level 50 dengan modal 5 Juta Silver dan 5 Ribu Gold untuk beli mobil impian.",
    specs: [
      "Silver 5.000.000 (5M)",
      "Gold 5.000 (5K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Support Akun Android & iOS",
      "Garansi Akun Aman 100%"
    ]
  },
  {
    id: "paket-c",
    name: "PAKET C - CarX Street",
    category: "paket-c",
    badge: "BEST VALUE 15K",
    badgeColor: "purple",
    platform: "Android & iOS",
    price: 15000,
    originalPrice: 30000,
    discount: "50%",
    image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
    stock: 29,
    description: "Paket rekomendasi value terbaik! Modal melimpah 8 Juta Silver dan 8 Ribu Gold dengan semua map unlocked.",
    specs: [
      "Silver 8.000.000 (8M)",
      "Gold 8.000 (8K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Support Akun Android & iOS",
      "Garansi Akun Aman 100%"
    ]
  },
  {
    id: "paket-d",
    name: "PAKET D - CarX Street",
    category: "paket-d",
    badge: "SUPER PRO 20K",
    badgeColor: "red",
    platform: "Android & iOS",
    price: 20000,
    originalPrice: 40000,
    discount: "50%",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
    stock: 20,
    description: "Paket Pro dengan modal besar 12 Juta Silver dan 12 Ribu Gold. Bebas modifikasi mesin dan bodykit sepuasnya.",
    specs: [
      "Silver 12.000.000 (12M)",
      "Gold 12.000 (12K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Support Akun Android & iOS",
      "Garansi Akun Aman 100%"
    ]
  },
  {
    id: "paket-e",
    name: "PAKET E - Sultan 36 Mobil & Aksesoris",
    category: "paket-e",
    badge: "SULTAN 36 MOBIL",
    badgeColor: "gold",
    platform: "Android & iOS",
    price: 50000,
    originalPrice: 99000,
    discount: "49%",
    image: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=800&q=80",
    stock: 12,
    description: "PAKET TERTINGGI & PALING LENGKAP! Dapat 36 Mobil siap balap/drift + Aksesoris Terbuka + Uang 12M & Gold 12K.",
    specs: [
      "Silver 12.000.000 (12M)",
      "Gold 12.000 (12K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Aksesoris Terbuka Penuh",
      "Dapat 36 Mobil (Sebagian Pro Tuning DRIFT & BALAP)",
      "Support Akun Android & iOS",
      "Garansi Anti-Ban & Replace 100%"
    ]
  }
];

// App State
let allProducts = [];
let currentCategory = 'all';
let selectedProduct = null;
let selectedPaymentMethod = 'QRIS';
let currentInvoice = null;
let pollingTimer = null;
let countdownInterval = null;
let adminWhatsapp = "6281234567890";
let currentUser = null;
let pendingCheckoutProductId = null;

// Format Currency
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  loadStoreConfig();
  loadProducts();
  startTickerRotation();
});

// Load Store Config
async function loadStoreConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.adminWhatsapp) {
        adminWhatsapp = data.data.adminWhatsapp;
        updateWhatsAppLinks();
      }
    }
  } catch (e) {
    console.log('Running in local standalone mode.');
  }
}

function updateWhatsAppLinks() {
  const btnNav = document.getElementById('btnNavWa');
  const floatingWa = document.getElementById('floatingWaBtn');
  const msg = encodeURIComponent("Halo Admin RIISTORE, saya tertarik beli akun CarX Street!");
  if (btnNav) btnNav.href = `https://wa.me/${adminWhatsapp}?text=${msg}`;
  if (floatingWa) floatingWa.href = `https://wa.me/${adminWhatsapp}?text=${msg}`;
}

// Load Products
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      allProducts = data.data || data;
    } else {
      allProducts = defaultProducts;
    }
  } catch (err) {
    allProducts = defaultProducts;
  }
  renderProducts();
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const searchQuery = (document.getElementById('searchInput')?.value || '').toLowerCase();

  const filtered = allProducts.filter(item => {
    const matchCategory = currentCategory === 'all' || item.category === currentCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery) ||
                        item.description.toLowerCase().includes(searchQuery);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="text-align: center; grid-column: 1/-1; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">Tidak ada akun CarX Street yang cocok dengan pencarian.</p>
        <button class="btn btn-outline btn-sm" onclick="filterCategory('all', document.querySelector('.tab-btn'))">Tampilkan Semua Paket</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const specsHtml = item.specs.slice(0, 4).map(s => `<li>${s}</li>`).join('');
    
    return `
      <div class="product-card">
        <div class="product-img-wrapper">
          <img src="${item.image}" alt="${item.name}" class="product-img" loading="lazy">
          <span class="product-badge badge-${item.badgeColor || 'red'}">${item.badge}</span>
          <span class="platform-tag">⚡ Siap Balap</span>
        </div>
        <div class="product-info">
          <h4 class="product-title">${item.name}</h4>
          <p class="product-desc">${item.description}</p>
          
          <ul class="specs-list">
            ${specsHtml}
          </ul>

          <div class="price-stock-row">
            <div class="price-box">
              <div class="original-price">${formatRupiah(item.originalPrice)}</div>
              <div class="current-price">${formatRupiah(item.price)}</div>
            </div>
            <div class="stock-tag">
              ⚡ Stok Tersedia (${item.stock})
            </div>
          </div>

          <button class="btn btn-primary btn-lg" onclick="openCheckout('${item.id}')" style="width: 100%; margin-top: 8px;">
            Beli Sekarang ➔
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Category filter
function filterCategory(cat, element) {
  currentCategory = cat;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  renderProducts();
}

// Search handler
function handleSearch() {
  renderProducts();
}

// Open Checkout Modal
function openCheckout(productId) {
  // Check if buyer is logged in
  const user = getCurrentUser();
  if (!user) {
    pendingCheckoutProductId = productId;
    showToast('⚠️ Buyer harus daftar / masuk akun terlebih dahulu sebelum membeli!');
    openAuthModal('register');
    return;
  }

  selectedProduct = allProducts.find(p => p.id === productId);
  if (!selectedProduct) return;

  const preview = document.getElementById('checkoutProductPreview');
  preview.innerHTML = `
    <img src="${selectedProduct.image}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px;" alt="Car">
    <div>
      <div style="font-weight: 800; font-size: 0.95rem; color: #fff;">${selectedProduct.name}</div>
      <div style="color: var(--primary-neon); font-weight: 800; font-size: 1.1rem;">${formatRupiah(selectedProduct.price)}</div>
      <div style="font-size: 0.75rem; color: var(--accent-green);">⚡ Proses Pengiriman Otomatis 1-3 Menit</div>
    </div>
  `;

  // Pre-fill user details if available
  const waInput = document.getElementById('custWhatsapp');
  const emailInput = document.getElementById('custEmail');
  if (waInput && user.whatsapp) waInput.value = user.whatsapp;
  if (emailInput && user.email && user.email !== 'admin') emailInput.value = user.email;

  // Reset payment selection to QRIS
  selectedPaymentMethod = 'QRIS';
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  const firstOption = document.querySelector('.payment-option');
  if (firstOption) firstOption.classList.add('selected');

  openModal('checkoutModal');
}

// Select Payment Method in Checkout
function selectPaymentMethod(method, element) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  if (element) element.classList.add('selected');
}

// Submit Order Form
async function submitOrder(e) {
  e.preventDefault();
  const whatsapp = document.getElementById('custWhatsapp').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const platform = 'Universal';

  if (!whatsapp) {
    showToast('Mohon masukkan nomor WhatsApp yang aktif!');
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    showToast('Sesi berakhir, silakan login kembali');
    openAuthModal('login');
    return;
  }

  const submitBtn = document.getElementById('btnSubmitOrder');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Membuat Invoice...';

  try {
    const res = await fetch('/api/order/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: selectedProduct.id,
        customerWhatsapp: whatsapp,
        customerEmail: email,
        platform: platform,
        paymentMethod: selectedPaymentMethod,
        buyerId: user.id,
        buyerUsername: user.username
      })
    });

    const result = await res.json();
    if (result.success && result.data) {
      closeModal('checkoutModal');
      displayInvoice(result.data);
    } else {
      showToast(result.message || 'Gagal membuat pesanan');
    }
  } catch (err) {
    // Fallback Client Simulation if server is offline
    const fallbackOrder = generateFallbackOrder(selectedProduct, whatsapp, email, platform, selectedPaymentMethod);
    fallbackOrder.buyerId = user.id;
    fallbackOrder.buyerUsername = user.username;
    closeModal('checkoutModal');
    displayInvoice(fallbackOrder);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Bayar Sekarang ➔';
  }
}

// Fallback order generator for static testing
function generateFallbackOrder(product, whatsapp, email, platform, paymentMethod) {
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const invoice = `RII-20261029-${randomCode}`;
  const totalPayment = product.price;

  let paymentDetail = {};
  if (paymentMethod === 'QRIS') {
    paymentDetail = {
      type: 'QRIS',
      title: 'QRIS Dinamis (Semua Bank & E-Wallet)',
      qrString: `00020101021226680016ID.CO.RIISTORE.WWW01189360000201100000000215${invoice}51450015ID.OR.GPNQRIS0102000203000520458125303360540${totalPayment}5802ID5912RIISTORE CARX6007JAKARTA62070703A016304B76C`
    };
  } else {
    paymentDetail = {
      type: 'VIRTUAL_ACCOUNT',
      bank: paymentMethod.replace('VA_', ''),
      vaNumber: `88001${whatsapp.replace(/\D/g, '').slice(-7)}${randomCode.toString().slice(-3)}`
    };
  }

  return {
    invoice,
    productId: product.id,
    productName: product.name,
    price: product.price,
    totalPayment,
    paymentMethod,
    paymentDetail,
    customerWhatsapp: whatsapp,
    platform,
    status: 'UNPAID',
    createdAt: new Date().toISOString()
  };
}

// Display Invoice Screen
function displayInvoice(order) {
  currentInvoice = order.invoice;

  // Reset Views
  document.getElementById('unpaidSection').style.display = 'block';
  document.getElementById('paidSection').style.display = 'none';

  // Fill Header Data
  document.getElementById('invNumber').textContent = order.invoice;
  document.getElementById('invProductName').textContent = order.productName;
  document.getElementById('invPaymentMethod').textContent = order.paymentDetail.title || order.paymentMethod;
  document.getElementById('invTotalAmount').textContent = formatRupiah(order.totalPayment);

  // Render Payment Instructions
  const container = document.getElementById('paymentInstructions');

  if (order.paymentDetail.type === 'QRIS') {
    container.innerHTML = `
      <div class="qris-display-box">
        <div class="qris-brand-header">
          <div class="qris-brand-title">QRIS</div>
          <div class="gpn-brand-title">GPN NASIONAL</div>
        </div>
        <div class="qris-canvas-wrapper">
          <canvas id="qrisCanvas"></canvas>
        </div>
        <div class="qris-footer-nm">NMID: ID1020268847291</div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px;">${order.paymentDetail.merchantName || 'Paymenku'} - QRIS RESMI DINAMIS</div>
      </div>

      <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 10px;">
        Buka aplikasi <strong>DANA, GoPay, OVO, ShopeePay</strong>, atau <strong>Mobile Banking</strong> (BCA, Mandiri, BRI, BNI), lalu scan QRIS di atas dengan nominal pas:
      </div>
      <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
        <button class="btn btn-outline btn-sm" onclick="downloadQRCode()">📥 Simpan Gambar QR</button>
        <button class="btn btn-outline btn-sm" onclick="copyAmount(${order.totalPayment})">📋 Salin Nominal</button>
        ${order.paymentDetail.payUrl ? `<a href="${order.paymentDetail.payUrl}" target="_blank" class="btn btn-outline btn-sm">🔗 Halaman Bayar</a>` : ''}
      </div>
    `;

    setTimeout(() => {
      if (window.generateQRCode) {
        window.generateQRCode(order.paymentDetail.qrString, 'qrisCanvas', { size: 220, drawBadge: true });
      }
    }, 100);

  } else if (order.paymentDetail.type === 'VIRTUAL_ACCOUNT') {
    container.innerHTML = `
      <div class="va-display-box">
        <div style="font-size: 0.85rem; color: var(--text-dim); text-transform: uppercase;">
          Nomor ${order.paymentDetail.bank} Virtual Account:
        </div>
        <div class="va-number" id="vaNumberDisplay">${order.paymentDetail.vaNumber}</div>
        <button class="btn btn-primary btn-sm" onclick="copyText('vaNumberDisplay')">
          📋 Salin Nomor VA
        </button>
      </div>

      <div style="font-size: 0.85rem; color: #cbd5e1; text-align: left; background: #090e1a; padding: 12px; border-radius: var(--radius-md); margin-bottom: 12px;">
        <strong style="color: var(--primary-neon);">Cara Pembayaran ${order.paymentDetail.bank} VA:</strong>
        <ol style="margin-top: 6px; padding-left: 18px; font-size: 0.82rem; line-height: 1.5;">
          <li>Buka Mobile Banking ${order.paymentDetail.bank} atau ATM.</li>
          <li>Pilih menu <strong>Transfer / Pembayaran</strong> ➔ <strong>Virtual Account</strong>.</li>
          <li>Masukkan Nomor VA di atas.</li>
          <li>Total tagihan akan otomatis muncul sesuai nominal. Konfirmasi PIN dan bayar.</li>
        </ol>
      </div>
    `;
  } else {
    // E-Wallet Direct fallback
    container.innerHTML = `
      <div style="padding: 1.5rem; text-align: center;">
        <p style="margin-bottom: 12px;">Silakan klik tombol di bawah untuk membuka aplikasi ${order.paymentDetail.wallet}:</p>
        <a href="${order.paymentDetail.payUrl}" target="_blank" class="btn btn-primary btn-lg">
          Bayar via ${order.paymentDetail.wallet}
        </a>
      </div>
    `;
  }

  // Start 15 mins Countdown Timer
  startCountdown(15 * 60);

  // Start Real-Time Polling for Automatic Payment Detection
  startPaymentPolling(order.invoice);

  openModal('invoiceModal');
}

// Countdown Timer Handler
function startCountdown(seconds) {
  if (countdownInterval) clearInterval(countdownInterval);

  let remaining = seconds;
  const timerEl = document.getElementById('countdownTimer');

  countdownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      if (timerEl) timerEl.textContent = "00:00 (Kadaluarsa)";
      return;
    }

    const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
    const secs = (remaining % 60).toString().padStart(2, '0');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

// Real-Time Status Polling (Auto-Detect Webhook/Payment)
function startPaymentPolling(invoice) {
  if (pollingTimer) clearInterval(pollingTimer);

  pollingTimer = setInterval(async () => {
    try {
      const res = await fetch(`/api/order/status?invoice=${encodeURIComponent(invoice)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.status === 'PAID') {
          clearInterval(pollingTimer);
          if (countdownInterval) clearInterval(countdownInterval);
          onPaymentSuccess(data.data);
        }
      }
    } catch (e) {
      // Ignore network hiccup during polling
    }
  }, 3000); // Poll every 3 seconds
}

// On Payment Success Event
function onPaymentSuccess(order) {
  playSuccessSound();

  document.getElementById('unpaidSection').style.display = 'none';
  document.getElementById('paidSection').style.display = 'block';

  const creds = order.accountDetails || {
    username: `riistore.carx.${order.invoice.slice(-4)}@gmail.com`,
    password: `StreetPass#${order.invoice.slice(-4)}`,
    loginType: order.platform === 'iOS' ? 'Apple ID' : 'Google Play Games',
    instructions: 'Silakan masukkan email dan password di atas ke aplikasi Google Play / Game Center HP Anda, lalu login ke CarX Street dan load Cloud Save.'
  };

  document.getElementById('credUsername').textContent = creds.username || creds.orderToken || 'Hubungi CS';
  document.getElementById('credPassword').textContent = creds.password || '-';
  document.getElementById('credType').textContent = creds.type || creds.loginType || 'Direct Delivery';
  document.getElementById('credInstructions').textContent = creds.instructions || '-';

  const noteEl = document.getElementById('credAdminNote');
  if (noteEl) {
    noteEl.textContent = creds.notes || "tinggal login di carx street ya bosku😇";
  }

  // Setup WhatsApp Claim Button
  const waBtn = document.getElementById('btnClaimWa');
  const msg = encodeURIComponent(`Halo Admin RIISTORE, pesanan saya dengan Invoice ${order.invoice} (${order.productName}) sudah LUNAS secara otomatis. Mohon dibantu jika ada panduan tambahan.`);
  waBtn.href = `https://wa.me/${adminWhatsapp}?text=${msg}`;

  showToast('🎉 Pembayaran Berhasil Dikonfirmasi!');
}

// Simulate Payment Success (DEMO BUTTON for User to test Auto-Detect)
async function simulatePaymentSuccess() {
  if (!currentInvoice) return;

  try {
    const res = await fetch('/api/payment/simulate-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice: currentInvoice })
    });

    const data = await res.json();
    if (data.success && data.data) {
      if (pollingTimer) clearInterval(pollingTimer);
      if (countdownInterval) clearInterval(countdownInterval);
      onPaymentSuccess(data.data);
    }
  } catch (err) {
    // Client fallback demo
    const mockPaidOrder = {
      invoice: currentInvoice,
      productName: selectedProduct ? selectedProduct.name : 'Akun CarX Street Sultan',
      platform: 'Android',
      status: 'PAID',
      accountDetails: {
        username: `riistore.cxs.${Math.floor(1000 + Math.random() * 9000)}@gmail.com`,
        password: `StreetRii*${Math.floor(100000 + Math.random() * 900000)}`,
        loginType: 'Google Play Games',
        instructions: '1. Buka aplikasi Google Play Games.\n2. Tambahkan akun Google di atas.\n3. Masuk ke game CarX Street dan Load Simpanan Cloud.\n4. Selamat balapan di Sunset City!'
      }
    };
    if (pollingTimer) clearInterval(pollingTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    onPaymentSuccess(mockPaidOrder);
  }
}

// Sound Synthesizer on Payment (Web Audio API - No external file required!)
function playSuccessSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
    osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc1.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

// Download QR Code Canvas as PNG
function downloadQRCode() {
  const canvas = document.getElementById('qrisCanvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `QRIS-RIISTORE-${currentInvoice}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Gambar QRIS berhasil didownload!');
}

// Copy Text Helper
function copyText(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Teks berhasil disalin ke clipboard!');
  }).catch(() => {
    showToast('Gagal menyalin');
  });
}

function copyAmount(amount) {
  navigator.clipboard.writeText(amount.toString()).then(() => {
    showToast(`Nominal ${formatRupiah(amount)} berhasil disalin!`);
  });
}

// Track Order Search
async function searchTrackOrder() {
  const input = document.getElementById('trackInput').value.trim();
  const container = document.getElementById('trackResultContainer');
  if (!input) {
    showToast('Masukkan nomor WhatsApp atau invoice');
    return;
  }

  container.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 1rem;">Mencari data pesanan...</div>';

  try {
    const res = await fetch(`/api/order/track?query=${encodeURIComponent(input)}`);
    const data = await res.json();

    if (data.success && data.data && data.data.length > 0) {
      container.innerHTML = data.data.map(order => `
        <div style="background: #090e1a; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #fff; font-family: monospace;">${order.invoice}</strong>
            <span class="status-pill" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 800; background: ${order.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${order.status === 'PAID' ? 'var(--accent-green)' : 'var(--accent-red)'}">
              ${order.status === 'PAID' ? '✓ LUNAS' : 'MENUNGGU PEMBAYARAN'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: #cbd5e1;">${order.productName}</div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
            Total: ${formatRupiah(order.totalPayment)} • ${new Date(order.createdAt).toLocaleDateString('id-ID')}
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top: 8px; width: 100%;" onclick="viewOrderInvoice('${order.invoice}')">
            ${order.status === 'PAID' ? 'Lihat Detail Akun ➔' : 'Lanjutkan Pembayaran ➔'}
          </button>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div style="color: var(--accent-red); text-align: center; padding: 1.5rem; background: rgba(239, 68, 68, 0.05); border-radius: var(--radius-md);">
          Tidak ditemukan pesanan dengan No. WA / Invoice tersebut.
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--accent-red); text-align: center;">Gagal menghubungi server.</div>';
  }
}

// View existing invoice from tracking
async function viewOrderInvoice(invoice) {
  closeModal('trackModal');
  try {
    const res = await fetch(`/api/order/status?invoice=${encodeURIComponent(invoice)}`);
    const data = await res.json();
    if (data.success && data.data) {
      if (data.data.status === 'PAID') {
        currentInvoice = data.data.invoice;
        openModal('invoiceModal');
        onPaymentSuccess(data.data);
      } else {
        displayInvoice(data.data);
      }
    }
  } catch (err) {
    showToast('Gagal memuat invoice');
  }
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
  if (id === 'invoiceModal') {
    if (pollingTimer) clearInterval(pollingTimer);
    if (countdownInterval) clearInterval(countdownInterval);
  }
}

function openTrackModal() {
  document.getElementById('trackResultContainer').innerHTML = '';
  document.getElementById('trackInput').value = '';
  openModal('trackModal');
}

function openEduModal() {
  openModal('eduModal');
}

async function openAdminModal() {
  const listEl = document.getElementById('adminOrdersList');
  listEl.innerHTML = 'Memuat transaksi...';
  openModal('adminModal');

  try {
    const res = await fetch('/api/admin/orders');
    const data = await res.json();
    if (data.success && data.data) {
      if (data.data.length === 0) {
        listEl.innerHTML = '<div style="color: var(--text-dim); text-align: center;">Belum ada pesanan masuk.</div>';
      } else {
        listEl.innerHTML = data.data.map(o => `
          <div style="border-bottom: 1px solid var(--border-color); padding: 6px 0; display: flex; justify-content: space-between;">
            <div>
              <span style="font-weight: 700; color: #fff;">${o.invoice}</span> (${o.customerWhatsapp})
              <div style="color: var(--text-dim); font-size: 0.72rem;">${o.productName} - ${formatRupiah(o.totalPayment)}</div>
            </div>
            <span style="color: ${o.status === 'PAID' ? 'var(--accent-green)' : 'var(--accent-orange)'}; font-weight: 800;">
              ${o.status}
            </span>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    listEl.innerHTML = 'Gagal memuat orders.';
  }
}

// ==========================================
// USER AUTHENTICATION & SESSION MANAGEMENT
// ==========================================

function initAuth() {
  try {
    const saved = localStorage.getItem('riistore_user');
    if (saved) {
      currentUser = JSON.parse(saved);
    }
  } catch (e) {
    currentUser = null;
  }
  renderNavbarAuth();
}

function getCurrentUser() {
  if (!currentUser) {
    try {
      const saved = localStorage.getItem('riistore_user');
      if (saved) currentUser = JSON.parse(saved);
    } catch (e) {}
  }
  return currentUser;
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem('riistore_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('riistore_user');
  }
  renderNavbarAuth();
}

function renderNavbarAuth() {
  const container = document.getElementById('navbarAuthArea');
  if (!container) return;

  const user = getCurrentUser();

  if (!user) {
    container.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="openAuthModal('login')">
        🔑 Masuk / Daftar
      </button>
    `;
    return;
  }

  if (user.role === 'admin') {
    container.innerHTML = `
      <div class="user-pill admin" onclick="openAdminDashboardModal()" title="Buka Dashboard Admin">
        👑 Admin RIISTORE
      </div>
      <button class="btn btn-primary btn-sm" onclick="openAdminDashboardModal()">
        ⚙️ Panel Admin
      </button>
      <button class="btn-logout" onclick="logout()" title="Keluar">
        Keluar
      </button>
    `;
  } else {
    container.innerHTML = `
      <div class="user-pill" onclick="openBuyerHistoryModal()" title="Lihat Akun CarX Street yang Sudah Kamu Beli">
        👤 ${user.username}
      </div>
      <button class="btn btn-outline btn-sm" onclick="openBuyerHistoryModal()">
        📦 Akun Saya
      </button>
      <button class="btn-logout" onclick="logout()" title="Keluar">
        Keluar
      </button>
    `;
  }
}

function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  openModal('authModal');
}

function switchAuthTab(tab) {
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const title = document.getElementById('authModalTitle');

  if (tab === 'register') {
    tabBtnRegister.classList.add('active');
    tabBtnLogin.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    if (title) title.textContent = '📝 Daftar Akun Buyer Baru';
  } else {
    tabBtnLogin.classList.add('active');
    tabBtnRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    if (title) title.textContent = '🔐 Masuk Akun RIISTORE';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const btn = document.getElementById('btnLoginSubmit');

  if (!email || !password) {
    showToast('Email dan password wajib diisi!');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Memverifikasi...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success && data.user) {
      setCurrentUser(data.user);
      closeModal('authModal');
      showToast(data.message || 'Login berhasil!');

      if (data.user.role === 'admin') {
        setTimeout(() => openAdminDashboardModal(), 500);
      } else if (pendingCheckoutProductId) {
        const prodId = pendingCheckoutProductId;
        pendingCheckoutProductId = null;
        openCheckout(prodId);
      }
    } else {
      showToast(data.message || 'Login gagal, periksa email dan password!');
    }
  } catch (err) {
    // Offline simulation for admin login
    if (email === 'admin' && password === 'admin123') {
      const mockAdmin = { id: 'admin-01', username: 'admin', email: 'admin', role: 'admin' };
      setCurrentUser(mockAdmin);
      closeModal('authModal');
      showToast('Login Admin Berhasil (Mode Offline)');
      openAdminDashboardModal();
    } else {
      showToast('Gagal menghubungi server.');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Masuk Sekarang ➔';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const whatsapp = document.getElementById('regWhatsapp').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const btn = document.getElementById('btnRegisterSubmit');

  if (!username || !email || !password || !whatsapp) {
    showToast('Semua kolom registrasi wajib diisi!');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Mendaftarkan akun...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, whatsapp, password })
    });

    const data = await res.json();

    if (data.success && data.user) {
      setCurrentUser(data.user);
      closeModal('authModal');
      showToast('🎉 Akun kamu berhasil didaftarkan! Selamat datang di RIISTORE.');

      if (pendingCheckoutProductId) {
        const prodId = pendingCheckoutProductId;
        pendingCheckoutProductId = null;
        openCheckout(prodId);
      }
    } else {
      showToast(data.message || 'Gagal mendaftar');
    }
  } catch (err) {
    // Fallback registration for offline mode
    const mockUser = {
      id: `user-${Date.now()}`,
      username: username,
      email: email,
      whatsapp: whatsapp,
      role: 'buyer'
    };
    setCurrentUser(mockUser);
    closeModal('authModal');
    showToast('Registrasi akun berhasil!');
    if (pendingCheckoutProductId) {
      const prodId = pendingCheckoutProductId;
      pendingCheckoutProductId = null;
      openCheckout(prodId);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Daftar Akun Baru ➔';
  }
}

function logout() {
  setCurrentUser(null);
  showToast('Kamu telah keluar.');
}

// ==========================================
// ADMIN DASHBOARD CONTROLS (EMAIL: admin, PASS: admin123)
// ==========================================

function openAdminDashboardModal() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    showToast('Akses khusus Admin! Silakan login sebagai admin.');
    openAuthModal('login');
    return;
  }

  switchAdminTab('accounts', document.querySelector('.admin-nav-btn'));
  loadAdminDashboardData();
  loadAccountStockTable();
  openModal('adminDashboardModal');
}

function switchAdminTab(tabName, btnElement) {
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  const tabs = {
    'accounts': document.getElementById('adminTabAccounts'),
    'stock': document.getElementById('adminTabStock'),
    'orders': document.getElementById('adminTabOrders'),
    'buyers': document.getElementById('adminTabBuyers'),
    'settings': document.getElementById('adminTabSettings')
  };

  Object.keys(tabs).forEach(k => {
    if (tabs[k]) tabs[k].style.display = (k === tabName) ? 'block' : 'none';
  });

  if (tabName === 'accounts') {
    loadAccountStockTable();
  }
}

// Load Real CarX Street Account Inventory Table
async function loadAccountStockTable() {
  const tbody = document.getElementById('adminAccountsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">Memuat daftar akun CarX Street...</td></tr>`;

  try {
    const res = await fetch('/api/admin/accounts');
    const data = await res.json();

    if (data.success && data.data) {
      if (data.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 2rem;">Belum ada akun di stok. Silakan tambahkan akun lewat form di atas!</td></tr>`;
      } else {
        tbody.innerHTML = data.data.map(acc => `
          <tr>
            <td>
              <strong style="color: var(--primary-neon);">${acc.packageName || acc.packageId}</strong>
            </td>
            <td>
              <code style="color: #fff; font-size: 0.85rem;">${acc.email}</code>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <code style="color: #cbd5e1; font-size: 0.85rem;">${acc.password}</code>
                <button class="btn btn-outline btn-sm" style="padding: 2px 6px; font-size: 0.7rem;" onclick="navigator.clipboard.writeText('${acc.password}').then(()=>showToast('Password disalin!'))">Salin</button>
              </div>
            </td>
            <td>
              <div style="font-size: 0.78rem; color: #fbbf24; font-weight: 700; max-width: 250px;">
                ${acc.notes || 'tinggal login di carx street ya bosku😇'}
              </div>
            </td>
            <td>
              <span class="status-pill ${acc.status === 'AVAILABLE' ? 'status-paid' : 'status-unpaid'}">
                ${acc.status === 'AVAILABLE' ? '⚡ READY (TERSEDIA)' : '✓ TERJUAL'}
              </span>
              ${acc.soldToInvoice ? `<div style="font-size: 0.7rem; color: var(--text-dim);">${acc.soldToInvoice}</div>` : ''}
            </td>
            <td>
              ${acc.status === 'AVAILABLE' ? `
                <button class="btn btn-logout" style="padding: 4px 8px; font-size: 0.75rem;" onclick="handleDeleteAccountStock('${acc.id}')">
                  Hapus
                </button>
              ` : `
                <span style="font-size: 0.75rem; color: var(--text-dim);">Terkirim</span>
              `}
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-red);">Gagal memuat akun dari server.</td></tr>`;
  }
}

// Add CarX Street Account to Inventory Form Handler
async function handleAddAccountStock(e) {
  e.preventDefault();
  const packageId = document.getElementById('accInputPackage').value;
  const email = document.getElementById('accInputEmail').value.trim();
  const password = document.getElementById('accInputPassword').value.trim();
  const notes = document.getElementById('accInputNotes').value.trim();
  const btn = document.getElementById('btnAddAccSubmit');

  if (!packageId || !email || !password) {
    showToast('Pilih paket dan masukkan email & password akun!');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Menyimpan Akun...';

  try {
    const res = await fetch('/api/admin/account/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId, email, password, platform: 'Universal', notes })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Akun CarX Street berhasil ditambahkan ke stok!');
      document.getElementById('accInputEmail').value = '';
      document.getElementById('accInputPassword').value = '';
      loadAccountStockTable();
      loadAdminDashboardData();
      loadProducts(); // Sync catalog stock counts!
    } else {
      showToast(data.message || 'Gagal menambahkan akun');
    }
  } catch (err) {
    showToast('Gagal menghubungi server');
  } finally {
    btn.disabled = false;
    btn.textContent = '➕ Simpan & Tambahkan Akun ke Stok';
  }
}

// Delete Unsold Account
async function handleDeleteAccountStock(id) {
  if (!confirm('Hapus akun CarX Street ini dari stok?')) return;

  try {
    const res = await fetch('/api/admin/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Akun berhasil dihapus');
      loadAccountStockTable();
      loadAdminDashboardData();
      loadProducts();
    } else {
      showToast(data.message || 'Gagal menghapus akun');
    }
  } catch (err) {
    showToast('Gagal menghubungi server');
  }
}

async function loadAdminDashboardData() {
  try {
    const res = await fetch('/api/admin/dashboard');
    if (!res.ok) return;

    const result = await res.json();
    if (!result.success || !result.data) return;

    const data = result.data;

    // Metrics
    document.getElementById('dashTotalRevenue').textContent = formatRupiah(data.totalRevenue || 0);
    document.getElementById('dashTotalOrders').textContent = `${data.totalOrders || 0} (${data.paidOrdersCount || 0} Lunas)`;
    document.getElementById('dashTotalStock').textContent = `${data.totalStock || 0} Unit`;
    document.getElementById('dashTotalBuyers').textContent = `${data.totalBuyers || 0} User`;

    // Tab 1: Render Stock Management Table
    const stockTbody = document.getElementById('adminStockTableBody');
    if (stockTbody && data.products) {
      allProducts = data.products;
      renderProducts(); // Keep storefront updated too!

      stockTbody.innerHTML = data.products.map(p => `
        <tr>
          <td>
            <strong style="color: #fff;">${p.name}</strong>
            <div style="font-size: 0.72rem; color: var(--primary-neon);">${p.id}</div>
          </td>
          <td>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${p.specs.slice(0, 2).join(' • ')}</div>
          </td>
          <td>
            <input type="number" class="price-input" id="priceInput_${p.id}" value="${p.price}" min="1000" step="1000">
          </td>
          <td>
            <input type="number" class="stock-input" id="stockInput_${p.id}" value="${p.stock}" min="0">
          </td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="updateStockFromAdmin('${p.id}')">
              💾 Simpan
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Tab 2: Render Orders Monitor Table
    const ordersTbody = document.getElementById('adminOrdersTableBody');
    if (ordersTbody && data.recentOrders) {
      if (data.recentOrders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 2rem;">Belum ada pesanan masuk.</td></tr>`;
      } else {
        ordersTbody.innerHTML = data.recentOrders.map(o => `
          <tr>
            <td>
              <strong style="font-family: monospace; color: #fff;">${o.invoice}</strong>
              <div style="font-size: 0.72rem; color: var(--text-dim);">${new Date(o.createdAt).toLocaleTimeString('id-ID')}</div>
            </td>
            <td>
              <div>${o.buyerUsername || 'Guest'}</div>
              <a href="https://wa.me/${o.customerWhatsapp.replace(/\D/g, '')}" target="_blank" style="color: #25d366; font-size: 0.78rem; text-decoration: none;">
                📱 ${o.customerWhatsapp}
              </a>
            </td>
            <td>
              <span style="font-weight: 700;">${o.productName}</span>
            </td>
            <td style="color: var(--primary-neon); font-weight: 800;">
              ${formatRupiah(o.totalPayment || o.price)}
            </td>
            <td>
              <span style="font-size: 0.75rem;">${o.paymentMethod}</span>
            </td>
            <td>
              <span class="status-pill ${o.status === 'PAID' ? 'status-paid' : 'status-unpaid'}">
                ${o.status === 'PAID' ? '✓ LUNAS' : 'BELUM BAYAR'}
              </span>
            </td>
            <td>
              ${o.status !== 'PAID' ? `
                <button class="btn btn-accent btn-sm" onclick="adminMarkAsPaid('${o.invoice}')" style="font-size: 0.72rem; padding: 4px 8px;">
                  Set Lunas
                </button>
              ` : `
                <button class="btn btn-outline btn-sm" onclick="viewOrderInvoice('${o.invoice}')" style="font-size: 0.72rem; padding: 4px 8px;">
                  Lihat Akun
                </button>
              `}
            </td>
          </tr>
        `).join('');
      }
    }

    // Tab 3: Render Registered Buyers
    const buyersTbody = document.getElementById('adminBuyersTableBody');
    if (buyersTbody && data.buyersList) {
      if (data.buyersList.length === 0) {
        buyersTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 2rem;">Belum ada buyer yang registrasi.</td></tr>`;
      } else {
        buyersTbody.innerHTML = data.buyersList.map(b => `
          <tr>
            <td><strong style="color: #fff;">${b.username}</strong></td>
            <td>${b.email}</td>
            <td>
              ${b.whatsapp ? `<a href="https://wa.me/${b.whatsapp.replace(/\D/g, '')}" target="_blank" style="color: #25d366; text-decoration: none;">${b.whatsapp}</a>` : '-'}
            </td>
            <td style="font-size: 0.8rem; color: var(--text-dim);">${new Date(b.createdAt).toLocaleDateString('id-ID')}</td>
            <td><span style="color: var(--primary-neon); font-weight: 800;">${b.orderCount} Pesanan</span></td>
          </tr>
        `).join('');
      }
    }

  } catch (err) {
    console.error('Error loading admin dashboard:', err);
  }
}

async function updateStockFromAdmin(productId) {
  const stockInput = document.getElementById(`stockInput_${productId}`);
  const priceInput = document.getElementById(`priceInput_${productId}`);

  if (!stockInput) return;

  const newStock = parseInt(stockInput.value, 10);
  const newPrice = priceInput ? parseInt(priceInput.value, 10) : undefined;

  try {
    const res = await fetch('/api/admin/stock/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, stock: newStock, price: newPrice })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      loadAdminDashboardData();
    } else {
      showToast(data.message || 'Gagal update stok');
    }
  } catch (e) {
    showToast('Gagal mengirim update ke server');
  }
}

async function adminMarkAsPaid(invoice) {
  if (!confirm(`Konfirmasi pelunasan manual untuk pesanan ${invoice}? Akun CarX Street akan langsung digenerate!`)) {
    return;
  }

  try {
    const res = await fetch('/api/admin/order/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice, status: 'PAID' })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Pesanan ${invoice} berhasil diset LUNAS!`);
      loadAdminDashboardData();
    }
  } catch (e) {
    showToast('Gagal update status');
  }
}

async function saveAdminStoreSettings(e) {
  e.preventDefault();
  const storeName = document.getElementById('settingStoreName').value.trim();
  const adminWhatsapp = document.getElementById('settingAdminWa').value.trim();

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName, adminWhatsapp })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Pengaturan toko berhasil diperbarui!');
      loadStoreConfig();
    }
  } catch (e) {
    showToast('Gagal menyimpan pengaturan');
  }
}

// ==========================================
// BUYER DASHBOARD: RIWAYAT AKUN SAYA
// ==========================================

async function openBuyerHistoryModal() {
  const user = getCurrentUser();
  if (!user) {
    showToast('Harap login terlebih dahulu untuk melihat riwayat akun!');
    openAuthModal('login');
    return;
  }

  const container = document.getElementById('buyerOrdersList');
  container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">Memuat akun kamu...</div>';
  openModal('buyerHistoryModal');

  try {
    const res = await fetch(`/api/buyer/orders?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`);
    const data = await res.json();

    if (data.success && data.data && data.data.length > 0) {
      container.innerHTML = data.data.map(order => `
        <div style="background: #090e1a; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #fff; font-family: monospace;">${order.invoice}</strong>
            <span class="status-pill ${order.status === 'PAID' ? 'status-paid' : 'status-unpaid'}">
              ${order.status === 'PAID' ? '✓ LUNAS' : 'MENUNGGU PEMBAYARAN'}
            </span>
          </div>

          <div style="font-weight: 800; color: var(--primary-neon); font-size: 1.05rem;">
            ${order.productName}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-dim); margin-top: 4px;">
            Total: ${formatRupiah(order.totalPayment || order.price)} • ${new Date(order.createdAt).toLocaleDateString('id-ID')}
          </div>

          ${order.status === 'PAID' && order.accountDetails ? `
            <div style="margin-top: 10px; background: rgba(16, 185, 129, 0.08); border: 1px solid var(--accent-green); border-radius: var(--radius-sm); padding: 10px; font-size: 0.82rem;">
              <div style="color: var(--accent-green); font-weight: 800; margin-bottom: 4px;">🎮 Data Login Akun CarX Street Kamu:</div>
              <div><strong>Email/ID:</strong> <code style="color: #fff;">${order.accountDetails.username || '-'}</code></div>
              <div><strong>Password:</strong> <code style="color: #fff;">${order.accountDetails.password || '-'}</code></div>
              
              <div style="margin-top: 8px; background: rgba(245, 158, 11, 0.15); border: 1.5px dashed #f59e0b; border-radius: var(--radius-sm); padding: 8px; text-align: center; font-size: 0.9rem; font-weight: 800; color: #fff;">
                📌 Catatan Admin: ${order.accountDetails.notes || 'tinggal login di carx street ya bosku😇'}
              </div>

              <div style="margin-top: 6px; font-size: 0.78rem; color: var(--text-muted);">${order.accountDetails.instructions || ''}</div>
            </div>
          ` : `
            <button class="btn btn-primary btn-sm" style="margin-top: 10px; width: 100%;" onclick="viewOrderInvoice('${order.invoice}')">
              Lanjutkan Pembayaran ➔
            </button>
          `}
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem; background: rgba(15, 23, 42, 0.4); border-radius: var(--radius-md);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🏎️</div>
          <p style="font-size: 0.95rem; color: #fff; font-weight: 700;">Kamu Belum Membeli Akun</p>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
            Pilih Paket A, B, C, D, atau E di katalog untuk mulai balapan!
          </p>
          <button class="btn btn-primary btn-sm" onclick="closeModal('buyerHistoryModal')">
            Lihat Katalog Paket ➔
          </button>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--accent-red); text-align: center;">Gagal memuat riwayat pembelian.</div>';
  }
}

// Toast System
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Live Social Proof Ticker Rotation
function startTickerRotation() {
  const ticker = document.getElementById('tickerText');
  if (!ticker) return;

  const activities = [
    "Pesanan #RII-9821 baru saja dibeli: PAKET E (36 Mobil + Aksesoris) Lunas via QRIS",
    "0813****1290 baru saja membeli: PAKET A (Silver 3M + Gold 3K) Lunas via DANA QRIS",
    "0878****4421 baru saja membeli: PAKET C (Silver 8M + Gold 8K) Lunas via BCA Virtual Account",
    "0821****8911 baru saja membeli: PAKET D (Silver 12M + Gold 12K) Lunas via BRI BRIVA",
    "0857****7732 baru saja membeli: PAKET B (Silver 5M + Gold 5K) Lunas via Mandiri VA"
  ];

  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % activities.length;
    ticker.style.opacity = '0';
    setTimeout(() => {
      ticker.textContent = activities[idx];
      ticker.style.opacity = '1';
    }, 400);
  }, 5000);
}
