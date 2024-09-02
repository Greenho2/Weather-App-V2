import './App.css';
import HelloWorld from './Components/HelloWorld';
import MainContainer from './Components/MainContainer';
import WeatherInfoContainer from './Components/WeatherInfoContainer';
import React, { useState } from 'react';
import InfoPopUp from './Components/InfoPopUp';
import infoImage from './Components/infoIcon.png';
import axios from 'axios';

//Simple weather app that shows the current temperature as well as the forecasted max, min temperature, precipitation over the next 5 days.
//Location can be chosen using current location or by searching for a city and selecting one from the list of cities worldwide


//Weather forecast is obtained via api.open-meteo.com
//City to coordinates are obtained through nominatim.openstreetmap.org as open-meteo takes coordinates only
const weather_URL = 'https://api.open-meteo.com/v1/forecast';
const location_URL = 'https://nominatim.openstreetmap.org/search';
const data_URL = 'https://archive-api.open-meteo.com/v1/archive?'

function App() {

  //setup for variables that will be needed

  //Sets the city that was searched
  const [city, setCity] = useState('');

  //Sets the weather parameters when obtained
  const [weather, setWeather] = useState(null);

  //Error setting
  const [error, setError] = useState('');

  //Used to show all cities that match the searched city
  const [cityOptions, setOptions] = useState([]);

  //The city that is actually selected from the list
  const [selectedCity, setSelectedCity] = useState('');

  //Used to toggle the popup for info on PM Accelerator
  const [popUp, setPopUp] = useState(false);

  const [predictTemp, setPredictTemp] = useState([]);

  //Toggle for PM Accelerator
  const togglePopUp = ()=>{
    setPopUp (!popUp)
  }

  //Sets the city that was searched
  const handleInputChange = (event) => {
    setCity(event.target.value);
  };
  
  //Finds the city that was selected from the options
  const handleCitySelect = (event) => {
    const selected = event.target.value;
    setSelectedCity(selected);

    const selectedOption = cityOptions.find(option => option.display_name === selected);
    
    if (selectedOption) {
      //Fetchs the weather
      fetchWeather(selectedOption);
    }
  };

  //Fetches the weather from the selected city name
  const fetchWeather = async (locationData) => {

    const { lat, lon } = locationData;

    try {
      const weatherResponse = await fetch(`${weather_URL}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
      if (!weatherResponse.ok) throw new Error('Failed to fetch weather data');

      const weatherData = await weatherResponse.json();
      try {
        console.log(encodeURIComponent(locationData.display_name))

        //Search predictions database for the name
        const dbResponse = await axios.get(`http://localhost:5000/api/predictions?name=${encodeURIComponent(locationData.display_name)}`);
        
        const dbData = dbResponse.data;

        //If found, put those values into an array
        if (dbData.length > 0) {
          setPredictTemp([
            dbData[0].Day0,
            dbData[0].Day1,
            dbData[0].Day2,
            dbData[0].Day3,
            dbData[0].Day4,
            dbData[0].Day5,
            dbData[0].Day6,
          ]);
        
            setWeather(weatherData);
            return;
        }
    } catch (err) {
        console.error('Database check error:', err.message);
    }
    //Prediction not in database
    //Grab the future weather data to use in prediction model
      const futureWeatherData = {
        daily: {
            maxTemp: weatherData.daily.temperature_2m_max,
            minTemp: weatherData.daily.temperature_2m_min,
            time: weatherData.daily.time,
        }
      
      };
      
      //Change the form so it is consistent for the python model
      const transformedFutureWeatherData = futureWeatherData.daily.time.map((date, index) => ({
        date,
        minTemp: futureWeatherData.daily.minTemp[index],
        maxTemp: futureWeatherData.daily.maxTemp[index]
      }));

      sendFutureWeatherData(transformedFutureWeatherData);
      
      const prediction = await fetchAndProcessData(lat,lon);

      
      const newPrediction = prediction.predicted_avg_temps
      
      //Reformat the input
      const [ Day0, Day1, Day2, Day3, Day4, Day5 , Day6 ] = newPrediction;

      await axios.post('http://localhost:5000/api/predictions', {
            name: locationData.display_name,
            Day0: Day0,
            Day1: Day1,
            Day2: Day2,
            Day3: Day3,
            Day4: Day4,
            Day5: Day5,
            Day6: Day6,
        });

      
      
      setPredictTemp(newPrediction);
      setWeather(weatherData);
      setError('');
      

    } catch (err) {
      setError(err.message);
      setWeather(null);
    }
  };

  //Sets the list of cities that match the one that is entered in the search bar
  const handleButtonClick = async () => {
    if (!city) return;

    // Clear previous city options
    setOptions([]);
    setError('');
    
    try {
    
        //Search Database for city
        const dbResponse = await axios.get(`http://localhost:5000/api/locations?city=${encodeURIComponent(city)}`);

        const dbData = dbResponse.data;

        //If found, put those values into the dropdown of selectable cities
        if (dbData.length > 0) {
            setOptions(dbData.map(location => ({
                display_name: location.name,
                lat: location.lat,
                lon: location.lon
            })));
            setSelectedCity('');
            return;
        }
    } catch (err) {
        console.error('Database check error:', err.message);
    }

    try {

      //Fetch the weather at given location because it has not been found in database
        const locationResponse = await fetch(`${location_URL}?q=${city}&format=json&limit=5`);
        if (!locationResponse.ok) throw new Error('Failed to fetch location data');

        const locationData = await locationResponse.json();
        
        //No place found
        if (locationData.length === 0) {
            setError('City not found');
            setWeather(null);
            setOptions([]);
            return;
        }

        //Get rid of duplicates and put them into the dropdown menu
        const uniqueCities = Array.from(new Map(locationData.map(option => [option.place_id, option])).values());
        setOptions(uniqueCities.map(city => ({
            display_name: city.display_name,
            lat: city.lat,
            lon: city.lon
        })));


        setSelectedCity('');

        //Put each one into the database for retrieval in future
        for (const c of uniqueCities) {
          const { lat, lon, display_name } = c;
          await axios.post('http://localhost:5000/api/locations', {
              city: city,
              name: display_name,
              lat,
              lon,
          });
      }


    } catch (err) {
        setError(err.message);
        setWeather(null);
        setOptions([]);
    }
};

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };


  //Fetches the weather when user selects its own location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setWeather(null);
      setSelectedCity([]);
      setError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedCity([]);
        fetchWeather({ lat: latitude, lon: longitude });
      },
      (error) => {
        setError(`Geolocation error: ${error.message}`);
        setWeather(null); 
        setSelectedCity([]);
      }
    );
  };

  //Fetch historical min/max temperature data for each day at the location from 1/1/2000 to 6 days before today as the API only saves up to 6 days prior
  const fetchPastWeatherData = async (latitude, longitude) => {

    const today = new Date();
    const endDate = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];
    
    const response = await fetch(`${data_URL}latitude=${latitude}&longitude=${longitude}&start_date=2000-01-01&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
    
    if (!response.ok) throw new Error('Failed to fetch past weather data');

    return await response.json();
  };

  //Fetch the hourly temp to find the average for that day
  const fetchHourlyData = async(latitude, longitude) =>{

    const today = new Date();
    const endDate = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];
    
    const response = await fetch(`${data_URL}latitude=${latitude}&longitude=${longitude}&start_date=2000-01-01&end_date=${endDate}&hourly=temperature_2m&timezone=auto`);
    
    if (!response.ok) throw new Error('Failed to fetch past weather data');
    
    return await response.json();
  };


  //Calculate the average temp of each day by adding the hourly temperature and dividing it by 24 and combining with min/max temp data
 
  const processData = (dailyData, hourlyData) => {
      
      const hourlyTemps = hourlyData.hourly.temperature_2m;
      const hourlyTimes = hourlyData.hourly.time;
  
      // Calculate daily averages from hourly temperatures
      const dailyAverages = {};
      
      //Split into each day
      hourlyTimes.forEach((time, index) => {
          const date = time.split('T')[0];
          if (!dailyAverages[date]) {
              dailyAverages[date] = [];
          }
          dailyAverages[date].push(hourlyTemps[index]);
      });
      
      //Add temp at each hour together
      for (const [date, temps] of Object.entries(dailyAverages)) {
          const sum = temps.reduce((a, b) => a + b, 0);
          dailyAverages[date] = sum / temps.length;
      }
  
      // Combine daily and hourly data for easier sending to server
      const combinedData = dailyData.daily.time.map((date, index) => {
          return {
              date,
              avgTemp: dailyAverages[date],  
              maxTemp: dailyData.daily.temperature_2m_max[index],
              minTemp: dailyData.daily.temperature_2m_min[index],
          };
      });
  
      return combinedData;
  };
  
  //Function to feth and process data after clicking button
  const fetchAndProcessData = async (lat,lon) => {
    try {

        const dailyData = await fetchPastWeatherData(lat, lon);

        const hourlyData = await fetchHourlyData(lat, lon);

        const combinedData = processData(dailyData, hourlyData);

        const prediction = await sendWeatherData(combinedData);

        return prediction;

    } catch (error) {
        console.error(error.message);
        return null;
    }
};

//Send data to server
const sendWeatherData = async (combinedData) => {
    try {

        const response = await fetch('http://localhost:5000/api/predict-temperature', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(combinedData),
        });

        if (!response.ok) throw new Error('Failed to get prediction');

        const prediction = await response.json();
        return prediction;

    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
};

//Send futre weather data for predictions to server
const sendFutureWeatherData = async (futureWeatherData) => {
  try {
      const response = await fetch('http://localhost:5000/api/future-data', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(futureWeatherData),
      });

      if (!response.ok) throw new Error('Failed to send future weather data');

      const result = await response.json();

      console.log('Server response:', result);
      return result;

  } catch (error) {
      console.error('Error:', error.message);
      return null;
  }
};

  return (
    <div className="App">

      <div className="Title">
        <HelloWorld />
      </div>

      {/*Container used for inputting, searching, and selecting the city*/}
      <MainContainer city={city} handleInputChange = {handleInputChange} handleButtonClick = {handleButtonClick} handleCitySelect = {handleCitySelect} selectedCity= {selectedCity} cityOptions = {cityOptions} />

      {/*Button to use current location*/}
      <button className='Current-location-button' onClick={handleUseCurrentLocation}>
        Use Current Location
      </button>

      {/*Container used to display the current temperature and future weather forecasts*/}
      <WeatherInfoContainer weather={weather} predictTemp = {predictTemp} selectedCity={selectedCity} formatDate={formatDate} />


      {error && (
        <div className='Error'>
          <p>{error}</p>
        </div>
      )}

      {/*Button to show information about PM Accelerator*/}
      <img src={infoImage} className='Info-icon' alt='Info icon' onClick={togglePopUp}/>

      {/*PopUp information Container*/}
      <InfoPopUp isOpen={popUp} onClose={togglePopUp} />


    </div>
  );
}

export default App;
