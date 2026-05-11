const desktop = document.getElementById('desktop');
const template = document.getElementById('window-template');
const nativeMinimize = document.getElementById('native-minimize');
const nativeMaximize = document.getElementById('native-maximize');
const nativeClose = document.getElementById('native-close');
let highestZIndex = 100;
let appWindow = null;

if (window.__TAURI__?.window?.appWindow) {
  appWindow = window.__TAURI__.window.appWindow;
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

function openWindow(appId) {
  const clone = template.content.cloneNode(true);
  const win = clone.querySelector('.window');
  const title = win.querySelector('.title');
  const content = win.querySelector('.content');

  title.innerText = appId.charAt(0).toUpperCase() + appId.slice(1);
  content.innerHTML = `<h2>Welcome to ${title.innerText}</h2><p>This is a glassmorphism window inside Tauri 2.0!</p>`;

  // Stagger positions based on existing windows
  const offset = (desktop.children.length % 10) * 30;
  win.style.top = `${50 + offset}px`;
  win.style.left = `${50 + offset}px`;
  
  focusWindow(win);
  win.addEventListener('mousedown', () => focusWindow(win));

  // Drag logic
  const titlebar = win.querySelector('.titlebar');
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  titlebar.addEventListener('mousedown', (e) => {
    // Check if clicking controls
    if (e.target.closest('.controls')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseInt(win.style.left || 0, 10);
    initialTop = parseInt(win.style.top || 0, 10);
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    win.style.left = `${initialLeft + dx}px`;
    win.style.top = `${initialTop + dy}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });

  // Controls
  win.querySelector('.close').addEventListener('click', () => {
    win.remove();
  });
  
  let isMaximized = false;
  let preMaxRect = null;
  win.querySelector('.maximize').addEventListener('click', () => {
    if (!isMaximized) {
      preMaxRect = { 
        left: win.style.left, 
        top: win.style.top, 
        width: win.style.width, 
        height: win.style.height,
        borderRadius: win.style.borderRadius
      };
      win.style.left = '0';
      win.style.top = '0';
      win.style.width = '100%';
      win.style.height = 'calc(100% - 60px)'; // Account for taskbar
      win.style.borderRadius = '0';
      isMaximized = true;
    } else {
      win.style.left = preMaxRect.left;
      win.style.top = preMaxRect.top;
      win.style.width = preMaxRect.width;
      win.style.height = preMaxRect.height;
      win.style.borderRadius = preMaxRect.borderRadius;
      isMaximized = false;
    }
  });

  desktop.appendChild(win);
}

function focusWindow(win) {
  highestZIndex++;
  win.style.zIndex = highestZIndex;
}

document.querySelectorAll('.app-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    openWindow(icon.dataset.app);
  });
});

nativeMinimize?.addEventListener('click', () => {
  if (appWindow) {
    appWindow.minimize();
  }
});

nativeMaximize?.addEventListener('click', async () => {
  if (appWindow) {
    const maximized = await appWindow.isMaximized();
    if (maximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  }
});

nativeClose?.addEventListener('click', () => {
  if (appWindow) {
    appWindow.close();
  }
});

window.addEventListener('keydown', async (event) => {
  if (!appWindow) return;
  if (event.key === 'F11') {
    const maximized = await appWindow.isMaximized();
    if (maximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  }
});

// Optionally open a default window on launch
openWindow('browser');
