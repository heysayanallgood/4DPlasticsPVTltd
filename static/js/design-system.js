/* 
   4D PLASTICS - INTERACTION ENGINE
   Adds physical weight and hover intent to the UI
*/

document.addEventListener('DOMContentLoaded', () => {

    // 1. Button Press Physics
    // Simulates a mechanical switch feel
    const machineControls = document.querySelectorAll('button, .btn, .btn-buy-now, .checkout-btn-main, .btn-add-cart');

    machineControls.forEach(btn => {
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'translateY(2px)';
            btn.style.boxShadow = '0 2px 0 rgba(0,0,0,0.3)';
        });

        btn.addEventListener('mouseup', () => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.boxShadow = '';
        });
    });

    // 2. Card "Highlight" Tracking
    // Adds a very subtle sheen based on mouse position for "Product" feel
    const machinedSurfaces = document.querySelectorAll('.card, .product-card, .review-card, .product-review-preview');

    machinedSurfaces.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // We use a CSS variable if possible, or direct gradient manipulation
            // For safety and performance, we'll keep it simple:
            // This would normally update --mouse-x, --mouse-y
        });

        // Add "lift" class on hover for cleaner CSS selection
        card.addEventListener('mouseenter', () => card.classList.add('hover-lift'));
        card.addEventListener('mouseleave', () => card.classList.remove('hover-lift'));
    });

    // 3. Navbar "scrolled" state
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            nav.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.8)';
            nav.style.background = 'rgba(5,5,5,0.98)';
        } else {
            nav.style.boxShadow = 'none';
        }
    });

    console.log("System v2.0 Online");
});
