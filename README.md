# Weather-App-V2

Weather App that shows the current temperature as well as the forecast for the next 6 days.

A location can be entered in the text box on the left and all the matching locations across the world can be selected in a dropdown menu. If a location does not exist or cannot be found, an error saying 'City not Found' will be displayed.

The user's current location can also be used by pressing the button in the center labeled 'Use Current Location.' 
If the user's browser does not support location services or the user denies the location permission request, the corresonding error will be shown.

The forecast shows both the min and max temperatures as well as the precipitation.
The data for this is obtained through open-meteos api using nominatim to convert city to coordinates.

Location to coordinate data is stored the first time the location is selected through MongoDB to decrease api calls to nominatim.
If the location has been selected before, it will be taken from the MongoDB database.

There is also a predicted average temperature in the forecast for each day. This predicted average temperature uses the min/max temperature as well as the average temperature of each day taken from open-meteos archives to predict the average temperature of the day. The data spans from 1/1/2000 to 6 days before the current date.

The predicted data is also stored in MongoDB to lessen the number of api calls to open-meteos and to avoid unnecesarry runs of the linear regression model. 

The react website runs on host 3000 with the express server running on port 5000.
Express, axios, and python-shell is required to communicate between the frontend and backend.

In order to run, replace the MongoDB key with your own and run the express server by using:
Node server.js
in the backend folder

and run the weather-app by using:
npm start
in the weather-app folder