#!/usr/bin/env python3
import os
import json
from pathlib import Path

# Create directories
base_dir = Path("/home/runner/work/flow-buster/flow-buster")
images_dir = base_dir / "public/assets/images"
ui_dir = images_dir / "ui"
audio_dir = base_dir / "public/assets/audio"

for dir_path in [images_dir, ui_dir, audio_dir]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Create simple SVG images as placeholders
def create_svg_image(file_path, width, height, color, shape_type="rect"):
    """Create a simple SVG image"""
    try:
        if isinstance(color, str) and color.startswith('#'):
            fill_color = color
        else:
            fill_color = "#6B46C1"  # Default purple
        
        svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{fill_color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{fill_color};stop-opacity:0.7" />
    </linearGradient>
  </defs>'''
        
        if 'player' in str(file_path):
            # Simple character shape
            svg_content += f'''
  <circle cx="{width//2}" cy="{height//3}" r="{width//4}" fill="url(#grad)"/>
  <rect x="{width//3}" y="{height//2}" width="{width//3}" height="{height//2}" fill="url(#grad)"/>'''
        elif 'obstacle' in str(file_path):
            # Diamond shape for obstacles
            svg_content += f'''
  <polygon points="{width//2},5 {width-5},{height//2} {width//2},{height-5} 5,{height//2}" fill="url(#grad)"/>'''
        elif 'button' in str(file_path):
            # Rounded rectangle for buttons
            svg_content += f'''
  <rect x="5" y="5" width="{width-10}" height="{height-10}" rx="10" ry="10" fill="url(#grad)"/>
  <text x="{width//2}" y="{height//2+5}" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">PLAY</text>'''
        elif 'note' in str(file_path):
            # Musical note shape
            svg_content += f'''
  <circle cx="{width//3}" cy="{height*2//3}" r="{width//4}" fill="url(#grad)"/>
  <rect x="{width*2//3-2}" y="{height//4}" width="4" height="{height//2}" fill="url(#grad)"/>'''
        else:
            # Default rectangle
            svg_content += f'''
  <rect x="2" y="2" width="{width-4}" height="{height-4}" fill="url(#grad)"/>'''
        
        svg_content += '\n</svg>'
        
        # Save as PNG by converting file extension and saving SVG content
        png_path = str(file_path).replace('.svg', '.png')
        with open(png_path, 'w') as f:
            f.write(svg_content)
        
        print(f"Created SVG asset: {png_path}")
        return True
    except Exception as e:
        print(f"Error creating {file_path}: {e}")
        Path(file_path).touch()
        return False

def create_json_audio_placeholder(file_path, duration, freq):
    """Create a JSON placeholder for audio files"""
    audio_data = {
        "type": "placeholder",
        "duration": duration,
        "frequency": freq,
        "format": "sine_wave",
        "sample_rate": 44100,
        "channels": 1
    }
    
    json_path = str(file_path).replace('.ogg', '.json')
    with open(json_path, 'w') as f:
        json.dump(audio_data, f, indent=2)
    
    # Also create empty OGG file
    Path(file_path).touch()
    print(f"Created audio placeholder: {file_path}")

# Define assets to create
image_assets = [
    # Main game images  
    (images_dir / "background.png", 1920, 1080, "#1a1a2e"),
    (images_dir / "player-idle.png", 80, 80, "#6B46C1"),
    (images_dir / "player-jump.png", 80, 80, "#8B5CF6"),
    (images_dir / "player-run.png", 640, 80, "#7C3AED"),
    (images_dir / "platform.png", 200, 50, "#4B5563"),
    (images_dir / "obstacle.png", 60, 60, "#EF4444"),
    (images_dir / "obstacle-pulse.png", 240, 60, "#F87171"),
    (images_dir / "note-collectible.png", 30, 30, "#F59E0B"),
    (images_dir / "particle.png", 10, 10, "#FFFFFF"),
    
    # UI images
    (ui_dir / "button-play.png", 240, 60, "#10B981"),
    (ui_dir / "button-pause.png", 60, 60, "#F59E0B"), 
    (ui_dir / "button-menu.png", 60, 60, "#6B7280"),
    (ui_dir / "harmony-bar.png", 300, 20, "#059669"),
    (ui_dir / "tempo-dial.png", 80, 80, "#EC4899"),
]

audio_assets = [
    (audio_dir / "demo-track.ogg", 30.0, 120),
    (audio_dir / "menu-music.ogg", 10.0, 220),
    (audio_dir / "jump.ogg", 0.2, 800),
    (audio_dir / "beat-hit.ogg", 0.15, 1000),
    (audio_dir / "perfect-hit.ogg", 0.2, 1200),
    (audio_dir / "collect-note.ogg", 0.1, 1500),
]

print("Creating image assets...")
for file_path, width, height, color in image_assets:
    create_svg_image(file_path, width, height, color)

print("\nCreating audio placeholders...")
for file_path, duration, freq in audio_assets:
    create_json_audio_placeholder(file_path, duration, freq)

# Create missing level files
level_files = [
    base_dir / "public/assets/levels/demo-level-2.json",
    base_dir / "public/assets/levels/demo-level-3.json"
]

print("\nCreating level files...")
for level_file in level_files:
    if not level_file.exists():
        level_num = level_file.stem[-1]
        level_data = {
            "name": f"Demo Level {level_num}",
            "description": f"Demo level {level_num} with progressive difficulty",
            "bpm": 120 + int(level_num) * 10,
            "duration": 45000,
            "audioFile": "demo-track.ogg",
            "patterns": [
                {
                    "beat": i, 
                    "platform": (i + int(level_num)) % 3, 
                    "type": "obstacle" if i % 2 == 1 else "collectible"
                }
                for i in range(1, 17, 2)
            ],
            "metadata": {
                "difficulty": "easy" if level_num == "2" else "medium",
                "genre": "electronic",
                "creator": "Rhythm Runner Team", 
                "version": "1.0"
            }
        }
        
        with open(level_file, 'w') as f:
            json.dump(level_data, f, indent=2)
        
        print(f"Created {level_file}")

# Create a simple icon
icon_path = base_dir / "public/icon.svg"
icon_content = '''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6B46C1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#iconGrad)"/>
  <text x="256" y="280" text-anchor="middle" fill="white" font-family="Arial" font-size="120" font-weight="bold">♪</text>
</svg>'''

with open(icon_path, 'w') as f:
    f.write(icon_content)

print(f"Created {icon_path}")
print("\nAsset creation complete! All placeholder assets are ready.")