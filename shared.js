/* ═════════════════════════════════════════════════════════════════════════════
   SHARED.JS — Gemeinsame Funktionen für alle Seiten
   S-Bahn Werkstatt Tool
   ═════════════════════════════════════════════════════════════════════════════ */

// ═════════════════════════════════════════════════════════════════════════════
// SUPABASE CONFIG
// ═════════════════════════════════════════════════════════════════════════════

const SB_URL = "https://oumimgzotfemzybpremf.supabase.co";
const SB_KEY = "sb_publishable_5No2mfXaZzP6TEoocGD3ww_AQhDT4Om";

let sb = null;

// Initialize Supabase
function initSupabase() {
  if (typeof supabase !== 'undefined') {
    sb = supabase.createClient(SB_URL, SB_KEY);
    console.log('Supabase initialized');
    return true;
  }
  console.error('Supabase library not loaded');
  return false;
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTH SYSTEM
// ═════════════════════════════════════════════════════════════════════════════

const USER_STORAGE_KEY = 'werkstatt-user';

function getUser() {
  try {
    const user = localStorage.getItem(USER_STORAGE_KEY);
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

function requireLogin() {
  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function logout() {
  clearUser();
  window.location.href = 'index.html';
}

// ═════════════════════════════════════════════════════════════════════════════
// PERMISSIONS
// ═════════════════════════════════════════════════════════════════════════════

function canCreate() {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  // Support both 'create' and 'edit' permissions (edit implies create)
  // Also handle null/undefined permission gracefully
  const perm = user.permission;
  if (!perm) return false;
  return ['create', 'edit'].includes(perm);
}

function canEdit() {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  // Handle null/undefined permission
  return user.permission === 'edit';
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

function isBlocked(feature) {
  const user = getUser();
  if (!user || !user.blocked_features) return false;
  return user.blocked_features.includes(feature);
}

// ═════════════════════════════════════════════════════════════════════════════
// BARCODE GENERATOR (Code 128)
// ═════════════════════════════════════════════════════════════════════════════

const CODE128_PATTERNS = {
  ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
  '$': '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
  '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
  ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
  '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
  '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
  '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
  '<': '11100110100', '=': '11100110010', '>': '11011011100', '?': '11011101100',
  '@': '11101101100', 'A': '11101111010', 'B': '11010111000', 'C': '11011101000',
  'D': '11011100010', 'E': '11011101110', 'F': '11101011000', 'G': '11101101000',
  'H': '11101100010', 'I': '10110111000', 'J': '10110001110', 'K': '10001110110',
  'L': '10101111000', 'M': '10100011110', 'N': '10001011110', 'O': '10111101000',
  'P': '10111100010', 'Q': '11110101000', 'R': '11110100010', 'S': '10111011110',
  'T': '10111101110', 'U': '11101011110', 'V': '11110101110', 'W': '11010000100',
  'X': '11010010000', 'Y': '11010011100', 'Z': '11000111010', '[': '11010111000',
  '\\': '11010111100', ']': '11011101000', '^': '11011110100', '_': '11011111010',
  '`': '11000011110', 'a': '11000101110', 'b': '11000111010', 'c': '11001011010',
  'd': '11001111010', 'e': '11010010110', 'f': '11010011010', 'g': '11010101110',
  'h': '11011010110', 'i': '11011011010', 'j': '11011101110', 'k': '11011110110',
  'l': '11101101110', 'm': '11101110110', 'n': '11110010110', 'o': '10010111100',
  'p': '10011110100', 'q': '10011111010', 'r': '10101111100', 's': '10110111100',
  't': '10111011110', 'u': '10111101110', 'v': '10111110110', 'w': '11010111100',
  'x': '11011011100', 'y': '11011101100', 'z': '11011111000', '{': '11101011100',
  '|': '11101101100', '}': '11101111000', '~': '10010111000', 'DEL': '11110100010',
  'FNC3': '11110100010', 'FNC2': '11110010110', 'SHIFT': '11110010100',
  'CODEC': '11110010010', 'CODEB': '11100100110', 'FNC4': '10111101110',
  'FNC1': '11101011110', 'STARTA': '11010000100', 'STARTB': '11010010000',
  'STARTC': '11010011100', 'STOP': '1100011101011'
};

function generateCode128(text) {
  if (!text) return '';

  let pattern = CODE128_PATTERNS['STARTB'];
  let checksum = 104;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charPattern = CODE128_PATTERNS[char];
    if (charPattern) {
      pattern += charPattern;
      checksum += (i + 1) * (char.charCodeAt(0) - 32);
    }
  }

  checksum = checksum % 103;
  const checkChar = Object.keys(CODE128_PATTERNS)[checksum + 32] || ' ';
  pattern += CODE128_PATTERNS[checkChar] || '';
  pattern += CODE128_PATTERNS['STOP'];

  return pattern;
}

function drawBarcode(canvas, text) {
  if (!canvas || !text) return;

  const ctx = canvas.getContext('2d');
  const pattern = generateCode128(text);

  if (!pattern) return;

  const moduleWidth = 2;
  const height = 80;
  const quietZone = 20;

  canvas.width = (pattern.length * moduleWidth) + (quietZone * 2);
  canvas.height = height + 30;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'black';
  let x = quietZone;

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      ctx.fillRect(x, 0, moduleWidth, height);
    }
    x += moduleWidth;
  }

  ctx.fillStyle = 'black';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, height + 20);
}

function toggleBarcode(wrapperId, text) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  if (wrapper.classList.contains('visible')) {
    wrapper.classList.remove('visible');
  } else {
    wrapper.classList.add('visible');
    const canvas = wrapper.querySelector('canvas');
    if (canvas) {
      drawBarcode(canvas, text);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight: bold; font-size: 1.1rem;">${icons[type]}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ═════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function renderTopbar(pageName) {
  const user = getUser();
  if (!user) return '';

  return `
    <header class="topbar">
      <div class="topbar-logo">
        <div class="topbar-logo-icon">🚂</div>
        <span>Werkstatt Tool</span>
      </div>
      <div class="topbar-actions">
        <div class="topbar-user">
          <span>${user.name}</span>
          <span class="topbar-team">${user.team || 'Team'}</span>
        </div>
        <button class="btn btn-ghost btn-icon" onclick="logout()" title="Abmelden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  `;
}

function renderBottomNav(activePage) {
  const items = [
    { id: 'home', label: 'Home', icon: '🏠', href: 'app.html' },
    { id: 'material', label: 'Material', icon: '📦', href: 'material.html' },
    { id: 'fehler', label: 'Fehler', icon: '🔴', href: 'fehler.html' },
    { id: 'notizen', label: 'Notizen', icon: '📝', href: 'notizen.html' },
    { id: 'fahrzeug', label: 'Fahrzeug', icon: '🚆', href: 'fahrzeug.html' }
  ];

  const user = getUser();

  return `
    <nav class="bottom-nav">
      ${items.map(item => {
        const isActive = item.id === activePage;
        const isBlocked = user && isBlocked(item.id);
        if (isBlocked) return '';

        return `
          <a href="${item.href}" class="bottom-nav-item ${isActive ? 'active' : ''}">
            <span style="font-size: 1.3rem;">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `;
      }).join('')}
    </nav>
  `;
}

// ═════════════════════════════════════════════════════════════════════════════
// MODAL UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.classList.remove('active');
  });
  document.body.style.overflow = '';
}

