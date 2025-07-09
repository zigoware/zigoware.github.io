//Script to fix template: to stop scrolling/animation behavior of blog post cards if entering page from bottom
function stopScrollingBehaviorIfRefreshedPage() {
    const styleToStopScrollingBehavior = "opacity: 1 !important; transform: none !important;";

    try {
        // === 1 is for reload, 2 is for back navigation
        const pageAccessedByReload = (
            (window.performance.navigation && window.performance.navigation.type === 1) ||
            (window.performance.navigation && window.performance.navigation.type === 2) ||
            window.performance
                .getEntriesByType('navigation')
                .map((nav) => nav.type)
                .some(value => ['reload', 'back_forward'].includes(value))
        );

        if (pageAccessedByReload) {
            //console.info( "This page is reloaded or (back-button was pressed)" );
            
            document.getElementById("post-template").style = styleToStopScrollingBehavior;
        } else {
            //console.info( "This page is not reloaded" );
        }
    } catch (error) {
        console.error("Error checking page reload!", error);

        document.getElementById("post-template").style = styleToStopScrollingBehavior;
    }
}

function parseYAML(yamlString) {
    const posts = [];
    // Simple YAML parser (for demonstration purposes)
    const lines = yamlString.split('\n');
    
    let currentPost = {};

    let skipGap = false;
    lines.forEach(line => {
        if (skipGap) {
            skipGap = false;
            return;
        }
        if (line.trim() === '---') {
            if (Object.keys(currentPost).length > 0) {
                currentPost.tags = JSON.parse(currentPost.tags);
                
                posts.push(currentPost);
                currentPost = {};
                skipGap = true; // Skip the next line
            }
        } else {
            const [key, ...value] = line.split(':');
            currentPost[key.trim()] = value.join(':').trim();
        }
    });

    return posts;
}

function checkRunningLocally() {
    let isRunningLocally = window.location.protocol === "file:";
    if (isRunningLocally) {
        console.log("The application is running from a local file.");
    } else {
        console.log("The application is running from a web server.");
    }
    return isRunningLocally;
}

function checkForBlogPostRegistrationRequired() {
    //copy paste below
    if (isRunningLocally) {
        fetch('http://localhost:5000/checkForBlogPostConfigUpdate')
        .then(response => {
            if (response.status === 201) {
                console.log("Blog post needs to be registered");
                alert('New blog post needs to be setup.' + '\n' +
                        '> New Copilot prompt copied to clipboard!' + '\n' +
                        '> > Refresh the page after using the prompt.');
            } else if (response.status !== 200) {
                console.error("Error checking blog posts (see below response)");
                console.error(response);
            }
        });
    }
}

function getYamlFetchPromise() {
    if (isRunningLocally) {
        // If running locally, fetch from the local file
        return fetch('http://localhost:5000/posts.yml');
    } else {
        // If running on a server, fetch from the server
        return fetch('/blog-posts/posts.yml');
    }
}

function sortPostsByDate() {
    //let newPostsCopy = [...posts];

    posts.sort((a, b) => {
        return parseInt(dayjs(b.date).valueOf()) - parseInt(dayjs(a.date).valueOf());
    });

    //return newPostsCopy;
}

function setupCards(postTemplate, container, threeWideLayout) {
    var postIndex = 0;
    filteredPosts.forEach(post => {
        const postClone = postTemplate.cloneNode(true);

        // Unhide the cloned card
        postClone.removeAttribute("hidden");
        postClone.removeAttribute("id"); // Remove the id to avoid duplicates (might affect SEO)
        postClone.style.marginBottom = "30px"; // Reset margin bottom to avoid double spacing

        if (!threeWideLayout) {
            // not sure what this is for, but it was in the original code
            if (postIndex % 2 === 0)
                postClone.dataset.aosDelay = 0;
            else
                postClone.dataset.aosDelay = 100;

            // add bottom margin for cards in second row and below
            /* if (postIndex == 1) {
                postClone.querySelector(".blog1-single-box").classList.add("sm:mt-30");
            }
            else if (postIndex >= 2) {
                postClone.querySelector(".blog1-single-box").classList.add("mt-30");
            } */
        } else {
            /* this is done using events in categories.html
            if (postIndex % 3 === 0)
                postClone.dataset.aosDelay = 0;
            else if (postIndex % 3 === 1)
                postClone.dataset.aosDelay = 100;
            else
                postClone.dataset.aosDelay = 200; */

            // add bottom margin for cards in second row and below
            /* if (postIndex == 1) {
                postClone.querySelector(".blog1-single-box").classList.add("sm:mt-30");
            }
            else if (postIndex == 2) {
                postClone.querySelector(".blog1-single-box").classList.add("sm:mt-30");
                postClone.querySelector(".blog1-single-box").classList.add("md:mt-30");
            }
            else if (postIndex >= 3) {
                postClone.querySelector(".blog1-single-box").classList.add("mt-30");
            } */
        }

        postIndex++;

        postClone.querySelector("#thumbnail").src = post.thumbnail;

        if (post.tags.includes("security")) {
            postClone.querySelector("#category").textContent = "Security";
            postClone.querySelector("#category").href = "categories.html?c=security";
        } else if (post.tags.includes("tutorial")) {
            postClone.querySelector("#category").textContent = "Tutorial";
            postClone.querySelector("#category").href = "categories.html?c=tutorial";
        } else if (post.tags.includes("networking")) {
            postClone.querySelector("#category").textContent = "Networking";
            postClone.querySelector("#category").href = "categories.html?c=networking";
        }

        postClone.querySelector("#title").textContent = post.title;
        postClone.querySelector("#description").textContent = post.description;
        
        postClone.querySelector("#author").textContent = post.author;
        if (post.author == "Dzenis Zigo") {
            postClone.querySelector("#author-thumbnail").src = "./pics/p1.jpg";
            postClone.querySelector("#author").href = "categories.html?author=dzenis-zigo";
        }

        const theDate = dayjs(post.date);
        postClone.querySelector("#date").textContent = theDate.format("MMM D, YYYY");

        postClone.querySelector("#timetoread").textContent = " " + post.timetoread + " min read";

        postClone.querySelectorAll(".stretched-link").forEach( link => {
            link.href = "blog-post.html?id=" + post.id;
        });

        if (post.isPrevPost || post.isNextPost) {
            console.log('postId: ', post.id, '\nisPrevPost: ', post.isPrevPost, '\nisNextPost: ', post.isNextPost);
            const prevNextDisplay = document.createElement('span');
            prevNextDisplay.style.zIndex = '3';
            prevNextDisplay.style.position = 'absolute';
            prevNextDisplay.style.backgroundColor = 'white';
            prevNextDisplay.style.borderRadius = '12px';
            prevNextDisplay.style.margin = '12px';
            prevNextDisplay.style.padding = '12px';
            prevNextDisplay.style.fontWeight = 'bold';
            prevNextDisplay.style.fontSize = 'var(--f-fs-font-fs20)';
            prevNextDisplay.style.opacity = '90%';
            if (post.isPrevPost)
                prevNextDisplay.textContent = 'Previous Post';
            else if (post.isNextPost)
                prevNextDisplay.textContent = 'Next Post';
            
            postClone.querySelector('.thumbnail').prepend(prevNextDisplay);
            //postClone.querySelector('.thumbnail .stretched-link:after').style.zIndex = '4 !important'; 
        }

        container.appendChild(postClone);
    });
}