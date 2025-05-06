// Global variables and constants
let currentSession = null; // { type: "Break" or "Lunch", startTime: <timestamp> }
let countdownInterval = null;
let beepInterval = null;

const BREAK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const ALERT_BEFORE = 2 * 60 * 1000;      // Alert threshold: 2 minutes in milliseconds
let logs = []; // Array to store session logs

// Save the current logs and session to localStorage
function saveDataToLocalStorage() {
  const data = {
    logs: logs,
    currentSession: currentSession
  };
  localStorage.setItem('timeTrackerData', JSON.stringify(data));
}

// Load data from localStorage
function loadDataFromLocalStorage() {
  const data = localStorage.getItem('timeTrackerData');
  if (data) {
    const parsed = JSON.parse(data);
    logs = parsed.logs || [];
    currentSession = parsed.currentSession || null;
  }
}

// Format a timestamp into the 12-hour clock format (e.g., "02:05 PM")
function formatTime(ts) {
  const date = new Date(ts);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert hour "0" to "12"
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Helper function: format duration (in milliseconds) into a human-readable string.
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 
           ? `${minutes} min ${seconds} sec` 
           : `${minutes} min`;
  } else {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let result = `${hours} hr`;
    if (minutes > 0) {
      result += ` ${minutes} min`;
    }
    if (seconds > 0) {
      result += ` ${seconds} sec`;
    }
    return result;
  }
}

// Update the session log table in the DOM
function updateLogTable() {
  const tableBody = document.getElementById('logTableBody');
  tableBody.innerHTML = '';
  logs.forEach(log => {
    const tr = document.createElement('tr');

    // Create table cells for type, out time, in time, and duration
    const typeTd = document.createElement('td');
    typeTd.textContent = log.type;
    
    const outTd = document.createElement('td');
    outTd.textContent = log.outTime;
    
    const inTd = document.createElement('td');
    inTd.textContent = log.inTime || '';
    
    const durationTd = document.createElement('td');
    if (log.inTimestamp && log.outTimestamp) {
      const diff = log.inTimestamp - log.outTimestamp;
      durationTd.textContent = formatDuration(diff);
    } else {
      durationTd.textContent = '';
    }
    
    tr.appendChild(typeTd);
    tr.appendChild(outTd);
    tr.appendChild(inTd);
    tr.appendChild(durationTd);
    tableBody.appendChild(tr);
  });
}

// Update the countdown timer display
function updateCountdown() {
  const timerDisplay = document.getElementById('timeRemaining');

  if (!currentSession) {
    timerDisplay.textContent = '--:--';
    return;
  }

  const now = Date.now();
  const elapsed = now - currentSession.startTime;
  let remaining = BREAK_DURATION - elapsed;
  if (remaining < 0) {
    remaining = 0;
  }
  
  // Format remaining time as mm:ss
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // When remaining time is less than or equal to 2 minutes, start the beep if not already alerting
  if (remaining <= ALERT_BEFORE && !beepInterval) {
    startBeepAlert();
  }
}

// Use the Web Audio API to produce a short beep sound
function beep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1000, ctx.currentTime); // 1,000 Hz beep tone
  oscillator.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.2); // Beep duration: 0.2 seconds
}

// Start the periodic beep alert (every 2 seconds) once the 2-minute threshold is reached
function startBeepAlert() {
  if (beepInterval) return;
  beep(); // Initial beep
  beepInterval = setInterval(beep, 2000);
}

// Stop the beep alert; called when user clicks OK or when session ends
function stopBeepAlert() {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
}

// Reset the entire dashboard; clear logs and active session data
function resetDashboard() {
  if (confirm("Are you sure you want to reset? This will clear all data.")) {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    stopBeepAlert();
    currentSession = null;
    logs = [];
    localStorage.removeItem('timeTrackerData');
    updateCountdown();
    updateLogTable();
  }
}

// Set up event listeners for buttons

// Break Out
document.getElementById('breakOutBtn').addEventListener('click', function() {
  if (currentSession) {
    alert("Another session is already active. Please end it before starting a new one.");
    return;
  }
  const startTime = Date.now();
  currentSession = { type: "Break", startTime: startTime };
  // Add session log with raw timestamps for later duration calculation
  logs.push({
    type: "Break",
    outTime: formatTime(startTime),
    outTimestamp: startTime,
    inTime: null,
    inTimestamp: null
  });
  saveDataToLocalStorage();
  updateLogTable();
  updateCountdown();
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdown, 1000);
});

// Break In
document.getElementById('breakInBtn').addEventListener('click', function() {
  if (!currentSession || currentSession.type !== "Break") {
    alert("No active Break session to end.");
    return;
  }
  const now = Date.now();
  // Find the last Break session without an inTime and update it
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].type === "Break" && !logs[i].inTime) {
      logs[i].inTime = formatTime(now);
      logs[i].inTimestamp = now;
      break;
    }
  }
  currentSession = null;
  saveDataToLocalStorage();
  updateLogTable();
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  document.getElementById('timeRemaining').textContent = '--:--';
  stopBeepAlert();
});

// Lunch Out
document.getElementById('lunchOutBtn').addEventListener('click', function() {
  if (currentSession) {
    alert("Another session is already active. Please end it before starting a new one.");
    return;
  }
  const startTime = Date.now();
  currentSession = { type: "Lunch", startTime: startTime };
  logs.push({
    type: "Lunch",
    outTime: formatTime(startTime),
    outTimestamp: startTime,
    inTime: null,
    inTimestamp: null
  });
  saveDataToLocalStorage();
  updateLogTable();
  updateCountdown();
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdown, 1000);
});

// Lunch In
document.getElementById('lunchInBtn').addEventListener('click', function() {
  if (!currentSession || currentSession.type !== "Lunch") {
    alert("No active Lunch session to end.");
    return;
  }
  const now = Date.now();
  // Find the latest Lunch session without an inTime and update it
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].type === "Lunch" && !logs[i].inTime) {
      logs[i].inTime = formatTime(now);
      logs[i].inTimestamp = now;
      break;
    }
  }
  currentSession = null;
  saveDataToLocalStorage();
  updateLogTable();
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  document.getElementById('timeRemaining').textContent = '--:--';
  stopBeepAlert();
});

// OK button for stopping the beep alert
document.getElementById('okBtn').addEventListener('click', function() {
  stopBeepAlert();
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', function() {
  resetDashboard();
});

// On window load, restore any saved data and resume any active session countdown
window.onload = function() {
  loadDataFromLocalStorage();
  updateLogTable();
  updateCountdown();
  if (currentSession) {
    countdownInterval = setInterval(updateCountdown, 1000);
  }
};
