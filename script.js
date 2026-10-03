const projects = document.querySelectorAll(".project");

// Project title videos

projects.forEach((project) => {
  const titlePanel = project.querySelector(".title-panel");
  const video = project.querySelector(".project-video");
  const titleContent = project.querySelector(".title-content");

  if (!titlePanel || !video) return;

  let hovering = false;
  let reversing = false;
  let reverseFrame = null;
  let reverseLastTime = null;
  let loaded = false;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  // Hide the title text
  function hideTitle() {
    if (titleContent) {
      titleContent.style.opacity = "0";
    }
  }

  // Show the title text
  function showTitle() {
    if (titleContent) {
      titleContent.style.opacity = "1";
    }
  }

  // Load the video
  function loadVideo() {
    if (loaded) return;

    loaded = true;
    video.load();
  }

  // Stop the reverse animation
  function stopReverse() {
    if (reverseFrame !== null) {
      cancelAnimationFrame(reverseFrame);
      reverseFrame = null;
    }

    reverseLastTime = null;
  }

  // Start the video forward
  function startForward() {
    if (!hovering) return;

    if (
      video.readyState < 2 ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      return;
    }

    if (video.currentTime >= video.duration - 0.05) {
      startReverse();
      return;
    }

    reversing = false;
    stopReverse();

    if (!video.paused) return;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        startManualForward();
      });
    }
  }

  // Move the video forward manually
  function startManualForward() {
    if (!hovering || reversing) return;

    let lastTime = null;

    function frame(timestamp) {
      if (!hovering || reversing) {
        return;
      }

      if (
        video.readyState < 2 ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      ) {
        requestAnimationFrame(frame);
        return;
      }

      if (lastTime === null) {
        lastTime = timestamp;
      }

      let delta = (timestamp - lastTime) / 1000;

      lastTime = timestamp;
      delta = Math.min(delta, 0.05);

      video.currentTime += delta;

      if (video.currentTime >= video.duration - 0.02) {
        video.currentTime = video.duration;
        startReverse();
        return;
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // Start the video backwards
  function startReverse() {
    if (!hovering) return;

    video.pause();

    reversing = true;
    stopReverse();

    reverseFrame = requestAnimationFrame(reverseVideo);
  }

  // Move the video backwards
  function reverseVideo(timestamp) {
    if (!hovering || !reversing) {
      stopReverse();
      return;
    }

    if (
      video.readyState < 2 ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      reverseFrame = requestAnimationFrame(reverseVideo);
      return;
    }

    if (reverseLastTime === null) {
      reverseLastTime = timestamp;
    }

    let delta = (timestamp - reverseLastTime) / 1000;

    reverseLastTime = timestamp;
    delta = Math.min(delta, 0.05);

    video.currentTime -= delta * 0.75;

    if (video.currentTime <= 0.01) {
      video.currentTime = 0;
      reversing = false;
      stopReverse();

      if (hovering) {
        startForward();
      }

      return;
    }

    reverseFrame = requestAnimationFrame(reverseVideo);
  }

  // Start the video when it is ready
  video.addEventListener("loadedmetadata", () => {
    video.currentTime = 0;

    if (hovering) {
      startForward();
    }
  });

  // Start playback when the video can play
  video.addEventListener("canplay", () => {
    if (hovering && !reversing) {
      startForward();
    }
  });

  // Start reversing when the video reaches the end
  video.addEventListener("ended", () => {
    if (hovering) {
      startReverse();
    }
  });

  // Reload the video if something goes wrong
  video.addEventListener("error", () => {
    loaded = false;

    if (hovering) {
      loadVideo();
    }
  });

  // Start the video when the mouse enters
  titlePanel.addEventListener("mouseenter", () => {
    hovering = true;
    reversing = false;

    stopReverse();
    hideTitle();
    loadVideo();

    if (
      video.readyState >= 2 &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      startForward();
    }
  });

  // Reset the video when the mouse leaves
  titlePanel.addEventListener("mouseleave", () => {
    hovering = false;
    reversing = false;

    stopReverse();
    video.pause();
    showTitle();

    try {
      video.currentTime = 0;
    } catch (error) {}
  });

  // Load the video when the page opens
  loadVideo();
});

// Mobile navigation

const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");

// Open and close the mobile menu
if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}

// Gallery lightbox

const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightbox-content");
const lightboxClose = document.getElementById("lightbox-close");
const galleryItems = document.querySelectorAll(".gallery-item");

