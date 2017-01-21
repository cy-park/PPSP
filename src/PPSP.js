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
		root.inTransit = false;

		root._ss = new SlideScroll({duration:args.duration});
		root._stash_data = []; // arguments for PPSP.goto() === [index, callback, callback_args]
	};

	// function refreshTargetDOMs(selector) {
	// 	var doms = document.querySelectorAll(selector),
	// 		targets = [];
	// 	for (var i = 0; i < doms.length; i++) {
	// 		if (!doms[i].hasAttribute('data-ppsp-skip')) targets.push(doms[i]);
	// 	}
	// 	return targets;
	// }

	function isSkipping(idx){
		var _t = root.el[idx];
		return _t.hasAttribute('data-ppsp-skip') ||
			   window.getComputedStyle(_t,null).getPropertyValue('display') === 'none' ? true : false;
	}

	function isStashEnabled(idx){
		var _t = root.el[idx];
		return _t.hasAttribute('data-ppsp-stash') || root.enableStash ? true : false;
	}

	function isInbound(){
		return (root.el[0].getBoundingClientRect().top < 0 && root.el[root.el.length-1].getBoundingClientRect().top > 0) ? true : false;
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
		if (!root.inTransit) {
			root.inTransit = true;
			if (callback_args && callback_args.constructor !== Array) callback_args = [callback_args];
			if (isSkipping(target_index))
				target_index = root.currentIndex - target_index < 0 ? getNextIndex(target_index) : getPrevIndex(target_index);
			var target_px = window.pageYOffset + root.el[target_index].getBoundingClientRect().top;

			if (root.onLeave) root.onLeave.call(root, target_index);
			root._ss.to(target_px, function(){
				root.currentIndex = target_index;
				root.cancelStash();
				root.inTransit = false;
				if (root.afterLoad) root.afterLoad.call(root);
				if (callback) callback.apply(null,callback_args);
			});
		}
	};

	PPSP.prototype.snap = function(){
		if (root.el[root.currentIndex].getBoundingClientRect().top !== 0) root.goto(getClosestIndexFromViewport());
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

	window.addEventListener('wheel', function(e){
		if (isInbound()) {
			e.preventDefault();
			if (isStashEnabled(root.currentIndex)) {
				if (e.deltaY < 0) root.stash(getPrevIndex()); //moving up
				else root.stash(getNextIndex()); // moving down
			} else {
				if (e.deltaY < 0) root.prev(); //moving up
				else root.next(); // moving down
			}
		}
	});

	window.addEventListener('keydown', function(e){
		if (isInbound()) {
			if (isStashEnabled(root.currentIndex)) {
				if (e.key === 'ArrowDown') {
					e.preventDefault();
					root.stash(getNextIndex());
				} else if (e.key === 'ArrowUp') {
					e.preventDefault();
					root.stash(getPrevIndex());
				} else if (e.key === ' ') {
					e.preventDefault();
					if (e.shiftKey) root.stash(getPrevIndex());
					else root.stash(getNextIndex());
				} else {}
			} else {
				if (e.key === 'ArrowDown') {
					e.preventDefault();
					root.next();
				} else if (e.key === 'ArrowUp') {
					e.preventDefault();
					root.prev();
				} else if (e.key === ' ') {
					e.preventDefault();
					if (e.shiftKey) root.prev();
					else root.next();
				} else {}
			}
		}
	});

	window.addEventListener('scroll', function(e){
		if (root.lockViewport) {
			window.setTimeout(root.snap,500);
		} else {
			if (isInbound()) window.setTimeout(root.snap,500);
		}
	});

	window.addEventListener('resize', function(e){
		window.setTimeout(root.snap,500);
	});
	
	return PPSP;
}));
