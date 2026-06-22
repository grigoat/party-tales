#!/bin/bash
# Regenerate video & gallery lists in script.js
cd "$(dirname "$0")"

echo "Scanning images/videos/*.mp4 ..."
FILES=$(ls images/videos/*.mp4 2>/dev/null | sort)
python3 -c "
import json, re
with open('js/script.js') as f:
    content = f.read()

videos = $(ls images/videos/*.mp4 2>/dev/null | sort | python3 -c "
import sys, json
files = [f.strip() for f in sys.stdin.read().splitlines()]
files = [f.split('/')[-1] for f in files]
print(json.dumps(files))
")
videos_str = ', '.join([repr(v) for v in videos])
content = re.sub(
    r'var videoFiles = \[[^\]]*?\];',
    'var videoFiles = [\n      ' + ', \n      '.join([repr(v) for v in videos]) + '\n    ];',
    content
)

photos = $(ls images/gallery/*.{JPG,jpg,png,webp} 2>/dev/null | sort | python3 -c "
import sys, json
files = [f.strip() for f in sys.stdin.read().splitlines()]
files = [f.split('/')[-1] for f in files]
print(json.dumps(files))
")
content = re.sub(
    r'var galleryFiles = \[[^\]]*?\];',
    'var galleryFiles = [\n  ' + ', \n  '.join([repr(p) for p in photos]) + '\n  ];',
    content
)

with open('js/script.js', 'w') as f:
    f.write(content)
"
echo "Done. $(ls images/videos/*.mp4 2>/dev/null | wc -l) videos, $(ls images/gallery/*.{JPG,jpg,png,webp} 2>/dev/null | wc -l) photos."
