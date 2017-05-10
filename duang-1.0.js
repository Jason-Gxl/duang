(function() {
	"use strict"
	var win = window,
		doc = document,
		slice = Array.prototype.slice,
		toString = Object.prototype.toString,
		hash = {  
	        'colgroup': 'table',  
	        'col': 'colgroup',  
	        'thead': 'table',  
	        'tfoot': 'table',  
	        'tbody': 'table',  
	        'tr': 'tbody',  
	        'th': 'tr',  
	        'td': 'tr',  
	        'optgroup': 'select',  
	        'option': 'optgroup',  
	        'legend': 'fieldset'
	    };

	var Duang = (function() {
		var modules = {};

		var Module = (function() {
			var depModules = {},	//存放本模块依赖的其它模块，格式：{moduleName1:[depModuleName1, depModuleName2], moduleName2:[...]}
				controllers = {},	//存放各模块下定义的controller，格式：{moduleName:{controllerName1:controllerObj, controllerName2:...}}
				services = {},		//存放各模块下定义的service，格式：{moduleName:{serviceName1:serviceObj, serviceName2:...}}
				directives = {},	
				container = null;	//controllers，services的临时存放区

			function Module(name, deps) {
				this.name = name;
				depModules[name] = deps;
			}

			function checkParms(name, deps, impl, type) {
				var flag = true;

				try {
					if(!name) throw new Error(5008, type+"'s name is undefined");
				} catch(e) {
					console.error(e.message);
				}

				if("[object Function]"!==toString.call(deps) && "[object Function]"!==toString.call(impl)) flag = false ;
				return flag;
			}

			function getDepend(moduleName, depName) {
				var _controllers = controllers[moduleName],
					_directives = directives[moduleName],
					_services = services[moduleName],
					_depModules = depModules[moduleName],
					obj = (_services && _services[depName]) || (_controllers && _controllers[depName]) || (_directives && _directives[depName]);

				if(!obj) {
					var i = 0, len = _depModules.length;
					if(len>i) {
						do {
							_controllers = controllers[_depModules[i]];
							_services = services[_depModules[i]];
							_directives = directives[_depModules[i]];
							obj = (_services && _services[depName]) || (_controllers && _controllers[depName]) || (_directives && _directives[depName]);
							if(obj) break;
						} while(++i<len)
					}
				}

				return obj;
			}

			function definedModule(moduleName, name, deps, impl) {
				var obj = container[moduleName];

				if(deps) {
					switch(true) {
					case "[object Function]"===toString.call(deps):
						obj[name] = deps.call(this);
						break;
					case "[object Array]"===toString.call(deps):
						var i = 0, len = deps.length;
						
						while(i<len) {
							var mObj = getDepend(moduleName, deps[i]);
							if(!mObj) console.warn(deps[i]+" is undefined");
							deps[i] = mObj||null;
							i++;
						}

						obj[name] = impl.apply(this, deps);
						break;
					default:
						obj[name] = impl.call(this, getDepend(moduleName, [deps]));
					}
				} else {
					obj[name] = impl.call(this);
				}
			}

			Module.prototype = {
				getModuleName: function() {
					return this.name;
				},
				controller: function(name, deps, impl) {
					if(checkParms(name, deps, impl, "controller")) {
						controllers[this.name] = controllers[this.name] || {};
						container = controllers;
						definedModule(this.name, name, deps, impl);
						return modules[this.name];
					}
				},
				service: function(name, deps, impl) {
					if(checkParms(name, deps, impl, "service")) {
						services[this.name] = services[this.name] || {};
						container = services;
						definedModule(this.name, name, deps, impl);
						return modules[this.name];
					}
				},
				directive: function(name, deps, impl) {
					if(checkParms(name, deps, impl, "directive")) {
						directives[this.name] = directives[this.name] || {};
						container = directives;
						definedModule(this.name, name, deps, impl);
						return modules[this.name];
					}
				},
				getControllers: function() {
					return controllers[this.name];
				},
				getServices: function() {
					return services[this.name];
				},
				getController: function(name) {
					if(!name) return ;
					var _controllers = controllers[this.name];
					for(var key in _controllers) {
						if(key===name) return _controllers[key];
					}
					return ;
				},
				getService: function(name) {
					if(!name) return ;
					var _services = services[this.name];
					for(var key in _services) {
						if(key===name) return _services[key];
					}
					return ;
				}
			};

			return Module;
		}());

		function checkDepModule(deps) {
			try {
				if("[object Array]"===toString.call(deps)) {
					var i = 0, len = deps.length;
					while(i<len) {
						if(!modules[deps[i]]) throw new Error(5008, deps[i]+" is undefined");
						i++;
					}
				} else {
					if(!modules[deps]) throw new Error(5008, deps+" is undefined");
				}
			} catch(e) {
				console.log(e.message);
			}

			return 1;
		}

		function initModule(name, deps) {
			if(!name) return ;
			var deps = deps || [];
			if(checkDepModule(deps)) {
				var moduleObj = modules[name] || new Module(name, deps);
				modules[name] = moduleObj;
				return moduleObj;
			}
		}

		function getModule(name) {
			if(!name) return null;
			return modules[name];
		}

		function createElement(html) {
			var recycled = document.createElement("DIV"),
				reg = /^<([a-zA-Z]+)(?=\s|\/>|>)[\s\S]*>$/,
				html = html.trim();
				
			var _createElement = function(html) {
				if(!reg.test(html)) {
					try {
						return doc.createElement(html);
					} catch(e) {
						console.log(e);
					}
				}
				
				var tagName = hash[RegExp.$1.toLowerCase()];
				
				if(!tagName) {
					recycled.innerHTML = html;
					return recycled.removeChild(recycled.firstChild);
				}
				
				var deep = 0,
					ele = recycled;
				
				do {
					html = "<" + tagName + ">" + html + "</" + tagName + ">";
					deep++;
				} while(tagName=hash[tagName])
				
				ele.innerHTML = html;
				
				do {
					ele = ele.removeChild(ele.firstChild);
				} while(--deep>-1)
					
				return ele;
			};
			
			return _createElement(html);
		}

		return {
			module: initModule,
			getModule: getModule,
			createElement: createElement
		};
	}());

	win.duang = Duang;
}(undefined));