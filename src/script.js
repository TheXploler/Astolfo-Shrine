class MemoriesGallery {
  constructor() {
    // Gallery elements
    this.entryOverlay = document.getElementById("entry-overlay");
    this.enterButton = document.getElementById("enter-gallery");
    this.galleryContainer = document.getElementById("gallery-container");
    this.galleryWrapper = document.getElementById("gallery-wrapper");
    this.imagePreview = document.getElementById("image-preview");
    this.previewContainer = document.getElementById("preview-container");
    this.previewImage = document.getElementById("preview-image");

    // Audio elements
    this.backgroundMusic = document.getElementById("background-music");
    this.audioControl = document.getElementById("audio-control");
    this.audioIcon = document.getElementById("audio-icon");
    this.isMuted = false;

    // Audio state
    this.isFirstPlay = true;

    this.initEventListeners();
  }

  initEventListeners() {
    // Start audio n initiate gallery
    this.enterButton.addEventListener("click", () => {
      this.startGalleryAndMusic();
    });

    this.imagePreview.addEventListener("click", (e) => {
      if (this.imagePreview.classList.contains("active")) {
        this.closeImagePreview();
      }
    });

    // Audio control event listener
    this.audioControl.addEventListener("click", () => this.toggleAudio());
  }

  startGalleryAndMusic() {
    // Hide entry overlay
    this.entryOverlay.classList.add("hidden");
    this.galleryContainer.classList.add("visible");

    setTimeout(() => this.createImageTiles(), 500);
    this.playMusic();
  }

  playMusic() {
    // Try to play music
    this.backgroundMusic
      .play()
      .then(() => {
        // Show audio control after successful play
        this.audioControl.classList.add("visible");
      })
      .catch((error) => {
        console.log("Music autoplay was prevented.", error);

        // User interaction prompt if fail
        const musicPrompt = document.createElement("div");
        musicPrompt.className =
          "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/80 text-black p-6 rounded-lg shadow-xl z-50";
        musicPrompt.innerHTML = `  
                    <h2 class="text-2xl font-bold mb-4">Music Playback</h2>  
                    <p class="mb-4">Your browser requires user interaction to play audio.</p>  
                    <button id="music-interaction-btn" class="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition">  
                        Play Music  
                    </button>  
                `;
        document.body.appendChild(musicPrompt);

        const interactionBtn = document.getElementById("music-interaction-btn");
        interactionBtn.addEventListener("click", () => {
          this.backgroundMusic
            .play()
            .then(() => {
              this.audioControl.classList.add("visible");
              document.body.removeChild(musicPrompt);
            })
            .catch((err) => {
              console.error("Shit's Cooked", err);
            });
        });
      });
  }

  toggleAudio() {
    if (this.isMuted) {
      this.backgroundMusic.muted = false;
      this.isMuted = false;

      // Update icon on
      this.audioIcon.innerHTML = `  
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />  
            `;
    } else {
      this.backgroundMusic.muted = true;
      this.isMuted = true;

      // Update icon off
      this.audioIcon.innerHTML = `  
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />  
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />  
            `;
    }
  }
  async createImageTiles() {
    try {
      // Fetch images from JSON
      const response = await fetch("images.json");
      const imageData = await response.json();
      this.galleryWrapper.innerHTML = "";

      // Number of columns
      const columns = 4;

      // Distribute
      const columnArrays = Array.from({ length: columns }, () => []);
      imageData.images.forEach((src, index) => {
        columnArrays[index % columns].push(src);
      });

      // Infinite scroll
      const columnSets = [columnArrays, columnArrays];

      columnSets.forEach((columnSet) => {
        columnSet.forEach((columnImages) => {
          const columnWrapper = document.createElement("div");

          columnImages.forEach((src) => {
            const imgWrapper = this.createImageTile(src);
            columnWrapper.appendChild(imgWrapper);
          });

          this.galleryWrapper.appendChild(columnWrapper);
        });
      });

      const totalImages = imageData.images.length;
      const animationDuration = totalImages * 3;
      this.galleryWrapper.style.animation = `scrollAnimation ${animationDuration}s linear infinite`;
    } catch (error) {
      console.error("Error loading images:", error);
      this.galleryContainer.innerHTML = `<div class="text-white text-center p-4">Failed to load gallery. ${error.message}</div>`;
    }
  }

  createImageTile(src) {
    const imgWrapper = document.createElement("div");
    imgWrapper.className = "image-tile relative";

    const img = document.createElement("img");
    img.src = src;

    img.onload = () => {
      // Maintain proportions
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      imgWrapper.style.aspectRatio = aspectRatio.toFixed(2);
    };

    // Click event for preview
    imgWrapper.addEventListener("click", () => this.openImagePreview(src));

    imgWrapper.appendChild(img);
    return imgWrapper;
  }

  openImagePreview(src) {
    const fullImage = new Image();
    fullImage.onload = () => {
      // Scaling to fit screen
      const windowAspectRatio = window.innerWidth / window.innerHeight;
      const imageAspectRatio = fullImage.naturalWidth / fullImage.naturalHeight;

      let scaledWidth, scaledHeight;

      if (windowAspectRatio > imageAspectRatio) {
        // Wider relative to image
        scaledHeight = window.innerHeight - 80;
        scaledWidth = scaledHeight * imageAspectRatio;
      } else {
        // Wider relative to window
        scaledWidth = window.innerWidth - 80;
        scaledHeight = scaledWidth / imageAspectRatio;
      }

      // Set preview image
      this.previewImage.src = src;
      this.previewImage.style.width = `${scaledWidth}px`;
      this.previewImage.style.height = `${scaledHeight}px`;
      this.imagePreview.classList.add("active");
    };

    fullImage.src = src;
  }

  closeImagePreview() {
    this.imagePreview.classList.remove("active");
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  new MemoriesGallery();
});
