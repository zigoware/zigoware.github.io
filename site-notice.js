// Shows a slim "work in progress" bar pinned to the bottom of every page.
// Its height is published as --site-banner-h so the page and scroll-to-top button can make room for it.
(function () {
    function showNotice() {
        const banner = document.createElement("div");
        banner.className = "site-banner";
        banner.setAttribute("role", "note");
        banner.innerHTML = `
            <i class="fa-solid fa-person-digging" aria-hidden="true"></i>
            <span><strong>Work in progress:</strong> Zigoware is still being built, and the posts are AI-written placeholders for testing.</span>
        `;
        document.body.appendChild(banner);

        const updateOffset = () =>
            document.documentElement.style.setProperty("--site-banner-h", banner.offsetHeight + "px");
        updateOffset();
        if ("ResizeObserver" in window) {
            new ResizeObserver(updateOffset).observe(banner);
        } else {
            window.addEventListener("resize", updateOffset);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", showNotice);
    } else {
        showNotice();
    }
})();
