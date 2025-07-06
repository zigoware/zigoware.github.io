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