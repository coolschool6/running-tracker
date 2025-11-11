// ============================================
// APP STATE & CONFIGURATION
// ============================================
const APP_STATE = {
	workouts: [],
	currentView: 'home',
	liveTracking: {
		isActive: false,
		startTime: null,
		elapsedTime: 0,
		distance: 0,
		timer: null
	},
	settings: {
		theme: 'light',
		units: 'metric'
	}
};

const STORAGE_KEY = 'runTracker.workouts';
const SETTINGS_KEY = 'runTracker.settings';

// ============================================
// DATA HANDLER MODULE
// ============================================
const DataHandler = {
	load() {
		// Load workouts
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed)) APP_STATE.workouts = parsed;
			} catch (err) {
				console.warn('Could not parse saved workouts:', err);
			}
		}

		// Load settings
		const savedSettings = localStorage.getItem(SETTINGS_KEY);
		if (savedSettings) {
			try {
				APP_STATE.settings = { ...APP_STATE.settings, ...JSON.parse(savedSettings) };
			} catch (err) {
				console.warn('Could not parse settings:', err);
			}
		}
	},

	save() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(APP_STATE.workouts));
		} catch (err) {
			console.warn('Could not save workouts:', err);
		}
	},

	saveSettings() {
		try {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(APP_STATE.settings));
		} catch (err) {
			console.warn('Could not save settings:', err);
		}
	},

	addWorkout(workout) {
		// Validate input
		if (!workout.date || workout.distance <= 0 || workout.duration <= 0) {
			alert('Invalid workout data. Please check your inputs.');
			return false;
		}

		APP_STATE.workouts.push(workout);
		this.save();
		return true;
	},

	deleteWorkout(index) {
		if (confirm('Are you sure you want to delete this workout?')) {
			APP_STATE.workouts.splice(index, 1);
			this.save();
			return true;
		}
		return false;
	},

	editWorkout(index, updatedWorkout) {
		if (index >= 0 && index < APP_STATE.workouts.length) {
			APP_STATE.workouts[index] = { ...APP_STATE.workouts[index], ...updatedWorkout };
			this.save();
			return true;
		}
		return false;
	}
};

// Initialize data
DataHandler.load();

