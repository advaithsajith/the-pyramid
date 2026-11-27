# The Pyramid

**Play in the browser:** https://advaithsajith.github.io/the-pyramid/ · **itch.io:** https://tsunamichess.itch.io/the-pyramid

Set in the world of the [Silent Witness Archive](https://advaithsajith.github.io/archive/), an alternate-history fiction by Advaith Sajith.

Six short PS1-style horror levels, one for each tier of Konrad Weissel's Pyramid of Horror from the Silent Witness Archive. You climb from trivial fears at the base to the absence of meaning at the apex.

Open `index.html` through any static server (`python -m http.server 8849`).

## Controls
WASD move, mouse look, Shift run, E use, F torch (candle in Level IV), Esc pause (restart level from there).

## Levels
1. **Trifles** (trivial fears). The power is out and the fuse box is in the cellar. There are shapes in the dark. Walk up to one with the torch and it is a coat.
2. **The Body** (physical threats). A salt marsh with the tide coming in. Follow the lamps along the dyke to the sea wall. The pans are deep mud and flood first.
3. **The Mind** (psychological fear). A corridor that repeats. If anything has changed, go back; if nothing has, go on. Five right in a row.
4. **The Uncanny** (the supernatural). Light five candles from your own. Something that is only a shadow on the floor comes to your light. F pinches the candle out.
5. **Other People**. You have been named Barleyman. The gate opens when someone is crowned. Take the crown yourself at the pyre, or find the man hiding in the shed and point him out.
6. **Nothing** (the absence of meaning). An empty plain and a door that leads to the same plain. E puts a stone down. Stones are kept between playthroughs.

## Cult framing and flashed messages
The climb is presented as a rite of the Fraternité du Témoin silencieux: the Fellowship speaks on each level card, every level is "given up" rather than won, and its seal (eye, barley, pentagon) is painted somewhere in every level. Hooded figures watch from the sea wall in Level II and fill the pews for a few seconds in Level IV.
- **Audio:** a three-voice sung drone (`A.chant`), a frame drum, a four-syllable litany in Level V and a whisper played backwards, all in `js/sfx2.js`. The chant swells on cards and in Levels IV and V and is silent in Level VI until the stone is placed.
- **Flashes:** every 11 to 28 seconds (sooner when afraid) one of three things shows for under a tenth of a second: a line of text, the seal, or a hooded figure standing off to one side. Pause menu has a checkbox to turn them off (`pyr.subl`).

The title screen pyramid fills in as levels are climbed, and any climbed level can be replayed from it.

## Files
Everything specific to the game is in `js/game.js` (one block per level). The rest is the engine shared with Uncounted.
Run `python tools/bump.py` after editing any script.

## Test hooks
`HW.dbg.start(level 0-5)`, `HW.dbg.tp(tx, tz, yaw)`, `HW.dbg.state()`, `HW.dbg.C` (level state), `HW.dbg.useInt(HW.dbg.intr(id))`, `HW.dbg.complete()`, `HW.step(seconds)`.
localStorage keys: `pyr.done` (levels climbed), `pyr.choice` (crown or betray), `pyr.stones`.
