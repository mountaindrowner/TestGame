"""Regenerate every PNG asset. Run: `npm run assets` (or `python3 tools/gen_all.py`)."""
import pack_player
import pack_enemy
import pack_mirror
import gen_tileset
import gen_tileset_mirrors
import gen_backgrounds
import gen_backgrounds_mirrors
import gen_decor
import gen_props
import gen_environment
import gen_environment_mirrors

if __name__ == "__main__":
    print("Generating REPENTANCE assets...")
    print("[player] (packed from PixelLab art_src)")
    pack_player.build()
    print("[enemy] (packed from PixelLab art_src)")
    pack_enemy.build()
    print("[mirror decor] (PixelLab pane)")
    pack_mirror.build()
    print("[tileset]")
    gen_tileset.build()
    gen_tileset_mirrors.build()
    print("[backgrounds]")
    gen_backgrounds.build()
    gen_backgrounds_mirrors.build()
    print("[decor]")
    gen_decor.build()
    print("[props]")
    gen_props.build()
    print("[environment decor]")
    gen_environment.build()
    gen_environment_mirrors.build()
    print("Done.")