// ============================================
// UTILITY FUNCTIONS
// ============================================
const Utils = {
	escapeHtml(str) {
		if (!str) return '';
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	},

	formatDate(dateStr) {
		try {
			return dateStr ? new Date(dateStr).toLocaleDateString() : '';
		} catch (e) {
			return this.escapeHtml(dateStr || '');
		}
	},

	formatPace(duration, distance) {
		if (!distance || distance <= 0) return '--:--';
		const pace = duration / distance;
		const minutes = Math.floor(pace);
		const seconds = Math.round((pace - minutes) * 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	},

	formatTime(seconds) {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	},

	convertDistance(km, toImperial = false) {
		if (toImperial) {
			return (km * 0.621371).toFixed(2) + ' mi';
		}
		return km.toFixed(2) + ' km';
	},
	
	exportToJSON() {
		const data = {
			workouts: APP_STATE.workouts,
			exportDate: new Date().toISOString(),
			totalWorkouts: APP_STATE.workouts.length
		};
		
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `running-tracker-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	},
	
	exportToCSV() {
		if (APP_STATE.workouts.length === 0) {
			alert('No workouts to export!');
			return;
		}
		
		// CSV Header
		const headers = ['Date', 'Distance (km)', 'Duration (min)', 'Type', 'Pace (min/km)', 'Kudos'];
		
		// CSV Rows
		const rows = APP_STATE.workouts.map(w => {
			const pace = this.formatPace(w.duration, w.distance);
			return [
				w.date,
				w.distance,
				w.duration,
				w.type || '',
				pace,
				w.kudos || 0
			];
		});
		
		// Combine
		const csvContent = [
			headers.join(','),
			...rows.map(row => row.join(','))
		].join('\n');
		
		// Download
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `running-tracker-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
};

// ============================================
// VIEW MANAGER MODULE
// ============================================
const ViewManager = {
	switchView(viewName) {
		// Hide all views
		document.querySelectorAll('.app-view').forEach(view => {
			view.classList.remove('active');
		});

		// Show selected view
		const targetView = document.getElementById(`view-${viewName}`);
		if (targetView) {
			targetView.classList.add('active');
			APP_STATE.currentView = viewName;
		}

		// Update navigation
		document.querySelectorAll('.nav-item').forEach(item => {
			item.classList.remove('active');
			if (item.dataset.view === viewName) {
				item.classList.add('active');
			}
		});

		// Render view-specific content
		this.renderView(viewName);
	},

	renderView(viewName) {
		switch (viewName) {
			case 'home':
				UIRenderer.renderDashboard();
				break;
			case 'track':
				UIRenderer.renderLiveTracking();
				break;
			case 'progress':
				UIRenderer.renderProgress();
				break;
			case 'profile':
				UIRenderer.renderProfile();
				break;
		}
	}
};

// ============================================
// UI RENDERER MODULE
// ============================================
const UIRenderer = {
	renderDashboard() {
		this.renderWeekChart();
		this.renderSuggestion();
		this.renderStats();
		this.renderWorkoutFeed();
	},
	
	renderWeekChart() {
		const container = document.getElementById('week-chart');
		if (!container) return;
		
		// Calculate last 10 days of activity
		const today = new Date();
		const dailyDistances = Array(10).fill(0);
		
		// Aggregate workouts by day
		APP_STATE.workouts.forEach(workout => {
			const workoutDate = new Date(workout.date);
			const daysDiff = Math.floor((today - workoutDate) / (1000 * 60 * 60 * 24));
			if (daysDiff >= 0 && daysDiff < 10) {
				dailyDistances[9 - daysDiff] += workout.distance;
			}
		});
		
		// Find max for scaling
		const maxDistance = Math.max(...dailyDistances, 1);
		
		// Generate bars
		const bars = dailyDistances.map((distance, index) => {
			const heightPercent = (distance / maxDistance) * 100;
			return `
				<div class="bar-wrapper">
					<div class="bar" style="height: ${heightPercent}%"></div>
					<span class="bar-label">${index}</span>
				</div>
			`;
		}).join('');
		
		container.innerHTML = `
			<h3>Your Week So Far</h3>
			<div class="bar-chart">${bars}</div>
		`;
	},

	generateMiniRouteMap(seed = 0) {
		// Generate a simple squiggly route path based on seed for consistency
		const points = [];
		const numPoints = 8;
		let random = seed * 9301 + 49297; // Simple seeded random
		
		for (let i = 0; i < numPoints; i++) {
			random = (random * 9301 + 49297) % 233280;
			const x = 10 + (random / 233280) * 80;
			random = (random * 9301 + 49297) % 233280;
			const y = 15 + (random / 233280) * 70;
			points.push(`${x},${y}`);
		}
		
		const pathData = `M ${points.join(' L ')}`;
		
		return `
			<svg viewBox="0 0 100 100" class="route-map-svg">
				<path d="${pathData}" fill="none" stroke="var(--accent-primary)" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
			</svg>
		`;
	},

	renderWorkoutFeed() {
		const container = document.getElementById('workout-feed');
		if (!container) return;

		// Show loading skeleton briefly
		if (APP_STATE.workouts.length === 0) {
			container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-running" style="font-size:48px;display:block;margin-bottom:16px;opacity:0.3;"></i>No runs logged yet. Start tracking your runs!</p>';
			return;
		}

		container.innerHTML = '';

		const ul = document.createElement('ul');
		ul.className = 'workout-list';

		// Show most recent first
		[...APP_STATE.workouts].reverse().forEach((w, revIndex) => {
			const actualIndex = APP_STATE.workouts.length - 1 - revIndex;
			const li = document.createElement('li');
			li.className = 'workout-item';

			const dateStr = Utils.formatDate(w.date);
			const pace = Utils.formatPace(w.duration, w.distance);
			const isImperial = APP_STATE.settings.units === 'imperial';
			const distance = Utils.convertDistance(w.distance, isImperial);

			// Determine workout type tag class
			let tagClass = '';
			const typeL = (w.type || '').toLowerCase();
			if (typeL.includes('easy')) tagClass = 'easy';
			else if (typeL.includes('tempo')) tagClass = 'tempo';
			else if (typeL.includes('speed') || typeL.includes('interval')) tagClass = 'speed';

			// Generate mini route map
			const routeMap = this.generateMiniRouteMap(actualIndex);
			
			li.innerHTML = `
				<div class="map-placeholder">
					${routeMap}
				</div>
				<div class="workout-actions">
					<button class="btn-edit" data-index="${actualIndex}">
						<i class="fas fa-edit"></i> Edit
					</button>
					<button class="btn-delete" data-index="${actualIndex}">
						<i class="fas fa-trash-alt"></i> Delete
					</button>
				</div>
				<div class="workout-header">
					<strong>
						<i class="far fa-calendar-alt"></i>
						${Utils.escapeHtml(dateStr)}
					</strong>
					${w.type ? '<span class="workout-type-tag ' + tagClass + '"><i class="fas fa-running"></i>' + Utils.escapeHtml(w.type) + '</span>' : ''}
				</div>
				<div class="workout-body">
					<span>
						<i class="fas fa-route"></i>
						<div class="metric-value">${Utils.escapeHtml(distance.split(' ')[0])}</div>
						<div class="metric-label">${Utils.escapeHtml(distance.split(' ')[1] || 'km')}</div>
					</span>
					<span>
						<i class="far fa-clock"></i>
						<div class="metric-value">${Utils.escapeHtml(w.duration)}</div>
						<div class="metric-label">minutes</div>
					</span>
					<span>
						<i class="fas fa-tachometer-alt"></i>
						<div class="metric-value">${pace.split(' ')[0]}</div>
						<div class="metric-label">min/km</div>
					</span>
				</div>
				<div class="workout-social">
					<button class="kudos-btn" data-index="${actualIndex}">
						<i class="fas fa-heart"></i>
						<span class="kudos-count">${w.kudos || 0}</span>
					</button>
					<button class="comment-btn" disabled>
						<i class="far fa-comment"></i>
						<span>0</span>
					</button>
				</div>
			`;

			ul.appendChild(li);
		});

		container.appendChild(ul);

		// Attach event listeners
		this.attachWorkoutActions();
	},

	attachWorkoutActions() {
		// Delete buttons
		document.querySelectorAll('.btn-delete').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const index = parseInt(e.target.dataset.index);
				if (DataHandler.deleteWorkout(index)) {
					this.renderWorkoutFeed();
					this.renderStats();
				}
			});
		});

		// Edit buttons
		document.querySelectorAll('.btn-edit').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const index = parseInt(e.target.dataset.index);
				this.openEditModal(index);
			});
		});

		// Kudos buttons
		document.querySelectorAll('.kudos-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const index = parseInt(e.currentTarget.dataset.index);
				if (!APP_STATE.workouts[index].kudos) {
					APP_STATE.workouts[index].kudos = 0;
				}
				APP_STATE.workouts[index].kudos++;
				DataHandler.save();
				this.renderWorkoutFeed();
			});
		});
	},
	
	openEditModal(index) {
		const workout = APP_STATE.workouts[index];
		if (!workout) return;
		
		// Populate form
		document.getElementById('edit-workout-index').value = index;
		document.getElementById('edit-date').value = workout.date;
		document.getElementById('edit-distance').value = workout.distance;
		document.getElementById('edit-duration').value = workout.duration;
		document.getElementById('edit-type').value = workout.type || '';
		
		// Show modal
		document.getElementById('edit-modal').classList.add('active');
	},
	
	closeEditModal() {
		document.getElementById('edit-modal').classList.remove('active');
	},

	renderSuggestion() {
		const suggestionEl = document.getElementById('suggestion-display');
		if (!suggestionEl) return;

		const suggestion = StatsCalculator.getSuggestion();
		const kudosCount = APP_STATE.workouts.reduce((sum, w) => sum + (w.kudos || 0), 0);
		const avgKudos = APP_STATE.workouts.length > 0 ? Math.floor(kudosCount / APP_STATE.workouts.length) : 2;
		
		suggestionEl.innerHTML = `
			<div class="suggestion-content">
				<i class="fas fa-running-shoe suggestion-icon"></i>
				<div class="suggestion-text">
					<h4>Suggested Workout</h4>
					<p>${Utils.escapeHtml(suggestion)}</p>
				</div>
				<div class="suggestion-actions">
					<button class="kudos-btn" disabled>
						<i class="far fa-heart"></i>
						<span>${avgKudos}</span>
					</button>
					<button class="comment-btn" disabled>
						<i class="far fa-comment"></i>
						<span>0</span>
					</button>
				</div>
			</div>
		`;
	},

	renderStats() {
		const summaryEl = document.getElementById('stats-summary');
		if (!summaryEl) return;

		const stats = StatsCalculator.calculateSummary();
		const isImperial = APP_STATE.settings.units === 'imperial';

		const distanceValue = isImperial ? Utils.convertDistance(stats.totalDistance, true).split(' ') : [stats.totalDistance.toFixed(1), 'km'];

		summaryEl.innerHTML = `
			<h3><i class="fas fa-chart-line"></i> Your Running Stats</h3>
			<ul>
				<li>
					<i class="fas fa-route"></i>
					<strong>Total Distance</strong>
					<span>${distanceValue[0]} <small>${distanceValue[1]}</small></span>
				</li>
				<li>
					<i class="fas fa-running"></i>
					<strong>Total Runs</strong>
					<span>${stats.totalRuns}</span>
				</li>
				<li>
					<i class="fas fa-tachometer-alt"></i>
					<strong>Best Pace</strong>
					<span>${stats.bestPaceStr.split(' ')[0]} <small>${stats.bestPaceStr.split(' ').slice(1).join(' ')}</small></span>
				</li>
			</ul>
		`;
	},

	renderLiveTracking() {
		// Live tracking UI is already in HTML, just update values
		this.updateLiveMetrics();
	},

	updateLiveMetrics() {
		const timeEl = document.getElementById('live-time');
		const distanceEl = document.getElementById('live-distance');
		const paceEl = document.getElementById('live-pace');

		if (timeEl) timeEl.textContent = Utils.formatTime(APP_STATE.liveTracking.elapsedTime);
		if (distanceEl) {
			const isImperial = APP_STATE.settings.units === 'imperial';
			distanceEl.textContent = Utils.convertDistance(APP_STATE.liveTracking.distance, isImperial);
		}
		if (paceEl) {
			const pace = Utils.formatPace(APP_STATE.liveTracking.elapsedTime / 60, APP_STATE.liveTracking.distance);
			paceEl.textContent = pace + ' /km';
		}
	},

	renderProgress() {
		this.renderCalendar();
		this.renderWeeklyChart();
	},
	
	renderWeeklyChart() {
		const canvas = document.getElementById('chart-weekly');
		if (!canvas || typeof Chart === 'undefined') return;
		
		// Destroy existing chart if it exists
		if (canvas.chart) {
			canvas.chart.destroy();
		}
		
		// Get last 12 weeks of data
		const today = new Date();
		const weeks = [];
		const distances = [];
		
		for (let i = 11; i >= 0; i--) {
			const weekEnd = new Date(today);
			weekEnd.setDate(today.getDate() - (i * 7));
			const weekStart = new Date(weekEnd);
			weekStart.setDate(weekEnd.getDate() - 6);
			
			// Calculate total distance for this week
			let weekDistance = 0;
			APP_STATE.workouts.forEach(workout => {
				const workoutDate = new Date(workout.date);
				if (workoutDate >= weekStart && workoutDate <= weekEnd) {
					weekDistance += workout.distance;
				}
			});
			
			// Format week label (e.g., "Nov 4")
			const monthShort = weekEnd.toLocaleDateString('en-US', { month: 'short' });
			const day = weekEnd.getDate();
			weeks.push(`${monthShort} ${day}`);
			distances.push(weekDistance);
		}
		
		// Create chart
		const ctx = canvas.getContext('2d');
		canvas.chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: weeks,
				datasets: [{
					label: 'Distance (km)',
					data: distances,
					backgroundColor: 'rgba(255, 87, 34, 0.6)',
					borderColor: 'rgb(255, 87, 34)',
					borderWidth: 2,
					borderRadius: 6,
					hoverBackgroundColor: 'rgba(255, 87, 34, 0.8)'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						padding: 12,
						titleFont: {
							size: 14,
							weight: 'bold'
						},
						bodyFont: {
							size: 13
						},
						callbacks: {
							label: function(context) {
								return `${context.parsed.y.toFixed(1)} km`;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						},
						ticks: {
							callback: function(value) {
								return value + ' km';
							}
						}
					},
					x: {
						grid: {
							display: false
						}
					}
				}
			}
		});
	},

	renderCalendar() {
		const container = document.getElementById('training-calendar');
		if (!container) return;

		container.innerHTML = '';

		// Generate last 28 days
		const today = new Date();
		const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

		// Day labels
		days.forEach(day => {
			const label = document.createElement('div');
			label.textContent = day;
			label.style.fontWeight = 'bold';
			label.style.textAlign = 'center';
			label.style.padding = '5px';
			container.appendChild(label);
		});

		// Calendar days
		for (let i = 27; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];

			const dayEl = document.createElement('div');
			dayEl.className = 'calendar-day';
			
			// Check if workout exists for this date
			const dayWorkouts = APP_STATE.workouts.filter(w => w.date === dateStr);
			
			if (dayWorkouts.length > 0) {
				dayEl.classList.add('has-workout');
				
				// Add workout type indicator
				const workoutTypes = dayWorkouts.map(w => {
					const type = (w.type || '').toLowerCase();
					if (type.includes('easy')) return 'easy';
					if (type.includes('tempo')) return 'tempo';
					if (type.includes('speed') || type.includes('interval')) return 'speed';
					return 'other';
				});
				
				// Use the first workout type for styling
				dayEl.classList.add(`workout-${workoutTypes[0]}`);
				
				// Show day number with indicator dots
				dayEl.innerHTML = `
					<span class="day-number">${date.getDate()}</span>
					<div class="workout-indicators">
						${dayWorkouts.map(() => '<span class="dot"></span>').join('')}
					</div>
				`;
			} else {
				dayEl.textContent = date.getDate();
			}

			container.appendChild(dayEl);
		}
	},

	renderProfile() {
		const prs = StatsCalculator.getPersonalRecords();
		const container = document.getElementById('personal-records');
		if (!container) return;

		container.innerHTML = '';

		if (Object.keys(prs).length === 0) {
			container.innerHTML = '<p>Complete more runs to see your personal records!</p>';
			return;
		}

		Object.entries(prs).forEach(([label, value]) => {
			const prEl = document.createElement('div');
			prEl.className = 'pr-item';
			prEl.innerHTML = `
				<span class="pr-label">${label}</span>
				<span class="pr-value">${value}</span>
			`;
			container.appendChild(prEl);
		});
	}
};

