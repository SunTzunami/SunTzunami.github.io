import os
import math
from PIL import Image, ImageDraw, ImageFont

W, H = 480, 200

# Font resolution with macOS and Linux fallbacks
FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
font_path = next((p for p in FONT_PATHS if os.path.exists(p)), None)
font = ImageFont.truetype(font_path, 72) if font_path else ImageFont.load_default()

# The two poses: arms flip sides
faces = ["ᕕ( ᐛ )ᕗ", "ᕗ( ᐛ )ᕕ"]
N = 24  # frames in one full loop


def generate_kaomoji_gif(output_filename, bg_color, text_color):
    frames = []
    for i in range(N):
        img = Image.new("RGB", (W, H), bg_color)
        d = ImageDraw.Draw(img)

        # swap pose every 3 frames
        s = faces[(i // 3) % 2]

        # measure text to center
        bb = d.textbbox((0, 0), s, font=font)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]

        # horizontal sway & vertical bounce
        x = (W - tw) / 2 - bb[0] + 22 * math.sin(2 * math.pi * i / N)
        y = (H - th) / 2 - bb[1] - 18 * abs(math.sin(2 * math.pi * i / (N / 2))) + 10

        d.text((x, y), s, font=font, fill=text_color)
        frames.append(img)

    frames[0].save(
        output_filename,
        save_all=True,
        append_images=frames[1:],
        duration=90,  # ms per frame
        loop=0,       # loop forever
    )
    print(f"Generated {output_filename}")


if __name__ == "__main__":
    # Light mode kaomoji
    generate_kaomoji_gif("dancing_kaomoji.gif", bg_color=(241, 241, 238), text_color=(27, 28, 30))
    # Dark mode kaomoji
    generate_kaomoji_gif("dancing_kaomoji_dark.gif", bg_color=(20, 21, 23), text_color=(236, 236, 231))