// ═════════════════════════════════════════════════════════════════════════════
// FORM UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};

  const data = {};
  const formData = new FormData(form);

  for (let [key, value] of formData.entries()) {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  return data;
}

function validateForm(formId, rules) {
  const form = document.getElementById(formId);
  if (!form) return { valid: false };

  const data = getFormData(formId);
  const errors = [];

  for (let field in rules) {
    const rule = rules[field];
    const value = data[field];

    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(`${rule.label || field} ist erforderlich`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function timeAgo(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'gerade eben';
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`;
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`;
  if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
  return formatDate(dateString);
}

// ═════════════════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═════════════════════════════════════════════════════════════════════════════

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncate(text, length = 100) {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// ═════════════════════════════════════════════════════════════════════════════
// LIVE PERMISSION CHECK
// ═════════════════════════════════════════════════════════════════════════════

async function checkUserStatus() {
  const user = getUser();
  if (!user || !sb) return;

  try {
    const { data, error } = await sb
      .from('users')
      .select('is_blocked, blocked_features, permission, role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error checking user status:', error);
      return;
    }

    if (data) {
      // Check if user is blocked
      if (data.is_blocked) {
        showToast('Dein Account wurde gesperrt', 'error');
        logout();
        return;
      }

      // Update local user data
      const updatedUser = {
        ...user,
        blocked_features: data.blocked_features || [],
        permission: data.permission,
        role: data.role
      };
      setUser(updatedUser);
    }
  } catch (e) {
    console.error('Error in checkUserStatus:', e);
  }
}

// Start periodic permission check
function startPermissionCheck() {
  checkUserStatus();
  setInterval(checkUserStatus, 15000);
}

// ═════════════════════════════════════════════════════════════════════════════
// DEBOUNCE
// ═════════════════════════════════════════════════════════════════════════════

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// COPY TO CLIPBOARD
// ═════════════════════════════════════════════════════════════════════════════

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('In Zwischenablage kopiert', 'success');
  } catch (e) {
    showToast('Konnte nicht kopieren', 'error');
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EASTER EGG — BAHNER SPRÜCHE
// ═════════════════════════════════════════════════════════════════════════════

const BAHNER_SPRUECHE = [
  "Hast du deinen Auftrag schon zurückgemeldet? 🤔",
  "Vergessen zurückzumelden? Passiert den Besten... also nicht dir 😏",
  "Die Bahn kommt... irgendwann. Du auch? 🚂",
  "Kaffee ist alle? Das ist schlimmer als Zugausfall! ☕",
  "Störung im Betriebsablauf... oder war das dein Wecker? ⏰",
  "Heute schon was geschafft? Der Kaffeeautomat zählt nicht! 😄",
  "Melde dich mal zurück, bevor der Disponent anruft! 📞",
  "Werkzeug zurückgelegt? Oder liegt es wieder im Shuttle 3? 🔧",
  "Schichtende ist erst wenn SAP es sagt, nicht du! 💻",
  "Fun Fact: Der ICE hat 800 PS. Du nach der Pause auch! 💪",
  "Dein Kollege hat schon 5 Aufträge. Du bist bei... ach, egal 😅",
  "Hast du deine PSA an? Safety first, Bahner! 🦺",
  "430er oder 423er? Egal, Hauptsache Feierabend! 🎉",
  "Wenn der Dispo anruft, einfach so tun als hättest du Empfang 📱",
  "Ein guter Bahner hat immer einen Kugelschreiber... und Kaffee ✏️☕",
  "Zurückmelden nicht vergessen! Sonst gibt's wieder Ärger 😤"
];

function getRandomSpruch() {
  return BAHNER_SPRUECHE[Math.floor(Math.random() * BAHNER_SPRUECHE.length)];
}

// ═════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();

  // Close modals on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSupabase,
    getUser,
    setUser,
    clearUser,
    requireLogin,
    logout,
    canCreate,
    canEdit,
    isAdmin,
    isBlocked,
    showToast,
    renderTopbar,
    renderBottomNav,
    openModal,
    closeModal,
    closeAllModals,
    getFormData,
    validateForm,
    formatDate,
    formatDateTime,
    formatTime,
    timeAgo,
    escapeHtml,
    truncate,
    generateId,
    debounce,
    copyToClipboard,
    getRandomSpruch,
    drawBarcode,
    toggleBarcode,
    startPermissionCheck
  };
}
