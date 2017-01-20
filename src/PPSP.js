// Supports modern browsers & IE10+

(function (global, factory) {
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
		root.ss = new SlideScroll();
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

		root.ss.to(target_px, function(){
			root.currentIndex = target_index;
			if (callback) callback.apply(null,callback_args);
		});
	};

	PPSP.prototype.refresh = function(){};



	window.addEventListener('wheel', function(e){
		e.preventDefault();
		console.log('wheeled');
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
		e.preventDefault();
		console.log('scrolled');
	});



	return PPSP;
}));
