const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
import dompurify from 'dompurify';

const app = express();

app.use(cors());

// Body-parser middleware
app.use(bodyParser.json());

// Define a rate limit configuration
const userRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Allow 10 requests per windowMs
  keyGenerator: (req) => req.body.nickname, // Adjust this based on your user authentication
  message: 'Too many requests, please try again later.',
});

// Apply the rate limit middleware
app.use('/api/store', userRateLimit);

// MongoDB connection
mongoose.connect('mongodb://eepromuser:e3p20mp4ssw0rd@localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Define MongoDB schema
const dataSchema = new mongoose.Schema({
  nickname: String,
  currentDate: Date,
  cellContent: [Number],
  phCellUsage: [Number],
  phCellMapping: [Number],
});

const Data = mongoose.model('Data', dataSchema);

// API route to store data
app.post('/api/store', async (req, res) => {
  const { nickname, cellContent, phCellUsage, phCellMapping } = req.body;
  const currentDate = new Date();
  try {
    debugger;
    const newData = new Data({
      DOMPurify.sanitize(nickname),
      DOMPurify.sanitize(currentDate),
      cellContent,
      phCellUsage,
      phCellMapping,
    });

    await newData.save();
    res.status(201).json({ message: 'Data stored successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store data' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

