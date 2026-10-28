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
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
    activeProvider: "SIMULASI_PROD",
    tripayApiKey: "",
    tripayPrivateKey: "",
    tripayMerchantCode: "",
    midtransServerKey: "",
    pakasirApiKey: ""
  }
};

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
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
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
  const products = readJsonFile(PRODUCTS_FILE, []);

  products.forEach(p => {
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

// Assign real stored CarX Street account to paid order
function assignAccountToOrder(productId, invoice, customerWhatsapp, platform, productName) {
  const accounts = readJsonFile(ACCOUNT_STOCK_FILE, []);
  const availableIndex = accounts.findIndex(a => a.packageId === productId && a.status === 'AVAILABLE');

  if (availableIndex !== -1) {
    const acc = accounts[availableIndex];
    acc.status = 'SOLD';
    acc.soldToInvoice = invoice;
    acc.soldToBuyer = customerWhatsapp;
    acc.soldAt = new Date().toISOString();
    writeJsonFile(ACCOUNT_STOCK_FILE, accounts);

    // Sync product stock
    syncProductStock();

    return {
      username: acc.email,
      password: acc.password,
      notes: acc.notes || "tinggal login di carx street ya bosku😇",
      instructions: `1. Buka game CarX Street di HP kamu.\n2. Masukkan Email dan Password di atas.\n3. Catatan Admin: ${acc.notes || 'tinggal login di carx street ya bosku😇'}`
    };
  }

  // Fallback if stock was empty
  const fallback = generateAccountCredentials(productName || 'CarX Street', platform || 'Universal', customerWhatsapp);
  fallback.notes = "tinggal login di carx street ya bosku😇";
  return fallback;
}

// Server Request Handler
const server = http.createServer(async (req, res) => {
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
    const orders = readJsonFile(ORDERS_FILE, []);
    const products = readJsonFile(PRODUCTS_FILE, []);
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

      if (!productId || !customerWhatsapp || !paymentMethod) {
        sendJson(res, 400, { success: false, message: 'Data pesanan tidak lengkap' });
        return;
      }

      const products = readJsonFile(PRODUCTS_FILE, []);
      const product = products.find(p => p.id === productId);

      if (!product) {
        sendJson(res, 404, { success: false, message: 'Produk paket CarX Street tidak ditemukan' });
        return;
      }

      // Check stock
      if (product.stock <= 0) {
        sendJson(res, 400, { success: false, message: 'Maaf, stok paket ini sedang habis!' });
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
    const invoice = parsedUrl.query.invoice;
    if (!invoice) {
      sendJson(res, 400, { success: false, message: 'Invoice harus dicantumkan' });
      return;
    }

    const orders = readJsonFile(ORDERS_FILE, []);
    const orderIndex = orders.findIndex(o => o.invoice.toUpperCase() === invoice.toUpperCase());

    if (orderIndex === -1) {
      sendJson(res, 404, { success: false, message: 'Invoice tidak ditemukan' });
      return;
    }

    const order = orders[orderIndex];

    // If still UNPAID and has Paymenku trx_id, check Paymenku live status
    if (order.status !== 'PAID' && order.paymentDetail && order.paymentDetail.trxId) {
      try {
        const checkRes = await fetch(`https://paymenku.com/pay/${order.paymentDetail.trxId}/status`);
        if (checkRes.ok) {
          const statusData = await checkRes.json();
          if (statusData && (statusData.status === 'paid' || statusData.status === 'success')) {
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
      } catch (err) {
        // Ignore network polling error
      }
    }

    sendJson(res, 200, { success: true, data: order });
    return;
  }

  // GET /api/buyer/orders?userId=...
  if (pathname === '/api/buyer/orders' && method === 'GET') {
    const userId = parsedUrl.query.userId;
    const userEmail = parsedUrl.query.email;

    const orders = readJsonFile(ORDERS_FILE, []);
    const userOrders = orders.filter(o => 
      (userId && o.buyerId === userId) ||
      (userEmail && o.customerEmail.toLowerCase() === userEmail.toLowerCase())
    );

    sendJson(res, 200, { success: true, data: userOrders });
    return;
  }

  // GET /api/order/track?query=...
  if (pathname === '/api/order/track' && method === 'GET') {
    const query = (parsedUrl.query.query || '').trim().toLowerCase();
    if (!query) {
      sendJson(res, 400, { success: false, message: 'Masukkan nomor WhatsApp atau No Invoice' });
      return;
    }

    const orders = readJsonFile(ORDERS_FILE, []);
    const matched = orders.filter(o => 
      o.invoice.toLowerCase() === query || 
      o.customerWhatsapp.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
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

  // POST /api/payment/webhook (Paymenku Webhook Callback)
  if (pathname === '/api/payment/webhook' && method === 'POST') {
    try {
      const body = await getRequestBody(req);
      console.log('--- Paymenku Webhook Received ---', JSON.stringify(body));

      const invoice = body.reference_id || body.reference || body.merchant_ref || body.order_id || body.invoice;
      const trxId = body.trx_id || body.id;
      const paymentStatus = (body.status || body.transaction_status || '').toLowerCase();

      const isPaid = paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'settlement' || paymentStatus === 'capture' || paymentStatus === 'completed';

      const orders = readJsonFile(ORDERS_FILE, []);
      const orderIndex = orders.findIndex(o => 
        (invoice && o.invoice.toUpperCase() === invoice.toUpperCase()) ||
        (trxId && o.paymentDetail && o.paymentDetail.trxId === trxId)
      );

      if (orderIndex !== -1 && isPaid && orders[orderIndex].status !== 'PAID') {
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

  const filePath = path.join(PUBLIC_DIR, safePath);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackPath, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 RIISTORE CarX Street Store running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👑 Admin Access: Email/User: admin | Password: admin123`);
  console.log(`=======================================================`);
});

module.exports = server;

