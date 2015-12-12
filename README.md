# Visual History

Modern browsers lose rich information when they compress browsing history into a linear stack, which makes backtracking from a forrest of links surprisingly difficult. We can do better.

Visual History is a Chrome extension that delinearizes your browsing history with a richer alternative to the Back and Forward buttons. Instead of a stack of previously visited destinations, Visual History maintains the forest of trees that represent each tab’s path around the internet, and lets you easily backtrack to any site you've recently visited. 

![](/screenshots/0.png)

![](/screenshots/1.png)

[This solves an ancient problem with Wikipedia](https://xkcd.com/214/)

![](/screenshots/3.png)

Routes that normally have to be manually re-traced by users, like jumping between search results or forum posts, can now be intuitively and quickly directed without revisiting the parent page. 

![](/screenshots/2.png)

## Usage

Navigate around the graph by clicking the graph icon in the toolbar, or by using Ctrl + arrow key shortcuts. Whatever node is selected when Ctrl is released will be navigated to.

## Credits
 - [D3.js](http://d3js.org/)
 - [Color Thief](https://github.com/lokesh/color-thief/)
