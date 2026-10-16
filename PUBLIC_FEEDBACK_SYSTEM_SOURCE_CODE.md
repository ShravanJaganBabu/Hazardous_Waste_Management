# Public Feedback System — Full Source Code Documentation

A complete, production-ready full-stack reference implementation built on the **MERN Stack (MongoDB, Express.js, React, Node.js)**.

---

## 1. Project Structure

```text
public-feedback-system/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── feedbackController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Feedback.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── feedbackRoutes.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── index.html
```

---

## 2. Backend Package Installation

Execute these commands in your terminal to set up the backend environment:

```bash
# 1. Create and navigate to the project directory
mkdir -p public-feedback-system/backend
cd public-feedback-system/backend

# 2. Initialize Node.js package.json
npm init -y

# 3. Install core dependencies
npm install express mongoose dotenv cors bcryptjs jsonwebtoken

# 4. Install nodemon for live development reloading
npm install --save-dev nodemon
```

In `backend/package.json`, update the `scripts` section:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## 3. Database Connection
📁 **`backend/config/db.js`**

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## 4. Environment Variables
📁 **`backend/.env`**

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/public_feedback_db
JWT_SECRET=super_secret_jwt_key_2026_secure
JWT_EXPIRE=7d
```

---

## 5. User Model
📁 **`backend/models/User.js`**

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
```

---

## 6. Password Hashing and Registration
📁 **`backend/controllers/authController.js` (Part 1 - Registration)**

