CHANGELOG
=========

## 0.0.12 (pre-release)

## 0.0.11 (2017-01-27, alpha release)

#### fixes:
 - fixed bugs while jumping multiple pages

## 0.0.10 (2017-01-27, alpha release)

#### fixes:
 - fixed scroll event handler bugs
 - fixed wonky snap on the first/last pages

## 0.0.9 (2017-01-23, alpha release)

#### fixes:
 - fixed event handler bugs

## 0.0.8 (2017-01-23, alpha release)

#### updates:
 - updated to cancel multiple wheel events coming in a row

## 0.0.7 (2017-01-23, alpha release)

#### features:
 - added touch events
 - added `pauseSnap` option

#### fixes:
 - fixed mousewheel and keydown eventlisteners behavior at outbounds

## 0.0.6 (2017-01-20, alpha release)

#### features:
 - added `duration (milliseconds)` settings in constructor arguments
 - added `enableStash: true/false` settings in constructor arguments to hold a transition event until `PPSP.pop()` is called
 - added `data-ppsp-stash` DOM atribute to enable stash on each individual DOM
 - added `PPSP.stash()` and `PPSP.pop()`
 - added `lockViewport: true/false` settings in constructor arguments to allow/limit to move out of the first and last target edges

## 0.0.5 (2017-01-20, alpha release)

#### features:
 - added `inTransit` variable to track if `PPSP.goto()` is working

#### updates:
 - updated to pass `target_index` to onLeave callback as the first argument

## 0.0.4 (2017-01-20, alpha release)

#### fixes:
 - fixed SlideScroll commonJS module name to `slide-scroll`

## 0.0.3 (2017-01-20, alpha release)

#### features:
 - added `onLeave` and `afterLoad` settings when initializing 

## 0.0.2 (2017-01-20, alpha release)

#### features:
 - added `PPSP.snap()`, a function to snap to the closest target DOM
 - added `PPSP.refresh()`, a function to refresh and reload the selector DOMs
 - added mouse wheel navigation
 - added adjusting position on resize

## 0.0.1 (2017-01-20, alpha release)

#### features:
 - added `PPSP.prev()`, `PPSP.next()`, `PPSP.goto()` method
 - added keyboard navigation
 - added section skipping functionality using `data-ppsp-skip` DOM attribute
 - added section skipping functionality when target DOM is `display: none`

## 0.0.0 (boilerplate)

#### features:
 - added bolierplate files

#### updates:

#### fixes:
