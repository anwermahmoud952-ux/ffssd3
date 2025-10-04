
const sounds: { [key: string]: HTMLAudioElement } = {};

const soundSources = {
  click: 'https://cdn.freesound.org/previews/510/510520_6214859-lq.mp3',
  success: 'https://cdn.freesound.org/previews/391/391539_5121236-lq.mp3',
  win: 'https://cdn.freesound.org/previews/270/270333_2604381-lq.mp3',
  lose: 'https://cdn.freesound.org/previews/174/174439_3229969-lq.mp3',
};

export const playSound = (soundName: keyof typeof soundSources) => {
  try {
    if (!sounds[soundName]) {
      sounds[soundName] = new Audio(soundSources[soundName]);
      sounds[soundName].volume = 0.4; // Set a subtle volume
    }
    // Restart sound if it's already playing
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(error => {
        // This can happen if the user hasn't interacted with the page yet, or if a sound is interrupted.
        console.warn(`Could not play sound "${soundName}":`, error);
    });
  } catch (error) {
    console.error(`Error playing sound "${soundName}":`, error);
  }
};
