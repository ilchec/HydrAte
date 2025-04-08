// Constants
const DEFAULT_SETTINGS = {
  trackWeight: true,
  trackWaterNorm: true,
  trackSweets: true,
  trackActivities: true,
  trackRegularMedications: true,
  trackOccasionalMedications: true,
  trackExercises: true,
};

const DEFAULT_MEMBER = {
  name: "",
  weight: "",
  waterNorm: "",
  sweets: [],
  activity: [],
  exercises: [],
  medications: { regular: [], occasional: [] },
  settings: { ...DEFAULT_SETTINGS },
};

const ICONS = {
  waterFilled: "images/glass-of-water.png",
  waterEmpty: "images/glass-of-water-empty.png",
  medicineFilled: "images/medicine-filled.png",
  medicineEmpty: "images/medicine.png",
};

// Global Variables
let currentMember = null;
let config = { members: [] };
let measures = {};

// --- Initialization ---
function loadConfig() {
  const savedConfig = localStorage.getItem("config");
  const savedMeasures = localStorage.getItem("measures");

  config = savedConfig ? JSON.parse(savedConfig) : { members: [] };
  measures = savedMeasures ? JSON.parse(savedMeasures) : {};

  if (!config.members || config.members.length === 0) {
    renderSettings();
  } else {
    initApp();
  }
}

function saveConfig() {
  localStorage.setItem("config", JSON.stringify(config));
}

function saveMeasures() {
  localStorage.setItem("measures", JSON.stringify(measures));
}

// --- App Initialization ---
function initApp() {
  if (config.members.length === 0) {
    currentMember = null;
    document.getElementById("content").innerHTML =
      "<p>No members available. Please configure the app in the settings.</p>";
    return;
  }

  currentMember = config.members[0];
  ensureTodayRecordExists();
  renderDiary(currentMember);
}

function ensureTodayRecordExists() {
  const today = new Date().toISOString().split("T")[0];
  if (!measures[today]) measures[today] = {};
  if (!measures[today][currentMember.name]) {
    measures[today][currentMember.name] = createDefaultDailyRecord();
    saveMeasures();
  }
}

function createDefaultDailyRecord() {
  return {
    water: 0,
    sweets: [],
    regularMedications: currentMember.medications.regular.map((med) => ({
      name: med.name || "",
      dose: med.dose || "",
      taken: false,
    })),
    occasionalMedications: currentMember.medications.occasional
      .filter((med) => med.name && med.dose) // Filter out invalid entries
      .map((med) => ({
        name: med.name,
        dose: med.dose,
      })),
    activity: [],
    exercises: currentMember.exercises.map((ex) => ({
      name: ex.name,
      actualReps: Array(ex.reps.length).fill(0), // Initialize reps for each exercise
    })),
    weight: currentMember.weight,
    note: "",
  };
}

function ensureTodayRecordExists() {
  const today = new Date().toISOString().split("T")[0];
  if (!measures[today]) measures[today] = {};
  if (!measures[today][currentMember.name]) {
    measures[today][currentMember.name] = createDefaultDailyRecord();
    saveMeasures();
  }
}

// --- Settings ---
function renderSettings() {
  const content = document.getElementById("content");
  const member = config.members[0] || { ...DEFAULT_MEMBER };

  content.innerHTML = `
    <h2>Settings</h2>
    <p>Update your settings below:</p>
    ${renderMemberSettings(member)}
    ${renderTrackersSettings(member)}
    <div id="saveButton" class="button-100" onclick="saveSettings()">Save Changes</div>
  `;

  addSettingsEventListeners();
}

function renderMemberSettings(member) {
  return `
    <div class="section">
      <label for="memberName"><strong>Member Name:</strong></label>
      <input type="text" id="memberName" value="${member.name}" placeholder="Enter name" />
    </div>
    <div class="section">
      <label class="flex-label">
        <input type="checkbox" id="trackWeight" ${member.settings.trackWeight ? "checked" : ""} />
        <strong>Track Weight</strong>
      </label>
      <input type="number" id="memberWeight" value="${member.weight}" placeholder="Enter weight" ${member.settings.trackWeight ? "" : "style='display: none;'"} />
    </div>
    <div class="section">
      <label class="flex-label">
        <input type="checkbox" id="trackWaterNorm" ${member.settings.trackWaterNorm ? "checked" : ""} />
        <strong>Track Daily Water Norm</strong>
      </label>
      <input type="number" id="waterNorm" value="${member.waterNorm}" placeholder="Enter water norm" ${member.settings.trackWaterNorm ? "" : "style='display: none;'"} />
    </div>
  `;
}

