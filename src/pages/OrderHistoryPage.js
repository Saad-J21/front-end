// src/pages/OrderHistoryPage.js
import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../auth/AuthContext'; // To potentially show username or handle auth state

const OrderHistoryPage = () => {
  const { user } = useAuth(); // Get authenticated user info
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Your backend endpoint GET /api/orders/me
        // axiosClient will automatically attach the JWT token
        const response = await axiosClient.get('/orders/me');
        setOrders(response.data);
      } catch (err) {
        setError('Failed to fetch order history. Please try again.');
        console.error('Error fetching order history:', err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only fetch if a user is logged in
      fetchOrders();
    } else {
      setLoading(false);
      setError("Please log in to view your order history.");
    }
  }, [user]); // Re-fetch if user changes (e.g., after login/logout)

  if (loading) {
    return <div style={styles.container}>Loading order history...</div>;
  }

  if (error) {
    return <div style={styles.container}><p style={styles.errorText}>{error}</p></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Your Order History</h2>
      {orders.length === 0 ? (
        <p style={styles.emptyHistoryText}>You haven't placed any orders yet.</p>
      ) : (
        <div style={styles.orderList}>
          {orders.map((order) => (
            <div key={order.orderId} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <h3 style={styles.orderId}>Order #{order.orderId}</h3>
                <p style={styles.orderDate}>Date: {new Date(order.orderDate).toLocaleString()}</p>
              </div>
              <div style={styles.orderDetails}>
                <p><strong>Total Amount:</strong> ${order.totalAmount ? order.totalAmount.toFixed(2) : 'N/A'}</p>
                <p><strong>Status:</strong> <span style={styles.orderStatus(order.status)}>{order.status}</span></p>
                {order.paymentIntentId && <p style={styles.paymentId}><strong>Payment ID:</strong> {order.paymentIntentId}</p>}
                
                <h4 style={styles.itemsHeading}>Items:</h4>
                <ul style={styles.itemList}>
                  {order.items && order.items.map((item) => (
                    <li key={item.orderItemId} style={styles.itemListItem}>
                      {item.productName} ({item.quantity} x ${item.unitPrice ? item.unitPrice.toFixed(2) : 'N/A'}) = ${(item.quantity * item.unitPrice).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Basic inline styles
const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '20px auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  heading: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: '1.1em',
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '1.1em',
    marginTop: '20px',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  orderCard: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  orderId: {
    fontSize: '1.4em',
    color: '#0056b3',
    margin: 0,
  },
  orderDate: {
    fontSize: '0.9em',
    color: '#666',
    margin: 0,
  },
  orderDetails: {
    fontSize: '0.95em',
    color: '#333',
  },
  orderStatus: (status) => { // Dynamic style for status
    let color = '#000';
    switch (status) {
      case 'PAID':
        color = 'green';
        break;
      case 'PENDING':
        color = 'orange';
        break;
      case 'FAILED':
        color = 'red';
        break;
      case 'REQUIRES_ACTION':
        color = 'purple';
        break;
      default:
        color = '#000';
    }
    return {
      fontWeight: 'bold',
      color: color,
    };
  },
  paymentId: {
    fontSize: '0.8em',
    color: '#888',
    marginTop: '5px',
  },
  itemsHeading: {
    fontSize: '1.1em',
    color: '#444',
    marginTop: '15px',
    marginBottom: '10px',
  },
  itemList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  itemListItem: {
    backgroundColor: '#f5f5f5',
    padding: '8px 12px',
    borderRadius: '4px',
    marginBottom: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

export default OrderHistoryPage;