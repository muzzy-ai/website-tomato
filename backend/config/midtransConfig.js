const midtransClient = require('midtrans-client');

// Konfigurasi Midtrans
const snap = new midtransClient.Snap({
  isProduction: false, // Ubah ke true untuk production
  serverKey: process.env.MIDTRANS_SERVER_KEY, // Ambil Server Key dari .env
  clientKey: process.env.MIDTRANS_CLIENT_KEY, // Ambil Client Key dari .env
});

export default snap;