function renderTrackersSettings(member) {
  return `
    <div class="section">
      <label class="flex-label">
        <input type="checkbox" id="trackSweets" ${member.settings.trackSweets ? "checked" : ""} />
        <strong>Track Sweets</strong>
      </label>
      <div id="sweetsContainer" ${member.settings.trackSweets ? "" : "style='display: none;'"} >
        ${member.sweets
          .map(
            (sweet) => `
          <div class="input-group">
            <input type="text" value="${sweet}" placeholder="Enter sweet" />
            <button class="remove-button" onclick="removeParent(this)">X</button>
          </div>
        `
          )
          .join("")}
      </div>
      <button onclick="addSweets()" ${member.settings.trackSweets ? "" : "style='display: none;'"}>+ Add Sweet</button>
    </div>
    <div class="section">
      <label class="flex-label">
        <input type="checkbox" id="trackActivities" ${member.settings.trackActivities ? "checked" : ""} />
        <strong>Track Activities</strong>
      </label>
      <div id="activitiesContainer" ${member.settings.trackActivities ? "" : "style='display: none;'"} >
        ${member.activity
          .map(
            (activity) => `
          <div class="input-group">
            <input type="text" value="${activity.name}" placeholder="Activity Name" />
            <input type="text" value="${activity.details}" placeholder="Details" />
            <button class="remove-button" onclick="removeParent(this)">X</button>
          </div>
        `
          )
          .join("")}
      </div>
      <button onclick="addActivities()" ${member.settings.trackActivities ? "" : "style='display: none;'"}>+ Add Activity</button>
    </div>
    <div class="section">
      <label class="flex-label">
        <input type="checkbox" id="trackRegularMedications" ${member.settings.trackRegularMedications ? "checked" : ""} />
        <strong>Track Regular Medications</strong>
      </label>
      <div id="regularMedicationsContainer" ${member.settings.trackRegularMedications ? "" : "style='display: none;'"} >
        ${member.medications.regular
          .map(
            (med) => `
          <div class="input-group">
            <input type="text" value="${med.name}" placeholder="Medication Name" />
            <input type="text" value="${med.dose}" placeholder="Dose" />
            <button class="remove-button" onclick="removeParent(this)">X</button>
          </div>
        `
          )
          .join("")}
      </div>
      <button onclick="addRegularMedications()" ${member.settings.trackRegularMedications ? "" : "style='display: none;'"}>+ Add Medication</button>
    </div>
    <div class="section">
      <label class="flex-label">
        <input type="checkbox" id="trackOccasionalMedications" ${member.settings.trackOccasionalMedications ? "checked" : ""} />
        <strong>Track Occasional Medications</strong>
      </label>
      <div id="occasionalMedicationsContainer" ${member.settings.trackOccasionalMedications ? "" : "style='display: none;'"} >
        ${member.medications.occasional
          .map(
            (med) => `
          <div class="input-group">
            <input type="text" value="${med}" placeholder="Medication Name" />
            <button class="remove-button" onclick="removeParent(this)">X</button>
          </div>
        `
          )
          .join("")}
      </div>
      <button onclick="addOccasionalMedications()" ${member.settings.trackOccasionalMedications ? "" : "style='display: none;'"}>+ Add Medication</button>
    </div>
    <div class="section">
      <label class="flex-label">
        <input type="checkbox" id="trackExercises" ${member.settings.trackExercises ? "checked" : ""} />
        <strong>Track Exercises</strong>
      </label>
      <div id="exercisesContainer" ${member.settings.trackExercises ? "" : "style='display: none;'"} >
        ${member.exercises
          .map(
            (exercise) => `
          <div class="exercise-entry">
            <input type="text" value="${exercise.name}" placeholder="Exercise Name" />
            <div class="sets-container">
              ${exercise.reps
                .map(
                  (rep) => `
                <div class="input-group">
                  <input type="number" value="${rep}" placeholder="Reps" />
                  <button class="remove-button" onclick="removeParent(this)">X</button>
                </div>
              `
                )
                .join("")}
            </div>
            <button onclick="addSet(this)">+ Add Set</button>
            <button class="remove-button button-100" onclick="removeParent(this)">Remove Exercise</button>
          </div>
        `
          )
          .join("")}
      </div>
      <button onclick="addExercises()" ${member.settings.trackExercises ? "" : "style='display: none;'"}>+ Add Exercise</button>
    </div>
  `;
}

function addSettingsEventListeners() {
  document.getElementById("trackWeight").addEventListener("change", toggleSectionVisibility);
  document.getElementById("trackWaterNorm").addEventListener("change", toggleSectionVisibility);
  document.getElementById("trackSweets").addEventListener("change", toggleSectionVisibility);
  document.getElementById("trackActivities").addEventListener("change", toggleSectionVisibility); // Add this line
  document.getElementById("trackRegularMedications").addEventListener("change", toggleSectionVisibility);
  document.getElementById("trackOccasionalMedications").addEventListener("change", toggleSectionVisibility);
  document.getElementById("trackExercises").addEventListener("change", toggleSectionVisibility);
}

