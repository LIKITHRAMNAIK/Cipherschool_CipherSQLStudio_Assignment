require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/mongo');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const assignmentRoutes = require('./routes/assignments');
const queryRoutes = require('./routes/queries');
const hintRoutes = require('./routes/hints');

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/assignments', assignmentRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/hint', hintRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

