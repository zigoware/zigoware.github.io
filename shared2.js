{
    const myCustomEvent2 = new CustomEvent('markdownLoaded');
    function setAnimationDelay(numberOfColumns) {
        if (numberOfColumns == 2) {
            console.log('Setting animation delay for 2 columns');
            document.querySelectorAll('.blog1-posts-area .row .col-md-6:nth-child(odd)').forEach((card) => {
                card.dataset.aosDelay = "0";
            });
            document.querySelectorAll('.blog1-posts-area .row .col-md-6:nth-child(even)').forEach((card) => {
                card.dataset.aosDelay = "100";
            });
        } else {
            console.log('Setting animation delay for 3 columns');
            document.querySelectorAll('.blog1-posts-area .row .col-md-6:nth-child(3n-2)').forEach((card) => {
                card.dataset.aosDelay = "0";
            });
            document.querySelectorAll('.blog1-posts-area .row .col-md-6:nth-child(3n-1)').forEach((card) => {
                card.dataset.aosDelay = "100";
            });
            document.querySelectorAll('.blog1-posts-area .row .col-md-6:nth-child(3n)').forEach((card) => {
                card.dataset.aosDelay = "200";
            });
        }
    }
    window.addEventListener('markdownLoaded', function() {
        const mql = window.matchMedia("(width <= 991px)");
        if (mql.matches) {
            setAnimationDelay(2);
        } else {
            setAnimationDelay(3);
        }
        mql.addEventListener('change', event => { // if only showing 2 columns of cards
            if (event.matches) {
                setAnimationDelay(2);
            } else {
                setAnimationDelay(3);
            }
        });
    });

    stopScrollingBehaviorIfRefreshedPage();
    
    isRunningLocally = checkRunningLocally();

    checkForBlogPostRegistrationRequired();

    var posts = [];
    var filteredPosts = [];

    var yamlFetch = getYamlFetchPromise();
    
    yamlFetch
        .then(response => response.text())
        .then(data => {
            posts = parseYAML(data);
            sortPostsByDate();
            sortPostsByPrevAndNext();
            populatePostCards();
        })
        .catch(error => console.error('Error fetching blog posts:', error));

    var currentlySelectedButton = null;

    var hasPrevCard = false;
    var hasNextCard = false;
    function sortPostsByPrevAndNext() {
        const blogPostId = new URLSearchParams(window.location.search).get('id');
        if (blogPostId) {
            isOnBlogPostPage = true;
            const previd = posts.find(post => post.id === blogPostId)?.idprev;
            const myNextIndex = posts.findIndex(post => post.idprev === blogPostId);
            //console.log('blogPostId: ', blogPostId, '\nidprev: ', posts[myNextIndex].idprev);
            //console.log('myCurrIndex: ', myCurrIndex, '\nmyPrevIndex: ', myPrevIndex, '\nmyNextIndex: ', myNextIndex);
            //console.log('\ncurr post: \n', posts[myCurrIndex], '\n\nprev post: \n', posts[myPrevIndex], '\n\nnext post: \n', posts[myNextIndex]);
            

            // Remove the element from its original position
            // Then Insert the removed element at the new position
            console.log('nextpost: ', posts[myNextIndex]);
            if (myNextIndex != -1) {
                hasNextCard = true;
                const removedElement = posts.splice(myNextIndex, 1)[0];
                removedElement.isNextPost = true; // Mark as next post
                posts.splice(0, 0, removedElement);
            }
            const myPrevIndex = posts.findIndex(post => post.id === previd);
            console.log('prevpost: ', posts[myPrevIndex]);
            if (myPrevIndex != -1) {
                hasPrevCard = true;
                const removedElement = posts.splice(myPrevIndex, 1)[0];
                removedElement.isPrevPost = true; // Mark as previous post
                posts.splice(0, 0, removedElement);
            }

            // Remove the current blog post from posts array
            const myCurrIndex = posts.findIndex(post => post.id === blogPostId);
            posts.splice(myCurrIndex, 1);
            
            console.log('posts: \n', posts)
        }
    }

    function populatePostCards() {
        const categories = [
            { tag: "default", name: ""},
            { tag: "security", name: "Security" },
            { tag: "tutorial", name: "Tutorial" },
            { tag: "networking", name: "Networking" },
        ]

        // if valOrEmpty is empty, remove the parameter from the URL
        function adjustURLParameters(id, valOrEmpty) {
            const urlParams = new URLSearchParams(window.location.search);

            if (valOrEmpty == null)
                urlParams.delete(id);
            else
                urlParams.set(id, valOrEmpty);

            const newUrl = `${window.location.pathname}?${urlParams.toString()}${window.location.hash}`;
            window.history.pushState({}, '', newUrl);
        }

        const categoryTemplate = document.getElementById("category-tab-template");
        const pillButtonTemplate = document.getElementById("my-pill-template");
        categories.forEach((category) => {
            if (category.tag === "default") {
                filteredPosts = posts;
            } else {
                filteredPosts = posts.filter(post => post.tags.includes(category.tag));
            }
            
            const newCategory = categoryTemplate.cloneNode(true);
            categoryTemplate.parentElement.appendChild(newCategory);
            newCategory.removeAttribute("hidden");
            newCategory.id = `category-${category.tag}`;
            newCategory.setAttribute('aria-labelledby', `category-${category.tag}-tab`);

            const newPillButton = pillButtonTemplate.cloneNode(true);
            pillButtonTemplate.parentElement.appendChild(newPillButton);
            
            newPillButton.querySelector('button').id=`category-${category.tag}-tab`;
            
            if (category.tag === "default") {
                newPillButton.setAttribute("id", "hidden-default-button");
                //newPillButton.querySelector('button').classList.add('active');
                //newCategory.classList.add('show', 'active');
                currentlySelectedButton = newPillButton.querySelector('button').id;
            } else {
                newPillButton.removeAttribute("id");
                newPillButton.removeAttribute("hidden");
            }

            newPillButton.querySelector('button').innerText = category.name;
            newPillButton.querySelector('button').dataset.bsTarget = `#category-${category.tag}`;
            newPillButton.querySelector('button').setAttribute('aria-controls', `category-${category.tag}`);
            
            if (category.tag != 'default') {
                newPillButton.querySelector('button').onclick = function(event) {
                    console.log(currentlySelectedButton + ' > ' + event.target.id);

                    if (currentlySelectedButton == event.target.id) {
                        const defaultButton = document.querySelector('#hidden-default-button button');
                        defaultButton.click();
                        currentlySelectedButton = defaultButton.id;
                        adjustURLParameters('c');
                    }
                    else {
                        currentlySelectedButton = event.target.id;
                        adjustURLParameters('c', category.tag);
                    }

                    //if (event.target.ariaSelected)
                    //	document.getElementById('testid').click();
                    //document.getElementById('testid').click();
                };
                //newPillButton.querySelector('button').click();
            }

            const postTemplate = newCategory.querySelector("#post-template");
            const postContainer = postTemplate.parentElement;
            setupCards(postTemplate, postContainer, true);
            
            // Remove the original templates
            postTemplate.remove();
        });
        
        // set active category based on URL parameter
        const category = new URLSearchParams(window.location.search).get('c') || 'default';
        document.getElementById(`category-${category}-tab`).classList.add('active');
        currentlySelectedButton = `category-${category}-tab`;
        document.getElementById(`category-${category}`).classList.add('show', 'active');

        // set active author based on URL parameter
        const author = new URLSearchParams(window.location.search).get('author');
        if (author) {
            var fullName = author.split('-');
            fullName[0] = fullName[0].charAt(0).toUpperCase() + fullName[0].slice(1);
            fullName[1] = fullName[1].charAt(0).toUpperCase() + fullName[1].slice(1);
            fullName = fullName.join(' ');

            //const newPillButtonList = pillButtonTemplate.parentElement.cloneNode(true);
            const newPillButtonList = document.createElement('ul');
            newPillButtonList.classList.add('nav', 'nav-pills');
            newPillButtonList.setAttribute('role', 'tablist');

            const newPillButton = pillButtonTemplate.cloneNode(true);
            newPillButton.querySelector('button').innerText = fullName;
            newPillButton.removeAttribute("id");
            newPillButton.removeAttribute("hidden");
            newPillButton.querySelector('button').classList.add('active');

            const newDefaultButton = pillButtonTemplate.cloneNode(true);
            newDefaultButton.setAttribute("id", "hidden-default-button-for-author");

            function setPostVisibility(elem, isVisible) {
                let currentElement = elem;
                while (currentElement) {
                        // Check if the current element has the target ID
                    if (currentElement.classList.contains('col-md-6')) {
                        if (isVisible) {
                            currentElement.removeAttribute("hidden");
                        } else {
                            currentElement.setAttribute("hidden", "true");
                        }
                        return;
                    }
                    // Move to the parent node
                    currentElement = currentElement.parentNode;
                }
            }
            var isAuthorButtonHighlighted = false;
            newPillButton.querySelector('button').onclick = function(event) {
                if (isAuthorButtonHighlighted) {
                    const defaultButton = document.querySelector('#hidden-default-button-for-author button');
                    defaultButton.click();
                    // make all posts visible (by any author)
                    document.querySelectorAll('a#author').forEach((elem) => {
                        setPostVisibility(elem, true);
                    });
                    isAuthorButtonHighlighted = false;
                    adjustURLParameters('author');
                    //window.location.search = urlParams;
                }
                else {
                    document.querySelectorAll('a#author').forEach((elem) => {
                        // make only posts by the selected author visible
                        if (elem.innerText == fullName) {
                            setPostVisibility(elem, true);
                        } else {
                            setPostVisibility(elem, false);
                        }
                    });
                    isAuthorButtonHighlighted = true;
                    adjustURLParameters('author', author);
                }
            };
            newPillButton.querySelector('button').click();

            //document.que

            pillButtonTemplate.parentElement.parentElement.appendChild(newPillButtonList);
            newPillButtonList.appendChild(newPillButton);
            newPillButtonList.appendChild(newDefaultButton);
        }

        window.dispatchEvent(myCustomEvent2);
    }
}