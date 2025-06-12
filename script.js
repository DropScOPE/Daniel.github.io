// ----------------------------------------------------
// GLOBAL CONSTANTS AND CACHED ELEMENTS (for efficiency)
// ----------------------------------------------------
const DOM = {
    // Canvas & Starfield
    starfieldCanvas: document.getElementById('starfield'),
    starfieldCtx: null, // Initialized later if canvas exists
    // Loading Screen
    loadingScreen: document.getElementById('loading-screen'),
    loadingText: document.querySelector('.loading-text'),
    // Home Section
    homeHeading: document.querySelector("#home .content h1"),
    homeParagraph: document.querySelector("#home .content p"),
    // Skills Section
    skillsSection: document.getElementById('skills'),
    skillBars: document.querySelectorAll('.skill-progress'),
    // Timeline
    timelineItems: document.querySelectorAll('.timeline-item'),
    timelineDetails: document.getElementById('timeline-details'),
    mainNav: document.getElementById('main-nav'),
    // Sections for active nav link highlighting
    sections: document.querySelectorAll('section'),
    navLinks: document.querySelectorAll('nav#main-nav ul li a'),
    // Footer
    currentYearSpan: document.getElementById('current-year')
};

// Global animation frame ID for starfield for debouncing
let starfieldAnimationFrameId = null;
// Track current active timeline item
let currentActiveTimelineItem = null;

// Starfield specific variables
let stars = [];
let canvasWidth, canvasHeight;

// ----------------------------------------------------
// STARFIELD BACKGROUND FUNCTIONS
// ----------------------------------------------------

/**
 * Resizes the canvas to fill the window and updates dimensions.
 */
function resizeStarfieldCanvas() {
    if (DOM.starfieldCanvas) {
        canvasWidth = DOM.starfieldCanvas.width = window.innerWidth;
        canvasHeight = DOM.starfieldCanvas.height = window.innerHeight;
    }
}

/**
 * Creates an array of stars with random positions, radii, and speeds.
 * @param {number} count - The number of stars to create.
 */
function createStars(count) {
    stars = [];
    if (canvasWidth && canvasHeight) {
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                radius: Math.random() * 1.5,
                speed: Math.random() * 0.5 + 0.1
            });
        }
    }
}

/**
 * Animates the stars, clearing the canvas and redrawing them.
 * Stars that move off-screen are reset to the top.
 */
function animateStarfield() {
    if (DOM.starfieldCtx) {
        DOM.starfieldCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        DOM.starfieldCtx.fillStyle = '#ffffff'; // White stars (consistent with B/W/R theme)

        stars.forEach(star => {
            DOM.starfieldCtx.beginPath();
            DOM.starfieldCtx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
            DOM.starfieldCtx.fill();

            star.y += star.speed; // Move star downwards

            // Reset star to top if it goes below the canvas
            if (star.y > canvasHeight) {
                star.y = 0; // Reset Y to top
                star.x = Math.random() * canvasWidth; // Random X position
            }
        });
    }
    starfieldAnimationFrameId = requestAnimationFrame(animateStarfield);
}

/**
 * Initializes the starfield background.
 */
function initStarfield() {
    if (DOM.starfieldCanvas) {
        DOM.starfieldCtx = DOM.starfieldCanvas.getContext('2d');
        resizeStarfieldCanvas();
        createStars(150); // Number of stars
        animateStarfield();
    } else {
        console.warn("Starfield canvas not found. Skipping starfield initialization.");
    }
}

// Debounce resize event for starfield to prevent excessive recalculations
let resizeTimeout;
window.addEventListener('resize', () => {
    if (starfieldAnimationFrameId) {
        cancelAnimationFrame(starfieldAnimationFrameId); // Stop current animation
    }
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        initStarfield(); // Re-initialize after resize settles
    }, 250); // Wait 250ms after last resize event
});

// ----------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------

/**
 * Types text into an element character by character with a typewriter effect.
 * @param {HTMLElement} element - The DOM element to type into.
 * @param {string} text - The text string to type.
 * @param {number} delay - Delay in milliseconds between each character.
 * @param {Function} [callback] - Callback function to execute after typing is complete.
 */
function typeText(element, text, delay, callback) {
    if (!element || !text) {
        if (callback) callback();
        return;
    }

    let i = 0;
    element.textContent = "";

    function typeChar() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeChar, delay);
        } else {
            if (callback) callback();
        }
    }
    typeChar();
}

