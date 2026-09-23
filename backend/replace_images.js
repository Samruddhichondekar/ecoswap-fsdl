const fs = require('fs');

const file = './server.js';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=80",
    "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?w=800&q=80",
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80",
    "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&q=80",
    "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80",
    "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    "https://images.unsplash.com/photo-1614115489855-66422ad300a4?w=800&q=80",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80",
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80",
    "https://images.unsplash.com/photo-1531346878377-3e1176bc06a3?w=800&q=80",
    "https://images.unsplash.com/photo-1586524109436-b63001f3014c?w=800&q=80"
];

let index = 0;
content = content.replace(/imageUrl:\s*".*?"/g, () => {
    if (index < replacements.length) {
        return 'imageUrl: "' + replacements[index++] + '"';
    }
    return 'imageUrl: "https://images.unsplash.com/photo-1586524109436-b63001f3014c?w=800&q=80"';
});

content = content.replace("console.log('Seeded database with the FINAL proxied Amazon/Walmart images.');", "console.log('Seeded database with stable high-resolution Unsplash images.');");

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated image URLs in server.js');
