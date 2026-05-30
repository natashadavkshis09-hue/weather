import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('Grodno');
  const [searchCity, setSearchCity] = useState('Grodno');

  const API_KEY = 'f9fb53271a9cdb9a75ec720acffb555c';

  // Функция для получения текущей погоды
  const fetchWeather = async (cityName) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric&lang=ru`
      );
      if (!response.ok) throw new Error('Город не найден');
      const data = await response.json();
      setWeatherData(data);
      return data.coord;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // Функция для получения прогноза на 7 дней
  const fetchForecast = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`
      );
      if (!response.ok) throw new Error('Ошибка загрузки прогноза');
      const data = await response.json();
      
      // Группируем прогноз по дням (каждые 24 часа)
      const dailyForecast = {};
      data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('ru-RU');
        if (!dailyForecast[date]) {
          dailyForecast[date] = {
            temp: item.main.temp,
            temp_min: item.main.temp_min,
            temp_max: item.main.temp_max,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            date: item.dt_txt,
            feels_like: item.main.feels_like,
            humidity: item.main.humidity,
            wind_speed: item.wind.speed
          };
        } else {
          // Обновляем мин/макс температуры
          dailyForecast[date].temp_min = Math.min(dailyForecast[date].temp_min, item.main.temp_min);
          dailyForecast[date].temp_max = Math.max(dailyForecast[date].temp_max, item.main.temp_max);
        }
      });
      
      setForecastData(Object.values(dailyForecast).slice(0, 7));
    } catch (err) {
      setError(err.message);
    }
  };

  // Основная функция загрузки данных
  const loadWeatherData = async (cityName) => {
    setLoading(true);
    setError(null);
    const coords = await fetchWeather(cityName);
    if (coords) {
      await fetchForecast(coords.lat, coords.lon);
    }
    setLoading(false);
  };

  // Поиск города
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) {
      setCity(searchCity);
      loadWeatherData(searchCity);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    loadWeatherData(city);
  }, []);

  // Функция для получения иконки погоды
  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Получение дня недели
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
  };

  // Форматирование даты
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Загрузка погоды...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
          <p className="text-red-500 text-xl mb-4">❌ {error}</p>
          <button 
            onClick={() => loadWeatherData(city)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Поиск */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Введите название города..."
              className="flex-1 px-4 py-3 rounded-xl border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:bg-blue-50 transition transform hover:scale-105"
            >
              🔍 Найти
            </button>
          </form>
        </div>

        {weatherData && (
          <>
            {/* Текущая погода */}
            <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{weatherData.name}</h1>
                  <p className="text-xl opacity-90">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-4">
                    <img 
                      src={getWeatherIcon(weatherData.weather[0].icon)} 
                      alt={weatherData.weather[0].description}
                      className="w-24 h-24"
                    />
                    <div>
                      <div className="text-6xl font-bold">{Math.round(weatherData.main.temp)}°C</div>
                      <div className="text-xl capitalize mt-1">{weatherData.weather[0].description}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                <div className="text-center">
                  <p className="text-sm opacity-75">🌡️ Ощущается</p>
                  <p className="text-xl font-semibold">{Math.round(weatherData.main.feels_like)}°C</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-75">💧 Влажность</p>
                  <p className="text-xl font-semibold">{weatherData.main.humidity}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-75">💨 Ветер</p>
                  <p className="text-xl font-semibold">{Math.round(weatherData.wind.speed)} м/с</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-75">🔽 Давление</p>
                  <p className="text-xl font-semibold">{Math.round(weatherData.main.pressure * 0.750064)} мм рт. ст.</p>
                </div>
              </div>
            </div>

            {/* Прогноз на 7 дней */}
            <div>
              <h2 className="text-white text-3xl font-bold mb-6 text-center">📅 Прогноз на 7 дней</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {forecastData && forecastData.map((day, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur-lg rounded-xl p-4 text-white hover:transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <p className="font-bold text-lg">{getDayName(day.date)}</p>
                      <p className="text-sm opacity-75 mb-2">{formatDate(day.date)}</p>
                      <img 
                        src={getWeatherIcon(day.icon)} 
                        alt={day.description}
                        className="w-16 h-16 mx-auto"
                      />
                      <div className="mb-2">
                        <span className="text-2xl font-bold">{Math.round(day.temp_max)}°</span>
                        <span className="text-sm opacity-75 ml-1">/{Math.round(day.temp_min)}°</span>
                      </div>
                      <p className="text-sm capitalize mb-2">{day.description}</p>
                      <div className="flex justify-between text-xs opacity-75 mt-2 pt-2 border-t border-white/20">
                        <span>💧 {Math.round(day.humidity)}%</span>
                        <span>💨 {Math.round(day.wind_speed)} м/с</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;