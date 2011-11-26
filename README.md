A simple Pong app for webOS smartphones. It is based on drawing everything on screen to a canvas element. Since this application served for a me as a learning project on the HTML canvas element and game development it is far from perfect. But apart from somewhat less than perfect accelerometer data it works as intended.

###Usage
Tilt your webOS device to move the paddle and get the ball behind the opponent's paddle. This gives you points, just like in 1972 :) One alternative game mode is available: last paddle standing, in which you lose parts of your paddle if you fail to return the ball. The last one to have a remaining paddle wins.

There's no multiplayer support, and the computer AI isn't perfect either. Or actually it is, as at the highest level it becomes impossible to win.

###Installation
One way is to get the source code and use the SDK tools to package it and then install it onto your webOS device. I have no plans to release it beyond its code here on GitHub, enough Pong-like games available as it is.

###License
Source code is available under a Creative Commons SA-BY-NC license, so you are free to do with it as you desire. It would be kind (but not necessary) to let me know.

####Changelog

#####0.5.0
* First working release.

####Issues

* Accelerometer data seems a bit jittery and/or delayed which causes trouble when playing.