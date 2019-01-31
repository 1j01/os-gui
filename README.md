# os-gui.js

A library for imitating operating system graphical user interfaces on the web

Specifically, Windows 98 - for now at least; it could be expanded in the future

<!-- Check out 98 and jspaint (and sound-recorder and notepad and minesweeper) and maybe mos and maybe pbp2d... -->

**Important**: This project is pre-alpha and not really "quality" yet.


## Features

- Menu bars, with support for checkbox items, disabled states, and at least partial support for submenus

- Windows which you can drag around

- Button styles (Note: currently breaking accessibility by removing `outline` focus styles!)

- Scrollbar styles, webkit-specific (in the future there could be a custom scrollbar based on a nonintrusive scrollbar library, or styles *supporting* a library, where you're expected to use the library directly)


## Demo

See [a demo online here](https://1j01.github.io/os-gui/demo/)

### See also

- [98](https://github.com/1j01/98)


## Requirements

This library currently requires [jQuery](https://jquery.com/), or, almost certainly it would work with [zepto.js](http://zeptojs.com/) as well.


## Setup

The library is not yet provided as a bundle.

You have to include `$MenuBar.js` or `$Window.js` specifically, as required,
along with stylesheets for layout and a theme, `layout.css` and `theme/windows-98.css`

You can download the repo contents as a ZIP file in the "Clone or download" dropdown on GitHub.

In `<head>`:
```html
<link href="os-gui/layout.css" rel="stylesheet" type="text/css">
<link href="os-gui/theme/windows-98.css" rel="stylesheet" type="text/css">
```

In `<head>` or `<body>`:
```html
<script src="lib/jquery.js"></script>
<script src="os-gui/$MenuBar.js"></script>
<script src="os-gui/$Window.js"></script>
```


## API

The API is not versioned using semver yet, but it should be once a version 1.0 is released.

### Button styles

Button styles are applied to `button` elements globally.
And to reset it, you have to get rid of the psuedo element `::after` as well.

You can have the depressed (held down) style stay using `.selected`

The non-pressed state is also applied to `.button-like-border`; in the future this may be called `.outset-border` or similar.

### Scrollbar styles

Scrollbar styles are applied globally, but they have a `-webkit-` prefix, so they'll only work in "webkit-based" browsers, generally, like Chrome, Safari, and Opera.

Can be overriden with `::-webkit-scrollbar` and related selectors (but not easily reset to the browser default, unless `-webkit-appearance: scrollbar` works)

### Selection styles

Selection styles are applied globally.

Can be overriden with `::selection` (but not easily reset to the browser default)

### `$MenuBar(menus)`

Creates a menu bar component.

`menus` should be an object holding arrays of [menu item specifications](#menu-item-specification), keyed by menu button name.

Returns a jQuery object, which you should then append to the DOM where you want it.

#### Event: `info`

Can be used to implement a status bar.
A description is provided when rolling over menu items that specify a `description`, via an extra parameter to the event handler. For example:

```js
$menubar.on("info", (event, description)=> {
	$status.text(description);
});
```

#### Event: `default-info`

Should be used to reset a status bar, if present, to blank or a default message.

```js
$menubar.on("default-info", ()=> {
	$status.text("");
	// or
	$status.text("For Help, click Help Topics on the Help Menu.");
	// like in MS Paint (and JS Paint)
	// or perhaps even
	$status.html("For Help, <a href='docs'>click here</a>");
	// Note that a link could only work for the default text;
	// for menu item descriptions the message in the status bar is transient;
	// you wouldn't be able to get to it to click on it.
});
```

### Menu item specification

Menu item specifications are either `$MenuBar.DIVIDER`, a constant indicating a horizontal rule, or an object with the following properties:

* `item`: a label for the item
* `shortcut` (optional): a keyboard shortcut for the item, like "Ctrl+A"; this is not functionally implemented, you'll need to listen for the shortcut yourself!
* `action` (optional): a function to execute when the item is clicked (can only specify either `action` or `checkbox)
* `checkbox` (optional): an object specifying that this item should behave as a checkbox.
Property `check` of this object should be a function that *checks* if the checkbox should be checked or not and returns `true` for checked and `false` for unchecked. What a cutesy name; it should be changed; `isChecked` would be better.
Property `toggle` should be a function that toggles the state of the option, however you're storing it; called when clicked.
* `enabled` (optional): can be `false` to unconditionally disable the item, or a function that determines whether the item should be enabled, returning `true` for enabled, `false` for disabled.
* `submenu` (optional): an array of menu item specifications to create a submenu
* `description`: for implementing a status bar; an event is emitted, called `info`, when rolling over the item with this description, provided as a jQuery "extra parameter"

### Menu hotkeys

In menu and menu item names, you can place `&` before letters to indicate menu-level-scoped hotkeys (which should be unique to that level of the menu, i.e. the bar or  the contents of a menu or submenu).

But these are **not functionally implemented!**

### `$Window(options)`

Creates a window component that can be dragged around and such, brought to the front when clicked\*

`options.title`: Shortcut to set the window title initially.

`options.icon`: Sets the icon of the window, assuming a global `TITLEBAR_ICON_SIZE` (which should generally be 16) and a global `$Icon` function which takes an icon identifier and size and returns an `img` (or other image-like element).

```js
// var DESKTOP_ICON_SIZE = 32;
// var TASKBAR_ICON_SIZE = 16;
var TITLEBAR_ICON_SIZE = 16; // required global (if using options.icon)

function getIconPath(name, size){
	return "/images/icons/" + name + "-" + size + "x" + size + ".png";
}

function $Icon(name, size){ // required global (if using options.icon)
	var $img = $("<img class='icon'/>");
	$img.attr({
		draggable: false,
		src: getIconPath(name, size),
		width: size,
		height: size,
	});
	return $img;
}
```

\*Iframes require special handling. There's an `$IframeWindow` helper in [98](https://github.com/1j01/98), but a better approach would use composition rather than inheritance.
(You could want multiple iframes in a window, or just an iframe with other content around it, maybe an iframe that sometimes exists or not!)

Returns a jQuery object with additional methods and properties:

#### `title(text)`

Sets the title, or if `text` isn't passed, returns the current title of the window.

#### `close()`

Closes the window.

#### `center()`

Centers the window in the page.
You should call this after creating the contents of the window, and either rendering all of it, or determining its size.

#### `applyBounds()`

Fits the window within the page if it's partially offscreen.
(Doesn't resize the window if it's too large; it'll go off the right and bottom of the screen.)

#### `bringToFront()`

Brings the window to the front by setting its `z-index` to larger than any `z-index` yet used by the windowing system.

#### `$Button(text, action)`

Creates a button in the window's content area.

#### `$content`

Where you can append contents to the window.

#### `$titlebar`

The titlebar of the window, including the title, window buttons, and possibly an icon.

#### `$title`

The title portion of the titlebar.

#### `$x`

The close button.

#### `closed`

Whether the window has been closed.

#### Event: `close`

Can be used to prevent closing a window (with `event.preventDefault()`, or just to know when it closed.


## Roadmap

- Publish a 0.x version to npm

- Use classes instead of weird psuedo-class functions that return jQuery objects with added methods

- Use a bundler

- Rewrite styles with a CSS preprocessor
	- Probably use SVG `background-image`s rather than crazy `box-shadow` + psuedo-element borders
	- Use CSS variables
	- (I'm probably gonna want to use [PostCSS](http://postcss.org/))

- Accept Windows theme files at runtime, using CSS variables to apply them

- Have menus pop up to the right/left or downwards/upwards based on if there's available space or not

- API to create context menus (using the same code as for menu popups from the menu bar)


## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT), see [LICENSE](LICENSE) for details.

## Development

`npm run live-server` to open a development server, and concurrently (in a separate terminal),

`npm run watch` to watch source files and recompile on changes.

Close the server to install/update dependencies (or you'll run into EPERM issues).
