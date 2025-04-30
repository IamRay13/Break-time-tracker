document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const startButton = document.getElementById('startButton');
  const resetButton = document.getElementById('resetButton');
  const statusEl = document.getElementById('status');
  const startTimeEl = document.getElementById('startTime'); // New element for start timestamp
  const returnTimeEl = document.getElementById('returnTime');
  const countdownEl = document.getElementById('countdown');

  let timerInterval;
  let alarmTimeout;
  let breakEndTime;

  // Define the audio for alarm.mp3 (ensure the file exists in the project directory)
  const alarmSound = new Audio('alarm.mp3');

  // Request notification permission at startup if supported
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Start the break by initializing the 30-minute timer
  function startBreak() {
    const now = new Date();
    // Set break duration to 30 minutes from now
    breakEndTime = new Date(now.getTime() + 30 * 60000);
    // Save session to localStorage
    localStorage.setItem('breakEndTime', breakEndTime);
    localStorage.setItem('breakStarted', now.toISOString());
    
    // Update UI with the calculated return time and timestamp when break started
    returnTimeEl.innerText = `Return at: ${breakEndTime.toLocaleTimeString()}`;
    startTimeEl.innerText = `Started at: ${now.toLocaleTimeString()}`;
    statusEl.innerText = "Break in progress...";

    // Clear previous timers if they exist
    clearInterval(timerInterval);
    clearTimeout(alarmTimeout);

    // Start countdown: update every second
    timerInterval = setInterval(updateCountdown, 1000);

    // Calculate when to trigger the alarm (2 minutes before break ends)
    const alarmTriggerTime = breakEndTime.getTime() - 2 * 60000;
    const timeUntilAlarm = alarmTriggerTime - now.getTime();
    if (timeUntilAlarm > 0) {
      alarmTimeout = setTimeout(triggerAlarm, timeUntilAlarm);
    }
  }

  // Update countdown display every second
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

  // Trigger the alarm 2 minutes before break ends
  function triggerAlarm() {
    // Play the alarm sound (ensure user interaction has allowed audio playback)
    alarmSound.play().catch((err) => {
      console.error("Playback prevented:", err);
    });

    // Trigger vibration if supported (vibrate pattern: vibrate, pause, vibrate)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Display a system notification or alert if notifications are blocked
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Break Alert", {
        body: "Your break is about to end in 2 minutes!",
        icon: "icon.png" // Optional icon file, if available
      });
    } else {
      alert("Your break is about to end in 2 minutes!");
    }

    // Attempt to bring the window/tab to focus
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

  // Event listeners for buttons
  startButton.addEventListener('click', startBreak);
  resetButton.addEventListener('click', resetBreak);

  // Check for an existing break session from localStorage on page load
  const storedBreakEnd = localStorage.getItem('breakEndTime');
  if (storedBreakEnd) {
    breakEndTime = new Date(storedBreakEnd);
    // If the stored break has expired, reset the session
    if (breakEndTime < new Date()) {
      resetBreak();
    } else {
      returnTimeEl.innerText = `Return at: ${breakEndTime.toLocaleTimeString()}`;
      statusEl.innerText = "Resuming break...";
      // Recover and display the stored start time
      const storedBreakStart = localStorage.getItem('breakStarted');
      if (storedBreakStart) {
        startTimeEl.innerText = `Started at: ${new Date(storedBreakStart).toLocaleTimeString()}`;
      }
      updateCountdown();
      timerInterval = setInterval(updateCountdown, 1000);

      // Compute remaining time until alarm trigger point
      const now = new Date();
      const alarmTriggerTime = breakEndTime.getTime() - 2 * 60000;
      const timeUntilAlarm = alarmTriggerTime - now.getTime();
      if (timeUntilAlarm > 0) {
        alarmTimeout = setTimeout(triggerAlarm, timeUntilAlarm);
      }
    }
  }
});
