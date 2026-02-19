function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function preloadSounds(animalSounds) {
    const audioMap = {};
    let loadedCount = 0;

    return new Promise((resolve, reject) => {
        animalSounds.forEach(item => {
            const audio = new Audio();
            audio.src = item.soundFilePath + "#t=0,3";
            audio.preload = "auto";

            audio.addEventListener("canplaythrough", () => {
                loadedCount++;
                audioMap[item.animal] = audio;

                if (loadedCount === animalSounds.length) {
                    resolve(audioMap);
                }
            });

            audio.addEventListener("error", () => {
                reject(new Error(`Failed to load sound: ${item.soundFilePath}`));
            });
        });
    });
}

export {shuffleArray, preloadSounds};