/**
 * Sets up an Intersection Observer for scroll-triggered fade-in animations.
 * Applies 'visible' class when element enters viewport.
 * @param {string} selector - CSS selector for elements to observe.
 * @param {number} threshold - Percentage of element visibility required to trigger.
 * @param {boolean} once - If true, unobserve after first intersection.
 * @param {Function} [callback] - Optional callback to run when an element becomes visible.
 */
function setupIntersectionObserver(selector, threshold = 0.2, once = true, callback = null) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
        console.warn(`No elements found for IntersectionObserver with selector: ${selector}`);
        return;
    }

    const observer = new IntersectionObserver((entries, self) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (callback) {
                    callback(entry.target);
                }
                if (once) {
                    self.unobserve(entry.target);
                }
            } else if (!once) {
                 // Optionally remove 'visible' if not 'once' and element leaves view
                 entry.target.classList.remove('visible');
            }
        });
    }, { threshold: threshold });

    elements.forEach(el => {
        el.classList.remove('visible'); // Ensure initial state is hidden for animation
        observer.observe(el);
    });
}

/**
 * Scrolls to an element with an optional offset.
 * @param {HTMLElement} element - The target element to scroll to.
 * @param {number} offset - The offset from the top of the viewport (e.g., for fixed nav).
 */
function scrollToElement(element, offset = 0) {
    if (!element) return;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// ----------------------------------------------------
// MAIN SCRIPT EXECUTION - DOMContentLoaded
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Reset scroll to top on load (helps with browser refresh behavior)
    window.scrollTo(0, 0);

    // Initialize starfield background
    initStarfield();

    // ----------------------------------------------------
    // LOADING SCREEN
    // ----------------------------------------------------
    window.addEventListener('load', () => {
        // Minimum 3 seconds display for loading screen
        setTimeout(() => {
            if (DOM.loadingScreen) {
                DOM.loadingScreen.classList.add('fade-out');
                DOM.loadingScreen.addEventListener('transitionend', () => {
                    DOM.loadingScreen.style.display = 'none';
                    DOM.loadingScreen.removeAttribute('role');
                    DOM.loadingScreen.removeAttribute('aria-live');
                }, { once: true });
            }
        }, 3000);
    });

    // ----------------------------------------------------
    // HOME SECTION TEXT ANIMATION (Calm Reveal)
    // ----------------------------------------------------
    if (DOM.homeHeading && DOM.homeParagraph) {
        setTimeout(() => {
            typeText(DOM.homeHeading, DOM.homeHeading.getAttribute('data-text'), 40, () => {
                DOM.homeHeading.classList.add('visible');
                typeText(DOM.homeParagraph, DOM.homeParagraph.getAttribute('data-text'), 30, () => {
                    DOM.homeParagraph.classList.add('visible');
                });
            });
        }, 500);
    }

    // ----------------------------------------------------
    // ANIMATE SKILL BARS ON SCROLL
    // ----------------------------------------------------
    if (DOM.skillBars.length > 0) {
        const skillBarObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target; // Select the container
                    const skillValue = bar.getAttribute('data-skill');
                    // Use a CSS custom property to control the width of the ::after pseudo-element
                    bar.style.setProperty('--skill-width', skillValue + '%');

                    setTimeout(() => {
                        bar.setAttribute('aria-valuenow', skillValue);
                    }, 300); // Small delay to allow CSS transition to start
                    observer.unobserve(bar); // Stop observing after animation
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% of the bar is visible

        DOM.skillBars.forEach(bar => {
            bar.style.setProperty('--skill-width', '0%'); // Initialize width to 0 for animation
            skillBarObserver.observe(bar);
        });
    }

    // ----------------------------------------------------
    // FADE-IN SECTIONS/ELEMENTS ON SCROLL (using helper function)
    // ----------------------------------------------------
    setupIntersectionObserver('.section .content', 0.1); // Sections content fade-in
    setupIntersectionObserver('.timeline-item', 0.1, true, (el) => {
        // Stagger timeline item animations
        const index = Array.from(DOM.timelineItems).indexOf(el);
        el.style.transitionDelay = `${index * 0.1}s`;
    });
    setupIntersectionObserver('.award-card', 0.1, true, (el) => {
        // Stagger award card animations
        const index = Array.from(document.querySelectorAll('.award-card')).indexOf(el);
        el.style.transitionDelay = `${index * 0.08}s`;
    });

    // ----------------------------------------------------
    // TIMELINE DETAILS PANEL INTERACTIVITY
    // ----------------------------------------------------
    if (DOM.timelineItems.length > 0 && DOM.timelineDetails) {
        DOM.timelineItems.forEach(item => {
            item.addEventListener('click', () => {
                if (currentActiveTimelineItem) {
                    currentActiveTimelineItem.classList.remove('active-item');
                    currentActiveTimelineItem.setAttribute('aria-expanded', 'false');
                }

                if (currentActiveTimelineItem === item) {
                    DOM.timelineDetails.classList.remove('visible');
                    currentActiveTimelineItem = null;
                    DOM.timelineDetails.innerHTML = '<p>Click on a timeline item to see more details here.</p>';
                } else {
                    currentActiveTimelineItem = item;
                    item.classList.add('active-item');
                    item.setAttribute('aria-expanded', 'true');

                    const contentHTML = item.querySelector('.timeline-content').innerHTML;
                    DOM.timelineDetails.innerHTML = contentHTML;
                    DOM.timelineDetails.classList.add('visible');

                    const navHeight = DOM.mainNav ? DOM.mainNav.offsetHeight : 0;
                    scrollToElement(DOM.timelineDetails, navHeight + 30); // More padding
                }
            });

            item.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    item.click();
                }
            });
        });
    }

    // ----------------------------------------------------
    // ACTIVE NAVIGATION LINK HIGHLIGHTING
    // ----------------------------------------------------
    const updateActiveNavLink = () => {
        const navHeight = DOM.mainNav ? DOM.mainNav.offsetHeight : 0;
        let currentActiveSectionId = '';

        // Determine current active section based on scroll position
        DOM.sections.forEach(section => {
            // Adjust offset for sections to activate slightly before they hit the very top
            const sectionOffset = (section.id === 'home') ? 0 : navHeight;
            const sectionTop = section.offsetTop - sectionOffset - 1;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
                currentActiveSectionId = section.id;
            }
        });

        // Update active class on nav links
        DOM.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === currentActiveSectionId) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', updateActiveNavLink);
    // Initial call to set active link on load
    updateActiveNavLink();


    // ----------------------------------------------------
    // SET CURRENT YEAR IN FOOTER
    // ----------------------------------------------------
    if (DOM.currentYearSpan) {
        DOM.currentYearSpan.textContent = new Date().getFullYear();
    }
});

