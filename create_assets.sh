#!/bin/bash

# Create placeholder assets for development
# This creates simple colored rectangles as placeholder images

IMAGES_DIR="public/assets/images"
UI_DIR="public/assets/images/ui" 
AUDIO_DIR="public/assets/audio"

# Create directories if they don't exist
mkdir -p "$IMAGES_DIR" "$UI_DIR" "$AUDIO_DIR"

# Function to create a simple colored PNG using ImageMagick (if available)
# Falls back to creating empty files
create_placeholder_image() {
    local file="$1"
    local width="$2"
    local height="$3" 
    local color="$4"
    
    if command -v convert >/dev/null 2>&1; then
        convert -size ${width}x${height} xc:"$color" "$file"
        echo "Created $file (${width}x${height}, $color)"
    else
        touch "$file"
        echo "Created empty placeholder: $file"
    fi
}

# Function to create a simple audio file (silence)
create_placeholder_audio() {
    local file="$1"
    local duration="$2"
    
    if command -v ffmpeg >/dev/null 2>&1; then
        ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t "$duration" -q:a 9 -acodec libvorbis "$file" -y >/dev/null 2>&1
        echo "Created $file (${duration}s silence)"
    else
        touch "$file"
        echo "Created empty placeholder: $file"
    fi
}

echo "Creating placeholder assets..."

# Image assets
create_placeholder_image "$IMAGES_DIR/background.png" 1920 1080 "#1a1a2e"
create_placeholder_image "$IMAGES_DIR/player-idle.png" 80 80 "#6B46C1"
create_placeholder_image "$IMAGES_DIR/player-jump.png" 80 80 "#8B5CF6" 
create_placeholder_image "$IMAGES_DIR/player-run.png" 640 80 "#7C3AED"
create_placeholder_image "$IMAGES_DIR/platform.png" 100 50 "#4B5563"
create_placeholder_image "$IMAGES_DIR/obstacle.png" 60 60 "#EF4444"
create_placeholder_image "$IMAGES_DIR/obstacle-pulse.png" 240 60 "#F87171"
create_placeholder_image "$IMAGES_DIR/note-collectible.png" 30 30 "#F59E0B"
create_placeholder_image "$IMAGES_DIR/particle.png" 10 10 "#FFFFFF"

# UI assets  
create_placeholder_image "$UI_DIR/button-play.png" 100 50 "#10B981"
create_placeholder_image "$UI_DIR/button-pause.png" 50 50 "#F59E0B"
create_placeholder_image "$UI_DIR/button-menu.png" 50 50 "#6B7280"
create_placeholder_image "$UI_DIR/harmony-bar.png" 300 20 "#059669"
create_placeholder_image "$UI_DIR/tempo-dial.png" 80 80 "#EC4899"

# Audio assets (3 seconds of silence each)
create_placeholder_audio "$AUDIO_DIR/demo-track.ogg" 30
create_placeholder_audio "$AUDIO_DIR/menu-music.ogg" 10  
create_placeholder_audio "$AUDIO_DIR/jump.ogg" 0.5
create_placeholder_audio "$AUDIO_DIR/beat-hit.ogg" 0.3
create_placeholder_audio "$AUDIO_DIR/perfect-hit.ogg" 0.4
create_placeholder_audio "$AUDIO_DIR/collect-note.ogg" 0.2

# Create icon placeholder
create_placeholder_image "public/icon.svg" 512 512 "#6B46C1"

echo "Placeholder assets created successfully!"
echo "Note: For full functionality, replace these with actual game assets."