```javascript
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register a new user / citizen
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // 3. Password Hashing with Salt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    // 5. Send response with Token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 7. Login and JWT Generation
📁 **`backend/controllers/authController.js` (Part 2 - Login)**

```javascript
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // 2. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 3. Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 4. Generate JWT Token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 8. Authentication Middleware
📁 **`backend/middleware/authMiddleware.js`**

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect route: Verifies Bearer Token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No authorization token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Admin Guard: Restricts access to administrator accounts
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
  }
};
```

---

## 9. Create Feedback API (Model & Controller)
📁 **`backend/models/Feedback.js`**

```javascript
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter a feedback title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please enter the detailed feedback description'],
    },
    category: {
      type: String,
      required: true,
      enum: ['Infrastructure', 'Sanitation', 'Transportation', 'Public Safety', 'Other'],
      default: 'Other',
    },
    department: {
      type: String,
      default: 'General Public Services',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    citizenName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
```

📁 **`backend/controllers/feedbackController.js` (Create Operation)**

```javascript
const Feedback = require('../models/Feedback');

// @desc    Submit new citizen feedback
// @route   POST /api/feedback
// @access  Private (Registered Citizen / User)
exports.createFeedback = async (req, res) => {
  try {
    const { title, description, category, department } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const feedback = await Feedback.create({
      title,
      description,
      category,
      department,
      user: req.user._id,
      citizenName: req.user.name,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 10. Read Feedback API
📁 **`backend/controllers/feedbackController.js` (Read Operations)**

```javascript
// @desc    Get all feedback records (with optional query filtering)
// @route   GET /api/feedback
// @access  Private
exports.getAllFeedback = async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    const feedbacks = await Feedback.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feedbacks submitted by the logged-in citizen
// @route   GET /api/feedback/my
// @access  Private
exports.getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single feedback by ID
// @route   GET /api/feedback/:id
// @access  Private
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('user', 'name email');

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 11. Update Feedback API
📁 **`backend/controllers/feedbackController.js` (Update Operation)**

```javascript
// @desc    Update feedback status & assigned department
// @route   PUT /api/feedback/:id
// @access  Private (Admin Only)
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status, department } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    if (status) feedback.status = status;
    if (department) feedback.department = department;

    const updatedFeedback = await feedback.save();

    res.status(200).json({
      success: true,
      message: `Feedback status updated to ${updatedFeedback.status}.`,
      data: updatedFeedback,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 12. Delete Feedback API
📁 **`backend/controllers/feedbackController.js` (Delete Operation)**

```javascript
// @desc    Delete a feedback submission
// @route   DELETE /api/feedback/:id
// @access  Private (Admin or Creator)
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    // Only allow Admin OR the citizen who submitted it to delete
    if (req.user.role !== 'admin' && feedback.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this feedback.' });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 13. Express Routes

📁 **`backend/routes/authRoutes.js`**
```javascript
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
```

📁 **`backend/routes/feedbackRoutes.js`**
```javascript
const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getAllFeedback,
  getMyFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
} = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// User & Public routes
router.post('/', protect, createFeedback);
router.get('/', protect, getAllFeedback);
router.get('/my', protect, getMyFeedback);
router.get('/:id', protect, getFeedbackById);

// Admin-controlled update & delete
router.put('/:id', protect, adminOnly, updateFeedbackStatus);
router.delete('/:id', protect, deleteFeedback);

module.exports = router;
```

---

## 14. Main Server File
📁 **`backend/server.js`**

```javascript
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Root Health Check Route
app.get('/', (req, res) => {
  res.send('Public Feedback System API is live.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
```

---

## 15. React Login Component
📁 **`frontend/src/pages/Login.jsx`**

```jsx
import React, { useState } from 'react';
import axios from 'axios';

export const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { token, user } = response.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (onLoginSuccess) {
        onLoginSuccess(user);
      } else {
        window.location.href = user.role === 'admin' ? '/admin' : '/dashboard';
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Public Feedback System</h2>
        <p style={styles.subtitle}>Sign in to your citizen or admin account</p>

        {errorMsg && <div style={styles.alert}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. citizen@city.gov"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    fontFamily: 'Segoe UI, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    border: '1px solid #334155',
  },
  title: { color: '#f8fafc', margin: '0 0 8px 0', fontSize: '24px' },
  subtitle: { color: '#94a3b8', fontSize: '13px', margin: '0 0 24px 0' },
  alert: {
    padding: '10px 14px',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#cbd5e1', fontSize: '12px', fontWeight: '600' },
  input: {
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#ffffff',
    outline: 'none',
    fontSize: '14px',
  },
  button: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
};
```

---

## 16. Admin Dashboard Logic
📁 **`frontend/src/pages/AdminDashboard.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const AdminDashboard = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const token = localStorage.getItem('token');

  // Fetch all feedback items from API
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const url = filter
        ? `http://localhost:5000/api/feedback?status=${filter}`
        : 'http://localhost:5000/api/feedback';

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFeedbacks(res.data.data);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  // Update status (Pending -> In Progress -> Resolved)
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/feedback/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchFeedbacks();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Delete feedback
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/feedback/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFeedbacks();
    } catch (err) {
      alert('Failed to delete feedback.');
    }
  };

  const counts = {
    total: feedbacks.length,
    pending: feedbacks.filter((f) => f.status === 'Pending').length,
    inProgress: feedbacks.filter((f) => f.status === 'In Progress').length,
    resolved: feedbacks.filter((f) => f.status === 'Resolved').length,
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#0b132b', minHeight: '100vh', color: '#fff' }}>
      <h1>Citizen Feedback Administration</h1>
      <p style={{ color: '#8d99ae' }}>Manage public grievances, assignments, and resolution statuses</p>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '24px 0' }}>
        <div style={cardStyle}>Total: <b>{counts.total}</b></div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>Pending: <b>{counts.pending}</b></div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>In Progress: <b>{counts.inProgress}</b></div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>Resolved: <b>{counts.resolved}</b></div>
      </div>

      {/* Filter Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ marginRight: '10px' }}>Filter by Status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Feedback Records Table */}
      {loading ? (
        <p>Loading grievances...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1c2541' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #3a506b', color: '#cbd5e1' }}>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Citizen</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((f) => (
              <tr key={f._id} style={{ borderBottom: '1px solid #3a506b' }}>
                <td style={tdStyle}>
                  <b>{f.title}</b>
                  <div style={{ fontSize: '12px', color: '#8d99ae' }}>{f.description}</div>
                </td>
                <td style={tdStyle}>{f.citizenName || f.user?.name || 'Anonymous'}</td>
                <td style={tdStyle}>{f.category}</td>
                <td style={tdStyle}>
                  <select
                    value={f.status}
                    onChange={(e) => handleStatusChange(f._id, e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => handleDelete(f._id)} style={deleteBtnStyle}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const cardStyle = { padding: '16px', backgroundColor: '#1c2541', borderRadius: '8px' };
const thStyle = { padding: '12px' };
const tdStyle = { padding: '12px' };
const selectStyle = { padding: '6px 10px', backgroundColor: '#0b132b', color: '#fff', border: '1px solid #3a506b', borderRadius: '4px' };
const deleteBtnStyle = { padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
```

---

## 17. REST API Request and Response Examples

### 1. User Registration
- **Request**: `POST /api/auth/register`
```json
{
  "name": "Kavitha Raman",
  "email": "kavitha@example.com",
  "password": "Password123",
  "role": "user"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "User registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MDU4Mm...",
  "user": {
    "id": "670582f3a9b1c2001",
    "name": "Kavitha Raman",
    "email": "kavitha@example.com",
    "role": "user"
  }
}
```

---

### 2. User Login
- **Request**: `POST /api/auth/login`
```json
{
  "email": "kavitha@example.com",
  "password": "Password123"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MDU4Mm...",
  "user": {
    "id": "670582f3a9b1c2001",
    "name": "Kavitha Raman",
    "email": "kavitha@example.com",
    "role": "user"
  }
}
```

---

### 3. Create Feedback
- **Headers**:
```http
Authorization: Bearer <TOKEN>
Content-Type: application/json
```
- **Request**: `POST /api/feedback`
```json
{
  "title": "Broken Street Lamp near North Junction",
  "description": "Streetlight #42 has been non-functional for 5 consecutive nights, causing road hazard.",
  "category": "Infrastructure",
  "department": "Electrical & Street Lighting"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Feedback submitted successfully.",
  "data": {
    "_id": "670583e7a9b1c2002",
    "title": "Broken Street Lamp near North Junction",
    "description": "Streetlight #42 has been non-functional for 5 consecutive nights, causing road hazard.",
    "category": "Infrastructure",
    "department": "Electrical & Street Lighting",
    "status": "Pending",
    "user": "670582f3a9b1c2001",
    "citizenName": "Kavitha Raman",
    "createdAt": "2026-10-14T06:04:23.112Z",
    "updatedAt": "2026-10-14T06:04:23.112Z"
  }
}
```

---

### 4. Read All Feedback (with Filter)
- **Headers**:
```http
Authorization: Bearer <TOKEN>
```
- **Request**: `GET /api/feedback?status=Pending`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "670583e7a9b1c2002",
      "title": "Broken Street Lamp near North Junction",
      "description": "Streetlight #42 has been non-functional for 5 consecutive nights, causing road hazard.",
      "category": "Infrastructure",
      "department": "Electrical & Street Lighting",
      "status": "Pending",
      "citizenName": "Kavitha Raman",
      "user": {
        "_id": "670582f3a9b1c2001",
        "name": "Kavitha Raman",
        "email": "kavitha@example.com"
      },
      "createdAt": "2026-10-14T06:04:23.112Z"
    }
  ]
}
```

---

### 5. Update Feedback Status
- **Headers**:
```http
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```
- **Request**: `PUT /api/feedback/670583e7a9b1c2002`
```json
{
  "status": "Resolved",
  "department": "Municipal Electrical Maintenance Wing"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Feedback status updated to Resolved.",
  "data": {
    "_id": "670583e7a9b1c2002",
    "title": "Broken Street Lamp near North Junction",
    "status": "Resolved",
    "department": "Municipal Electrical Maintenance Wing",
    "updatedAt": "2026-10-14T06:12:45.340Z"
  }
}
```

---

### 6. Delete Feedback
- **Headers**:
```http
Authorization: Bearer <TOKEN>
```
- **Request**: `DELETE /api/feedback/670583e7a9b1c2002`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Feedback deleted successfully."
}
```
