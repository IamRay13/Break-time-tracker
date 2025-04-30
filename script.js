document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const startButton = document.getElementById('startButton');
  const resetButton = document.getElementById('resetButton');
  const statusEl = document.getElementById('status');
  const startTimeEl = document.getElementById('startTime');
  const returnTimeEl = document.getElementById('returnTime');
  const countdownEl = document.getElementById('countdown');

  let timerInterval;
  let alarmTimeout;
  let breakEndTime;

  // Create audio object for alarm sound (make sure "alarm.mp3" exists in your directory)
  const alarmSound = new Audio('alarm.mp3');

  // Request notification permission if it hasn't been granted
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Start Break: Initializes the 30-minute break and sets a timestamp
  function startBreak() {
    const now = new Date();
    // Set break to end in 30 minutes
    breakEndTime = new Date(now.getTime() + 30 * 60000);
    localStorage.setItem('breakEndTime', breakEndTime);
    localStorage.setItem('breakStarted', now.toISOString());
    
    // Update the UI with the start time and calculated return time
    startTimeEl.innerText = `Started at: ${now.toLocaleTimeString()}`;
    returnTimeEl.innerText = `Return at: ${breakEndTime.toLocaleTimeString()}`;
    statusEl.innerText = "Break in progress...";

    // Clear any existing timers
    clearInterval(timerInterval);
    clearTimeout(alarmTimeout);

    // Start the live countdown (updates every second)
    timerInterval = setInterval(updateCountdown, 1000);

    // Schedule the alarm to trigger 2 minutes before break ends
    const alarmTriggerTime = breakEndTime.getTime() - 2 * 60000;
    const timeUntilAlarm = alarmTriggerTime - now.getTime();
    if (timeUntilAlarm > 0) {
      alarmTimeout = setTimeout(triggerAlarm, timeUntilAlarm);
    }
  }

  // Update the countdown display every second
  function updateCountdown() {
    const now = new Date().getTime();
    const distance = breakEndTime.getTime() - now;
    
    if (distance <= 0) {
      clearInterval(timerInterval);
      countdownEl.innerText = "Break Over";
      statusEl.innerText = "Your break has ended!";
      localStorage.removeItem('breakEndTime');
      localStorage.removeItem('breakStarted');
      return;
    }
    
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    countdownEl.innerText = `Time left: ${minutes}m ${seconds}s`;
  }

  // Trigger the alarm 2 minutes before the break ends
  function triggerAlarm() {
    // Play alarm sound (ensure audio playback is allowed)
    alarmSound.play().catch((err) => {
      console.error("Playback prevented:", err);
    });

    // Trigger vibration pattern (if supported)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Create a system notification (or fallback with alert)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Break Alert", {
        body: "Your break is about to end in 2 minutes!",
        icon: "icon.png" // Optional: ensure icon.png is in your project folder
      });
    } else {
      alert("Your break is about to end in 2 minutes!");
    }
    
    // Attempt to bring the window/tab back into focus
    window.focus();
  }

  // Reset the break timer and UI
  function resetBreak() {
    clearInterval(timerInterval);
    clearTimeout(alarmTimeout);
    countdownEl.innerText = "";
    returnTimeEl.innerText = "";
    startTimeEl.innerText = "";
    statusEl.innerText = "Break reset. Ready to start your break!";
    localStorage.removeItem('breakEndTime');
    localStorage.removeItem('breakStarted');
  }

  // Event listeners for the Start and Reset buttons
  startButton.addEventListener('click', startBreak);
  resetButton.addEventListener('click', resetBreak);

  // Resume an existing break session if present in localStorage
  const storedBreakEnd = localStorage.getItem('breakEndTime');
  if (storedBreakEnd) {
    breakEndTime = new Date(storedBreakEnd);
    // If the break session has expired, reset the app
    if (breakEndTime < new Date()) {
      resetBreak();
    } else {
      returnTimeEl.innerText = `Return at: ${breakEndTime.toLocaleTimeString()}`;
      statusEl.innerText = "Resuming break...";
      const storedBreakStart = localStorage.getItem('breakStarted');
      if (storedBreakStart) {
        startTimeEl.innerText = `Started at: ${new Date(storedBreakStart).toLocaleTimeString()}`;
      }
      updateCountdown();
      timerInterval = setInterval(updateCountdown, 1000);
      const now = new Date();
      const alarmTriggerTime = breakEndTime.getTime() - 2 * 60000;
      const timeUntilAlarm = alarmTriggerTime - now.getTime();
      if (timeUntilAlarm > 0) {
        alarmTimeout = setTimeout(triggerAlarm, timeUntilAlarm);
      }
    }
  }
});

// Service Worker registration for PWA functionality
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
