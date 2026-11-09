
const STORAGE_KEY = "my-progress-tracker-v1";

const today = new Date();
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultGoals = [
  { id: "walking", name: "Walking", type: "walking", active: true },
  { id: "dancing", name: "Dancing", type: "dancing", active: true }
];

let state = {
  selectedDate: formatDateKey(today),
  displayedMonth: today.getMonth(),
  displayedYear: today.getFullYear(),
  goals: [...defaultGoals],
  days: {}
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    }
  } catch (error) {
    console.warn("Could not load saved tracker data:", error);
  }

  if (!Array.isArray(state.goals)) {
    state.goals = [...defaultGoals];
  }

  if (!state.days || typeof state.days !== "object") {
    state.days = {};
  }

  if (!state.days[state.selectedDate]) {
    state.days[state.selectedDate] = {};
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    alert("Your browser could not save this entry. Please check your browser storage settings.");
    console.error(error);
  }
}

function getDayData(date = state.selectedDate) {
  if (!state.days[date]) {
    state.days[date] = {
      walkingSteps: "",
      walkingCompleted: false,
      walkingTarget: 8000,
      dancing: "",
      customGoals: {},
      schedule: []
    };
  }

  const day = state.days[date];

  if (!Array.isArray(day.schedule)) day.schedule = [];
  if (!day.customGoals) day.customGoals = {};
  if (day.walkingTarget == null) day.walkingTarget = 8000;

  return day;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatLongDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatMonth(year, month) {
  return new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });
}

/* CALENDAR */

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const monthLabel = document.getElementById("month-label");

  if (!grid || !monthLabel) return;

  monthLabel.textContent = formatMonth(
    state.displayedYear,
    state.displayedMonth
  );

  grid.innerHTML = "";

  const firstDay = new Date(
    state.displayedYear,
    state.displayedMonth,
    1
  );

  // Monday-first calendar
  const startingOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    state.displayedYear,
    state.displayedMonth + 1,
    0
  ).getDate();

  const previousMonthDays = new Date(
    state.displayedYear,
    state.displayedMonth,
    0
  ).getDate();

  for (let cell = 0; cell < 42; cell++) {
    let date;
    let outsideMonth = false;

    if (cell < startingOffset) {
      date = new Date(
        state.displayedYear,
        state.displayedMonth - 1,
        previousMonthDays - startingOffset + cell + 1
      );
      outsideMonth = true;
    } else if (cell >= startingOffset + daysInMonth) {
      date = new Date(
        state.displayedYear,
        state.displayedMonth + 1,
        cell - startingOffset - daysInMonth + 1
      );
      outsideMonth = true;
    } else {
      date = new Date(
        state.displayedYear,
        state.displayedMonth,
        cell - startingOffset + 1
      );
    }

    const dateKey = formatDateKey(date);
    const dayData = state.days[dateKey];

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = date.getDate();
    button.dataset.date = dateKey;
    button.setAttribute("aria-label", formatLongDate(date));

    if (outsideMonth) button.classList.add("outside-month");

    if (dateKey === formatDateKey(today)) {
      button.classList.add("today-day");
    }

    if (dateKey === state.selectedDate) {
      button.classList.add("selected-day");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    if (dayData && hasSavedProgress(dayData)) {
      const marker = document.createElement("span");
      marker.className = "calendar-progress-dot";
      marker.setAttribute("aria-hidden", "true");
      button.appendChild(marker);
    }

    button.addEventListener("click", () => {
      state.selectedDate = dateKey;
      state.displayedMonth = date.getMonth();
      state.displayedYear = date.getFullYear();
      saveState();
      renderAll();
    });

    grid.appendChild(button);
  }
}

function hasSavedProgress(day) {
  return (
    Number(day.walkingSteps) > 0 ||
    day.walkingCompleted === true ||
    day.dancing === "yes" ||
    day.dancing === "no" ||
    Object.values(day.customGoals || {}).some(Boolean) ||
    (day.schedule || []).length > 0
  );
}

function changeMonth(amount) {
  const newDate = new Date(
    state.displayedYear,
    state.displayedMonth + amount,
    1
  );

  state.displayedMonth = newDate.getMonth();
  state.displayedYear = newDate.getFullYear();

  renderCalendar();
}

/* DAILY PLANNER */

function renderPlanner() {
  const selectedLabel = document.getElementById("selected-date-label");
  const plannerTitle = document.getElementById("planner-title");

  if (selectedLabel) {
    selectedLabel.textContent = formatLongDate(state.selectedDate);
  }

  if (plannerTitle) {
    plannerTitle.textContent = "Your daily planner";
  }

  renderGoals();
  renderSchedule();
  updateProgress();
}

