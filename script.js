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
    <div class="section notes-checkbox-section">
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
      <input type="text" id="memberName" value="${member.name}" placeholder="Enter name" />
    </div>
  `;
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
          </div>
        `
        )
        .join("")}
    </div>
  `;
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
      <label for="trackerType"><strong>Select Tracker Type:</strong></label>
      <select id="trackerType" onchange="updateTrackerFields()">
        <option value="unlimited-number">Unlimited Number</option>
        <option value="limited-number">Limited Number</option>
        <option value="array-strings">Array of Strings</option>
        <option value="array-objects">Array of Objects</option>
        <option value="array-objects-checkbox">Array of Objects with Checkbox</option>
        <option value="array-objects-sets">Array of Objects with Sets</option>
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
    fieldsHTML += `
      <div class="section">
        <label for="trackerValue"><strong>Enter Value:</strong></label>
        <input type="number" id="trackerValue" placeholder="Enter value (e.g., 10)" />
      </div>
      <div class="section">
        <label for="trackerIcon"><strong>Select Icon:</strong></label>
        <select id="trackerIcon">
          <option value="glass-of-water">Glass of Water</option>
          <option value="medicine">Medicine</option>
        </select>
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
    fieldsHTML += `
      <div class="section">
        <label for="trackerIcon"><strong>Select Icon:</strong></label>
        <select id="trackerIcon">
          <option value="glass-of-water">Glass of Water</option>
          <option value="medicine">Medicine</option>
        </select>
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
  console.log(trackerIcon);

  if (!trackerName) {
    alert("Please enter a tracker name.");
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
    value: ["unlimited-number", "limited-number"].includes(trackerType) ? trackerValue || 0 : [], // Default to 0 or an empty array
    icon: trackerIcon || null, // Assign the selected icon or null
  };

  // Handle specific tracker types
  if (trackerType === "array-strings") {
    const entries = Array.from(document.querySelectorAll("#favoriteEntriesContainer input"))
      .map((input) => input.value.trim())
      .filter((value) => value);
    newTracker.value = entries; // Save favorite entries
  } else if (trackerType === "array-objects") {
    const objects = Array.from(document.querySelectorAll("#favoriteEntriesContainer .input-group"))
      .map((group) => ({
        name: group.querySelector("input:nth-of-type(1)").value.trim(),
        details: group.querySelector("input:nth-of-type(2)").value.trim(),
      }))
      .filter((obj) => obj.name); // Only save objects with a valid "name"
    newTracker.value = objects;
  } else if (trackerType === "array-objects-checkbox") {
    const entries = Array.from(document.querySelectorAll("#favoriteEntriesContainer .input-group"))
      .map((group) => ({
        name: group.querySelector("input:nth-of-type(1)").value.trim(),
        details: group.querySelector("input:nth-of-type(2)").value.trim(),
        checkbox: false, // Default "checkbox" status
      }))
      .filter((entry) => entry.name); // Only save valid entries with a name
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
  config.members[0].trackers.push(newTracker);
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
                class="glass" 
                onclick="updateTracker('${date}', '${member.name}', '${tracker.name}', ${i + 1})"
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
                  class="medicine" 
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
          med => med.name === specificMedicationName && med.checkbox
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
initApp();