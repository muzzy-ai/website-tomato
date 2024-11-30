import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import './PlaceOrder.css';

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);

  const [data, setData] = useState({
    nama: '',
    email: '',
    alamat: '',
    hp: ''
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    // Filter item dari cart yang memiliki quantity lebih dari 0
    const orderItems = food_list
      .filter((item) => cartItems[item._id] > 0)
      .map((item) => ({
        ...item,
        quantity: cartItems[item._id]
      }));

    // Data untuk dikirim ke backend
    const orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 10000, // Total ditambah ongkos kirim (10.000)
    };

    try {
      // Request ke backend untuk membuat transaksi
      const response = await axios.post(`${url}/api/order/place`, orderData, {
        headers: { token }
      });

      if (response.data.success) {
        // Redirect ke URL pembayaran Midtrans
        const { session_url } = response.data;
        window.location.replace(session_url);
      } else {
        alert('Gagal membuat transaksi, coba lagi.');
      }
    } catch (error) {
      console.error('Error saat membuat transaksi:', error);
      alert('Terjadi kesalahan, silakan coba lagi.');
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Redirect ke halaman cart jika tidak ada token atau cart kosong
    if (!token) {
      navigate('/cart');
    } else if (getTotalCartAmount() === 0) {
      navigate('/cart');
    }
  }, [token, getTotalCartAmount, navigate]);

  return (
    <form onSubmit={placeOrder} className="place-order">
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <input required name="nama" onChange={onChangeHandler} value={data.nama} type="text" placeholder="Nama" />
        <input required name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder="Email" />
        <input required name="alamat" onChange={onChangeHandler} value={data.alamat} type="text" placeholder="Alamat" />
        <input required name="hp" onChange={onChangeHandler} value={data.hp} type="text" placeholder="No. Hp" />
      </div>
      <div className="cart-total">
        <h2>Cart Total</h2>
        <div>
          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>Rp.{getTotalCartAmount()}</p>
          </div>
          <hr />
          <div className="cart-total-details">
            <p>Ongkos Kirim</p>
            <p>Rp.{getTotalCartAmount() === 0 ? 0 : 10000}</p>
          </div>
          <hr />
          <div className="cart-total-details">
            <b>Total</b>
            <b>Rp.{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 10000}</b>
          </div>
        </div>
        <button type="submit">PROCEED TO PAYMENT</button>
      </div>
    </form>
  );
};

export default PlaceOrder;
