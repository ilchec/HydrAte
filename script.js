let currentMember = null;
let config = { members: [] };
let measures = {};

function loadConfig() {
  const savedConfig = localStorage.getItem('config');
  const savedMeasures = localStorage.getItem('measures');

  if (savedConfig) {
    config = JSON.parse(savedConfig);
  }

  if (savedMeasures) {
    measures = JSON.parse(savedMeasures);
  }

  // If no members are found, show the settings page
  if (!config.members || config.members.length === 0) {
    renderSettings();
  } else {
    initTabs();
  }
}

function saveConfig() {
  localStorage.setItem('config', JSON.stringify(config));
}

function saveMeasures() {
  localStorage.setItem('measures', JSON.stringify(measures));
}

function renderSettings() {
  const settingsButton = document.querySelector('button[onclick="renderSettings()"]');
  if (settingsButton) {
    settingsButton.style.display = "none";
  }
  const content = document.getElementById("content");

  // Fetch the first member's data from config if available
  const member = config.members[0] || {
    name: "",
    weight: "",
    waterNorm: "",
    sweets: [],
    activity: [],
    exercises: []
  };

  const sweets = member.sweets.join(", ");
  const activities = member.activity.join(", ");
  const exercises = member.exercises
    .map(ex => `${ex.name}|${ex.sets}|${ex.reps.join(",")}`)
    .join("\n");

  content.innerHTML = `
    <h2>Settings</h2>
    <p>Please update the required data:</p>
    <div class="section">
      <label for="memberName"><strong>Member Name:</strong></label>
      <input type="text" id="memberName" value="${member.name}" placeholder="Enter name" />
    </div>
    <div class="section">
      <label for="memberWeight"><strong>Weight (kg):</strong></label>
      <input type="number" id="memberWeight" value="${member.weight}" placeholder="Enter weight" />
    </div>
    <div class="section">
      <label for="waterNorm"><strong>Daily Water Norm (glasses):</strong></label>
      <input type="number" id="waterNorm" value="${member.waterNorm}" placeholder="Enter water norm" />
    </div>
    <div class="section">
      <label for="sweets"><strong>Favorite Sweets (comma-separated):</strong></label>
      <input type="text" id="sweets" value="${sweets}" placeholder="e.g., Chocolate, Candy" />
    </div>
    <div class="section">
      <label for="activities"><strong>Favorite Activities (comma-separated):</strong></label>
      <input type="text" id="activities" value="${activities}" placeholder="e.g., Walking, Yoga" />
    </div>
    <div class="section">
      <label for="exercises"><strong>Exercises (one per line, format: Name|Sets|Reps):</strong></label>
      <textarea id="exercises" placeholder="e.g., Push-ups|3|10,10,10">${exercises}</textarea>
    </div>
    <button onclick="saveSettings()">Save</button>
  `;
}

function saveSettings() {
  const name = document.getElementById("memberName").value.trim();
  const weight = parseFloat(document.getElementById("memberWeight").value);
  const waterNorm = parseInt(document.getElementById("waterNorm").value);
  const sweets = document.getElementById("sweets").value.split(',').map(s => s.trim());
  const activities = document.getElementById("activities").value.split(',').map(a => a.trim());
  const exerciseLines = document.getElementById("exercises").value.split('\n');
  const exercises = exerciseLines.map(line => {
    const [name, setsStr, repsStr] = line.split('|');
    return {
      name: name.trim(),
      sets: parseInt(setsStr),
      reps: repsStr.split(',').map(r => parseInt(r))
    };
  });

  if (!name || isNaN(weight) || isNaN(waterNorm)) {
    alert("Please fill out all required fields.");
    return;
  }

  config.members = [
    {
      name,
      weight,
      waterNorm,
      sweets,
      activity: activities,
      exercises
    }
  ];

  saveConfig();
  alert("Settings saved! Redirecting to the diary...");
  initTabs();
}

function saveConfig() {
  localStorage.setItem('config', JSON.stringify(config));
}

function saveMeasures() {
  localStorage.setItem('measures', JSON.stringify(measures));
}

function initTabs() {
  const tabsEl = document.getElementById("tabs");
  tabsEl.innerHTML = "";

  if (config.members.length === 0) {
    currentMember = null;
    document.getElementById("content").innerHTML = "<p>No members available. Please configure the app in the settings.</p>";
    return;
  }

  // Set the user's name in the header
  const userNameEl = document.getElementById("user-name");
  userNameEl.textContent = config.members[0].name;

  config.members.forEach((member, index) => {
    const tab = document.createElement("div");
    tab.className = "tab" + (index === 0 ? " active" : "");
    tab.textContent = member.name;
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMember = member;
      renderDiary(member);
    };
    tabsEl.appendChild(tab);
  });

  currentMember = config.members[0];
  renderDiary(currentMember);
}

