const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(bodyParser.json());

// MongoDB connection Insert your mongodb key below
mongoose.connect('mongodb+srv://admin:admin@cluster0.tcaddnk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));

// City is used to save all queries that match that city
// Name will be the actual location i.e. miami, florida; miami county, Ohio
//lat is the latitude and lon is the longitude
const locationSchema = new mongoose.Schema({
    city: String,
    name: String,
    lat: Number,
    lon: Number,
});

const Location = mongoose.model('Location', locationSchema);

// Post function to MongoDB
app.post('/api/locations', async (req, res) => {
    const { city, name, lat, lon } = req.body;
    console.log('Received data:', { city, name, lat, lon });
    const newLocation = new Location({ city, name, lat, lon });
    try {
        await newLocation.save();
        console.log('Data saved:', newLocation);
        res.status(201).json(newLocation);
    } catch (error) {
        console.error('Error saving data:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// Get function to MongoDB
app.get('/api/locations', async (req, res) => {
    try {

        // Extract city from query parameters
        const { city } = req.query;

        console.log('Searching for city:', city);

        // Use the city to find matching locations
        const locations = await Location.find({ city: city });

        res.json(locations);
    } catch (error) {
        console.error('Error finding locations:', error.message);
        res.status(500).json({ error: error.message });
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
