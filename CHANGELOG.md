CHANGELOG
=========

## 0.2.3 (pre-release)

## 0.2.2 (2017-03-23, beta release)

#### fixes:
 - fixed snap not occurring when being scrolled into the first slide from outside.

## 0.2.1 (2017-03-16, beta release)

#### fixes:
 - reverted back to old goto worker function. actually it worked fine.

## 0.2.0 (2017-03-16, beta release)

#### updates:
 - enhanced most calculations for edge cases.
 - now advancing to header/footer area (if exists) with snap motions when using mouse or touch. no header/footer snaps for keyboard.

## 0.1.8 (2017-03-14, beta release)

#### fixes:
 - fixed multiple touch input bug.

## 0.1.7 (2017-03-10, beta release)

#### fixes:
 - fixed `PPSP.getPrevIndex()` and `PPSP.getNextIndex()` return bug.

## 0.1.6 (2017-03-10, beta release)

#### features:
 - added `PPSP.getPrevIndex()` and `PPSP.getNextIndex()` as public methods.

## 0.1.5 (2017-03-09, beta release)

#### fixes:
 - fixed wrong currentIndex number in afterLoad() callback.

## 0.1.4 (2017-03-09, beta release)

#### updates:
 - onLeave() and afterLoad() callback functions now have direction as their second default argument.

## 0.1.3 (2017-03-02, beta release)

#### updates:
 - bumped up dependency of slide-scroll to 0.1.1

## 0.1.2 (2017-03-02, beta release)

#### updates:
 - bumped up dependency of slide-scroll to 0.1.0

## 0.1.1 (2017-03-02, beta release)

#### updates:
 - removed legacy code and console.logs

## 0.1.0 (2017-03-02, beta release)

#### updates:
 - applied QuietWheel library to handle wheel events

## 0.0.17 (2017-02-02, alpha release)

#### updates:
 - added getClosestAvailableIndex() for internal calcs

#### fixes:
 - fixed goto() bug when target is skipping (stop jumping!)

## 0.0.16 (2017-02-02, alpha release)

#### updates:
 - added wheel timeout holder to prevent overscroll

## 0.0.15 (2017-01-31, alpha release)

#### fixes:
 - fixed stash issue while onKeydown(): handling when stashing the section 0.
 - revert back from ‘updated to clear PPSP._wheel.event_arr when _gotoWorker() is called.’ due to slippery scroll.

## 0.0.14 (2017-01-31, alpha release)

#### updates:
 - adjust onWheel()
 - updated to clear PPSP._wheel.event_arr when _gotoWorker() is called.

## 0.0.13 (2017-01-31, alpha release)

#### updates:
 - added horizontal scroll detect to prevent double swipe

#### fixes:
 - fixed _gotoWorker() bug

## 0.0.12 (2017-01-31, alpha release)

#### fixes:
 - fixed getClosestIndexFromViewport() bug

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
