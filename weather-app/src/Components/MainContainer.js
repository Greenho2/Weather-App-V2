import React from "react";

// Main Container for entering City and selecting city from list
function MainContainer({ city, handleInputChange, handleButtonClick, handleCitySelect, selectedCity, cityOptions }) {
    console.log('MainContainer cityOptions:', cityOptions);
    return (
        <div className='Main-container'>
            <div className='Sidebar'>
                <div className='Search-container'>
                    {/* Input Box */}
                    <input
                        type='text'
                        value={city}
                        onChange={handleInputChange}
                        placeholder='Enter City'
                        className='Weather-input'
                    />

                    <button onClick={handleButtonClick} className='Weather-button'>
                        Get Weather
                    </button>
                </div>

                {/* Select City */}
                

                {cityOptions.length > 0 && (
                    <div className='City-selection'>
                        <select onChange={handleCitySelect} value={selectedCity}>
                            <option value=''>Select a City</option>
                            {cityOptions.map((option) => (
                                <option key={option.lat + ',' + option.lon} value={option.display_name}>
                                    {option.display_name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MainContainer;
