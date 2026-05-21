const timelineDataElement = document.querySelector("#videoTimelineData");
const timelineData = JSON.parse(timelineDataElement.textContent);

const refs = {
    video: document.querySelector("#interactiveVideo"),
    playlistLabel: document.querySelector("#playlistLabel"),
    dynamicTitle: document.querySelector("#dynamicTitle"),
    dynamicText: document.querySelector("#dynamicText"),
    playPauseButton: document.querySelector("#playPauseButton"),
    timelineRange: document.querySelector("#timelineRange"),
    timelineMarkers: document.querySelector("#timelineMarkers"),
    activeYear: document.querySelector("#activeYear"),
    activeKeyframeText: document.querySelector("#activeKeyframeText"),
    keyframeList: document.querySelector("#keyframeList"),
    playlistButtons: document.querySelector("#playlistButtons"),
    previousVideoButton: document.querySelector('[data-action="previous-video"]'),
    nextVideoButton: document.querySelector('[data-action="next-video"]')
};

let activeVideoIndex = 0;
let activeKeyframeIndex = 0;

function getActiveVideo() {
    return timelineData.videos[activeVideoIndex];
}

function wrapVideoIndex(index) {
    const videoCount = timelineData.videos.length;
    return (index + videoCount) % videoCount;
}

function clampKeyframeIndex(index) {
    const lastIndex = getActiveVideo().keyframes.length - 1;
    return Math.min(Math.max(Number(index), 0), lastIndex);
}

function requestPlayback() {
    const playPromise = refs.video.play();

    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(updatePlayButton);
    }
}

function updatePlayButton() {
    const isPlaying = !refs.video.paused;
    refs.playPauseButton.textContent = isPlaying ? "Pausar" : "Reproducir";
    refs.playPauseButton.setAttribute("aria-pressed", String(isPlaying));
}

function setActiveButtonState(container, selector, activeIndex, attributeName) {
    container.querySelectorAll(selector).forEach((button) => {
        const isActive = Number(button.dataset[attributeName]) === activeIndex;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-current", isActive ? "true" : "false");
    });
}

function renderPlaylist() {
    const fragment = document.createDocumentFragment();

    refs.playlistButtons.replaceChildren();

    timelineData.videos.forEach((videoItem, index) => {
        const button = document.createElement("button");
        const count = document.createElement("span");
        const title = document.createElement("strong");

        button.type = "button";
        button.className = "playlist-button";
        button.dataset.videoIndex = index;

        count.textContent = `Video ${index + 1}`;
        title.textContent = videoItem.title;

        button.append(count, title);
        fragment.append(button);
    });

    refs.playlistButtons.append(fragment);
    refs.playlistLabel.textContent = `Video ${activeVideoIndex + 1} de ${timelineData.videos.length}`;
    setActiveButtonState(refs.playlistButtons, ".playlist-button", activeVideoIndex, "videoIndex");
}

function renderTimelineMarkers() {
    const fragment = document.createDocumentFragment();

    refs.timelineMarkers.replaceChildren();

    getActiveVideo().keyframes.forEach((keyframe, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.label = String(keyframe.year);
        fragment.append(option);
    });

    refs.timelineMarkers.append(fragment);
}

function renderKeyframeList() {
    const fragment = document.createDocumentFragment();

    refs.keyframeList.replaceChildren();

    getActiveVideo().keyframes.forEach((keyframe, index) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        const year = document.createElement("span");
        const title = document.createElement("strong");
        const time = document.createElement("small");

        button.type = "button";
        button.dataset.keyframeIndex = index;

        year.textContent = keyframe.year;
        title.textContent = keyframe.title;
        time.textContent = `${keyframe.start.toFixed(1)}s - ${keyframe.end.toFixed(1)}s`;

        button.append(year, title, time);
        item.append(button);
        fragment.append(item);
    });

    refs.keyframeList.append(fragment);
}

function setActiveKeyframe(index, options = {}) {
    const keyframeIndex = clampKeyframeIndex(index);
    const keyframe = getActiveVideo().keyframes[keyframeIndex];

    activeKeyframeIndex = keyframeIndex;

    refs.dynamicTitle.textContent = keyframe.title;
    refs.dynamicText.textContent = keyframe.text;
    refs.activeYear.textContent = keyframe.year;
    refs.activeKeyframeText.textContent = keyframe.text;
    refs.timelineRange.value = String(keyframeIndex);

    setActiveButtonState(refs.keyframeList, "button", keyframeIndex, "keyframeIndex");

    if (options.seek) {
        refs.video.currentTime = keyframe.start;
    }
}

function getKeyframeIndexAtTime(currentTime) {
    const keyframes = getActiveVideo().keyframes;
    const matchIndex = keyframes.findIndex((keyframe, index) => {
        const isLast = index === keyframes.length - 1;
        return currentTime >= keyframe.start && (currentTime < keyframe.end || isLast);
    });

    if (matchIndex >= 0) {
        return matchIndex;
    }

    return currentTime < keyframes[0].start ? 0 : keyframes.length - 1;
}

function syncTimelineFromVideo() {
    const nextKeyframeIndex = getKeyframeIndexAtTime(refs.video.currentTime);

    if (nextKeyframeIndex !== activeKeyframeIndex) {
        setActiveKeyframe(nextKeyframeIndex);
    }
}

function seekToKeyframe(index, options = {}) {
    setActiveKeyframe(index, { seek: true });

    if (options.play) {
        requestPlayback();
    }
}

function loadVideo(index, options = {}) {
    activeVideoIndex = wrapVideoIndex(index);
    activeKeyframeIndex = 0;

    const videoItem = getActiveVideo();
    refs.timelineRange.min = "0";
    refs.timelineRange.max = String(videoItem.keyframes.length - 1);
    refs.timelineRange.step = "1";

    renderPlaylist();
    renderTimelineMarkers();
    renderKeyframeList();
    setActiveKeyframe(options.keyframeIndex || 0);

    refs.video.addEventListener("loadedmetadata", () => {
        seekToKeyframe(activeKeyframeIndex, { play: options.autoplay });
    }, { once: true });

    refs.video.src = videoItem.src;
    refs.video.load();
    updatePlayButton();
}

function playAdjacentVideo(direction) {
    loadVideo(activeVideoIndex + direction, { autoplay: true });
}

refs.playPauseButton.addEventListener("click", () => {
    if (refs.video.paused) {
        requestPlayback();
        return;
    }

    refs.video.pause();
});

refs.previousVideoButton.addEventListener("click", () => {
    playAdjacentVideo(-1);
});

refs.nextVideoButton.addEventListener("click", () => {
    playAdjacentVideo(1);
});

refs.timelineRange.addEventListener("input", (event) => {
    seekToKeyframe(event.target.value, { play: !refs.video.paused });
});

refs.keyframeList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-keyframe-index]");

    if (!button) {
        return;
    }

    seekToKeyframe(button.dataset.keyframeIndex, { play: !refs.video.paused });
});

refs.playlistButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-video-index]");

    if (!button) {
        return;
    }

    loadVideo(Number(button.dataset.videoIndex), { autoplay: true });
});

refs.video.addEventListener("timeupdate", syncTimelineFromVideo);
refs.video.addEventListener("seeked", syncTimelineFromVideo);
refs.video.addEventListener("play", updatePlayButton);
refs.video.addEventListener("pause", updatePlayButton);
refs.video.addEventListener("ended", () => {
    const isLastVideo = activeVideoIndex === timelineData.videos.length - 1;
    loadVideo(isLastVideo ? 0 : activeVideoIndex + 1, { autoplay: !isLastVideo });
});

loadVideo(0);
