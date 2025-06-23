document.addEventListener('DOMContentLoaded', () => {
    // This script handles team-specific interactivity.
    // The shared header/footer behavior (like language switching, header visibility,
    // and hamburger menu) is handled by js/main.js, which is also included.

    // Smooth scrolling for internal navigation links on the team page (e.g., #leadership)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Check if the link is an internal anchor link
            const hash = this.getAttribute('href');
            if (hash.length > 1 && hash.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(hash);
                if (target) {
                    // Calculate offset to account for fixed header
                    const headerOffset = document.querySelector('header').offsetHeight;
                    const topPosition = target.offsetTop - headerOffset - 20; // -20 for a bit more padding

                    window.scrollTo({
                        top: topPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Team card animations on scroll (fade-in-card)
    // This is similar to the fade-in for sections in main.js but specifically targets .team-card elements.
    const teamCardFadeInObserverOptions = {
        threshold: 0.1, // Trigger when 10% of the card is visible
        rootMargin: '0px 0px -50px 0px' // Start observing when 50px from bottom of viewport
    };

    const teamCardFadeInObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); // Add 'active' class to trigger CSS transition
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, teamCardFadeInObserverOptions);

    // Apply initial styles and observe team cards
    document.querySelectorAll('.team-card').forEach(card => {
        // Set initial state for animation (opacity: 0, transform: translateY(20px)) via CSS
        // The CSS handles the transition property
        teamCardFadeInObserver.observe(card);
    });

    // Translate specific elements on the team page that are not part of main.js's general translation
    // (e.g., hero title, hero subtitle, section titles, team member details if they were not data-lang-key)
    // NOTE: For this specific request, most dynamic text on wolthers_team.html is now using data-lang-key.
    // If you had elements that were *not* using data-lang-key but needed translation,
    // you would add them here and define their keys in the translations object in main.js.
    // For example, if you had a <p class="team-motto">Our motto: Excellence!</p>
    // you would add `data-lang-key="teamMotto"` to it, and the translation in main.js.
    // The `main.js`'s `applyTranslations` function will handle these as well.

});