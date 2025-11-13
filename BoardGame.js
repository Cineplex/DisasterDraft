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
const INFO_BUTTON_BRIGHTNESS_THRESHOLD = 190;
let infoButtonContrastRafId = null;
let infoButtonContrastObserver = null;
const INFO_BUTTON_DISPLAY_KEY = '__infoButtonSavedDisplay';
const formulaTexts = {
  label: 'Risk ='
};
const FORMULA_MEDIA_QUERY = '(max-width: 768px)';
let formulaMediaQuery = null;
let formulaMediaQueryListenerAttached = false;

function getPlayerName(playerId) {
  const config = getActiveConfig();
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

function getActiveConfig() {
  return window.elementSdk?.config || defaultConfig;
}

function splitLabelParts(labelText) {
  const fallback = (labelText || '').trim();
  if (!fallback) {
    return { primary: '', secondary: '', original: '' };
  }
  const match = fallback.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (!match) {
    return { primary: fallback, secondary: '', original: fallback };
  }
  const primary = (match[1] || '').trim();
  const secondary = (match[2] || '').trim();
  return {
    primary: primary || fallback,
    secondary,
    original: fallback
  };
}

function buildLabelForMode(parts, compactMode) {
  if (compactMode) {
    return parts.secondary || parts.primary || parts.original || '';
  }
  if (parts.secondary) {
    return `${parts.primary} (${parts.secondary})`;
  }
  return parts.primary || parts.original || '';
}

function getResponsiveFormulaTexts() {
  const config = getActiveConfig();
  const compactMode = formulaMediaQuery ? formulaMediaQuery.matches
    : (typeof window !== 'undefined' && window.matchMedia
        ? (formulaMediaQuery = window.matchMedia(FORMULA_MEDIA_QUERY)).matches
        : false);

  const hazardParts = splitLabelParts(config.hazard_label);
  const exposureParts = splitLabelParts(config.exposure_label);
  const vulnerabilityParts = splitLabelParts(config.vulnerability_label);
  const capacityParts = splitLabelParts(config.capacity_label);

  const hazardText = buildLabelForMode(hazardParts, compactMode);
  const exposureText = buildLabelForMode(exposureParts, compactMode);
  const vulnerabilityText = buildLabelForMode(vulnerabilityParts, compactMode);
  const capacityText = buildLabelForMode(capacityParts, compactMode);

  return {
    label: formulaTexts.label,
    numerator: `${hazardText} × ${exposureText} × ${vulnerabilityText}`,
    denominator: capacityText
  };
}

function applyResponsiveFormulaTexts() {
  const { label, numerator, denominator } = getResponsiveFormulaTexts();
  const formulas = document.querySelectorAll('.formula');
  formulas.forEach(formula => {
    const labelEl = formula.querySelector('.formula-label');
    const numeratorEl = formula.querySelector('.formula-numerator');
    const denominatorEl = formula.querySelector('.formula-denominator');
    if (labelEl) labelEl.textContent = label;
    if (numeratorEl) numeratorEl.textContent = numerator;
    if (denominatorEl) denominatorEl.textContent = denominator;
  });
}

function initResponsiveFormula() {
  if (typeof window === 'undefined') {
    return;
  }
  if (window.matchMedia) {
    if (!formulaMediaQuery) {
      formulaMediaQuery = window.matchMedia(FORMULA_MEDIA_QUERY);
    }
    if (formulaMediaQuery && !formulaMediaQueryListenerAttached) {
      const listener = () => applyResponsiveFormulaTexts();
      if (typeof formulaMediaQuery.addEventListener === 'function') {
        formulaMediaQuery.addEventListener('change', listener);
      } else if (typeof formulaMediaQuery.addListener === 'function') {
        formulaMediaQuery.addListener(listener);
      }
      formulaMediaQueryListenerAttached = true;
    }
  }
  applyResponsiveFormulaTexts();
}

function createPlayerCard(playerId) {
  const card = document.createElement('div');
  card.className = 'player-card';
  card.id = `player-${playerId}`;
  
  const config = getActiveConfig();
  const playerName = getPlayerName(playerId);
  const colorClass = `color-${((playerId - 1) % 5) + 1}`;
  const responsiveFormula = getResponsiveFormulaTexts();
  
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
            <button class="increment-btn" onclick="incrementValue('house-${playerId}', 4)">+</button>
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
            <button class="increment-btn" onclick="incrementValue('condo-${playerId}', 4)">+</button>
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
      <button class="calculate-btn" onclick="calculateAssets(${playerId})" style="display: none;">คำนวณมูลค่าสินทรัพย์</button>
      <div class="result" id="assets-result-${playerId}">รอการคำนวณ</div>
    </div>
    
    <div class="section">
      <h3>วิเคราะห์ความเสี่ยง</h3>
      <div class="formula">
         <span class="formula-label">${responsiveFormula.label}</span>
        <div class="formula-fraction">
           <div class="formula-numerator">${responsiveFormula.numerator}</div>
          <div class="formula-divider"></div>
           <div class="formula-denominator">${responsiveFormula.denominator}</div>
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
      <button class="calculate-btn" onclick="calculateRisk(${playerId})" style="display: none;">คำนวณความเสี่ยง</button>
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
  applyResponsiveFormulaTexts();
  updateRemoveButtons();
  // Auto-calculate initial values
  calculateAssets(playerCount);
  calculateRisk(playerCount);
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

function showInfoPopup() {
  let popup = document.querySelector('.info-popup-overlay');
  let contentDiv;
  
  if (popup) {
    // ถ้ามี popup อยู่แล้ว ให้เปลี่ยนเนื้อหา
    contentDiv = popup.querySelector('.info-popup-content, .rules-popup-content');
    if (!contentDiv) return;
  } else {
    // ถ้ายังไม่มี popup ให้สร้างใหม่
    popup = document.createElement('div');
    popup.className = 'info-popup-overlay';
    document.body.appendChild(popup);
    
    popup.onclick = function(e) {
      if (e.target === popup) {
        closeInfoPopup();
      }
    };
    
    contentDiv = document.createElement('div');
    popup.appendChild(contentDiv);
  }
  
  contentDiv.className = 'info-popup-content';
  contentDiv.innerHTML = `
      <div class="info-popup-header">
        <h2>ข้อมูลและกฎกติกา</h2>
        <button class="info-popup-close-btn" onclick="closeInfoPopup()" title="ปิด">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="info-popup-options">
        <button class="info-option-btn" onclick="showBasicInfo()">ข้อมูลพื้นฐาน</button>
        <button class="info-option-btn" onclick="showRulesInfo()">กฎกติกาและวิธีการเล่น</button>
      </div>
  `;
  hideInfoButton();
}

function closeInfoPopup() {
  const popup = document.querySelector('.info-popup-overlay');
  if (popup) {
    popup.remove();
  }
  showInfoButton();
}

function showBasicInfo() {
  const popup = document.querySelector('.info-popup-overlay');
  if (!popup) return;
  
  const contentDiv = popup.querySelector('.info-popup-content, .rules-popup-content');
  if (!contentDiv) return;
  
  contentDiv.className = 'rules-popup-content';
  contentDiv.innerHTML = `
      <div class="info-popup-header">
        <h2>ข้อมูลพื้นฐาน</h2>
        <button class="info-popup-close-btn" onclick="showInfoPopup()" title="ย้อนกลับ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="rules-popup-body">
        <section class="rules-section">
          <h3>ประเภทการ์ด</h3>
          <p>มี 2 ประเภท รวมทั้งหมด 58 ใบ ได้แก่</p>
          <ul class="rules-list">
            <li><strong>การ์ดภัยพิบัติ</strong> มีทั้งหมด 8 ใบ</li>
            <li><strong>การ์ดใช้งาน</strong> มีทั้งหมด 50 ใบ แบ่งเป็น
              <ul>
                <li>การ์ดใช้ลดความเสี่ยง(risk) จากภัยพิบัติ ทั้งหมด 21 ใบ
                  <ul>
                    <li>การ์ดลดค่าความล่อแหลม 7 ใบ</li>
                    <li>การ์ดลดค่าความเปราะบาง 7 ใบ</li>
                    <li>การ์ดเพิ่มค่าความสามารถการรับมือ 7 ใบ</li>
                  </ul>
                </li>
                <li>การ์ดใช้เพิ่มความเสี่ยง(risk) จากภัยพิบัติ ทั้งหมด 8 ใบ
                  <ul>
                    <li>การ์ดเพิ่มค่าความล่อแหลม 3 ใบ</li>
                    <li>การ์ดเพิ่มค่าความเปราะบาง 3 ใบ</li>
                    <li>การ์ดลดค่าความสามารถการรับมือ 2 ใบ</li>
                  </ul>
                </li>
                <li>การ์ดฟื้นฟูทรัพยากร ทั้งหมด 8 ใบ</li>
                <li>การ์ดพิเศษ มีทั้งหมด 12 ใบ</li>
              </ul>
            </li>
          </ul>
        </section>

        <section class="rules-section">
          <h3>ทรัพยากร</h3>
          <p>มี 4 แบบ สามารถซื้อทรัพยากรได้ใน Phase ฟื้นฟู หรือจากความสามารถการ์ดใช้งาน</p>
          <ul class="rules-list">
            <li><strong>เหรียญ:</strong> ใช้ซื้อทรัพยากรหรือใช้ร่วมกับการ์ด</li>
            <li><strong>บ้าน (มูลค่า 1 เหรียญ/ซื้อได้):</strong> รองรับจำนวนคนได้ 1 คน</li>
            <li><strong>คอนโด (มูลค่า 2 เหรียญ/ซื้อได้):</strong> รองรับจำนวนคนได้ 2 คน</li>
            <li><strong>คน (มูลค่า 4 เหรียญ/ซื้อไม่ได้):</strong> หลังจบ Phase เผชิญภัย จะให้จำนวนเหรียญตามจำนวนคนที่มีอยู่แก่ผู้เล่น และเมื่อจบ Phase ฟื้นฟู หากผู้เล่นมีที่อยู่ไม่เพียงพอ คนจะย้ายไปอยู่กับผู้เล่นคนถัดไปแทน</li>
          </ul>
        </section>

        <section class="rules-section">
          <h3>การ์ดภัยพิบัติ</h3>
          <p>สามารถเจอภัยพิบัติได้ในช่วง Phase เผชิญภัย</p>
          <ul class="rules-list">
            <li><strong>คลื่นสึนามิ:</strong> เพิ่มค่าภัยพิบัติ 2 หน่วย ผู้เล่นเลือกเสียสละคน 1 คน</li>
            <li><strong>แผ่นดินไหวและอาคารถล่ม:</strong> เพิ่มค่าภัยพิบัติตามจำนวนทรัพยากรที่มีมากที่สุดของผู้เล่นนั้น (ยกเว้น ทรัพยากรคน)</li>
            <li><strong>อุทกภัยและดินโคลนถล่ม:</strong> เพิ่มค่าภัยพิบัติ 2 หน่วย และจนกว่าจะจบเกมนี้ ผู้เล่นมีบ้านได้ไม่เกิน 3 หลัง และมีคอนโดได้ไม่เกิน 3 หลัง</li>
            <li><strong>พายุหมุนเขตร้อน:</strong> เพิ่มค่าภัยพิบัติ 2 หน่วย และผู้เล่นเลือกเสียสละบ้าน 2 หลังหรือคอนโด 1 หลัง ถ้าไม่สามารถสละได้ ให้เสียสละคน 1 คนแทน</li>
            <li><strong>ไฟป่าและหมอกควัน:</strong> เพิ่มค่าภัยพิบัติ 1 หน่วย และจนกว่าจะจบเกมนี้ การ์ดนี้จะทำงานทุกครั้งที่เริ่มต้น Phase เผชิญภัย</li>
            <li><strong>ภัยแล้ง:</strong> เพิ่มค่าภัยพิบัติ 1 หน่วย เพิ่มค่าความล่อแหลม 2 หน่วย และเพิ่มค่าความเปราะบาง 2 หน่วย</li>
            <li><strong>ภัยจากสารเคมีและวัตถุอันตราย:</strong> เพิ่มค่าภัยพิบัติ 1 หน่วย และลดค่าความสามารถในการรับมือ 2 หน่วย</li>
            <li><strong>โรคระบาดในมนุษย์:</strong> เพิ่มค่าภัยพิบัติตามจำนวนทรัพยากรคนที่มีอยู่ของผู้เล่นคนนั้น</li>
          </ul>
        </section>

        <section class="rules-section">
          <h3>การ์ดใช้งาน</h3>
          
          <h4 class="card-subsection">การ์ดใช้ลดความเสี่ยง(risk)</h4>
          <ul class="rules-list">
            <li>ลดค่าความล่อแหลม 1 หน่วย ถ้าเผชิญภัยคลื่นสึนามิ ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความล่อแหลม 1 หน่วย ถ้าเผชิญภัยแผ่นดินไหวและอาคารถล่ม ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความล่อแหลม 1 หน่วย ถ้าเผชิญภัยอุทกภัยและดินโคลนถล่ม ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความล่อแหลม 1 หน่วย ถ้าเผชิญภัยพายุหมุนเขตร้อน ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความเปราะบาง 1 หน่วย ถ้าเผชิญภัยไฟป่าและหมอกควัน ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความเปราะบาง 1 หน่วย ถ้าเผชิญภัยแล้ง ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความเปราะบาง 1 หน่วย ถ้าเผชิญภัยจากสารเคมีและวัตถุอันตราย ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความเปราะบาง 1 หน่วย ถ้าเผชิญภัยโรคระบาดในมนุษย์ ให้ลด 3 หน่วยแทน จำนวน 1 ใบ</li>
            <li>ลดค่าความล่อแหลม 2 หน่วย จำนวน 3 ใบ</li>
            <li>ลดค่าความเปราะบาง 2 หน่วย จำนวน 3 ใบ</li>
            <li>ในเทิร์นนี้ค่าความเสี่ยงกลายเป็น 0 แต่ต้องเสียสละบ้าน 3 หลัง จำนวน 2 ใบ</li>
            <li>เพิ่มค่าความสามารถในการรับมือ 1 หน่วย จำนวน 5 ใบ</li>
          </ul>

          <h4 class="card-subsection">การ์ดใช้เพิ่มความเสี่ยง(risk)</h4>
          <ul class="rules-list">
            <li>เพิ่มค่าความล่อแหลม 1 หน่วย ให้ผู้เล่นอื่น 1 คน จำนวน 3 ใบ</li>
            <li>เพิ่มค่าความเปราะบาง 1 หน่วย ให้ผู้เล่นอื่น 1 คน จำนวน 3 ใบ</li>
            <li>ลดค่าความสามารถในการรับมือ 2 หน่วย ให้ผู้เล่นอื่น 1 คน จำนวน 2 ใบ</li>
          </ul>

          <h4 class="card-subsection">การ์ดฟื้นฟูทรัพยากร</h4>
          <ul class="rules-list">
            <li>ได้รับ 3 เหรียญ จำนวน 4 ใบ</li>
            <li>จ่าย 2 เหรียญ เพื่อได้รับคน 1 คน จำนวน 4 ใบ</li>
          </ul>

          <h4 class="card-subsection">การ์ดพิเศษ</h4>
          <ul class="rules-list">
            <li>เปิดดูการ์ดใบบนสุดของกองการ์ดภัยพิบัติ แล้วนำการ์ดนั้นวางไว้ใบบนสุด จำนวน 3 ใบ</li>
            <li>จั่วการ์ด 2 ใบ จำนวน 3 ใบ</li>
            <li>เลือกการ์ดที่ถูกใช้งานแล้วของเราหรือของผู้เล่นอื่น 1 ใบ ให้นำการ์ดที่เลือกกลับขึ้นมือ จำนวน 3 ใบ</li>
            <li>ดูการ์ด 4 ใบบนสุดของกองการ์ด เลือกการ์ด 1 ใบขึ้นมือ ที่เหลือกลับเข้ากองแล้วสับกองการ์ด จำนวน 2 ใบ</li>
            <li>นำการ์ดที่ใช้แล้วทุกใบ (รวมถึงการ์ดนี้) กลับเข้ากองแล้วสับกองการ์ด จากนั้นจั่ว 1 ใบ จำนวน 2 ใบ</li>
          </ul>
        </section>
      </div>
  `;
}

function showRulesInfo() {
  const popup = document.querySelector('.info-popup-overlay');
  if (!popup) return;
  
  const contentDiv = popup.querySelector('.info-popup-content, .rules-popup-content');
  if (!contentDiv) return;

  const responsiveFormula = getResponsiveFormulaTexts();
  
  contentDiv.className = 'rules-popup-content';
  contentDiv.innerHTML = `
      <div class="info-popup-header">
        <h2>กฎกติกาและวิธีการเล่น</h2>
        <button class="info-popup-close-btn" onclick="showInfoPopup()" title="ย้อนกลับ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div class="rules-popup-body">
        <section class="rules-section">
          <h3>กฎกติกาของบอร์ดเกม</h3>
          <ol class="rules-list">
            <li>ผู้เล่นมีการ์ดในมือได้ไม่เกิน 5 ใบ หากเกินต้องเลือกทิ้งทันทีจนกว่าจะไม่เกิน 5 ใบ</li>
            <li>ผู้เล่นสามารถมีบ้านได้ไม่เกิน 4 หลัง และมีคอนโดได้ไม่เกิน 4 หลัง</li>
            <li>การ์ดที่ถูกใช้งานแล้ว ให้นำมาวางรวมกันบนสนาม แยกตามสีของหลังการ์ด</li>
            <li>ใน Phase เผชิญภัย สามารถใช้งานการ์ดได้ไม่เกิน 3 ใบ</li>
            <li>ใน Phase เผชิญภัย การ์ดที่ถูกวางคว่ำไว้บนสนาม ไม่นับว่าเป็นการ์ดในมือ</li>
            <li>ใน Phase ฟื้นฟู สามารถใช้งานการ์ดได้ไม่เกิน 3 ใบ</li>
            <li>ค่าทุกค่าที่อยู่ในสูตรหาความเสี่ยง ไม่สามารถต่ำกว่า 1 ได้ (ยกเว้นค่าภัยพิบัติและค่าความเสี่ยง)</li>
            <li>หากค่าความเสี่ยงที่คำนวณได้เป็นทศนิยม ให้ปัดทศนิยมขึ้น</li>
            <li>เมื่อเริ่มเกม ให้ค่าเริ่มต้นของสูตรวิเคราะห์ความเสี่ยงจากภัยพิบัติคือ ? = (0 x 2 x 2) / 2</li>
            <li>เมื่อเริ่มเกม ให้ค่าเริ่มต้นของทรัพยากรของผู้เล่นแต่ละคนได้รับคือ บ้าน 3 / คน 3 / เหรียญ 3</li>
          </ol>
        </section>

        <section class="rules-section">
          <h3>สูตรวิเคราะห์ความเสี่ยงจากภัยพิบัติ</h3>
          <div class="formula">
            <span class="formula-label">${responsiveFormula.label}</span>
            <div class="formula-fraction">
              <div class="formula-numerator">${responsiveFormula.numerator}</div>
              <div class="formula-divider"></div>
              <div class="formula-denominator">${responsiveFormula.denominator}</div>
            </div>
          </div>
        </section>

        <section class="rules-section">
          <h3>คำอธิบายตัวแปร</h3>
          <ul class="rules-list">
            <li><strong>ภัยอันตราย (Hazard):</strong> ความรุนแรงหรือโอกาสเกิดของภัย เช่น น้ำท่วม แผ่นดินไหว</li>
            <li><strong>ความล่อแหลม (Exposure):</strong> สิ่งที่อยู่ในพื้นที่เสี่ยง เช่น คน อาคาร ทรัพย์สิน</li>
            <li><strong>ความเปราะบาง (Vulnerability):</strong> ระดับความเสียหายที่อาจเกิดขึ้นเมื่อเกิดภัย</li>
            <li><strong>ความสามารถในการรับมือ (Capacity):</strong> ความพร้อมของระบบในการป้องกันหรือฟื้นฟู</li>
          </ul>
        </section>

        <section class="rules-section">
          <h3>ขั้นตอนการเล่น</h3>
          <ol class="rules-list">
            <li>นำกองการ์ดภัยพิบัติทั้ง 8 ใบมาสับกองการ์ด จากนั้นนำการ์ดใบบนสุด 5 ใบมาวางไว้ตรงกลาง</li>
            <li>ให้ผู้เล่นทุกคน Scan QR Code ของบอร์ดเกมที่มีให้ โดยจะได้ link เว็บไซต์ที่ใช้นับจำนวนทรัพยากรต่างๆ ของผู้เล่นคนนั้น และมี เครื่องมือไว้คำนวนผลลัพธ์จากสูตรวิเคราะห์ความเสี่ยงจากภัยพิบัติ</li>
            <li>สับกองการ์ดประเภทใช้งาน แล้วแจกให้ผู้เล่นทุกคน คนละ 5 ใบ ให้ถือการ์ดเหล่านี้ไว้ในมือ</li>
            <li>กำหนดค่าเริ่มต้นในสูตรวิเคราะห์ความเสี่ยงจากภัยพิบัติ โดยให้
              <ul>
                <li>4.1 ภัยพิบัติ มีค่าเป็น 0</li>
                <li>4.2 ความล่อแหลม มีค่าเป็น 2</li>
                <li>4.3 ความเปราะบาง มีค่าเป็น 2</li>
                <li>4.4 ความสามารถในการรับมือ มีค่าเป็น 2</li>
              </ul>
            </li>
            <li>กำหนดลำดับผู้เล่นก่อน-หลังตามที่ตกลงกันเอง</li>
            <li><strong>Phase ป้องกันและลดผลกระทบ</strong>
              <ul>
                <li>6.1 ผู้เล่นทุกคนจั่วการ์ดจากกองการ์ดใช้งาน 1 ใบ (ถ้าเป็นเทิร์นแรกของเกม ให้ละเว้นขั้นตอนนี้)</li>
                <li>6.2 ผู้เล่นคนแรกเลือกใช้งานการ์ดในมือหรือไม่ใช้ก็ได้ โดยใช้ได้เพียง 1 ใบเท่านั้น</li>
                <li>6.3 เมื่อจบเทิร์นของผู้เล่นคนแรก ให้ผู้เล่นคนถัดมา ทำซ้ำขั้นตอนที่ 6.2 จนครบทุกคน</li>
              </ul>
            </li>
            <li><strong>Phase เตรียมรับภัย</strong>
              <ul>
                <li>7.1 ผู้เล่นคนแรกเลือกการ์ดในมือ 2 ใบ ให้ถือการ์ดนั้นไว้ในมือ แล้วนำการ์ดที่ไม่ได้เลือก วางคว่ำหน้าไว้ข้างหน้าตัวเอง</li>
                <li>7.2 เมื่อจบเทิร์นของผู้เล่นคนแรก ให้ผู้เล่นคนถัดมา ทำซ้ำขั้นตอนที่ 7.1 จนครบทุกคน</li>
              </ul>
            </li>
            <li><strong>Phase เผชิญภัย</strong>
              <ul>
                <li>8.1 เปิดการใบบนสุดของกองการ์ดภัยพิบัติ</li>
                <li>8.2 ผู้เล่นคนแรกใช้งานการ์ดที่ถืออยู่ในมือได้ไม่เกิน 3 ใบ</li>
                <li>8.3 ผู้เล่นคนแรกใช้สูตรวิเคราะห์ความเสี่ยงจากภัยพิบัติ หาค่าความเสี่ยง จากนั้นให้ผู้เล่นคนแรกเลือกเสียสละทรัพยากรของตัวเอง ให้มีมูลค่าเท่ากับค่าความเสี่ยงคำนวณได้<br>
                <em>(ตัวอย่าง ถ้าสมมติว่าคำนวณค่าความเสี่ยงได้ 5 ให้เลือกเสียสละทรัพยากรที่รวมกันแล้วมีมูลค่าเท่ากับ 5 หรือมากกว่า เช่น บ้าน 3 หลังกับคอนโด 2 หลัง หรือคน 1 คนกับบ้าน 1 หลัง)</em></li>
                <li>8.4 เมื่อจบเทิร์นของผู้เล่นคนแรก ให้ผู้เล่นคนถัดมา ทำซ้ำขั้นตอนที่ 8.2 และ 8.3 จนครบทุกคน</li>
                <li>8.5 เมื่อผู้เล่นทุกคนเสร็จสิ้นขั้นตอนที่ 8.4 ให้รีเซ็ตค่าภัยพิบัติให้เหลือ 0</li>
              </ul>
            </li>
            <li><strong>Phase ฟื้นฟู</strong>
              <ul>
                <li>9.1 ผู้เล่นคนแรกนำการ์ดที่วางคว่ำไว้ข้างหน้าตัวเองกลับขึ้นมือ</li>
                <li>9.2 ผู้เล่นคนแรกคำนวณเหรียญที่ได้จากทรัพยากรคน</li>
                <li>9.3 ผู้เล่นคนแรกสามารถใช้เหรียญในการ ซื้อทรัพยากร หรือการ์ด และสามารถใช้งานการ์ดได้ไม่เกิน 3 ใบ</li>
                <li>9.4 เมื่อจบเทิร์นของผู้เล่นคนแรก รีเซ็ตจำนวนเหรียญให้เหลือ 0 แล้วให้ผู้เล่นคนถัดมา ทำซ้ำขั้นตอนที่ 9.1 ถึง 9.3 จนครบทุกคน</li>
              </ul>
            </li>
            <li>ให้ทำซ้ำขั้นตอนที่ 6 ถึงขั้นตอนที่ 9 จนกว่าจะเปิดการ์ดภัยพิบัติใบสุดท้ายและจบ Phase ฟื้นฟู จึงจะถือว่าสิ้นสุดเกม แล้วหาผู้ชนะตามเงื่อนไขในการชนะและแพ้</li>
          </ol>
        </section>

        <section class="rules-section">
          <h3>เงื่อนไขการชนะและแพ้ในเกม</h3>
          <ul class="rules-list">
            <li>หลังจากที่เลือกเสียสละทรัพยากรของตัวเองใน Phase เผชิญภัยแล้ว ผู้เล่นไม่เหลือทรัพยากรคนเลย ผู้เล่นคนนั้นจะแพ้เกมทันที</li>
            <li>หลังจาก Phase เผชิญภัย หากมีผู้เล่นเหลือรอดเป็นคนสุดท้าย จะชนะเกมทันที</li>
            <li>หลังจากสิ้นสุดเกม ผู้ที่มีทรัพยากรมากที่สุด จะเป็นผู้ชนะเกม</li>
            <li>หลังจากสิ้นสุดเกม หากผู้มีทรัพยากรเท่ากัน ให้สุ่มเลือกการ์ดภัยพิบัติ 1 ใบจาก 3 ใบที่ไม่ได้ใช้ในเกมนี้ แล้วทำซ้ำขั้นตอนที่ 6 ถึงขั้นตอนที่ 9 ผู้ที่มีทรัพยากรมากที่สุด จะเป็นผู้ชนะเกม ถ้ายังมีเท่ากันอีกให้ทำซ้ำขั้นตอนนี้อีกครั้ง</li>
          </ul>
        </section>
      </div>
  `;
  applyResponsiveFormulaTexts();
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

function parseColorToRgba(color) {
  if (!color || typeof color !== 'string') {
    return null;
  }
  if (color === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s\/]+([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    return {
      r: parseFloat(rgbaMatch[1]),
      g: parseFloat(rgbaMatch[2]),
      b: parseFloat(rgbaMatch[3]),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
    };
  }
  return null;
}

function getBrightnessFromRgba(rgba) {
  if (!rgba) {
    return 0;
  }
  return (0.299 * rgba.r) + (0.587 * rgba.g) + (0.114 * rgba.b);
}

function resolveBackgroundRgba(element) {
  let current = element;
  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const rgba = parseColorToRgba(style.backgroundColor);
    if (rgba && rgba.a > 0.05) {
      return rgba;
    }
    current = current.parentElement;
  }
  const bodyRgba = parseColorToRgba(window.getComputedStyle(document.body).backgroundColor);
  if (bodyRgba && bodyRgba.a > 0.05) {
    return bodyRgba;
  }
  return { r: 51, g: 65, b: 148, a: 1 };
}

function adjustInfoButtonContrast(btn) {
  if (!btn) {
    return;
  }
  const rect = btn.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) {
    return;
  }
  const centerX = rect.left + (rect.width / 2);
  const centerY = rect.top + (rect.height / 2);
  const elementsAtPoint = document.elementsFromPoint(centerX, centerY) || [];
  let backgroundElement = null;
  for (const el of elementsAtPoint) {
    if (el === btn || btn.contains(el)) {
      continue;
    }
    backgroundElement = el;
    break;
  }
  const backgroundRgba = resolveBackgroundRgba(backgroundElement);
  const brightness = getBrightnessFromRgba(backgroundRgba);
  if (brightness >= INFO_BUTTON_BRIGHTNESS_THRESHOLD) {
    btn.classList.add('info-icon-btn--on-light');
  } else {
    btn.classList.remove('info-icon-btn--on-light');
  }
}

function scheduleInfoButtonContrastUpdate(btn) {
  if (infoButtonContrastRafId !== null) {
    return;
  }
  infoButtonContrastRafId = window.requestAnimationFrame(() => {
    infoButtonContrastRafId = null;
    adjustInfoButtonContrast(btn);
  });
}

function initInfoButtonContrastWatcher() {
  if (window.__infoButtonContrastInit) {
    return;
  }
  const btn = document.querySelector('.info-icon-btn');
  if (!btn) {
    if (!window.__infoButtonContrastDeferred) {
      window.__infoButtonContrastDeferred = true;
      window.addEventListener('DOMContentLoaded', () => {
        window.__infoButtonContrastDeferred = false;
        initInfoButtonContrastWatcher();
      }, { once: true });
    }
    return;
  }
  window.__infoButtonContrastInit = true;
  const scheduleUpdate = () => scheduleInfoButtonContrastUpdate(btn);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  infoButtonContrastObserver = new MutationObserver(scheduleUpdate);
  infoButtonContrastObserver.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true
  });
  scheduleUpdate();
}

