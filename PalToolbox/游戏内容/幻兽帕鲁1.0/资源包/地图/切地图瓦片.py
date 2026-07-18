import os, sys
from PIL import Image

MAPS = {
    'WorldMap': 'T_WorldMap.png',
    'TreeMap': 'T_TreeMap.png'
}

TILE_SIZE = 512
ZOOM_LEVELS = [
    (1, 2),
    (2, 4),
    (3, 8),
    (4, 16)
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

for map_id, input_file in MAPS.items():
    input_path = os.path.join(SCRIPT_DIR, input_file)
    print(f'读取 {input_file}...')
    source = Image.open(input_path)
    w, h = source.size
    print(f'  尺寸: {w}x{h}')

    for zoom, tiles_per_dim in ZOOM_LEVELS:
        out_dir = os.path.join(SCRIPT_DIR, '瓦片', map_id)
        os.makedirs(out_dir, exist_ok=True)

        tile_w = w // tiles_per_dim
        tile_h = h // tiles_per_dim
        thumb_size = tile_w * tiles_per_dim

        if zoom == 4:
            img = source
        else:
            img = source.resize((thumb_size, thumb_size), Image.LANCZOS)

        for ty in range(tiles_per_dim):
            for tx in range(tiles_per_dim):
                left = tx * tile_w
                upper = ty * tile_h
                tile = img.crop((left, upper, left + tile_w, upper + tile_h))
                tile = tile.resize((TILE_SIZE, TILE_SIZE), Image.LANCZOS)
                out_name = f'z{zoom}x{tx}y{ty}.webp'
                out_path = os.path.join(out_dir, out_name)
                tile.save(out_path, 'WEBP', quality=85, method=6)
                tile.close()
                progress = (ty * tiles_per_dim + tx + 1) / (tiles_per_dim * tiles_per_dim) * 100
                sys.stdout.write(f'\r  z{zoom}: {ty * tiles_per_dim + tx + 1}/{tiles_per_dim * tiles_per_dim} ({progress:.0f}%)')
                sys.stdout.flush()

        if zoom < 4:
            img.close()
        print(f'\r  z{zoom}: {tiles_per_dim * tiles_per_dim}/{tiles_per_dim * tiles_per_dim} (100%)')

    source.close()
    print(f'完成 {map_id}')

print('全部完成')