function renderGoals() {
  const container = document.getElementById("goals-container");
  if (!container) return;

  const day = getDayData();

  container.innerHTML = "";

  state.goals
    .filter(goal => goal.active !== false)
    .forEach(goal => {
      const card = document.createElement("div");
      card.className = "goal-card";

      if (goal.type === "walking") {
        card.innerHTML = `
          <div class="goal-card-heading">
            <div>
              <div class="goal-icon">🚶</div>
              <h3>Walking</h3>
              <p>Every step takes you forward.</p>
            </div>
          </div>

          <label for="walking-steps">Steps walked</label>
          <input
            id="walking-steps"
            type="number"
            min="0"
            placeholder="Enter your steps"
            value="${escapeHTML(day.walkingSteps ?? "")}"
          />

          <label for="walking-target">Daily step target</label>
          <input
            id="walking-target"
            type="number"
            min="1"
            value="${escapeHTML(day.walkingTarget)}"
          />

          <label class="goal-check-label">
            <input
              id="walking-complete"
              type="checkbox"
              ${day.walkingCompleted ? "checked" : ""}
            />
            Mark walking goal complete
          </label>

          <p id="walking-status" class="goal-status"></p>
        `;

        const stepsInput = card.querySelector("#walking-steps");
        const targetInput = card.querySelector("#walking-target");
        const completeInput = card.querySelector("#walking-complete");

        stepsInput.addEventListener("input", () => {
          day.walkingSteps = stepsInput.value;
          saveState();
          updateProgress();
          renderCalendar();
        });

        targetInput.addEventListener("change", () => {
          const target = Number(targetInput.value);
          if (target > 0) {
            day.walkingTarget = target;
            saveState();
            updateProgress();
          } else {
            targetInput.value = day.walkingTarget;
          }
        });

        completeInput.addEventListener("change", () => {
          day.walkingCompleted = completeInput.checked;
          saveState();
          updateProgress();
          renderCalendar();
        });

        container.appendChild(card);

        const status = card.querySelector("#walking-status");
        status.textContent = `${Number(day.walkingSteps || 0).toLocaleString("en-IN")} / ${Number(day.walkingTarget).toLocaleString("en-IN")} steps`;
      } else if (goal.type === "dancing") {
        card.innerHTML = `
          <div class="goal-card-heading">
            <div>
              <div class="goal-icon">💃</div>
              <h3>Dancing</h3>
              <p>Did you dance today?</p>
            </div>
          </div>

          <div class="dance-options">
            <button type="button" data-dance="yes"
              class="${day.dancing === "yes" ? "active" : ""}">
              Yes!
            </button>
            <button type="button" data-dance="no"
              class="${day.dancing === "no" ? "active" : ""}">
              Not today
            </button>
          </div>

          <p id="dancing-status" class="goal-status">
            ${day.dancing === "yes" ? "Lovely! You did it today ✨" :
              day.dancing === "no" ? "That's okay. There's always tomorrow." :
              "Choose an option to record your day."}
          </p>
        `;

        card.querySelectorAll("[data-dance]").forEach(button => {
          button.addEventListener("click", () => {
            day.dancing = button.dataset.dance;
            saveState();
            renderAll();
          });
        });

        container.appendChild(card);
      } else {
        const completed = Boolean(day.customGoals[goal.id]);

        card.innerHTML = `
          <div class="goal-card-heading">
            <div>
              <div class="goal-icon">⭐</div>
              <h3>${escapeHTML(goal.name)}</h3>
            </div>
          </div>

          <label class="goal-check-label">
            <input type="checkbox" class="custom-goal-check"
              ${completed ? "checked" : ""} />
            Mark as complete
          </label>

          <div class="goal-actions">
            <button type="button" class="edit-goal-btn">Edit</button>
            <button type="button" class="delete-goal-btn">Delete</button>
          </div>
        `;

        card.querySelector(".custom-goal-check").addEventListener("change", event => {
          day.customGoals[goal.id] = event.target.checked;
          saveState();
          updateProgress();
          renderCalendar();
        });

        card.querySelector(".edit-goal-btn").addEventListener("click", () => {
          const newName = prompt("Enter the new goal name:", goal.name);
          if (newName && newName.trim()) {
            goal.name = newName.trim();
            saveState();
            renderAll();
          }
        });

        card.querySelector(".delete-goal-btn").addEventListener("click", () => {
          if (confirm(`Remove "${goal.name}" from your goals?`)) {
            goal.active = false;
            saveState();
            renderAll();
          }
        });

        container.appendChild(card);
      }
    });
}

function addGoal() {
  const name = prompt("What goal would you like to add?");
  if (!name || !name.trim()) return;

  const goal = {
    id: `goal-${Date.now()}`,
    name: name.trim(),
    type: "custom",
    active: true
  };

  state.goals.push(goal);
  saveState();
  renderAll();
}

