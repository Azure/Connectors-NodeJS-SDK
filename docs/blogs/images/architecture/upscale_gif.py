"""Upscale animated GIFs with high-quality resampling so that downstream
CMS re-encoding (e.g. Microsoft Community Hub / Khoros) has more source
detail to work with, instead of upscaling a low-res source and amplifying
compression artifacts.

Usage:
    python upscale_gif.py <input.gif> <output.gif> [scale]
"""

import sys
from pathlib import Path

from PIL import Image, ImageSequence


def upscale_gif(input_path: Path, output_path: Path, scale: float = 3.0) -> None:
    source = Image.open(input_path)

    frames = []
    durations = []
    for frame in ImageSequence.Iterator(source):
        frame = frame.convert("RGBA")
        new_size = (round(frame.width * scale), round(frame.height * scale))
        resized = frame.resize(new_size, Image.LANCZOS)
        frames.append(resized)
        durations.append(frame.info.get("duration", 100))

    # Build one shared 256-color palette from every frame (instead of
    # quantizing each frame independently) so flat UI/diagram colors stay
    # stable across frames. No dithering: these are screenshots/diagrams
    # with flat color regions, not photos, so dithering only adds noise
    # that gets amplified by the CMS's own re-compression pass.
    # Downsample each frame before stacking so the palette strip doesn't
    # balloon in memory at high scale factors; the palette only needs
    # representative colors, not full resolution.
    thumb_size = (max(1, frames[0].width // 4), max(1, frames[0].height // 4))
    thumbnails = [frame.resize(thumb_size, Image.BILINEAR) for frame in frames]
    strip_width = sum(thumb.width for thumb in thumbnails)
    palette_source = Image.new("RGBA", (strip_width, thumb_size[1]))
    x_offset = 0
    for thumb in thumbnails:
        palette_source.paste(thumb, (x_offset, 0))
        x_offset += thumb.width
    shared_palette = palette_source.convert("RGB").quantize(
        colors=256, method=Image.Quantize.FASTOCTREE
    )

    quantized = [
        frame.convert("RGB").quantize(colors=256, palette=shared_palette, dither=Image.NONE)
        for frame in frames
    ]

    quantized[0].save(
        output_path,
        save_all=True,
        append_images=quantized[1:],
        duration=durations,
        loop=source.info.get("loop", 0),
        disposal=2,
        optimize=False,
    )


if __name__ == "__main__":
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    scale_factor = float(sys.argv[3]) if len(sys.argv) > 3 else 3.0
    upscale_gif(input_file, output_file, scale_factor)
    print(f"Wrote {output_file} ({output_file.stat().st_size / 1024:.0f} KB)")
