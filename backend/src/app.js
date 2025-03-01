const express = require('express');
const cors = require('cors');
require('dotenv').config();

const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api/status', statusRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 