// src/pages/ProductsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../context/CartContext'; // <-- NEW IMPORT

const ProductsPage = () => {
  const { user } = useAuth();
  const { addItem } = useCart(); // <-- Get addItem from useCart

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosClient.get('/products');
        setProducts(response.data);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        console.error('Error fetching products:', err.response ? err.response.data : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    addItem(product, 1); // Add 1 quantity of the product
    alert(`"${product.name}" added to cart!`); // Optional: provide user feedback
  };

  if (loading) {
    return <div style={styles.container}>Loading products...</div>;
  }

  if (error) {
    return <div style={styles.container}><p style={styles.errorText}>{error}</p></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Our Products</h2>
      <div style={styles.productList}>
        {products.length === 0 ? (
          <p>No products found. Please add some from the admin panel!</p>
        ) : (
          products.map((product) => (
            <div key={product.productId} style={styles.productCard}>
              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.productDescription}>{product.description}</p>
              <p style={styles.productPrice}>${product.price ? product.price.toFixed(2) : 'N/A'}</p>
              <p style={styles.productStock}>In Stock: {product.stockQuantity}</p>
              
              <button
                onClick={() => handleAddToCart(product)}
                style={styles.addToCartButton}
              >
                Add to Cart
              </button>
              
              {/* Updated "View Details" button to use Link */}
              <Link to={`/products/${product.productId}`} style={styles.viewDetailsButtonLink}> {/* <-- UPDATED LINK */}
                View Details
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


// Basic inline styles for demonstration (consider using a CSS file for real projects)
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
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
  productList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  productCard: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s ease-in-out',
  },
  productCardHover: {
    transform: 'translateY(-5px)',
  },
  productName: {
    fontSize: '1.4em',
    color: '#0056b3',
    marginBottom: '10px',
  },
  productDescription: {
    fontSize: '0.9em',
    color: '#666',
    marginBottom: '10px',
    flexGrow: 1, // Allows description to take available space
  },
  productPrice: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: '5px',
  },
  productStock: {
    fontSize: '0.85em',
    color: '#555',
    marginBottom: '15px',
  },
  addToCartButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    marginTop: '10px',
    width: '100%',
  },
  viewDetailsButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    marginTop: '10px',
    width: '100%',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: '1.1em',
  },
  viewDetailsButtonLink: { // <--- NEW/MODIFIED STYLE
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    marginTop: '10px',
    width: '100%',
    textAlign: 'center', // Center the text inside the link
    textDecoration: 'none', // Remove underline
    display: 'block', // Make it take full width
  },
};

export default ProductsPage;