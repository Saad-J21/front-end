import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient'; // Your configured axios client

// NEW STRIPE IMPORTS
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';


const CartPage = () => {
  const { cartItems, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  // NEW STRIPE HOOKS
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);


  const handleUpdateQuantity = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeItem(productId);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      clearCart();
    }
  };

  const handleCompletePurchase = async () => {
    setPaymentError(null);
    setPaymentSuccess(null);
    setIsProcessing(true);

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      setIsProcessing(false);
      return;
    }

    // 1. Create PaymentMethod using CardElement
    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setPaymentError(error.message);
      setIsProcessing(false);
      return;
    }

    // 2. Prepare order data to send to backend
    const orderItemsForBackend = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    try {
      // 3. Send paymentMethod.id and order items to your backend
      const response = await axiosClient.post('/orders', {
        items: orderItemsForBackend,
        paymentMethodId: paymentMethod.id,
      });

      // Handle backend response
      if (response.status === 201 && response.data.status === 'PAID') {
        setPaymentSuccess('Payment successful! Your order has been placed.');
        clearCart(); // Clear cart on successful purchase
        navigate('/orders/history'); // Redirect to a future order history page
      } else if (response.status === 201 && response.data.status === 'REQUIRES_ACTION') {
        // Handle 3D Secure or other required actions (more complex for a simple app)
        // You would typically get client_secret from backend response and use stripe.confirmCardPayment()
        setPaymentError('Payment requires additional action. Please check your email or order history.');
      } else {
        setPaymentError(`Order failed. Status: ${response.data.status || 'Unknown'}.`);
      }
    } catch (err) {
      setPaymentError(`Order placement failed: ${err.response ? err.response.data : err.message}`);
      console.error('Order/Payment Error:', err.response ? err.response.data : err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>Your Cart</h2>
        <p style={styles.emptyCartText}>Your cart is empty. Go add some products!</p>
        <button onClick={() => navigate('/products')} style={styles.continueShoppingButton}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Your Cart ({totalItems} items)</h2>
      <div style={styles.cartItemList}>
        {cartItems.map((item) => (
          <div key={item.productId} style={styles.cartItemCard}>
            <h3 style={styles.itemName}>{item.name}</h3>
            <p style={styles.itemPrice}>Price: ${item.price ? item.price.toFixed(2) : 'N/A'}</p>
            <div style={styles.quantityControl}>
              <button
                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                disabled={item.quantity <= 1}
                style={styles.quantityButton}
              >
                -
              </button>
              <span style={styles.itemQuantity}>{item.quantity}</span>
              <button
                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                style={styles.quantityButton}
              >
                +
              </button>
            </div>
            <p style={styles.itemSubtotal}>Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
            <button
              onClick={() => handleRemoveItem(item.productId)}
              style={styles.removeButton}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div style={styles.cartSummary}>
        <h3 style={styles.totalPrice}>Total: ${totalPrice}</h3>

        {/* Stripe Card Input */}
        <div style={styles.cardElementContainer}>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        
        {paymentError && <p style={styles.errorText}>{paymentError}</p>}
        {paymentSuccess && <p style={styles.successText}>{paymentSuccess}</p>}

        <button
          onClick={handleCompletePurchase}
          disabled={isProcessing || !stripe || !elements}
          style={styles.completePurchaseButton}
        >
          {isProcessing ? 'Processing...' : 'Complete Purchase'}
        </button>
        <button onClick={handleClearCart} style={styles.clearCartButton} disabled={isProcessing}>
          Clear Cart
        </button>
      </div>
    </div>
  );
};

// Options for CardElement styling (optional)
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

// Basic inline styles
const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
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
  emptyCartText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '1.1em',
    marginBottom: '20px',
  },
  continueShoppingButton: {
    display: 'block',
    margin: '0 auto',
    backgroundColor: '#007bff',
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
  },
  cartItemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  cartItemCard: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  itemName: {
    fontSize: '1.2em',
    color: '#0056b3',
    marginBottom: '5px',
  },
  itemPrice: {
    fontSize: '1em',
    color: '#333',
    marginBottom: '10px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  quantityButton: {
    backgroundColor: '#e0e0e0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '0.9em',
    minWidth: '30px',
    textAlign: 'center',
  },
  itemQuantity: {
    margin: '0 10px',
    fontSize: '1em',
    fontWeight: 'bold',
  },
  itemSubtotal: {
    fontSize: '1.1em',
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: '15px',
  },
  removeButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    alignSelf: 'flex-end', // Aligns button to the right
  },
  cartSummary: {
    borderTop: '1px solid #eee',
    marginTop: '30px',
    paddingTop: '20px',
    textAlign: 'right',
  },
  totalPrice: {
    fontSize: '1.5em',
    color: '#333',
    marginBottom: '20px',
  },
  completePurchaseButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    marginLeft: '10px',
  },
  clearCartButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
  },
  cardElementContainer: { // NEW STYLE
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    backgroundColor: '#fff',
  },
  successText: { // NEW STYLE
    color: 'green',
    textAlign: 'center',
    fontSize: '1.1em',
    marginBottom: '10px',
  },
};

export default CartPage;