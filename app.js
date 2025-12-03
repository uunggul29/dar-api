const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/driver_activities', require('./routes/driver_activities'));
app.use('/api/driver_incidents', require('./routes/driver_incidents'));
app.use('/api/factories', require('./routes/factories'));
app.use('/api/vehicles', require('./routes/vehicles'));

// Tes koneksi database (callback style)
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected & query test success');
  }
});

// Jalankan server
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));