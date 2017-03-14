// Supports modern browsers & IE10+

;(function (global, factory) {
	'use strict';
	if(typeof define === 'function' && define.amd) {
		define(['SlideScroll', 'QuietWheel'], function(SlideScroll, QuietWheel){
			return (global.PPSP = factory(SlideScroll, QuietWheel));
		});
	} else if(typeof module === 'object' && module.exports) {
		module.exports = (global.PPSP = factory(require('slide-scroll'), require('quietwheel')));
	} else {
		global.PPSP = factory(global.SlideScroll, global.QuietWheel);
	}
}(typeof window !== 'undefined' ? window : this, function(SlideScroll, QuietWheel) {
	'use strict';
	var root;
	function PPSP(args){
		root = this;
		args = args || {};
		
		root.selector = args.selector || 'section';
		root.duration = args.duration || 700;
		root.enableStash = args.enableStash || false;
		root.lockViewport = args.lockViewport || false;
		root.onLeave = args.onLeave;
		root.afterLoad = args.afterLoad;
		root.onStash = args.onStash;
		root.afterStash = args.afterStash;

		root.el = document.querySelectorAll(root.selector);
		root.currentIndex = 0;
		root.touchThreshold = args.touchThreshold || 50;
		root.inTransit = false;
		root.pauseSnap = false;

		root._ss = new SlideScroll({duration:args.duration});
		root._stash_data = []; // arguments for PPSP.goto() === [index, callback, callback_args]
		root._touch_start;
		// After a touch input has been made, check if the first touchmove event is fired.
		// If so, prevent all following touchmove events so that it cancels multiple scrolls.
		root._isTouchMoveInitiated = false
		root._wheel = {
			event_arr: [],
			timeout_holder: null // Introducing timeout_holder to prevent overscroll as of v0.0.16
		};

		QuietWheel(onQuietWheel,[],function(){
			return getBoundaryStatus() === 'in' ? false : true;
		});
		window.addEventListener('scroll', onScroll);
		window.addEventListener('keydown', onKeydown); 
		window.addEventListener('touchstart', onTouchstart);
		window.addEventListener('touchmove', onTouchmove);
		window.addEventListener('touchend', onTouchend);
		window.addEventListener('resize', onResize);
	};

	function isSkipping(idx){
		var _t = root.el[idx];
		return _t.hasAttribute('data-ppsp-skip') ||
			   window.getComputedStyle(_t,null).getPropertyValue('display') === 'none' ? true : false;
	}

	function isStashEnabled(idx){
		var _t = root.el[idx];
		return _t.hasAttribute('data-ppsp-stash') || root.enableStash ? true : false;
	}

	function getBoundaryStatus(){
		var _status;
		if (root.el[0].getBoundingClientRect().top > 0) {
			_status = 'outTop';
		} else {
			if (root.el[root.el.length-1].getBoundingClientRect().top < 0) _status = 'outBottom';
			else _status = 'in';
		}
		return _status;
	}

	function _getPrevIndex(origin_index){
		origin_index = origin_index || root.currentIndex;
		var target_index = origin_index - 1;

		if (target_index > 0)
			return isSkipping(target_index) ? _getPrevIndex(target_index) : target_index;

		return 0;
	}

	/**
	 * _getNextIndex(origin_index)
	 *
	 * Get next page index from input page index.
	 */
	function _getNextIndex(origin_index){
		origin_index = origin_index || root.currentIndex;
		var target_index = origin_index + 1;

		if (target_index < root.el.length - 1)
			return isSkipping(target_index) ? _getNextIndex(target_index) : target_index;

		return root.el.length - 1;
	}

	function getClosestIndexFromViewport(){
		var closest_index = 0,
			closest_index_top = root.el[0].getBoundingClientRect().top;
		for (var i = 1; i < root.el.length; i++) {
			if (!isSkipping(i)) {
				var new_top = root.el[i].getBoundingClientRect().top;
				if (Math.abs(closest_index_top) > Math.abs(new_top)) {
					closest_index = i;
					closest_index_top = new_top;
				}
				else {
					if (isSkipping(closest_index)) {
						var prev_index = _getPrevIndex(closest_index),
							next_index = _getNextIndex(closest_index);

						var prev_top = root.el[prev_index].getBoundingClientRect().top,
							next_top = root.el[next_index].getBoundingClientRect().top;

						if (Math.abs(prev_top) < Math.abs(next_top)) closest_index = prev_index;
						else closest_index = next_index;
					}
					break;	
				}
			}
		}
		return closest_index;
	}

	/**
	 * getClosestAvailableIndex(idx)
	 *
	 * Get the closest available page index from input.
	 * Keep adding +1 or -1 if the next page is skipping.
	 */
	function getClosestAvailableIndex(idx) {
		var dir = root.currentIndex - idx < 0 ? 'down' : 'up';
		var target_index = idx;
		if (isSkipping(target_index)) {
			target_index = dir === 'up' ? _getPrevIndex(target_index) : _getNextIndex(target_index);
		}
		return target_index;
	}

	function getEventDeltaAverage(event_arr, number){
		var sum = 0;
		//taking `number` elements from the end to make the average, if there are not enought, 1
		var lastElements = event_arr.slice(Math.max(event_arr.length - number, 1));
		for(var i = 0; i < lastElements.length; i++){
			sum += Math.abs(lastElements[i].deltaY);
		}
		return Math.ceil(sum/number);
	}

	PPSP.prototype.getPrevIndex = function(origin_index){
		return _getPrevIndex(origin_index);
	};

	PPSP.prototype.getNextIndex = function(origin_index){
		return _getNextIndex(origin_index);
	};

	PPSP.prototype.prev = function(callback, callback_args){
		root.goto(_getPrevIndex(), callback, callback_args);
	};

	PPSP.prototype.next = function(callback, callback_args){
		root.goto(_getNextIndex(), callback, callback_args);
	};

	PPSP.prototype.goto = function(target_index, callback, callback_args){
		if (!root.inTransit) {
			root.inTransit = true;
			_gotoWorker(getClosestAvailableIndex(target_index), callback, callback_args);
		}
	};

	/**
	 * _gotoWorker(target_index, callback, callback_args)
	 * 
	 * @param {integer} target_index: target page index whose availability is already confirmed.
	 */
	function _gotoWorker(target_index, callback, callback_args) {

		if (root.currentIndex !== target_index) {

			var dir = root.currentIndex - target_index < 0 ? 'down' : 'up';
			root._ss.duration = Math.abs(root.currentIndex - target_index) > 1 ? 0 : root.duration;

			// While target_index means the final destination of a user's current interaction,
			// current_target is one of many pages passing by to get to target_index.
			// For example, to go from page 5 to 8, PPSP goes through page 6 and 7, and then finally get to page 8.
			// This behavior is to make sure all callback events are timely called.
			// current_target keeps changing to 6, 7, and lastly 8, according to the current progress.
			var current_target = dir === 'up' ? _getPrevIndex() : _getNextIndex();

			var target_px = window.pageYOffset + root.el[current_target].getBoundingClientRect().top;
			if (root.onLeave) root.onLeave.call(root, current_target, dir);
			root._ss.to(target_px, function(){
				// root.currentIndex = root.currentIndex;
				root.cancelStash();
				root.currentIndex = current_target;
				if (root.afterLoad) root.afterLoad.call(root, current_target, dir);
				_gotoWorker(target_index, callback, callback_args);
			});
		} else {
			if (callback_args && callback_args.constructor !== Array) callback_args = [callback_args];
			if (callback) callback.apply(null,callback_args);
			root.inTransit = false;
		}
	}

	PPSP.prototype.snap = function(){
		if (!root.inTransit && !root.pauseSnap && root.el[root.currentIndex].getBoundingClientRect().top !== 0)
			root.goto(getClosestIndexFromViewport());
	};

	PPSP.prototype.refresh = function(selector){
		selector = selector || root.selector;
		root.el = document.querySelectorAll(selector);
		root.snap();
	};

	PPSP.prototype.stash = function(idx, callback, callback_args){
		if (!root.inTransit && root._stash_data.length === 0) {
			var _stash_data_arr = [idx, callback, callback_args];
			if (root._stash_data[0] !== _stash_data_arr[0] || root._stash_data[1] !== _stash_data_arr[1] || root._stash_data[2] !== _stash_data_arr[2]) {
				if (root.onStash) root.onStash.call(root, _stash_data_arr);
				root._stash_data = _stash_data_arr;
				if (root.afterStash) root.afterStash.call(root, _stash_data_arr);
			}
		}
	};

	PPSP.prototype.pop = function(){
		root.goto.apply(root, root._stash_data);
	};

	PPSP.prototype.cancelStash = function(){
		root._stash_data = [];
	};

	function onQuietWheel(e){

		if (getBoundaryStatus() === 'in') {

			if (isStashEnabled(root.currentIndex)) {
				e.originalWheelEvent.preventDefault();
				if (e.direction === 'up') root.stash(_getPrevIndex()); //moving up
				else root.stash(_getNextIndex()); // moving down
			} else {
				if (e.direction === 'up') {
					if (root.currentIndex > 0) e.originalWheelEvent.preventDefault();
					root.prev(); //moving up
				} else {
					if (root.currentIndex < root.el.length-1) e.originalWheelEvent.preventDefault();
					root.next(); // moving down
				}
			}

		}
	}

	function onKeydown(e){

		if (getBoundaryStatus() === 'in') {
			if (isStashEnabled(root.currentIndex)) {
				if (e.key === 'ArrowDown') {
					var ni = _getNextIndex();
					if (root.currentIndex !== ni) {
						e.preventDefault();
						root.stash(_getNextIndex());
					}
				} else if (e.key === 'ArrowUp') {
					var pi = _getPrevIndex();
					if (root.currentIndex !== pi) {
						e.preventDefault();
						root.stash(_getPrevIndex());
					}
				} else if (e.key === ' ') {
					e.preventDefault();
					if (e.shiftKey) root.stash(_getPrevIndex());
					else root.stash(_getNextIndex());
				} else {}
			} else {
				if (e.key === 'ArrowDown') {
					root.next();
				} else if (e.key === 'ArrowUp') {
					root.prev();
				} else if (e.key === ' ') {
					e.preventDefault();
					if (e.shiftKey) root.prev();
					else root.next();
				} else {}
			}
		} else {
			//TODO: actions at outbounds
		}
	}

	function onTouchstart(e){
		if (getBoundaryStatus() === 'in' && root.el[root.el.length-1].getBoundingClientRect().top > 0) {
			e.preventDefault();
		}
		root._touch_start = e.touches[0].clientY;
		root._isTouchMoveInitiated = false;
	}

	function onTouchmove(e){ 
		var _touch_move = e.touches[0].clientY;
		if (Math.abs(root._touch_start - _touch_move) > root.touchThreshold) {
			if (getBoundaryStatus() === 'in') {

				if (!root._isTouchMoveInitiated) {
					root._isTouchMoveInitiated = true;
					e.preventDefault();
					if (isStashEnabled(root.currentIndex)) {
						// swipe down / scroll up
						if (root._touch_start - _touch_move < 0) root.stash(_getPrevIndex());
						// swipe up / scroll down
						else root.stash(_getNextIndex());
					} else {
						// swipe up / scroll down
						if (root._touch_start - _touch_move < 0) root.prev();
						// swipe down / scroll up
						else root.next();
					}
				} else {
					e.preventDefault();
				}

				
			} else {
				//TODO: actions at outbounds
			}
		}
	}

	function onTouchend(e){
		
	};

	function onScroll(e){
		if (root.lockViewport) {
			window.setTimeout(root.snap,500);
		} else {
			if (!root.inTransit && getBoundaryStatus() === 'in') window.setTimeout(root.snap,500);
		}
	}

	function onResize(e){
		window.setTimeout(root.snap,500);
	}

	return PPSP;
}));
