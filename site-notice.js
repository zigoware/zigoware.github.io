// Shows a one-time "work in progress" popup on the first page a visitor opens.
// Once dismissed, it stays hidden for the rest of the browser session.
(function () {
    const STORAGE_KEY = "zigoware-notice-dismissed";

    try {
        if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch (error) {
        // Storage can be blocked (private mode, strict settings); just show the notice
    }

    function showNotice() {
        const dialog = document.createElement("dialog");
        dialog.className = "site-notice";
        dialog.setAttribute("aria-labelledby", "site-notice-title");
        dialog.innerHTML = `
            <div class="site-notice-icon" aria-hidden="true"><i class="fa-solid fa-person-digging"></i></div>
            <h2 id="site-notice-title">This site is a work in progress</h2>
            <p>Zigoware is still being built, and the blog posts here were written by AI as placeholder content for testing.</p>
            <p>You're welcome to look around, but the posts aren't worth spending much time on yet.</p>
            <form method="dialog">
                <button class="theme-btn1" type="submit" autofocus>Got it</button>
            </form>
        `;

        dialog.addEventListener("close", () => {
            try {
                sessionStorage.setItem(STORAGE_KEY, "1");
            } catch (error) {
                // Ignore; the notice will just show again on the next page
            }
            dialog.remove();
        });

        // Clicking the dimmed backdrop also dismisses the notice
        dialog.addEventListener("click", event => {
            if (event.target === dialog) dialog.close();
        });

        document.body.appendChild(dialog);
        dialog.showModal();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", showNotice);
    } else {
        showNotice();
    }
})();
