const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

let dailyTemps = [];
let dates = [];
let iconURLS = [];
let descriptions = [];
let formattedQuery = '';

app.get('/', function(req, res) {

    res.render('index', {
        dailyTemps: dailyTemps, 
        dates: dates, 
        iconURLS: iconURLS, 
        descriptions: descriptions,
        formattedQuery: formattedQuery});

    wipeWeatherData();
});

app.post('/', function(req, res) {

    wipeWeatherData();

    let query = req.body.location;
    let apiKey = process.env.OPENCAGEAPIKEY;
    const geocoderURL = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}`;

    axios({
        method: 'get',
        url: geocoderURL,
        responseType: 'json'
    })

    .then(function(response) {

        let latitude = response.data.results[0].geometry.lat;
        let longitude = response.data.results[0].geometry.lng;

        formattedQuery = response.data.results[0].formatted;
        const appid = process.env.OPENWEATHERAPIKEY;
        let weatherURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&appid=${appid}&units=metric&exclude=current, minutely, hourly`;
    
        return axios({
            method: 'get',
            url: weatherURL,
            responseType: 'json'
        })
    })
    
    .then(function(response) {

        var options = { weekday: 'short', month: 'long', day: 'numeric' };

        for (let i = 0; i < response.data.daily.length; i++) {

            let dailyTemp = response.data.daily[i].temp.day;
            dailyTemps.push(Math.round(dailyTemp) + "°C");

            let date = new Date(response.data.daily[i].dt * 1000).toLocaleDateString("en-GB", options);
            dates.push(date);

            let icon = response.data.daily[i].weather[0].icon;
            let iconURL = "http://openweathermap.org/img/wn/" + icon + "@2x.png";
            iconURLS.push(iconURL);

            let description = response.data.daily[i].weather[0].description;
            descriptions.push(description);
        }
        res.redirect('/');
    })

    .catch(error => {
        res.render('error');
    })
})

app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port 3000.');
})

function wipeWeatherData() {
    dailyTemps = []; 
    dates = [];
    iconURLS = [];
    descriptions = [];
    formattedQuery = '';
}