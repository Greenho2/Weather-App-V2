import React from 'react';
import sun from './sun.svg';

//Simple function used to format the title and spinning sun icon
function HelloWorld(){
    return (
        <div>
        <div className="Title-container">
            <h1 className="Title-title">
                Simple Weather App
                
            </h1>
            <img src={sun} className="Sun-icon" alt="Sun icon" />
            
            
        </div>
            <text className='Author'>by Chin-Hsiang Ho</text>
        </div>
    );
}

export default HelloWorld