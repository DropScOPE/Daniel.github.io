// ----------------------------------------------------
// STARFIELD BACKGROUND
// ----------------------------------------------------
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
let w, h;

function initStarfield() {
  resizeCanvas();
  createStars(150);
  animateStarfield();
}

function resizeCanvas() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}

function createStars(count) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.5,
      speed: Math.random() * 0.5 + 0.1
    });
  }
}

function animateStarfield() {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    ctx.fill();
    star.y += star.speed;
    if (star.y > h) {
      star.y = 0;
      star.x = Math.random() * w;
    }
  });
  requestAnimationFrame(animateStarfield);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createStars(150);
});

// ----------------------------------------------------
// MAIN SCRIPT
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Reset scroll to top on load
  window.scrollTo(0, 0);
  
  // Initialize starfield
  initStarfield();

  // ----------------------------------------------------
  // LOADING SCREEN - Minimum display 3 seconds
  // ----------------------------------------------------
  window.addEventListener('load', () => {
    // Start playing background audio immediately on load
    const backgroundAudio = document.getElementById('background-audio');
    const vinylImage = document.getElementById('vinyl-image');
    backgroundAudio.play().then(() => {
      vinylImage.style.animationPlayState = 'running';
    }).catch(err => {
      console.error("Autoplay prevented:", err);
      vinylImage.style.animationPlayState = 'paused';
    });
    
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 600);
    }, 3000);
  });

  // ----------------------------------------------------
  // VINYL MUSIC PLAYER TOGGLE
  // ----------------------------------------------------
  const vinylPlayer = document.getElementById('vinyl-player');
  const backgroundAudio = document.getElementById('background-audio');
  const vinylImage = document.getElementById('vinyl-image');
  vinylPlayer.addEventListener('click', () => {
    if (!backgroundAudio.paused) {
      backgroundAudio.pause();
      vinylImage.style.animationPlayState = 'paused';
    } else {
      backgroundAudio.play().then(() => {
        vinylImage.style.animationPlayState = 'running';
      }).catch(err => {
        console.error("Playback error:", err);
      });
    }
  });

  // ----------------------------------------------------
  // HOME SECTION TEXT ANIMATION (Calm Reveal)
  // ----------------------------------------------------
  const homeHeading = document.querySelector("#home .content h1");
  const homeParagraph = document.querySelector("#home .content p");

  function typeText(element, text, delay, callback) {
    let i = 0;
    element.textContent = "";
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, delay);
      } else {
        if (callback) callback();
      }
    }
    type();
  }

  typeText(homeHeading, homeHeading.getAttribute('data-text'), 40, () => {
    homeHeading.classList.add('visible');
    typeText(homeParagraph, homeParagraph.getAttribute('data-text'), 30, () => {
      homeParagraph.classList.add('visible');
    });
  });

  // ----------------------------------------------------
  // TYPED EFFECT for Interests Code
  // ----------------------------------------------------
  const codeSnippet = `{
  "Coding": ["Python", "HTML", "CSS", "JS", "C#"],
  "Certifications": "Coming soon...",
  "Gaming": {
    "Rainbow Six": "Top 80, 5800 max elo",
    "Call of Duty": "Since CoD 4, currently top 100 ranked multiplayer"
  },
  "Currently Listening": [
    "Juice Wrld",
    "Sleepy Hallow",
    "Isaiah Dreads",
    "Rihanna",
    "Asap Rocky"
  ]
}`;
  const typedCodeElement = document.getElementById('interest-code');
  let index = 0;
  function typeCode() {
    if (index < codeSnippet.length) {
      typedCodeElement.textContent += codeSnippet.charAt(index);
      index++;
      setTimeout(typeCode, 20);
    } else {
      hljs.highlightElement(typedCodeElement);
    }
  }
  setTimeout(typeCode, 500);

  // ----------------------------------------------------
  // ANIMATE SKILL BARS
  // ----------------------------------------------------
  const skillBars = document.querySelectorAll('.skill-progress');
  skillBars.forEach(bar => {
    const skillValue = bar.getAttribute('data-skill');
    setTimeout(() => {
      bar.style.width = skillValue + '%';
    }, 1500);
  });

  // ----------------------------------------------------
  // FADE-IN (Timeline, Interests, Gaming, etc.)
  // ----------------------------------------------------
  const fadeElements = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  fadeElements.forEach(el => {
    observer.observe(el);
  });

  // ----------------------------------------------------
  // TIMELINE DETAILS PANEL INTERACTIVITY
  // ----------------------------------------------------
  const timelineItems = document.querySelectorAll('.timeline-item');
  const timelineDetails = document.getElementById('timeline-details');
  let currentActiveItem = null;
  timelineItems.forEach(item => {
    item.addEventListener('click', () => {
      if (currentActiveItem === item) {
        timelineDetails.classList.remove('visible');
        currentActiveItem = null;
      } else {
        currentActiveItem = item;
        const contentHTML = item.querySelector('.timeline-content').innerHTML;
        timelineDetails.innerHTML = contentHTML;
        timelineDetails.classList.add('visible');
        // Scroll the details panel into view with offset (e.g., nav height of 70px)
        timelineDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.scrollBy(0, -70);
      }
    });
  });
});
