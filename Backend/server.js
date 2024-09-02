//Server to send information to MongoDB as well as to python script

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// MongoDB connection replace with your own key
mongoose.connect('mongodb+srv://admin:admin@cluster0.tcaddnk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => console.log('Connected to MongoDB'));


//Schema for predictions
const predictionsSchema = new mongoose.Schema({
    name: String,
    Day0: Number,
    Day1: Number,
    Day2: Number,
    Day3: Number,
    Day4: Number,
    Day5: Number,
    Day6: Number,
});

const Predictions = mongoose.model('Predictions', predictionsSchema);

//Send Predictions to MongoDB for storing
app.post('/api/predictions', async (req, res) => {

    const { name, Day0, Day1, Day2, Day3, Day4, Day5, Day6 } = req.body;

    const newPrediction = new Predictions({ name, Day0, Day1, Day2, Day3, Day4, Day5, Day6 });

    try {
        await newPrediction.save();
        res.status(201).json(newPrediction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//Grab predictions from MongoDB
app.get('/api/predictions', async (req, res) => {

    const { name } = req.query;

    try {
        const predictions = await Predictions.find({ name: name });
        res.json(predictions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Schema for locations used, city is the search string while name is the actual location
//i.e. search for miami; name would be miami, florida or miami county, ohio and city for both would be miami
const locationSchema = new mongoose.Schema({
    city: String,
    name: String,
    lat: Number,
    lon: Number,
});

const Location = mongoose.model('Location', locationSchema);

//Function to send data to MongoDB
app.post('/api/locations', async (req, res) => {

    const { city, name, lat, lon } = req.body;
    const newLocation = new Location({ city, name, lat, lon });

    try {
        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//Function to grab data from MongoDB
app.get('/api/locations', async (req, res) => {

    const { city } = req.query;

    try {
        const locations = await Location.find({ city: city });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Function to send training data to the python script by creating a json file
app.post('/api/predict-temperature', async (req, res) => {

    const weatherData = req.body;
    const tempFilePath = path.join(__dirname, 'data.json');

    try {
        // Save weather data to data.json
        fs.writeFileSync(tempFilePath, JSON.stringify(weatherData));
        
        // Execute Python script
        exec(`python3 predictTemperature.py ${tempFilePath} ${futureDataFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send('Error executing Python script');
            }

            let prediction;

            try {
                prediction = JSON.parse(stdout);
            } catch (parseError) {
                console.error(`stdout parsing error: ${parseError}`);
                return res.status(500).send('Error parsing Python script output');
            }

            res.json(prediction);
        });

    } catch (fileError) {
        console.error(`File write error: ${fileError}`);
        res.status(500).send('Error writing data to file');
    }
});

//Function to send future data to predict the average temp
app.post('/api/future-data', async (req, res) => {

    const futureWeatherData = req.body;
    const futureDataFilePath = path.join(__dirname, 'future_data.json');

    try {
        fs.writeFileSync(futureDataFilePath, JSON.stringify(futureWeatherData));
        res.json({ success: true, message: 'Future weather data processed successfully' });

    } catch (fileError) {
        console.error(`File write error: ${fileError}`);
        res.status(500).send('Error writing data to file');
    }
});

//Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