function renderDiary(member) {
  const settingsButton = document.querySelector('button[onclick="renderSettings()"]');
  if (settingsButton) {
    settingsButton.style.display = "block";
  }
  const content = document.getElementById("content");
  const today = new Date().toISOString().split('T')[0];
  let html = "";

  // Get all dates for the member, ensuring today's date is only included once
  const allDates = Object.keys(measures)
    .filter(date => measures[date][member.name])
    .reverse();
  if (!allDates.includes(today)) {
    allDates.unshift(today);
  }

  allDates.forEach((date, idx) => {
    const open = idx === 0 ? 'open' : '';
    const data = measures[date]?.[member.name] || {};

    // Add the "Save" button for all dates
    const saveButton = `<button onclick="saveMeasurements('${date}', '${member.name}')">Save</button>`;

    html += `
    <div class="accordion ${open}" data-date="${date}">
      <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">${date}</div>
      <div class="accordion-content">
        <div class="section">
          <strong>Water:</strong>
          ${Array.from({ length: member.waterNorm }, (_, i) => `
            <img 
              src="${i < (data.water || 0) ? 'glass-of-water.png' : 'glass-of-water-empty.png'}" 
              class="glass" 
              onclick="fillGlass(this, ${i + 1}, '${date}', '${member.name}')"
              alt="Glass of Water"
            />
          `).join('')}
        </div>
        <div class="section">
          <strong>Sweets:</strong>
          <div id="sweetsContainer-${date}">
            ${(data.sweets || [{ name: "", amount: "" }]).map(entry => `
              <div class="input-group">
                <input list="sweetsList" value="${entry.name || ''}" placeholder="Type sweets" onchange="addNewSweet(this.value)" /> 
                <input type="number" value="${entry.amount || ''}" placeholder="Amount" />
              </div>`).join('')}
          </div>
          <button onclick="addSweetsEntry('${date}')">Add More</button>
          <datalist id="sweetsList">
            ${member.sweets.map(s => `<option value="${s}">`).join('')}
          </datalist>
        </div>
        <div class="section">
          <strong>Activity:</strong>
          <div id="activityContainer-${date}">
            ${(data.activity || [{ name: "", details: "" }]).map(entry => `
              <div class="input-group">
                <input list="activityList" value="${entry.name || ''}" placeholder="Type activity" onchange="addNewActivity(this.value)" /> 
                <input type="text" value="${entry.details || ''}" placeholder="Details" />
              </div>`).join('')}
          </div>
          <button onclick="addActivityEntry('${date}')">Add More</button>
          <datalist id="activityList">
            ${member.activity.map(a => `<option value="${a}">`).join('')}
          </datalist>
        </div>
        <div class="section">
          <strong>Exercises:</strong>
          ${member.exercises.map(ex => {
            const actual = (data.exercises || []).find(e => e.name === ex.name)?.actualReps || [];
            return `
              <div class="exercise-entry">
                <div><strong>${ex.name}</strong></div>
                ${ex.reps.map((r, i) => `
                  <label>Set ${i + 1}: 
                    <input type="number" value="${actual[i] || ''}" placeholder="Actual" /> 
                    <span style="font-size: 0.9em; color: #888;">(Base: ${r})</span>
                  </label>
                `).join('<br>')}
              </div>
            `;
          }).join('')}
        </div>
        <div class="section">
          <strong>Weight:</strong> <input type="number" value="${data.weight || member.weight}" onchange="saveWeight(this.value, '${date}', '${member.name}')" data-date="${date}" /> kg
        </div>
        ${saveButton}
      </div>
    </div>
    `;
  });

  content.innerHTML = html;
}

function fillGlass(el, count, date, memberName) {
  const glasses = el.parentNode.querySelectorAll('.glass');
  glasses.forEach((glass, i) => {
    glass.src = i < count ? 'glass-of-water.png' : 'glass-of-water-empty.png';
  });

  // Update the water count in the measures object
  measures[date] = measures[date] || {};
  measures[date][memberName] = measures[date][memberName] || {};
  measures[date][memberName].water = count;

  saveMeasures();
}

