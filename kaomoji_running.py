from PIL import Image, ImageDraw, ImageFont
import math

W, H = 480, 200
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 72)

# the two poses: arms flip sides
faces = ["ᕕ( ᐛ )ᕗ", "ᕗ( ᐛ )ᕕ"]

frames = []
N = 24  # number of frames in one full loop

for i in range(N):
    img = Image.new("RGB", (W, H), (250, 248, 242))
    d = ImageDraw.Draw(img)

    # swap pose every 3 frames
    s = faces[(i // 3) % 2]

    # measure the text so we can center it
    bb = d.textbbox((0, 0), s, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]

    # horizontal sway: one smooth sine wave per loop
    x = (W - tw) / 2 - bb[0] + 22 * math.sin(2 * math.pi * i / N)

    # vertical bounce: two hops per loop (abs of sine = bouncing ball shape)
    y = (H - th) / 2 - bb[1] - 18 * abs(math.sin(2 * math.pi * i / (N / 2))) + 10

    d.text((x, y), s, font=font, fill=(30, 30, 30))
    frames.append(img)

frames[0].save(
    "dancing_kaomoji.gif",
    save_all=True,
    append_images=frames[1:],
    duration=90,   # ms per frame
    loop=0,        # loop forever
)