// Constants
const DEFAULT_SETTINGS = {
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

// Global Variables
let currentMember = null;
let config = { members: [] };
let measures = {};

// --- Initialization ---
function loadConfig() {
  const isValid = validateLocalStorage();

  if (!isValid) {
    const userConfirmed = confirm(
      "Your app data is invalid and will be reset. Click OK to proceed."
    );
    if (userConfirmed) {
      resetLocalStorage();
    } else {
      alert("The app cannot proceed with invalid data. Please reload the page.");
      return;
    }
  }

  let savedConfig = localStorage.getItem("config");
  let savedMeasures = localStorage.getItem("measures");

  config = savedConfig ? JSON.parse(savedConfig) : { members: [] };
  measures = savedMeasures ? JSON.parse(savedMeasures) : {};

  console.log("Loaded config:", config);
  console.log("Loaded measures:", measures);
}

function saveConfig() {
  localStorage.setItem("config", JSON.stringify(config));
}

function saveMeasures() {
  localStorage.setItem("measures", JSON.stringify(measures));
}

// --- App Initialization ---
function initApp() {
  loadConfig();

  // Ensure there are members in the config
  if (!config.members || config.members.length === 0) {
    console.log("No members found. Redirecting to settings.");
    renderSettings(); // Redirect to settings page for new users
    return;
  }

  // Set the current member to the first member in the config
  currentMember = config.members[0];
  console.log("Current member:", currentMember);

  // Ensure today's record exists and render the diary
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
  if (!currentMember) {
    console.error("No current member found. Cannot create a daily record.");
    return null;
  }

  return {
    trackers: currentMember.trackers.map((tracker) => ({
      name: tracker.name,
      type: tracker.type,
      value:
        tracker.type === "unlimited-number"
          ? tracker.value || 0
          : tracker.type === "limited-number"
          ? tracker.value || 0
          : tracker.type === "array-strings"
          ? tracker.value || []
          : tracker.type === "array-objects"
          ? tracker.value || []
          : tracker.type === "array-objects-checkbox"
          ? (tracker.value || []).map((item) => ({
              name: item.name || "",
              details: item.details || "",
              checkbox: item.checkbox || false,
            }))
          : tracker.type === "array-objects-sets"
          ? (tracker.value || []).map((setGroup) => ({
              name: setGroup.name || "",
              reps: setGroup.reps || [],
              actualReps: Array(setGroup.reps?.length || 0).fill(0), // Initialize actualReps
            }))
          : null,
      icon: tracker.icon || null, // Include the icon for rendering
    })),
    note: "",
  };
}

function syncTrackersWithDailyRecord(dailyRecord, trackers) {
  trackers.forEach((tracker) => {
    if (!dailyRecord.trackers.find((t) => t.name === tracker.name)) {
      dailyRecord.trackers.push({
        name: tracker.name,
        type: tracker.type,
        value:
          tracker.type === "unlimited-number"
            ? tracker.value || 0
            : tracker.type === "limited-number"
            ? tracker.value || 0
            : tracker.type === "array-strings"
            ? []
            : tracker.type === "array-objects"
            ? []
            : tracker.type === "array-objects-checkbox"
            ? (tracker.value || []).map((item) => ({
                name: item.name || "",
                details: item.details || "",
                checkbox: item.checkbox || false,
              }))
            : tracker.type === "array-objects-sets"
            ? (tracker.value || []).map((setGroup) => ({
                name: setGroup.name || "",
                reps: setGroup.reps || [],
                actualReps: Array(setGroup.reps?.length || 0).fill(0),
              }))
            : null,
        icon: tracker.icon || null,
      });
    }
  });
}

function ensureTodayRecordExists() {
  const today = new Date().toISOString().split("T")[0];
  if (!measures[today]) measures[today] = {};
  if (!measures[today][currentMember.name]) {
    console.log(`Creating default daily record for ${today}`);
    measures[today][currentMember.name] = createDefaultDailyRecord();
    saveMeasures();
  } else {
    console.log(`Syncing today's record for ${today}`);
    syncTrackersWithDailyRecord(measures[today][currentMember.name], currentMember.trackers);
  }
}

function addTrackerToExistingRecords(newTracker) {
  const today = new Date().toISOString().split("T")[0];
  if (!measures[today]) measures[today] = {};
  const dailyRecord = measures[today][currentMember.name];
  Object.keys(measures).forEach((date) => {
    const dailyRecord = measures[date][currentMember.name];
    if (dailyRecord) {
      syncTrackersWithDailyRecord(dailyRecord, [newTracker]);
      saveMeasures();
    }
  });
}

// --- Settings ---
function renderSettings() {
  const content = document.getElementById("content");
  const member = config.members[0] || { name: "", trackers: [], enableNotes: false };

  content.innerHTML = `
    <h2>Settings</h2>
    <div id="memberSetup">
      ${member.name ? renderMemberSettings(member) : renderNewUserPrompt()}
    </div>
    <div class="section checkbox-section">
      <input 
        type="checkbox" 
        id="enableNotes" 
        ${member.enableNotes ? "checked" : ""} 
        onchange="toggleNotesSetting()"
      />
      <label for="enableNotes"><strong>Enable Notes</strong></label>
    </div>
    <div id="trackerSetup">
      ${member.name ? renderTrackersSettings(member) : ""}
    </div>
  `;
}

function renderNewUserPrompt() {
  return `
    <div class="section">
      <label for="newUserName"><strong>Enter Your Name:</strong></label>
      <input type="text" id="newUserName" placeholder="Enter your name" />
      <button onclick="saveNewUser()">Save</button>
    </div>
  `;
}

function toggleNotesSetting() {
  const enableNotesCheckbox = document.getElementById("enableNotes");
  currentMember.enableNotes = enableNotesCheckbox.checked;
  saveConfig();
  console.log(`Notes are now ${enableNotesCheckbox.checked ? "enabled" : "disabled"}.`);
}

function saveNewUser() {
  const newUserName = document.getElementById("newUserName").value.trim();
  if (!newUserName) {
    alert("Please enter your name.");
    return;
  }

  config.members = [
    {
      name: newUserName,
      trackers: [], // Start with no trackers
    },
  ];
  saveConfig();
  loadConfig();
  currentMember = config.members[0];
  renderSettings();
}

function renderMemberSettings(member) {
  return `
    <div class="section">
      <label for="memberName"><strong>Member Name:</strong></label>
      <input 
        type="text" 
        id="memberName" 
        value="${member.name}" 
        placeholder="Enter name" 
        onchange="updateMemberName(this.value)" 
      />
    </div>
  `;
}

function updateMemberName(newName) {
  newName = newName.trim();

  if (!newName) {
    alert("Please enter a valid name.");
    return;
  }

  // Update the current member's name
  const oldName = currentMember.name;
  currentMember.name = newName;

  // Update the config
  const memberIndex = config.members.findIndex((member) => member.name === oldName);
  if (memberIndex !== -1) {
    config.members[memberIndex].name = newName;
  }

  // Update the measures object to reflect the new name
  Object.keys(measures).forEach((date) => {
    if (measures[date][oldName]) {
      measures[date][newName] = measures[date][oldName];
      delete measures[date][oldName];
    }
  });

  // Save the updated config and measures
  saveConfig();
  saveMeasures();

  console.log(`Member name updated from "${oldName}" to "${newName}".`);
}

function renderTrackersSettings(member) {
  return `
    <div class="section">
      <button onclick="showAddTrackerDialog()">+ Add Tracker</button>
    </div>
    <div id="trackerList">
      ${member.trackers
        .map(
          (tracker, index) => `
          <div class="tracker-item">
            <input 
              type="checkbox" 
              id="trackerActive-${index}" 
              ${tracker.isActive ? "checked" : ""} 
              onchange="toggleTrackerActive(${index})"
            />
            <label for="trackerActive-${index}">
              <strong>${tracker.name}</strong> (${tracker.type})
            </label>
            <button class="edit-button" onclick="editTracker(${index})">Edit</button>
            <button class="delete-button" onclick="deleteTracker(${index})">Delete</button>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

function deleteTracker(index) {
  const tracker = currentMember.trackers[index];
  if (!tracker) {
    console.error(`Tracker at index ${index} not found.`);
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete the tracker "${tracker.name}"?`);
  if (!confirmed) {
    return;
  }

  // Remove the tracker from the current member's trackers
  currentMember.trackers.splice(index, 1);

  // Remove the tracker from all existing daily records
  Object.keys(measures).forEach((date) => {
    const dailyRecord = measures[date][currentMember.name];
    if (dailyRecord) {
      dailyRecord.trackers = dailyRecord.trackers.filter((t) => t.name !== tracker.name);
    }
  });

  // Save the updated config and measures
  saveConfig();
  saveMeasures();

  console.log(`Tracker "${tracker.name}" has been deleted.`);
  renderSettings(); // Refresh the settings page
}

function toggleTrackerActive(index) {
  const tracker = currentMember.trackers[index];
  if (!tracker) {
    console.error(`Tracker at index ${index} not found.`);
    return;
  }

  tracker.isActive = !tracker.isActive; // Toggle the isActive property
  saveConfig(); // Save the updated config
  console.log(`Tracker "${tracker.name}" is now ${tracker.isActive ? "active" : "inactive"}.`);
}

function showAddTrackerDialog() {
  const content = document.getElementById("trackerSetup");
  content.innerHTML = `
    <div class="section">
      <label for="trackerType"><strong>Select Tracker Template:</strong></label>
      <select id="trackerType" onchange="updateTrackerFields()">
        <option value="unlimited-number">Number (Good for: Weight)</option>
        <option value="limited-number">Scale (Good for: Period intensity, Daily water intake)</option>
        <option value="array-strings">Text (Good for: Occasional sweets, occasional activivities)</option>
        <option value="array-objects">Text + Detail (Good for: Occasional medication with dose)</option>
        <option value="array-objects-checkbox">Checkbox (Good for: Regular medication with dose)</option>
        <option value="array-objects-sets">Sets (Good for: Gym training)</option>
      </select>
    </div>
    <div class="section">
      <label for="trackerName"><strong>Enter Tracker Name:</strong></label>
      <input type="text" id="trackerName" placeholder="Enter tracker name" />
    </div>
    <div id="dynamicFields"></div>
    <button onclick="saveTracker()">Save</button>
  `;
}

function editTracker(index) {
  const tracker = currentMember.trackers[index];
  if (!tracker) {
    console.error(`Tracker at index ${index} not found.`);
    return;
  }

  const content = document.getElementById("trackerSetup");
  content.innerHTML = `
    <div class="section">
      <label for="trackerType"><strong>Tracker Type:</strong></label>
      <select id="trackerType" disabled>
        <option value="${tracker.type}" selected>${tracker.type}</option>
      </select>
    </div>
    <div class="section">
      <label for="trackerName"><strong>Tracker Name:</strong></label>
      <input type="text" id="trackerName" value="${tracker.name}" placeholder="Enter tracker name" />
    </div>
    <div id="dynamicFields"></div>
    <button onclick="saveEditedTracker(${index})">Save</button>
  `;

  updateTrackerFields(); // Populate dynamic fields based on tracker type

  // Populate existing values
  if (tracker.type === "limited-number" || tracker.type === "array-objects-checkbox") {
    document.getElementById("trackerIcon").value = tracker.icon || "";
  }

  if (tracker.type === "array-strings") {
    const container = document.getElementById("favoriteEntriesContainer");
    tracker.value.forEach((entry) => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = entry;
      container.appendChild(input);
    });
  } else if (tracker.type === "array-objects") {
    const container = document.getElementById("favoriteEntriesContainer");
    tracker.value.forEach((obj) => {
      const entry = document.createElement("div");
      entry.className = "input-group";
      entry.innerHTML = `
        <input type="text" value="${obj.name}" placeholder="Entry Name" />
        <input type="text" value="${obj.details}" placeholder="Details" />
      `;
      container.appendChild(entry);
    });
  } else if (tracker.type === "array-objects-sets") {
    const container = document.getElementById("setsContainer");
    tracker.value.forEach((setGroup) => {
      const group = document.createElement("div");
      group.className = "setGroup-entry";
      group.innerHTML = `
        <input type="text" value="${setGroup.name}" placeholder="Set Group Name" />
        <div class="sets-container">
          ${setGroup.reps
            .map(
              (rep) => `
            <input type="number" value="${rep}" placeholder="Reps" />
          `
            )
            .join("")}
        </div>
      `;
      container.appendChild(group);
    });
  }
}

function saveEditedTracker(index) {
  const tracker = currentMember.trackers[index];
  if (!tracker) {
    console.error(`Tracker at index ${index} not found.`);
    return;
  }

  const trackerName = document.getElementById("trackerName").value.trim();
  const trackerIconElement = document.getElementById("trackerIcon");
  const trackerIcon = trackerIconElement ? trackerIconElement.value : null;

  if (!trackerName) {
    alert("Please enter a tracker name.");
    return;
  }

  tracker.name = trackerName;
  if (tracker.type === "limited-number" || tracker.type === "array-objects-checkbox") {
    tracker.icon = trackerIcon;
  }

  // Update tracker values based on type
  if (tracker.type === "array-strings") {
    const entries = Array.from(document.querySelectorAll("#favoriteEntriesContainer input"))
      .map((input) => input.value.trim())
      .filter((value) => value);
    tracker.value = entries;
  } else if (tracker.type === "array-objects") {
    const objects = Array.from(document.querySelectorAll("#favoriteEntriesContainer .input-group"))
      .map((group) => ({
        name: group.querySelector("input:nth-of-type(1)").value.trim(),
        details: group.querySelector("input:nth-of-type(2)").value.trim(),
      }))
      .filter((obj) => obj.name);
    tracker.value = objects;
  } else if (tracker.type === "array-objects-sets") {
    const setGroups = Array.from(document.querySelectorAll("#setsContainer .setGroup-entry")).map((setGroup) => {
      const name = setGroup.querySelector("input[type='text']").value.trim();
      const reps = Array.from(setGroup.querySelectorAll(".sets-container input[type='number']"))
        .map((input) => parseInt(input.value))
        .filter((value) => !isNaN(value));
      return { name, reps };
    }).filter((setGroup) => setGroup.name);
    tracker.value = setGroups;
  }

  // Update today's record
  const today = new Date().toISOString().split("T")[0];
  const dailyRecord = measures[today][currentMember.name];
  if (dailyRecord) {
    const dailyTracker = dailyRecord.trackers.find((t) => t.name === tracker.name);
    if (dailyTracker) {
      dailyTracker.value = tracker.value;
    }
    saveMeasures();
  }

  saveConfig();
  renderSettings();
}

function updateTrackerFields() {
  const trackerType = document.getElementById("trackerType").value;
  const dynamicFields = document.getElementById("dynamicFields");
  let fieldsHTML = "";

  if (trackerType === "limited-number") {
    const trackerIcon = document.getElementById("trackerIcon")?.value || null;
    fieldsHTML += `
      <div class="section">
        <label for="trackerValue"><strong>Enter Value:</strong></label>
        <input type="number" id="trackerValue" placeholder="Enter value (e.g., 10)" />
      </div>
      <div class="section">
        <label for="trackerIcon"><strong>Select Icon:</strong></label>
        ${
          trackerIcon
            ? `<img src="images/trackingIcons/${trackerIcon}-filled.png" alt="${trackerIcon}-filled" class="icon-preview" onclick="openIconSelector()" />`
            : `<button onclick="openIconSelector()">Select Icon</button>`
        }
        <input type="hidden" id="trackerIcon" value="${trackerIcon || ""}" />
      </div>
    `;
  }else if (trackerType === "array-strings") {
    fieldsHTML += `
      <div class="section">
        <label for="favoriteEntries"><strong>Add Favorite Entries:</strong></label>
        <div id="favoriteEntriesContainer"></div>
        <button onclick="addFavoriteEntry()">+ Add Entry</button>
      </div>
    `;
  } else if (trackerType === "array-objects") {
    fieldsHTML += `
      <div class="section">
        <label for="favoriteEntries"><strong>Add Entries:</strong></label>
        <div id="favoriteEntriesContainer"></div>
        <button onclick="addFavoriteEntryObject()">+ Add Entry</button>
      </div>
    `;
  }else if (trackerType === "array-objects-checkbox") {
    const trackerIcon = document.getElementById("trackerIcon")?.value || null;
    fieldsHTML += `
      <div class="section">
        <label for="trackerIcon"><strong>Select Icon:</strong></label>
        ${
          trackerIcon
            ? `<img src="images/trackingIcons/${trackerIcon}-filled.png" alt="${trackerIcon}-filled" class="icon-preview" onclick="openIconSelector()" />`
            : `<button onclick="openIconSelector()">Select Icon</button>`
        }
        <input type="hidden" id="trackerIcon" value="${trackerIcon || ""}" />
      </div>
      <div class="section">
        <label for="favoriteEntries"><strong>Add Entries:</strong></label>
        <div id="favoriteEntriesContainer"></div>
        <button onclick="addFavoriteEntryObject()">+ Add Entry</button>
      </div>
    `;
  } else if (trackerType === "array-objects-sets") {
    fieldsHTML += `
      <div class="section">
        <label for="sets"><strong>Create Sections and Sets:</strong></label>
        <div id="setsContainer"></div>
        <button onclick="addSetGroup()">+ Add Section</button>
      </div>
    `;
  }

  dynamicFields.innerHTML = fieldsHTML;
}

function toggleValueInput() {
  const trackerType = document.getElementById("trackerType").value;
  const valueInputSection = document.getElementById("valueInputSection");

  if (trackerType === "limited-number") {
    valueInputSection.style.display = "block";
  } else {
    valueInputSection.style.display = "none";
  }
}

function saveTracker() {
  if (!currentMember) {
    alert("No member found. Please set up a member in the settings.");
    renderSettings();
    return;
  }

  const trackerType = document.getElementById("trackerType").value;
  const trackerName = document.getElementById("trackerName").value.trim();
  const trackerIconElement = document.getElementById("trackerIcon");
  const trackerIcon = trackerIconElement ? trackerIconElement.value : null;
  const trackerValueElement = document.getElementById("trackerValue");
  const trackerValue = trackerValueElement ? parseInt(trackerValueElement.value) : null;

  if (!trackerName) {
    alert("Please enter a tracker name.");
    return;
  }

  // Check for duplicate tracker names
  if (currentMember.trackers.some((tracker) => tracker.name === trackerName)) {
    alert("A tracker with this name already exists. Please choose a different name.");
    return;
  }

  // Validate the icon only for tracker types that require it
  if ((trackerType === "limited-number" || trackerType === "array-objects-checkbox") && !trackerIcon) {
    alert("Please select an icon for the tracker.");
    return;
  }

  const newTracker = {
    name: trackerName,
    type: trackerType,
    isActive: true,
    value: ["unlimited-number", "limited-number"].includes(trackerType) ? trackerValue || 0 : [],
    icon: trackerIcon || null,
  };

  // Handle specific tracker types
  if (trackerType === "array-strings") {
    const entries = Array.from(document.querySelectorAll("#favoriteEntriesContainer input"))
      .map((input) => input.value.trim())
      .filter((value) => value);
    newTracker.value = entries;
  } else if (trackerType === "array-objects") {
    const objects = Array.from(document.querySelectorAll("#favoriteEntriesContainer .input-group"))
      .map((group) => ({
        name: group.querySelector("input:nth-of-type(1)").value.trim(),
        details: group.querySelector("input:nth-of-type(2)").value.trim(),
      }))
      .filter((obj) => obj.name);
    newTracker.value = objects;
  } else if (trackerType === "array-objects-checkbox") {
    const entries = Array.from(document.querySelectorAll("#favoriteEntriesContainer .input-group"))
      .map((group) => ({
        name: group.querySelector("input:nth-of-type(1)").value.trim(),
        details: group.querySelector("input:nth-of-type(2)").value.trim(),
        checkbox: false,
      }))
      .filter((entry) => entry.name);
    newTracker.value = entries;
  } else if (trackerType === "array-objects-sets") {
    const setGroups = Array.from(document.querySelectorAll("#setsContainer .setGroup-entry")).map((setGroup) => {
      const name = setGroup.querySelector("input[type='text']").value.trim();
      const reps = Array.from(setGroup.querySelectorAll(".sets-container input[type='number']"))
        .map((input) => parseInt(input.value))
        .filter((value) => !isNaN(value));
      return { name, reps };
    });
    newTracker.value = setGroups;
  }

  // Add the tracker to the config
  currentMember.trackers.push(newTracker);
  saveConfig();

  // Add the tracker to all existing records
  addTrackerToExistingRecords(newTracker);

  saveMeasures();
  renderSettings(); // Return to the settings page
}

function addFavoriteEntry(trackerType) {
  const container = document.getElementById("favoriteEntriesContainer");
  const entry = document.createElement("div");
  entry.className = "input-group";

  entry.innerHTML = `
      <input type="text" placeholder="Entry (e.g., Ibuprofen)" />
      <button class="remove-button" onclick="removeParent(this)">X</button>
    `;
  container.appendChild(entry);
}

function addFavoriteEntryObject() {
  const container = document.getElementById("favoriteEntriesContainer");
  const entry = document.createElement("div");
  entry.className = "input-group";
  entry.innerHTML = `
    <input type="text" placeholder="Entry (e.g., Ibuprofen)" />
    <input type="text" placeholder="Details (e.g., 600mg)" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  container.appendChild(entry);
}

function addSetGroup() {
  const container = document.getElementById("setsContainer");
  const setGroup = document.createElement("div");
  setGroup.className = "setGroup-entry";
  setGroup.innerHTML = `
    <input type="text" placeholder="Section Name (e.g., Push-ups)" />
    <div class="sets-container">
      <button onclick="addSetToSetGroup(this)">+ Add Set</button>
    </div>
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  container.appendChild(setGroup);
}

function addSetToSetGroup(button) {
  const setsContainer = button.parentElement;
  const set = document.createElement("div");
  set.className = "input-group";
  set.innerHTML = `
    <input type="number" placeholder="Reps (e.g., 10)" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  setsContainer.insertBefore(set, button);
}

function renderTrackerSetup(tracker) {
  const content = document.getElementById("trackerSetup");

  if (tracker.type === "limited-number" || tracker.type === "array-objects") {
    content.innerHTML = `
      <div class="section">
        <label for="trackerIcon"><strong>Select Icon:</strong></label>
        <select id="trackerIcon">
          <option value="glass-of-water">Glass of Water</option>
          <option value="medicine">Medicine</option>
        </select>
      </div>
      <button onclick="saveTrackerIcon('${tracker.name}')">Save</button>
    `;
  } else if (tracker.type === "array-strings") {
    content.innerHTML = `
      <div class="section">
        <label for="favoriteEntries"><strong>Add Favorite Entries:</strong></label>
        <div id="favoriteEntriesContainer"></div>
        <button onclick="addFavoriteEntry()">+ Add Entry</button>
      </div>
      <button onclick="saveFavoriteEntries('${tracker.name}')">Save</button>
    `;
  } else if (tracker.type === "array-objects") {
    content.innerHTML = `
      <div class="section">
        <label for="favoriteEntries"><strong>Add Favorite Entries:</strong></label>
        <div id="favoriteEntriesContainer"></div>
        <button onclick="addFavoriteEntryObject()">+ Add Entry</button>
      </div>
      <button onclick="saveFavoriteEntries('${tracker.name}')">Save</button>
    `;
  } else if (tracker.type === "array-objects-checkbox") {
    content.innerHTML = `
      <div class="section">
        <label for="trackerIcon"><strong>Select Icon:</strong></label>
        <select id="trackerIcon">
          <option value="glass-of-water">Glass of Water</option>
          <option value="medicine">Medicine</option>
        </select>
        <label for="favoriteEntries"><strong>Add Favorite Entries:</strong></label>
        <div id="favoriteEntriesContainer"></div>
        <button onclick="addFavoriteEntryObject()">+ Add Entry</button>
      </div>
      <button onclick="saveTrackerIcon('${tracker.name}')">Save</button>
    `;
  }else if (tracker.type === "array-objects-sets") {
    content.innerHTML = `
      <div class="section">
        <label for="sets"><strong>Create Sets:</strong></label>
        <div id="setsContainer"></div>
        <button onclick="addSet()">+ Add Set</button>
      </div>
      <button onclick="saveSets('${tracker.name}')">Save</button>
    `;
  }
}

function saveTrackerIcon(trackerName) {
  const trackerIcon = document.getElementById("trackerIcon").value;
  const tracker = config.members[0].trackers.find((t) => t.name === trackerName);

  if (!tracker) {
    alert("Tracker not found.");
    return;
  }

  tracker.icon = trackerIcon;
  if (tracker.type === "array-objects-checkbox") {
    console.log(tracker);
    saveFavoriteEntries(trackerName);
    return;
  }
  saveConfig();
  renderSettings(); // Return to the settings page
}

function saveFavoriteEntries(trackerName) {
  const container = document.getElementById("favoriteEntriesContainer");
  const entries = Array.from(container.querySelectorAll("input"))
    .map((input) => input.value.trim())
    .filter((value) => value);

  const tracker = config.members[0].trackers.find((t) => t.name === trackerName);
  tracker.value = entries;
  console.log(tracker);
  saveConfig();
  renderSettings();
}

function addSet() {
  const container = document.getElementById("setsContainer");
  const set = document.createElement("div");
  set.innerHTML = `
    <input type="number" placeholder="Reps" />
    <button class="remove-button" onclick="removeParent(this)">X</button>
  `;
  container.appendChild(set);
}

function saveSets(trackerName) {
  const container = document.getElementById("setsContainer");
  const sets = Array.from(container.querySelectorAll("input"))
    .map((input) => parseInt(input.value))
    .filter((value) => !isNaN(value));

  const tracker = config.members[0].trackers.find((t) => t.name === trackerName);
  tracker.value = sets;
  saveConfig();
  renderSettings();
}

function renderTracker(tracker, member, date) {
  switch (tracker.type) {
    case "unlimited-number":
      return `
        <div class="section">
          <strong>${tracker.name}:</strong>
          <input 
            type="number" 
            value="${tracker.value || 0}" 
            onchange="updateTracker('${date}', '${member.name}', '${tracker.name}', this.value)" 
          />
        </div>
      `;

      case "limited-number":
        return `
          <div class="section">
            <strong>${tracker.name}:</strong>
            <div class="glass-container">
              ${Array.from({ length: tracker.value }, (_, i) => `
                <img 
                src="${i < (tracker.current || 0) ? 'images/trackingIcons/'+tracker.icon+'-filled.png' : 'images/trackingIcons/'+tracker.icon+'.png'}" 
                class="icon ${i === 0 && tracker.current === 1 ? "reset-icon" : ""}" 
                onclick="${i === 0 && tracker.current === 1 ? `resetLimitedNumberTracker('${date}', '${member.name}', '${tracker.name}')` : `updateTracker('${date}', '${member.name}', '${tracker.name}', ${i + 1})`}"
                />
              `).join("")}
            </div>
          </div>
        `;

    case "array-strings":
      return `
        <div class="section">
          <strong>${tracker.name}:</strong>
          <div id="${tracker.name.toLowerCase()}Container-${date}">
            ${(tracker.value || []).map((item, i) => `
              <div class="input-group">
                <input 
                  type="text" 
                  value="${item}" 
                  placeholder="Enter ${tracker.name}" 
                  onchange="updateTracker('${date}', '${member.name}', '${tracker.name}', this.value, ${i})" 
                />
                <button class="remove-button" onclick="removeTrackerItem('${date}', '${member.name}', '${tracker.name}', ${i})">X</button>
              </div>
            `).join("")}
          </div>
          <button onclick="addTrackerItem('${tracker.name}', '${date}')">+ Add ${tracker.name}</button>
        </div>
      `;

      case "array-objects":
        return `
          <div class="section">
            <strong>${tracker.name}:</strong>
            <div id="${tracker.name.toLowerCase()}Container-${date}">
              ${(tracker.value || []).map((item, i) => `
                <div class="input-group">
                  <input 
                    type="text" 
                    value="${item.name || ""}" 
                    placeholder="Entry (e.g., Running)" 
                    onchange="updateTracker('${date}', '${member.name}', '${tracker.name}', this.value, ${i}, 'name')" 
                  />
                  <input 
                    type="text" 
                    value="${item.details || ""}" 
                    placeholder="Detail (e.g., 5km)" 
                    onchange="updateTracker('${date}', '${member.name}', '${tracker.name}', this.value, ${i}, 'details')" 
                  />
                  <button class="remove-button" onclick="removeTrackerItem('${date}', '${member.name}', '${tracker.name}', ${i})">X</button>
                </div>
              `).join("")}
            </div>
            <button onclick="addTrackerItem('${tracker.name}', '${date}')">+ Add ${tracker.name}</button>
          </div>
        `;

      case "array-objects-checkbox":
      console.log(tracker);
      return `
        <div class="section">
          <strong>${tracker.name}:</strong>
          <div id="${tracker.name.toLowerCase()}Container-${date}">
            ${(tracker.value || []).map((item, i) => `
              <div class="input-group">
                <img 
                  src="${item.checkbox ? 'images/trackingIcons/'+config.members[0].trackers.find((t) => t.name === tracker.name).icon+'-filled.png' : 'images/trackingIcons/'+config.members[0].trackers.find((t) => t.name === tracker.name).icon+'.png'}" 
                  class="icon" 
                  onclick="toggleArrayObjectCheckbox('${date}', '${member.name}', '${tracker.name}', ${i})"
                  alt="Checkbox Icon"
                />
                <span>${item.name} (${item.details})</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;

      case "array-objects-sets":
      return `
        <div class="section">
          <strong>${tracker.name}:</strong>
          ${(tracker.value || []).map((setGroup, i) => `
            <div class="setGroup-entry">
              <strong>${setGroup.name}</strong>
              ${(setGroup.reps || []).map((rep, j) => `
                <div class="input-group">
                  <input 
                    type="number" 
                    value="${setGroup.actualReps?.[j] || ""}" 
                    placeholder="Actual Reps" 
                    onchange="updateTracker('${date}', '${member.name}', '${tracker.name}', this.value, ${i}, 'actualReps', ${j})" 
                  />
                  <span class="input-45">(Base: ${rep})</span>
                </div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      `;

    default:
      return `
        <div class="section">
          <strong>${tracker.name}:</strong>
          <p>Unsupported tracker type: ${tracker.type}</p>
        </div>
      `;
  }
}
function updateTracker(date, memberName, trackerName, value, index = null, key = null, subIndex = null) {
  const tracker = measures[date][memberName].trackers.find((t) => t.name === trackerName);

  if (!tracker) {
    console.error(`Tracker "${trackerName}" not found for ${memberName} on ${date}`);
    return;
  }

  if (tracker.type === "limited-number") {
    tracker.current = value; // Update the current value for limited-number trackers
  } else if (index !== null) {
    if (key) {
      if (subIndex !== null) {
        tracker.value[index][key][subIndex] = parseInt(value) || 0;
      } else {
        tracker.value[index][key] = value;
      }
    } else {
      tracker.value[index] = value;
    }
  } else {
    tracker.value = value;
  }

  console.log("Updated tracker:", tracker);
  saveMeasures(); // Save the updated measures to local storage
  renderDiary(currentMember); // Re-render the diary to reflect the changes
}

function addTrackerItem(trackerName, date) {
  const tracker = currentMember.trackers.find((t) => t.name === trackerName);

  if (!tracker) {
    console.error(`Tracker "${trackerName}" not found.`);
    return;
  }

  const dailyRecord = measures[date][currentMember.name];

  if (!dailyRecord) {
    console.error(`No daily record found for ${currentMember.name} on ${date}`);
    return;
  }

  const dailyTracker = dailyRecord.trackers.find((t) => t.name === trackerName);

  if (!dailyTracker) {
    console.error(`Tracker "${trackerName}" not found in the record for ${date}.`);
    return;
  }

  // Add a new item based on the tracker type
  if (tracker.type === "array-strings") {
    dailyTracker.value.push(""); // Add an empty string for array-strings
  } else if (tracker.type === "array-objects") {
    dailyTracker.value.push({ name: "", details: "" }); // Add a new object with default values
  } else if (tracker.type === "array-objects-checkbox") {
    dailyTracker.value.push({ name: "", details: "", checkbox: false }); // Add a new object with default values
  } else {
    console.error(`Unsupported tracker type: ${tracker.type}`);
    return;
  }

  console.log(`Added new tracker item to ${date}:`, dailyTracker);
  saveMeasures(); // Save the updated measures to local storage
  renderDiary(currentMember); // Re-render the diary to reflect the changes
}

function resetLimitedNumberTracker(date, memberName, trackerName) {
  const tracker = measures[date][memberName].trackers.find((t) => t.name === trackerName);

  if (!tracker) {
    console.error(`Tracker "${trackerName}" not found for ${memberName} on ${date}.`);
    return;
  }

  // Set the tracker value to zero
  tracker.current = 0;

  // Save the updated measures
  saveMeasures();

  // Re-render the diary to reflect the changes
  renderDiary(currentMember);

  console.log(`Tracker "${trackerName}" has been reset to zero.`);
}

function removeTrackerItem(date, memberName, trackerName, index) {
  const tracker = measures[date][memberName].trackers.find((t) => t.name === trackerName);

  if (!tracker) {
    console.error(`Tracker "${trackerName}" not found for ${memberName} on ${date}`);
    return;
  }

  tracker.value.splice(index, 1);
  saveMeasures();
  renderDiary(currentMember);
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

// --- Diary ---
function renderDiary(member) {
  if (!member) {
    console.error("No member provided to renderDiary.");
    return;
  }

  console.log("Rendering diary for member:", member.name);
  console.log("Current measures:", measures);

  const content = document.getElementById("content");
  let html = ``;

  const allDates = Object.keys(measures)
    .filter((date) => measures[date][member.name])
    .sort((a, b) => new Date(b) - new Date(a));

  allDates.forEach((date) => {
    const data = measures[date][member.name];
    html += renderDiaryEntry(date, data, member);
  });

  content.innerHTML = html;

  // Restore the state of all accordions
  Object.keys(openAccordions).forEach((date) => {
    const accordion = document.querySelector(`.accordion[data-date="${date}"]`);
    if (accordion && openAccordions[date]) {
      accordion.classList.add("open");
      const content = accordion.querySelector(".accordion-content");
      if (content) content.style.display = "block";
    }
  });
}

function renderDiaryEntry(date, data, member) {
  return `
    <div class="accordion" data-date="${date}">
      <div class="accordion-header" onclick="toggleAccordion(event)">${date}</div>
      <div class="accordion-content">
        ${data.trackers
          .filter((tracker) => config.members[0].trackers.find((t) => t.name === tracker.name).isActive) // Only render active trackers
          .map((tracker) => renderTracker(tracker, member, date))
          .join("")}
        ${member.enableNotes ? renderNotes(date, data.note) : ""}
      </div>
    </div>
  `;
}

function renderNotes(date, note) {
  return `
    <div class="section">
      <strong>Notes:</strong>
      <textarea 
        placeholder="Add your notes here..." 
        onchange="updateNotes('${date}', this.value)"
      >${note || ""}</textarea>
    </div>
  `;
}

function updateNotes(date, value) {
  if (!measures[date]) {
    console.error(`No record found for ${date}.`);
    return;
  }

  measures[date].note = value;
  saveMeasures();
  console.log(`Updated notes for ${date}:`, value);
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


function toggleArrayObjectCheckbox(date, memberName, trackerName, index) {
  const tracker = measures[date][memberName].trackers.find((t) => t.name === trackerName);

  if (!tracker) {
    console.error(`Tracker "${trackerName}" not found for ${memberName} on ${date}`);
    return;
  }

  // Toggle the "taken" status
  tracker.value[index].checkbox = !tracker.value[index].checkbox;

  // Save the updated measures
  saveMeasures();

  // Re-render the diary to reflect the changes
  renderDiary(currentMember);
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
    const content = accordion.querySelector(".accordion-content");
    const date = accordion.getAttribute("data-date");

    // Toggle the open state
    accordion.classList.toggle("open");

    // Show or hide the content
    if (accordion.classList.contains("open")) {
      content.style.display = "block";
      openAccordions[date] = true; // Mark as open
    } else {
      content.style.display = "none";
      openAccordions[date] = false; // Mark as closed
    }
  }
}

//Reporting
function renderReports() {
  const content = document.getElementById("content");

  // Get all trackers for the current member
  const trackers = currentMember.trackers;

  // Populate the tracker dropdown
  const trackerOptions = trackers
    .map((tracker) => `<option value="${tracker.name}">${tracker.name}</option>`)
    .join("");

  content.innerHTML = `
    <h2>Reports</h2>
    <div class="section">
      <label for="trackerSelect"><strong>Select Tracker:</strong></label>
      <select id="trackerSelect" onchange="updateReportOptions()">
        <option value="">Select a tracker</option>
        ${trackerOptions}
      </select>
    </div>
    <div class="section">
      <label for="timeSpan"><strong>Time Span (Last X Days):</strong></label>
      <input type="number" id="timeSpan" placeholder="Enter number of days" />
    </div>
    <div class="section checkbox-section" style="display: none;">
      <input type="checkbox" id="showPeriodStats" onchange="togglePeriodStatistics()" />
      <label for="showPeriodStats"><strong>Show Period Statistics</strong></label>
    </div>
    <div class="section" id="specificEntrySection" style="display: none;">
      <label for="specificEntry"><strong>Select Specific Entry:</strong></label>
      <select id="specificEntry">
        <option value="">All Entries</option>
      </select>
    </div>
    <button onclick="generateReport()">Generate Report</button>
    <div id="reportResults" class="section"></div>
    <div id="periodStats" class="section" style="display: none;"></div>
  `;
}

function updateReportOptions() {
  const trackerName = document.getElementById("trackerSelect").value;
  const specificEntrySection = document.getElementById("specificEntrySection");
  const specificEntryDropdown = document.getElementById("specificEntry");
  const showPeriodStatsSection = document.querySelector(".checkbox-section");

  if (!trackerName) {
    specificEntrySection.style.display = "none";
    showPeriodStatsSection.style.display = "none"; // Hide the checkbox if no tracker is selected
    return;
  }

  const tracker = currentMember.trackers.find((t) => t.name === trackerName);

  if (tracker.type === "array-objects" || tracker.type === "array-objects-checkbox") {
    specificEntrySection.style.display = "block";

    // Populate specific entry dropdown
    const entryOptions = tracker.value
      .map((entry) => `<option value="${entry.name}">${entry.name}</option>`)
      .join("");
    specificEntryDropdown.innerHTML = `<option value="">All Entries</option>${entryOptions}`;
  } else {
    specificEntrySection.style.display = "none";
  }

  // Show or hide the "Show Period Statistics" checkbox based on tracker type
  if (tracker.type === "limited-number") {
    showPeriodStatsSection.style.display = "flex"; // Show the checkbox
  } else {
    showPeriodStatsSection.style.display = "none"; // Hide the checkbox
  }
}

function generateReport() {
  const trackerName = document.getElementById("trackerSelect").value;
  const timeSpan = parseInt(document.getElementById("timeSpan").value);
  const specificEntry = document.getElementById("specificEntry").value;
  const reportResults = document.getElementById("reportResults");

  if (!trackerName || isNaN(timeSpan) || timeSpan <= 0) {
    alert("Please select a tracker and enter a valid time span.");
    return;
  }

  const tracker = currentMember.trackers.find((t) => t.name === trackerName);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - timeSpan);

  const results = [];
  let totalValue = 0;
  let count = 0;

  Object.keys(measures).forEach((date) => {
    const recordDate = new Date(date);
    if (recordDate >= startDate && recordDate <= today) {
      const dailyRecord = measures[date][currentMember.name];
      const dailyTracker = dailyRecord.trackers.find((t) => t.name === trackerName);

      if (dailyTracker) {
        if (tracker.type === "array-objects-checkbox") {
          if (specificEntry) {
            // Count the number of days the specific entry was taken
            const entry = dailyTracker.value.find((e) => e.name === specificEntry);
            if (entry && entry.checkbox) {
              count++;
            }
          } else {
            // For "All Entries", set count to "N/A"
            count = "N/A";
          }
        } else if (tracker.type === "array-objects") {
          if (specificEntry) {
            const entry = dailyTracker.value.find((e) => e.name === specificEntry);
            if (entry) {
              count++;
            }
          } else {
            count += dailyTracker.value.length;
          }
        } else if (tracker.type === "unlimited-number" || tracker.type === "limited-number") {
          totalValue += dailyTracker.value || 0;
          count++;
        }
      }

      results.push({ date, value: dailyTracker ? dailyTracker.value : null });
    }
  });

  // Calculate average and trend for number trackers
  let average = 0;
  let trend = "No Change";
  if (tracker.type === "unlimited-number" || tracker.type === "limited-number") {
    average = totalValue / count || 0;

    if (results.length > 1) {
      const firstValue = results[0].value || 0;
      const lastValue = results[results.length - 1].value || 0;
      trend = lastValue > firstValue ? "Growth" : lastValue < firstValue ? "Decline" : "No Change";
    }
  }

  // Render the report
  reportResults.innerHTML = `
    <h3>Report Results</h3>
    <p><strong>Tracker:</strong> ${trackerName}</p>
    <p><strong>Time Span:</strong> Last ${timeSpan} days</p>
    ${
      tracker.type === "array-objects-checkbox"
        ? `<p><strong>Total Count:</strong> ${count}</p>`
        : tracker.type === "array-objects"
        ? `<p><strong>Total Count:</strong> ${count}</p>`
        : `<p><strong>Average:</strong> ${average.toFixed(2)}</p>
           <p><strong>Trend:</strong> ${trend}</p>`
    }
    <h4>Details</h4>
    <ul>
      ${results
        .map(
          (result) => `
        <li>
          <strong>${result.date}:</strong> ${
            typeof result.value === "object"
              ? result.value
                  .map(
                    (entry) =>
                      `${entry.name ? entry.name : entry} ${
                        entry.details ? "(" + entry.details + ")" : ""
                      } ${entry.checkbox ? "&#9989;" : "&#10060;"}`
                  )
                  .join(", ")
              : result.value
          }
        </li>
      `
        )
        .join("")}
    </ul>
  `;

  // Recalculate period statistics if the checkbox is checked
  if (document.getElementById("showPeriodStats").checked) {
    togglePeriodStatistics();
  }
}

function calculatePeriodStatistics(trackerName) {
  const today = new Date();
  const allDates = Object.keys(measures)
    .filter((date) => measures[date][currentMember.name])
    .sort((a, b) => new Date(a) - new Date(b)); // Sort dates in ascending order

  const trackerValues = allDates.map((date) => {
    const dailyRecord = measures[date][currentMember.name];
    const tracker = dailyRecord.trackers.find((t) => t.name === trackerName);
    return { date, value: tracker ? tracker.value : 0 };
  });

  let lastPeriodDate = null;
  let periodDurations = [];
  let cycleDurations = [];
  let currentPeriodStart = null;
  let currentPeriodLength = 0;
  let zeroDayCount = 0;

  trackerValues.forEach(({ date, value }, index) => {
    if (value > 0) {
      if (currentPeriodStart === null) {
        currentPeriodStart = date; // Start of a new period
      }
      currentPeriodLength++;
      zeroDayCount = 0; // Reset zero-day counter
    } else {
      zeroDayCount++;
      if (zeroDayCount >= 9 && currentPeriodStart !== null) {
        // End of the current period
        periodDurations.push(currentPeriodLength);
        lastPeriodDate = date;
        currentPeriodStart = null;
        currentPeriodLength = 0;

        // Calculate cycle duration
        if (periodDurations.length > 1) {
          const previousPeriodEnd = new Date(allDates[index - currentPeriodLength - 1]);
          const currentCycleStart = new Date(date);
          const cycleDuration = Math.ceil((currentCycleStart - previousPeriodEnd) / (1000 * 60 * 60 * 24));
          cycleDurations.push(cycleDuration);
        }
      }
    }
  });

  // Calculate averages
  const averagePeriodDuration =
    periodDurations.reduce((sum, duration) => sum + duration, 0) / periodDurations.length || 0;
  const averageCycleDuration =
    cycleDurations.reduce((sum, duration) => sum + duration, 0) / cycleDurations.length || 0;

  return {
    lastPeriodDate,
    averagePeriodDuration: averagePeriodDuration.toFixed(2),
    averageCycleDuration: averageCycleDuration.toFixed(2),
  };
}

function togglePeriodStatistics() {
  const showPeriodStats = document.getElementById("showPeriodStats").checked;
  const periodStatsSection = document.getElementById("periodStats");

  if (showPeriodStats) {
    const trackerName = document.getElementById("trackerSelect").value;
    if (!trackerName) {
      alert("Please select a tracker to view period statistics.");
      document.getElementById("showPeriodStats").checked = false;
      return;
    }

    const tracker = currentMember.trackers.find((t) => t.name === trackerName);
    if (tracker.type !== "limited-number") {
      alert("Period statistics are only available for limited-number trackers.");
      document.getElementById("showPeriodStats").checked = false;
      return;
    }

    const stats = calculatePeriodStatistics(trackerName);
    periodStatsSection.innerHTML = `
      <h3>Period Statistics</h3>
      <p><strong>Last Period Date:</strong> ${stats.lastPeriodDate || "N/A"}</p>
      <p><strong>Average Period Duration:</strong> ${stats.averagePeriodDuration} days</p>
      <p><strong>Average Cycle Duration:</strong> ${stats.averageCycleDuration} days</p>
    `;
    periodStatsSection.style.display = "block";
  } else {
    periodStatsSection.style.display = "none";
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
document.getElementById("content").addEventListener("click", (event) => {
  if (event.target.classList.contains("accordion-header")) {
    const accordion = event.target.parentElement;
    const date = accordion.getAttribute("data-date");
    // Toggle the open state
    accordion.classList.toggle("open");
    toggleAccordion(event);
    openAccordions[date] = accordion.classList.contains("open");
  }
});

const ICONS = [
  "glass-of-water",
  "medicine",
  "checkbox",
  "blood-drop",
  "headache-man",
  "headache-woman",
  "period-calendar",
  "period-pain",
  "wine-glass",
  "beer-mug",
  "nail-biting",
  "trichotillomania"
];

function openIconSelector() {
  const modal = document.getElementById("iconSelectorModal");
  const iconGrid = modal.querySelector(".icon-grid");

  // Populate the modal dynamically
  iconGrid.innerHTML = ICONS.map(
    (icon) => `
      <img 
        src="images/trackingIcons/${icon}-filled.png" 
        alt="${icon}" 
        onclick="selectIcon('${icon}')"
      />
    `
  ).join("");

  modal.classList.remove("hidden");
}

function selectIcon(iconName) {
  const trackerIconInput = document.getElementById("trackerIcon");
  trackerIconInput.value = iconName; // Set the selected icon value

  // Update the icon display without re-rendering the fields
  const iconPreview = document.querySelector(".icon-preview");
  if (iconPreview) {
    iconPreview.src = `images/trackingIcons/${iconName}-filled.png`;
    iconPreview.alt = iconName;
  } else {
    const button = document.querySelector("button[onclick='openIconSelector()']");
    if (button) {
      button.outerHTML = `<img src="images/trackingIcons/${iconName}-filled.png" alt="${iconName}" class="icon-preview" onclick="openIconSelector()" />`;
    }
  }

  closeIconSelector();
}

function closeIconSelector() {
  document.getElementById("iconSelectorModal").classList.add("hidden");
}

//localStorage Validation
function validateLocalStorage() {
  let isValid = true;

  // Validate config structure
  const savedConfig = localStorage.getItem("config");
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      if (!Array.isArray(parsedConfig.members)) {
        isValid = false;
      } else {
        parsedConfig.members.forEach((member) => {
          if (
            typeof member.name !== "string" ||
            !Array.isArray(member.trackers)
          ) {
            isValid = false;
          }
        });
      }
    } catch (e) {
      isValid = false;
    }
  }

  // Validate measures structure
  const savedMeasures = localStorage.getItem("measures");
  if (savedMeasures) {
    try {
      const parsedMeasures = JSON.parse(savedMeasures);
      if (typeof parsedMeasures !== "object" || Array.isArray(parsedMeasures)) {
        isValid = false;
      } else {
        Object.keys(parsedMeasures).forEach((date) => {
          const dailyData = parsedMeasures[date];
          if (typeof dailyData !== "object") {
            isValid = false;
          } else {
            Object.keys(dailyData).forEach((memberName) => {
              const memberData = dailyData[memberName];
              if (!Array.isArray(memberData.trackers)) {
                isValid = false;
              }
            });
          }
        });
      }
    } catch (e) {
      isValid = false;
    }
  }

  return isValid;
}

function resetLocalStorage() {
  // Clear localStorage
  localStorage.clear();

  // Initialize with default config and measures
  config = { members: [] };
  measures = {};

  saveConfig();
  saveMeasures();

  alert("Your app data has been reset to the default structure.");
}

initApp();