// ----------------------------------------------------
// PREFERS-REDUCED-MOTION CHECK
// ----------------------------------------------------
const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function handleReducedMotionChange() {
    if (mediaQueryReducedMotion.matches) {
        document.documentElement.style.scrollBehavior = 'auto';
        document.documentElement.style.scrollSnapType = 'none';

        if (DOM.loadingScreen) {
            DOM.loadingScreen.style.transition = 'none';
            DOM.loadingScreen.style.opacity = '0';
            DOM.loadingScreen.style.display = 'none';
            DOM.loadingScreen.removeAttribute('role');
            DOM.loadingScreen.removeAttribute('aria-live');
        }

        if (starfieldAnimationFrameId) {
            cancelAnimationFrame(starfieldAnimationFrameId);
            starfieldAnimationFrameId = null;
        }
        if (DOM.starfieldCanvas) {
            DOM.starfieldCanvas.style.display = 'none'; // Hide starfield if motion is reduced
        }

        // Apply instant visibility/no transform for all animated elements
        document.querySelectorAll('.fade-in, #home .content h1, #home .content p, .timeline-details, .skill-progress, .section .content, .timeline-item, .award-card, .social-links a').forEach(el => {
            el.style.transition = 'none';
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.classList.add('visible'); // Ensure 'visible' state for styles
            el.style.filter = 'none';
            el.style.textShadow = 'none';
            el.style.boxShadow = ''; // Remove specific shadows for subtle ones
        });

        // Ensure skill bars are instantly filled
        if (DOM.skillBars.length > 0) {
            DOM.skillBars.forEach(bar => {
                bar.style.transition = 'none';
                const skillValue = bar.getAttribute('data-skill');
                bar.style.setProperty('--skill-width', skillValue + '%');
                bar.setAttribute('aria-valuenow', skillValue);
            });
        }

    } else { // Motion is preferred, re-enable animations
        if (DOM.starfieldCanvas) {
            DOM.starfieldCanvas.style.display = 'block';
        }
        initStarfield(); // Re-init starfield if it was stopped
    }
}

handleReducedMotionChange();
mediaQueryReducedMotion.addEventListener('change', handleReducedMotionChange);