// ============================================
// STATS CALCULATOR MODULE
// ============================================
const StatsCalculator = {
	getSuggestion() {
		const types = { easy: 0, tempo: 0, speed: 0 };
		const recentCount = 7;
		const recentWorkouts = APP_STATE.workouts.slice(-recentCount);

		recentWorkouts.forEach((w) => {
			const t = (w.type || '').toLowerCase();
			if (t.includes('easy')) types.easy++;
			else if (t.includes('tempo')) types.tempo++;
			else if (t.includes('speed') || t.includes('interval')) types.speed++;
		});

		const minCount = Math.min(types.easy, types.tempo, types.speed);
		
		if (types.easy === minCount) return 'Easy Run';
		if (types.tempo === minCount) return 'Tempo Run';
		if (types.speed === minCount) return 'Speed Work';

		return 'Easy Run';
	},

	calculateSummary() {
		if (!APP_STATE.workouts || APP_STATE.workouts.length === 0) {
			return { totalDistance: 0, totalRuns: 0, bestPaceStr: 'N/A' };
		}

		const totalDistance = APP_STATE.workouts.reduce((sum, w) => sum + (Number(w.distance) || 0), 0);
		const totalRuns = APP_STATE.workouts.length;

		let bestPace = Infinity;
		APP_STATE.workouts.forEach((w) => {
			const dist = Number(w.distance) || 0;
			const dur = Number(w.duration) || 0;
			if (dist > 0 && dur > 0) {
				const pace = dur / dist;
				if (pace < bestPace) bestPace = pace;
			}
		});

		let bestPaceStr = 'N/A';
		if (bestPace !== Infinity && bestPace > 0) {
			const minutes = Math.floor(bestPace);
			const seconds = Math.round((bestPace - minutes) * 60);
			bestPaceStr = `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
		}

		return { totalDistance, totalRuns, bestPaceStr };
	},

	getPersonalRecords() {
		const prs = {};

		if (APP_STATE.workouts.length === 0) return prs;

		// Best pace
		const summary = this.calculateSummary();
		if (summary.bestPaceStr !== 'N/A') {
			prs['Fastest Pace'] = summary.bestPaceStr;
		}

		// Longest run
		const longestRun = Math.max(...APP_STATE.workouts.map(w => w.distance || 0));
		if (longestRun > 0) {
			prs['Longest Run'] = Utils.convertDistance(longestRun, APP_STATE.settings.units === 'imperial');
		}

		// Longest duration
		const longestDuration = Math.max(...APP_STATE.workouts.map(w => w.duration || 0));
		if (longestDuration > 0) {
			prs['Longest Duration'] = longestDuration + ' min';
		}

		return prs;
	}
};

// ============================================
// LIVE TRACKING CONTROLLER
// ============================================
const LiveTrackingController = {
	start() {
		APP_STATE.liveTracking.isActive = true;
		APP_STATE.liveTracking.startTime = Date.now();
		APP_STATE.liveTracking.elapsedTime = 0;
		APP_STATE.liveTracking.distance = 0;

		// Update UI
		document.getElementById('btn-start-tracking').style.display = 'none';
		document.getElementById('btn-pause-tracking').style.display = 'inline-block';
		document.getElementById('btn-stop-tracking').style.display = 'inline-block';

		// Start timer
		APP_STATE.liveTracking.timer = setInterval(() => {
			APP_STATE.liveTracking.elapsedTime = Math.floor((Date.now() - APP_STATE.liveTracking.startTime) / 1000);
			
			// Simulate distance (in real app, would use GPS)
			// Assuming average pace of 6 min/km
			APP_STATE.liveTracking.distance = (APP_STATE.liveTracking.elapsedTime / 360).toFixed(2);
			
			UIRenderer.updateLiveMetrics();
		}, 1000);
	},

	pause() {
		if (APP_STATE.liveTracking.timer) {
			clearInterval(APP_STATE.liveTracking.timer);
			APP_STATE.liveTracking.timer = null;
		}
		
		const pauseBtn = document.getElementById('btn-pause-tracking');
		if (pauseBtn.textContent === 'Pause') {
			pauseBtn.textContent = 'Resume';
		} else {
			this.start();
			pauseBtn.textContent = 'Pause';
		}
	},

	stop() {
		if (APP_STATE.liveTracking.timer) {
			clearInterval(APP_STATE.liveTracking.timer);
		}

		// Save the workout
		if (APP_STATE.liveTracking.distance > 0) {
			const workout = {
				date: new Date().toISOString().split('T')[0],
				distance: parseFloat(APP_STATE.liveTracking.distance),
				duration: Math.round(APP_STATE.liveTracking.elapsedTime / 60),
				type: 'Live Tracked Run'
			};

			DataHandler.addWorkout(workout);
			alert(`Run saved! Distance: ${workout.distance} km, Time: ${workout.duration} min`);
		}

		// Reset
		APP_STATE.liveTracking.isActive = false;
		APP_STATE.liveTracking.elapsedTime = 0;
		APP_STATE.liveTracking.distance = 0;
		APP_STATE.liveTracking.timer = null;

		// Update UI
		document.getElementById('btn-start-tracking').style.display = 'inline-block';
		document.getElementById('btn-pause-tracking').style.display = 'none';
		document.getElementById('btn-stop-tracking').style.display = 'none';
		document.getElementById('btn-pause-tracking').textContent = 'Pause';

		// Reset display
		UIRenderer.updateLiveMetrics();

		// Go back to home
		ViewManager.switchView('home');
	}
};

// ============================================
// SETTINGS MANAGER
// ============================================
const SettingsManager = {
	toggleTheme() {
		APP_STATE.settings.theme = APP_STATE.settings.theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', APP_STATE.settings.theme);
		DataHandler.saveSettings();
	},

	setUnits(units) {
		APP_STATE.settings.units = units;
		DataHandler.saveSettings();
		UIRenderer.renderDashboard();
		UIRenderer.renderProfile();
	},

	init() {
		// Apply saved theme
		document.documentElement.setAttribute('data-theme', APP_STATE.settings.theme);
		
		// Set theme toggle
		const themeToggle = document.getElementById('theme-toggle');
		if (themeToggle) {
			themeToggle.checked = APP_STATE.settings.theme === 'dark';
		}

		// Set unit toggle
		const unitToggle = document.getElementById('unit-toggle');
		if (unitToggle) {
			unitToggle.value = APP_STATE.settings.units;
		}
	}
};

// ============================================
// EVENT HANDLERS & APP INITIALIZATION
// ============================================

// Form submission handler
function handleFormSubmit(event) {
	event.preventDefault();

	const dateEl = document.getElementById('date-input');
	const distanceEl = document.getElementById('distance-input');
	const durationEl = document.getElementById('duration-input');
	const typeEl = document.getElementById('type-input');

	if (!dateEl || !distanceEl || !durationEl) return;

	const date = dateEl.value;
	const distance = parseFloat(distanceEl.value);
	const duration = parseFloat(durationEl.value);
	const type = typeEl ? typeEl.value.trim() : '';

	// Validation
	if (!date) {
		alert('Please select a date.');
		return;
	}
	if (isNaN(distance) || distance <= 0) {
		alert('Please enter a valid distance greater than 0.');
		return;
	}
	if (isNaN(duration) || duration <= 0) {
		alert('Please enter a valid duration greater than 0.');
		return;
	}

	const workout = {
		date,
		distance,
		duration,
		type,
		kudos: 0
	};

	if (DataHandler.addWorkout(workout)) {
		// Update UI
		UIRenderer.renderDashboard();

		// Reset form
		const form = document.getElementById('log-run-form');
		if (form) form.reset();

		// Set default date to today
		if (dateEl) dateEl.valueAsDate = new Date();

		// Show success feedback
		alert('Run logged successfully! 🎉');
	}
}

// Initialize the application
function initApp() {
	console.log('🏃 Run Tracker App Initializing...');

	// Set default date to today
	const dateInput = document.getElementById('date-input');
	if (dateInput) {
		dateInput.valueAsDate = new Date();
	}

	// Wire up navigation
	document.querySelectorAll('.nav-item').forEach(item => {
		item.addEventListener('click', (e) => {
			const viewName = e.currentTarget.dataset.view;
			ViewManager.switchView(viewName);
		});
	});

	// Wire up form
	const formEl = document.getElementById('log-run-form');
	if (formEl) {
		formEl.addEventListener('submit', handleFormSubmit);
	}

	// Wire up live tracking buttons
	const btnStart = document.getElementById('btn-start-tracking');
	const btnPause = document.getElementById('btn-pause-tracking');
	const btnStop = document.getElementById('btn-stop-tracking');

	if (btnStart) btnStart.addEventListener('click', () => LiveTrackingController.start());
	if (btnPause) btnPause.addEventListener('click', () => LiveTrackingController.pause());
	if (btnStop) btnStop.addEventListener('click', () => LiveTrackingController.stop());

	// Wire up settings
	const themeToggle = document.getElementById('theme-toggle');
	if (themeToggle) {
		themeToggle.addEventListener('change', () => SettingsManager.toggleTheme());
	}

	const unitToggle = document.getElementById('unit-toggle');
	if (unitToggle) {
		unitToggle.addEventListener('change', (e) => SettingsManager.setUnits(e.target.value));
	}
	
	// Wire up export buttons
	const btnExportJSON = document.getElementById('btn-export-json');
	const btnExportCSV = document.getElementById('btn-export-csv');
	if (btnExportJSON) {
		btnExportJSON.addEventListener('click', () => Utils.exportToJSON());
	}
	if (btnExportCSV) {
		btnExportCSV.addEventListener('click', () => Utils.exportToCSV());
	}

	// Wire up edit modal
	const closeModalBtn = document.getElementById('close-edit-modal');
	const cancelEditBtn = document.getElementById('cancel-edit');
	const editForm = document.getElementById('edit-workout-form');
	
	if (closeModalBtn) {
		closeModalBtn.addEventListener('click', () => UIRenderer.closeEditModal());
	}
	if (cancelEditBtn) {
		cancelEditBtn.addEventListener('click', () => UIRenderer.closeEditModal());
	}
	if (editForm) {
		editForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const index = parseInt(document.getElementById('edit-workout-index').value);
			const workout = {
				date: document.getElementById('edit-date').value,
				distance: parseFloat(document.getElementById('edit-distance').value),
				duration: parseFloat(document.getElementById('edit-duration').value),
				type: document.getElementById('edit-type').value,
				kudos: APP_STATE.workouts[index].kudos || 0
			};
			
			APP_STATE.workouts[index] = workout;
			DataHandler.save();
			UIRenderer.closeEditModal();
			UIRenderer.renderDashboard();
		});
	}
	
	// Close modal when clicking backdrop
	const modal = document.getElementById('edit-modal');
	if (modal) {
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				UIRenderer.closeEditModal();
			}
		});
	}

	// Initialize settings
	SettingsManager.init();

	// Render initial view
	ViewManager.switchView('home');

	console.log('✅ App Ready!');
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initApp);
} else {
	initApp();
}

