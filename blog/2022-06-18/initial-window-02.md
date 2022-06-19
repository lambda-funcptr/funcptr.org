---
title: So you want to make yet another shoddy game engine (2/???)
date: 2022-06-18
tags: Gamedev,Kludge
---

Wow, it's been a while. I've been very busy with work and other matters - but I figured I'd work on this a little to keep this site alive for a bit longer...

Since last post, I've reworked the names and CMake structure of my project, for one, it's no longer called SLE, but Kludge, I've also abandoned the almost-zero-external deps part of it - it was fun, but I don't have the time to throw that many engineering man-hours into a project for so little gain. That being said, I am planning to replace the dependencies with in-house solutions down the line when the opportunity arises.

With that aside, let's get started.

Last time (1.5 years ago) I made a shortlist of what it would take to get a game engine functional:

---

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
    
---

## Looking out of the Window

Since it doesn't do a lot of good to have a game engine without any graphics, we'll start at the top - with graphics...

However, before we get to the nice part of drawing things we actually care about to the menu, we'll have to first start with drawing things that are less interesting to us, in particular, the window.

Let's assume that we're some ~~gullible fool~~ interested developer who wants to use our game engine. They might write something like this to start out:

```C++
int main(int argc, char* argv[]) {
	auto windowInfo = Kludge::WM::WindowInfo{
		.name = "Kludge Demo",
		.width = 800,
		.height = 600
	};
	auto window = Kludge::WM::createWindow(windowInfo);

	sleep(20);

	window.release();
}
```

So here, we're creating a window, sleeping for a bit, and then releasing it - pretty simple stuff.

The minimum we'd need to expose is something like this. I've forward-declared the Window and WindowInfo class in the WMAPI headers since we don't need them to be concrete types yet.

<details open>
<summary>`kludge/WM/WMAPI.hpp`</summary>

```C++
#pragma once

#include <memory>

namespace Kludge::WM {

class Window;
struct WindowInfo;

[[nodiscard]] std::unique_ptr<Window> createWindow(const WindowInfo& info);

}
```
</details>

And here is the corresponding `Window` file. I've defined `Window` as a virtual class in order to use inheritance to introduce polymorphism - I had considered something like CRTP or static metaprogramming, but this is probably the faster and easier way to do it.

<details open>
<summary>`kludge/WM/Window.hpp`</summary>

```C++
#pragma once

#include <string>

namespace Kludge::WM {

struct WindowInfo {
	std::string name;
	std::uint16_t width;
	std::uint16_t height;
};

class Window {
public:
	virtual ~Window() = default;
};

}
```

</details>

This is fine and all, and we've filled out everything the client for this to function, but we'll get nasty linking errors if we were to actually try to build and link.

We still have to implement these functions, specifically `Kludge::WM::createWindow`.

## Enter SDL2

We're going to use SDL2 to make sure this window initialization and teardown goes as smooth as possible, without any of that nastiness that goes around behind the scenes in Xlib or xcb or Win32.

I make the following edits to my cmake file, which tells CMAKE to include and link against the SDL2 package installed to the OS. SDL2 is a bit of a mess to actually compile from scratch - to the point where it's probably easier to build this thing in a docker container than it is to try to do a from-source build.

<details open>
<summary>`CMakeLists.txt`</summary>

```CMake
cmake_minimum_required(VERSION 3.23)
project(kludge)

find_package(SDL2 REQUIRED)

# Snip...

add_library(kludge ${KLUDGE_FILES})

target_include_directories(kludge PRIVATE SDL2)
target_link_libraries(kludge PUBLIC SDL2)
```
</details>

Anyways, after all of that, SDL should be ready for use in the code base.

But before creating a window, SDL needs to be first initialized, this is very simple, I did it in a `Platform.hpp` and `Platform.cpp` file.

<details open>
<summary>`kludge/SPL/Platform.hpp`</summary>

```cpp
#pragma once

namespace Kludge::SPL {
void init();
void quit();
}
```
</details>
<details open>
<summary>`kludge/SPL/Platform.cpp`</summary>

```cpp
namespace Kludge::SPL {

void init() {
  SDL_Init(SDL_INIT_VIDEO 
          | SDL_INIT_AUDIO 
          | SDL_INIT_HAPTIC 
          | SDL_INIT_GAMECONTROLLER);
}

void quit() {
	SDL_Quit();
}

}
```
</details>

Now, onto implementing the Window. In this case, a `SDLWindow` that inherits from `Window` suffices.

<details open>
<summary>`kludge/WM/SDL/SDLWindow.hpp`</summary>

```C++
namespace Kludge::WM::SDL {

class SDLWindow final : public Window {
public:
	explicit SDLWindow(const WindowInfo& info);
	~SDLWindow() final;
private:
	SDL_Window* sdlWindowHandle;
	friend std::unique_ptr<Window> Kludge::WM::createWindow(const WindowInfo&);
};
}
```
</details>

<details open>
<summary>`kludge/WM/SDL/SDLWindow.cpp`</summary>

```C++
namespace Kludge::WM::SDL {
SDLWindow::SDLWindow(const WindowInfo& info) : sdlWindowHandle(nullptr) {
	sdlWindowHandle = SDL_CreateWindow(info.name.c_str(), 
	                                   SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 
	                                   info.width, info.height, 0);
}

SDLWindow::~SDLWindow() {
	SDL_DestroyWindow(sdlWindowHandle);
}
}
```
</details>

And now, to hook it all up:

<details open>
<summary>`kludge/WM/WMAPI.cpp`</summary>

```C++
namespace Kludge::WM {

std::unique_ptr<Window> createWindow(const WindowInfo& info) {
	return std::make_unique<SDL::SDLWindow>(info);
}

}
```
</details>

And voila!
 
![](fig00_first_window.png)

