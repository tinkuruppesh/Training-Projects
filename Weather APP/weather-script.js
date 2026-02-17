// API Configuration
const API_KEY = 'e3cb8794197fb3444e85778fe88cbd7d';
const CURRENT_API = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_API = 'https://api.openweathermap.org/data/2.5/forecast';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loader = document.getElementById('loader');
const error = document.getElementById('error');
const weatherInfo = document.getElementById('weatherInfo');
const forecastTabs = document.getElementById('forecastTabs');
const dateInput = document.getElementById('dateInput');

// Weather Data Elements
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const condition = document.getElementById('condition');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const feelsLike = document.getElementById('feelsLike');
const visibility = document.getElementById('visibility');

let currentCity = '';
let forecastData = null;
let selectedDayIndex = 0;

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Load default city
window.addEventListener('load', () => {
    fetchWeather('London');
    setDateLimits();
});

// Set date picker limits (today to 5 days ahead)
function setDateLimits() {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 5);
    
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
    dateInput.value = today.toISOString().split('T')[0];
}

// Handle Search
function handleSearch() {
    const city = cityInput.value.trim();
    if (city === '') {
        showError('Please enter a city name');
        return;
    }
    fetchWeather(city);
}

// Fetch Weather Data
async function fetchWeather(city) {
    try {
        showLoader();
        hideError();
        hideWeatherInfo();
        currentCity = city;

        const response = await fetch(
            `${FORECAST_API}?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error('City not found');
        }

        forecastData = await response.json();
        forecastTabs.style.display = 'flex';
        selectDay(0);
        
    } catch (err) {
        showError(err.message || 'Failed to fetch weather data');
        forecastTabs.style.display = 'none';
    } finally {
        hideLoader();
    }
}

// Select Day (0 = today, 1 = tomorrow)
function selectDay(dayIndex) {
    selectedDayIndex = dayIndex;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        btn.classList.toggle('active', index === dayIndex);
    });
    
    if (dayIndex === 0 || dayIndex === 1) {
        dateInput.value = '';
    }
    
    displayForecast(dayIndex);
}

// Select Custom Date
function selectCustomDate() {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((selectedDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 0 && daysDiff <= 5) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        displayForecast(daysDiff);
    }
}

// Display Forecast for Selected Day
function displayForecast(dayIndex) {
    if (!forecastData) return;
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayIndex);
    targetDate.setHours(12, 0, 0, 0);
    
    // Find closest forecast to noon of target day
    let closestForecast = forecastData.list[0];
    let minDiff = Math.abs(new Date(forecastData.list[0].dt * 1000) - targetDate);
    
    forecastData.list.forEach(item => {
        const forecastTime = new Date(item.dt * 1000);
        const diff = Math.abs(forecastTime - targetDate);
        if (diff < minDiff) {
            minDiff = diff;
            closestForecast = item;
        }
    });
    
    displayWeather(closestForecast, dayIndex);
}

// Display Weather Data
function displayWeather(data, dayIndex) {
    const dateLabel = dayIndex === 0 ? 'Today' : dayIndex === 1 ? 'Tomorrow' : 
                      new Date(data.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    cityName.textContent = `${forecastData.city.name}, ${forecastData.city.country} - ${dateLabel}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    weatherIcon.textContent = getWeatherEmoji(data.weather[0].main);
    condition.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    visibility.textContent = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
    
    showWeatherInfo();
}

// Get Weather Emoji
function getWeatherEmoji(condition) {
    const emojiMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '🌫️',
        'Haze': '🌫️',
        'Dust': '🌫️',
        'Fog': '🌫️',
        'Sand': '🌫️',
        'Ash': '🌫️',
        'Squall': '💨',
        'Tornado': '🌪️'
    };
    return emojiMap[condition] || '🌤️';
}

// UI Helper Functions
function showLoader() {
    loader.classList.add('active');
}

function hideLoader() {
    loader.classList.remove('active');
}

function showError(message) {
    error.textContent = message;
    error.classList.add('active');
}

function hideError() {
    error.classList.remove('active');
}

function showWeatherInfo() {
    weatherInfo.classList.add('active');
}

function hideWeatherInfo() {
    weatherInfo.classList.remove('active');
}
