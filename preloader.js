function hidePreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader || preloader.style.display === "none") return;

    preloader.style.opacity = "0";
    preloader.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
        preloader.style.display = "none";
    }, 500);
}

window.addEventListener("load", hidePreloader);

// Safety check: if load already happened
if (document.readyState === "complete") {
    hidePreloader();
}

// Fallback: Force hide after 5 seconds no matter what to prevent sticking
setTimeout(hidePreloader, 5000);
