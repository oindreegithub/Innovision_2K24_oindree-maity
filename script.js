// Toggle dark mode
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
});

// Toggle popup menu
const menuIcon = document.getElementById('menuIcon');
const popupMenu = document.getElementById('popupMenu');
menuIcon.addEventListener('click', function() {
  if (popupMenu.style.display === 'block') {
    popupMenu.style.display = 'none';
  } else {
    popupMenu.style.display = 'block';
  }
});

// Close popup menu if clicked outside
window.addEventListener('click', function(event) {
  if (!menuIcon.contains(event.target) && !popupMenu.contains(event.target)) {
    popupMenu.style.display = 'none';
  }
});