function saveSettings() {
  const name = document.getElementById("memberName").value.trim();
  const weight = document.getElementById("trackWeight").checked
    ? parseFloat(document.getElementById("memberWeight").value)
    : null;
  const waterNorm = document.getElementById("trackWaterNorm").checked
    ? parseInt(document.getElementById("waterNorm").value)
    : null;

  const sweets = document.getElementById("trackSweets").checked
    ? Array.from(document.querySelectorAll("#sweetsContainer .input-group input"))
        .map((input) => input.value.trim())
        .filter((value) => value)
    : [];

  const activities = document.getElementById("trackActivities").checked
    ? Array.from(document.querySelectorAll("#activitiesContainer .input-group"))
        .map((group) => ({
          name: group.querySelector("input:nth-of-type(1)").value.trim(),
          details: group.querySelector("input:nth-of-type(2)").value.trim(),
        }))
        .filter((activity) => activity.name)
    : [];

  const regularMedications = document.getElementById("trackRegularMedications").checked
    ? Array.from(document.querySelectorAll("#regularMedicationsContainer .input-group"))
        .map((group) => ({
          name: group.querySelector("input:nth-of-type(1)").value.trim(),
          dose: group.querySelector("input:nth-of-type(2)").value.trim(),
        }))
        .filter((med) => med.name)
    : [];

  const occasionalMedications = document.getElementById("trackOccasionalMedications").checked
    ? Array.from(document.querySelectorAll("#occasionalMedicationsContainer .input-group input"))
        .map((input) => input.value.trim())
        .filter((value) => value)
    : [];

  const exercises = document.getElementById("trackExercises").checked
    ? Array.from(document.querySelectorAll("#exercisesContainer .exercise-entry"))
        .map((entry) => ({
          name: entry.querySelector("input[type='text']").value.trim(),
          reps: Array.from(entry.querySelectorAll(".sets-container input"))
            .map((input) => parseInt(input.value))
            .filter((value) => !isNaN(value)),
        }))
        .filter((exercise) => exercise.name)
    : [];

  config.members = [
    {
      ...DEFAULT_MEMBER,
      name,
      weight,
      waterNorm,
      sweets,
      activity: activities,
      medications: {
        regular: regularMedications,
        occasional: occasionalMedications,
      },
      exercises,
      settings: {
        trackWeight: document.getElementById("trackWeight").checked,
        trackWaterNorm: document.getElementById("trackWaterNorm").checked,
        trackSweets: document.getElementById("trackSweets").checked,
        trackActivities: document.getElementById("trackActivities").checked,
        trackRegularMedications: document.getElementById("trackRegularMedications").checked,
        trackOccasionalMedications: document.getElementById("trackOccasionalMedications").checked,
        trackExercises: document.getElementById("trackExercises").checked,
      },
    },
  ];

  saveConfig();
  alert("Settings saved!");
  initApp();
}

// --- Diary ---
function renderDiary(member) {
  const content = document.getElementById("content");
  const today = new Date().toISOString().split("T")[0];
  let html = ``;

  const allDates = Object.keys(measures)
    .filter((date) => measures[date][member.name])
    .sort((a, b) => new Date(b) - new Date(a));

  allDates.forEach((date) => {
    const open = openAccordions[date] ? "open" : "";
    const data = measures[date]?.[member.name] || {};
    html += renderDiaryEntry(date, data, member, open);
  });

  content.innerHTML = html;
}

function renderDiaryEntry(date, data, member, open) {
  return `
    <div class="accordion ${open}" data-date="${date}">
      <div class="accordion-header" data-accordion-header onclick="toggleAccordion(event)">${date}</div>
      <div class="accordion-content">
        ${renderDiaryWeight(data, member, date)}
        ${renderDiaryWater(data, member, date)}
        ${renderDiarySweets(data, member, date)}
        ${renderDiaryActivities(data, member, date)}
        ${renderDiaryRegularMedications(data, member, date)}
        ${renderDiaryOccasionalMedications(data, member, date)}
        ${renderDiaryExercises(data, member, date)}
      </div>
    </div>
  `;
}