function saveWeight(newWeight, date, memberName) {
  measures[date] = measures[date] || {};
  measures[date][memberName] = measures[date][memberName] || {};
  measures[date][memberName].weight = parseFloat(newWeight);
  saveMeasures();
  const saveMessage = document.getElementById("saveMessage");
  saveMessage.style.display = "block";
  setTimeout(() => saveMessage.style.display = "none", 2000);
}

function addSweetsEntry(date) {
  const container = document.querySelector(`#sweetsContainer-${date}`);
  if (!container) return;

  const div = document.createElement("div");
  div.className = "input-group";
  div.innerHTML = `
    <input list="sweetsList" placeholder="Type sweets" onchange="addNewSweet(this.value)" /> 
    <input type="number" placeholder="Amount" />
  `;
  container.appendChild(div);
}

function addActivityEntry(date) {
  const container = document.querySelector(`#activityContainer-${date}`);
  if (!container) return;

  const div = document.createElement("div");
  div.className = "input-group";
  div.innerHTML = `
    <input list="activityList" placeholder="Type activity" onchange="addNewActivity(this.value)" /> 
    <input type="text" placeholder="Details" />
  `;
  container.appendChild(div);
}

function saveMeasurements(date, memberName) {
  const data = collectDataForDate(date, memberName);

  // Replace the data for the specified date and member
  measures[date] = measures[date] || {};
  measures[date][memberName] = data;

  saveMeasures();
  alert('All measurements saved!');
}

function collectDataForDate(date, memberName) {
  const data = {};

  // Collect water intake
  const waterImages = document.querySelectorAll(`.accordion[data-date="${date}"] .glass`);
  const waterCount = Array.from(waterImages).filter(img => img.src.includes('glass-of-water.png')).length;
  data.water = waterCount;

  // Collect sweets
  const sweetsInputs = document.querySelectorAll(`#sweetsContainer-${date} .input-group`);
  data.sweets = Array.from(sweetsInputs).map(group => {
    const nameInput = group.querySelector('input[list="sweetsList"]');
    const amountInput = group.querySelector('input[type="number"]');
    if (!nameInput || !amountInput) return null;

    const name = nameInput.value.trim();
    const amount = parseInt(amountInput.value);
    return name && !isNaN(amount) ? { name, amount } : null;
  }).filter(entry => entry);

  // Collect activities
  const activityInputs = document.querySelectorAll(`#activityContainer-${date} .input-group`);
  data.activity = Array.from(activityInputs).map(group => {
    const nameInput = group.querySelector('input[list="activityList"]');
    const detailsInput = group.querySelector('input[type="text"]:nth-of-type(2)');
    if (!nameInput || !detailsInput) return null;

    const name = nameInput.value.trim();
    const details = detailsInput.value.trim();
    return name ? { name, details } : null;
  }).filter(entry => entry);

  // Collect exercises
  data.exercises = currentMember.exercises.map((exercise, exerciseIndex) => {
    const exerciseInputs = document.querySelectorAll(`.exercise-entry:nth-of-type(${exerciseIndex + 1}) input`);
    const actualReps = Array.from(exerciseInputs)
      .slice(0, exercise.reps.length) // Limit to the number of sets defined in the settings
      .map(input => parseInt(input.value))
      .filter(value => !isNaN(value));
    return { name: exercise.name, actualReps };
  });

  // Collect weight
  const weightInput = document.querySelector(`input[type="number"][onchange^="saveWeight"][data-date="${date}"]`);
  data.weight = weightInput ? parseFloat(weightInput.value) : null;

  return data;
}

function addNewSweet(sweet) {
  if (sweet && !config.members[0].sweets.includes(sweet)) {
    config.members[0].sweets.push(sweet);
    saveConfig();
    updateSweetsDatalist();
  }
}

function addNewActivity(activity) {
  if (activity && !config.members[0].activity.includes(activity)) {
    config.members[0].activity.push(activity);
    saveConfig();
    updateActivityDatalist();
  }
}

function updateSweetsDatalist() {
  const sweetsList = document.getElementById("sweetsList");
  sweetsList.innerHTML = config.members[0].sweets.map(s => `<option value="${s}">`).join('');
}

function updateActivityDatalist() {
  const activityList = document.getElementById("activityList");
  activityList.innerHTML = config.members[0].activity.map(a => `<option value="${a}">`).join('');
}

function toggleMenu() {
  const menuDropdown = document.getElementById("menu-dropdown");
  menuDropdown.classList.toggle("visible");
}

loadConfig();