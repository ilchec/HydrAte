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
    initApp();
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
    exercises: [],
    medications: { regular: [], occasional: [] } // Ensure medications is initialized
  };

  // Ensure medications object exists
  member.medications.regular = member.medications.regular || [];
  member.medications.occasional = member.medications.occasional || [];

  const sweets = member.sweets.join(", ");
  const activities = member.activity.join(", ");
  const regularMedications = member.medications.regular
    .map(med => `${med.name}|${med.dose}`)
    .join("\n");
  const occasionalMedications = member.medications.occasional.join(", ");
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
      <textarea id="sweets" placeholder="e.g., Chocolate, Candy">${sweets}</textarea>
    </div>
    <div class="section">
      <label for="activities"><strong>Favorite Activities (comma-separated):</strong></label>
      <textarea id="activities" placeholder="e.g., Walking, Yoga">${activities}</textarea>
    </div>
    <div class="section">
      <label for="regularMedications"><strong>Regular Medications (one per line, format: Name|Dose):</strong></label>
      <textarea id="regularMedications" placeholder="e.g., Aspirin|100mg">${regularMedications}</textarea>
    </div>
    <div class="section">
      <label for="occasionalMedications"><strong>Occasional Medications (comma-separated):</strong></label>
      <textarea id="occasionalMedications" placeholder="e.g., Ibuprofen, Paracetamol">${occasionalMedications}</textarea>
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
  const regularMedications = document.getElementById("regularMedications").value.split('\n').map(line => {
    const [name, dose] = line.split('|');
    return { name: name.trim(), dose: dose.trim() };
  });
  const occasionalMedications = document.getElementById("occasionalMedications").value.split(',').map(m => m.trim());
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
      exercises,
      medications: {
        regular: regularMedications,
        occasional: occasionalMedications
      }
    }
  ];

  saveConfig();
  alert("Settings saved! Redirecting to the diary...");
  initApp();
}

function saveConfig() {
  localStorage.setItem('config', JSON.stringify(config));
}

function saveMeasures() {
  localStorage.setItem('measures', JSON.stringify(measures));
}

function initApp() {
  if (config.members.length === 0) {
    currentMember = null;
    document.getElementById("content").innerHTML = "<p>No members available. Please configure the app in the settings.</p>";
    return;
  }

  // Ensure medications are initialized
  config.members[0].medications = config.members[0].medications || { regular: [], occasional: [] };

  // Set the user's name in the header
  const userNameEl = document.getElementById("user-name");
  userNameEl.textContent = config.members[0].name;

  // Ensure today's record exists in measures
  const today = new Date().toISOString().split('T')[0];
  if (!measures[today]) {
    measures[today] = {};
  }
  if (!measures[today][config.members[0].name]) {
    measures[today][config.members[0].name] = {
      water: 0,
      sweets: [],
      regularMedications: config.members[0].medications.regular.map(med => ({
        name: med.name,
        dose: med.dose,
        taken: false // Default to not taken
      })),
      occasionalMedications: [],
      activity: [],
      exercises: config.members[0].exercises.map(ex => ({
        name: ex.name,
        actualReps: Array(ex.reps.length).fill(0)
      })),
      weight: config.members[0].weight,
      note: ""
    };
    saveMeasures(); // Save the updated measures to localStorage
  }

  // Set the current member and render the diary
  currentMember = config.members[0];
  renderDiary(currentMember);
}

function renderDiary(member) {
  const content = document.getElementById("content");
  const today = new Date().toISOString().split('T')[0];
  let html = "";

  // Save the current open/close state of the accordions
  const openAccordions = Array.from(document.querySelectorAll(".accordion.open")).map(acc => acc.dataset.date);

  // Get all dates for the member, ensuring today's date is only included once
  const allDates = Object.keys(measures)
    .filter(date => measures[date][member.name])
    .reverse();
  if (!allDates.includes(today)) {
    allDates.unshift(today);
  }

  allDates.forEach((date, idx) => {
    // Ensure the first accordion (today) is open by default
    const open = idx === 0 || openAccordions.includes(date) ? 'open' : '';
    const data = measures[date]?.[member.name] || {};

    html += `
    <div class="accordion ${open}" data-date="${date}">
      <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">${date}</div>
      <div class="accordion-content">
        <div class="section">
          <strong>Water:</strong>
          ${Array.from({ length: member.waterNorm }, (_, i) => `
            <img 
              src="${i < (data.water || 0) ? 'images/glass-of-water.png' : 'images/glass-of-water-empty.png'}" 
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
          <button onclick="addSweetsEntry('${date}')">+ Add More</button>
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
          <button onclick="addActivityEntry('${date}')">+ Add More</button>
          <datalist id="activityList">
            ${member.activity.map(a => `<option value="${a}">`).join('')}
          </datalist>
        </div>
        <div class="section">
          <strong>Regular Medications:</strong>
          <div id="regularMedicationsContainer-${date}">
            ${(data.regularMedications || []).map(med => `
              <div class="input-group">
                <img 
                  src="${med.taken ? 'images/medicine-filled.png' : 'images/medicine.png'}" 
                  class="medicine" 
                  onclick="toggleRegularMedication('${date}', '${member.name}', '${med.name}', event)"
                  alt="Medicine Checkbox"
                />
                <span>${med.name} (${med.dose})</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="section">
          <strong>Occasional Medications:</strong>
          <div id="occasionalMedicationsContainer-${date}">
            ${(data.occasionalMedications || []).map(entry => `
              <div class="input-group">
                <input list="occasionalMedicationsList" value="${entry.name || ''}" placeholder="Type medication" onchange="addNewMedication(this.value)" /> 
                <input type="text" value="${entry.dose || ''}" placeholder="Dose" />
              </div>`).join('')}
          </div>
          <button onclick="addMedicationEntry('${date}')">+ Add More</button>
          <datalist id="occasionalMedicationsList">
            ${(member.medications?.occasional || []).map(m => `<option value="${m}">`).join('')}
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
        <div class="section">
          <strong>Note:</strong>
          <textarea id="note-${date}" placeholder="Add a note for this day...">${data.note || ''}</textarea>
        </div>
      </div>
    </div>
    `;
  });

  content.innerHTML = html;

  // Add the Save button
  const saveButton = document.createElement("div");
  saveButton.id = "saveButton";
  saveButton.textContent = "Save Changes";
  saveButton.onclick = () => saveMeasurements(today, member.name);
  document.body.appendChild(saveButton);

  // Add event listeners to show the Save button when editing
  const inputs = content.querySelectorAll("input, textarea");
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      saveButton.classList.add("visible");
    });
  });
}