function hideInfoButton() {
  const btn = document.querySelector('.info-icon-btn');
  if (!btn) {
    return;
  }
  if (btn[INFO_BUTTON_DISPLAY_KEY] === undefined) {
    btn[INFO_BUTTON_DISPLAY_KEY] = btn.style.display || '';
  }
  btn.style.display = 'none';
}

function showInfoButton() {
  const btn = document.querySelector('.info-icon-btn');
  if (!btn) {
    return;
  }
  const savedDisplay = btn[INFO_BUTTON_DISPLAY_KEY];
  btn.style.display = savedDisplay !== undefined ? savedDisplay : '';
  scheduleInfoButtonContrastUpdate(btn);
}

function incrementValue(inputId, max = null) {
  const display = document.getElementById(inputId);
  if (display) {
    let value = parseInt(display.textContent) || 0;
    if (max === null || value < max) {
      value++;
      display.textContent = value;
      autoCalculateForInput(inputId);
    }
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
    autoCalculateForInput(inputId);
  }
}

function autoCalculateForInput(inputId) {
  // Extract playerId from inputId (format: "people-1", "hazard-2", etc.)
  const match = inputId.match(/-(\d+)$/);
  if (!match) return;
  
  const playerId = parseInt(match[1]);
  if (!playerId) return;
  
  // Check if this input is related to assets or risk
  if (inputId.startsWith('people-') || inputId.startsWith('house-') || 
      inputId.startsWith('condo-') || inputId.startsWith('coins-')) {
    calculateAssets(playerId);
  } else if (inputId.startsWith('hazard-') || inputId.startsWith('exposure-') || 
             inputId.startsWith('vulnerability-') || inputId.startsWith('capacity-')) {
    calculateRisk(playerId);
  }
}

