'use strict';

const tempConverter = overview => t => `${overview}: ${Math.round(+t - 273)}℃`;
const replace = (str, symbol) => val => {
  const arr = str.split(symbol);
  if (arr.length > 1) {
    return arr.join(val);
  }
  return;
};

const mdThisTimeWeather = {
  name: ['name', replace('🌇 City: *', '*')],
  temp: ['main', {
    average: ['temp', tempConverter('🌡️ Average temperature')],
    feelsLike: ['feels_like', tempConverter('🌡️ Feels like temperature')],
    min: ['temp_min', tempConverter('🌡️ Min temperature')],
    max: ['temp_max', tempConverter('🌡️ Max temperature')],
  }],
  weather: ['weather', {
    main: ['main', replace('🛰️ At that time the weather is: *', '*')],
    description: ['description', replace('🛰️ More about the weather: *', '*')],
  }],
  wind: ['wind', {
    speed: ['speed', replace('🌪️ The wind speed is * m/s', '*')],
  }],
  date: ['dt', d => `📅 Date: ${new Date(d * 1000).toJSON().substr(0, 10)}`],
  time: ['dt', d => `⏰ Time: ${new Date(d * 1000).toLocaleTimeString()}`],
};

const mdFor5Day = {
  list: ['list', mdThisTimeWeather]
};

const mdCovid19 = {
  country: ['Country', replace('🌇 Country: *', '*')],
  confirmed: ['Confirmed', replace('🦠 Confirmed cases: *', '*')],
  deaths: ['Deaths', replace('☠ Deaths: *', '*')],
  recovered: ['Recovered', replace('🚑 Recovered: *', '*')],
  date: ['Date', x => `📅 Update: ${new Date(x).toLocaleString()}`]
};

module.exports = {
  mdThisTimeWeather,
  mdFor5Day,
  mdCovid19,
};
