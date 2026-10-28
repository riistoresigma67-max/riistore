/**
 * RIISTORE - Server Backend Node.js
 * Toko Akun CarX Street dengan Sistem Pembayaran QRIS Dinamis, Bank VA, & E-Wallet
 * Fitur: Buyer Authentication, Admin Dashboard (Stok & Monitoring), & Webhook
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem fallback
}

// In-memory fallback cache
const memoryCache = {};

// File Paths
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACCOUNT_STOCK_FILE = path.join(DATA_DIR, 'account_stock.json');

const defaultConfig = {
  storeName: "RIISTORE",
  tagline: "Pusat Jual Beli Akun CarX Street Terpercaya & Otomatis #1",
  adminWhatsapp: "6281234567890",
  paymentGateway: {
    activeProvider: "LIVE_QRIS",
    apiKey: "sk_live_d19aa0476d7bbb7bbca4d4f4699e85ce9561f867c7e44cf5",
    webhookSecret: "b7cbb6cc7582698603eabe480a1d256b010c76a7e433e4b7d864958ab53b6999"
  }
};

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
    stock: 0,
    description: "Paket paling terjangkau untuk langsung balap dengan Level 50 Max dan modal 3 Juta Silver & 3 Ribu Gold.",
    specs: [
      "Silver 3.000.000 (3M)",
      "Gold 3.000 (3K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
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
    stock: 0,
    description: "Pilihan favorit racer pemula! Level 50 dengan modal 5 Juta Silver dan 5 Ribu Gold untuk beli mobil impian.",
    specs: [
      "Silver 5.000.000 (5M)",
      "Gold 5.000 (5K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Garansi Akun Aman 100%"
    ]
  },
  {
    id: "paket-c",
    name: "PAKET C - CarX Street",
    category: "paket-c",
    badge: "BEST VALUE 15K",
    badgeColor: "purple",
    platform: "Universal",
    price: 15000,
    originalPrice: 30000,
    discount: "50%",
    image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
    stock: 0,
    description: "Paket rekomendasi value terbaik! Modal melimpah 8 Juta Silver dan 8 Ribu Gold dengan semua map unlocked.",
    specs: [
      "Silver 8.000.000 (8M)",
      "Gold 8.000 (8K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Garansi Akun Aman 100%"
    ]
  },
  {
    id: "paket-d",
    name: "PAKET D - CarX Street",
    category: "paket-d",
    badge: "SUPER PRO 20K",
    badgeColor: "red",
    platform: "Universal",
    price: 20000,
    originalPrice: 40000,
    discount: "50%",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80",
    stock: 0,
    description: "Paket Pro dengan modal besar 12 Juta Silver dan 12 Ribu Gold. Bebas modifikasi mesin dan bodykit sepuasnya.",
    specs: [
      "Silver 12.000.000 (12M)",
      "Gold 12.000 (12K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Garansi Akun Aman 100%"
    ]
  },
  {
    id: "paket-e",
    name: "PAKET E - Sultan 36 Mobil & Aksesoris",
    category: "paket-e",
    badge: "SULTAN 36 MOBIL",
    badgeColor: "gold",
    platform: "Universal",
    price: 50000,
    originalPrice: 99000,
    discount: "49%",
    image: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=800&q=80",
    stock: 0,
    description: "PAKET TERTINGGI & PALING LENGKAP! Dapat 36 Mobil siap balap/drift + Aksesoris Terbuka + Uang 12M & Gold 12K.",
    specs: [
      "Silver 12.000.000 (12M)",
      "Gold 12.000 (12K)",
      "Level Akun 50 (Maksimal)",
      "Semua Map Sunset City Terbuka",
      "Termasuk 36 Mobil Siap Balap & Drift",
      "Semua Bodykit & Aksesoris Unlocked",
      "Garansi Akun Anti Banned 100%"
    ]
  }
];

const defaultAdminUser = [
  {
    id: "user-admin-01",
    username: "admin",
    email: "admin",
    password: "admin123",
    role: "admin",
    whatsapp: "6281234567890",
    createdAt: new Date().toISOString()
  }
];

function readJsonFile(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // ignore read error
  }

  if (memoryCache[filePath]) {
    return memoryCache[filePath];
  }

  // Fallback defaults
  if (filePath.includes('products.json')) return defaultProducts;
  if (filePath.includes('config.json')) return defaultConfig;
  if (filePath.includes('users.json')) return defaultAdminUser;

  try {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  } catch (e) {
    // Safe memory cache
  }
  memoryCache[filePath] = defaultValue;
  return defaultValue;
}

function writeJsonFile(filePath, data) {
  memoryCache[filePath] = data;
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    // Ignore read-only write failures safely
  }
}

// MIME types dictionary for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function getRequestBody(req) {
  // Dukung Vercel Serverless Function di mana req.body sudah diparse otomatis
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (err) {
        return Promise.resolve({});
      }
    }
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

// Sync products stock with available physical accounts
function syncProductStock() {
  const accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);
  let products = readJsonFile(PRODUCTS_FILE, defaultProducts);

  products.forEach(p => {
    // Strictly count how many AVAILABLE accounts are ready in database for this package
    const availableCount = accounts.filter(a => a.packageId === p.id && a.status === 'AVAILABLE').length;
    p.stock = availableCount;
  });

  writeJsonFile(PRODUCTS_FILE, products);
}

// Generate fallback dynamic credential delivery for CarX Street
function generateAccountCredentials(productName, platform, customerWhatsapp) {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const passSuffix = Math.floor(100000 + Math.random() * 900000);
  
  return {
    username: `riistore.cxs.${randomSuffix}@gmail.com`,
    password: `StreetRii*${passSuffix}`,
    notes: "tinggal login di carx street ya bosku😇",
    instructions: "1. Buka game CarX Street di HP kamu.\n2. Masukkan Email dan Password di atas.\n3. Catatan Admin: tinggal login di carx street ya bosku😇"
  };
}

// Assign real stored CarX Street account to paid order & decrement stock automatically
function assignAccountToOrder(productId, invoice, customerWhatsapp, platform, productName) {
  const accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);
  const products = readJsonFile(PRODUCTS_FILE, defaultProducts);
  const pIndex = products.findIndex(p => p.id === productId);

  const availableIndex = accounts.findIndex(a => a.packageId === productId && a.status === 'AVAILABLE');

  let delivered = null;

  if (availableIndex !== -1) {
    const acc = accounts[availableIndex];
    acc.status = 'SOLD';
    acc.soldToInvoice = invoice;
    acc.soldToBuyer = customerWhatsapp;
    acc.soldAt = new Date().toISOString();
    writeJsonFile(ACCOUNT_STOCK_FILE, accounts);

    // Sync product stock to remaining available physical accounts
    syncProductStock();

    delivered = {
      username: acc.email,
      password: acc.password,
      notes: acc.notes || "tinggal login di carx street ya bosku😇",
      instructions: `1. Buka game CarX Street di HP kamu.\n2. Masukkan Email dan Password di atas.\n3. Catatan Admin: ${acc.notes || 'tinggal login di carx street ya bosku😇'}`
    };
  } else {
    // If physical stock was not inputted, decrement manual numeric stock by 1
    if (pIndex !== -1) {
      products[pIndex].stock = Math.max(0, (products[pIndex].stock || 0) - 1);
      writeJsonFile(PRODUCTS_FILE, products);
    }

    const fallback = generateAccountCredentials(productName || 'CarX Street', platform || 'Universal', customerWhatsapp);
    fallback.notes = "tinggal login di carx street ya bosku😇";
    delivered = fallback;
  }

  return delivered;
}

// Server Request Handler Function
const requestHandler = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Ensure default admin exists
  const users = readJsonFile(USERS_FILE, defaultAdminUser);
  if (!users.some(u => u.username === 'admin')) {
    users.unshift(defaultAdminUser[0]);
    writeJsonFile(USERS_FILE, users);
  }

  // ==========================================
  // 1. AUTHENTICATION API (REGISTER & LOGIN)
  // ==========================================

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const { username, email, password, whatsapp } = await getRequestBody(req);

      if (!username || !email || !password) {
        sendJson(res, 400, { success: false, message: 'Username, Email, dan Password wajib diisi!' });
        return;
      }

      if (username.length < 3) {
        sendJson(res, 400, { success: false, message: 'Username minimal 3 karakter!' });
        return;
      }

      if (password.length < 5) {
        sendJson(res, 400, { success: false, message: 'Password minimal 5 karakter!' });
        return;
      }

      const usersList = readJsonFile(USERS_FILE, defaultAdminUser);
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim().toLowerCase();

      // Check duplicate
      const exists = usersList.find(u => 
        u.email.toLowerCase() === normalizedEmail || 
        u.username.toLowerCase() === normalizedUsername
      );

      if (exists) {
        sendJson(res, 400, { success: false, message: 'Username atau Email sudah terdaftar!' });
        return;
      }

      const newUser = {
        id: `user-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        username: username.trim(),
        email: email.trim(),
        password: password,
        whatsapp: whatsapp ? whatsapp.trim() : '',
        role: "buyer",
        createdAt: new Date().toISOString()
      };

      usersList.push(newUser);
      writeJsonFile(USERS_FILE, usersList);

      const safeUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        whatsapp: newUser.whatsapp,
        role: newUser.role
      };

      sendJson(res, 201, {
        success: true,
        message: 'Registrasi akun berhasil! Selamat datang di RIISTORE.',
        user: safeUser
      });
    } catch (err) {
      sendJson(res, 500, { success: false, message: 'Gagal mendaftar: ' + err.message });
    }
    return;
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const { email, password } = await getRequestBody(req);

      if (!email || !password) {
        sendJson(res, 400, { success: false, message: 'Email/Username dan Password harus diisi!' });
        return;
      }

      const usersList = readJsonFile(USERS_FILE, defaultAdminUser);
      const query = email.trim().toLowerCase();

      // Support special admin login: email='admin' & password='admin123'
      const user = usersList.find(u => 
        (u.email.toLowerCase() === query || u.username.toLowerCase() === query) &&
        u.password === password
      );

      if (!user) {
        sendJson(res, 401, { success: false, message: 'Email/Username atau Password salah!' });
        return;
      }

      const safeUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        whatsapp: user.whatsapp || '',
        role: user.role
      };

      sendJson(res, 200, {
        success: true,
        message: user.role === 'admin' ? 'Selamat datang Admin RIISTORE!' : 'Login berhasil!',
        user: safeUser
      });
    } catch (err) {
      sendJson(res, 500, { success: false, message: 'Gagal login: ' + err.message });
    }
    return;
  }

  // ==========================================
  // 2. ADMIN DASHBOARD & STOCK MANAGEMENT
  // ==========================================

  // GET /api/admin/dashboard
  if (pathname === '/api/admin/dashboard' && method === 'GET') {
    syncProductStock();
    const orders = readJsonFile(ORDERS_FILE, []);
    const products = readJsonFile(PRODUCTS_FILE, defaultProducts);
    const usersList = readJsonFile(USERS_FILE, defaultAdminUser);

    const paidOrders = orders.filter(o => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.totalPayment || curr.price || 0), 0);
    const buyers = usersList.filter(u => u.role === 'buyer');

    const totalStock = products.reduce((acc, curr) => acc + (parseInt(curr.stock, 10) || 0), 0);

    sendJson(res, 200, {
      success: true,
      data: {
        totalRevenue,
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        pendingOrdersCount: orders.filter(o => o.status === 'UNPAID').length,
        totalBuyers: buyers.length,
        totalStock,
        products,
        recentOrders: orders.slice(0, 15),
        buyersList: buyers.map(b => ({
          id: b.id,
          username: b.username,
          email: b.email,
          whatsapp: b.whatsapp,
          createdAt: b.createdAt,
          orderCount: orders.filter(o => o.buyerId === b.id || o.customerEmail === b.email).length
        }))
      }
    });
    return;
  }

  // POST /api/admin/stock/update (Update stock and price for a product)
  if (pathname === '/api/admin/stock/update' && method === 'POST') {
    try {
      const { productId, stock, price } = await getRequestBody(req);

      if (!productId) {
        sendJson(res, 400, { success: false, message: 'Product ID wajib disertakan!' });
        return;
      }

      const products = readJsonFile(PRODUCTS_FILE, []);
      const pIndex = products.findIndex(p => p.id === productId);

      if (pIndex === -1) {
        sendJson(res, 404, { success: false, message: 'Paket tidak ditemukan!' });
        return;
      }

      if (stock !== undefined) {
        products[pIndex].stock = Math.max(0, parseInt(stock, 10) || 0);
        // Jika stok dikosongkan ke 0, hapus juga akun status AVAILABLE untuk paket ini agar sinkron 100%
        if (products[pIndex].stock === 0) {
          let accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);
          accounts = accounts.filter(a => !(a.packageId === productId && a.status === 'AVAILABLE'));
          writeJsonFile(ACCOUNT_STOCK_FILE, accounts);
        }
      }
      if (price !== undefined) {
        products[pIndex].price = Math.max(1000, parseInt(price, 10) || products[pIndex].price);
      }

      writeJsonFile(PRODUCTS_FILE, products);

      sendJson(res, 200, {
        success: true,
        message: `Stok ${products[pIndex].name} berhasil diperbarui menjadi ${products[pIndex].stock} unit!`,
        data: products[pIndex]
      });
    } catch (err) {
      sendJson(res, 500, { success: false, message: 'Gagal update stok: ' + err.message });
    }
    return;
  }

  // POST /api/admin/order/update-status
  if (pathname === '/api/admin/order/update-status' && method === 'POST') {
    try {
      const { invoice, status } = await getRequestBody(req);
      const orders = readJsonFile(ORDERS_FILE, []);
      const oIndex = orders.findIndex(o => o.invoice === invoice);

      if (oIndex === -1) {
        sendJson(res, 404, { success: false, message: 'Pesanan tidak ditemukan' });
        return;
      }

      orders[oIndex].status = status;
      if (status === 'PAID' && !orders[oIndex].accountDetails) {
        orders[oIndex].paidAt = new Date().toISOString();
        orders[oIndex].accountDetails = assignAccountToOrder(
          orders[oIndex].productId,
          orders[oIndex].invoice,
          orders[oIndex].customerWhatsapp,
          orders[oIndex].platform,
          orders[oIndex].productName
        );
      }

      writeJsonFile(ORDERS_FILE, orders);
      sendJson(res, 200, { success: true, message: `Status invoice ${invoice} diubah ke ${status}`, data: orders[oIndex] });
    } catch (err) {
      sendJson(res, 500, { success: false, message: err.message });
    }
    return;
  }

  // GET /api/admin/accounts (Get list of all accounts: available and sold)
  if (pathname === '/api/admin/accounts' && method === 'GET') {
    const accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);
    sendJson(res, 200, { success: true, data: accounts });
    return;
  }

  // POST /api/admin/account/add (Add actual CarX Street email & password to stock)
  if (pathname === '/api/admin/account/add' && method === 'POST') {
    try {
      const { packageId, email, password, platform, notes } = await getRequestBody(req);

      if (!packageId || !email || !password) {
        sendJson(res, 400, { success: false, message: 'Paket, Email Akun, dan Password Akun wajib diisi!' });
        return;
      }

      const products = readJsonFile(PRODUCTS_FILE, []);
      const prod = products.find(p => p.id === packageId);
      const accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);

      const newAcc = {
        id: `acc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        packageId,
        packageName: prod ? prod.name : packageId,
        email: email.trim(),
        password: password.trim(),
        platform: platform || 'Android',
        notes: (notes && notes.trim()) ? notes.trim() : "tinggal login di carx street ya bosku😇",
        status: "AVAILABLE",
        soldToInvoice: null,
        soldToBuyer: null,
        createdAt: new Date().toISOString()
      };

      accounts.unshift(newAcc);
      writeJsonFile(ACCOUNT_STOCK_FILE, accounts);

      syncProductStock();

      sendJson(res, 201, {
        success: true,
        message: `Akun CarX Street berhasil ditambahkan ke stok ${newAcc.packageName}!`,
        data: newAcc
      });
    } catch (err) {
      sendJson(res, 500, { success: false, message: err.message });
    }
    return;
  }

  // POST /api/admin/account/delete (Delete an unsold account)
  if (pathname === '/api/admin/account/delete' && method === 'POST') {
    try {
      const { id } = await getRequestBody(req);
      let accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);
      const acc = accounts.find(a => a.id === id);

      if (!acc) {
        sendJson(res, 404, { success: false, message: 'Akun tidak ditemukan' });
        return;
      }

      accounts = accounts.filter(a => a.id !== id);
      writeJsonFile(ACCOUNT_STOCK_FILE, accounts);
      syncProductStock();

      sendJson(res, 200, { success: true, message: 'Akun berhasil dihapus dari stok' });
    } catch (err) {
      sendJson(res, 500, { success: false, message: err.message });
    }
    return;
  }

  // ==========================================
  // 3. STORE CONFIG & PRODUCTS
  // ==========================================

  // GET /api/config
  if (pathname === '/api/config' && method === 'GET') {
    const config = readJsonFile(CONFIG_FILE, defaultConfig);
    const safeConfig = {
      storeName: config.storeName,
      tagline: config.tagline,
      adminWhatsapp: config.adminWhatsapp,
      paymentMode: config.paymentGateway.activeProvider
    };
    sendJson(res, 200, { success: true, data: safeConfig });
    return;
  }

  // POST /api/config (Admin update settings)
  if (pathname === '/api/config' && method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const config = readJsonFile(CONFIG_FILE, defaultConfig);
      if (body.adminWhatsapp) config.adminWhatsapp = body.adminWhatsapp.trim();
      if (body.storeName) config.storeName = body.storeName.trim();
      writeJsonFile(CONFIG_FILE, config);
      sendJson(res, 200, { success: true, message: 'Pengaturan toko berhasil disimpan' });
    } catch (e) {
      sendJson(res, 500, { success: false, message: e.message });
    }
    return;
  }

  // GET /api/products
  if (pathname === '/api/products' && method === 'GET') {
    syncProductStock();
    const products = readJsonFile(PRODUCTS_FILE, []);
    sendJson(res, 200, { success: true, data: products });
    return;
  }

  // ==========================================
  // 4. ORDER MANAGEMENT & CREATION
  // ==========================================

  // POST /api/order/create
  if (pathname === '/api/order/create' && method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const { productId, customerWhatsapp, customerEmail, platform, paymentMethod, buyerId, buyerUsername } = body;

      if (!productId || !paymentMethod) {
        sendJson(res, 400, { success: false, message: 'Data pesanan tidak lengkap (pilih paket & metode bayar)' });
        return;
      }

      const products = readJsonFile(PRODUCTS_FILE, []);
      const product = products.find(p => p.id === productId);

      if (!product) {
        sendJson(res, 404, { success: false, message: 'Produk paket CarX Street tidak ditemukan' });
        return;
      }

      // Check stock strictly against ready physical accounts
      const accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);
      const availableAccs = accounts.filter(a => a.packageId === productId && a.status === 'AVAILABLE');
      if (availableAccs.length === 0) {
        sendJson(res, 400, { success: false, message: 'Maaf bosku, stok akun CarX Street paket ini sedang HABIS! Silakan tunggu admin restock.' });
        return;
      }

      // Generate Unique Invoice number: RII-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const invoice = `RII-${dateStr}-${randomCode}`;

      const uniqueCode = Math.floor(10 + Math.random() * 890);
      const totalPayment = product.price + (paymentMethod === 'BANK_TRANSFER' ? uniqueCode : 0);

      let paymentDetail = {};
      const expiredAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      if (paymentMethod === 'QRIS') {
        const config = readJsonFile(CONFIG_FILE, defaultConfig);
        let qrisString = `00020101021226680016ID.CO.RIISTORE.WWW01189360000201100000000215${invoice}51450015ID.OR.GPNQRIS0102000203000520458125303360540${totalPayment}5802ID5912RIISTORE CARX6007JAKARTA62070703A016304B76C`;
        let qrisUrl = '';
        let trxId = '';
        let payUrl = '';
        let merchantName = 'Paymenku';

        // Call Paymenku API Live to generate official Dynamic QRIS
        if (config.paymentGateway && config.paymentGateway.apiKey) {
          try {
            const paymenkuRes = await fetch('https://paymenku.com/api/v1/transaction/create', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.paymentGateway.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                channel_code: 'qris',
                amount: totalPayment,
                reference_id: invoice,
                customer_name: buyerUsername || 'Buyer RIISTORE',
                customer_email: (customerEmail && customerEmail !== '-') ? customerEmail : 'buyer@riistore.com',
                return_url: 'http://localhost:3000'
              })
            });

            const paymenkuData = await paymenkuRes.json();
            if (paymenkuData.status === 'success' && paymenkuData.data) {
              trxId = paymenkuData.data.trx_id;
              payUrl = paymenkuData.data.pay_url;
              if (paymenkuData.data.payment_info) {
                qrisString = paymenkuData.data.payment_info.qr_string || qrisString;
                qrisUrl = paymenkuData.data.payment_info.qr_url || '';
                merchantName = paymenkuData.data.payment_info.merchant_name || 'Paymenku';
              }
              console.log(`[Paymenku Live QRIS Success] Invoice: ${invoice}, TrxID: ${trxId}`);
            } else {
              console.error('Paymenku API response:', paymenkuData);
            }
          } catch (apiErr) {
            console.error('Paymenku API call error:', apiErr.message);
          }
        }

        paymentDetail = {
          type: 'QRIS',
          gateway: 'PAYMENKU',
          trxId: trxId,
          payUrl: payUrl,
          title: 'QRIS Dinamis Asli (Semua Bank & E-Wallet)',
          subTitle: 'Scan menggunakan DANA, GoPay, OVO, ShopeePay, BCA, BRI, Mandiri, dll.',
          qrString: qrisString,
          qrUrl: qrisUrl,
          merchantName: merchantName,
          fee: 0
        };
      } else if (paymentMethod.startsWith('VA_')) {
        const bankName = paymentMethod.replace('VA_', '');
        const vaPrefix = {
          'BCA': '70001',
          'BRI': '88880',
          'MANDIRI': '89508',
          'BNI': '98801'
        }[bankName] || '88001';

        const vaNumber = `${vaPrefix}${customerWhatsapp.replace(/\D/g, '').slice(-7)}${randomCode.toString().slice(-3)}`;

        paymentDetail = {
          type: 'VIRTUAL_ACCOUNT',
          bank: bankName,
          title: `${bankName} Virtual Account`,
          vaNumber: vaNumber,
          fee: 1000
        };
      } else {
        const ewalletName = paymentMethod.replace('EWALLET_', '');
        paymentDetail = {
          type: 'EWALLET',
          wallet: ewalletName,
          title: `E-Wallet ${ewalletName} Instan`,
          payUrl: `https://riistore.com/pay/${ewalletName.toLowerCase()}?invoice=${invoice}`,
          qrString: `00020101021226680016ID.CO.RIISTORE.WWW01189360000201100000000215${invoice}51450015ID.OR.GPNQRIS0102000203000520458125303360540${totalPayment}5802ID5912RIISTORE CARX6007JAKARTA62070703A016304B76C`,
          fee: 500
        };
      }

      const newOrder = {
        invoice,
        productId: product.id,
        productName: product.name,
        price: product.price,
        uniqueCode,
        totalPayment,
        paymentMethod,
        paymentDetail,
        customerWhatsapp,
        customerEmail: customerEmail || '-',
        buyerId: buyerId || 'guest',
        buyerUsername: buyerUsername || 'Pembeli',
        platform: platform || 'Android',
        status: 'UNPAID',
        createdAt: new Date().toISOString(),
        expiredAt,
        paidAt: null,
        accountDetails: null
      };

      const orders = readJsonFile(ORDERS_FILE, []);
      orders.unshift(newOrder);
      writeJsonFile(ORDERS_FILE, orders);

      sendJson(res, 201, {
        success: true,
        message: 'Pesanan berhasil dibuat',
        data: newOrder
      });
    } catch (err) {
      console.error('Order creation error:', err);
      sendJson(res, 500, { success: false, message: 'Gagal memproses pesanan: ' + err.message });
    }
    return;
  }

  // GET /api/order/status?invoice=...
  if (pathname === '/api/order/status' && method === 'GET') {
    const invoice = (parsedUrl.query.invoice || '').trim();
    if (!invoice) {
      sendJson(res, 400, { success: false, message: 'Invoice harus dicantumkan' });
      return;
    }

    const config = readJsonFile(CONFIG_FILE, defaultConfig);
    const apiKey = (config.paymentGateway && config.paymentGateway.apiKey) || 'sk_live_d19aa0476d7bbb7bbca4d4f4699e85ce9561f867c7e44cf5';

    const orders = readJsonFile(ORDERS_FILE, []);
    let orderIndex = orders.findIndex(o => o.invoice.toUpperCase() === invoice.toUpperCase());

    // If order not found in local memory/file (e.g. across Vercel instances or server restart)
    if (orderIndex === -1 && apiKey) {
      try {
        const pRes = await fetch(`https://paymenku.com/api/v1/transactions?reference_id=${encodeURIComponent(invoice)}`, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.status === 'success' && Array.isArray(pData.data) && pData.data.length > 0) {
            const trx = pData.data[0];
            const products = readJsonFile(PRODUCTS_FILE, defaultProducts);
            const trxAmount = Math.round(Number(trx.amount) || 0);
            const matchedProduct = products.find(p => p.price === trxAmount) || products[0];
            const st = (trx.status || '').toLowerCase();
            const isTrxPaid = st === 'paid' || st === 'success' || st === 'settlement' || st === 'completed';

            const reconstructed = {
              invoice: invoice,
              productId: matchedProduct.id,
              productName: matchedProduct.name,
              price: matchedProduct.price,
              uniqueCode: 0,
              totalPayment: trxAmount || matchedProduct.price,
              paymentMethod: 'QRIS',
              paymentDetail: {
                type: 'QRIS',
                gateway: 'PAYMENKU',
                trxId: trx.trx_id,
                payUrl: trx.pay_url || `https://paymenku.com/pay/${trx.trx_id}`,
                title: 'QRIS Dinamis Asli (Semua Bank & E-Wallet)',
                subTitle: 'Scan menggunakan DANA, GoPay, OVO, ShopeePay, BCA, BRI, Mandiri, dll.',
                fee: 0
              },
              customerWhatsapp: trx.customer_email || 'Buyer',
              customerEmail: trx.customer_email || '-',
              buyerId: trx.customer_name || 'guest',
              buyerUsername: trx.customer_name || 'Pembeli',
              platform: 'Android & iOS',
              status: isTrxPaid ? 'PAID' : 'UNPAID',
              createdAt: trx.created_at || new Date().toISOString(),
              expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              paidAt: isTrxPaid ? (trx.paid_at || new Date().toISOString()) : null,
              accountDetails: isTrxPaid ? assignAccountToOrder(matchedProduct.id, invoice, trx.customer_email || 'Buyer', 'Android', matchedProduct.name) : null
            };

            orders.unshift(reconstructed);
            writeJsonFile(ORDERS_FILE, orders);
            orderIndex = 0;
            console.log(`[Paymenku Auto-Sync] Reconstructed invoice ${invoice} from Paymenku API. Status: ${reconstructed.status}`);
          }
        }
      } catch (err) {
        console.error('Failed to query Paymenku for missing invoice:', err.message);
      }
    }

    if (orderIndex === -1) {
      sendJson(res, 404, { success: false, message: 'Invoice tidak ditemukan' });
      return;
    }

    const order = orders[orderIndex];

    // If still UNPAID, check Paymenku live status with 3 robust fallbacks
    if (order.status !== 'PAID') {
      let isConfirmedPaid = false;
      const trxId = order.paymentDetail && order.paymentDetail.trxId;

      // Check 1: Direct Paymenku public status endpoint
      if (trxId) {
        try {
          const checkRes = await fetch(`https://paymenku.com/pay/${trxId}/status`);
          if (checkRes.ok) {
            const sData = await checkRes.json();
            const st = (sData.status || '').toLowerCase();
            if (st === 'paid' || st === 'success' || st === 'settlement' || st === 'completed') {
              isConfirmedPaid = true;
            }
          }
        } catch (e) {}
      }

      // Check 2: Paymenku authenticated transactions list by reference_id (Invoice)
      if (!isConfirmedPaid && apiKey) {
        try {
          const checkRes = await fetch(`https://paymenku.com/api/v1/transactions?reference_id=${encodeURIComponent(order.invoice)}`, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
          });
          if (checkRes.ok) {
            const sData = await checkRes.json();
            if (sData.status === 'success' && Array.isArray(sData.data) && sData.data.length > 0) {
              const st = (sData.data[0].status || '').toLowerCase();
              if (st === 'paid' || st === 'success' || st === 'settlement' || st === 'completed') {
                isConfirmedPaid = true;
                if (!order.paymentDetail.trxId && sData.data[0].trx_id) {
                  order.paymentDetail.trxId = sData.data[0].trx_id;
                }
              }
            }
          }
        } catch (e) {}
      }

      // Check 3: Paymenku authenticated transactions list by trx_id
      if (!isConfirmedPaid && trxId && apiKey) {
        try {
          const checkRes = await fetch(`https://paymenku.com/api/v1/transactions?trx_id=${encodeURIComponent(trxId)}`, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
          });
          if (checkRes.ok) {
            const sData = await checkRes.json();
            if (sData.status === 'success' && Array.isArray(sData.data) && sData.data.length > 0) {
              const st = (sData.data[0].status || '').toLowerCase();
              if (st === 'paid' || st === 'success' || st === 'settlement' || st === 'completed') {
                isConfirmedPaid = true;
              }
            }
          }
        } catch (e) {}
      }

      if (isConfirmedPaid) {
        order.status = 'PAID';
        order.paidAt = new Date().toISOString();
        order.accountDetails = assignAccountToOrder(
          order.productId,
          order.invoice,
          order.customerWhatsapp,
          order.platform,
          order.productName
        );
        orders[orderIndex] = order;
        writeJsonFile(ORDERS_FILE, orders);
        console.log(`[Paymenku Polling Auto-Detect] Invoice ${order.invoice} LUNAS! Akun CarX Street terkirim.`);
      }
    }

    sendJson(res, 200, { success: true, data: order });
    return;
  }

  // GET /api/buyer/orders?userId=...&email=...&username=...&whatsapp=...&invoices=...
  if (pathname === '/api/buyer/orders' && method === 'GET') {
    const userId = (parsedUrl.query.userId || '').trim().toLowerCase();
    const userEmail = (parsedUrl.query.email || '').trim().toLowerCase();
    const username = (parsedUrl.query.username || '').trim().toLowerCase();
    const userWa = (parsedUrl.query.whatsapp || '').replace(/\D/g, '');
    const userRole = (parsedUrl.query.role || '').trim().toLowerCase();
    const requestedInvoices = (parsedUrl.query.invoices || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    const orders = readJsonFile(ORDERS_FILE, []);

    let matched = [];
    if (userRole === 'admin') {
      matched = orders;
    } else {
      matched = orders.filter(o => {
        const oInvoice = (o.invoice || '').toUpperCase();
        if (requestedInvoices.includes(oInvoice)) return true;

        const oBuyerId = (o.buyerId || '').toLowerCase();
        if (userId && (oBuyerId === userId || oBuyerId === username || oBuyerId === userEmail)) return true;

        const oBuyerUsername = (o.buyerUsername || '').toLowerCase();
        if (username && (oBuyerUsername === username || oBuyerUsername === userId)) return true;

        const oEmail = (o.customerEmail || '').toLowerCase();
        if (userEmail && (oEmail === userEmail || oBuyerId === userEmail || oEmail.includes(userEmail) || userEmail.includes(oEmail))) return true;

        const oWa = (o.customerWhatsapp || '').replace(/\D/g, '');
        if (userWa && oWa && (oWa.includes(userWa) || userWa.includes(oWa))) return true;

        const oWaRaw = (o.customerWhatsapp || '').toLowerCase();
        if (userEmail && oWaRaw === userEmail) return true;
        if (username && oWaRaw === username) return true;

        return false;
      });
    }

    sendJson(res, 200, { success: true, data: matched });
    return;
  }

  // GET /api/order/track?query=...
  if (pathname === '/api/order/track' && method === 'GET') {
    const query = (parsedUrl.query.query || '').trim().toLowerCase();
    if (!query) {
      sendJson(res, 400, { success: false, message: 'Masukkan nomor WhatsApp, Email, atau No Invoice' });
      return;
    }

    const orders = readJsonFile(ORDERS_FILE, []);
    const matched = orders.filter(o => 
      (o.invoice && o.invoice.toLowerCase() === query) || 
      (o.customerEmail && o.customerEmail.toLowerCase().includes(query)) ||
      (o.customerWhatsapp && (
        o.customerWhatsapp.toLowerCase().includes(query) ||
        o.customerWhatsapp.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      ))
    );

    sendJson(res, 200, { success: true, data: matched });
    return;
  }

  // POST /api/payment/simulate-pay
  if (pathname === '/api/payment/simulate-pay' && method === 'POST') {
    try {
      const body = await getRequestBody(req);
      const { invoice } = body;

      const orders = readJsonFile(ORDERS_FILE, []);
      const orderIndex = orders.findIndex(o => o.invoice === invoice);

      if (orderIndex === -1) {
        sendJson(res, 404, { success: false, message: 'Pesanan tidak ditemukan' });
        return;
      }

      const order = orders[orderIndex];
      if (order.status === 'PAID') {
        sendJson(res, 200, { success: true, message: 'Pesanan sudah berstatus lunas sebelumnya', data: order });
        return;
      }

      // Mark as PAID and assign real or generated credentials
      order.status = 'PAID';
      order.paidAt = new Date().toISOString();
      order.accountDetails = assignAccountToOrder(order.productId, order.invoice, order.customerWhatsapp, order.platform, order.productName);

      orders[orderIndex] = order;
      writeJsonFile(ORDERS_FILE, orders);

      sendJson(res, 200, {
        success: true,
        message: 'Pembayaran berhasil dikonfirmasi secara otomatis!',
        data: order
      });
    } catch (err) {
      sendJson(res, 500, { success: false, message: err.message });
    }
    return;
  }

  // POST/GET /api/payment/webhook (Paymenku Webhook Callback)
  if (pathname === '/api/payment/webhook' && (method === 'POST' || method === 'GET')) {
    try {
      const body = method === 'POST' ? await getRequestBody(req) : parsedUrl.query;
      console.log('--- Paymenku Webhook Received ---', JSON.stringify(body));

      const invoice = body.reference_id || body.reference || body.merchant_ref || body.order_id || body.invoice;
      const trxId = body.trx_id || body.id;
      const paymentStatus = (body.status || body.transaction_status || '').toLowerCase();

      const isPaid = paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'settlement' || paymentStatus === 'capture' || paymentStatus === 'completed';

      const orders = readJsonFile(ORDERS_FILE, []);
      let orderIndex = orders.findIndex(o => 
        (invoice && o.invoice.toUpperCase() === invoice.toUpperCase()) ||
        (trxId && o.paymentDetail && o.paymentDetail.trxId === trxId)
      );

      if (orderIndex === -1 && invoice && isPaid) {
        const products = readJsonFile(PRODUCTS_FILE, defaultProducts);
        const amount = Math.round(Number(body.amount) || 0);
        const matchedProduct = products.find(p => p.price === amount) || products[0];

        const reconstructed = {
          invoice: invoice,
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          price: matchedProduct.price,
          uniqueCode: 0,
          totalPayment: amount || matchedProduct.price,
          paymentMethod: 'QRIS',
          paymentDetail: {
            type: 'QRIS',
            gateway: 'PAYMENKU',
            trxId: trxId || '',
            fee: 0
          },
          customerWhatsapp: body.customer_email || body.customer_phone || 'Buyer',
          customerEmail: body.customer_email || '-',
          buyerId: body.customer_name || 'guest',
          buyerUsername: body.customer_name || 'Pembeli',
          platform: 'Android & iOS',
          status: 'PAID',
          createdAt: new Date().toISOString(),
          expiredAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          paidAt: new Date().toISOString(),
          accountDetails: assignAccountToOrder(matchedProduct.id, invoice, body.customer_email || 'Buyer', 'Android', matchedProduct.name)
        };
        orders.unshift(reconstructed);
        writeJsonFile(ORDERS_FILE, orders);
        console.log(`[Paymenku Webhook Auto-Create] Invoice ${invoice} LUNAS via Webhook!`);
      } else if (orderIndex !== -1 && isPaid && orders[orderIndex].status !== 'PAID') {
        orders[orderIndex].status = 'PAID';
        orders[orderIndex].paidAt = new Date().toISOString();
        orders[orderIndex].accountDetails = assignAccountToOrder(
          orders[orderIndex].productId,
          orders[orderIndex].invoice,
          orders[orderIndex].customerWhatsapp,
          orders[orderIndex].platform,
          orders[orderIndex].productName
        );

        writeJsonFile(ORDERS_FILE, orders);
        console.log(`[Paymenku Webhook Success] Invoice ${orders[orderIndex].invoice} otomatis di-update ke PAID.`);
      }

      sendJson(res, 200, { success: true, message: 'Webhook processed successfully' });
    } catch (err) {
      console.error('Webhook error:', err);
      sendJson(res, 500, { success: false, message: 'Webhook error: ' + err.message });
    }
    return;
  }

  // --- STATIC FILE SERVING ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let filePath = path.join(PUBLIC_DIR, safePath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, safePath);
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'text/html; charset=utf-8';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
};

const server = http.createServer(requestHandler);

if (require.main === module && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 RIISTORE CarX Street Store running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👑 Admin Access: Email/User: admin | Password: admin123`);
    console.log(`=======================================================`);
  });
}

module.exports = requestHandler;


