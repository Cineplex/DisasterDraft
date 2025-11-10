// Extracted scripts from BoardGame.html
const defaultConfig = {
  game_title: "HelpCity",
  player_1_name: "ผู้เล่นคนที่ 1",
  player_2_name: "ผู้เล่นคนที่ 2",
  player_3_name: "ผู้เล่นคนที่ 3",
  player_4_name: "ผู้เล่นคนที่ 4",
  player_5_name: "ผู้เล่นคนที่ 5",
  people_label: "คน",
  house_label: "บ้าน",
  condo_label: "คอนโด",
  coin_label: "เหรียญ",
  hazard_label: "ภัยอันตราย (Hazard)",
  exposure_label: "ความล่อแหลม (Exposure)",
  vulnerability_label: "ความเปราะบาง (Vulnerability)",
  capacity_label: "ความสามารถ (Capacity)"
};

let playerCount = 0;

function getPlayerName(playerId) {
  const config = window.elementSdk?.config || defaultConfig;
  const playerKey = `player_${playerId}_name`;
  return config[playerKey] || defaultConfig[playerKey] || `ผู้เล่นคนที่ ${playerId}`;
}

function toggleEditName(playerId) {
  const nameSpan = document.getElementById(`player-name-${playerId}`);
  const editBtn = document.getElementById(`edit-btn-${playerId}`);
  const removeBtn = document.getElementById(`remove-btn-${playerId}`);
  if (!nameSpan || !editBtn) return;
  
  const currentName = nameSpan.textContent;
  const isEditing = nameSpan.querySelector('input');
  
  if (isEditing) {
    return;
  }
  
  // Typography from the display span to ensure exact match
  const cs = window.getComputedStyle(nameSpan);
  const fontFamily = cs.fontFamily;
  const fontSize = cs.fontSize;
  const fontWeight = cs.fontWeight;
  const letterSpacing = cs.letterSpacing;
  const lineHeight = cs.lineHeight;
  
  // Hidden measurer for exact width
  function measureTextWidth(text) {
    const measurer = document.createElement('span');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.whiteSpace = 'pre';
    measurer.style.fontFamily = fontFamily;
    measurer.style.fontSize = fontSize;
    measurer.style.fontWeight = fontWeight;
    measurer.style.letterSpacing = letterSpacing;
    measurer.textContent = text || '';
    document.body.appendChild(measurer);
    const width = Math.ceil(measurer.getBoundingClientRect().width);
    measurer.remove();
    return width;
  }
  
  // Hide pencil and trash while editing
  editBtn.style.display = 'none';
  if (removeBtn) removeBtn.style.display = 'none';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.placeholder = currentName; // show previous name in gray when empty
  input.className = 'name-input-inline';
  input.style.boxSizing = 'border-box';
  input.style.fontFamily = fontFamily;
  input.style.fontSize = fontSize;
  input.style.fontWeight = fontWeight;
  input.style.letterSpacing = letterSpacing;
  input.style.lineHeight = lineHeight;
  
  const horizontalPadding = 12; // approx padding + small buffer for caret
  input.style.width = (measureTextWidth(currentName) + horizontalPadding) + 'px';
  
  const buttonsDiv = document.createElement('span');
  buttonsDiv.className = 'name-edit-buttons';
  
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '✓';
  confirmBtn.className = 'name-confirm-btn';
  confirmBtn.title = 'ยืนยัน';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '✕';
  cancelBtn.className = 'name-cancel-btn';
  cancelBtn.title = 'ยกเลิก';
  
  function restoreAfterEdit(finalText) {
    nameSpan.textContent = finalText;
    nameSpan.classList.remove('name-placeholder');
    editBtn.style.display = 'inline-flex';
    if (removeBtn) removeBtn.style.display = '';
    updateRemoveButtons();
  }
  
  function confirmEdit() {
    const trimmed = (input.value || '').trim();
    if (!trimmed) {
      // Keep previous name when confirmed empty
      restoreAfterEdit(currentName);
    } else {
      restoreAfterEdit(trimmed);
    }
  }
  
  function cancelEdit() {
    // Restore exactly previous display state
    restoreAfterEdit(currentName);
  }
  
  confirmBtn.onclick = confirmEdit;
  cancelBtn.onclick = cancelEdit;
  
  input.onkeydown = function(e) {
    if (e.key === 'Enter') {
      confirmEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
  };
  
  input.oninput = function() {
    const text = (input.value || '').trim();
    // While editing: if empty, show placeholder and match width to previous name
    if (!text) {
      input.style.width = (measureTextWidth(currentName) + horizontalPadding) + 'px';
    } else {
      input.style.width = (measureTextWidth(input.value) + horizontalPadding) + 'px';
    }
  };
  
  // Confirm on blur remains; confirming empty keeps previous name
  input.onblur = function() {
    setTimeout(() => {
      const stillEditing = nameSpan.querySelector('input') === input;
      if (stillEditing) {
        confirmEdit();
      }
    }, 0);
  };
  
  buttonsDiv.appendChild(confirmBtn);
  buttonsDiv.appendChild(cancelBtn);
  
  nameSpan.textContent = '';
  nameSpan.appendChild(input);
  nameSpan.appendChild(buttonsDiv);
  input.focus();
  input.select();
}

function createPlayerCard(playerId) {
  const card = document.createElement('div');
  card.className = 'player-card';
  card.id = `player-${playerId}`;
  
  const config = window.elementSdk?.config || defaultConfig;
  const playerName = getPlayerName(playerId);
  const colorClass = `color-${((playerId - 1) % 5) + 1}`;
  
  // Always render remove button; visibility handled by updateRemoveButtons
  const removeButtonHtml = `
          <button id="remove-btn-${playerId}" class="remove-player-btn" onclick="confirmRemovePlayer(${playerId})" title="ลบผู้เล่น">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>`;
  
  card.innerHTML = `
    <div class="player-header ${colorClass}">
      <h2>
        <span id="player-name-${playerId}">${playerName}</span>
        <button id="edit-btn-${playerId}" class="edit-name-btn" onclick="toggleEditName(${playerId})" title="แก้ไขชื่อ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      </h2>
      ${removeButtonHtml}
    </div>
    
    <div class="section">
      <h3>มูลค่าสินทรัพย์</h3>
      <div class="input-group">
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span>${config.people_label} (4 ${config.coin_label})</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="people-${playerId}">3</div>
            <button class="increment-btn" onclick="incrementValue('people-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('people-${playerId}', 0)">−</button>
          </div>
        </div>
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span>${config.house_label} (1 ${config.coin_label})</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="house-${playerId}">3</div>
            <button class="increment-btn" onclick="incrementValue('house-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('house-${playerId}', 0)">−</button>
          </div>
        </div>
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2z"/>
            </svg>
            <span>${config.condo_label} (2 ${config.coin_label})</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="condo-${playerId}">0</div>
            <button class="increment-btn" onclick="incrementValue('condo-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('condo-${playerId}', 0)">−</button>
          </div>
        </div>
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
            </svg>
            <span>${config.coin_label}</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="coins-${playerId}">3</div>
            <button class="increment-btn" onclick="incrementValue('coins-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('coins-${playerId}', null)">−</button>
          </div>
        </div>
      </div>
      <button class="calculate-btn" onclick="calculateAssets(${playerId})">คำนวณมูลค่าสินทรัพย์</button>
      <div class="result" id="assets-result-${playerId}">รอการคำนวณ</div>
    </div>
    
    <div class="section">
      <h3>วิเคราะห์ความเสี่ยง</h3>
      <div class="formula">
        <span class="formula-label">Risk =</span>
        <div class="formula-fraction">
          <div class="formula-numerator">${config.hazard_label} × ${config.exposure_label} × ${config.vulnerability_label}</div>
          <div class="formula-divider"></div>
          <div class="formula-denominator">${config.capacity_label}</div>
        </div>
      </div>
      <div class="input-group">
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span>${config.hazard_label}</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="hazard-${playerId}">0</div>
            <button class="increment-btn" onclick="incrementValue('hazard-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('hazard-${playerId}', 0)">−</button>
          </div>
        </div>
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>${config.exposure_label}</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="exposure-${playerId}">2</div>
            <button class="increment-btn" onclick="incrementValue('exposure-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('exposure-${playerId}', 1)">−</button>
          </div>
        </div>
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/>
            </svg>
            <span>${config.vulnerability_label}</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="vulnerability-${playerId}">2</div>
            <button class="increment-btn" onclick="incrementValue('vulnerability-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('vulnerability-${playerId}', 1)">−</button>
          </div>
        </div>
        <div class="input-field">
          <label>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#667eea">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
            </svg>
            <span>${config.capacity_label}</span>
          </label>
          <div class="input-wrapper">
            <div class="value-display" id="capacity-${playerId}">2</div>
            <button class="increment-btn" onclick="incrementValue('capacity-${playerId}')">+</button>
            <button class="decrement-btn" onclick="decrementValue('capacity-${playerId}', 1)">−</button>
          </div>
        </div>
      </div>
      <button class="calculate-btn" onclick="calculateRisk(${playerId})">คำนวณความเสี่ยง</button>
      <div class="result" id="risk-result-${playerId}">รอการคำนวณ</div>
    </div>
  `;
  
  return card;
}

function addPlayer() {
  playerCount++;
  const container = document.getElementById('players-container');
  const card = createPlayerCard(playerCount);
  container.appendChild(card);
  updateRemoveButtons();
}

function confirmRemovePlayer(playerId) {
  const allPlayers = document.querySelectorAll('.player-card');
  if (allPlayers.length <= 1) {
    return;
  }
  
  const playerName = document.getElementById(`player-name-${playerId}`).textContent;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <h3>ยืนยันการลบ</h3>
      </div>
      <div class="modal-body">
        คุณต้องการลบ <strong>${playerName}</strong> ใช่หรือไม่?<br>
        ข้อมูลทั้งหมดของผู้เล่นคนนี้จะถูกลบอย่างถาวร
      </div>
      <div class="modal-buttons">
        <button class="modal-btn modal-btn-confirm" onclick="removePlayer(${playerId})">ยืนยัน</button>
        <button class="modal-btn modal-btn-cancel" onclick="closeModal()">ยกเลิก</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.onclick = function(e) {
    if (e.target === modal) {
      closeModal();
    }
  };
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

function removePlayer(playerId) {
  const card = document.getElementById(`player-${playerId}`);
  if (card) {
    card.remove();
    updateRemoveButtons();
    closeModal();
  }
}

function updateRemoveButtons() {
  const allPlayers = document.querySelectorAll('.player-card');
  allPlayers.forEach(card => {
    const removeBtn = card.querySelector('.remove-player-btn');
    if (removeBtn) {
      if (allPlayers.length > 1) {
        removeBtn.style.display = 'flex';
      } else {
        removeBtn.style.display = 'none';
      }
    }
  });
}

function incrementValue(inputId) {
  const display = document.getElementById(inputId);
  if (display) {
    let value = parseInt(display.textContent) || 0;
    value++;
    display.textContent = value;
  }
}

function decrementValue(inputId, min = 0) {
  const display = document.getElementById(inputId);
  if (display) {
    let value = parseInt(display.textContent) || 0;
    if (min !== null && value > min) {
      value--;
    } else if (min === null) {
      value--;
    }
    display.textContent = value;
  }
}

function calculateAssets(playerId) {
  const people = Math.max(0, parseInt(document.getElementById(`people-${playerId}`).textContent) || 0);
  const house = Math.max(0, parseInt(document.getElementById(`house-${playerId}`).textContent) || 0);
  const condo = Math.max(0, parseInt(document.getElementById(`condo-${playerId}`).textContent) || 0);
  const coins = parseInt(document.getElementById(`coins-${playerId}`).textContent) || 0;
  
  const total = (people * 4) + (house * 1) + (condo * 2) + coins;
  
  const config = window.elementSdk?.config || defaultConfig;
  document.getElementById(`assets-result-${playerId}`).textContent = `มูลค่ารวม: ${total} ${config.coin_label}`;
}

function calculateRisk(playerId) {
  const hazard = Math.max(0, parseInt(document.getElementById(`hazard-${playerId}`).textContent) || 0);
  const exposure = Math.max(1, parseInt(document.getElementById(`exposure-${playerId}`).textContent) || 1);
  const vulnerability = Math.max(1, parseInt(document.getElementById(`vulnerability-${playerId}`).textContent) || 1);
  const capacity = Math.max(1, parseInt(document.getElementById(`capacity-${playerId}`).textContent) || 1);
  
  const risk = (hazard * exposure * vulnerability) / capacity;
  
  document.getElementById(`risk-result-${playerId}`).textContent = `ความเสี่ยง: ${risk.toFixed(2)}`;
}

function updateAllPlayerLabels() {
  const config = window.elementSdk?.config || defaultConfig;
  
  document.getElementById('game-title').textContent = config.game_title || defaultConfig.game_title;
  
  document.querySelectorAll('.player-card').forEach(card => {
    const playerId = card.id.replace('player-', '');
    
    const playerNameElement = document.getElementById(`player-name-${playerId}`);
    if (playerNameElement) {
      playerNameElement.textContent = getPlayerName(playerId);
    }
    
    const labels = card.querySelectorAll('.input-field label span');
    if (labels[0]) labels[0].textContent = `${config.people_label} (4 ${config.coin_label})`;
    if (labels[1]) labels[1].textContent = `${config.house_label} (1 ${config.coin_label})`;
    if (labels[2]) labels[2].textContent = `${config.condo_label} (2 ${config.coin_label})`;
    if (labels[3]) labels[3].textContent = config.coin_label;
    if (labels[4]) labels[4].textContent = config.hazard_label;
    if (labels[5]) labels[5].textContent = config.exposure_label;
    if (labels[6]) labels[6].textContent = config.vulnerability_label;
    if (labels[7]) labels[7].textContent = config.capacity_label;
    
    const formula = card.querySelector('.formula');
    if (formula) {
      const formulaLabel = formula.querySelector('.formula-label');
      const formulaNumerator = formula.querySelector('.formula-numerator');
      const formulaDenominator = formula.querySelector('.formula-denominator');
      if (formulaLabel) formulaLabel.textContent = 'Risk =';
      if (formulaNumerator) formulaNumerator.textContent = `(${config.hazard_label} × ${config.exposure_label} × ${config.vulnerability_label})`;
      if (formulaDenominator) formulaDenominator.textContent = config.capacity_label;
    }
  });
}

async function onConfigChange(config) {
  updateAllPlayerLabels();
}

if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig: defaultConfig,
    onConfigChange: onConfigChange,
    mapToCapabilities: (config) => ({
      recolorables: [],
      borderables: [],
      fontEditable: undefined,
      fontSizeable: undefined
    }),
    mapToEditPanelValues: (config) => new Map([
      ["game_title", config.game_title || defaultConfig.game_title],
      ["player_1_name", config.player_1_name || defaultConfig.player_1_name],
      ["player_2_name", config.player_2_name || defaultConfig.player_2_name],
      ["player_3_name", config.player_3_name || defaultConfig.player_3_name],
      ["player_4_name", config.player_4_name || defaultConfig.player_4_name],
      ["player_5_name", config.player_5_name || defaultConfig.player_5_name],
      ["people_label", config.people_label || defaultConfig.people_label],
      ["house_label", config.house_label || defaultConfig.house_label],
      ["condo_label", config.condo_label || defaultConfig.condo_label],
      ["coin_label", config.coin_label || defaultConfig.coin_label],
      ["hazard_label", config.hazard_label || defaultConfig.hazard_label],
      ["exposure_label", config.exposure_label || defaultConfig.exposure_label],
      ["vulnerability_label", config.vulnerability_label || defaultConfig.vulnerability_label],
      ["capacity_label", config.capacity_label || defaultConfig.capacity_label]
    ])
  });
}

// Initialize
addPlayer();
updateRemoveButtons();

// Cloudflare injected script kept as-is
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'99c53eb022244b94',t:'MTc2Mjc3NDUxMC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
