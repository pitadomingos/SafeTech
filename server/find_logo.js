const https = require('https');
const urlModule = require('url');

function fetch(urlString) {
  const parsedUrl = urlModule.parse(urlString);
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };
  
  https.get(options, (res) => {
    console.log(`STATUS FOR ${urlString}: ${res.statusCode}`);
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log(`Redirecting to: ${res.headers.location}`);
      fetch(res.headers.location);
      return;
    }
    
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
      // Find logo or images
      const matches = html.match(/src="([^"]+)"|href="([^"]+)"/g) || [];
      const logos = matches.filter(m => m.toLowerCase().includes('logo') || m.toLowerCase().includes('brand'));
      console.log('--- Found Logo references: ---');
      logos.forEach(l => console.log(l));
      
      console.log('\n--- Found img tags: ---');
      const imgs = html.match(/<img[^>]+>/g) || [];
      imgs.slice(0, 10).forEach(i => console.log(i));

      console.log('\n--- Found SVG tags count: ---');
      const svgs = html.match(/<svg[^>]*>([\s\S]*?)<\/svg>/g) || [];
      console.log(`Found ${svgs.length} svgs`);
    });
  }).on('error', (e) => {
    console.error(e);
  });
}

fetch('https://www.vulcan.com');
