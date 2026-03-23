const steps = [
    {
        title: "Factory Floor",
        video: "/static/videos/WhatsApp Video 2026-02-06 at 7.03.04 PM.mp4",
        desc: "Our factory floor is designed for efficient workflow, safety, and smooth machine operations.",
        short: "Floor"
    },
    {
        title: "Injection Molding Machine",
        video: "/static/videos/VID-20260209-WA0007~3.mp4",
        desc: "Plastic granules are melted and injected into molds to form precise jar shapes.",
        short: "Molding"
    },
    {
        title: "Injection Blow Molding",
        video: "/static/videos/WhatsApp Video 2026-02-06 at 7.03.07 PM.mp4",
        desc: "Compressed air expands molten plastic to form strong and uniform hollow containers.",
        short: "Blow"
    },
    {
        title: "Packaging Finished Goods",
        video: "/static/videos/WhatsApp Video 2026-02-06 at 7.13.50 PM.mp4",
        desc: "Jars are inspected and packed.",
        short: "Packing"
    },
    {
        title: "Finished Goods",
        video: "/static/videos/VID-20260209-WA0007~2.mp4",
        desc: "Finished jars are prepared for dispatch.",
        short: "Dispatch"
    }
];

let currentStep = 0;
const videoElement = document.getElementById("tourVideo");
const titleElement = document.getElementById("tourTitle");
const descElement = document.getElementById("tourDesc");
const textContainer = document.getElementById("textContainer");
const timelineStepsContainer = document.getElementById("timelineSteps");
const timelineProgress = document.getElementById("timelineProgress");

// Initialize Timeline
function initTimeline() {
    timelineStepsContainer.innerHTML = '';
    steps.forEach((step, index) => {
        const stepDiv = document.createElement("div");
        stepDiv.classList.add("timeline-step");
        stepDiv.setAttribute("data-title", step.short); // Tooltip text
        stepDiv.textContent = index + 1;
        stepDiv.onclick = () => jumpToStep(index);

        // Position percentage
        const percent = (index / (steps.length - 1)) * 100;
        stepDiv.style.left = `calc(${percent}% - 20px)`;
        // -20px is half of width (40px) to center it

        // Absolute position logic handled by CSS if container is relative
        // Actually, flexbox 'space-between' is easier but for the progress line filling, relative is better.
        // Let's use absolute positioning based on percentage for perfect alignment with the line.

        stepDiv.style.position = "absolute";

        timelineStepsContainer.appendChild(stepDiv);
    });
}

function updateTour() {
    // 1. Update Timeline Visuals
    const dots = document.querySelectorAll(".timeline-step");
    dots.forEach((dot, index) => {
        dot.classList.remove("active", "completed");
        if (index < currentStep) {
            dot.classList.add("completed");
        } else if (index === currentStep) {
            dot.classList.add("active");
        }
    });

    // Valid progress width calculation
    const progressPercent = (currentStep / (steps.length - 1)) * 100;
    timelineProgress.style.width = `${progressPercent}%`;

    // 2. Smooth Text Transition
    textContainer.classList.add("fade-text"); // Fade out

    setTimeout(() => {
        titleElement.textContent = steps[currentStep].title;
        descElement.textContent = steps[currentStep].desc;
        textContainer.classList.remove("fade-text"); // Fade in
        textContainer.classList.add("show-text");
    }, 300); // Wait for fade out

    // 3. Update Video
    // Fade video slightly for transition effect
    videoElement.style.opacity = 0.5;
    setTimeout(() => {
        videoElement.src = steps[currentStep].video;
        videoElement.load();
        videoElement.play().catch(e => console.log("Autoplay prevented:", e));
        videoElement.style.opacity = 1;
    }, 300);
}

function nextStep() {
    currentStep = (currentStep + 1) % steps.length;
    updateTour();
}

function prevStep() {
    currentStep = (currentStep - 1 + steps.length) % steps.length;
    updateTour();
}

function jumpToStep(index) {
    currentStep = index;
    updateTour();
}

function openFullscreen() {
    if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
    } else if (videoElement.webkitRequestFullscreen) {
        videoElement.webkitRequestFullscreen();
    } else if (videoElement.msRequestFullscreen) {
        videoElement.msRequestFullscreen();
    }
}

// Keyboard Navigation
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextStep();
    if (e.key === "ArrowLeft") prevStep();
});

// Initialize
initTimeline();
updateTour();