function renderDiaryRegularMedications(data, member, date) {
  if (!member.settings.trackRegularMedications) return "";
  return `
    <div class="section">
      <strong>Regular Medications:</strong>
      <div id="regularMedicationsContainer-${date}">
        ${(data.regularMedications || []).map((med) => `
          <div class="input-group">
            <img 
              src="${med.taken ? ICONS.medicineFilled : ICONS.medicineEmpty}" 
              class="medicine" 
              onclick="toggleRegularMedication('${date}', '${member.name}', '${med.name}', event)"
              alt="Medicine Checkbox"
            />
            <span>${med.name} (${med.dose})</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderDiaryOccasionalMedications(data, member, date) {
  if (!member.settings.trackOccasionalMedications) return "";
  return `
    <div class="section">
      <strong>Occasional Medications:</strong>
      <div id="occasionalMedicationsContainer-${date}">
        ${(data.occasionalMedications || []).map((med, i) => `
          <div class="input-group">
            <input type="text" value="${med.name}" placeholder="Medication Name" list="occasionalMedicationsList-${date}" onchange="updateOccasionalMedication('${date}', '${member.name}', ${i}, 'name', this.value)" />
            <input type="text" class="input-45" value="${med.dose}" placeholder="Dose" onchange="updateOccasionalMedication('${date}', '${member.name}', ${i}, 'dose', this.value)" />
            <button class="remove-button" onclick="removeOccasionalMedication('${date}', '${member.name}', ${i})">X</button>
          </div>
        `).join("")}
      </div>
      <datalist id="occasionalMedicationsList-${date}">
        ${config.members[0].medications.occasional.map((med) => `<option value="${med}">`).join("")}
      </datalist>
      <button onclick="addMedicationEntry('${date}', event)">+ Add More</button>
    </div>
  `;
}

function renderDiaryExercises(data, member, date) {
  if (!member.settings.trackExercises) return "";
  return `
    <div class="section">
      <strong>Exercises:</strong>
      ${member.exercises.map((exercise, i) => `
        <div class="exercise-entry">
          <strong>${exercise.name}</strong>
          ${exercise.reps.map((rep, j) => `
            <div class="input-group">
              <input type="number" value="${data.exercises?.[i]?.actualReps?.[j] || ""}" 
                     placeholder="Actual Reps" 
                     onchange="saveExerciseReps('${date}', '${member.name}', ${i}, ${j}, this.value)" />
              <span class="input-45">(Base: ${rep})</span>
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function renderDiaryWeight(data, member, date) {
  if (!member.settings.trackWeight) return "";
  return `
    <div class="section">
      <strong>Weight:</strong>
      <input type="number" class="input-45" value="${data.weight || member.weight}" onchange="saveWeight(this.value, '${date}', '${member.name}')" />
    </div>
  `;
}

function renderDiaryWater(data, member, date) {
  if (!member.settings.trackWaterNorm) return "";
  return `
    <div class="section">
      <strong>Water:</strong>
      ${Array.from({ length: member.waterNorm }, (_, i) => `
        <img 
          src="${i < (data.water || 0) ? ICONS.waterFilled : ICONS.waterEmpty}" 
          class="glass" 
          onclick="fillGlass(this, ${i + 1}, '${date}', '${member.name}')"
        />
      `).join("")}
    </div>
  `;
}

function renderDiarySweets(data, member, date) {
  if (!member.settings.trackSweets) return "";
  return `
    <div class="section">
      <strong>Sweets:</strong>
      <div id="sweetsContainer-${date}">
        ${(data.sweets || []).map((sweet, i) => `
          <div class="input-group">
            <input type="text" value="${sweet.name || ""}" placeholder="Sweet Name" list="sweetsList-${date}" onchange="updateSweet('${date}', '${member.name}', ${i}, this.value)" />
            <input type="number" class="input-45" value="${sweet.amount || ""}" placeholder="Amount" onchange="updateSweetAmount('${date}', '${member.name}', ${i}, this.value)" />
            <button class="remove-button" onclick="removeSweet('${date}', '${member.name}', ${i})">X</button>
          </div>
        `).join("")}
      </div>
      <datalist id="sweetsList-${date}">
        ${config.members[0].sweets.map((s) => `<option value="${s}">`).join("")}
      </datalist>
      <button onclick="addSweet('${date}', '${member.name}', event)">+ Add Sweet</button>
    </div>
  `;
}

function renderDiaryActivities(data, member, date) {
  if (!member.settings.trackActivities) return "";
  return `
    <div class="section">
      <strong>Activities:</strong>
      <div id="activitiesContainer-${date}">
        ${(data.activity || []).map((activity, i) => `
          <div class="input-group">
            <input type="text" value="${activity.name || ""}" placeholder="Activity Name" list="activitiesList-${date}" onchange="updateActivity('${date}', '${member.name}', ${i}, this.value)" />
            <input type="text" class="input-45" value="${activity.details || ""}" placeholder="Details" onchange="updateActivityDetails('${date}', '${member.name}', ${i}, this.value)" />
            <button class="remove-button" onclick="removeActivity('${date}', '${member.name}', ${i})">X</button>
          </div>
        `).join("")}
      </div>
      <datalist id="activitiesList-${date}">
        ${config.members[0].activity.map((a) => `<option value="${a.name}">`).join("")}
      </datalist>
      <button onclick="addActivity('${date}', '${member.name}', event)">+ Add Activity</button>
    </div>
  `;
}

// --- Utility Functions ---
function toggleSectionVisibility(event) {
  const checkbox = event.target;

  // Map checkbox IDs to container IDs
  const containerMap = {
    trackWeight: "memberWeight",
    trackWaterNorm: "waterNorm",
    trackSweets: "sweetsContainer",
    trackActivities: "activitiesContainer", // Ensure this mapping exists
    trackRegularMedications: "regularMedicationsContainer",
    trackOccasionalMedications: "occasionalMedicationsContainer",
    trackExercises: "exercisesContainer",
  };

  const containerId = containerMap[checkbox.id];
  const container = document.getElementById(containerId);

  if (container) {
    if (checkbox.checked) {
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
  } else {
    console.error(`Container with id "${containerId}" not found.`);
  }
}

document.getElementById("content").addEventListener("click", (event) => {
  const header = event.target.closest(".accordion-header");
  if (header && header.parentElement.classList.contains("accordion")) {
    const accordion = header.parentElement;
    const date = accordion.getAttribute("data-date");

    // Toggle the open state
    accordion.classList.toggle("open");
    openAccordions[date] = accordion.classList.contains("open");
  }
});

function removeParent(button) {
  const parent = button.parentElement;
  parent.remove();
}

function fillGlass(el, count, date, memberName) {
  const glasses = el.parentNode.querySelectorAll(".glass");
  glasses.forEach((glass, i) => {
    glass.src = i < count ? ICONS.waterFilled : ICONS.waterEmpty;
  });

  measures[date][memberName].water = count;
  saveMeasures();
}

function saveWeight(newWeight, date, memberName) {
  measures[date][memberName].weight = parseFloat(newWeight);
  saveMeasures();
}

function addSweet(date, memberName, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }

  // Ensure the sweets array exists
  measures[date][memberName].sweets = measures[date][memberName].sweets || [];
  
  // Add a new sweet
  measures[date][memberName].sweets.push({ name: "", amount: "" });
  saveMeasures();

  // Append the new sweet
  const sweetsContainer = document.getElementById(`sweetsContainer-${date}`);
  if (sweetsContainer) {
    const newSweet = document.createElement("div");
    newSweet.className = "input-group";
    newSweet.innerHTML = `
      <input type="text" placeholder="Sweet Name" onchange="updateSweet('${date}', '${memberName}', ${measures[date][memberName].sweets.length - 1}, this.value)" />
      <input type="number" class="input-45" placeholder="Amount" onchange="updateSweetAmount('${date}', '${memberName}', ${measures[date][memberName].sweets.length - 1}, this.value)" />
      <button class="remove-button" onclick="removeSweet('${date}', '${memberName}', ${measures[date][memberName].sweets.length - 1})">X</button>
    `;
    sweetsContainer.insertBefore(newSweet, sweetsContainer.lastElementChild); // Insert before the "Add Sweet" button
  } else {
    console.error(`Sweets container for date ${date} not found.`);
  }
}

function updateSweet(date, memberName, index, value, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }
  measures[date][memberName].sweets[index].name = value;
  // Add the new sweet to the config if it doesn't already exist
  if (!config.members[0].sweets.includes(value)) {
    config.members[0].sweets.push(value);
    saveConfig();
  }
  saveMeasures();
}

function updateSweetAmount(date, memberName, index, value, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }
  measures[date][memberName].sweets[index].amount = parseInt(value) || 0;
  saveMeasures();
}

function removeSweet(date, memberName, index, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }
  measures[date][memberName].sweets.splice(index, 1);
  saveMeasures();
  renderDiary(currentMember);
}

function addActivity(date, memberName, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }

  // Ensure the activities array exists
  measures[date][memberName].activity = measures[date][memberName].activity || [];
  
  // Add a new activity
  measures[date][memberName].activity.push({ name: "", details: "" });
  saveMeasures();

  // Append the new activity
  const activitiesContainer = document.getElementById(`activitiesContainer-${date}`);
  if (activitiesContainer) {
    const newActivity = document.createElement("div");
    newActivity.className = "input-group";
    newActivity.innerHTML = `
      <input type="text" placeholder="Activity Name" onchange="updateActivity('${date}', '${memberName}', ${measures[date][memberName].activity.length - 1}, this.value)" />
      <input type="text" class="input-45" placeholder="Details" onchange="updateActivityDetails('${date}', '${memberName}', ${measures[date][memberName].activity.length - 1}, this.value)" />
      <button class="remove-button" onclick="removeActivity('${date}', '${memberName}', ${measures[date][memberName].activity.length - 1})">X</button>
    `;
    activitiesContainer.insertBefore(newActivity, activitiesContainer.lastElementChild); // Insert before the "Add Activity" button
  } else {
    console.error(`Activities container for date ${date} not found.`);
  }
}

function updateActivity(date, memberName, index, value, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }
  measures[date][memberName].activity[index].name = value;
  // Add the new activity to the config if it doesn't already exist
  if (!config.members[0].activity.some((activity) => activity.name === value)) {
    config.members[0].activity.push({ name: value, details: "" });
    saveConfig();
  }
  saveMeasures();
}

function updateActivityDetails(date, memberName, index, value, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }
  measures[date][memberName].activity[index].details = value;
  saveMeasures();
}

function removeActivity(date, memberName, index, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }
  measures[date][memberName].activity.splice(index, 1);
  saveMeasures();
  renderDiary(currentMember);
}

function addActivities() {
  const activitiesContainer = document.getElementById("activitiesContainer");
  if (!activitiesContainer) {
    console.error("activitiesContainer not found.");
    return;
  }

  const newActivity = document.createElement("div");
  newActivity.className = "input-group";
  newActivity.innerHTML = `
    <input type="text" placeholder="Activity Name" />
    <input type="text" placeholder="Details" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  activitiesContainer.appendChild(newActivity);
}

function addRegularMedications() {
  const regularMedicationsContainer = document.getElementById("regularMedicationsContainer");
  if (!regularMedicationsContainer) {
    console.error("regularMedicationsContainer not found.");
    return;
  }

  const newMedication = document.createElement("div");
  newMedication.className = "input-group";
  newMedication.innerHTML = `
    <input type="text" placeholder="Medication Name" />
    <input type="text" placeholder="Dose" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  regularMedicationsContainer.appendChild(newMedication);
}

function toggleRegularMedication(date, memberName, medicationName, event) {
  if (!measures[date] || !measures[date][memberName]) {
    console.error(`No data found for date: ${date} and member: ${memberName}`);
    return;
  }

  const medication = measures[date][memberName].regularMedications.find(
    (med) => med.name === medicationName
  );

  if (!medication) {
    console.error(`Medication with name "${medicationName}" not found.`);
    return;
  }

  // Toggle the "taken" status
  medication.taken = !medication.taken;

  // Update the UI
  const img = event.target;
  img.src = medication.taken ? ICONS.medicineFilled : ICONS.medicineEmpty;

  // Save the updated measures
  saveMeasures();
}

function addOccasionalMedications() {
  const occasionalMedicationsContainer = document.getElementById("occasionalMedicationsContainer");
  if (!occasionalMedicationsContainer) {
    console.error("occasionalMedicationsContainer not found.");
    return;
  }

  const newMedication = document.createElement("div");
  newMedication.className = "input-group";
  newMedication.innerHTML = `
    <input type="text" placeholder="Medication Name" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  occasionalMedicationsContainer.appendChild(newMedication);
}

function updateOccasionalMedication(date, memberName, index, field, value) {
  if (!measures[date] || !measures[date][memberName]) {
    console.error(`No data found for date: ${date} and member: ${memberName}`);
    return;
  }

  measures[date][memberName].occasionalMedications[index][field] = value; // Update the field (name or dose)
  // Add the new medication to the config if it doesn't already exist
  if (field === "name" && !config.members[0].medications.occasional.includes(value)) {
    config.members[0].medications.occasional.push(value);
    saveConfig();
  }
  saveMeasures();
}

function removeOccasionalMedication(date, memberName, index) {
  if (!measures[date] || !measures[date][memberName]) {
    console.error(`No data found for date: ${date} and member: ${memberName}`);
    return;
  }

  measures[date][memberName].occasionalMedications.splice(index, 1);
  saveMeasures();
  renderDiary(currentMember);
}

function addSet(button) {
  const setsContainer = button.previousElementSibling; // Find the container for sets
  if (!setsContainer) {
    console.error("Sets container not found.");
    return;
  }

  const newSet = document.createElement("div");
  newSet.className = "input-group";
  newSet.innerHTML = `
    <input type="number" placeholder="Reps" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  setsContainer.appendChild(newSet);
}

function addExercises() {
  const exercisesContainer = document.getElementById("exercisesContainer");
  if (!exercisesContainer) {
    console.error("exercisesContainer not found.");
    return;
  }

  const newExercise = document.createElement("div");
  newExercise.className = "exercise-entry";
  newExercise.innerHTML = `
    <input type="text" placeholder="Exercise Name" />
    <div class="sets-container">
      <div class="input-group">
        <input type="number" placeholder="Reps" />
        <button class="remove-button" onclick="removeParent(this)">X</button>
      </div>
    </div>
    <button onclick="addSet(this)">+ Add Set</button>
    <button class="remove-button button-100" onclick="removeParent(this)">Remove Exercise</button>
  `;
  exercisesContainer.appendChild(newExercise);
}

function addSweets() {
  const sweetsContainer = document.getElementById("sweetsContainer");
  if (!sweetsContainer) {
    console.error("sweetsContainer not found.");
    return;
  }

  const newSweet = document.createElement("div");
  newSweet.className = "input-group";
  newSweet.innerHTML = `
    <input type="text" placeholder="Enter sweet" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  sweetsContainer.appendChild(newSweet);
}

function addMedicationEntry(date, event) {
  if (event) {
    event.stopPropagation(); // Prevent the event from propagating to the accordion
  }

  const occasionalMedicationsContainer = document.getElementById(`occasionalMedicationsContainer-${date}`);
  if (!occasionalMedicationsContainer) {
    console.error(`Occasional medications container for date ${date} not found.`);
    return;
  }

  measures[date][currentMember.name].occasionalMedications = measures[date][currentMember.name].occasionalMedications || [];
  measures[date][currentMember.name].occasionalMedications.push({ name: "", dose: "" }); // Add a new medication
  saveMeasures();
  renderDiary(currentMember);
}

function saveExerciseReps(date, memberName, exerciseIndex, setIndex, value) {
  if (!measures[date] || !measures[date][memberName]) {
    console.error(`No data found for date: ${date} and member: ${memberName}`);
    return;
  }

  const exercise = measures[date][memberName].exercises[exerciseIndex];
  if (!exercise) {
    console.error(`No exercise found at index: ${exerciseIndex}`);
    return;
  }

  exercise.actualReps[setIndex] = parseInt(value) || 0; // Update the reps for the specific set
  saveMeasures(); // Save the updated measures to localStorage
}

function toggleMenu() {
  const menuDropdown = document.getElementById("menu-dropdown");
  if (menuDropdown.classList.contains("hidden")) {
    menuDropdown.classList.remove("hidden");
    menuDropdown.classList.add("visible");
  } else {
    menuDropdown.classList.remove("visible");
    menuDropdown.classList.add("hidden");
  }
}

function hideMenu() {
  const menuDropdown = document.getElementById("menu-dropdown");
  menuDropdown.classList.remove("visible");
  menuDropdown.classList.add("hidden");
}

function addRetrospectiveData() {
  const date = prompt("Enter the date for retrospective data (YYYY-MM-DD):");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    alert("Invalid date format. Please use YYYY-MM-DD.");
    return;
  }

  if (!measures[date]) {
    measures[date] = {};
  }

  if (!measures[date][currentMember.name]) {
    measures[date][currentMember.name] = createDefaultDailyRecord();
  }

  saveMeasures();
  alert(`Retrospective data for ${date} has been initialized.`);
  renderDiary(currentMember);
}

function toggleAccordion(event) {
  const header = event.target.closest(".accordion-header");
  if (header && header.parentElement.classList.contains("accordion")) {
    const accordion = header.parentElement;
    const date = accordion.getAttribute("data-date");

    // Toggle the open state
    accordion.classList.toggle("open");
    openAccordions[date] = accordion.classList.contains("open");
  }
}

//Reporting
function renderReports() {
  const content = document.getElementById("content");

  // Get all unique medication names (regular and occasional) from the diary
  const allMedications = new Set();
  Object.values(measures).forEach(dayData => {
    Object.values(dayData).forEach(memberData => {
      memberData.regularMedications.forEach(med => allMedications.add(med.name));
      memberData.occasionalMedications.forEach(med => allMedications.add(med.name));
    });
  });

  const medicationOptions = Array.from(allMedications)
    .filter(med => med.length > 0)
    .map(med => `<option value="${med}">${med}</option>`)
    .join('');

  content.innerHTML = `
    <h2>Reports</h2>
    <div class="section">
      <label for="timeSpan"><strong>Time Span (Last X Days):</strong></label>
      <input type="number" id="timeSpan" placeholder="Enter number of days" />
    </div>
    <div class="section">
      <label for="reportType"><strong>Data to Report On:</strong></label>
      <select id="reportType">
        <option value="allMedications">All Medications</option>
        <option value="specificMedication">Specific Medication</option>
        <option value="sweets">Sweets</option>
        <option value="activities">Activities</option>
        <option value="averageWater">Average Water Intake</option>
      </select>
    </div>
    <div class="section" id="specificMedicationSection" style="display: none;">
      <label for="specificMedicationName"><strong>Medication Name:</strong></label>
      <select id="specificMedicationName">
        <option value="">Select a medication</option>
        ${medicationOptions}
      </select>
    </div>
    <button onclick="generateReport()">Generate Report</button>
    <div id="reportResults" class="section"></div>
  `;

  // Show/hide the specific medication dropdown based on the selected report type
  const reportTypeSelect = document.getElementById("reportType");
  reportTypeSelect.addEventListener("change", () => {
    const specificMedicationSection = document.getElementById("specificMedicationSection");
    specificMedicationSection.style.display = reportTypeSelect.value === "specificMedication" ? "block" : "none";
  });
}

function generateReport() {
  const timeSpan = parseInt(document.getElementById("timeSpan").value);
  const reportType = document.getElementById("reportType").value;
  const specificMedicationName = document.getElementById("specificMedicationName").value;
  const reportResults = document.getElementById("reportResults");

  if (isNaN(timeSpan) || timeSpan <= 0) {
    reportResults.innerHTML = "<p>Please enter a valid number of days.</p>";
    return;
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - timeSpan);

  const results = [];
  let totalWater = 0;
  let daysWithWaterData = 0;

  Object.keys(measures).forEach(date => {
    const recordDate = new Date(date);
    if (recordDate >= startDate && recordDate <= today) {
      const memberData = measures[date][currentMember.name];
      if (!memberData) return;

      if (reportType === "averageWater") {
        if (memberData.water !== undefined) {
          totalWater += memberData.water;
          daysWithWaterData++;
        }
      } else if (reportType === "allMedications") {
        const regularMeds = memberData.regularMedications.filter(med => med.taken);
        const occasionalMeds = memberData.occasionalMedications;
        if (regularMeds.length > 0 || occasionalMeds.length > 0) {
          results.push({ date, regularMeds, occasionalMeds });
        }
      } else if (reportType === "specificMedication" && specificMedicationName) {
        const regularMed = memberData.regularMedications.find(
          med => med.name === specificMedicationName && med.taken
        );
        const occasionalMed = memberData.occasionalMedications.find(
          med => med.name === specificMedicationName
        );
        if (regularMed || occasionalMed) {
          results.push({ date, medication: regularMed || occasionalMed });
        }
      }
    }
  });

  if (reportType === "averageWater") {
    const averageWater = daysWithWaterData > 0 ? (totalWater / daysWithWaterData).toFixed(2) : 0;
    reportResults.innerHTML = `
      <h3>Report Summary:</h3>
      <p>Average water intake over the last <strong>${timeSpan}</strong> days: <strong>${averageWater}</strong> glasses per day.</p>
    `;
  } else if (reportType === "specificMedication" && specificMedicationName) {
    const daysTaken = results.length;
    reportResults.innerHTML = `
      <h3>Report Summary:</h3>
      <p class="strong-inline">You took <strong>${specificMedicationName}</strong> on <strong>${daysTaken}</strong> out of <strong>${timeSpan}</strong> days.</p>
      <h3>Details:</h3>
      <ul>
        ${results
          .map(
            result =>
              `<li>${result.date}: ${result.medication.dose ? `Dose: ${result.medication.dose}` : "No dose recorded"}</li>`
          )
          .join("")}
      </ul>
    `;
  } else if (reportType === "allMedications") {
    reportResults.innerHTML = `
      <h3>Report Summary:</h3>
      <p>Medications taken on the following days:</p>
      <ul>
        ${results
          .map(
            result =>
              `<li>${result.date}: Regular: ${result.regularMeds
                .map(med => `${med.name} (${med.dose || "No dose recorded"})`)
                .join(", ")}; Occasional: ${result.occasionalMeds
                .map(med => `${med.name} (${med.dose || "No dose recorded"})`)
                .join(", ")}</li>`
          )
          .join("")}
      </ul>
    `;
  } else {
    reportResults.innerHTML = "<p>No data found for the selected criteria.</p>";
  }
}

//Import / Export
function exportDiary() {
  const data = {
    config: JSON.parse(localStorage.getItem('config') || '{}'),
    measures: JSON.parse(localStorage.getItem('measures') || '{}')
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-diary.json';
  a.click();

  URL.revokeObjectURL(url);
}

function importDiary(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // Validate the structure of the imported data
      if (!data.config || !Array.isArray(data.config.members)) {
        throw new Error('Invalid config format.');
      }
      if (!data.measures || typeof data.measures !== 'object') {
        throw new Error('Invalid measures format.');
      }

      // Save the imported data to localStorage
      localStorage.setItem('config', JSON.stringify(data.config));
      localStorage.setItem('measures', JSON.stringify(data.measures));

      // Reload the app with the imported data
      alert('Diary imported successfully!');
      loadConfig();
    } catch (error) {
      alert(`Failed to import diary: ${error.message}`);
    }
  };

  reader.readAsText(file);
}


// --- Initialization ---
let openAccordions = {};
loadConfig();
document.getElementById("content").addEventListener("click", (event) => {
  if (event.target.classList.contains("accordion-header")) {
    const accordion = event.target.parentElement;
    const date = accordion.getAttribute("data-date");

    // Toggle the open state
    accordion.classList.toggle("open");
    openAccordions[date] = accordion.classList.contains("open");
  }
});