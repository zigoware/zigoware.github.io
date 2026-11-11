// Builds sitemap.xml and feed.xml (RSS) in the site root from blog-posts/posts.yml.
// Runs on its own with `npm run feeds`, and automatically when server.js starts.
const fs = require('node:fs');
const path = require('node:path');

const SITE_URL = 'https://zigoware.github.io';
const SITE_ROOT = path.join(__dirname, '..');

// Same simple format that shared.js parses: "key: value" lines between "---" markers
function parsePosts(yamlString) {
  const posts = [];
  let current = {};
  yamlString.split('\n').forEach(line => {
    if (line.trim() === '---') {
      if (Object.keys(current).length > 0) {
        posts.push(current);
        current = {};
      }
    } else if (line.includes(':')) {
      const [key, ...value] = line.split(':');
      current[key.trim()] = value.join(':').trim();
    }
  });
  return posts;
}

// posts.yml dates are MM-DD-YYYY
function toDate(mmddyyyy) {
  const [month, day, year] = mmddyyyy.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateFeeds() {
  const yaml = fs.readFileSync(path.join(SITE_ROOT, 'blog-posts', 'posts.yml'), 'utf8');
  const posts = parsePosts(yaml)
    .filter(post => post.id && post.date)
    .sort((a, b) => toDate(b.date) - toDate(a.date));

  const postUrl = post => `${SITE_URL}/blog-post.html?id=${encodeURIComponent(post.id)}`;
  const isoDay = date => date.toISOString().slice(0, 10);
  const newest = posts.length ? toDate(posts[0].date) : new Date();

  const pages = [
    { loc: `${SITE_URL}/`, lastmod: isoDay(newest) },
    { loc: `${SITE_URL}/categories.html`, lastmod: isoDay(newest) },
    { loc: `${SITE_URL}/contact.html` },
    ...posts.map(post => ({ loc: postUrl(post), lastmod: isoDay(toDate(post.date)) })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${escapeXml(page.loc)}</loc>${page.lastmod ? `
    <lastmod>${page.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`;

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zigoware</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Practical notes on IT, security and networking.</description>
    <language>en-us</language>
    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>
${posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl(post))}</link>
      <guid isPermaLink="true">${escapeXml(postUrl(post))}</guid>
      <pubDate>${toDate(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description || '')}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`;

  fs.writeFileSync(path.join(SITE_ROOT, 'sitemap.xml'), sitemap, 'utf8');
  fs.writeFileSync(path.join(SITE_ROOT, 'feed.xml'), feed, 'utf8');
  console.log(`Generated sitemap.xml and feed.xml for ${posts.length} posts`);
}

module.exports = generateFeeds;

if (require.main === module) {
  generateFeeds();
}
