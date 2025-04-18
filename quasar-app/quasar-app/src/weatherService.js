import axios from 'axios';

const API_KEY = 'your_openweathermap_api_key';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export default {
  async getWeather(city) {
    const url = `${BASE_URL}?q=${city}&units=metric&appid=${API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  }
};
