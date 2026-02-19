# 📈 Real-Time Stock Market Dashboard

A clean, minimal, and professional stock market dashboard built with vanilla HTML, CSS, and JavaScript. Features real-time stock prices, interactive charts, and a customizable watchlist.

## ✨ Features

- **Real-Time Stock Prices**: Live stock data with automatic updates every 60 seconds
- **Interactive Charts**: Beautiful line charts with 1D, 1W, and 1M time filters
- **Watchlist**: Save your favorite stocks (persisted in localStorage)
- **Search Functionality**: Search for any stock by symbol
- **Price Indicators**: Visual up/down indicators with color coding
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Professional transitions and hover effects
- **Last Updated Time**: Shows when data was last refreshed

## 🚀 Getting Started

### Option 1: Open Directly
Simply open `index.html` in your web browser.

### Option 2: Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Then open: http://localhost:8000
```

## 🔑 API Setup

The dashboard uses the **Twelve Data API** for stock market data.

### Using Demo Mode (Default)
The app works out of the box with demo data and fallback values.

### Getting Your Own API Key (Free)
1. Visit [twelvedata.com](https://twelvedata.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Replace `'demo'` in `script.js` line 6:
   ```javascript
   const API_KEY = 'your_api_key_here';
   ```

**Free Tier Limits**: 800 API calls per day

## 📁 File Structure

```
Stock-Market-Dashboard/
├── index.html      # Main HTML structure
├── style.css       # All styling and animations
├── script.js       # JavaScript logic and API calls
└── README.md       # Documentation
```

## 🎨 Customization

### Change Colors
Edit CSS variables in `style.css`:
```css
:root {
  --primary: #4F46E5;    /* Main theme color */
  --success: #10B981;    /* Positive change color */
  --danger: #EF4444;     /* Negative change color */
}
```

### Change Popular Stocks
Edit the array in `script.js`:
```javascript
const POPULAR_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META'];
```

### Change Update Interval
Modify in `script.js`:
```javascript
const UPDATE_INTERVAL = 60000; // milliseconds (60000 = 1 minute)
```

## 🔧 How It Works

### Data Fetching
- Uses Twelve Data API for real-time stock prices
- Implements API polling for automatic updates
- Falls back to demo data if API fails

### Watchlist
- Stored in browser's localStorage
- Persists across sessions
- Easy add/remove with star button

### Charts
- Built with Chart.js library
- Supports multiple time periods
- Smooth animations and interactions

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## 🐛 Troubleshooting

**Charts not showing?**
- Make sure Chart.js CDN is loading
- Check browser console for errors

**API errors?**
- Demo key has rate limits
- Get your own free API key
- Fallback data will be used automatically

**Stocks not updating?**
- Check internet connection
- Verify API key is valid
- Check browser console for errors

## 📝 Code Comments

All code is well-commented for beginners:
- Clear section headers
- Explanation of each function
- Inline comments for complex logic

## 🎯 Learning Points

This project demonstrates:
- API integration and polling
- localStorage for data persistence
- Chart.js for data visualization
- Responsive CSS Grid layout
- Modern JavaScript (async/await)
- Event handling and DOM manipulation

## 📄 License

Free to use for personal and educational purposes.

## 🤝 Contributing

Feel free to fork and improve! Suggestions welcome.

---

**Built with ❤️ for learning and practice**
