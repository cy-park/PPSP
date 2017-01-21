// Supports modern browsers & IE10+

;(function (global, factory) {
	'use strict';
	if(typeof define === 'function' && define.amd) {
		define(['SlideScroll'], function(SlideScroll){
			return (global.PPSP = factory(SlideScroll));
		});
	} else if(typeof module === 'object' && module.exports) {
		module.exports = (global.PPSP = factory(require('SlideScroll')));
	} else {
		global.PPSP = factory(global.SlideScroll);
	}
}(typeof window !== 'undefined' ? window : this, function(SlideScroll) {
	'use strict';
	var root;
	function PPSP(args){
		root = this;
		args = args || {};
		for (var k in args) {
			root[k] = args[k];
		}
		root.ss = new SlideScroll(args.SlideScroll);
		root.el = document.querySelectorAll(root.selector);
		root.currentIndex = 0;
	};

	// function refreshTargetDOMs(selector) {
	// 	var doms = document.querySelectorAll(selector),
	// 		targets = [];
	// 	for (var i = 0; i < doms.length; i++) {
	// 		if (!doms[i].hasAttribute('data-sp-skip')) targets.push(doms[i]);
	// 	}
	// 	return targets;
	// }

	function isSkipping(idx){
		var _t = root.el[idx];
		return _t.hasAttribute('data-sp-skip') ||
			   window.getComputedStyle(_t,null).getPropertyValue('display') === 'none' ? true : false;
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
		return closest_index;
	}

	PPSP.prototype.prev = function(callback, callback_args){
		root.goto(getPrevIndex(), callback, callback_args);
	};

	PPSP.prototype.next = function(callback, callback_args){
		root.goto(getNextIndex(), callback, callback_args);
	};

	PPSP.prototype.goto = function(target_index, callback, callback_args){
		if (callback_args && callback_args.constructor !== Array) callback_args = [callback_args];
		if (isSkipping(target_index))
			target_index = root.currentIndex - target_index < 0 ? getNextIndex(target_index) : getPrevIndex(target_index);
		var target_px = window.pageYOffset + root.el[target_index].getBoundingClientRect().top;

		if (root.onLeave) root.onLeave.call(root);
		root.ss.to(target_px, function(){
			root.currentIndex = target_index;
			if (root.afterLoad) root.afterLoad.call(root);
			if (callback) callback.apply(null,callback_args);
		});
	};

	PPSP.prototype.snap = function(){
		if (root.el[root.currentIndex].getBoundingClientRect().top !== 0) root.goto(getClosestIndexFromViewport());
	};

	PPSP.prototype.refresh = function(selector){
		selector = selector || root.selector;
		root.el = document.querySelectorAll(selector);
		root.snap();
	};

	window.addEventListener('wheel', function(e){
		e.preventDefault();
		if (!root.ss._is_scrolling) {
			if (e.deltaY < 0) root.prev(); //moving up
			else root.next(); // moving down
		}
	});

	window.addEventListener('keydown', function(e){
		//e.preventDefault();
		if (e.key === 'ArrowDown') {
			root.next();
		} else if (e.key === 'ArrowUp') {
			root.prev();
		} else if (e.key === ' ') {
			if (e.shiftKey) root.prev();
			else root.next();
		} else {}
	});

	window.addEventListener('scroll', function(e){
		console.log('scrolled');
		window.setTimeout(root.snap,500);
	});

	window.addEventListener('resize', function(e){
		window.setTimeout(root.snap,500);
	});


	return PPSP;
}));
