
/* ==========================================
   MY PROGRESS
   ENCHANTED FAIRYTALE APP
   Main JavaScript — Version 1
========================================== */


/* 1. APPLICATION STATE */

const appState = {
    selectedDate: new Date(),
    displayedMonth: new Date().getMonth(),
    displayedYear: new Date().getFullYear()
};


/* 2. DATE FORMATTING */

function formatDate(date) {
    return date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


/* 3. UPDATE THE SELECTED DATE */

function updateSelectedDate() {
    const dateElement = document.getElementById("current-date");

    if (!dateElement) return;

    dateElement.textContent = formatDate(appState.selectedDate);
}


/* 4. CALENDAR GENERATOR */

function renderCalendar() {
    const calendar = document.getElementById("calendar-container");

    if (!calendar) return;

    const year = appState.displayedYear;
    const month = appState.displayedMonth;

    const firstDay = new Date(year, month, 1).getDay();

    // Convert Sunday-first to Monday-first
    const startingDay = (firstDay + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthName = new Date(year, month, 1)
        .toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

    let calendarHTML = `
        <div class="calendar-header">

            <button
                class="calendar-nav"
                id="previous-month"
                aria-label="Previous month">
                ❮
            </button>

            <h3>${monthName}</h3>

            <button
                class="calendar-nav"
                id="next-month"
                aria-label="Next month">
                ❯
            </button>

        </div>

        <div class="calendar-grid">

    `;

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    weekdays.forEach(day => {
        calendarHTML += `
            <div class="calendar-weekday">
                ${day}
            </div>
        `;
    });

    // Empty spaces before the first day
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += `<div class="calendar-empty"></div>`;
    }

    // Generate the days
    for (let day = 1; day <= daysInMonth; day++) {

        const isSelected =
            appState.selectedDate.getFullYear() === year &&
            appState.selectedDate.getMonth() === month &&
            appState.selectedDate.getDate() === day;

        const today = new Date();

        const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;

        calendarHTML += `
            <button
                class="calendar-day
                ${isSelected ? "selected-day" : ""}
                ${isToday ? "today-day" : ""}"
                data-day="${day}"
                aria-pressed="${isSelected}"
                aria-label="${formatDate(new Date(year, month, day))}">

                ${day}

            </button>
        `;
    }

    calendarHTML += `</div>`;

    calendar.innerHTML = calendarHTML;

    // Previous month
    document.getElementById("previous-month")
        .addEventListener("click", () => {

            appState.displayedMonth--;

            if (appState.displayedMonth < 0) {
                appState.displayedMonth = 11;
                appState.displayedYear--;
            }

            renderCalendar();
        });

    // Next month
    document.getElementById("next-month")
        .addEventListener("click", () => {

            appState.displayedMonth++;

            if (appState.displayedMonth > 11) {
                appState.displayedMonth = 0;
                appState.displayedYear++;
            }

            renderCalendar();
        });

    // Select a particular day
    calendar.querySelectorAll(".calendar-day")
        .forEach(button => {

            button.addEventListener("click", () => {

                const selectedDay = Number(button.dataset.day);

                appState.selectedDate = new Date(
                    year,
                    month,
                    selectedDay
                );

                updateSelectedDate();
                renderCalendar();

            });

        });
}


/* 5. APPLICATION INITIALIZATION */

function initializeApp() {

    updateSelectedDate();

    renderCalendar();

    // Register offline support when available
    if ("serviceWorker" in navigator) {

        window.addEventListener("load", () => {

            navigator.serviceWorker.register("./sw.js")
                .catch(error => {
                    console.error(
                        "Offline support registration failed:",
                        error
                    );
                });

        });

    }

    console.log("✨ My Progress application initialized!");
}


/* 6. START THE APPLICATION */

document.addEventListener("DOMContentLoaded", initializeApp);
