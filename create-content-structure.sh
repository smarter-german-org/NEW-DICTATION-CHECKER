#!/bin/bash
# Bulk file structure creator for Dictation Checker app
# This script creates the folder structure for all courses and lessons
# and creates placeholder files for each lesson.

echo "====================================================="
echo "Dictation App Content Generator for Teachable Courses"
echo "====================================================="
echo

# Configuration
BASE_DIR="dictation-content"
NUM_COURSES=4
NUM_LESSONS=50

# Create base directory
mkdir -p $BASE_DIR

# Create course and lesson folders
for course in $(seq 1 $NUM_COURSES); do
  course_dir="$BASE_DIR/course$course"
  mkdir -p $course_dir
  echo "Created course directory: $course_dir"
  
  for lesson in $(seq 1 $NUM_LESSONS); do
    lesson_dir="$course_dir/lesson$lesson"
    mkdir -p $lesson_dir
    
    # Create placeholder README for each lesson
    cat > "$lesson_dir/README.txt" << EOF
Course $course, Lesson $lesson

Instructions:
1. Place your audio.mp3 file in this folder
2. Place your audio.vtt file in this folder
3. Test using the embed.html with appropriate URL parameters

Audio File: audio.mp3
VTT File: audio.vtt
EOF
    
    # Create a placeholder VTT file
    cat > "$lesson_dir/audio.vtt.example" << EOF
WEBVTT

NOTE Title: Course $course, Lesson $lesson - Dictation Exercise

00:00:00.000 --> 00:00:04.000
This is the first sentence of your dictation exercise.

00:00:04.500 --> 00:00:08.500
This is the second sentence. Replace with your actual content.

00:00:09.000 --> 00:00:14.000
Add more sentences as needed for your lesson.
EOF
  done
  
  echo "Created $NUM_LESSONS lesson directories for course $course"
  echo
done

echo "✅ Content structure created successfully!"
echo "Next steps:"
echo "1. Copy your mp3 and vtt files to each lesson folder"
echo "2. Run build-embedded.sh to build the app"
echo "3. Upload everything to your WordPress server"
echo "4. Use generate-teachable-code.js to create HTML code for your Teachable lessons"
