/* =========================================
   REVIEW SYSTEM LOGIC
========================================= */

const ReviewSystem = {
    // Current state
    reviews: [],
    currentProductId: null,

    // Init
    init: function () {
        this.loadReviews();
        this.bindEvents();
        // Check if we are on products page or reviews page
        if (document.querySelector('.product-card')) {
            this.renderProductCardsStars();
        }
        if (window.location.pathname.includes('reviews.html')) {
            this.initReviewsPage();
        }
    },

    // Load from LocalStorage or Dummy Data
    loadReviews: function () {
        const stored = localStorage.getItem('4d_reviews');
        if (stored) {
            this.reviews = JSON.parse(stored);
        } else {
            // Seed Dummy Data
            this.reviews = [
                {
                    id: '1',
                    productId: '3 KG Plastic Container', // Matching data-name in products.html
                    author: 'Rahul Sharma',
                    avatar: 'R',
                    rating: 5,
                    title: 'Excellent clarity and strength!',
                    text: 'I ordered 50 of these for my bakery. The plastic is crystal clear and very sturdy. Lids fit perfectly.',
                    pros: 'Clear, Strong, Stackable',
                    cons: 'None',
                    isVerified: true,
                    isRecommended: true,
                    date: '2026-02-10',
                    images: [],
                    helpful: 12
                },
                {
                    id: '2',
                    productId: '3 KG Plastic Container',
                    author: 'Priya M.',
                    avatar: 'P',
                    rating: 4,
                    title: 'Good value for money',
                    text: 'Quality is good but delivery took a bit long. Otherwise happy with the product.',
                    pros: 'Affordable',
                    cons: 'Slow shipping',
                    isVerified: true,
                    isRecommended: true,
                    date: '2026-02-12',
                    images: [],
                    helpful: 3
                }
            ];
            this.saveReviews();
        }
    },

    saveReviews: function () {
        localStorage.setItem('4d_reviews', JSON.stringify(this.reviews));
    },

    // --- PRODUCTS PAGE HELPERS ---

    // Calculate Avg Rating
    getStats: function (productId) {
        const productReviews = this.reviews.filter(r => r.productId === productId);
        if (productReviews.length === 0) return { avg: 0, count: 0, breakdown: [0, 0, 0, 0, 0] };

        const sum = productReviews.reduce((a, b) => a + b.rating, 0);
        const avg = (sum / productReviews.length).toFixed(1);

        // Breakdown
        const breakdown = [0, 0, 0, 0, 0]; // 1 to 5
        productReviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating - 1]++;
        });

        // Convert to percentages
        const percents = breakdown.map(c => Math.round((c / productReviews.length) * 100));

        return { avg, count: productReviews.length, breakdown: percents };
    },

    // Render Stars HTML
    generateStars: function (rating) {
        // Rating 0-5
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        let html = '';

        for (let i = 0; i < fullStars; i++) html += '★';
        if (halfStar) html += '½'; // You might want a specific icon or just style 
        // Simple text stars for now, controlled by font/css
        // Or cleaner: always 5 chars, filled via CSS width
        return `<div class="stars-outer">
                    ★★★★★
                    <div class="stars-inner" style="width: ${(rating / 5) * 100}%">★★★★★</div>
                </div>`;
    },

    // Inject into Product Cards
    renderProductCardsStars: function () {

        document.querySelectorAll('.product-card').forEach(card => {

            const productId = card.dataset.productId;
            const stats = this.getStats(productId);
            const reviews = this.reviews.filter(r => r.productId === productId).slice(0, 2);

            // Collect images
            let images = [];
            this.reviews.forEach(r => {
                if (r.productId === productId && r.images) images.push(...r.images);
            });
            images = images.slice(0, 5);

            // Rating badge text
            let badge = "No Ratings";
            if (stats.avg >= 4.5) badge = "Excellent";
            else if (stats.avg >= 4) badge = "Very Good";
            else if (stats.avg >= 3) badge = "Good";
            else if (stats.avg > 0) badge = "Average";

            const previewHTML = `
        <div class="product-review-preview">

            <div class="pr-top">
                <div class="pr-rating">${stats.avg || "0.0"} <span>★</span></div>
                <div class="pr-badge">${badge}</div>
            </div>

            <div class="pr-count">based on ${stats.count} ratings by Verified Buyers</div>

            <div class="review-media-strip">
                ${images.map(img => `<img src="${img}" onclick="location.href='reviews.html?product=${encodeURIComponent(productId)}'">`).join('')}
            </div>

            <div class="pr-review-cards">
                ${reviews.map(r => `
                    <div class="review-preview-card" onclick="location.href='reviews.html?product=${encodeURIComponent(productId)}'">
                        <div class="rpc-title">${r.rating}★ ${r.title}</div>
                        <div class="rpc-text">${r.text.substring(0, 80)}${r.text.length > 80 ? '...' : ''}</div>
                        <div class="rpc-footer">
                            ${r.author} • ${r.date}
                        </div>
                    </div>
                `).join('')}
            </div>

            <button class="show-all-reviews"
            onclick="location.href='reviews.html?product=${encodeURIComponent(productId)}'">
            Show all reviews →
            </button>

        </div>`;

            // remove old
            const old = card.querySelector('.product-review-preview');
            if (old) old.remove();

            card.insertAdjacentHTML('beforeend', previewHTML);

        });
    },


    // --- MODAL & WRITE REVIEW ---

    openModal: function (productId) {
        this.currentProductId = productId;
        const modal = document.querySelector('.review-modal-overlay');

        // Reset Form
        document.getElementById('review-form').reset();
        document.getElementById('modal-product-name').textContent = productId;
        document.getElementById('preview-area').innerHTML = '';

        // Show
        modal.style.display = 'flex';
        // Trigger reflow for animation
        setTimeout(() => modal.classList.add('active'), 10);
    },

    closeModal: function () {
        const modal = document.querySelector('.review-modal-overlay');
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400); // match transition
    },

    handleUpload: function (input) {
        const previewArea = document.getElementById('preview-area');
        if (input.files) {
            Array.from(input.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-thumb';
                    previewArea.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    },

    submitReview: function (e) {
        e.preventDefault();

        // Gather Data
        const form = e.target;
        const rating = document.querySelector('input[name="rating"]:checked');

        if (!rating) {
            alert('Please select a star rating!');
            return;
        }

        // Collect Images
        const images = [];
        document.querySelectorAll('#preview-area img').forEach(img => images.push(img.src));

        const newReview = {
            id: Date.now().toString(),
            productId: this.currentProductId,
            author: form.author.value || 'Anonymous',
            avatar: (form.author.value || 'A').charAt(0).toUpperCase(),
            rating: parseInt(rating.value),
            title: form.title.value,
            text: form.text.value,
            pros: form.pros.value,
            cons: form.cons.value,
            isRecommended: form.recommended.checked,
            isVerified: false, // Demo
            date: new Date().toISOString().split('T')[0],
            images: images,
            helpful: 0
        };

        // Save
        this.reviews.unshift(newReview);
        this.saveReviews();

        // Close & Toast
        this.closeModal();
        this.showToast('Review Submitted! Thank you.');

        // Refresh UI
        if (window.location.pathname.includes('reviews.html')) {
            this.initReviewsPage(this.currentProductId); // Refresh
        } else {
            // Update stars in product page
            // Simple reload or DOM update. DOM update:
            // Re-run render cards? A bit heavy but okay for demo.
            // Better: just remove old summaries and re-add.
            document.querySelectorAll('.product-review-summary').forEach(e => e.remove());
            this.renderProductCardsStars();
        }
    },

    showToast: function (msg) {
        const toast = document.createElement('div');
        toast.className = 'review-toast';
        toast.innerHTML = `<span>✅</span> ${msg}`;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    },

    bindEvents: function () {
        // Close modal on click outside
        const modal = document.querySelector('.review-modal-overlay');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    },

    // --- REVIEWS PAGE LOGIC ---

    initReviewsPage: function () {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('product') || this.reviews[0]?.productId || 'Unknown Product';

        document.getElementById('page-product-title').textContent = productId;

        // 1. Render Stats
        const stats = this.getStats(productId);
        document.getElementById('avg-rating-display').textContent = stats.avg;
        document.getElementById('total-reviews-display').textContent = stats.count + ' Reviews';
        document.getElementById('big-stars-display').innerHTML = this.generateStars(stats.avg);

        // Render Bars
        // breakdown is [1star, 2star... 5star] indices 0-4
        // UI bars usually order 5 down to 1
        for (let i = 5; i >= 1; i--) {
            const pct = stats.breakdown[i - 1];
            document.getElementById(`bar-${i}`).style.width = pct + '%';
            document.getElementById(`bar-text-${i}`).textContent = pct + '%';
        }

        // 2. Render List
        const productReviews = this.reviews.filter(r => r.productId === productId);
        // Sort (default latest)
        // ... (sort logic can be added here)

        const listContainer = document.getElementById('reviews-list-container');
        listContainer.innerHTML = '';

        productReviews.forEach(r => {
            listContainer.innerHTML += this.createReviewCardHTML(r);
        });

        // Filter Logic bind
        // (omitted for brevity, can be added if needed)
    },

    createReviewCardHTML: function (r) {
        let mediaHTML = '';
        if (r.images && r.images.length > 0) {
            mediaHTML = '<div class="review-media-gallery">';
            r.images.forEach(img => {
                mediaHTML += `<img src="${img}" class="review-media-item" onclick="window.open(this.src)">`;
            });
            mediaHTML += '</div>';
        }

        let tagsHTML = '';
        if (r.pros) tagsHTML += `<span class="pc-tag pros">✅ ${r.pros}</span>`;
        if (r.cons) tagsHTML += `<span class="pc-tag cons">❌ ${r.cons}</span>`;

        return `
        <div class="review-card">
            <div class="reviewer-header">
                <div class="reviewer-avatar">${r.avatar}</div>
                <div>
                    <div style="font-weight:bold; color:white;">${r.author}</div>
                    ${r.isVerified ? '<div class="verified-badge">✔ Verified Purchase</div>' : ''}
                </div>
                <div style="margin-left:auto; color:#666; font-size:0.85rem;">${r.date}</div>
            </div>
            
            <div style="margin-bottom:10px;">
                ${this.generateStars(r.rating)}
                <span class="review-title" style="margin-left:10px;">${r.title}</span>
            </div>
            
            <p class="review-text">${r.text}</p>
            
            ${tagsHTML ? `<div class="pros-cons-box">${tagsHTML}</div>` : ''}
            
            ${mediaHTML}
            
            <div class="review-footer">
                <div class="recommend-badge">
                    ${r.isRecommended ? '<span class="recommend-yes">👍 Recommended</span>' : '<span class="recommend-no">✖ Not Recommended</span>'}
                </div>
                <button class="helpful-btn" onclick="this.innerHTML='✔ Helpful (${r.helpful + 1})'">
                    👍 Helpful (${r.helpful})
                </button>
            </div>
        </div>
        `;
    },

    // --- GLOBAL DASHBOARD (Amazon Style) ---

    initGlobalDashboard: function () {
        if (!document.getElementById('global-reviews-feed')) return;

        // 1. Calc Global Stats
        const allReviews = this.reviews;
        if (allReviews.length === 0) {
            document.getElementById('global-reviews-feed').innerHTML = '<p style="color:#aaa; text-align:center;">No reviews yet.</p>';
            return;
        }

        const sum = allReviews.reduce((a, b) => a + b.rating, 0);
        const avg = (sum / allReviews.length).toFixed(1);

        document.getElementById('global-avg-display').textContent = avg;
        document.getElementById('global-stars-display').innerHTML = this.generateStars(avg);
        document.getElementById('global-total-display').textContent = `Based on ${allReviews.length} global ratings`;

        // 2. Bars
        const breakdown = [0, 0, 0, 0, 0];
        allReviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating - 1]++;
        });

        const barsContainer = document.getElementById('global-rating-bars');
        barsContainer.innerHTML = '';
        for (let i = 5; i >= 1; i--) {
            const count = breakdown[i - 1];
            const pct = Math.round((count / allReviews.length) * 100);
            barsContainer.innerHTML += `
                <div class="filter-bar-row" onclick="ReviewSystem.filterGlobalByStar(${i}, this)">
                    <span style="width:35px; color:#fff;">${i} ★</span>
                    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
                    <span style="width:35px; text-align:right; color:#aaa;">${pct}%</span>
                </div>
            `;
        }

        // 3. Render Image Strip (New)
        const imageStripContainer = document.getElementById('global-image-strip');
        const imageStripGrid = document.getElementById('image-strip-grid');

        let allImages = [];
        allReviews.forEach(r => {
            if (r.images && r.images.length) allImages.push(...r.images);
        });

        if (allImages.length > 0) {
            imageStripContainer.style.display = 'block';
            imageStripGrid.innerHTML = '';
            // Show first 8 images
            allImages.slice(0, 8).forEach(src => {
                imageStripGrid.innerHTML += `<img src="${src}" class="strip-img" onclick="window.open('${src}')">`;
            });
        }

        // 4. Render Initial Feed
        this.renderGlobalFeed(allReviews);
    },

    currentFilterStar: null,

    filterGlobalByStar: function (star, element) {
        // Toggle UI
        document.querySelectorAll('.filter-bar-row').forEach(el => el.classList.remove('active'));

        if (this.currentFilterStar === star) {
            // Uncheck
            this.currentFilterStar = null;
            this.renderGlobalFeed(this.reviews);
        } else {
            // Check
            this.currentFilterStar = star;
            element.classList.add('active');
            const filtered = this.reviews.filter(r => r.rating === star);
            this.renderGlobalFeed(filtered);
        }
    },

    sortGlobalReviews: function (sortType) {
        let list = this.currentFilterStar
            ? this.reviews.filter(r => r.rating === this.currentFilterStar)
            : [...this.reviews];

        if (sortType === 'lowest') list.sort((a, b) => a.rating - b.rating);
        if (sortType === 'highest') list.sort((a, b) => b.rating - a.rating);
        if (sortType === 'latest_date') list.sort((a, b) => new Date(b.date) - new Date(a.date));
        // Default 'latest' / Top Ratings mix

        this.renderGlobalFeed(list);
    },

    renderGlobalFeed: function (list) {
        const container = document.getElementById('global-reviews-feed');
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = '<p style="padding:20px; color:#aaa;">No reviews matches this filter.</p>';
            return;
        }

        // Limit to 5 initially for "Show More" functionality?
        // For now render all or top 5
        const displayList = list.slice(0, 5);

        displayList.forEach(r => {
            // Add Product Name Badge
            const card = this.createReviewCardHTML(r);
            // Inject badge into card HTML string - Look for reviewer-header and insert AFTER it? 
            // Or just put it above the Star Rating.
            // My createReviewCardHTML puts stars in: <div style="margin-bottom:10px;">
            // Amazon style: Title is bold, stars are gold. Badges are gray.

            const badgeHTML = `<a href="reviews.html?product=${encodeURIComponent(r.productId)}" class="product-badge">Product: ${r.productId}</a><br>`;

            // Replaces: <div style="margin-bottom:10px;"> -> <div ...> BADGE 
            const finalHTML = card.replace('<div style="margin-bottom:10px;">', '<div style="margin-bottom:10px;">' + badgeHTML);
            container.innerHTML += finalHTML;
        });
    },

    loadMoreGlobal: function () {
        alert("Loading more reviews... (Demo)");
    }

};

// Auto Init
document.addEventListener('DOMContentLoaded', () => {
    ReviewSystem.init();
    ReviewSystem.initGlobalDashboard();
});
