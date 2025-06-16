// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../auth/AuthContext'; // Just in case you want to display admin user

const AdminPage = () => {
  const { hasRole } = useAuth(); // Ensure admin access (though PrivateRoute handles this)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form states for Add Product
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');

  // Form states for Update Product
  const [selectedProductId, setSelectedProductId] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editProductDescription, setEditProductDescription] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductStock, setEditProductStock] = useState('');

  // Fetch all products (for modifying/selecting)
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Your backend endpoint GET /api/products (accessible to authenticated users)
      // Admins can also access this.
      const response = await axiosClient.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products for admin. Please try again.');
      console.error('Error fetching products for admin:', err.response ? err.response.data : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole('ROLE_ADMIN')) { // Only fetch if user is an admin
      fetchProducts();
    } else {
      setError("You are not authorized to view this page.");
      setLoading(false);
    }
  }, [hasRole]);

  // Handle product selection for editing
  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const productToEdit = products.find(p => String(p.productId) === String(selectedProductId));
      if (productToEdit) {
        setEditProductName(productToEdit.name);
        setEditProductDescription(productToEdit.description);
        setEditProductPrice(productToEdit.price);
        setEditProductStock(productToEdit.stockQuantity);
      }
    } else {
      // Clear edit form if no product selected
      setEditProductName('');
      setEditProductDescription('');
      setEditProductPrice('');
      setEditProductStock('');
    }
  }, [selectedProductId, products]);

  // Handle adding a new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setError(null);
    try {
      const newProduct = {
        name: newProductName,
        description: newProductDescription,
        price: parseFloat(newProductPrice),
        stockQuantity: parseInt(newProductStock, 10),
      };
      await axiosClient.post('/products', newProduct); // POST to /api/products
      setSuccessMessage('Product added successfully!');
      // Clear form
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      setNewProductStock('');
      fetchProducts(); // Refresh product list
    } catch (err) {
      setError('Failed to add product: ' + (err.response ? err.response.data : err.message));
      console.error('Error adding product:', err);
    }
  };

  // Handle updating an existing product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setError(null);
    if (!selectedProductId) {
      setError('Please select a product to update.');
      return;
    }
    try {
      const updatedProduct = {
        name: editProductName,
        description: editProductDescription,
        price: parseFloat(editProductPrice),
        stockQuantity: parseInt(editProductStock, 10),
      };
      await axiosClient.put(`/products/${selectedProductId}`, updatedProduct); // PUT to /api/products/{id}
      setSuccessMessage('Product updated successfully!');
      fetchProducts(); // Refresh product list
    } catch (err) {
      setError('Failed to update product: ' + (err.response ? err.response.data : err.message));
      console.error('Error updating product:', err);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading admin panel...</div>;
  }

  if (error && !hasRole('ROLE_ADMIN')) { // Display auth error if not admin
    return <div style={styles.container}><p style={styles.errorText}>{error}</p></div>;
  }
  
  if (!hasRole('ROLE_ADMIN')) { // Double check if user is admin
    return <div style={styles.container}><p style={styles.errorText}>Access Denied. You must be an administrator to view this page.</p></div>;
  }


  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Admin Panel</h2>
      {successMessage && <p style={styles.successText}>{successMessage}</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      {/* Add New Product Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionHeading}>Add New Product</h3>
        <form onSubmit={handleAddProduct} style={styles.form}>
          <div style={styles.formGroup}>
            <label>Name:</label>
            <input type="text" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} required />
          </div>
          <div style={styles.formGroup}>
            <label>Description:</label>
            <textarea value={newProductDescription} onChange={(e) => setNewProductDescription(e.target.value)} required />
          </div>
          <div style={styles.formGroup}>
            <label>Price:</label>
            <input type="number" step="0.01" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} required />
          </div>
          <div style={styles.formGroup}>
            <label>Stock Quantity:</label>
            <input type="number" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} required />
          </div>
          <button type="submit" style={styles.submitButton}>Add Product</button>
        </form>
      </div>

      {/* Modify Product Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionHeading}>Modify Existing Product</h3>
        <div style={styles.formGroup}>
          <label>Select Product:</label>
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={styles.select}>
            <option value="">-- Select a Product --</option>
            {products.map(product => (
              <option key={product.productId} value={product.productId}>
                {product.name} (ID: {product.productId})
              </option>
            ))}
          </select>
        </div>

        {selectedProductId && (
          <form onSubmit={handleUpdateProduct} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Name:</label>
              <input type="text" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} required />
            </div>
            <div style={styles.formGroup}>
              <label>Description:</label>
              <textarea value={editProductDescription} onChange={(e) => setEditProductDescription(e.target.value)} required />
            </div>
            <div style={styles.formGroup}>
              <label>Price:</label>
              <input type="number" step="0.01" value={editProductPrice} onChange={(e) => setEditProductPrice(e.target.value)} required />
            </div>
            <div style={styles.formGroup}>
              <label>Stock Quantity:</label>
              <input type="number" value={editProductStock} onChange={(e) => setEditProductStock(e.target.value)} required />
            </div>
            <button type="submit" style={styles.submitButton}>Update Product</button>
          </form>
        )}
      </div>

      {/* Admins can also reply to user messages from ProductDetailPage,
          so no need for a separate "reply to user messages" tab here. */}

    </div>
  );
};

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
  section: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  sectionHeading: {
    fontSize: '1.5em',
    color: '#0056b3',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1em',
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1em',
    minHeight: '80px',
  },
  select: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1em',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    marginTop: '10px',
  },
  successText: {
    color: 'green',
    textAlign: 'center',
    fontSize: '1.1em',
    marginBottom: '15px',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: '1.1em',
    marginBottom: '15px',
  },
};

export default AdminPage;