function fillGlass(el, count, date, memberName) {
  const glasses = el.parentNode.querySelectorAll('.glass');
  glasses.forEach((glass, i) => {
    glass.src = i < count ? 'images/glass-of-water.png' : 'images/glass-of-water-empty.png';
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
  // Show the Save button
  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.classList.add("visible");
  }
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
  // Show the Save button
  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.classList.add("visible");
  }
}

function saveMeasurements(date, memberName) {
  const data = collectDataForDate(date, memberName);

  // Replace the data for the specified date and member
  measures[date] = measures[date] || {};
  measures[date][memberName] = data;

  // Save the updated measures and config
  saveMeasures();
  saveConfig();

  // Show the alert and hide the Save button after the alert is dismissed
  alert('All measurements saved!');
  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.classList.remove("visible"); // Slide the button down and hide it
  }
}

function collectDataForDate(date, memberName) {
  const data = {};

  // Collect water intake
  const waterImages = document.querySelectorAll(`.accordion[data-date="${date}"] .glass`);
  const waterCount = Array.from(waterImages).filter(img => img.src.includes('images/glass-of-water.png')).length;
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

  // Collect regular medications
  const regularMedicationsContainer = document.querySelector(`#regularMedicationsContainer-${date}`);
  data.regularMedications = Array.from(regularMedicationsContainer.querySelectorAll('.input-group')).map(group => {
    const name = group.querySelector('span').textContent.split(' (')[0].trim();
    const dose = group.querySelector('span').textContent.split(' (')[1]?.replace(')', '').trim();
    const taken = group.querySelector('img').src.includes('medicine-filled.png');
    return { name, dose, taken };
  });

  // Collect occasional medications
  const occasionalMedicationsInputs = document.querySelectorAll(`#occasionalMedicationsContainer-${date} .input-group`);
  data.occasionalMedications = Array.from(occasionalMedicationsInputs).map(group => {
    const nameInput = group.querySelector('input[list="occasionalMedicationsList"]');
    const doseInput = group.querySelector('input[type="text"]:nth-of-type(2)');
    if (!nameInput || !doseInput) return null;

    const name = nameInput.value.trim();
    const dose = doseInput.value.trim();

    return name ? { name, dose } : null;
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

  // Collect note
  const noteInput = document.getElementById(`note-${date}`);
  data.note = noteInput ? noteInput.value.trim() : '';

  return data;
}

function addMedicationEntry(date) {
  const container = document.querySelector(`#occasionalMedicationsContainer-${date}`);
  if (!container) return;

  const div = document.createElement("div");
  div.className = "input-group";
  div.innerHTML = `
    <input list="occasionalMedicationsList" placeholder="Type medication" onchange="addNewMedication(this.value)" /> 
    <input type="text" placeholder="Dose" />
  `;
  container.appendChild(div);
  // Show the Save button
  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.classList.add("visible");
  }
}

function addNewMedication(medication) {
  if (medication && !config.members[0].medications.includes(medication)) {
    config.members[0].medications.push(medication);
    saveConfig();
    updateMedicationsDatalist();
  }
}

function updateMedicationsDatalist() {
  const medicationsList = document.getElementById("medicationsList");
  medicationsList.innerHTML = config.members[0].medications.map(m => `<option value="${m}">`).join('');
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

function toggleRegularMedication(date, memberName, medicationName, event) {
  if (event) {
    event.stopPropagation();
  }
  // Ensure the measures object is properly initialized
  measures[date] = measures[date] || {};
  measures[date][memberName] = measures[date][memberName] || {};
  measures[date][memberName].regularMedications = measures[date][memberName].regularMedications || [];

  // Find the medication in the regularMedications array
  const medication = measures[date][memberName].regularMedications.find(med => med.name === medicationName);

  if (medication) {
    // Toggle the "taken" state
    medication.taken = !medication.taken;
  } else {
    // If the medication is not found, add it with the "taken" state set to true
    measures[date][memberName].regularMedications.push({ name: medicationName, dose: "", taken: true });
  }

  // Save the updated measures to localStorage
  saveMeasures();

  // Re-render the diary to reflect the updated state
  renderDiary(config.members[0]);
}

loadConfig();