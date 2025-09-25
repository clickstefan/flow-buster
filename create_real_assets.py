#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw
import numpy as np
from pathlib import Path

# Ensure PIL is available, fallback to simple file creation
def create_simple_image(file_path, width, height, color):
    """Create a simple colored rectangle image"""
    try:
        # Create image with color
        if isinstance(color, str):
            color = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))  # Convert hex to RGB
        
        img = Image.new('RGBA', (width, height), color + (255,))
        
        # Add some simple effects for variety
        draw = ImageDraw.Draw(img)
        
        if 'player' in str(file_path):
            # Add simple character shape
            draw.ellipse([width//4, height//4, 3*width//4, 3*height//4], fill=color + (255,))
            draw.rectangle([width//3, height//2, 2*width//3, 3*height//4], fill=color + (255,))
        elif 'obstacle' in str(file_path):
            # Add diamond shape for obstacles
            points = [(width//2, 0), (width, height//2), (width//2, height), (0, height//2)]
            draw.polygon(points, fill=color + (255,))
        elif 'button' in str(file_path):
            # Add rounded rectangle for buttons
            draw.rounded_rectangle([5, 5, width-5, height-5], radius=10, fill=color + (255,))
        
        img.save(file_path)
        print(f"Created {file_path} ({width}x{height})")
        return True
    except ImportError:
        print("PIL not available, creating empty file")
        file_path.touch()
        return False
    except Exception as e:
        print(f"Error creating {file_path}: {e}")
        file_path.touch()
        return False

def create_simple_audio(file_path, duration=1.0, freq=440):
    """Create simple sine wave audio file"""
    try:
        import wave
        import struct
        import math
        
        sample_rate = 44100
        num_samples = int(sample_rate * duration)
        
        # Generate sine wave
        samples = []
        for i in range(num_samples):
            t = i / sample_rate
            # Create a simple tone that fades in and out
            amplitude = 0.3 * math.sin(math.pi * t / duration)  # Fade envelope
            sample = amplitude * math.sin(2 * math.pi * freq * t)
            samples.append(int(sample * 32767))
        
        # Write WAV file
        with wave.open(str(file_path).replace('.ogg', '.wav'), 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 2 bytes per sample
            wav_file.setframerate(sample_rate)
            
            for sample in samples:
                wav_file.writeframes(struct.pack('<h', sample))
        
        print(f"Created {file_path} ({duration}s, {freq}Hz)")
        return True
    except Exception as e:
        print(f"Error creating audio {file_path}: {e}")
        file_path.touch()
        return False

# Create directories
base_dir = Path("/home/runner/work/flow-buster/flow-buster")
images_dir = base_dir / "public/assets/images"
ui_dir = images_dir / "ui"
audio_dir = base_dir / "public/assets/audio"

for dir_path in [images_dir, ui_dir, audio_dir]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Define assets to create
image_assets = [
    # Main game images
    (images_dir / "background.png", 1920, 1080, "#1a1a2e"),
    (images_dir / "player-idle.png", 80, 80, "#6B46C1"),
    (images_dir / "player-jump.png", 80, 80, "#8B5CF6"),
    (images_dir / "player-run.png", 640, 80, "#7C3AED"),  # 8 frames x 80px
    (images_dir / "platform.png", 200, 50, "#4B5563"),
    (images_dir / "obstacle.png", 60, 60, "#EF4444"),
    (images_dir / "obstacle-pulse.png", 240, 60, "#F87171"),  # 4 frames x 60px
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
    (audio_dir / "demo-track.ogg", 30.0, 120),  # 30 seconds, 120 BPM feel
    (audio_dir / "menu-music.ogg", 10.0, 220),
    (audio_dir / "jump.ogg", 0.2, 800),
    (audio_dir / "beat-hit.ogg", 0.15, 1000),
    (audio_dir / "perfect-hit.ogg", 0.2, 1200),
    (audio_dir / "collect-note.ogg", 0.1, 1500),
]

print("Creating image assets...")
for file_path, width, height, color in image_assets:
    create_simple_image(file_path, width, height, color)

print("\nCreating audio assets...")
for file_path, duration, freq in audio_assets:
    create_simple_audio(file_path, duration, freq)

# Create missing level files
level_files = [
    base_dir / "public/assets/levels/demo-level-2.json",
    base_dir / "public/assets/levels/demo-level-3.json"
]

for level_file in level_files:
    if not level_file.exists():
        level_data = {
            "name": f"Demo Level {level_file.stem[-1]}",
            "description": "Auto-generated demo level",
            "bpm": 120,
            "duration": 45000,
            "audioFile": "demo-track.ogg",
            "patterns": [
                {"beat": i, "platform": i % 3, "type": "obstacle" if i % 2 == 1 else "collectible"}
                for i in range(1, 17, 2)
            ],
            "metadata": {
                "difficulty": "easy",
                "genre": "electronic", 
                "creator": "Auto-generated",
                "version": "1.0"
            }
        }
        
        import json
        with open(level_file, 'w') as f:
            json.dump(level_data, f, indent=2)
        
        print(f"Created {level_file}")

print("\nAssets creation complete!")