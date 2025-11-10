// workouts array and persistence key
let workouts = [];
const STORAGE_KEY = 'runTracker.workouts';

// Load saved workouts from localStorage (if any)
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
	try {
		const parsed = JSON.parse(saved);
		if (Array.isArray(parsed)) workouts = parsed;
	} catch (err) {
		console.warn('Could not parse saved workouts:', err);
		workouts = [];
	}
}

// Helper to escape text for simple safety
function escapeHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// Render the workouts array into the #workout-list container
function renderWorkouts() {
	const container = document.getElementById('workout-list');
	if (!container) return;
	container.innerHTML = '';

	if (!workouts || workouts.length === 0) {
		container.innerHTML = '<p>No runs logged yet.</p>';
		return;
	}

	const ul = document.createElement('ul');
	ul.className = 'workout-list';

	workouts.forEach((w, index) => {
		const li = document.createElement('li');
		li.className = 'workout-item';

		// Format date nicely if present
		let dateStr = '';
		try {
			dateStr = w.date ? new Date(w.date).toLocaleDateString() : '';
		} catch (e) {
			dateStr = escapeHtml(w.date || '');
		}

		li.innerHTML = `
			<div class="workout-header"><strong>${escapeHtml(dateStr)}</strong></div>
			<div class="workout-body">
				<span>Distance: ${escapeHtml(w.distance)}</span>
				<span>Duration: ${escapeHtml(w.duration)} min</span>
				${w.type ? '<span>Type: ' + escapeHtml(w.type) + '</span>' : ''}
			</div>
		`;

		ul.appendChild(li);
	});

	container.appendChild(ul);
}

// Analyze recent workouts and suggest the next workout type
function getSuggestion() {
	// Main workout types to track
	const types = {
		easy: 0,
		tempo: 0,
		speed: 0
	};

	// Look at the last 7 workouts (or fewer if not enough logged)
	const recentCount = 7;
	const recentWorkouts = workouts.slice(-recentCount);

	// Count each type (case-insensitive partial match)
	recentWorkouts.forEach((w) => {
		const t = (w.type || '').toLowerCase();
		if (t.includes('easy')) {
			types.easy++;
		} else if (t.includes('tempo')) {
			types.tempo++;
		} else if (t.includes('speed') || t.includes('interval')) {
			types.speed++;
		}
	});

	// Find the type with the fewest occurrences
	let minCount = Math.min(types.easy, types.tempo, types.speed);
	
	// Prioritize in order: easy, tempo, speed if tied
	if (types.easy === minCount) return 'Easy Run';
	if (types.tempo === minCount) return 'Tempo Run';
	if (types.speed === minCount) return 'Speed Work';

	// Default fallback
	return 'Easy Run';
}

// Update the suggestion display with the recommended workout
function displaySuggestion() {
	const suggestionEl = document.getElementById('suggestion-display');
	if (!suggestionEl) return;

	const suggestion = getSuggestion();
	suggestionEl.innerHTML = `<p><strong>💡 Your suggested workout is:</strong> ${escapeHtml(suggestion)}</p>`;
}

// Calculate and display summary statistics
function calculateSummary() {
	const summaryEl = document.getElementById('stats-summary');
	if (!summaryEl) return;

	if (!workouts || workouts.length === 0) {
		summaryEl.innerHTML = '<p>No stats yet. Start logging your runs!</p>';
		return;
	}

	// Total distance
	const totalDistance = workouts.reduce((sum, w) => sum + (Number(w.distance) || 0), 0);

	// Total runs
	const totalRuns = workouts.length;

	// Best (fastest) pace: pace = duration / distance (lower is better)
	let bestPace = Infinity;
	workouts.forEach((w) => {
		const dist = Number(w.distance) || 0;
		const dur = Number(w.duration) || 0;
		if (dist > 0 && dur > 0) {
			const pace = dur / dist; // minutes per unit distance
			if (pace < bestPace) {
				bestPace = pace;
			}
		}
	});

	// Format best pace as min:sec per km (or per mile)
	let bestPaceStr = 'N/A';
	if (bestPace !== Infinity && bestPace > 0) {
		const minutes = Math.floor(bestPace);
		const seconds = Math.round((bestPace - minutes) * 60);
		bestPaceStr = `${minutes}:${seconds.toString().padStart(2, '0')} min/unit`;
	}

	summaryEl.innerHTML = `
		<h3>📊 Running Stats</h3>
		<ul>
			<li><strong>Total Distance:</strong> ${totalDistance.toFixed(2)} km</li>
			<li><strong>Total Runs:</strong> ${totalRuns}</li>
			<li><strong>Best Pace:</strong> ${bestPaceStr}</li>
		</ul>
	`;
}

// Handle form submission: add workout, persist, and re-render
function addWorkout(event) {
	event.preventDefault();

	const dateEl = document.getElementById('date-input');
	const distanceEl = document.getElementById('distance-input');
	const durationEl = document.getElementById('duration-input');
	const typeEl = document.getElementById('type-input');

	if (!dateEl || !distanceEl || !durationEl) return;

	const date = dateEl.value;
	const distance = distanceEl.value;
	const duration = durationEl.value;
	const type = typeEl ? typeEl.value : '';

	// Basic validation
	if (!date || distance === '' || duration === '') {
		// could show UI feedback; for now, just return
		return;
	}

	const workout = {
		date,
		distance: Number(distance),
		duration: Number(duration),
		type: type || ''
	};

	workouts.push(workout);

	// Persist workouts
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
	} catch (err) {
		console.warn('Could not save workouts to localStorage:', err);
	}

	// Update UI
	renderWorkouts();
	displaySuggestion();
	calculateSummary();

	// Reset form
	const form = document.getElementById('log-run-form');
	if (form) form.reset();
}

// Wire up form submit listener (script is loaded at end of body so elements exist)
const formEl = document.getElementById('log-run-form');
if (formEl) formEl.addEventListener('submit', addWorkout);

// Initial render on app start
renderWorkouts();
displaySuggestion();
calculateSummary();

