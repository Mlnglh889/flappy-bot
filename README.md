# Feather Flappy Bot v5

Bot tap untuk game Flappy di quest.feather.games. Input asli (pointerdown); skor tetap disubmit & diverifikasi situs.

## File

- `flappy-userscript.user.js` — dipasang lewat Tampermonkey (Mises/Android). Bot jalan otomatis, ada badge skor.
- `flappy-bot-paste.txt` — versi 1 baris untuk paste ke DevTools Console (desktop/Chrome).
- `flappy-bot.js` — source yang sama, mudah dibaca/diedit.

## Install userscript (HP / Mises)

1. Mises → ikon puzzle → Extensions → Chrome Web Store → pasang Tampermonkey.
2. Buka link raw `flappy-userscript.user.js` di bawah → Tampermonkey → Install.
3. quest.feather.games → login X → rak → GAMES → Play → tap sekali sampai burung terbang.
4. Badge `BOT xx | best xx | 60fps` muncul = jalan.

Raw install:

```
https://raw.githubusercontent.com/Mlnglh889/flappy-bot/main/flappy-userscript.user.js
https://raw.githubusercontent.com/Mlnglh889/flappy-bot/main/flappy-bot.js
https://raw.githubusercontent.com/Mlnglh889/flappy-bot/main/flappy-bot-paste.txt
```

## Pakai di desktop (Console)

1. Buka game, tap sekali sampai burung terbang.
2. F12 → Console → `allow pasting` → Enter.
3. Copy semua isi `flappy-bot-paste.txt` → paste → Enter.
4. Kontrol: `featherFlapBot.status()`, `.stop()`, `.start()`, `.cap = 990`.
