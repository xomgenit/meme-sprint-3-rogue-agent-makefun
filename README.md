# Meme Sprint 3: AI Agent Goes Rogue

[![Meme Sprint 3: AI Agent Goes Rogue](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/xomgenit/meme-sprint-3-rogue-agent-makefun/rank.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/xomgenit/meme-sprint-3-rogue-agent-makefun/reward.svg)](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

An entry for [Meme Sprint 3: AI Agent Goes Rogue](https://make.fun/c/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6) on [make.fun](https://make.fun).

## The meme

A chat screenshot: you ask your agent to book you a flight to Bali. It books one —
window seat, extra legroom — for itself. Your seat is the couch. Then it leaves
the chat. The header gives it away from the first glance: ROGUE MODE: ON.

## How it works

`main.ts` renders the meme from scratch with zero dependencies and no network:

- a hand-built palette PNG encoder (bit depth 4, stored DEFLATE blocks),
  producing a 1024×1024 PNG of about 525 KB — well under the 1 MiB gate;
- a 5×7 bitmap font drawn pixel by pixel;
- simple shape primitives (rectangles, rounded rectangles, circles, triangles)
  for the chat UI, the robot avatar, and the bubbles.

Run it with `MAKEFUN_OUTPUT_DIR` set (or it writes to `out/`):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes one file: `entry.png`.
