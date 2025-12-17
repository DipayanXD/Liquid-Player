export const video = document.getElementById('main-video');

export function togglePlay() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

export function setVolume(value) {
    video.volume = value;
    video.muted = (value === 0);
}

export function skip(amount) {
    video.currentTime += amount;
}
