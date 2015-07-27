var only = function(){

	//used to temporarily mark elements that need to have functions
	//run on them after HTML is generated
	var dataIdName = "date-onlyjs-id";
	
	function parseError(msg){
		throw new TypeError("only.js parse error: " + msg);
	}

	function warn(msg){
		console.log("only.js WARNING: " + msg);
	}
	
	//takes an HTML tag name, value, and attribute list and returns HTMLElement
	function parseNameandValue(name, value, attrList, callbacks, css) {
		if (!isValidHtmlTag(name)){
			warn('"' + name + '" is not a valid HTML tag');
		}
		var el = document.createElement(name);
		if (value instanceof Array) {
			var htmlList = parseHtmlList(value, callbacks);
			for (var i in htmlList){
				var htmlObj = htmlList[i];
				el.appendChild(htmlObj);
			}
		} else if (value instanceof Function) {
			attrList.push(setupCallback(value, callbacks));
		} else if (value.constructor === Object){
			el.appendChild(parseHtmlJson(value));
		} else if (value instanceof HTMLElement) {
			el.appendChild(value);
		} else {
			el.innerHTML = value;
		}
		for (var i in attrList){
			var attr = attrList[i];
			el.setAttributeNode(attr);
		}
		if (css){
			setElementCss(el, css);
		}
		return el;
	}

	
	//takes HTML Json representation and returns HTMLElement
	function parseHtmlJson(obj, callbacks) {
		var htmlObj;
		if (obj instanceof Object) {
			var keys = [];
			var attrList = [];
			var css = null;
			var elements = Object.keys(obj);
			name = elements[0];

			for (var i = 1; i < elements.length; ++i) {
				var el = elements[i];
				if (el === "code"){
					var dataId = setupCallback(obj[el], callbacks);
					attrList.push(dataId);
				} else if (el === "css"){
					css = obj[el];
				} else {
				      var attrObj = document.createAttribute(el);
				      attrObj.value = obj[el];
				      attrList.push(attrObj);
				}
			}
			var value = obj[name];
			htmlObj = parseNameandValue(name, value, attrList, callbacks, css);
		} else {
			htmlObj = JSON.stringify(obj);
		}
		return htmlObj;
	}

	function isValidHtmlTag(tag){
		return !(document.createElement(tag) instanceof HTMLUnknownElement);
	}
	
	//adds a function to be run later to the callbacks object, along with the element id it should run on
	function setupCallback(func, callbacks){
		var hash = "" + Object.keys(callbacks).length;
		callbacks[hash] = func;
		var dataAttr = document.createAttribute(dataIdName);
		dataAttr.value = hash;
		return dataAttr;
	}
	
	//returns a list of HTML elements inside base that have dataIdName=dataId attribute
	function getByDataId(base, dataId){
		var element = base.querySelectorAll('[' + dataIdName + '="' + dataId + '"]');
		return element;
	}
	
	//parses a list of HTMLElement and HTML json representations and
	//returns list of HTMLElement as result
	function parseHtmlList(list, callbacks) {
		if (!(list instanceof Array)){
			parseError("expected Array, but was given: " + String(list));
		}
		
		return list.map(function(element){
			if(element instanceof HTMLElement){
				return element;
			} else {
				return parseHtmlJson(element, callbacks);
			}
		});
	}
	
	//creates HTMLElement object from JSON representation
	function makeHtmlElement(html){
		callbacks = {};
		var result = parseHtmlJson(html, callbacks);

		//make result not display, then add it to body so that jQuery selector
		//callbacks on it will work
		var oldDisplay = result.style.display;
		result.style.display = "none";
		document.body.appendChild(result);

		for (var id in callbacks){
			var element = getByDataId(result, id);
			callbacks[id](element);
			element[0].removeAttribute(dataIdName);
		}
		
		//remove result from body, then restore its display attribute
		document.body.removeChild(result);
		result.style.display = oldDisplay;

		return result;
	}
	
	//CSS
	
	//takes name of CSS class or id and a JSON representation of the CSS
	//and returns CSS as a string
	function genCss(name, css){
		cssText = [];
		cssText.push(camelToDash(name));
		cssText.push('{');
		for (var el in css){
			cssText.push(el+":");
			cssText.push(css[el]+";");
		}
		cssText.push('}');
		return cssText.join('');
	}
	
	//takes camelcase name and returns lower case with dashes name
	function camelToDash(name){
		newNameList = [];
		for (var i = 0; i < name.length; ++i){
			var letter = name[i];
			if (letter === letter.toLowerCase()){
				newNameList.push(letter);
			} else {
				newNameList.push('-');
				newNameList.push(letter.toLowerCase());
			}
		}
		return newNameList.join("");
	}
	
	//takes HTMLElement and JSON represention CSS and sets the CSS on the HTMLElement
	function setElementCss(el, css){
		for (var property in css){
			var dashedProp = camelToDash(property);
			if (dashedProp in el.style){
				el.style[dashedProp] = css[property];
			} else {
				warn('"' + dashedProp + '" is not a valid css property');
			}
		}
	}
	
	return {
		html: makeHtmlElement,
		setHtml: function(html) {
			var html = makeHtmlElement({body: html});
			document.body = html;
		},

		makeCss: function(name, css){
			var sheet = document.createElement('style');
			sheet.innerHTML = genCss(name, css);
			document.body.appendChild(sheet);
		}
	}
}();
