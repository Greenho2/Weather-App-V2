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
        //console.log(encodeURIComponent(city))
        //Search Database for city
        const dbResponse = await axios.get(`http://localhost:5000/api/locations?city=${encodeURIComponent(city)}`);
        //console.log(dbResponse.data);
        const dbData = dbResponse.data;

        //If found, put those values into the dropdown of selectable cities
        if (dbData.length > 0) {
            //console.log('found');
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
      <WeatherInfoContainer weather={weather} selectedCity={selectedCity} formatDate={formatDate} />


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
