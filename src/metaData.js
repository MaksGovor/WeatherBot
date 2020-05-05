'use strict';

const mdFor5Day = {
  list: ['list', {
    temp: ['main', {
      average: ['temp', t => `🌡️ Average temperature: ${Math.round(+t - 273)}℃`],
      feelsLike: ['feels_like', t => `🌡️ Feels like temperature: ${Math.round(+t - 273)}℃`],
      min: ['temp_min', t => `🌡️ Min temperature: ${Math.round(+t - 273)}℃`],
      max: ['temp_max', t => `🌡️ Max temperature: ${Math.round(+t - 273)}℃`],
    }],
    weather: ['weather', {
      main: ['main', x => `🛰️ At that time the weather is: ${x}`],
      description: ['description', x => `🛰️ More about the weather: ${x}`],
    }],
    wind: ['wind', {
      speed: ['speed', s => `🌪️ The wind speed is ${s} m/s`],
    }],
    rain: ['rain', r => `🌧️ Chanse of presipitation is ${r['3h']}`],
    date: ['dt_txt', d => `📅 Date: ${d.split(' ').shift()}`],
    time: ['dt_txt', d => `⏰ Time: ${d.split(' ').pop()}`],
  }],
  city: ['city', {
    name: ['name', x => x],
    country: ['country', x => x],
    sunrise: ['sunrise', x => new Date(x * 1000).toLocaleString()],
    sunset: ['sunset', x => new Date(x * 1000).toLocaleString()],
  }]
};

const mdThisTimeWeather = {
  name: ['name', x => `🌇 City: ${x}`],
  date: ['dt', d => `📅 Date: ${new Date().toString().split(' ').slice(1, 5).join(' ')}`],
  temp: ['main', {
    average: ['temp', t => `🌡️ Average temperature: ${Math.round(+t - 273)}℃`],
    feelsLike: ['feels_like', t => `🌡️ Feels like temperature: ${Math.round(+t - 273)}℃`],
    min: ['temp_min', t => `🌡️ Min temperature: ${Math.round(+t - 273)}℃`],
    max: ['temp_max', t => `🌡️ Max temperature: ${Math.round(+t - 273)}℃`],
  }],
  weather: ['weather', {
    main: ['main', x => `🛰️ At that time the weather is: ${x}`],
    description: ['description', x => `🛰️ More about the weather: ${x}`],
  }],
  wind: ['wind', {
    speed: ['speed', s => `🌪️ The wind speed is ${s} m/s`],
  }],
  rain: ['rain', r => `🌧️ Chanse of presipitation is ${r['3h']}`],
};

const mdCovid19 = {
  country: ['Country', x => `🌇 Country: ${x}`],
  confirmed: ['Confirmed', x => `🦠 Confirmed cases: ${x}`],
  deaths: ['Deaths', x => `☠ Deaths: ${x}`],
  recovered: ['Recovered', x => `🚑 Recovered: ${x}`],
  date: ['Date', x => `📅 Update: ${new Date(x).toLocaleString()}`]
};


module.exports = {
  mdThisTimeWeather,
  mdFor5Day,
  mdCovid19,
}