/* DAILY TIMETABLE */

function renderSchedule() {
  const container = document.getElementById("daily-schedule");
  const emptyMessage = document.getElementById("empty-schedule");

  if (!container) return;

  const day = getDayData();

  container.innerHTML = "";

  const activities = [...day.schedule].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  if (emptyMessage) {
    emptyMessage.style.display = activities.length ? "none" : "block";
  }

  activities.forEach(activity => {
    const item = document.createElement("div");
    item.className = "schedule-item";

    item.innerHTML = `
      <div class="schedule-time">${escapeHTML(activity.time)}</div>
      <div class="schedule-details">
        <span class="${activity.completed ? "activity-completed" : ""}">
          ${escapeHTML(activity.name)}
        </span>
      </div>
      <div class="schedule-actions">
        <label title="Mark complete">
          <input type="checkbox" class="activity-check"
            ${activity.completed ? "checked" : ""} />
        </label>
        <button type="button" class="activity-edit">Edit</button>
        <button type="button" class="activity-delete">Delete</button>
      </div>
    `;

    item.querySelector(".activity-check").addEventListener("change", event => {
      activity.completed = event.target.checked;
      saveState();
      renderSchedule();
      updateProgress();
      renderCalendar();
    });

    item.querySelector(".activity-edit").addEventListener("click", () => {
      const newName = prompt("Edit activity name:", activity.name);
      if (!newName || !newName.trim()) return;

      const newTime = prompt("Enter time (HH:MM, 24-hour format):", activity.time);
      if (!newTime || !isValidTime(newTime)) {
        alert("Please enter a valid time, for example 09:30 or 18:00.");
        return;
      }

      activity.name = newName.trim();
      activity.time = newTime;
      saveState();
      renderAll();
    });

    item.querySelector(".activity-delete").addEventListener("click", () => {
      if (confirm(`Delete "${activity.name}" from this day?`)) {
        day.schedule = day.schedule.filter(entry => entry.id !== activity.id);
        saveState();
        renderAll();
      }
    });

    container.appendChild(item);
  });
}

function isValidTime(time) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function addActivity() {
  const name = prompt("What activity would you like to add?");
  if (!name || !name.trim()) return;

  const time = prompt("What time? Use 24-hour format, for example 09:30 or 18:00.");
  if (!time || !isValidTime(time)) {
    alert("Please enter a valid time in HH:MM format.");
    return;
  }

  const day = getDayData();

  day.schedule.push({
    id: `activity-${Date.now()}`,
    name: name.trim(),
    time,
    completed: false
  });

  saveState();
  renderAll();
}

/* PROGRESS SUMMARY */

function updateProgress() {
  const day = getDayData();

  const activeGoals = state.goals.filter(goal => goal.active !== false);

  let completed = 0;
  let total = activeGoals.length + day.schedule.length;

  activeGoals.forEach(goal => {
    if (goal.type === "walking" && day.walkingCompleted) {
      completed++;
    } else if (goal.type === "dancing" && day.dancing === "yes") {
      completed++;
    } else if (goal.type === "custom" && day.customGoals[goal.id]) {
      completed++;
    }
  });

  day.schedule.forEach(activity => {
    if (activity.completed) completed++;
  });

  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const countElement = document.getElementById("progress-count");
  const messageElement = document.getElementById("progress-message");
  const percentageElement = document.getElementById("progress-percentage");

  if (countElement) countElement.textContent = `${completed} / ${total}`;
  if (percentageElement) percentageElement.textContent = `${percentage}%`;

  if (messageElement) {
    if (percentage === 100 && total > 0) {
      messageElement.textContent = "Wonderful! You completed everything today ✨";
    } else if (completed > 0) {
      messageElement.textContent = "You're making progress. Keep going!";
    } else {
      messageElement.textContent = "Every small step counts. Start whenever you're ready.";
    }
  }
}

/* BUTTONS AND INITIALIZATION */

function renderAll() {
  renderCalendar();
  renderPlanner();
}

function initializeTracker() {
  loadState();

  document.getElementById("prev-month")?.addEventListener("click", () => {
    changeMonth(-1);
  });

  document.getElementById("next-month")?.addEventListener("click", () => {
    changeMonth(1);
  });

  document.getElementById("today-button")?.addEventListener("click", () => {
    state.selectedDate = formatDateKey(today);
    state.displayedMonth = today.getMonth();
    state.displayedYear = today.getFullYear();
    saveState();
    renderAll();
  });

  document.getElementById("add-goal-btn")?.addEventListener("click", addGoal);
  document.getElementById("add-activity-btn")?.addEventListener("click", addActivity);

  renderAll();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  }
}

document.addEventListener("DOMContentLoaded", initializeTracker);
