// Global variable to manage the notification timeout
let notificationTimeoutId = null;

// Update the current time every second
function updateCurrentTime() {
  const now = new Date();
  document.getElementById('current-time').textContent = now.toLocaleTimeString();
}

updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Event listeners for the buttons
document.getElementById('start-break-btn').addEventListener('click', startBreak);
document.getElementById('reset-btn').addEventListener('click', resetBreak);

// Function to start the break
function startBreak() {
  const breakStart = new Date();
  document.getElementById('break-start-time').textContent = breakStart.toLocaleTimeString();

  // Define break duration (30 minutes) and compute return time
  const breakDurationMinutes = 30;
  const returnTime = new Date(breakStart.getTime() + breakDurationMinutes * 60000);
  document.getElementById('return-time').textContent = returnTime.toLocaleTimeString();

  // Save break data in localStorage for persistence
  const breakData = {
    breakStart: breakStart.getTime(),
    returnTime: returnTime.getTime()
  };
  localStorage.setItem("breakData", JSON.stringify(breakData));

  // Schedule a notification alarm (2 minutes before return time)
  const notificationTime = new Date(returnTime.getTime() - 2 * 60000);
  const now = new Date();
  const delay = notificationTime.getTime() - now.getTime();

  if (delay > 0) {
    document.getElementById('notification').textContent = "Reminder set for " + notificationTime.toLocaleTimeString();
    notificationTimeoutId = setTimeout(triggerNotification, delay);
  } else {
    triggerNotification();
  }
}

// Function to trigger the 2-minute notification reminder
function triggerNotification() {
  document.getElementById('notification').textContent = "Break ends in 2 minutes!";
  // For demonstration: a simple alert
  alert("Your break ends in 2 minutes!");
}

// Function to check and load break data upon page refresh
function loadBreakData() {
  const storedData = localStorage.getItem("breakData");
  if (storedData) {
    const data = JSON.parse(storedData);
    const breakStart = new Date(data.breakStart);
    const returnTime = new Date(data.returnTime);
    const now = new Date();

    // If the break has already ended, clear the saved data
    if (returnTime <= now) {
      clearLocalBreakData();
    } else {
      document.getElementById('break-start-time').textContent = breakStart.toLocaleTimeString();
      document.getElementById('return-time').textContent = returnTime.toLocaleTimeString();

      const notificationTime = new Date(returnTime.getTime() - 2 * 60000);
      if (notificationTime > now) {
        document.getElementById('notification').textContent = "Reminder set for " + notificationTime.toLocaleTimeString();
        const delay = notificationTime.getTime() - now.getTime();
        notificationTimeoutId = setTimeout(triggerNotification, delay);
      } else {
        triggerNotification();
      }
    }
  }
}

// Utility function to clear break data from localStorage and reset UI labels
function clearLocalBreakData() {
  localStorage.removeItem("breakData");
  if (notificationTimeoutId) {
    clearTimeout(notificationTimeoutId);
    notificationTimeoutId = null;
  }
  document.getElementById('break-start-time').textContent = "--:--:--";
  document.getElementById('return-time').textContent = "--:--:--";
  document.getElementById('notification').textContent = "No active reminder";
}

// Handler for the Reset button: clears localStorage and resets the UI
function resetBreak() {
  clearLocalBreakData();
  alert("Break data has been reset.");
}

// On page load, try to restore any previously saved break data
loadBreakData();
