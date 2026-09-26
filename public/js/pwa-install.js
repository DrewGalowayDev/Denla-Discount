// PWA Installation Handler
let deferredPrompt;
let installButton;

// Initialize PWA features
document.addEventListener('DOMContentLoaded', () => {
  initPWA();
  createInstallButton();
  registerServiceWorker();
});

// Initialize PWA
function initPWA() {
  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('[PWA] Running in standalone mode');
    document.body.classList.add('pwa-installed');
  }

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    hideInstallButton();
    
    // Show success message
    showInstallSuccess();
  });
}

// Register Service Worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] New Service Worker found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available
            showUpdateNotification();
          }
        });
      });

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }
}

// Create install button
function createInstallButton() {
  // Check if button already exists
  if (document.getElementById('pwaInstallBtn')) return;

  // Create floating install button
  installButton = document.createElement('button');
  installButton.id = 'pwaInstallBtn';
  installButton.className = 'pwa-install-btn';
  installButton.innerHTML = `
    <i class="fas fa-download me-2"></i>
    <span>Install App</span>
  `;
  installButton.style.display = 'none';
  installButton.onclick = promptInstall;

  document.body.appendChild(installButton);
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Install prompt available');
  
  // Prevent default mini-infobar
  e.preventDefault();
  
  // Store event for later use
  deferredPrompt = e;
  
  // Show install button
  showInstallButton();
});

// Show install button
function showInstallButton() {
  if (installButton) {
    installButton.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
      installButton.classList.add('show');
    }, 100);
  }
}

// Hide install button
function hideInstallButton() {
  if (installButton) {
    installButton.classList.remove('show');
    setTimeout(() => {
      installButton.style.display = 'none';
    }, 300);
  }
}

// Prompt user to install
async function promptInstall() {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return;
  }

  // Show install prompt
  deferredPrompt.prompt();

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log('[PWA] Install outcome:', outcome);

  if (outcome === 'accepted') {
    console.log('[PWA] User accepted install');
  } else {
    console.log('[PWA] User dismissed install');
  }

  // Clear prompt
  deferredPrompt = null;
  hideInstallButton();
}

// Show install success message
function showInstallSuccess() {
  // Check if SweetAlert is available
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'App Installed!',
      text: 'Denla Discount has been installed successfully. You can now use it offline!',
      icon: 'success',
      confirmButtonText: 'Great!',
      confirmButtonColor: '#FF6B35',
      timer: 3000
    });
  } else {
    alert('App installed successfully! You can now use it offline.');
  }
}

// Show update notification
function showUpdateNotification() {
  // Check if SweetAlert is available
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      title: 'Update Available',
      text: 'A new version of Denla Discount is available. Reload to update?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Reload Now',
      cancelButtonText: 'Later',
      confirmButtonColor: '#FF6B35'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  } else {
    if (confirm('A new version is available. Reload to update?')) {
      window.location.reload();
    }
  }
}

// Request notification permission
async function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('[PWA] Notification permission granted');
      subscribeUserToPush();
    }
  }
}

// Subscribe to push notifications
async function subscribeUserToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY_HERE')
    });

    console.log('[PWA] Push subscription:', subscription);
    
    // Send subscription to server
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
  }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Expose functions globally
window.requestNotificationPermission = requestNotificationPermission;
window.promptInstall = promptInstall;
