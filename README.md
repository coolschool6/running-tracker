# 🏃 Run Tracker - Mobile-First Running App

A comprehensive, mobile-first running tracker with live tracking, progress visualization, and social features.

## 🌟 Features

### I. Layout & User Experience (Mobile First)
- ✅ **Tabbed Navigation Bar**: Sticky bottom navigation with Home, Track, Progress, and Profile sections
- ✅ **Dashboard View**: Visual dashboard with stats, suggestions, and activity feed
- ✅ **Live Tracking Screen**: Full-screen high-contrast interface with real-time metrics
- ✅ **Activity Feed Layout**: Social media-style workout feed with kudos and map placeholders

### II. Data Visualization & Insights
- ✅ **Stats Dashboard**: Total distance, total runs, and best pace displayed in colorful tiles
- ✅ **Workout Suggestion**: AI-powered suggestions for balanced training (Easy, Tempo, Speed Work)
- ✅ **Training Calendar**: 28-day visual calendar showing workout history
- ✅ **Personal Records**: Automatically tracks PRs for longest run, fastest pace, longest duration
- ⏳ **Progress Charts**: Chart.js integration ready (requires library)

### III. Interactivity & Advanced Features
- ✅ **Live Run Tracking**: Simulated GPS tracking with time, distance, and pace
- ✅ **Calendar View**: Visual calendar mapping training days
- ✅ **Data Editing**: Edit and delete workout functionality
- ✅ **Form Validation**: Robust input validation with error messages
- ✅ **Local Storage**: Persistent data storage across sessions

### IV. Social & Engagement
- ✅ **Activity Feed**: Strava-like activity cards with date, distance, and pace
- ✅ **Kudos System**: Like/heart counter for each workout
- ✅ **Map Placeholder**: Ready for future map integration
- ✅ **User Profile**: Dedicated profile view with stats and PRs

### V. Code & Architecture
- ✅ **Modular Code**: Organized into modules (DataHandler, UIRenderer, StatsCalculator, ViewManager, etc.)
- ✅ **Error Handling**: Comprehensive validation and error messages
- ✅ **Unit Conversion**: Toggle between Metric (km) and Imperial (miles)
- ✅ **Dark/Light Mode**: Full theme switcher with CSS variables

## 📱 Views

### Home/Dashboard
- Workout suggestion based on recent training
- Stats summary (distance, runs, best pace)
- Quick log form
- Activity feed with recent workouts

### Track (Live)
- Real-time tracking display
- Large, readable metrics
- Start/Pause/Finish controls
- Auto-save on completion

### Progress
- Training calendar (28-day view)
- Workout history visualization
- Ready for chart integration

### Profile
- User profile header
- Personal records display
- Settings (theme, units)

## 🎨 Design Features

- **Mobile-First**: Optimized for mobile with desktop responsive design
- **Modern UI**: Gradient backgrounds, glass-morphism effects, smooth animations
- **Color Scheme**: Purple gradients with pink/red accents
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation
- **Performance**: Efficient rendering, minimal dependencies

## 🚀 Getting Started

1. Open `index.html` in a web browser
2. Start logging workouts or try the Live Tracking feature
3. Toggle dark mode in Profile settings
4. Switch between Metric and Imperial units

## 📊 Data Structure

```javascript
{
  date: "2025-11-10",
  distance: 5.2,      // km or miles
  duration: 30,       // minutes
  type: "Easy Run",   // workout type
  kudos: 0            // engagement counter
}
```

## 🔮 Future Enhancements

- [ ] Integrate Chart.js for detailed progress graphs
- [ ] Real GPS tracking via Geolocation API
- [ ] Map integration (Leaflet or Mapbox)
- [ ] Export data (CSV, GPX)
- [ ] Workout plans and scheduled runs
- [ ] Social features (sharing, following)
- [ ] Backend sync (cloud storage)
- [ ] Progressive Web App (PWA) with offline support

## 🛠️ Tech Stack

- **HTML5**: Semantic structure
- **CSS3**: Modern layouts (Grid, Flexbox), CSS Variables, animations
- **JavaScript (ES6+)**: Modular architecture, async operations
- **LocalStorage**: Client-side persistence
- **No frameworks**: Vanilla JS for lightweight performance

## 📦 Files

- `index.html` - App structure and views
- `script.js` - Modular application logic
- `style.css` - Mobile-first responsive styling
- `README.md` - This file

## 🎯 Key Modules

- **DataHandler**: Manages workouts and localStorage persistence
- **ViewManager**: Handles navigation and view switching
- **UIRenderer**: Renders all UI components
- **StatsCalculator**: Computes stats, suggestions, and PRs
- **LiveTrackingController**: Manages real-time tracking
- **SettingsManager**: Theme and unit preferences
- **Utils**: Helper functions for formatting and conversion

## 📄 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

This is a learning project. Suggestions and improvements welcome!

---

**Made with ❤️ for runners, by runners**
