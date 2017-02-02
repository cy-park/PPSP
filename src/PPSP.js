// Supports modern browsers & IE10+

;(function (global, factory) {
	'use strict';
	if(typeof define === 'function' && define.amd) {
		define(['SlideScroll'], function(SlideScroll){
			return (global.PPSP = factory(SlideScroll));
		});
	} else if(typeof module === 'object' && module.exports) {
		module.exports = (global.PPSP = factory(require('slide-scroll')));
	} else {
		global.PPSP = factory(global.SlideScroll);
	}
}(typeof window !== 'undefined' ? window : this, function(SlideScroll) {
	'use strict';
	var root;
	function PPSP(args){
		root = this;
		args = args || {};
		
		root.selector = args.selector || 'section';
		root.duration = args.duration || 400;
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
		root._wheel = {
			event_arr: []
		};

		window.addEventListener('wheel', onWheel);
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
		} else { // if (root.el[0].getBoundingClientRect().top <= 0)
			if (root.el[root.el.length-1].getBoundingClientRect().top < 0) _status = 'outBottom';
			else _status = 'in';
		}
		return _status;
	}

	function getPrevIndex(origin_index){
		origin_index = origin_index || root.currentIndex;
		var target_index = origin_index - 1;

		if (target_index > 0)
			return isSkipping(target_index) ? getPrevIndex(target_index) : target_index;

		return 0;
	}

	function getNextIndex(origin_index){
		origin_index = origin_index || root.currentIndex;
		var target_index = origin_index + 1;

		if (target_index < root.el.length - 1)
			return isSkipping(target_index) ? getNextIndex(target_index) : target_index;

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
						var prev_index = getPrevIndex(closest_index),
							next_index = getNextIndex(closest_index);

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

	function getClosestAvailableIndex(idx) {
		var dir = root.currentIndex - idx < 0 ? 'down' : 'up';
		var target_index = idx;
		if (isSkipping(target_index)) {
			target_index = dir === 'up' ? getPrevIndex(target_index) : getNextIndex(target_index);
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

	PPSP.prototype.prev = function(callback, callback_args){
		root.goto(getPrevIndex(), callback, callback_args);
	};

	PPSP.prototype.next = function(callback, callback_args){
		root.goto(getNextIndex(), callback, callback_args);
	};

	PPSP.prototype.goto = function(target_index, callback, callback_args){
		if (!root.inTransit) {
			root.inTransit = true;
			_gotoWorker(getClosestAvailableIndex(target_index), callback, callback_args);
		}
	};

	function _gotoWorker(target_index, callback, callback_args) {

		if (root.currentIndex !== target_index) {

			var dir = root.currentIndex - target_index < 0 ? 'down' : 'up';
			root._ss.duration = Math.abs(root.currentIndex - target_index) > 1 ? 0 : root.duration;

			var current_target = dir === 'up' ? getPrevIndex() : getNextIndex();

			var target_px = window.pageYOffset + root.el[current_target].getBoundingClientRect().top;
			if (root.onLeave) root.onLeave.call(root, current_target);
			root._ss.to(target_px, function(){
				// root.currentIndex = root.currentIndex;
				root.cancelStash();
				if (root.afterLoad) root.afterLoad.call(root, current_target);
				root.currentIndex = current_target;
				_gotoWorker(target_index, callback, callback_args);
			});
		} else {
			if (callback_args && callback_args.constructor !== Array) callback_args = [callback_args];
			if (callback) callback.apply(null,callback_args);
			root.inTransit = false;
		}
	}

	// PPSP.prototype.goto = function(target_index, callback, callback_args){
	// 	if (!root.inTransit) {
	// 		root.inTransit = true;
	// 		if (callback_args && callback_args.constructor !== Array) callback_args = [callback_args];
	// 		if (isSkipping(target_index))
	// 			target_index = root.currentIndex - target_index < 0 ? getNextIndex(target_index) : getPrevIndex(target_index);
	// 		var target_px = window.pageYOffset + root.el[target_index].getBoundingClientRect().top;

	// 		if (root.onLeave) root.onLeave.call(root, target_index);
	// 		root._ss.to(target_px, function(){
	// 			root.prevIndex = root.currentIndex;
	// 			root.currentIndex = target_index;
	// 			root.cancelStash();
	// 			root.inTransit = false;
	// 			if (root.afterLoad) root.afterLoad.call(root);
	// 			if (callback) callback.apply(null,callback_args);
	// 		});
	// 	}
	// };

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

	function onWheel(e){

		if(root._wheel.event_arr.length > 149) root._wheel.event_arr.shift();
		root._wheel.event_arr.push(e);

		var prevTime = root._wheel.event_arr[root._wheel.event_arr.length-1].timeStamp;
		var currTime = e.timeStamp;
		if(currTime - prevTime > 250) root._wheel.event_arr = [];

		if (getBoundaryStatus() === 'in') {
			var averageEnd = getEventDeltaAverage(root._wheel.event_arr, 10);
			var averageMiddle = getEventDeltaAverage(root._wheel.event_arr, 70); //console.log(averageEnd, averageMiddle);
			var isAccelerating = averageEnd >= averageMiddle;

			var horizontalDetection = typeof e.wheelDeltaX !== 'undefined' || typeof e.deltaX !== 'undefined';
			var isScrollingVertically = (Math.abs(e.wheelDeltaX) < Math.abs(e.wheelDelta)) || (Math.abs(e.deltaX ) < Math.abs(e.deltaY) || !horizontalDetection);

			if (averageEnd >= averageMiddle && isScrollingVertically) {
				if (isStashEnabled(root.currentIndex)) {
					e.preventDefault();
					if (e.deltaY < 0) root.stash(getPrevIndex()); //moving up
					else root.stash(getNextIndex()); // moving down
				} else {
					if (e.deltaY < 0) {
						if (root.currentIndex > 0) e.preventDefault();
						root.prev(); //moving up
					}
					else {
						if (root.currentIndex < root.el.length-1) e.preventDefault();
						root.next(); // moving down
					}
				}
			} else {
				e.preventDefault();
			}
		} else {
			//TODO: actions at outbounds
		}
	}

	function onKeydown(e){

		if (getBoundaryStatus() === 'in') {
			if (isStashEnabled(root.currentIndex)) {
				if (e.key === 'ArrowDown') {
					var ni = getNextIndex();
					if (root.currentIndex !== ni) {
						e.preventDefault();
						root.stash(getNextIndex());
					}
				} else if (e.key === 'ArrowUp') {
					var pi = getPrevIndex();
					if (root.currentIndex !== pi) {
						e.preventDefault();
						root.stash(getPrevIndex());
					}
				} else if (e.key === ' ') {
					e.preventDefault();
					if (e.shiftKey) root.stash(getPrevIndex());
					else root.stash(getNextIndex());
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
		root._touch_start = e.touches[0].clientY;
	}

	function onTouchmove(e){
		var _touch_move = e.touches[0].clientY;
		if (Math.abs(root._touch_start - _touch_move) > root.touchThreshold) {
			if (getBoundaryStatus() === 'in') {
				e.preventDefault();
				if (isStashEnabled(root.currentIndex)) {
					// swipe down / scroll up
					if (root._touch_start - _touch_move < 0) root.stash(getPrevIndex());
					// swipe up / scroll down
					else root.stash(getNextIndex());
				} else {
					// swipe up / scroll down
					if (root._touch_start - _touch_move < 0) root.prev();
					// swipe down / scroll up
					else root.next();
				}
			} else {
				//TODO: actions at outbounds
			}
		}
	}

	function onTouchend(e){};

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
