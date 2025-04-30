document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const startButton = document.getElementById("startButton");
  const resetButton = document.getElementById("resetButton");
  const statusMessage = document.getElementById("statusMessage");
  const returnTimeDisplay = document.getElementById("returnTimeDisplay");
  const countdownDisplay = document.getElementById("countdownDisplay");

  let breakTimerInterval;
  let alarmTimeout;

  // Request Notification permissions, if available
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Check localStorage for an ongoing break session
  const storedReturnTime = localStorage.getItem("returnTime");
  if (storedReturnTime) {
    const returnTime = new Date(storedReturnTime);
    const now = new Date();
    if (returnTime > now) {
      statusMessage.textContent = "Your break is in progress.";
      returnTimeDisplay.textContent = "Return Time: " + returnTime.toLocaleTimeString();
      startCountdown(returnTime);
      scheduleAlarm(returnTime);
    } else {
      localStorage.removeItem("returnTime");
    }
  }

  // Start Break: Compute return time (30min later), start countdown and schedule alarm
  startButton.addEventListener("click", () => {
    clearExistingTimers();
    const now = new Date();
    // Calculate return time: 30 minutes later
    const returnTime = new Date(now.getTime() + 30 * 60000);
    localStorage.setItem("returnTime", returnTime);
    statusMessage.textContent = "Break started! Enjoy your 30-minute break.";
    returnTimeDisplay.textContent = "Return Time: " + returnTime.toLocaleTimeString();
    startCountdown(returnTime);
    scheduleAlarm(returnTime);
  });

  // Reset Break: Clear timers, stored data, and UI displays
  resetButton.addEventListener("click", () => {
    clearExistingTimers();
    localStorage.removeItem("returnTime");
    statusMessage.textContent = "Break reset. Press 'Start Break' to begin your break.";
    returnTimeDisplay.textContent = "";
    countdownDisplay.textContent = "";
  });

  // Clears interval and timeout if they exist.
  function clearExistingTimers() {
    if (breakTimerInterval) {
      clearInterval(breakTimerInterval);
      breakTimerInterval = null;
    }
    if (alarmTimeout) {
      clearTimeout(alarmTimeout);
      alarmTimeout = null;
    }
  }

  // Start a countdown timer that updates every second.
  function startCountdown(returnTime) {
    // Clear any previous countdown
    if (breakTimerInterval) {
      clearInterval(breakTimerInterval);
    }

    breakTimerInterval = setInterval(() => {
      const now = new Date();
      const diff = returnTime - now;

      if (diff <= 0) {
        clearInterval(breakTimerInterval);
        countdownDisplay.textContent = "Break over!";
        statusMessage.textContent = "Your break has ended.";
        localStorage.removeItem("returnTime");
      } else {
        // Compute remaining minutes and seconds
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        countdownDisplay.textContent = `Time remaining: ${minutes}m ${seconds}s`;
      }
    }, 1000);
  }

  // Schedules an alarm for 2 minutes before the break ends.
  function scheduleAlarm(returnTime) {
    const now = new Date();
    // Alarm time: 2 minutes before break end
    const alarmTime = new Date(returnTime.getTime() - 2 * 60000);
    const timeUntilAlarm = alarmTime - now;

    if (timeUntilAlarm > 0) {
      alarmTimeout = setTimeout(triggerAlarm, timeUntilAlarm);
    }
  }

  // Trigger the alarm: plays sound, vibrates, and shows a notification or alert.
  function triggerAlarm() {
    // Vibrate (if supported)
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Play an alarm sound using an MP3 file.
    const alarmAudio = new Audio('alarm.mp3');
    alarmAudio.play().catch(error => {
      console.error("Error playing sound:", error);
    });

    // If Notifications are supported and permission was granted, show one.
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Break Ending Soon", {
        body: "Your break will end in 2 minutes!",
        icon: "icon.png" // Optionally include an icon file
      });
    } else {
      // Fallback to an alert popup.
      alert("Reminder: Your break will end in 2 minutes!");
    }
  }
});
