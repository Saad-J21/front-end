// src/context/CartContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage or as an empty array
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCartItems = localStorage.getItem('cartItems');
      return storedCartItems ? JSON.parse(storedCartItems) : [];
    } catch (error) {
      console.error("Failed to parse cart items from localStorage:", error);
      return []; // Return empty array on error
    }
  });

  // Effect to save cart items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart items to localStorage:", error);
    }
  }, [cartItems]);

  // Function to add an item to the cart
  const addItem = useCallback((product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.productId);

      if (existingItemIndex > -1) {
        // Item already in cart, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        return updatedItems;
      } else {
        // New item, add to cart
        return [...prevItems, {
          productId: product.productId,
          name: product.name,
          price: product.price,
          stockQuantity: product.stockQuantity, // Store initial stock for reference/max quantity check
          quantity: quantity,
        }];
      }
    });
  }, []);

  // Function to remove an item from the cart
  const removeItem = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
  }, []);

  // Function to update the quantity of an item
  const updateQuantity = useCallback((productId, newQuantity) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, newQuantity) } // Ensure quantity is at least 1
          : item
      );
      return updatedItems;
    });
  }, []);

  // Function to clear the entire cart
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Calculate total items and total price (optional, but useful)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);


  const value = {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};