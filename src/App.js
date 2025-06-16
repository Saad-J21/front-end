// src/App.js (partial update)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import PrivateRoute from './components/PrivateRoute';

// NEW STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Import your actual page components
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage'; 
import OrderHistoryPage from './pages/OrderHistoryPage';

// Placeholders (no change needed here)
import ProductDetailPage from './pages/ProductDetailPage';
import AdminPage from './pages/AdminPage';
const HomePage = () => <h2>Welcome to the E-commerce Platform!</h2>;

const stripePromise = loadStripe('pk_test_51RaYhrQu4gqPYIKXKfqWBCcYrgBqfYOZ1zL9cDaomSnK8AU9RltbjRSVolgCU5pb3xj5SbdwwdRL4cIqPUvEUWes00O6mM2eNk');

const AppContent = () => {
  const { user, logout, hasRole } = useAuth();
  const { totalItems } = useCart();

  return (
    <div>
      <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center' }}>
          <li style={{ marginRight: '15px' }}><Link to="/">Home</Link></li>
          <li style={{ marginRight: '15px' }}><Link to="/products">Products</Link></li>
          <li style={{ marginRight: '15px' }}>
            <Link to="/cart">
              Cart ({totalItems})
            </Link>
          </li>
          {user ? (
            <>
              <li style={{ marginRight: '15px' }}>Welcome, {user.username}!</li>
              {/* NEW LINK TO ORDER HISTORY */}
              <li style={{ marginRight: '15px' }}><Link to="/orders/history">Order History</Link></li>
              {hasRole('ROLE_ADMIN') && (
                <li style={{ marginRight: '15px' }}><Link to="/admin">Admin</Link></li>
              )}
              <li style={{ marginRight: '15px' }}><button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}>Logout</button></li>
            </>
          ) : (
            <li style={{ marginRight: '15px' }}><Link to="/login">Login</Link></li>
          )}
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
        <Route path="/products/:id" element={<PrivateRoute><ProductDetailPage /></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} /> {/* <-- UPDATED ROUTE ELEMENT */}
        <Route path="/orders/history" element={<PrivateRoute><OrderHistoryPage /></PrivateRoute>} /> {/* <-- NEW ROUTE */}
        {/* Admin Protected Route */}
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />

        <Route path="*" element={<h2>404 Not Found</h2>} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Elements stripe={stripePromise}>
            <AppContent />
          </Elements>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;