const fs = require('fs');
const path = require('path');

function copyIcons(srcDir, destDir) {
	for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
		const src = path.join(srcDir, entry.name);
		const dest = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			copyIcons(src, dest);
		} else if (entry.name.endsWith('.svg')) {
			fs.mkdirSync(destDir, { recursive: true });
			fs.copyFileSync(src, dest);
		}
	}
}

copyIcons('nodes', path.join('dist', 'nodes'));
