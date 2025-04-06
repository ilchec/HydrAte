    let currentMember = null;

    function loadConfig() {
      //config = JSON.parse(config);
      //config = JSON.parse(measures);
      initTabs();
    }

    function initTabs() {
      const tabsEl = document.getElementById("tabs");
      tabsEl.innerHTML = "";
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
      const content = document.getElementById("content");
      const today = new Date().toISOString().split('T')[0];
      let html = "";
      const allDates = [today, ...Object.keys(measures).reverse().filter(date => measures[date][member.name])];

      allDates.forEach((date, idx) => {
        const open = idx === 0 ? 'open' : '';
        const data = measures[date]?.[member.name] || {};
        html += `
        <div class="accordion ${open}">
          <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">${date}</div>
          <div class="accordion-content">
            <div class="section">
              <strong>Water:</strong>
              ${Array.from({ length: member.waterNorm }, (_, i) => `<div class="glass ${i < (data.water || 0) ? 'filled' : ''}" onclick="fillGlass(this, ${i + 1})"></div>`).join('')}
            </div>
            <div class="section">
              <strong>Sweets:</strong>
              <div id="sweetsContainer">
                ${(data.sweets || [{ name: "", amount: "" }]).map(entry => `
                  <div class="input-group">
                    <input list="sweetsList" value="${entry.name || ''}" placeholder="Type sweets" /> <input type="number" value="${entry.amount || ''}" placeholder="Amount" />
                  </div>`).join('')}
              </div>
              <button onclick="addSweetsEntry()">Add More</button>
              <datalist id="sweetsList">
                ${member.sweets.map(s => `<option value="${s}">`).join('')}
              </datalist>
            </div>
            <div class="section">
              <strong>Activity:</strong>
              <div id="activityContainer">
                ${(data.activity || [{ name: "", details: "" }]).map(entry => `
                  <div class="input-group">
                    <input list="activityList" value="${entry.name || ''}" placeholder="Type activity" /> <input type="text" value="${entry.details || ''}" placeholder="Details" />
                  </div>`).join('')}
              </div>
              <button onclick="addActivityEntry()">Add More</button>
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
                    ${ex.reps.map((r, i) => `<label>Set ${i + 1}: <input type="number" value="${actual[i] || ''}" placeholder="Actual" /> <span style="font-size: 0.9em; color: #888;">(Base: ${r})</span></label>`).join('<br>')}
                  </div>
                `;
              }).join('')}
            </div>
            <div class="section">
              <strong>Weight:</strong> <input type="number" value="${data.weight || member.weight}" onchange="saveWeight(this.value)" /> kg
            </div>
          </div>
        </div>
        `;
      });
      content.innerHTML = html;
    }

    function renderSettings() {
      const content = document.getElementById("content");
      content.innerHTML = `
        <div class="section">
          <h2>Add New Family Member</h2>
          <div class="input-group"><input type="text" id="newName" placeholder="Name" /></div>
          <div class="input-group"><input type="number" id="newWeight" placeholder="Weight (kg)" /></div>
          <div class="input-group"><input type="number" id="newWaterNorm" placeholder="Water Norm (glasses)" /></div>
          <div class="input-group"><input type="text" id="newSweets" placeholder="Comma-separated sweets" /></div>
          <div class="input-group"><input type="text" id="newActivity" placeholder="Comma-separated activities" /></div>
          <div class="input-group"><textarea id="newExercises" placeholder="Exercises (format: name|sets|reps1,reps2,... per line)"></textarea></div>
          <button onclick="addNewMember()">Save Member</button>
        </div>
      `;
    }

    function addNewMember() {
      const name = document.getElementById("newName").value;
      const weight = parseFloat(document.getElementById("newWeight").value);
      const waterNorm = parseInt(document.getElementById("newWaterNorm").value);
      const sweets = document.getElementById("newSweets").value.split(',').map(s => s.trim());
      const activity = document.getElementById("newActivity").value.split(',').map(a => a.trim());
      const exerciseLines = document.getElementById("newExercises").value.split('\n');
      const exercises = exerciseLines.map(line => {
        const [name, setsStr, repsStr] = line.split('|');
        return {
          name: name.trim(),
          sets: parseInt(setsStr),
          reps: repsStr.split(',').map(r => parseInt(r))
        };
      });

      config.members.push({ name, weight, waterNorm, sweets, activity, exercises });
      localStorage.setItem('config', JSON.stringify(config));
      initTabs();
    }

    function fillGlass(el, count) {
      const glasses = el.parentNode.querySelectorAll('.glass');
      glasses.forEach((g, i) => g.classList.toggle('filled', i < count));
    }

    function addSweetsEntry() {
      const container = document.getElementById("sweetsContainer");
      const div = document.createElement("div");
      div.className = "input-group";
      div.innerHTML = `<input list="sweetsList" placeholder="Type sweets" /> <input type="number" placeholder="Amount" />`;
      container.appendChild(div);
    }

    function addActivityEntry() {
      const container = document.getElementById("activityContainer");
      const div = document.createElement("div");
      div.className = "input-group";
      div.innerHTML = `<input list="activityList" placeholder="Type activity" /> <input type="text" placeholder="Details" />`;
      container.appendChild(div);
    }

    function saveWeight(newWeight) {
      currentMember.weight = parseFloat(newWeight);
      localStorage.setItem('config', JSON.stringify(config));
      const saveMessage = document.getElementById("saveMessage");
      saveMessage.style.display = "block";
      setTimeout(() => saveMessage.style.display = "none", 2000);
    }

    loadConfig();