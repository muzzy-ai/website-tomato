import React from 'react'
import { useContext } from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { StoreContext } from '../../context/StoreContext'
import './MyOrders.css'
import axios from "axios";

const MyOrders = () => {

    const {url,token} = useContext(StoreContext);
    const [data,setData] = useState([]);

    const fetchOrders = async () => {
        const response = await axios.post(url+"/api/order/userorders",{},{headers:{token}});
        setData(response.data.data);
    }

    useEffect(()=>{
        if (token) {
            fetchOrders();   
        }
    },[token])


  return (
    <div className='my-orders'>
      <h2>Orderan Saya</h2>
      <div className="container">
        {data.map((order,index)=>{
            return (
                <div key={index} className='my-orders-order'>
                    <img src="{assets.parcel_icon}" alt="" />
                    <p>{order.items.map((item,index)=>{
                        if (index === order.items.length-1) {
                            return item.name+" x "+item.quantity
                        }
                        else{
                            return item.name+" x "+item.quantity+", "
                        }
                    })}</p>
                    <p>Rp.{order.amount}.00</p>
                    <p>Items: {order.items.length}</p>
                    <p><span>&#x25cf;</span> <b>{order.status}</b></p>
                </div>
            )
        })}
      </div>
    </div>
  )
}

export default MyOrders
