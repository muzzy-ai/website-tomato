import midtransClient from 'midtrans-client';
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import axios from 'axios'; // Pastikan Anda mengimpor axios jika menggunakan axios untuk HTTP request

const snap = new midtransClient.Snap({
  isProduction: false, // Pastikan ini false untuk mode sandbox
  serverKey: "SB-Mid-server-f8AwxImKyxuupzuKrYGycQLU", // Ganti dengan server key Anda
  clientKey: "SB-Mid-client-1RMpcVBKaS7Xr4U5", // Ganti dengan client key Anda
});

// Fungsi untuk placeOrder
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";

  try {
    // Simpan order baru di database
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });
    await newOrder.save();

    // Kosongkan data keranjang pengguna setelah order dibuat
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Menyiapkan item untuk Midtrans
    const line_items = req.body.items.map((item) => ({
      id: item._id,
      price: Math.round(item.price), // Harga dalam IDR
      quantity: item.quantity,
      name: item.name,
    }));

    // Menambahkan ongkos kirim
    line_items.push({
      id: "ongkir",
      price: 10000, // Ongkos kirim
      quantity: 1,
      name: "Ongkos Kirim",
    });

    // Menghitung total harga
    const gross_amount = line_items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Memastikan menggunakan Server Key yang benar (gunakan Server Key Anda)
    const serverKey = "SB-Mid-server-f8AwxImKyxuupzuKrYGycQLU"; // Ganti dengan Server Key yang sesuai
    const encodedAuth = Buffer.from(`${serverKey}:`).toString('base64');

    // Menggunakan axios untuk mengirim request
    const transaction = {
      transaction_details: {
        order_id: newOrder._id.toString(),
        gross_amount: gross_amount,
      },
      customer_details: {
        first_name: req.body.address.nama,
        email: req.body.address.email,
        phone: req.body.address.hp,
        address: req.body.address.alamat,
      },
      item_details: line_items,
      callbacks: {
        finish: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      },
    };

    // Kirim permintaan ke API Midtrans dengan axios
    const response = await axios.post(
      'https://app.sandbox.midtrans.com/snap/v1/transactions', // Pastikan menggunakan URL yang sesuai
      transaction,
      {
        headers: {
          'Authorization': `Basic ${encodedAuth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Response dari Midtrans akan berisi redirect_url untuk melanjutkan transaksi
    res.json({
      success: true,
      session_url: response.data.redirect_url, // URL untuk melanjutkan pembayaran
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error saat membuat transaksi" });
  }
};

// Fungsi untuk verifyOrder
const verifyOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    // Verifikasi status pembayaran di Midtrans
    const transactionStatus = await snap.transaction.status(orderId);

    if (transactionStatus.transaction_status === 'settlement') {
      // Pembayaran berhasil
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: 'Pembayaran berhasil' });
    } else if (
      transactionStatus.transaction_status === 'cancel' ||
      transactionStatus.transaction_status === 'expire'
    ) {
      // Pembayaran gagal atau kadaluarsa
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: 'Pembayaran gagal' });
    } else {
      res.json({ success: false, message: 'Pembayaran belum selesai' });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'Error verifying payment' });
  }
};

// Fungsi untuk userOrders
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Fungsi untuk listOrders (admin)
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Fungsi untuk updateStatus
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
