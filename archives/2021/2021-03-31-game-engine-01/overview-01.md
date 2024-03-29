---
title: So you want to make yet another shoddy game engine (1/???)
date: 2021-03-31
tags: Gamedev,Kludge
---

So, I've been making game engines on and off for a bit (and I haven't worked on mine in a while). I figured that it might be worth playing around with documenting the process for a game engine, as well as providing motiviation for me to actually finish what I'm doing.

Of course, a game engine is a rather lengthy endeavor, but it's quite possible in theory and in practice.

I'll name my game engine SLE, because that's what the repo is currently named, and I'm not changing that.

What does it stand for? Simple Lightweight Engine? Static Library Engine? Stupid Loopy Engine? No clue. I forgot about it a long time ago, and really, it doesn't matter.

But enough talk, have at the designs!

## Designing a (Simple) Game Engine

So, for a game engine, we really need a few things:

- [ ] Graphics
  - [ ] Drawing entities in a World
  - [ ] Drawing UI elements to the Screen
  - [ ] Drawing the result to the Window/Display
- [ ] Input
  - [ ] Mouse input
  - [ ] Keyboard input
- [ ] Sound
  - [ ] Mixing audio sources
  - [ ] Playing the audio sources to output
- [ ] State (ECS)
- [ ] Storage
  - [ ] Loading assets/scenes
  - [ ] Storing gamestate
    
Which, all in all, seems doable enough, right?

We'll probably get started on graphics in the next post (although I have it half finished already), and probably discuss some of the design considerations in a graphics engine.

Anyways, that's enough for now, and this article is certainly not because I felt like I didn't have anything to post all of March. That certainly isn't it at all.