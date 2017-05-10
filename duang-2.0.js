/**
*
*MVC
*@Author Jason
*@Date 2017-4-27
*
*/
;(function() {
	"use strict";
	var toString = Object.prototype.toString;
	var	modules = {},
		controllers = {},
		directives = {},
		services = {};

	var addEvent = window.addEventListener?function(item, type, fn, use) {
		if(!item) return ;
		item.addEventListener(type, fn, use||false);
	}:function(item, type, fn) {
		if(!item) return ;
		item.attachEvent("on"+type, fn);
	};

	var removeEvent = window.removeEventListener?function(item, type, fn, use) {
		if(!item) return ;
		item.removeEventListener(type, fn, use||false);
	}:function(item, type, fn) {
		if(!item) return ;
		item.detachEvent(type, fn);
	};

	function Module(name, _deps) {
		if(!this instanceof Module) return new Module(name, _deps);
		this.name = name;
		var i = 0,
			deps = [],
			len = _deps.length;

		if(len>i) {
			do {
				var _dep = _deps[i];
				modules[_dep] && deps.push(modules[_dep]);
			} while(++i<len)
		}

		this.getDepends = function() { return deps; };
	}

	function Service() {
		var callbacks = [];

		this.then = function(fn) {
			callbacks.push(fn||null);
			return this;
		};

		this.fire = function(result) {
			var callback = callbacks.shift();

			if(void(0)!==callback) {
				var result = callback.call(this, result, this.fire);
			}
			if(callbacks.length>0 && result) {
				this.fire(result);
			}
		}
	}

	function Impl(impl, deps) {
		var i = 0, len = deps.length;

		if(len>i) {
			do {
				var dep = deps[i];
				var d = this.getService(dep) || this.getDirective(dep) || this.getController(dep);

				if(!d) {
					var depModules = this.getDepends(), j = 0, l = depModules.length;
					if(l>j) {
						do {
							var depModule = depModules[j];
							d = depModule.getService(dep) || depModule.getDirective(dep) || depModule.getController(dep);
							if(d) break;
						} while(++j<l)
					}
				}

				deps.splice(i, 1, d);
			} while(++i<len)
		}

		return impl.apply(this, deps);
	}

	Module.prototype = {
		constructor: Module,
		getController: function(name) {
			if(!name) return ;
			var ctrls = controllers[this.name] || {};
			return ctrls[name];
		},
		getDirective: function(name) {
			if(!name) return ;
			var dircts = directives[this.name] || {};
			return dircts[name];
		},
		getService: function(name) {
			if(!name) return ;
			var servs = services[this.name] || {};
			return servs[name];
		},
		controller: function() {
			var args = [].slice.call(arguments, 0),
				controllerName = args.shift();
			if(!controllerName || "[object String]"!==toString.call(controllerName)) return ;

			try {
				if(this.getController(controllerName)) throw new Error("controller named "+controllerName+" is exist");
			} catch (e) {
				console.error(e.message);
				return ;
			}

			var impl = args.pop();
			if(!impl || "[object Function]"!==toString.call(impl)) return;
			var deps = args.shift();
			deps = !deps?[]:("[object Array]"!==toString.call(deps)?[deps]:deps);
			var obj = Impl.call(this, impl, deps);
			controllers[this.name] = controllers[this.name] || {};
			controllers[this.name][controllerName] = obj;
			return this;
		},
		directive: function() {
			var args = [].slice.call(arguments, 0),
				directiveName = args.shift();
			if(!directiveName || "[object String]"!==toString.call(directiveName)) return ;

			try {
				if(this.getController(directiveName)) throw new Error("controller named "+directiveName+" is exist");
			} catch (e) {
				console.error(e.message);
				return ;
			}

			var impl = args.pop();
			if(!impl || "[object Function]"!==toString.call(impl)) return;
			var deps = args.shift();
			deps = !deps?[]:("[object Array]"!==toString.call(deps)?[deps]:deps);
			var obj = Impl.call(this, impl, deps);
			directives[this.name] = directives[this.name] || {};
			directives[this.name][directiveName] = obj;
			return this;
		},
		service: function() {
			var args = [].slice.call(arguments, 0),
				serviceName = args.shift();
			if(!serviceName || "[object String]"!==toString.call(serviceName)) return ;

			try {
				if(this.getController(serviceName)) throw new Error("controller named "+serviceName+" is exist");
			} catch (e) {
				console.error(e.message);
				return ;
			}

			var impl = args.pop();
			if(!impl || "[object Function]"!==toString.call(impl)) return;
			var deps = args.shift();
			deps = !deps?[]:("[object Array]"!==toString.call(deps)?[deps]:deps);

			try {
				var obj = Impl.call(this, impl, deps);
				if("[object Object]"!==toString.call(obj)) throw new Error("return value type is wrroy");
			} catch(e) {
				console.error(e.message);
				return ;
			}

			var serviceObj = {};
			for(var key in obj) {
				serviceObj[key] = function() {
					var service = new Service(), args = [];
					arguments[0] && args.push(arguments[0]);
					args.push(service.fire);

					setTimeout(function() {
						var result = obj[key].apply(service, args);
						result && service.fire(result);
					}, 0);

					return service;
				};
			}
			
			services[this.name] = services[this.name] || {};
			services[this.name][serviceName] = serviceObj;
			return this;
		}
	};

	window.duang = {
		module: function() {
			var args = [].slice.call(arguments, 0),
				moduleName = args.shift();
			if(!moduleName || "[object String]"!==toString.call(moduleName)) return ;
			if(modules[moduleName]) return modules[moduleName];
			var deps = args.shift();
			deps = !deps?[]:("[object Array]"!==toString.call(deps)?[deps]:deps);
			var module = new Module(moduleName, deps);
			modules[moduleName] = module;
			return module;
		},
		getModule: function(name) {
			if(!name) return ;
			return modules[name];
		},
		element: function(selector) {
			if(!selector) return ;
			var ele = getElement(selector);
			ele = "[object Array]"===toString.call(ele)?(1<ele.length?ele:ele[0]):ele;

			if(ele) {
				var i = 0, len = FnBox.length;

				if("[object Array]"===toString.call(ele)) {
					do {
						var fnObj = FnBox[i];
						if(2===fnObj.type) Element.prototype[fnObj.name] = fnObj.fn;
					} while(++i<len)
				} else {
					do {
						var fnObj = FnBox[i];
						Element.prototype[fnObj.name] = fnObj.fn;
					} while(++i<len)
				}
				return new Element(ele);
			}
		}
	};

	var FnBox = [];
	FnBox.push({
		type: 2,
		name: "addClass",
		fn: function(classname) {
			if(void(0)===classname) return ;
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				var i = 0, len = content.length;
				if(len>i) {do {addClass(content[i], classname); } while(++i<len);}
			} else {
				addClass(content, classname);
			}

			function addClass(ele, classname) {
				var className = ele.className.replace(/^\s*|\s*$/, ""),
					reg = new RegExp("\\s+\\b"+classname+"\\b\\s?");
				if(!reg.test(className)) ele.className = className + " " + classname;
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "removeClass",
		fn: function(classname) {
			if(void(0)===classname) return ;
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				for(var i=0,len=content.length; removeClass(content[i], classname); i++);
			} else {
				removeClass(content, classname);
			}

			function removeClass(ele, classname) {
				var className = ele.className,
					reg = new RegExp("\\s?\\b"+classname+"\\b");
				if(reg.test(className)) ele.className = className.replace(reg, "");
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "replaceClass",
		fn: function(oldClass, newClass) {
			this.removeClass(oldClass);
			this.addClass(newClass);
			return this;
		}
	});

	FnBox.push({
		type: 1,
		name: "hasClass",
		fn: function(classname) {
			if(void(0)===classname) return ;
			var content = this.content, reg = new RegExp("\\s?\\b"+classname+"\\b\\s?");
			return reg.test(content.className);
		}
	});

	FnBox.push({
		type: 2,
		name: "attr",
		fn: function(name, value) {
			if(void(0)===name) return ;
			var content = this.content;

			if(!value) {
				if("[object Array]"===toString.call(content)) {
					var len = content.length;

					if(len>1) {
						var list = [];
						for(var i=0;list.push(content[i].getAttribute(name));i++);
						return list;
					} else {
						return content[0].getAttribute(name);
					}
				} else {
					return content.getAttribute(name);
				}
			} else {
				if("[object Array]"===toString.call(content)) {
					for(var i=0,len=content.length; content[i].setAttribute(name, value); i++);
				} else {
					content.setAttribute(name, value);
				}
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "removeAttr",
		fn: function(name) {
			if(void(0)===name) return ;
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				for(var i=0,len=content.length; content[i].removeAttribute(name); i++);
			} else {
				content.removeAttribute(name);
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "on",
		fn: function(type, fn, use) {
			if(!type || !fn) return ;
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				for(var i=0,len=content.length; addEvent(content[i], type, fn, use); i++);
			} else {
				addEvent(content, type, fn);
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "delEvent",
		fn: function(type, fn, use) {
			if(!type || !fn) return ;
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				for(var i=0,len=content.length; removeEvent(content[i], type, fn, use); i++);
			} else {
				removeEvent(content, type, fn);
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "insertHTML",
		fn: function(where, html) {
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				for(var i=0,len=content.length; insertHTML(content[i], where, html); i++);
			} else {
				insertHTML(content, where, html);
			}

			function insertHTML(el, where, html) {
				if (!el) return false;
				where = where.toLowerCase();

				if (el.insertAdjacentHTML) {//IE
					el.insertAdjacentHTML(where, html);
				} else {
					var range = el.ownerDocument.createRange(), frag = null;
					switch (where) {
					case "beforebegin":
						range.setStartBefore(el);
						frag = range.createContextualFragment(html);
						el.parentNode.insertBefore(frag, el);
						return el.previousSibling;
					case "afterbegin":
						if (el.firstChild) {
							range.setStartBefore(el.firstChild);
							frag = range.createContextualFragment(html);
							el.insertBefore(frag, el.firstChild);
						} else {
							el.innerHTML = html;
						}
						return el.firstChild;
					case "beforeend":
						if (el.lastChild) {
							range.setStartAfter(el.lastChild);
							frag = range.createContextualFragment(html);
							el.appendChild(frag);
						} else {
							el.innerHTML = html;
						}
						return el.lastChild;
					case "afterend":
						range.setStartAfter(el);
						frag = range.createContextualFragment(html);
						el.parentNode.insertBefore(frag, el.nextSibling);
						return el.nextSibling;
					}
				}
			}

			return this;
		}
	});

	FnBox.push({
		type: 1,
		name: "html",
		fn: function(html) {
			var content = this.content;

			if(html) {
				content.innerHTML = html;
			} else {
				return content.innerHTML;
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "pre",
		fn: function() {
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				var list = [];
				for(var i=0,len=content.length;list.push(content[i].previousSibling||content[i].previousElementSibling);i++);
				this.content = list;
			} else {
				this.content = content.previousSibling||content.previousElementSibling;
			}

			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "next",
		fn: function() {
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				var list = [];
				for(var i=0,len=content.length;list.push(content[i].nextSibling||content[i].nextElementSibling);i++);
				this.content = list;
			} else {
				this.content = content.nextSibling||content.nextElementSibling;
			}

			return this;
		}
	});

	FnBox.push({
		type: 1,
		name: "preAll",
		fn: function() {
			var content = this.content, list = [], pre = content;

			do {
				pre = pre.previousSibling || pre.previousElementSibling;
				if(!pre) break;
				list.push(pre);
			} while(true)

			this.content = list;
			return this;
		}
	});

	FnBox.push({
		type: 1,
		name: "nextAll",
		fn: function() {
			var content = this.content, list = [], next = content;

			do {
				next = next.nextSibling || next.nextElementSibling;
				if(!next) break;
				list.push(next);
			} while(true)

			this.content = list;
			return this;
		}
	});

	FnBox.push({
		type: 2,
		name: "val",
		fn: function(val) {
			var content = this.content;

			if("[object Array]"===toString.call(content)) {
				if(!val) {
					var list = [];
					for(var i=0, len=content.length;list.push(content[i].value);i++);
					return list;
				} else {
					for(var i=0, len=content.length;content[i].value=val;i++);
				}
			} else {
				if(!val) {
					return content.value;
				} else {
					content.value = val;
				}
			}

			return this;
		}
	});

	function Element(ele) { this.content = ele; }
	Element.prototype.constructor = Element;

	function getElement(selector) {
		var ele = null,
			reg1 = /^\s*(\.|#|\[name\s*=)/,
			reg2 = /^\s*(?:\.|#|\[name\s*=\s*)?(.+?)\]?$/;

		selector.match(reg1);
		switch(RegExp.$1) {
		case "#":
			selector.match(reg2);
			ele = document.getElementById(RegExp.$1);
			break;
		case ".":
			selector.match(reg2);
			ele = [].slice.call(document.getElementsByClassName(RegExp.$1), 0);
			break;
		case "":
			selector.match(reg2);
			ele = [].slice.call(document.getElementsByTagName(RegExp.$1), 0);
			break;
		default:
			selector.match(reg2);
			ele = [].slice.call(document.getElementsByName(RegExp.$1), 0);
		}

		return ele;
	}
}(void(0)));