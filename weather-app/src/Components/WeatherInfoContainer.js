import React from 'react';

//Main Container for showing the current temperature as well as the next 5 day's weather

function WeatherInfoContainer({weather, selectedCity,formatDate}){
    return(
        <div className='Weather-info-container'>

        {/*Weather Container*/}
        {weather && (
          <div className='Weather-info'>
            
            {/*Weather for current day*/}
            <h2>Weather Data for {selectedCity}</h2>
            <h3>Today</h3>
            <p>Temperature: {weather.hourly.temperature_2m[0] || 'N/A'}°C</p>

            {/*Weather for next 5 days*/}
            <div className='Weather-block'>
              {weather.daily.time.slice(1, 7).map((date, index) => (
                <div key={index} className='Weather-day'>
                  <h4>{formatDate(date)}</h4>
                  <p>Temp Max: {weather.daily.temperature_2m_max[index + 1] || 'N/A'}°C</p>
                  <p>Temp Min: {weather.daily.temperature_2m_min[index + 1] || 'N/A'}°C</p>
                  <p>Precipitation: {weather.daily.precipitation_sum[index + 1] || 'N/A'} mm</p>
                </div>
              ))}
            </div>
          </div>
        )}      
      </div>
    )
}

export default WeatherInfoContainer