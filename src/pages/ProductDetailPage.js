// src/pages/ProductDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../context/CartContext'; // To add to cart from here

const ProductDetailPage = () => {
  const { id } = useParams(); // Get product ID from URL
  const { user, hasRole } = useAuth();
  const { addItem } = useCart(); // Get addItem from cart context

  const [product, setProduct] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [answerTexts, setAnswerTexts] = useState({}); // Stores answers text by questionId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionError, setQuestionError] = useState(null);
  const [answerError, setAnswerError] = useState(null);

  // Function to fetch product details and its questions/answers
  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch product details
      const productResponse = await axiosClient.get(`/products/${id}`);
      setProduct(productResponse.data);

      // Fetch questions for this product
      // This endpoint is currently NOT public by your SecurityConfig.
      // If you want it public for non-logged-in users to see questions,
      // you'd add: .requestMatchers(HttpMethod.GET, "/api/questions/product/{productId}").permitAll()
      const questionsResponse = await axiosClient.get(`/questions/product/${id}`);
      const fetchedQuestions = questionsResponse.data;

      // Fetch answers for each question (if an answer exists)
      const questionsWithAnswers = await Promise.all(
        fetchedQuestions.map(async (q) => {
          try {
            const answerResponse = await axiosClient.get(`/answers/question/${q.questionId}`);
            return { ...q, answer: answerResponse.data }; // Add answer if found
          } catch (ansErr) {
            // If answer not found (404), just return the question without an answer
            if (ansErr.response && ansErr.response.status === 404) {
              return { ...q, answer: null };
            }
            console.error(`Error fetching answer for question ${q.questionId}:`, ansErr.response ? ansErr.response.data : ansErr.message);
            return { ...q, answer: null }; // Default to no answer on other errors
          }
        })
      );
      setQuestions(questionsWithAnswers);

    } catch (err) {
      setError('Failed to load product details or questions. Please try again.');
      console.error('Error fetching product details:', err.response ? err.response.data : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]); // Re-fetch if product ID changes

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to ask a question.');
      return;
    }
    setQuestionError(null);
    try {
      await axiosClient.post('/questions', {
        productId: product.productId,
        questionText: newQuestionText,
      });
      setNewQuestionText('');
      await fetchProductDetails(); // Refresh questions after adding
      alert('Question asked successfully!');
    } catch (err) {
      setQuestionError('Failed to ask question. Please try again.');
      console.error('Error asking question:', err.response ? err.response.data : err.message);
    }
  };

  const handleAddAnswer = async (questionId, answerText) => {
    if (!hasRole('ROLE_ADMIN')) {
      alert('Only administrators can answer questions.');
      return;
    }
    setAnswerError(null);
    try {
      await axiosClient.post('/answers', {
        questionId: questionId,
        answerText: answerText,
      });
      setAnswerTexts(prev => { // Clear specific answer text input
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      });
      await fetchProductDetails(); // Refresh questions/answers
      alert('Answer added successfully!');
    } catch (err) {
      setAnswerError('Failed to add answer. Please try again.');
      console.error('Error adding answer:', err.response ? err.response.data : err.message);
    }
  };

  const handleAddToCart = (productToAdd) => {
    addItem(productToAdd, 1);
    alert(`"${productToAdd.name}" added to cart!`);
  };


  if (loading) {
    return <div style={styles.container}>Loading product details...</div>;
  }

  if (error) {
    return <div style={styles.container}><p style={styles.errorText}>{error}</p></div>;
  }

  if (!product) {
    return <div style={styles.container}>Product not found.</div>;
  }

  return (
    <div style={styles.container}>
      {/* Product Details Section */}
      <h2 style={styles.heading}>{product.name}</h2>
      <p style={styles.description}>{product.description}</p>
      <p style={styles.price}>Price: ${product.price ? product.price.toFixed(2) : 'N/A'}</p>
      <p style={styles.stock}>In Stock: {product.stockQuantity}</p>
      <button onClick={() => handleAddToCart(product)} style={styles.addToCartButton}>
        Add to Cart
      </button>

      {/* Questions Section */}
      <h3 style={styles.sectionHeading}>Questions & Answers</h3>
      {questions.length === 0 ? (
        <p>No questions yet for this product.</p>
      ) : (
        <div style={styles.qaList}>
          {questions.map((q) => (
            <div key={q.questionId} style={styles.qaItem}>
              <p style={styles.questionText}><strong>Q:</strong> {q.questionText} (Asked by: {q.user ? q.user.username : 'Unknown'})</p>
              {q.answer ? (
                <p style={styles.answerText}><strong>A:</strong> {q.answer.answerText} (Answered by: {q.answer.admin ? q.answer.admin.username : 'Unknown'})</p>
              ) : (
                <p style={styles.noAnswerText}>No answer yet.</p>
              )}

              {/* Admin Answer Form */}
              {hasRole('ROLE_ADMIN') && !q.answer && ( // Show if admin and no answer yet
                <form onSubmit={(e) => { e.preventDefault(); handleAddAnswer(q.questionId, answerTexts[q.questionId] || ''); }} style={styles.answerForm}>
                  <textarea
                    placeholder="Write your answer here..."
                    value={answerTexts[q.questionId] || ''}
                    onChange={(e) => setAnswerTexts(prev => ({ ...prev, [q.questionId]: e.target.value }))}
                    style={styles.answerTextarea}
                    required
                  />
                  <button type="submit" style={styles.addAnswerButton}>Add Answer</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ask Question Form */}
      {user && ( // Only show if logged in
        <div style={styles.askQuestionFormContainer}>
          <h4 style={styles.subsectionHeading}>Ask a Question</h4>
          <form onSubmit={handleAskQuestion}>
            <textarea
              placeholder="Type your question here..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              style={styles.questionTextarea}
              required
            />
            {questionError && <p style={styles.errorText}>{questionError}</p>}
            <button type="submit" style={styles.askQuestionButton}>Submit Question</button>
          </form>
        </div>
      )}
       {answerError && <p style={styles.errorText}>{answerError}</p>} {/* Display answer error */}

      <Link to="/products" style={styles.backButton}>Back to Products</Link>
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
    marginBottom: '20px',
  },
  description: {
    fontSize: '1em',
    color: '#555',
    marginBottom: '10px',
  },
  price: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: '5px',
  },
  stock: {
    fontSize: '0.9em',
    color: '#555',
    marginBottom: '20px',
  },
  addToCartButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
    marginBottom: '30px',
    width: 'auto',
  },
  sectionHeading: {
    fontSize: '1.5em',
    color: '#333',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  subsectionHeading: {
    fontSize: '1.2em',
    color: '#444',
    marginBottom: '15px',
  },
  qaList: {
    marginBottom: '30px',
  },
  qaItem: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  questionText: {
    fontSize: '1em',
    color: '#333',
    marginBottom: '5px',
  },
  answerText: {
    fontSize: '0.95em',
    color: '#007bff',
    marginLeft: '15px',
    borderLeft: '3px solid #007bff',
    paddingLeft: '10px',
    fontStyle: 'italic',
  },
  noAnswerText: {
    fontSize: '0.9em',
    color: '#888',
    marginLeft: '15px',
    fontStyle: 'italic',
  },
  askQuestionFormContainer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  questionTextarea: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    minHeight: '80px',
  },
  askQuestionButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
  },
  answerForm: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px dashed #eee',
  },
  answerTextarea: {
    width: '100%',
    padding: '8px',
    marginBottom: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    minHeight: '60px',
  },
  addAnswerButton: {
    backgroundColor: '#ffc107',
    color: '#333',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  backButton: {
    display: 'inline-block',
    marginTop: '30px',
    padding: '10px 15px',
    backgroundColor: '#6c757d',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: '0.9em',
    marginTop: '5px',
    marginBottom: '10px',
  },
};


export default ProductDetailPage;