function calculateAssets(playerId) {
  const people = Math.max(0, parseInt(document.getElementById(`people-${playerId}`).textContent) || 0);
  const house = Math.max(0, parseInt(document.getElementById(`house-${playerId}`).textContent) || 0);
  const condo = Math.max(0, parseInt(document.getElementById(`condo-${playerId}`).textContent) || 0);
  const coins = parseInt(document.getElementById(`coins-${playerId}`).textContent) || 0;
  
  const total = (people * 4) + (house * 1) + (condo * 2) + coins;
  
  const config = getActiveConfig();
  document.getElementById(`assets-result-${playerId}`).textContent = `มูลค่ารวม: ${total} ${config.coin_label}`;
}

function calculateRisk(playerId) {
  const hazard = Math.max(0, parseInt(document.getElementById(`hazard-${playerId}`).textContent) || 0);
  const exposure = Math.max(1, parseInt(document.getElementById(`exposure-${playerId}`).textContent) || 1);
  const vulnerability = Math.max(1, parseInt(document.getElementById(`vulnerability-${playerId}`).textContent) || 1);
  const capacity = Math.max(1, parseInt(document.getElementById(`capacity-${playerId}`).textContent) || 1);
  
  const risk = (hazard * exposure * vulnerability) / capacity;
  // ปัดทศนิยมขึ้นตามกฎกติกา
  const riskRounded = risk.toFixed(2);
  
  document.getElementById(`risk-result-${playerId}`).textContent = `ความเสี่ยง: ${riskRounded}`;
}

function updateAllPlayerLabels() {
  const config = getActiveConfig();
  
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
  });
  applyResponsiveFormulaTexts();
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
initResponsiveFormula();
addPlayer();
updateRemoveButtons();
initInfoButtonContrastWatcher();

// Cloudflare injected script kept as-is
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'99c53eb022244b94',t:'MTc2Mjc3NDUxMC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
