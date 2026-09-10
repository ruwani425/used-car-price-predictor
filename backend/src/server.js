const express = require('express');
const cors = require('cors');
require('dotenv').config();

const predictRoute = require('./routes/predictRoute');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', predictRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'Backend API is running healthy' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});