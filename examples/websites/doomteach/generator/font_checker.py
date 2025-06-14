#!/usr/bin/env python3
"""
Script to check available fonts for MoviePy TextClip
"""

import subprocess
import re

def check_available_fonts():
    """Check what fonts are available through ImageMagick"""
    
    print("🔍 Checking available fonts for MoviePy/ImageMagick...\n")
    
    try:
        # Get list of fonts from ImageMagick
        result = subprocess.run(['convert', '-list', 'font'], capture_output=True, text=True)
        
        if result.returncode != 0:
            print("❌ Error running 'convert -list font'")
            print("Make sure ImageMagick is installed and in your PATH")
            return
        
        fonts_output = result.stdout
        
        # Parse font names (they usually appear after "Font:" in the output)
        font_lines = []
        for line in fonts_output.split('\n'):
            if 'Font:' in line:
                # Extract font name after "Font: "
                font_name = line.split('Font:')[1].strip()
                font_lines.append(font_name)
        
        if not font_lines:
            print("No fonts found in standard format. Here's the raw output:")
            print(fonts_output[:1000])
            return
        
        print(f"Found {len(font_lines)} fonts:\n")
        
        # Look for common bold fonts
        bold_fonts = []
        arial_fonts = []
        helvetica_fonts = []
        other_fonts = []
        
        for font in sorted(font_lines):
            font_lower = font.lower()
            if 'bold' in font_lower:
                bold_fonts.append(font)
            elif 'arial' in font_lower:
                arial_fonts.append(font)
            elif 'helvetica' in font_lower:
                helvetica_fonts.append(font)
            else:
                other_fonts.append(font)
        
        # Display categorized fonts
        if bold_fonts:
            print("🔥 BOLD FONTS (recommended for subtitles):")
            for font in bold_fonts[:10]:  # Show first 10
                print(f"  - {font}")
            if len(bold_fonts) > 10:
                print(f"  ... and {len(bold_fonts)-10} more")
            print()
        
        if arial_fonts:
            print("📝 ARIAL FONTS:")
            for font in arial_fonts:
                print(f"  - {font}")
            print()
        
        if helvetica_fonts:
            print("📝 HELVETICA FONTS:")
            for font in helvetica_fonts:
                print(f"  - {font}")
            print()
        
        # Show some other common fonts
        print("📋 OTHER COMMON FONTS (first 15):")
        for font in other_fonts[:15]:
            print(f"  - {font}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS FOR YOUR CODE:")
        if bold_fonts:
            print(f"✅ Use: font='{bold_fonts[0]}'")
        elif arial_fonts:
            print(f"✅ Use: font='{arial_fonts[0]}'")
        elif helvetica_fonts:
            print(f"✅ Use: font='{helvetica_fonts[0]}'")
        else:
            print("✅ Use: font=None (system default)")
        
    except FileNotFoundError:
        print("❌ ImageMagick 'convert' command not found!")
        print("\nInstall ImageMagick:")
        print("  Ubuntu/Debian: sudo apt-get install imagemagick")
        print("  macOS: brew install imagemagick") 
        print("  Windows: Download from https://imagemagick.org/script/download.php")
    
    except Exception as e:
        print(f"❌ Error checking fonts: {e}")


def test_specific_font(font_name):
    """Test if a specific font works with TextClip"""
    
    try:
        import moviepy.config as mpy_conf
        mpy_conf.change_settings({"textclip_backend": "imagemagick"})
        from moviepy.editor import TextClip
        
        print(f"\n🧪 Testing font: {font_name}")
        
        # Try to create a simple TextClip
        clip = TextClip("Test", fontsize=40, color='white', font=font_name)
        print(f"✅ Font '{font_name}' works!")
        return True
        
    except Exception as e:
        print(f"❌ Font '{font_name}' failed: {e}")
        return False


if __name__ == "__main__":
    check_available_fonts()
    
    # Test a few common fonts
    test_fonts = ['Arial', 'DejaVu-Sans-Bold', 'Liberation-Sans-Bold', 'Times-Bold']
    
    print("\n" + "="*50)
    print("🧪 TESTING COMMON FONTS WITH MOVIEPY")
    print("="*50)
    
    for font in test_fonts:
        test_specific_font(font)