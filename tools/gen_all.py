"""Regenerate every PNG asset. Run: `npm run assets` (or `python3 tools/gen_all.py`)."""
import gen_player
import gen_enemy
import gen_tileset
import gen_backgrounds
import gen_decor

if __name__ == "__main__":
    print("Generating REPENTANCE assets...")
    print("[player]")
    gen_player.build()
    print("[enemy]")
    gen_enemy.build()
    print("[tileset]")
    gen_tileset.build()
    print("[backgrounds]")
    gen_backgrounds.build()
    print("[decor]")
    gen_decor.build()
    print("Done.")
