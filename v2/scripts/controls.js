import { video, togglePlay, formatTime, setVolume, skip } from './player.js';

// Elements
const controlsOverlay = document.querySelector('.controls-overlay');
const playPauseBtn = document.getElementById('play-pause-btn');
const videoWrapper = document.querySelector('.video-wrapper');
const progressBarFill = document.querySelector('.progress-bar-fill');
const seekSlider = document.querySelector('.seek-slider');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeBtn = document.getElementById('volume-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const rewindBtn = document.getElementById('rewind-btn');
const forwardBtn = document.getElementById('forward-btn');

let controlsTimeout;

// Initialization
video.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(video.duration);
    seekSlider.max = video.duration;
});

// Play/Pause Toggle
playPauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
});

video.addEventListener('click', togglePlay);

// Update UI on Play/Pause
video.addEventListener('play', () => {
    updatePlayIcons('pause');
});

video.addEventListener('pause', () => {
    updatePlayIcons('play_arrow');
    showControls(); // Always show controls when paused
});

function updatePlayIcons(iconName) {
    const icon = playPauseBtn.querySelector('.material-icons-round');
    if (icon) icon.textContent = iconName;
}

// Time Update & Progress
video.addEventListener('timeupdate', () => {
    const current = video.currentTime;
    const duration = video.duration;

    // Update Time Display
    currentTimeEl.textContent = formatTime(current);

    // Update Progress Bar
    if (duration > 0) {
        const percent = (current / duration) * 100;
        progressBarFill.style.width = `${percent}%`;
        seekSlider.value = current;
    }
});

// Seek
seekSlider.addEventListener('input', (e) => {
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    const percent = (time / video.duration) * 100;
    progressBarFill.style.width = `${percent}%`;
});

volumeBtn.addEventListener('click', () => {
    if (video.muted || video.volume === 0) {
        setVolume(1);
        updateVolumeIcon(1);
    } else {
        setVolume(0);
        updateVolumeIcon(0);
    }
});

function updateVolumeIcon(value) {
    const icon = volumeBtn.querySelector('.material-icons-round');
    if (value === 0) {
        icon.textContent = 'volume_off';
    } else {
        icon.textContent = 'volume_up';
    }
}

// Skip
rewindBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    skip(-10);
});
forwardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    skip(10);
});

// Fullscreen
fullscreenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
        videoWrapper.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// Controls Visibility (Auto-hide)
// Controls Visibility (Auto-hide)
function showControls() {
    controlsOverlay.classList.remove('hidden');
    videoWrapper.classList.remove('idle'); // Wake up atmosphere
    videoWrapper.style.cursor = 'default';

    clearTimeout(controlsTimeout);

    // Only auto-hide if playing, but idle state can happen if paused and no movement too? 
    // User requested: Paused + no interaction = atmospheric.
    // So we should hide controls/go idle after timeout even if paused?
    // User said: "paused + mouse movement = alive", "playing + no interaction = calm", "paused + no interaction = atmospheric".
    // Current logic only hides if !video.paused.
    // Let's remove that check so it hides/goes idle regardless of play state after timeout.

    controlsTimeout = setTimeout(() => {
        controlsOverlay.classList.add('hidden');
        videoWrapper.classList.add('idle'); // Activate atmosphere
        videoWrapper.style.cursor = 'none';
    }, 3000);
}

videoWrapper.addEventListener('mousemove', showControls);
controlsOverlay.addEventListener('mousemove', showControls);

// Settings Menu Logic
const settingsMenu = document.getElementById('settings-menu');
const settingsOptions = document.querySelectorAll('.settings-option');
const settingsBtn = document.getElementById('settings-btn');

// Toggle Menu
settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('hidden');
});

// Close when clicking outside
document.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsMenu.classList.add('hidden');
    }
});

// Handle Option Selection
settingsOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();

        // Find parent list to ensure we only toggle sibling options
        const parentList = option.closest('.settings-list');
        const siblings = parentList.querySelectorAll('.settings-option');

        // Remove active from siblings
        siblings.forEach(sib => sib.classList.remove('active'));

        // Add active to clicked
        option.classList.add('active');

        // Mock functionality (log selection)
        console.log(`Selected ${parentList.id.replace('-list', '')}: ${option.dataset.value}`);

        // Optional: Close menu on selection? 
        // Let's keep it open for multiple changes or close it? 
        // Usually settings menus stay open or close. Let's keep it open for now.
    });
});

// Prevent clicks inside menu from closing it (handled by stopPropagation in option click, but also need it for container)
settingsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});