let lightboxAnimationFrame = null;
let lightboxVideo = null;
let lightboxPlayingForward = true;
let activeGalleryPanel = null;

// Open a gallery item

galleryItems.forEach((item) => {
  item.addEventListener("click", () => {
    openLightbox(item);
  });
});

// Open the lightbox
function openLightbox(item) {
  const galleryPanel = item.closest(".gallery-panel");

  if (galleryPanel) {
    activeGalleryPanel = galleryPanel;
    galleryPanel.classList.add("gallery-active");
  }

  cancelAnimationFrame(lightboxAnimationFrame);

  lightboxAnimationFrame = null;
  lightboxContent.innerHTML = "";

  const itemType = item.tagName.toLowerCase();

  if (itemType === "img") {
    const image = document.createElement("img");

    image.src = item.src;
    image.alt = item.alt || "";

    lightboxContent.appendChild(image);
  }

  if (itemType === "video") {
    const video = document.createElement("video");

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";

    const source = item.querySelector("source");

    video.src = source ? source.src : item.currentSrc || item.src;

    lightboxContent.appendChild(video);

    lightboxVideo = video;
    lightboxPlayingForward = true;

    video.addEventListener(
      "loadedmetadata",
      () => {
        if (!lightboxVideo) return;

        video.currentTime = 0;
        playLightboxVideo();
      },
      { once: true },
    );

    if (video.readyState >= 1) {
      video.currentTime = 0;
      playLightboxVideo();
    }
  }

  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

// Play a lightbox video forwards and backwards

function playLightboxVideo() {
  cancelAnimationFrame(lightboxAnimationFrame);

  let lastTime = null;

  function animate(timestamp) {
    if (!lightboxVideo) {
      lightboxAnimationFrame = null;
      return;
    }

    if (
      !Number.isFinite(lightboxVideo.duration) ||
      lightboxVideo.duration <= 0
    ) {
      lightboxAnimationFrame = requestAnimationFrame(animate);
      return;
    }

    if (lastTime === null) {
      lastTime = timestamp;
    }

    const delta = Math.min((timestamp - lastTime) / 1000, 0.05);

    lastTime = timestamp;

    if (lightboxPlayingForward) {
      lightboxVideo.currentTime += delta * 0.75;

      if (lightboxVideo.currentTime >= lightboxVideo.duration) {
        lightboxVideo.currentTime = lightboxVideo.duration;

        lightboxPlayingForward = false;
        lastTime = null;
      }
    } else {
      lightboxVideo.currentTime -= delta * 0.75;

      if (lightboxVideo.currentTime <= 0) {
        lightboxVideo.currentTime = 0;

        lightboxPlayingForward = true;
        lastTime = null;
      }
    }

    lightboxAnimationFrame = requestAnimationFrame(animate);
  }

  lightboxAnimationFrame = requestAnimationFrame(animate);
}

// Close the lightbox

function closeLightbox() {
  cancelAnimationFrame(lightboxAnimationFrame);

  lightboxAnimationFrame = null;

  if (lightboxVideo) {
    lightboxVideo.pause();
    lightboxVideo.removeAttribute("src");
    lightboxVideo.load();

    lightboxVideo = null;
  }

  lightboxPlayingForward = true;
  lightboxContent.innerHTML = "";

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");

  document.body.classList.remove("lightbox-open");
}

// Close the lightbox with the button

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

// Close the lightbox by clicking outside the content

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

// Close the lightbox with Escape

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    lightbox &&
    lightbox.classList.contains("active")
  ) {
    closeLightbox();
  }
});

// Keep the gallery open after viewing an image

projects.forEach((project) => {
  const titlePanel = project.querySelector(".title-panel");
  const galleryPanel = project.querySelector(".gallery-panel");
  const aboutPanel = project.querySelector(".about-panel");

  if (!titlePanel || !galleryPanel || !aboutPanel) {
    return;
  }

  titlePanel.addEventListener("mouseenter", () => {
    galleryPanel.classList.remove("gallery-active");

    if (activeGalleryPanel === galleryPanel) {
      activeGalleryPanel = null;
    }
  });

  aboutPanel.addEventListener("mouseenter", () => {
    galleryPanel.classList.remove("gallery-active");

    if (activeGalleryPanel === galleryPanel) {
      activeGalleryPanel = null;
    }
  });
});
