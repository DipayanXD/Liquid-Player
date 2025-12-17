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
function showControls() {
    controlsOverlay.classList.remove('hidden');
    videoWrapper.style.cursor = 'default';

    clearTimeout(controlsTimeout);

    if (!video.paused) {
        controlsTimeout = setTimeout(() => {
            controlsOverlay.classList.add('hidden');
            videoWrapper.style.cursor = 'none';
        }, 3000);
    }
}

videoWrapper.addEventListener('mousemove', showControls);
controlsOverlay.addEventListener('mousemove', showControls);
