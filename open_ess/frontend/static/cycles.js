"use strict";
(() => {
  // node_modules/jquery/dist-module/jquery.module.js
  function jQueryFactory(window2, noGlobal) {
    if (typeof window2 === "undefined" || !window2.document) {
      throw new Error("jQuery requires a window with a document");
    }
    var arr = [];
    var getProto = Object.getPrototypeOf;
    var slice = arr.slice;
    var flat = arr.flat ? function(array) {
      return arr.flat.call(array);
    } : function(array) {
      return arr.concat.apply([], array);
    };
    var push = arr.push;
    var indexOf = arr.indexOf;
    var class2type = {};
    var toString = class2type.toString;
    var hasOwn = class2type.hasOwnProperty;
    var fnToString = hasOwn.toString;
    var ObjectFunctionString = fnToString.call(Object);
    var support = {};
    function toType(obj) {
      if (obj == null) {
        return obj + "";
      }
      return typeof obj === "object" ? class2type[toString.call(obj)] || "object" : typeof obj;
    }
    function isWindow(obj) {
      return obj != null && obj === obj.window;
    }
    function isArrayLike(obj) {
      var length = !!obj && obj.length, type = toType(obj);
      if (typeof obj === "function" || isWindow(obj)) {
        return false;
      }
      return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
    }
    var document$1 = window2.document;
    var preservedScriptAttributes = {
      type: true,
      src: true,
      nonce: true,
      noModule: true
    };
    function DOMEval(code, node, doc) {
      doc = doc || document$1;
      var i2, script = doc.createElement("script");
      script.text = code;
      for (i2 in preservedScriptAttributes) {
        if (node && node[i2]) {
          script[i2] = node[i2];
        }
      }
      if (doc.head.appendChild(script).parentNode) {
        script.parentNode.removeChild(script);
      }
    }
    var version = "4.0.0", rhtmlSuffix = /HTML$/i, jQuery2 = function(selector, context) {
      return new jQuery2.fn.init(selector, context);
    };
    jQuery2.fn = jQuery2.prototype = {
      // The current version of jQuery being used
      jquery: version,
      constructor: jQuery2,
      // The default length of a jQuery object is 0
      length: 0,
      toArray: function() {
        return slice.call(this);
      },
      // Get the Nth element in the matched element set OR
      // Get the whole matched element set as a clean array
      get: function(num) {
        if (num == null) {
          return slice.call(this);
        }
        return num < 0 ? this[num + this.length] : this[num];
      },
      // Take an array of elements and push it onto the stack
      // (returning the new matched element set)
      pushStack: function(elems) {
        var ret = jQuery2.merge(this.constructor(), elems);
        ret.prevObject = this;
        return ret;
      },
      // Execute a callback for every element in the matched set.
      each: function(callback) {
        return jQuery2.each(this, callback);
      },
      map: function(callback) {
        return this.pushStack(jQuery2.map(this, function(elem, i2) {
          return callback.call(elem, i2, elem);
        }));
      },
      slice: function() {
        return this.pushStack(slice.apply(this, arguments));
      },
      first: function() {
        return this.eq(0);
      },
      last: function() {
        return this.eq(-1);
      },
      even: function() {
        return this.pushStack(jQuery2.grep(this, function(_elem, i2) {
          return (i2 + 1) % 2;
        }));
      },
      odd: function() {
        return this.pushStack(jQuery2.grep(this, function(_elem, i2) {
          return i2 % 2;
        }));
      },
      eq: function(i2) {
        var len = this.length, j = +i2 + (i2 < 0 ? len : 0);
        return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
      },
      end: function() {
        return this.prevObject || this.constructor();
      }
    };
    jQuery2.extend = jQuery2.fn.extend = function() {
      var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i2 = 1, length = arguments.length, deep = false;
      if (typeof target === "boolean") {
        deep = target;
        target = arguments[i2] || {};
        i2++;
      }
      if (typeof target !== "object" && typeof target !== "function") {
        target = {};
      }
      if (i2 === length) {
        target = this;
        i2--;
      }
      for (; i2 < length; i2++) {
        if ((options = arguments[i2]) != null) {
          for (name in options) {
            copy = options[name];
            if (name === "__proto__" || target === copy) {
              continue;
            }
            if (deep && copy && (jQuery2.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
              src = target[name];
              if (copyIsArray && !Array.isArray(src)) {
                clone = [];
              } else if (!copyIsArray && !jQuery2.isPlainObject(src)) {
                clone = {};
              } else {
                clone = src;
              }
              copyIsArray = false;
              target[name] = jQuery2.extend(deep, clone, copy);
            } else if (copy !== void 0) {
              target[name] = copy;
            }
          }
        }
      }
      return target;
    };
    jQuery2.extend({
      // Unique for each copy of jQuery on the page
      expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),
      // Assume jQuery is ready without the ready module
      isReady: true,
      error: function(msg) {
        throw new Error(msg);
      },
      noop: function() {
      },
      isPlainObject: function(obj) {
        var proto, Ctor;
        if (!obj || toString.call(obj) !== "[object Object]") {
          return false;
        }
        proto = getProto(obj);
        if (!proto) {
          return true;
        }
        Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
        return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
      },
      isEmptyObject: function(obj) {
        var name;
        for (name in obj) {
          return false;
        }
        return true;
      },
      // Evaluates a script in a provided context; falls back to the global one
      // if not specified.
      globalEval: function(code, options, doc) {
        DOMEval(code, { nonce: options && options.nonce }, doc);
      },
      each: function(obj, callback) {
        var length, i2 = 0;
        if (isArrayLike(obj)) {
          length = obj.length;
          for (; i2 < length; i2++) {
            if (callback.call(obj[i2], i2, obj[i2]) === false) {
              break;
            }
          }
        } else {
          for (i2 in obj) {
            if (callback.call(obj[i2], i2, obj[i2]) === false) {
              break;
            }
          }
        }
        return obj;
      },
      // Retrieve the text value of an array of DOM nodes
      text: function(elem) {
        var node, ret = "", i2 = 0, nodeType = elem.nodeType;
        if (!nodeType) {
          while (node = elem[i2++]) {
            ret += jQuery2.text(node);
          }
        }
        if (nodeType === 1 || nodeType === 11) {
          return elem.textContent;
        }
        if (nodeType === 9) {
          return elem.documentElement.textContent;
        }
        if (nodeType === 3 || nodeType === 4) {
          return elem.nodeValue;
        }
        return ret;
      },
      // results is for internal usage only
      makeArray: function(arr2, results) {
        var ret = results || [];
        if (arr2 != null) {
          if (isArrayLike(Object(arr2))) {
            jQuery2.merge(
              ret,
              typeof arr2 === "string" ? [arr2] : arr2
            );
          } else {
            push.call(ret, arr2);
          }
        }
        return ret;
      },
      inArray: function(elem, arr2, i2) {
        return arr2 == null ? -1 : indexOf.call(arr2, elem, i2);
      },
      isXMLDoc: function(elem) {
        var namespace = elem && elem.namespaceURI, docElem = elem && (elem.ownerDocument || elem).documentElement;
        return !rhtmlSuffix.test(namespace || docElem && docElem.nodeName || "HTML");
      },
      // Note: an element does not contain itself
      contains: function(a, b) {
        var bup = b && b.parentNode;
        return a === bup || !!(bup && bup.nodeType === 1 && // Support: IE 9 - 11+
        // IE doesn't have `contains` on SVG.
        (a.contains ? a.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
      },
      merge: function(first, second) {
        var len = +second.length, j = 0, i2 = first.length;
        for (; j < len; j++) {
          first[i2++] = second[j];
        }
        first.length = i2;
        return first;
      },
      grep: function(elems, callback, invert) {
        var callbackInverse, matches2 = [], i2 = 0, length = elems.length, callbackExpect = !invert;
        for (; i2 < length; i2++) {
          callbackInverse = !callback(elems[i2], i2);
          if (callbackInverse !== callbackExpect) {
            matches2.push(elems[i2]);
          }
        }
        return matches2;
      },
      // arg is for internal usage only
      map: function(elems, callback, arg) {
        var length, value, i2 = 0, ret = [];
        if (isArrayLike(elems)) {
          length = elems.length;
          for (; i2 < length; i2++) {
            value = callback(elems[i2], i2, arg);
            if (value != null) {
              ret.push(value);
            }
          }
        } else {
          for (i2 in elems) {
            value = callback(elems[i2], i2, arg);
            if (value != null) {
              ret.push(value);
            }
          }
        }
        return flat(ret);
      },
      // A global GUID counter for objects
      guid: 1,
      // jQuery.support is not used in Core but other projects attach their
      // properties to it so it needs to exist.
      support
    });
    if (typeof Symbol === "function") {
      jQuery2.fn[Symbol.iterator] = arr[Symbol.iterator];
    }
    jQuery2.each(
      "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
      function(_i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
      }
    );
    function nodeName(elem, name) {
      return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
    }
    var pop = arr.pop;
    var whitespace = "[\\x20\\t\\r\\n\\f]";
    var isIE = document$1.documentMode;
    var rbuggyQSA = isIE && new RegExp(
      // Support: IE 9 - 11+
      // IE's :disabled selector does not pick up the children of disabled fieldsets
      ":enabled|:disabled|\\[" + whitespace + "*name" + whitespace + "*=" + whitespace + `*(?:''|"")`
    );
    var rtrimCSS = new RegExp(
      "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$",
      "g"
    );
    var identifier = "(?:\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+";
    var rleadingCombinator = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*");
    var rdescend = new RegExp(whitespace + "|>");
    var rsibling = /[+~]/;
    var documentElement$1 = document$1.documentElement;
    var matches = documentElement$1.matches || documentElement$1.msMatchesSelector;
    function createCache() {
      var keys = [];
      function cache(key, value) {
        if (keys.push(key + " ") > jQuery2.expr.cacheLength) {
          delete cache[keys.shift()];
        }
        return cache[key + " "] = value;
      }
      return cache;
    }
    function testContext(context) {
      return context && typeof context.getElementsByTagName !== "undefined" && context;
    }
    var attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace + // Operator (capture 2)
    "*([*^$|!~]?=)" + whitespace + // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
    `*(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(` + identifier + "))|)" + whitespace + "*\\]";
    var pseudos = ":(" + identifier + `)(?:\\((('((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)")|((?:\\\\.|[^\\\\()[\\]]|` + attributes + ")*)|.*)\\)|)";
    var filterMatchExpr = {
      ID: new RegExp("^#(" + identifier + ")"),
      CLASS: new RegExp("^\\.(" + identifier + ")"),
      TAG: new RegExp("^(" + identifier + "|[*])"),
      ATTR: new RegExp("^" + attributes),
      PSEUDO: new RegExp("^" + pseudos),
      CHILD: new RegExp(
        "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)",
        "i"
      )
    };
    var rpseudo = new RegExp(pseudos);
    var runescape = new RegExp("\\\\[\\da-fA-F]{1,6}" + whitespace + "?|\\\\([^\\r\\n\\f])", "g"), funescape = function(escape, nonHex) {
      var high = "0x" + escape.slice(1) - 65536;
      if (nonHex) {
        return nonHex;
      }
      return high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
    };
    function unescapeSelector(sel) {
      return sel.replace(runescape, funescape);
    }
    function selectorError(msg) {
      jQuery2.error("Syntax error, unrecognized expression: " + msg);
    }
    var rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*");
    var tokenCache = createCache();
    function tokenize(selector, parseOnly) {
      var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[selector + " "];
      if (cached) {
        return parseOnly ? 0 : cached.slice(0);
      }
      soFar = selector;
      groups = [];
      preFilters = jQuery2.expr.preFilter;
      while (soFar) {
        if (!matched || (match = rcomma.exec(soFar))) {
          if (match) {
            soFar = soFar.slice(match[0].length) || soFar;
          }
          groups.push(tokens = []);
        }
        matched = false;
        if (match = rleadingCombinator.exec(soFar)) {
          matched = match.shift();
          tokens.push({
            value: matched,
            // Cast descendant combinators to space
            type: match[0].replace(rtrimCSS, " ")
          });
          soFar = soFar.slice(matched.length);
        }
        for (type in filterMatchExpr) {
          if ((match = jQuery2.expr.match[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
            matched = match.shift();
            tokens.push({
              value: matched,
              type,
              matches: match
            });
            soFar = soFar.slice(matched.length);
          }
        }
        if (!matched) {
          break;
        }
      }
      if (parseOnly) {
        return soFar.length;
      }
      return soFar ? selectorError(selector) : (
        // Cache the tokens
        tokenCache(selector, groups).slice(0)
      );
    }
    var preFilter = {
      ATTR: function(match) {
        match[1] = unescapeSelector(match[1]);
        match[3] = unescapeSelector(match[3] || match[4] || match[5] || "");
        if (match[2] === "~=") {
          match[3] = " " + match[3] + " ";
        }
        return match.slice(0, 4);
      },
      CHILD: function(match) {
        match[1] = match[1].toLowerCase();
        if (match[1].slice(0, 3) === "nth") {
          if (!match[3]) {
            selectorError(match[0]);
          }
          match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
          match[5] = +(match[7] + match[8] || match[3] === "odd");
        } else if (match[3]) {
          selectorError(match[0]);
        }
        return match;
      },
      PSEUDO: function(match) {
        var excess, unquoted = !match[6] && match[2];
        if (filterMatchExpr.CHILD.test(match[0])) {
          return null;
        }
        if (match[3]) {
          match[2] = match[4] || match[5] || "";
        } else if (unquoted && rpseudo.test(unquoted) && // Get excess from tokenize (recursively)
        (excess = tokenize(unquoted, true)) && // advance to the next closing parenthesis
        (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {
          match[0] = match[0].slice(0, excess);
          match[2] = unquoted.slice(0, excess);
        }
        return match.slice(0, 3);
      }
    };
    function toSelector(tokens) {
      var i2 = 0, len = tokens.length, selector = "";
      for (; i2 < len; i2++) {
        selector += tokens[i2].value;
      }
      return selector;
    }
    function access(elems, fn, key, value, chainable, emptyGet, raw) {
      var i2 = 0, len = elems.length, bulk = key == null;
      if (toType(key) === "object") {
        chainable = true;
        for (i2 in key) {
          access(elems, fn, i2, key[i2], true, emptyGet, raw);
        }
      } else if (value !== void 0) {
        chainable = true;
        if (typeof value !== "function") {
          raw = true;
        }
        if (bulk) {
          if (raw) {
            fn.call(elems, value);
            fn = null;
          } else {
            bulk = fn;
            fn = function(elem, _key, value2) {
              return bulk.call(jQuery2(elem), value2);
            };
          }
        }
        if (fn) {
          for (; i2 < len; i2++) {
            fn(
              elems[i2],
              key,
              raw ? value : value.call(elems[i2], i2, fn(elems[i2], key))
            );
          }
        }
      }
      if (chainable) {
        return elems;
      }
      if (bulk) {
        return fn.call(elems);
      }
      return len ? fn(elems[0], key) : emptyGet;
    }
    var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
    jQuery2.fn.extend({
      attr: function(name, value) {
        return access(this, jQuery2.attr, name, value, arguments.length > 1);
      },
      removeAttr: function(name) {
        return this.each(function() {
          jQuery2.removeAttr(this, name);
        });
      }
    });
    jQuery2.extend({
      attr: function(elem, name, value) {
        var ret, hooks, nType = elem.nodeType;
        if (nType === 3 || nType === 8 || nType === 2) {
          return;
        }
        if (typeof elem.getAttribute === "undefined") {
          return jQuery2.prop(elem, name, value);
        }
        if (nType !== 1 || !jQuery2.isXMLDoc(elem)) {
          hooks = jQuery2.attrHooks[name.toLowerCase()];
        }
        if (value !== void 0) {
          if (value === null || // For compat with previous handling of boolean attributes,
          // remove when `false` passed. For ARIA attributes -
          // many of which recognize a `"false"` value - continue to
          // set the `"false"` value as jQuery <4 did.
          value === false && name.toLowerCase().indexOf("aria-") !== 0) {
            jQuery2.removeAttr(elem, name);
            return;
          }
          if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
            return ret;
          }
          elem.setAttribute(name, value);
          return value;
        }
        if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
          return ret;
        }
        ret = elem.getAttribute(name);
        return ret == null ? void 0 : ret;
      },
      attrHooks: {},
      removeAttr: function(elem, value) {
        var name, i2 = 0, attrNames = value && value.match(rnothtmlwhite);
        if (attrNames && elem.nodeType === 1) {
          while (name = attrNames[i2++]) {
            elem.removeAttribute(name);
          }
        }
      }
    });
    if (isIE) {
      jQuery2.attrHooks.type = {
        set: function(elem, value) {
          if (value === "radio" && nodeName(elem, "input")) {
            var val = elem.value;
            elem.setAttribute("type", value);
            if (val) {
              elem.value = val;
            }
            return value;
          }
        }
      };
    }
    var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;
    function fcssescape(ch, asCodePoint) {
      if (asCodePoint) {
        if (ch === "\0") {
          return "\uFFFD";
        }
        return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
      }
      return "\\" + ch;
    }
    jQuery2.escapeSelector = function(sel) {
      return (sel + "").replace(rcssescape, fcssescape);
    };
    var sort = arr.sort;
    var splice = arr.splice;
    var hasDuplicate;
    function sortOrder(a, b) {
      if (a === b) {
        hasDuplicate = true;
        return 0;
      }
      var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
      if (compare) {
        return compare;
      }
      compare = (a.ownerDocument || a) == (b.ownerDocument || b) ? a.compareDocumentPosition(b) : (
        // Otherwise we know they are disconnected
        1
      );
      if (compare & 1) {
        if (a == document$1 || a.ownerDocument == document$1 && jQuery2.contains(document$1, a)) {
          return -1;
        }
        if (b == document$1 || b.ownerDocument == document$1 && jQuery2.contains(document$1, b)) {
          return 1;
        }
        return 0;
      }
      return compare & 4 ? -1 : 1;
    }
    jQuery2.uniqueSort = function(results) {
      var elem, duplicates = [], j = 0, i2 = 0;
      hasDuplicate = false;
      sort.call(results, sortOrder);
      if (hasDuplicate) {
        while (elem = results[i2++]) {
          if (elem === results[i2]) {
            j = duplicates.push(i2);
          }
        }
        while (j--) {
          splice.call(results, duplicates[j], 1);
        }
      }
      return results;
    };
    jQuery2.fn.uniqueSort = function() {
      return this.pushStack(jQuery2.uniqueSort(slice.apply(this)));
    };
    var i, outermostContext, document2, documentElement, documentIsHTML, dirruns = 0, done = 0, classCache = createCache(), compilerCache = createCache(), nonnativeSelectorCache = createCache(), rwhitespace = new RegExp(whitespace + "+", "g"), ridentifier = new RegExp("^" + identifier + "$"), matchExpr = jQuery2.extend({
      // For use in libraries implementing .is()
      // We use this for POS matching in `select`
      needsContext: new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
    }, filterMatchExpr), rinputs = /^(?:input|select|textarea|button)$/i, rheader = /^h\d$/i, rquickExpr$1 = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/, unloadHandler = function() {
      setDocument();
    }, inDisabledFieldset = addCombinator(
      function(elem) {
        return elem.disabled === true && nodeName(elem, "fieldset");
      },
      { dir: "parentNode", next: "legend" }
    );
    function find(selector, context, results, seed) {
      var m, i2, elem, nid, match, groups, newSelector, newContext = context && context.ownerDocument, nodeType = context ? context.nodeType : 9;
      results = results || [];
      if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
        return results;
      }
      if (!seed) {
        setDocument(context);
        context = context || document2;
        if (documentIsHTML) {
          if (nodeType !== 11 && (match = rquickExpr$1.exec(selector))) {
            if (m = match[1]) {
              if (nodeType === 9) {
                if (elem = context.getElementById(m)) {
                  push.call(results, elem);
                }
                return results;
              } else {
                if (newContext && (elem = newContext.getElementById(m)) && jQuery2.contains(context, elem)) {
                  push.call(results, elem);
                  return results;
                }
              }
            } else if (match[2]) {
              push.apply(results, context.getElementsByTagName(selector));
              return results;
            } else if ((m = match[3]) && context.getElementsByClassName) {
              push.apply(results, context.getElementsByClassName(m));
              return results;
            }
          }
          if (!nonnativeSelectorCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {
            newSelector = selector;
            newContext = context;
            if (nodeType === 1 && (rdescend.test(selector) || rleadingCombinator.test(selector))) {
              newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
              if (newContext != context || isIE) {
                if (nid = context.getAttribute("id")) {
                  nid = jQuery2.escapeSelector(nid);
                } else {
                  context.setAttribute("id", nid = jQuery2.expando);
                }
              }
              groups = tokenize(selector);
              i2 = groups.length;
              while (i2--) {
                groups[i2] = (nid ? "#" + nid : ":scope") + " " + toSelector(groups[i2]);
              }
              newSelector = groups.join(",");
            }
            try {
              push.apply(
                results,
                newContext.querySelectorAll(newSelector)
              );
              return results;
            } catch (qsaError) {
              nonnativeSelectorCache(selector, true);
            } finally {
              if (nid === jQuery2.expando) {
                context.removeAttribute("id");
              }
            }
          }
        }
      }
      return select(selector.replace(rtrimCSS, "$1"), context, results, seed);
    }
    function markFunction(fn) {
      fn[jQuery2.expando] = true;
      return fn;
    }
    function createInputPseudo(type) {
      return function(elem) {
        return nodeName(elem, "input") && elem.type === type;
      };
    }
    function createButtonPseudo(type) {
      return function(elem) {
        return (nodeName(elem, "input") || nodeName(elem, "button")) && elem.type === type;
      };
    }
    function createDisabledPseudo(disabled) {
      return function(elem) {
        if ("form" in elem) {
          if (elem.parentNode && elem.disabled === false) {
            if ("label" in elem) {
              if ("label" in elem.parentNode) {
                return elem.parentNode.disabled === disabled;
              } else {
                return elem.disabled === disabled;
              }
            }
            return elem.isDisabled === disabled || // Where there is no isDisabled, check manually
            elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled;
          }
          return elem.disabled === disabled;
        } else if ("label" in elem) {
          return elem.disabled === disabled;
        }
        return false;
      };
    }
    function createPositionalPseudo(fn) {
      return markFunction(function(argument) {
        argument = +argument;
        return markFunction(function(seed, matches2) {
          var j, matchIndexes = fn([], seed.length, argument), i2 = matchIndexes.length;
          while (i2--) {
            if (seed[j = matchIndexes[i2]]) {
              seed[j] = !(matches2[j] = seed[j]);
            }
          }
        });
      });
    }
    function setDocument(node) {
      var subWindow, doc = node ? node.ownerDocument || node : document$1;
      if (doc == document2 || doc.nodeType !== 9) {
        return;
      }
      document2 = doc;
      documentElement = document2.documentElement;
      documentIsHTML = !jQuery2.isXMLDoc(document2);
      if (isIE && document$1 != document2 && (subWindow = document2.defaultView) && subWindow.top !== subWindow) {
        subWindow.addEventListener("unload", unloadHandler);
      }
    }
    find.matches = function(expr, elements) {
      return find(expr, null, null, elements);
    };
    find.matchesSelector = function(elem, expr) {
      setDocument(elem);
      if (documentIsHTML && !nonnativeSelectorCache[expr + " "] && (!rbuggyQSA || !rbuggyQSA.test(expr))) {
        try {
          return matches.call(elem, expr);
        } catch (e) {
          nonnativeSelectorCache(expr, true);
        }
      }
      return find(expr, document2, null, [elem]).length > 0;
    };
    jQuery2.expr = {
      // Can be adjusted by the user
      cacheLength: 50,
      createPseudo: markFunction,
      match: matchExpr,
      find: {
        ID: function(id, context) {
          if (typeof context.getElementById !== "undefined" && documentIsHTML) {
            var elem = context.getElementById(id);
            return elem ? [elem] : [];
          }
        },
        TAG: function(tag, context) {
          if (typeof context.getElementsByTagName !== "undefined") {
            return context.getElementsByTagName(tag);
          } else {
            return context.querySelectorAll(tag);
          }
        },
        CLASS: function(className, context) {
          if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
            return context.getElementsByClassName(className);
          }
        }
      },
      relative: {
        ">": { dir: "parentNode", first: true },
        " ": { dir: "parentNode" },
        "+": { dir: "previousSibling", first: true },
        "~": { dir: "previousSibling" }
      },
      preFilter,
      filter: {
        ID: function(id) {
          var attrId = unescapeSelector(id);
          return function(elem) {
            return elem.getAttribute("id") === attrId;
          };
        },
        TAG: function(nodeNameSelector) {
          var expectedNodeName = unescapeSelector(nodeNameSelector).toLowerCase();
          return nodeNameSelector === "*" ? function() {
            return true;
          } : function(elem) {
            return nodeName(elem, expectedNodeName);
          };
        },
        CLASS: function(className) {
          var pattern = classCache[className + " "];
          return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
            return pattern.test(
              typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || ""
            );
          });
        },
        ATTR: function(name, operator, check) {
          return function(elem) {
            var result = jQuery2.attr(elem, name);
            if (result == null) {
              return operator === "!=";
            }
            if (!operator) {
              return true;
            }
            result += "";
            if (operator === "=") {
              return result === check;
            }
            if (operator === "!=") {
              return result !== check;
            }
            if (operator === "^=") {
              return check && result.indexOf(check) === 0;
            }
            if (operator === "*=") {
              return check && result.indexOf(check) > -1;
            }
            if (operator === "$=") {
              return check && result.slice(-check.length) === check;
            }
            if (operator === "~=") {
              return (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1;
            }
            if (operator === "|=") {
              return result === check || result.slice(0, check.length + 1) === check + "-";
            }
            return false;
          };
        },
        CHILD: function(type, what, _argument, first, last) {
          var simple = type.slice(0, 3) !== "nth", forward = type.slice(-4) !== "last", ofType = what === "of-type";
          return first === 1 && last === 0 ? (
            // Shortcut for :nth-*(n)
            function(elem) {
              return !!elem.parentNode;
            }
          ) : function(elem, _context, xml) {
            var cache, outerCache, node, nodeIndex, start, dir2 = simple !== forward ? "nextSibling" : "previousSibling", parent = elem.parentNode, name = ofType && elem.nodeName.toLowerCase(), useCache = !xml && !ofType, diff = false;
            if (parent) {
              if (simple) {
                while (dir2) {
                  node = elem;
                  while (node = node[dir2]) {
                    if (ofType ? nodeName(node, name) : node.nodeType === 1) {
                      return false;
                    }
                  }
                  start = dir2 = type === "only" && !start && "nextSibling";
                }
                return true;
              }
              start = [forward ? parent.firstChild : parent.lastChild];
              if (forward && useCache) {
                outerCache = parent[jQuery2.expando] || (parent[jQuery2.expando] = {});
                cache = outerCache[type] || [];
                nodeIndex = cache[0] === dirruns && cache[1];
                diff = nodeIndex && cache[2];
                node = nodeIndex && parent.childNodes[nodeIndex];
                while (node = ++nodeIndex && node && node[dir2] || // Fallback to seeking `elem` from the start
                (diff = nodeIndex = 0) || start.pop()) {
                  if (node.nodeType === 1 && ++diff && node === elem) {
                    outerCache[type] = [dirruns, nodeIndex, diff];
                    break;
                  }
                }
              } else {
                if (useCache) {
                  outerCache = elem[jQuery2.expando] || (elem[jQuery2.expando] = {});
                  cache = outerCache[type] || [];
                  nodeIndex = cache[0] === dirruns && cache[1];
                  diff = nodeIndex;
                }
                if (diff === false) {
                  while (node = ++nodeIndex && node && node[dir2] || (diff = nodeIndex = 0) || start.pop()) {
                    if ((ofType ? nodeName(node, name) : node.nodeType === 1) && ++diff) {
                      if (useCache) {
                        outerCache = node[jQuery2.expando] || (node[jQuery2.expando] = {});
                        outerCache[type] = [dirruns, diff];
                      }
                      if (node === elem) {
                        break;
                      }
                    }
                  }
                }
              }
              diff -= last;
              return diff === first || diff % first === 0 && diff / first >= 0;
            }
          };
        },
        PSEUDO: function(pseudo, argument) {
          var fn = jQuery2.expr.pseudos[pseudo] || jQuery2.expr.setFilters[pseudo.toLowerCase()] || selectorError("unsupported pseudo: " + pseudo);
          if (fn[jQuery2.expando]) {
            return fn(argument);
          }
          return fn;
        }
      },
      pseudos: {
        // Potentially complex pseudos
        not: markFunction(function(selector) {
          var input = [], results = [], matcher = compile(selector.replace(rtrimCSS, "$1"));
          return matcher[jQuery2.expando] ? markFunction(function(seed, matches2, _context, xml) {
            var elem, unmatched = matcher(seed, null, xml, []), i2 = seed.length;
            while (i2--) {
              if (elem = unmatched[i2]) {
                seed[i2] = !(matches2[i2] = elem);
              }
            }
          }) : function(elem, _context, xml) {
            input[0] = elem;
            matcher(input, null, xml, results);
            input[0] = null;
            return !results.pop();
          };
        }),
        has: markFunction(function(selector) {
          return function(elem) {
            return find(selector, elem).length > 0;
          };
        }),
        contains: markFunction(function(text) {
          text = unescapeSelector(text);
          return function(elem) {
            return (elem.textContent || jQuery2.text(elem)).indexOf(text) > -1;
          };
        }),
        // "Whether an element is represented by a :lang() selector
        // is based solely on the element's language value
        // being equal to the identifier C,
        // or beginning with the identifier C immediately followed by "-".
        // The matching of C against the element's language value is performed case-insensitively.
        // The identifier C does not have to be a valid language name."
        // https://www.w3.org/TR/selectors/#lang-pseudo
        lang: markFunction(function(lang) {
          if (!ridentifier.test(lang || "")) {
            selectorError("unsupported lang: " + lang);
          }
          lang = unescapeSelector(lang).toLowerCase();
          return function(elem) {
            var elemLang;
            do {
              if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {
                elemLang = elemLang.toLowerCase();
                return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
              }
            } while ((elem = elem.parentNode) && elem.nodeType === 1);
            return false;
          };
        }),
        // Miscellaneous
        target: function(elem) {
          var hash = window2.location && window2.location.hash;
          return hash && hash.slice(1) === elem.id;
        },
        root: function(elem) {
          return elem === documentElement;
        },
        focus: function(elem) {
          return elem === document2.activeElement && document2.hasFocus() && !!(elem.type || elem.href || ~elem.tabIndex);
        },
        // Boolean properties
        enabled: createDisabledPseudo(false),
        disabled: createDisabledPseudo(true),
        checked: function(elem) {
          return nodeName(elem, "input") && !!elem.checked || nodeName(elem, "option") && !!elem.selected;
        },
        selected: function(elem) {
          if (isIE && elem.parentNode) {
            elem.parentNode.selectedIndex;
          }
          return elem.selected === true;
        },
        // Contents
        empty: function(elem) {
          for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
            if (elem.nodeType < 6) {
              return false;
            }
          }
          return true;
        },
        parent: function(elem) {
          return !jQuery2.expr.pseudos.empty(elem);
        },
        // Element/input types
        header: function(elem) {
          return rheader.test(elem.nodeName);
        },
        input: function(elem) {
          return rinputs.test(elem.nodeName);
        },
        button: function(elem) {
          return nodeName(elem, "input") && elem.type === "button" || nodeName(elem, "button");
        },
        text: function(elem) {
          return nodeName(elem, "input") && elem.type === "text";
        },
        // Position-in-collection
        first: createPositionalPseudo(function() {
          return [0];
        }),
        last: createPositionalPseudo(function(_matchIndexes, length) {
          return [length - 1];
        }),
        eq: createPositionalPseudo(function(_matchIndexes, length, argument) {
          return [argument < 0 ? argument + length : argument];
        }),
        even: createPositionalPseudo(function(matchIndexes, length) {
          var i2 = 0;
          for (; i2 < length; i2 += 2) {
            matchIndexes.push(i2);
          }
          return matchIndexes;
        }),
        odd: createPositionalPseudo(function(matchIndexes, length) {
          var i2 = 1;
          for (; i2 < length; i2 += 2) {
            matchIndexes.push(i2);
          }
          return matchIndexes;
        }),
        lt: createPositionalPseudo(function(matchIndexes, length, argument) {
          var i2;
          if (argument < 0) {
            i2 = argument + length;
          } else if (argument > length) {
            i2 = length;
          } else {
            i2 = argument;
          }
          for (; --i2 >= 0; ) {
            matchIndexes.push(i2);
          }
          return matchIndexes;
        }),
        gt: createPositionalPseudo(function(matchIndexes, length, argument) {
          var i2 = argument < 0 ? argument + length : argument;
          for (; ++i2 < length; ) {
            matchIndexes.push(i2);
          }
          return matchIndexes;
        })
      }
    };
    jQuery2.expr.pseudos.nth = jQuery2.expr.pseudos.eq;
    for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
      jQuery2.expr.pseudos[i] = createInputPseudo(i);
    }
    for (i in { submit: true, reset: true }) {
      jQuery2.expr.pseudos[i] = createButtonPseudo(i);
    }
    function setFilters() {
    }
    setFilters.prototype = jQuery2.expr.pseudos;
    jQuery2.expr.setFilters = new setFilters();
    function addCombinator(matcher, combinator, base) {
      var dir2 = combinator.dir, skip = combinator.next, key = skip || dir2, checkNonElements = base && key === "parentNode", doneName = done++;
      return combinator.first ? (
        // Check against closest ancestor/preceding element
        function(elem, context, xml) {
          while (elem = elem[dir2]) {
            if (elem.nodeType === 1 || checkNonElements) {
              return matcher(elem, context, xml);
            }
          }
          return false;
        }
      ) : (
        // Check against all ancestor/preceding elements
        function(elem, context, xml) {
          var oldCache, outerCache, newCache = [dirruns, doneName];
          if (xml) {
            while (elem = elem[dir2]) {
              if (elem.nodeType === 1 || checkNonElements) {
                if (matcher(elem, context, xml)) {
                  return true;
                }
              }
            }
          } else {
            while (elem = elem[dir2]) {
              if (elem.nodeType === 1 || checkNonElements) {
                outerCache = elem[jQuery2.expando] || (elem[jQuery2.expando] = {});
                if (skip && nodeName(elem, skip)) {
                  elem = elem[dir2] || elem;
                } else if ((oldCache = outerCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                  return newCache[2] = oldCache[2];
                } else {
                  outerCache[key] = newCache;
                  if (newCache[2] = matcher(elem, context, xml)) {
                    return true;
                  }
                }
              }
            }
          }
          return false;
        }
      );
    }
    function elementMatcher(matchers) {
      return matchers.length > 1 ? function(elem, context, xml) {
        var i2 = matchers.length;
        while (i2--) {
          if (!matchers[i2](elem, context, xml)) {
            return false;
          }
        }
        return true;
      } : matchers[0];
    }
    function multipleContexts(selector, contexts, results) {
      var i2 = 0, len = contexts.length;
      for (; i2 < len; i2++) {
        find(selector, contexts[i2], results);
      }
      return results;
    }
    function condense(unmatched, map, filter, context, xml) {
      var elem, newUnmatched = [], i2 = 0, len = unmatched.length, mapped = map != null;
      for (; i2 < len; i2++) {
        if (elem = unmatched[i2]) {
          if (!filter || filter(elem, context, xml)) {
            newUnmatched.push(elem);
            if (mapped) {
              map.push(i2);
            }
          }
        }
      }
      return newUnmatched;
    }
    function setMatcher(preFilter2, selector, matcher, postFilter, postFinder, postSelector) {
      if (postFilter && !postFilter[jQuery2.expando]) {
        postFilter = setMatcher(postFilter);
      }
      if (postFinder && !postFinder[jQuery2.expando]) {
        postFinder = setMatcher(postFinder, postSelector);
      }
      return markFunction(function(seed, results, context, xml) {
        var temp, i2, elem, matcherOut, preMap = [], postMap = [], preexisting = results.length, elems = seed || multipleContexts(
          selector || "*",
          context.nodeType ? [context] : context,
          []
        ), matcherIn = preFilter2 && (seed || !selector) ? condense(elems, preMap, preFilter2, context, xml) : elems;
        if (matcher) {
          matcherOut = postFinder || (seed ? preFilter2 : preexisting || postFilter) ? (
            // ...intermediate processing is necessary
            []
          ) : (
            // ...otherwise use results directly
            results
          );
          matcher(matcherIn, matcherOut, context, xml);
        } else {
          matcherOut = matcherIn;
        }
        if (postFilter) {
          temp = condense(matcherOut, postMap);
          postFilter(temp, [], context, xml);
          i2 = temp.length;
          while (i2--) {
            if (elem = temp[i2]) {
              matcherOut[postMap[i2]] = !(matcherIn[postMap[i2]] = elem);
            }
          }
        }
        if (seed) {
          if (postFinder || preFilter2) {
            if (postFinder) {
              temp = [];
              i2 = matcherOut.length;
              while (i2--) {
                if (elem = matcherOut[i2]) {
                  temp.push(matcherIn[i2] = elem);
                }
              }
              postFinder(null, matcherOut = [], temp, xml);
            }
            i2 = matcherOut.length;
            while (i2--) {
              if ((elem = matcherOut[i2]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i2]) > -1) {
                seed[temp] = !(results[temp] = elem);
              }
            }
          }
        } else {
          matcherOut = condense(
            matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut
          );
          if (postFinder) {
            postFinder(null, results, matcherOut, xml);
          } else {
            push.apply(results, matcherOut);
          }
        }
      });
    }
    function matcherFromTokens(tokens) {
      var checkContext, matcher, j, len = tokens.length, leadingRelative = jQuery2.expr.relative[tokens[0].type], implicitRelative = leadingRelative || jQuery2.expr.relative[" "], i2 = leadingRelative ? 1 : 0, matchContext = addCombinator(function(elem) {
        return elem === checkContext;
      }, implicitRelative, true), matchAnyContext = addCombinator(function(elem) {
        return indexOf.call(checkContext, elem) > -1;
      }, implicitRelative, true), matchers = [function(elem, context, xml) {
        var ret = !leadingRelative && (xml || context != outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
        checkContext = null;
        return ret;
      }];
      for (; i2 < len; i2++) {
        if (matcher = jQuery2.expr.relative[tokens[i2].type]) {
          matchers = [addCombinator(elementMatcher(matchers), matcher)];
        } else {
          matcher = jQuery2.expr.filter[tokens[i2].type].apply(null, tokens[i2].matches);
          if (matcher[jQuery2.expando]) {
            j = ++i2;
            for (; j < len; j++) {
              if (jQuery2.expr.relative[tokens[j].type]) {
                break;
              }
            }
            return setMatcher(
              i2 > 1 && elementMatcher(matchers),
              i2 > 1 && toSelector(
                // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                tokens.slice(0, i2 - 1).concat({ value: tokens[i2 - 2].type === " " ? "*" : "" })
              ).replace(rtrimCSS, "$1"),
              matcher,
              i2 < j && matcherFromTokens(tokens.slice(i2, j)),
              j < len && matcherFromTokens(tokens = tokens.slice(j)),
              j < len && toSelector(tokens)
            );
          }
          matchers.push(matcher);
        }
      }
      return elementMatcher(matchers);
    }
    function matcherFromGroupMatchers(elementMatchers, setMatchers) {
      var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, outermost) {
        var elem, j, matcher, matchedCount = 0, i2 = "0", unmatched = seed && [], setMatched = [], contextBackup = outermostContext, elems = seed || byElement && jQuery2.expr.find.TAG("*", outermost), dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1;
        if (outermost) {
          outermostContext = context == document2 || context || outermost;
        }
        for (; (elem = elems[i2]) != null; i2++) {
          if (byElement && elem) {
            j = 0;
            if (!context && elem.ownerDocument != document2) {
              setDocument(elem);
              xml = !documentIsHTML;
            }
            while (matcher = elementMatchers[j++]) {
              if (matcher(elem, context || document2, xml)) {
                push.call(results, elem);
                break;
              }
            }
            if (outermost) {
              dirruns = dirrunsUnique;
            }
          }
          if (bySet) {
            if (elem = !matcher && elem) {
              matchedCount--;
            }
            if (seed) {
              unmatched.push(elem);
            }
          }
        }
        matchedCount += i2;
        if (bySet && i2 !== matchedCount) {
          j = 0;
          while (matcher = setMatchers[j++]) {
            matcher(unmatched, setMatched, context, xml);
          }
          if (seed) {
            if (matchedCount > 0) {
              while (i2--) {
                if (!(unmatched[i2] || setMatched[i2])) {
                  setMatched[i2] = pop.call(results);
                }
              }
            }
            setMatched = condense(setMatched);
          }
          push.apply(results, setMatched);
          if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
            jQuery2.uniqueSort(results);
          }
        }
        if (outermost) {
          dirruns = dirrunsUnique;
          outermostContext = contextBackup;
        }
        return unmatched;
      };
      return bySet ? markFunction(superMatcher) : superMatcher;
    }
    function compile(selector, match) {
      var i2, setMatchers = [], elementMatchers = [], cached = compilerCache[selector + " "];
      if (!cached) {
        if (!match) {
          match = tokenize(selector);
        }
        i2 = match.length;
        while (i2--) {
          cached = matcherFromTokens(match[i2]);
          if (cached[jQuery2.expando]) {
            setMatchers.push(cached);
          } else {
            elementMatchers.push(cached);
          }
        }
        cached = compilerCache(
          selector,
          matcherFromGroupMatchers(elementMatchers, setMatchers)
        );
        cached.selector = selector;
      }
      return cached;
    }
    function select(selector, context, results, seed) {
      var i2, tokens, token, type, find2, compiled = typeof selector === "function" && selector, match = !seed && tokenize(selector = compiled.selector || selector);
      results = results || [];
      if (match.length === 1) {
        tokens = match[0] = match[0].slice(0);
        if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && jQuery2.expr.relative[tokens[1].type]) {
          context = (jQuery2.expr.find.ID(
            unescapeSelector(token.matches[0]),
            context
          ) || [])[0];
          if (!context) {
            return results;
          } else if (compiled) {
            context = context.parentNode;
          }
          selector = selector.slice(tokens.shift().value.length);
        }
        i2 = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
        while (i2--) {
          token = tokens[i2];
          if (jQuery2.expr.relative[type = token.type]) {
            break;
          }
          if (find2 = jQuery2.expr.find[type]) {
            if (seed = find2(
              unescapeSelector(token.matches[0]),
              rsibling.test(tokens[0].type) && testContext(context.parentNode) || context
            )) {
              tokens.splice(i2, 1);
              selector = seed.length && toSelector(tokens);
              if (!selector) {
                push.apply(results, seed);
                return results;
              }
              break;
            }
          }
        }
      }
      (compiled || compile(selector, match))(
        seed,
        context,
        !documentIsHTML,
        results,
        !context || rsibling.test(selector) && testContext(context.parentNode) || context
      );
      return results;
    }
    setDocument();
    jQuery2.find = find;
    find.compile = compile;
    find.select = select;
    find.setDocument = setDocument;
    find.tokenize = tokenize;
    function dir(elem, dir2, until) {
      var matched = [], truncate = until !== void 0;
      while ((elem = elem[dir2]) && elem.nodeType !== 9) {
        if (elem.nodeType === 1) {
          if (truncate && jQuery2(elem).is(until)) {
            break;
          }
          matched.push(elem);
        }
      }
      return matched;
    }
    function siblings(n, elem) {
      var matched = [];
      for (; n; n = n.nextSibling) {
        if (n.nodeType === 1 && n !== elem) {
          matched.push(n);
        }
      }
      return matched;
    }
    var rneedsContext = jQuery2.expr.match.needsContext;
    var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
    function isObviousHtml(input) {
      return input[0] === "<" && input[input.length - 1] === ">" && input.length >= 3;
    }
    function winnow(elements, qualifier, not) {
      if (typeof qualifier === "function") {
        return jQuery2.grep(elements, function(elem, i2) {
          return !!qualifier.call(elem, i2, elem) !== not;
        });
      }
      if (qualifier.nodeType) {
        return jQuery2.grep(elements, function(elem) {
          return elem === qualifier !== not;
        });
      }
      if (typeof qualifier !== "string") {
        return jQuery2.grep(elements, function(elem) {
          return indexOf.call(qualifier, elem) > -1 !== not;
        });
      }
      return jQuery2.filter(qualifier, elements, not);
    }
    jQuery2.filter = function(expr, elems, not) {
      var elem = elems[0];
      if (not) {
        expr = ":not(" + expr + ")";
      }
      if (elems.length === 1 && elem.nodeType === 1) {
        return jQuery2.find.matchesSelector(elem, expr) ? [elem] : [];
      }
      return jQuery2.find.matches(expr, jQuery2.grep(elems, function(elem2) {
        return elem2.nodeType === 1;
      }));
    };
    jQuery2.fn.extend({
      find: function(selector) {
        var i2, ret, len = this.length, self2 = this;
        if (typeof selector !== "string") {
          return this.pushStack(jQuery2(selector).filter(function() {
            for (i2 = 0; i2 < len; i2++) {
              if (jQuery2.contains(self2[i2], this)) {
                return true;
              }
            }
          }));
        }
        ret = this.pushStack([]);
        for (i2 = 0; i2 < len; i2++) {
          jQuery2.find(selector, self2[i2], ret);
        }
        return len > 1 ? jQuery2.uniqueSort(ret) : ret;
      },
      filter: function(selector) {
        return this.pushStack(winnow(this, selector || [], false));
      },
      not: function(selector) {
        return this.pushStack(winnow(this, selector || [], true));
      },
      is: function(selector) {
        return !!winnow(
          this,
          // If this is a positional/relative selector, check membership in the returned set
          // so $("p:first").is("p:last") won't return true for a doc with two "p".
          typeof selector === "string" && rneedsContext.test(selector) ? jQuery2(selector) : selector || [],
          false
        ).length;
      }
    });
    var rootjQuery, rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/, init3 = jQuery2.fn.init = function(selector, context) {
      var match, elem;
      if (!selector) {
        return this;
      }
      if (selector.nodeType) {
        this[0] = selector;
        this.length = 1;
        return this;
      } else if (typeof selector === "function") {
        return rootjQuery.ready !== void 0 ? rootjQuery.ready(selector) : (
          // Execute immediately if ready is not present
          selector(jQuery2)
        );
      } else {
        match = selector + "";
        if (isObviousHtml(match)) {
          match = [null, selector, null];
        } else if (typeof selector === "string") {
          match = rquickExpr.exec(selector);
        } else {
          return jQuery2.makeArray(selector, this);
        }
        if (match && (match[1] || !context)) {
          if (match[1]) {
            context = context instanceof jQuery2 ? context[0] : context;
            jQuery2.merge(this, jQuery2.parseHTML(
              match[1],
              context && context.nodeType ? context.ownerDocument || context : document$1,
              true
            ));
            if (rsingleTag.test(match[1]) && jQuery2.isPlainObject(context)) {
              for (match in context) {
                if (typeof this[match] === "function") {
                  this[match](context[match]);
                } else {
                  this.attr(match, context[match]);
                }
              }
            }
            return this;
          } else {
            elem = document$1.getElementById(match[2]);
            if (elem) {
              this[0] = elem;
              this.length = 1;
            }
            return this;
          }
        } else if (!context || context.jquery) {
          return (context || rootjQuery).find(selector);
        } else {
          return this.constructor(context).find(selector);
        }
      }
    };
    init3.prototype = jQuery2.fn;
    rootjQuery = jQuery2(document$1);
    var rparentsprev = /^(?:parents|prev(?:Until|All))/, guaranteedUnique = {
      children: true,
      contents: true,
      next: true,
      prev: true
    };
    jQuery2.fn.extend({
      has: function(target) {
        var targets = jQuery2(target, this), l = targets.length;
        return this.filter(function() {
          var i2 = 0;
          for (; i2 < l; i2++) {
            if (jQuery2.contains(this, targets[i2])) {
              return true;
            }
          }
        });
      },
      closest: function(selectors, context) {
        var cur, i2 = 0, l = this.length, matched = [], targets = typeof selectors !== "string" && jQuery2(selectors);
        if (!rneedsContext.test(selectors)) {
          for (; i2 < l; i2++) {
            for (cur = this[i2]; cur && cur !== context; cur = cur.parentNode) {
              if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : (
                // Don't pass non-elements to jQuery#find
                cur.nodeType === 1 && jQuery2.find.matchesSelector(cur, selectors)
              ))) {
                matched.push(cur);
                break;
              }
            }
          }
        }
        return this.pushStack(matched.length > 1 ? jQuery2.uniqueSort(matched) : matched);
      },
      // Determine the position of an element within the set
      index: function(elem) {
        if (!elem) {
          return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
        }
        if (typeof elem === "string") {
          return indexOf.call(jQuery2(elem), this[0]);
        }
        return indexOf.call(
          this,
          // If it receives a jQuery object, the first element is used
          elem.jquery ? elem[0] : elem
        );
      },
      add: function(selector, context) {
        return this.pushStack(
          jQuery2.uniqueSort(
            jQuery2.merge(this.get(), jQuery2(selector, context))
          )
        );
      },
      addBack: function(selector) {
        return this.add(
          selector == null ? this.prevObject : this.prevObject.filter(selector)
        );
      }
    });
    function sibling(cur, dir2) {
      while ((cur = cur[dir2]) && cur.nodeType !== 1) {
      }
      return cur;
    }
    jQuery2.each({
      parent: function(elem) {
        var parent = elem.parentNode;
        return parent && parent.nodeType !== 11 ? parent : null;
      },
      parents: function(elem) {
        return dir(elem, "parentNode");
      },
      parentsUntil: function(elem, _i, until) {
        return dir(elem, "parentNode", until);
      },
      next: function(elem) {
        return sibling(elem, "nextSibling");
      },
      prev: function(elem) {
        return sibling(elem, "previousSibling");
      },
      nextAll: function(elem) {
        return dir(elem, "nextSibling");
      },
      prevAll: function(elem) {
        return dir(elem, "previousSibling");
      },
      nextUntil: function(elem, _i, until) {
        return dir(elem, "nextSibling", until);
      },
      prevUntil: function(elem, _i, until) {
        return dir(elem, "previousSibling", until);
      },
      siblings: function(elem) {
        return siblings((elem.parentNode || {}).firstChild, elem);
      },
      children: function(elem) {
        return siblings(elem.firstChild);
      },
      contents: function(elem) {
        if (elem.contentDocument != null && // Support: IE 11+
        // <object> elements with no `data` attribute has an object
        // `contentDocument` with a `null` prototype.
        getProto(elem.contentDocument)) {
          return elem.contentDocument;
        }
        if (nodeName(elem, "template")) {
          elem = elem.content || elem;
        }
        return jQuery2.merge([], elem.childNodes);
      }
    }, function(name, fn) {
      jQuery2.fn[name] = function(until, selector) {
        var matched = jQuery2.map(this, fn, until);
        if (name.slice(-5) !== "Until") {
          selector = until;
        }
        if (selector && typeof selector === "string") {
          matched = jQuery2.filter(selector, matched);
        }
        if (this.length > 1) {
          if (!guaranteedUnique[name]) {
            jQuery2.uniqueSort(matched);
          }
          if (rparentsprev.test(name)) {
            matched.reverse();
          }
        }
        return this.pushStack(matched);
      };
    });
    function createOptions(options) {
      var object = {};
      jQuery2.each(options.match(rnothtmlwhite) || [], function(_, flag) {
        object[flag] = true;
      });
      return object;
    }
    jQuery2.Callbacks = function(options) {
      options = typeof options === "string" ? createOptions(options) : jQuery2.extend({}, options);
      var firing, memory, fired, locked, list = [], queue = [], firingIndex = -1, fire = function() {
        locked = locked || options.once;
        fired = firing = true;
        for (; queue.length; firingIndex = -1) {
          memory = queue.shift();
          while (++firingIndex < list.length) {
            if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
              firingIndex = list.length;
              memory = false;
            }
          }
        }
        if (!options.memory) {
          memory = false;
        }
        firing = false;
        if (locked) {
          if (memory) {
            list = [];
          } else {
            list = "";
          }
        }
      }, self2 = {
        // Add a callback or a collection of callbacks to the list
        add: function() {
          if (list) {
            if (memory && !firing) {
              firingIndex = list.length - 1;
              queue.push(memory);
            }
            (function add(args) {
              jQuery2.each(args, function(_, arg) {
                if (typeof arg === "function") {
                  if (!options.unique || !self2.has(arg)) {
                    list.push(arg);
                  }
                } else if (arg && arg.length && toType(arg) !== "string") {
                  add(arg);
                }
              });
            })(arguments);
            if (memory && !firing) {
              fire();
            }
          }
          return this;
        },
        // Remove a callback from the list
        remove: function() {
          jQuery2.each(arguments, function(_, arg) {
            var index;
            while ((index = jQuery2.inArray(arg, list, index)) > -1) {
              list.splice(index, 1);
              if (index <= firingIndex) {
                firingIndex--;
              }
            }
          });
          return this;
        },
        // Check if a given callback is in the list.
        // If no argument is given, return whether or not list has callbacks attached.
        has: function(fn) {
          return fn ? jQuery2.inArray(fn, list) > -1 : list.length > 0;
        },
        // Remove all callbacks from the list
        empty: function() {
          if (list) {
            list = [];
          }
          return this;
        },
        // Disable .fire and .add
        // Abort any current/pending executions
        // Clear all callbacks and values
        disable: function() {
          locked = queue = [];
          list = memory = "";
          return this;
        },
        disabled: function() {
          return !list;
        },
        // Disable .fire
        // Also disable .add unless we have memory (since it would have no effect)
        // Abort any pending executions
        lock: function() {
          locked = queue = [];
          if (!memory && !firing) {
            list = memory = "";
          }
          return this;
        },
        locked: function() {
          return !!locked;
        },
        // Call all callbacks with the given context and arguments
        fireWith: function(context, args) {
          if (!locked) {
            args = args || [];
            args = [context, args.slice ? args.slice() : args];
            queue.push(args);
            if (!firing) {
              fire();
            }
          }
          return this;
        },
        // Call all the callbacks with the given arguments
        fire: function() {
          self2.fireWith(this, arguments);
          return this;
        },
        // To know if the callbacks have already been called at least once
        fired: function() {
          return !!fired;
        }
      };
      return self2;
    };
    function Identity(v) {
      return v;
    }
    function Thrower(ex) {
      throw ex;
    }
    function adoptValue(value, resolve, reject, noValue) {
      var method;
      try {
        if (value && typeof (method = value.promise) === "function") {
          method.call(value).done(resolve).fail(reject);
        } else if (value && typeof (method = value.then) === "function") {
          method.call(value, resolve, reject);
        } else {
          resolve.apply(void 0, [value].slice(noValue));
        }
      } catch (value2) {
        reject(value2);
      }
    }
    jQuery2.extend({
      Deferred: function(func) {
        var tuples = [
          // action, add listener, callbacks,
          // ... .then handlers, argument index, [final state]
          [
            "notify",
            "progress",
            jQuery2.Callbacks("memory"),
            jQuery2.Callbacks("memory"),
            2
          ],
          [
            "resolve",
            "done",
            jQuery2.Callbacks("once memory"),
            jQuery2.Callbacks("once memory"),
            0,
            "resolved"
          ],
          [
            "reject",
            "fail",
            jQuery2.Callbacks("once memory"),
            jQuery2.Callbacks("once memory"),
            1,
            "rejected"
          ]
        ], state = "pending", promise = {
          state: function() {
            return state;
          },
          always: function() {
            deferred.done(arguments).fail(arguments);
            return this;
          },
          catch: function(fn) {
            return promise.then(null, fn);
          },
          // Keep pipe for back-compat
          pipe: function() {
            var fns = arguments;
            return jQuery2.Deferred(function(newDefer) {
              jQuery2.each(tuples, function(_i, tuple) {
                var fn = typeof fns[tuple[4]] === "function" && fns[tuple[4]];
                deferred[tuple[1]](function() {
                  var returned = fn && fn.apply(this, arguments);
                  if (returned && typeof returned.promise === "function") {
                    returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                  } else {
                    newDefer[tuple[0] + "With"](
                      this,
                      fn ? [returned] : arguments
                    );
                  }
                });
              });
              fns = null;
            }).promise();
          },
          then: function(onFulfilled, onRejected, onProgress) {
            var maxDepth = 0;
            function resolve(depth, deferred2, handler, special) {
              return function() {
                var that = this, args = arguments, mightThrow = function() {
                  var returned, then;
                  if (depth < maxDepth) {
                    return;
                  }
                  returned = handler.apply(that, args);
                  if (returned === deferred2.promise()) {
                    throw new TypeError("Thenable self-resolution");
                  }
                  then = returned && // Support: Promises/A+ section 2.3.4
                  // https://promisesaplus.com/#point-64
                  // Only check objects and functions for thenability
                  (typeof returned === "object" || typeof returned === "function") && returned.then;
                  if (typeof then === "function") {
                    if (special) {
                      then.call(
                        returned,
                        resolve(maxDepth, deferred2, Identity, special),
                        resolve(maxDepth, deferred2, Thrower, special)
                      );
                    } else {
                      maxDepth++;
                      then.call(
                        returned,
                        resolve(maxDepth, deferred2, Identity, special),
                        resolve(maxDepth, deferred2, Thrower, special),
                        resolve(
                          maxDepth,
                          deferred2,
                          Identity,
                          deferred2.notifyWith
                        )
                      );
                    }
                  } else {
                    if (handler !== Identity) {
                      that = void 0;
                      args = [returned];
                    }
                    (special || deferred2.resolveWith)(that, args);
                  }
                }, process = special ? mightThrow : function() {
                  try {
                    mightThrow();
                  } catch (e) {
                    if (jQuery2.Deferred.exceptionHook) {
                      jQuery2.Deferred.exceptionHook(
                        e,
                        process.error
                      );
                    }
                    if (depth + 1 >= maxDepth) {
                      if (handler !== Thrower) {
                        that = void 0;
                        args = [e];
                      }
                      deferred2.rejectWith(that, args);
                    }
                  }
                };
                if (depth) {
                  process();
                } else {
                  if (jQuery2.Deferred.getErrorHook) {
                    process.error = jQuery2.Deferred.getErrorHook();
                  }
                  window2.setTimeout(process);
                }
              };
            }
            return jQuery2.Deferred(function(newDefer) {
              tuples[0][3].add(
                resolve(
                  0,
                  newDefer,
                  typeof onProgress === "function" ? onProgress : Identity,
                  newDefer.notifyWith
                )
              );
              tuples[1][3].add(
                resolve(
                  0,
                  newDefer,
                  typeof onFulfilled === "function" ? onFulfilled : Identity
                )
              );
              tuples[2][3].add(
                resolve(
                  0,
                  newDefer,
                  typeof onRejected === "function" ? onRejected : Thrower
                )
              );
            }).promise();
          },
          // Get a promise for this deferred
          // If obj is provided, the promise aspect is added to the object
          promise: function(obj) {
            return obj != null ? jQuery2.extend(obj, promise) : promise;
          }
        }, deferred = {};
        jQuery2.each(tuples, function(i2, tuple) {
          var list = tuple[2], stateString = tuple[5];
          promise[tuple[1]] = list.add;
          if (stateString) {
            list.add(
              function() {
                state = stateString;
              },
              // rejected_callbacks.disable
              // fulfilled_callbacks.disable
              tuples[3 - i2][2].disable,
              // rejected_handlers.disable
              // fulfilled_handlers.disable
              tuples[3 - i2][3].disable,
              // progress_callbacks.lock
              tuples[0][2].lock,
              // progress_handlers.lock
              tuples[0][3].lock
            );
          }
          list.add(tuple[3].fire);
          deferred[tuple[0]] = function() {
            deferred[tuple[0] + "With"](this === deferred ? void 0 : this, arguments);
            return this;
          };
          deferred[tuple[0] + "With"] = list.fireWith;
        });
        promise.promise(deferred);
        if (func) {
          func.call(deferred, deferred);
        }
        return deferred;
      },
      // Deferred helper
      when: function(singleValue) {
        var remaining = arguments.length, i2 = remaining, resolveContexts = Array(i2), resolveValues = slice.call(arguments), primary = jQuery2.Deferred(), updateFunc = function(i3) {
          return function(value) {
            resolveContexts[i3] = this;
            resolveValues[i3] = arguments.length > 1 ? slice.call(arguments) : value;
            if (!--remaining) {
              primary.resolveWith(resolveContexts, resolveValues);
            }
          };
        };
        if (remaining <= 1) {
          adoptValue(
            singleValue,
            primary.done(updateFunc(i2)).resolve,
            primary.reject,
            !remaining
          );
          if (primary.state() === "pending" || typeof (resolveValues[i2] && resolveValues[i2].then) === "function") {
            return primary.then();
          }
        }
        while (i2--) {
          adoptValue(resolveValues[i2], updateFunc(i2), primary.reject);
        }
        return primary.promise();
      }
    });
    var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
    jQuery2.Deferred.exceptionHook = function(error, asyncError) {
      if (error && rerrorNames.test(error.name)) {
        window2.console.warn(
          "jQuery.Deferred exception",
          error,
          asyncError
        );
      }
    };
    jQuery2.readyException = function(error) {
      window2.setTimeout(function() {
        throw error;
      });
    };
    var readyList = jQuery2.Deferred();
    jQuery2.fn.ready = function(fn) {
      readyList.then(fn).catch(function(error) {
        jQuery2.readyException(error);
      });
      return this;
    };
    jQuery2.extend({
      // Is the DOM ready to be used? Set to true once it occurs.
      isReady: false,
      // A counter to track how many items to wait for before
      // the ready event fires. See trac-6781
      readyWait: 1,
      // Handle when the DOM is ready
      ready: function(wait) {
        if (wait === true ? --jQuery2.readyWait : jQuery2.isReady) {
          return;
        }
        jQuery2.isReady = true;
        if (wait !== true && --jQuery2.readyWait > 0) {
          return;
        }
        readyList.resolveWith(document$1, [jQuery2]);
      }
    });
    jQuery2.ready.then = readyList.then;
    function completed() {
      document$1.removeEventListener("DOMContentLoaded", completed);
      window2.removeEventListener("load", completed);
      jQuery2.ready();
    }
    if (document$1.readyState !== "loading") {
      window2.setTimeout(jQuery2.ready);
    } else {
      document$1.addEventListener("DOMContentLoaded", completed);
      window2.addEventListener("load", completed);
    }
    var rdashAlpha = /-([a-z])/g;
    function fcamelCase(_all, letter) {
      return letter.toUpperCase();
    }
    function camelCase(string) {
      return string.replace(rdashAlpha, fcamelCase);
    }
    function acceptData(owner) {
      return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
    }
    function Data() {
      this.expando = jQuery2.expando + Data.uid++;
    }
    Data.uid = 1;
    Data.prototype = {
      cache: function(owner) {
        var value = owner[this.expando];
        if (!value) {
          value = /* @__PURE__ */ Object.create(null);
          if (acceptData(owner)) {
            if (owner.nodeType) {
              owner[this.expando] = value;
            } else {
              Object.defineProperty(owner, this.expando, {
                value,
                configurable: true
              });
            }
          }
        }
        return value;
      },
      set: function(owner, data, value) {
        var prop, cache = this.cache(owner);
        if (typeof data === "string") {
          cache[camelCase(data)] = value;
        } else {
          for (prop in data) {
            cache[camelCase(prop)] = data[prop];
          }
        }
        return value;
      },
      get: function(owner, key) {
        return key === void 0 ? this.cache(owner) : (
          // Always use camelCase key (gh-2257)
          owner[this.expando] && owner[this.expando][camelCase(key)]
        );
      },
      access: function(owner, key, value) {
        if (key === void 0 || key && typeof key === "string" && value === void 0) {
          return this.get(owner, key);
        }
        this.set(owner, key, value);
        return value !== void 0 ? value : key;
      },
      remove: function(owner, key) {
        var i2, cache = owner[this.expando];
        if (cache === void 0) {
          return;
        }
        if (key !== void 0) {
          if (Array.isArray(key)) {
            key = key.map(camelCase);
          } else {
            key = camelCase(key);
            key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
          }
          i2 = key.length;
          while (i2--) {
            delete cache[key[i2]];
          }
        }
        if (key === void 0 || jQuery2.isEmptyObject(cache)) {
          if (owner.nodeType) {
            owner[this.expando] = void 0;
          } else {
            delete owner[this.expando];
          }
        }
      },
      hasData: function(owner) {
        var cache = owner[this.expando];
        return cache !== void 0 && !jQuery2.isEmptyObject(cache);
      }
    };
    var dataPriv = new Data();
    var dataUser = new Data();
    var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
    function getData(data) {
      if (data === "true") {
        return true;
      }
      if (data === "false") {
        return false;
      }
      if (data === "null") {
        return null;
      }
      if (data === +data + "") {
        return +data;
      }
      if (rbrace.test(data)) {
        return JSON.parse(data);
      }
      return data;
    }
    function dataAttr(elem, key, data) {
      var name;
      if (data === void 0 && elem.nodeType === 1) {
        name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
        data = elem.getAttribute(name);
        if (typeof data === "string") {
          try {
            data = getData(data);
          } catch (e) {
          }
          dataUser.set(elem, key, data);
        } else {
          data = void 0;
        }
      }
      return data;
    }
    jQuery2.extend({
      hasData: function(elem) {
        return dataUser.hasData(elem) || dataPriv.hasData(elem);
      },
      data: function(elem, name, data) {
        return dataUser.access(elem, name, data);
      },
      removeData: function(elem, name) {
        dataUser.remove(elem, name);
      },
      // TODO: Now that all calls to _data and _removeData have been replaced
      // with direct calls to dataPriv methods, these can be deprecated.
      _data: function(elem, name, data) {
        return dataPriv.access(elem, name, data);
      },
      _removeData: function(elem, name) {
        dataPriv.remove(elem, name);
      }
    });
    jQuery2.fn.extend({
      data: function(key, value) {
        var i2, name, data, elem = this[0], attrs = elem && elem.attributes;
        if (key === void 0) {
          if (this.length) {
            data = dataUser.get(elem);
            if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
              i2 = attrs.length;
              while (i2--) {
                if (attrs[i2]) {
                  name = attrs[i2].name;
                  if (name.indexOf("data-") === 0) {
                    name = camelCase(name.slice(5));
                    dataAttr(elem, name, data[name]);
                  }
                }
              }
              dataPriv.set(elem, "hasDataAttrs", true);
            }
          }
          return data;
        }
        if (typeof key === "object") {
          return this.each(function() {
            dataUser.set(this, key);
          });
        }
        return access(this, function(value2) {
          var data2;
          if (elem && value2 === void 0) {
            data2 = dataUser.get(elem, key);
            if (data2 !== void 0) {
              return data2;
            }
            data2 = dataAttr(elem, key);
            if (data2 !== void 0) {
              return data2;
            }
            return;
          }
          this.each(function() {
            dataUser.set(this, key, value2);
          });
        }, null, value, arguments.length > 1, null, true);
      },
      removeData: function(key) {
        return this.each(function() {
          dataUser.remove(this, key);
        });
      }
    });
    jQuery2.extend({
      queue: function(elem, type, data) {
        var queue;
        if (elem) {
          type = (type || "fx") + "queue";
          queue = dataPriv.get(elem, type);
          if (data) {
            if (!queue || Array.isArray(data)) {
              queue = dataPriv.set(elem, type, jQuery2.makeArray(data));
            } else {
              queue.push(data);
            }
          }
          return queue || [];
        }
      },
      dequeue: function(elem, type) {
        type = type || "fx";
        var queue = jQuery2.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery2._queueHooks(elem, type), next = function() {
          jQuery2.dequeue(elem, type);
        };
        if (fn === "inprogress") {
          fn = queue.shift();
          startLength--;
        }
        if (fn) {
          if (type === "fx") {
            queue.unshift("inprogress");
          }
          delete hooks.stop;
          fn.call(elem, next, hooks);
        }
        if (!startLength && hooks) {
          hooks.empty.fire();
        }
      },
      // Not public - generate a queueHooks object, or return the current one
      _queueHooks: function(elem, type) {
        var key = type + "queueHooks";
        return dataPriv.get(elem, key) || dataPriv.set(elem, key, {
          empty: jQuery2.Callbacks("once memory").add(function() {
            dataPriv.remove(elem, [type + "queue", key]);
          })
        });
      }
    });
    jQuery2.fn.extend({
      queue: function(type, data) {
        var setter = 2;
        if (typeof type !== "string") {
          data = type;
          type = "fx";
          setter--;
        }
        if (arguments.length < setter) {
          return jQuery2.queue(this[0], type);
        }
        return data === void 0 ? this : this.each(function() {
          var queue = jQuery2.queue(this, type, data);
          jQuery2._queueHooks(this, type);
          if (type === "fx" && queue[0] !== "inprogress") {
            jQuery2.dequeue(this, type);
          }
        });
      },
      dequeue: function(type) {
        return this.each(function() {
          jQuery2.dequeue(this, type);
        });
      },
      clearQueue: function(type) {
        return this.queue(type || "fx", []);
      },
      // Get a promise resolved when queues of a certain type
      // are emptied (fx is the type by default)
      promise: function(type, obj) {
        var tmp, count = 1, defer = jQuery2.Deferred(), elements = this, i2 = this.length, resolve = function() {
          if (!--count) {
            defer.resolveWith(elements, [elements]);
          }
        };
        if (typeof type !== "string") {
          obj = type;
          type = void 0;
        }
        type = type || "fx";
        while (i2--) {
          tmp = dataPriv.get(elements[i2], type + "queueHooks");
          if (tmp && tmp.empty) {
            count++;
            tmp.empty.add(resolve);
          }
        }
        resolve();
        return defer.promise(obj);
      }
    });
    var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
    var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");
    var cssExpand = ["Top", "Right", "Bottom", "Left"];
    function isHiddenWithinTree(elem, el) {
      elem = el || elem;
      return elem.style.display === "none" || elem.style.display === "" && jQuery2.css(elem, "display") === "none";
    }
    var ralphaStart = /^[a-z]/, rautoPx = /^(?:Border(?:Top|Right|Bottom|Left)?(?:Width|)|(?:Margin|Padding)?(?:Top|Right|Bottom|Left)?|(?:Min|Max)?(?:Width|Height))$/;
    function isAutoPx(prop) {
      return ralphaStart.test(prop) && rautoPx.test(prop[0].toUpperCase() + prop.slice(1));
    }
    function adjustCSS(elem, prop, valueParts, tween) {
      var adjusted, scale, maxIterations = 20, currentValue = tween ? function() {
        return tween.cur();
      } : function() {
        return jQuery2.css(elem, prop, "");
      }, initial = currentValue(), unit = valueParts && valueParts[3] || (isAutoPx(prop) ? "px" : ""), initialInUnit = elem.nodeType && (!isAutoPx(prop) || unit !== "px" && +initial) && rcssNum.exec(jQuery2.css(elem, prop));
      if (initialInUnit && initialInUnit[3] !== unit) {
        initial = initial / 2;
        unit = unit || initialInUnit[3];
        initialInUnit = +initial || 1;
        while (maxIterations--) {
          jQuery2.style(elem, prop, initialInUnit + unit);
          if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
            maxIterations = 0;
          }
          initialInUnit = initialInUnit / scale;
        }
        initialInUnit = initialInUnit * 2;
        jQuery2.style(elem, prop, initialInUnit + unit);
        valueParts = valueParts || [];
      }
      if (valueParts) {
        initialInUnit = +initialInUnit || +initial || 0;
        adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
        if (tween) {
          tween.unit = unit;
          tween.start = initialInUnit;
          tween.end = adjusted;
        }
      }
      return adjusted;
    }
    var rmsPrefix = /^-ms-/;
    function cssCamelCase(string) {
      return camelCase(string.replace(rmsPrefix, "ms-"));
    }
    var defaultDisplayMap = {};
    function getDefaultDisplay(elem) {
      var temp, doc = elem.ownerDocument, nodeName2 = elem.nodeName, display = defaultDisplayMap[nodeName2];
      if (display) {
        return display;
      }
      temp = doc.body.appendChild(doc.createElement(nodeName2));
      display = jQuery2.css(temp, "display");
      temp.parentNode.removeChild(temp);
      if (display === "none") {
        display = "block";
      }
      defaultDisplayMap[nodeName2] = display;
      return display;
    }
    function showHide(elements, show) {
      var display, elem, values = [], index = 0, length = elements.length;
      for (; index < length; index++) {
        elem = elements[index];
        if (!elem.style) {
          continue;
        }
        display = elem.style.display;
        if (show) {
          if (display === "none") {
            values[index] = dataPriv.get(elem, "display") || null;
            if (!values[index]) {
              elem.style.display = "";
            }
          }
          if (elem.style.display === "" && isHiddenWithinTree(elem)) {
            values[index] = getDefaultDisplay(elem);
          }
        } else {
          if (display !== "none") {
            values[index] = "none";
            dataPriv.set(elem, "display", display);
          }
        }
      }
      for (index = 0; index < length; index++) {
        if (values[index] != null) {
          elements[index].style.display = values[index];
        }
      }
      return elements;
    }
    jQuery2.fn.extend({
      show: function() {
        return showHide(this, true);
      },
      hide: function() {
        return showHide(this);
      },
      toggle: function(state) {
        if (typeof state === "boolean") {
          return state ? this.show() : this.hide();
        }
        return this.each(function() {
          if (isHiddenWithinTree(this)) {
            jQuery2(this).show();
          } else {
            jQuery2(this).hide();
          }
        });
      }
    });
    var isAttached = function(elem) {
      return jQuery2.contains(elem.ownerDocument, elem) || elem.getRootNode(composed) === elem.ownerDocument;
    }, composed = { composed: true };
    if (!documentElement$1.getRootNode) {
      isAttached = function(elem) {
        return jQuery2.contains(elem.ownerDocument, elem);
      };
    }
    var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
    var wrapMap = {
      // Table parts need to be wrapped with `<table>` or they're
      // stripped to their contents when put in a div.
      // XHTML parsers do not magically insert elements in the
      // same way that tag soup parsers do, so we cannot shorten
      // this by omitting <tbody> or other required elements.
      thead: ["table"],
      col: ["colgroup", "table"],
      tr: ["tbody", "table"],
      td: ["tr", "tbody", "table"]
    };
    wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
    wrapMap.th = wrapMap.td;
    function getAll(context, tag) {
      var ret;
      if (typeof context.getElementsByTagName !== "undefined") {
        ret = arr.slice.call(context.getElementsByTagName(tag || "*"));
      } else if (typeof context.querySelectorAll !== "undefined") {
        ret = context.querySelectorAll(tag || "*");
      } else {
        ret = [];
      }
      if (tag === void 0 || tag && nodeName(context, tag)) {
        return jQuery2.merge([context], ret);
      }
      return ret;
    }
    var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;
    function setGlobalEval(elems, refElements) {
      var i2 = 0, l = elems.length;
      for (; i2 < l; i2++) {
        dataPriv.set(
          elems[i2],
          "globalEval",
          !refElements || dataPriv.get(refElements[i2], "globalEval")
        );
      }
    }
    var rhtml = /<|&#?\w+;/;
    function buildFragment(elems, context, scripts, selection, ignored) {
      var elem, tmp, tag, wrap2, attached, j, fragment = context.createDocumentFragment(), nodes = [], i2 = 0, l = elems.length;
      for (; i2 < l; i2++) {
        elem = elems[i2];
        if (elem || elem === 0) {
          if (toType(elem) === "object" && (elem.nodeType || isArrayLike(elem))) {
            jQuery2.merge(nodes, elem.nodeType ? [elem] : elem);
          } else if (!rhtml.test(elem)) {
            nodes.push(context.createTextNode(elem));
          } else {
            tmp = tmp || fragment.appendChild(context.createElement("div"));
            tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
            wrap2 = wrapMap[tag] || arr;
            j = wrap2.length;
            while (--j > -1) {
              tmp = tmp.appendChild(context.createElement(wrap2[j]));
            }
            tmp.innerHTML = jQuery2.htmlPrefilter(elem);
            jQuery2.merge(nodes, tmp.childNodes);
            tmp = fragment.firstChild;
            tmp.textContent = "";
          }
        }
      }
      fragment.textContent = "";
      i2 = 0;
      while (elem = nodes[i2++]) {
        if (selection && jQuery2.inArray(elem, selection) > -1) {
          if (ignored) {
            ignored.push(elem);
          }
          continue;
        }
        attached = isAttached(elem);
        tmp = getAll(fragment.appendChild(elem), "script");
        if (attached) {
          setGlobalEval(tmp);
        }
        if (scripts) {
          j = 0;
          while (elem = tmp[j++]) {
            if (rscriptType.test(elem.type || "")) {
              scripts.push(elem);
            }
          }
        }
      }
      return fragment;
    }
    function disableScript(elem) {
      elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
      return elem;
    }
    function restoreScript(elem) {
      if ((elem.type || "").slice(0, 5) === "true/") {
        elem.type = elem.type.slice(5);
      } else {
        elem.removeAttribute("type");
      }
      return elem;
    }
    function domManip(collection, args, callback, ignored) {
      args = flat(args);
      var fragment, first, scripts, hasScripts, node, doc, i2 = 0, l = collection.length, iNoClone = l - 1, value = args[0], valueIsFunction = typeof value === "function";
      if (valueIsFunction) {
        return collection.each(function(index) {
          var self2 = collection.eq(index);
          args[0] = value.call(this, index, self2.html());
          domManip(self2, args, callback, ignored);
        });
      }
      if (l) {
        fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
        first = fragment.firstChild;
        if (fragment.childNodes.length === 1) {
          fragment = first;
        }
        if (first || ignored) {
          scripts = jQuery2.map(getAll(fragment, "script"), disableScript);
          hasScripts = scripts.length;
          for (; i2 < l; i2++) {
            node = fragment;
            if (i2 !== iNoClone) {
              node = jQuery2.clone(node, true, true);
              if (hasScripts) {
                jQuery2.merge(scripts, getAll(node, "script"));
              }
            }
            callback.call(collection[i2], node, i2);
          }
          if (hasScripts) {
            doc = scripts[scripts.length - 1].ownerDocument;
            jQuery2.map(scripts, restoreScript);
            for (i2 = 0; i2 < hasScripts; i2++) {
              node = scripts[i2];
              if (rscriptType.test(node.type || "") && !dataPriv.get(node, "globalEval") && jQuery2.contains(doc, node)) {
                if (node.src && (node.type || "").toLowerCase() !== "module") {
                  if (jQuery2._evalUrl && !node.noModule) {
                    jQuery2._evalUrl(node.src, {
                      nonce: node.nonce,
                      crossOrigin: node.crossOrigin
                    }, doc);
                  }
                } else {
                  DOMEval(node.textContent, node, doc);
                }
              }
            }
          }
        }
      }
      return collection;
    }
    var rcheckableType = /^(?:checkbox|radio)$/i;
    var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
    function returnTrue() {
      return true;
    }
    function returnFalse() {
      return false;
    }
    function on(elem, types, selector, data, fn, one) {
      var origFn, type;
      if (typeof types === "object") {
        if (typeof selector !== "string") {
          data = data || selector;
          selector = void 0;
        }
        for (type in types) {
          on(elem, type, selector, data, types[type], one);
        }
        return elem;
      }
      if (data == null && fn == null) {
        fn = selector;
        data = selector = void 0;
      } else if (fn == null) {
        if (typeof selector === "string") {
          fn = data;
          data = void 0;
        } else {
          fn = data;
          data = selector;
          selector = void 0;
        }
      }
      if (fn === false) {
        fn = returnFalse;
      } else if (!fn) {
        return elem;
      }
      if (one === 1) {
        origFn = fn;
        fn = function(event) {
          jQuery2().off(event);
          return origFn.apply(this, arguments);
        };
        fn.guid = origFn.guid || (origFn.guid = jQuery2.guid++);
      }
      return elem.each(function() {
        jQuery2.event.add(this, types, fn, data, selector);
      });
    }
    jQuery2.event = {
      add: function(elem, types, handler, data, selector) {
        var handleObjIn, eventHandle, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.get(elem);
        if (!acceptData(elem)) {
          return;
        }
        if (handler.handler) {
          handleObjIn = handler;
          handler = handleObjIn.handler;
          selector = handleObjIn.selector;
        }
        if (selector) {
          jQuery2.find.matchesSelector(documentElement$1, selector);
        }
        if (!handler.guid) {
          handler.guid = jQuery2.guid++;
        }
        if (!(events = elemData.events)) {
          events = elemData.events = /* @__PURE__ */ Object.create(null);
        }
        if (!(eventHandle = elemData.handle)) {
          eventHandle = elemData.handle = function(e) {
            return typeof jQuery2 !== "undefined" && jQuery2.event.triggered !== e.type ? jQuery2.event.dispatch.apply(elem, arguments) : void 0;
          };
        }
        types = (types || "").match(rnothtmlwhite) || [""];
        t = types.length;
        while (t--) {
          tmp = rtypenamespace.exec(types[t]) || [];
          type = origType = tmp[1];
          namespaces = (tmp[2] || "").split(".").sort();
          if (!type) {
            continue;
          }
          special = jQuery2.event.special[type] || {};
          type = (selector ? special.delegateType : special.bindType) || type;
          special = jQuery2.event.special[type] || {};
          handleObj = jQuery2.extend({
            type,
            origType,
            data,
            handler,
            guid: handler.guid,
            selector,
            needsContext: selector && jQuery2.expr.match.needsContext.test(selector),
            namespace: namespaces.join(".")
          }, handleObjIn);
          if (!(handlers = events[type])) {
            handlers = events[type] = [];
            handlers.delegateCount = 0;
            if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
              if (elem.addEventListener) {
                elem.addEventListener(type, eventHandle);
              }
            }
          }
          if (special.add) {
            special.add.call(elem, handleObj);
            if (!handleObj.handler.guid) {
              handleObj.handler.guid = handler.guid;
            }
          }
          if (selector) {
            handlers.splice(handlers.delegateCount++, 0, handleObj);
          } else {
            handlers.push(handleObj);
          }
        }
      },
      // Detach an event or set of events from an element
      remove: function(elem, types, handler, selector, mappedTypes) {
        var j, origCount, tmp, events, t, handleObj, special, handlers, type, namespaces, origType, elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
        if (!elemData || !(events = elemData.events)) {
          return;
        }
        types = (types || "").match(rnothtmlwhite) || [""];
        t = types.length;
        while (t--) {
          tmp = rtypenamespace.exec(types[t]) || [];
          type = origType = tmp[1];
          namespaces = (tmp[2] || "").split(".").sort();
          if (!type) {
            for (type in events) {
              jQuery2.event.remove(elem, type + types[t], handler, selector, true);
            }
            continue;
          }
          special = jQuery2.event.special[type] || {};
          type = (selector ? special.delegateType : special.bindType) || type;
          handlers = events[type] || [];
          tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");
          origCount = j = handlers.length;
          while (j--) {
            handleObj = handlers[j];
            if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
              handlers.splice(j, 1);
              if (handleObj.selector) {
                handlers.delegateCount--;
              }
              if (special.remove) {
                special.remove.call(elem, handleObj);
              }
            }
          }
          if (origCount && !handlers.length) {
            if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
              jQuery2.removeEvent(elem, type, elemData.handle);
            }
            delete events[type];
          }
        }
        if (jQuery2.isEmptyObject(events)) {
          dataPriv.remove(elem, "handle events");
        }
      },
      dispatch: function(nativeEvent) {
        var i2, j, ret, matched, handleObj, handlerQueue, args = new Array(arguments.length), event = jQuery2.event.fix(nativeEvent), handlers = (dataPriv.get(this, "events") || /* @__PURE__ */ Object.create(null))[event.type] || [], special = jQuery2.event.special[event.type] || {};
        args[0] = event;
        for (i2 = 1; i2 < arguments.length; i2++) {
          args[i2] = arguments[i2];
        }
        event.delegateTarget = this;
        if (special.preDispatch && special.preDispatch.call(this, event) === false) {
          return;
        }
        handlerQueue = jQuery2.event.handlers.call(this, event, handlers);
        i2 = 0;
        while ((matched = handlerQueue[i2++]) && !event.isPropagationStopped()) {
          event.currentTarget = matched.elem;
          j = 0;
          while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
            if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
              event.handleObj = handleObj;
              event.data = handleObj.data;
              ret = ((jQuery2.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
              if (ret !== void 0) {
                if ((event.result = ret) === false) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }
            }
          }
        }
        if (special.postDispatch) {
          special.postDispatch.call(this, event);
        }
        return event.result;
      },
      handlers: function(event, handlers) {
        var i2, handleObj, sel, matchedHandlers, matchedSelectors, handlerQueue = [], delegateCount = handlers.delegateCount, cur = event.target;
        if (delegateCount && // Support: Firefox <=42 - 66+
        // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
        // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
        // Support: IE 11+
        // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
        !(event.type === "click" && event.button >= 1)) {
          for (; cur !== this; cur = cur.parentNode || this) {
            if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
              matchedHandlers = [];
              matchedSelectors = {};
              for (i2 = 0; i2 < delegateCount; i2++) {
                handleObj = handlers[i2];
                sel = handleObj.selector + " ";
                if (matchedSelectors[sel] === void 0) {
                  matchedSelectors[sel] = handleObj.needsContext ? jQuery2(sel, this).index(cur) > -1 : jQuery2.find(sel, this, null, [cur]).length;
                }
                if (matchedSelectors[sel]) {
                  matchedHandlers.push(handleObj);
                }
              }
              if (matchedHandlers.length) {
                handlerQueue.push({ elem: cur, handlers: matchedHandlers });
              }
            }
          }
        }
        cur = this;
        if (delegateCount < handlers.length) {
          handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
        }
        return handlerQueue;
      },
      addProp: function(name, hook) {
        Object.defineProperty(jQuery2.Event.prototype, name, {
          enumerable: true,
          configurable: true,
          get: typeof hook === "function" ? function() {
            if (this.originalEvent) {
              return hook(this.originalEvent);
            }
          } : function() {
            if (this.originalEvent) {
              return this.originalEvent[name];
            }
          },
          set: function(value) {
            Object.defineProperty(this, name, {
              enumerable: true,
              configurable: true,
              writable: true,
              value
            });
          }
        });
      },
      fix: function(originalEvent) {
        return originalEvent[jQuery2.expando] ? originalEvent : new jQuery2.Event(originalEvent);
      },
      special: jQuery2.extend(/* @__PURE__ */ Object.create(null), {
        load: {
          // Prevent triggered image.load events from bubbling to window.load
          noBubble: true
        },
        click: {
          // Utilize native event to ensure correct state for checkable inputs
          setup: function(data) {
            var el = this || data;
            if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
              leverageNative(el, "click", true);
            }
            return false;
          },
          trigger: function(data) {
            var el = this || data;
            if (rcheckableType.test(el.type) && el.click && nodeName(el, "input")) {
              leverageNative(el, "click");
            }
            return true;
          },
          // For cross-browser consistency, suppress native .click() on links
          // Also prevent it if we're currently inside a leveraged native-event stack
          _default: function(event) {
            var target = event.target;
            return rcheckableType.test(target.type) && target.click && nodeName(target, "input") && dataPriv.get(target, "click") || nodeName(target, "a");
          }
        },
        beforeunload: {
          postDispatch: function(event) {
            if (event.result !== void 0) {
              event.preventDefault();
            }
          }
        }
      })
    };
    function leverageNative(el, type, isSetup) {
      if (!isSetup) {
        if (dataPriv.get(el, type) === void 0) {
          jQuery2.event.add(el, type, returnTrue);
        }
        return;
      }
      dataPriv.set(el, type, false);
      jQuery2.event.add(el, type, {
        namespace: false,
        handler: function(event) {
          var result, saved = dataPriv.get(this, type);
          if (event.isTrigger & 1 && this[type]) {
            if (!saved.length) {
              saved = slice.call(arguments);
              dataPriv.set(this, type, saved);
              this[type]();
              result = dataPriv.get(this, type);
              dataPriv.set(this, type, false);
              if (saved !== result) {
                event.stopImmediatePropagation();
                event.preventDefault();
                return result && result.value;
              }
            } else if ((jQuery2.event.special[type] || {}).delegateType) {
              event.stopPropagation();
            }
          } else if (saved.length) {
            dataPriv.set(this, type, {
              value: jQuery2.event.trigger(
                saved[0],
                saved.slice(1),
                this
              )
            });
            event.stopPropagation();
            event.isImmediatePropagationStopped = returnTrue;
          }
        }
      });
    }
    jQuery2.removeEvent = function(elem, type, handle) {
      if (elem.removeEventListener) {
        elem.removeEventListener(type, handle);
      }
    };
    jQuery2.Event = function(src, props) {
      if (!(this instanceof jQuery2.Event)) {
        return new jQuery2.Event(src, props);
      }
      if (src && src.type) {
        this.originalEvent = src;
        this.type = src.type;
        this.isDefaultPrevented = src.defaultPrevented ? returnTrue : returnFalse;
        this.target = src.target;
        this.currentTarget = src.currentTarget;
        this.relatedTarget = src.relatedTarget;
      } else {
        this.type = src;
      }
      if (props) {
        jQuery2.extend(this, props);
      }
      this.timeStamp = src && src.timeStamp || Date.now();
      this[jQuery2.expando] = true;
    };
    jQuery2.Event.prototype = {
      constructor: jQuery2.Event,
      isDefaultPrevented: returnFalse,
      isPropagationStopped: returnFalse,
      isImmediatePropagationStopped: returnFalse,
      isSimulated: false,
      preventDefault: function() {
        var e = this.originalEvent;
        this.isDefaultPrevented = returnTrue;
        if (e && !this.isSimulated) {
          e.preventDefault();
        }
      },
      stopPropagation: function() {
        var e = this.originalEvent;
        this.isPropagationStopped = returnTrue;
        if (e && !this.isSimulated) {
          e.stopPropagation();
        }
      },
      stopImmediatePropagation: function() {
        var e = this.originalEvent;
        this.isImmediatePropagationStopped = returnTrue;
        if (e && !this.isSimulated) {
          e.stopImmediatePropagation();
        }
        this.stopPropagation();
      }
    };
    jQuery2.each({
      altKey: true,
      bubbles: true,
      cancelable: true,
      changedTouches: true,
      ctrlKey: true,
      detail: true,
      eventPhase: true,
      metaKey: true,
      pageX: true,
      pageY: true,
      shiftKey: true,
      view: true,
      "char": true,
      code: true,
      charCode: true,
      key: true,
      keyCode: true,
      button: true,
      buttons: true,
      clientX: true,
      clientY: true,
      offsetX: true,
      offsetY: true,
      pointerId: true,
      pointerType: true,
      screenX: true,
      screenY: true,
      targetTouches: true,
      toElement: true,
      touches: true,
      which: true
    }, jQuery2.event.addProp);
    jQuery2.each({ focus: "focusin", blur: "focusout" }, function(type, delegateType) {
      function focusMappedHandler(nativeEvent) {
        var event = jQuery2.event.fix(nativeEvent);
        event.type = nativeEvent.type === "focusin" ? "focus" : "blur";
        event.isSimulated = true;
        if (event.target === event.currentTarget) {
          dataPriv.get(this, "handle")(event);
        }
      }
      jQuery2.event.special[type] = {
        // Utilize native event if possible so blur/focus sequence is correct
        setup: function() {
          leverageNative(this, type, true);
          if (isIE) {
            this.addEventListener(delegateType, focusMappedHandler);
          } else {
            return false;
          }
        },
        trigger: function() {
          leverageNative(this, type);
          return true;
        },
        teardown: function() {
          if (isIE) {
            this.removeEventListener(delegateType, focusMappedHandler);
          } else {
            return false;
          }
        },
        // Suppress native focus or blur if we're currently inside
        // a leveraged native-event stack
        _default: function(event) {
          return dataPriv.get(event.target, type);
        },
        delegateType
      };
    });
    jQuery2.each({
      mouseenter: "mouseover",
      mouseleave: "mouseout",
      pointerenter: "pointerover",
      pointerleave: "pointerout"
    }, function(orig, fix) {
      jQuery2.event.special[orig] = {
        delegateType: fix,
        bindType: fix,
        handle: function(event) {
          var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
          if (!related || related !== target && !jQuery2.contains(target, related)) {
            event.type = handleObj.origType;
            ret = handleObj.handler.apply(this, arguments);
            event.type = fix;
          }
          return ret;
        }
      };
    });
    jQuery2.fn.extend({
      on: function(types, selector, data, fn) {
        return on(this, types, selector, data, fn);
      },
      one: function(types, selector, data, fn) {
        return on(this, types, selector, data, fn, 1);
      },
      off: function(types, selector, fn) {
        var handleObj, type;
        if (types && types.preventDefault && types.handleObj) {
          handleObj = types.handleObj;
          jQuery2(types.delegateTarget).off(
            handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
            handleObj.selector,
            handleObj.handler
          );
          return this;
        }
        if (typeof types === "object") {
          for (type in types) {
            this.off(type, selector, types[type]);
          }
          return this;
        }
        if (selector === false || typeof selector === "function") {
          fn = selector;
          selector = void 0;
        }
        if (fn === false) {
          fn = returnFalse;
        }
        return this.each(function() {
          jQuery2.event.remove(this, types, fn, selector);
        });
      }
    });
    var rnoInnerhtml = /<script|<style|<link/i;
    function manipulationTarget(elem, content) {
      if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {
        return jQuery2(elem).children("tbody")[0] || elem;
      }
      return elem;
    }
    function cloneCopyEvent(src, dest) {
      var type, i2, l, events = dataPriv.get(src, "events");
      if (dest.nodeType !== 1) {
        return;
      }
      if (events) {
        dataPriv.remove(dest, "handle events");
        for (type in events) {
          for (i2 = 0, l = events[type].length; i2 < l; i2++) {
            jQuery2.event.add(dest, type, events[type][i2]);
          }
        }
      }
      if (dataUser.hasData(src)) {
        dataUser.set(dest, jQuery2.extend({}, dataUser.get(src)));
      }
    }
    function remove(elem, selector, keepData) {
      var node, nodes = selector ? jQuery2.filter(selector, elem) : elem, i2 = 0;
      for (; (node = nodes[i2]) != null; i2++) {
        if (!keepData && node.nodeType === 1) {
          jQuery2.cleanData(getAll(node));
        }
        if (node.parentNode) {
          if (keepData && isAttached(node)) {
            setGlobalEval(getAll(node, "script"));
          }
          node.parentNode.removeChild(node);
        }
      }
      return elem;
    }
    jQuery2.extend({
      htmlPrefilter: function(html) {
        return html;
      },
      clone: function(elem, dataAndEvents, deepDataAndEvents) {
        var i2, l, srcElements, destElements, clone = elem.cloneNode(true), inPage = isAttached(elem);
        if (isIE && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery2.isXMLDoc(elem)) {
          destElements = getAll(clone);
          srcElements = getAll(elem);
          for (i2 = 0, l = srcElements.length; i2 < l; i2++) {
            if (nodeName(destElements[i2], "textarea")) {
              destElements[i2].defaultValue = srcElements[i2].defaultValue;
            }
          }
        }
        if (dataAndEvents) {
          if (deepDataAndEvents) {
            srcElements = srcElements || getAll(elem);
            destElements = destElements || getAll(clone);
            for (i2 = 0, l = srcElements.length; i2 < l; i2++) {
              cloneCopyEvent(srcElements[i2], destElements[i2]);
            }
          } else {
            cloneCopyEvent(elem, clone);
          }
        }
        destElements = getAll(clone, "script");
        if (destElements.length > 0) {
          setGlobalEval(destElements, !inPage && getAll(elem, "script"));
        }
        return clone;
      },
      cleanData: function(elems) {
        var data, elem, type, special = jQuery2.event.special, i2 = 0;
        for (; (elem = elems[i2]) !== void 0; i2++) {
          if (acceptData(elem)) {
            if (data = elem[dataPriv.expando]) {
              if (data.events) {
                for (type in data.events) {
                  if (special[type]) {
                    jQuery2.event.remove(elem, type);
                  } else {
                    jQuery2.removeEvent(elem, type, data.handle);
                  }
                }
              }
              elem[dataPriv.expando] = void 0;
            }
            if (elem[dataUser.expando]) {
              elem[dataUser.expando] = void 0;
            }
          }
        }
      }
    });
    jQuery2.fn.extend({
      detach: function(selector) {
        return remove(this, selector, true);
      },
      remove: function(selector) {
        return remove(this, selector);
      },
      text: function(value) {
        return access(this, function(value2) {
          return value2 === void 0 ? jQuery2.text(this) : this.empty().each(function() {
            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
              this.textContent = value2;
            }
          });
        }, null, value, arguments.length);
      },
      append: function() {
        return domManip(this, arguments, function(elem) {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
            var target = manipulationTarget(this, elem);
            target.appendChild(elem);
          }
        });
      },
      prepend: function() {
        return domManip(this, arguments, function(elem) {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
            var target = manipulationTarget(this, elem);
            target.insertBefore(elem, target.firstChild);
          }
        });
      },
      before: function() {
        return domManip(this, arguments, function(elem) {
          if (this.parentNode) {
            this.parentNode.insertBefore(elem, this);
          }
        });
      },
      after: function() {
        return domManip(this, arguments, function(elem) {
          if (this.parentNode) {
            this.parentNode.insertBefore(elem, this.nextSibling);
          }
        });
      },
      empty: function() {
        var elem, i2 = 0;
        for (; (elem = this[i2]) != null; i2++) {
          if (elem.nodeType === 1) {
            jQuery2.cleanData(getAll(elem, false));
            elem.textContent = "";
          }
        }
        return this;
      },
      clone: function(dataAndEvents, deepDataAndEvents) {
        dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
        deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
        return this.map(function() {
          return jQuery2.clone(this, dataAndEvents, deepDataAndEvents);
        });
      },
      html: function(value) {
        return access(this, function(value2) {
          var elem = this[0] || {}, i2 = 0, l = this.length;
          if (value2 === void 0 && elem.nodeType === 1) {
            return elem.innerHTML;
          }
          if (typeof value2 === "string" && !rnoInnerhtml.test(value2) && !wrapMap[(rtagName.exec(value2) || ["", ""])[1].toLowerCase()]) {
            value2 = jQuery2.htmlPrefilter(value2);
            try {
              for (; i2 < l; i2++) {
                elem = this[i2] || {};
                if (elem.nodeType === 1) {
                  jQuery2.cleanData(getAll(elem, false));
                  elem.innerHTML = value2;
                }
              }
              elem = 0;
            } catch (e) {
            }
          }
          if (elem) {
            this.empty().append(value2);
          }
        }, null, value, arguments.length);
      },
      replaceWith: function() {
        var ignored = [];
        return domManip(this, arguments, function(elem) {
          var parent = this.parentNode;
          if (jQuery2.inArray(this, ignored) < 0) {
            jQuery2.cleanData(getAll(this));
            if (parent) {
              parent.replaceChild(elem, this);
            }
          }
        }, ignored);
      }
    });
    jQuery2.each({
      appendTo: "append",
      prependTo: "prepend",
      insertBefore: "before",
      insertAfter: "after",
      replaceAll: "replaceWith"
    }, function(name, original) {
      jQuery2.fn[name] = function(selector) {
        var elems, ret = [], insert = jQuery2(selector), last = insert.length - 1, i2 = 0;
        for (; i2 <= last; i2++) {
          elems = i2 === last ? this : this.clone(true);
          jQuery2(insert[i2])[original](elems);
          push.apply(ret, elems);
        }
        return this.pushStack(ret);
      };
    });
    var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");
    var rcustomProp = /^--/;
    function getStyles(elem) {
      var view = elem.ownerDocument.defaultView;
      if (!view) {
        view = window2;
      }
      return view.getComputedStyle(elem);
    }
    function swap(elem, options, callback) {
      var ret, name, old = {};
      for (name in options) {
        old[name] = elem.style[name];
        elem.style[name] = options[name];
      }
      ret = callback.call(elem);
      for (name in options) {
        elem.style[name] = old[name];
      }
      return ret;
    }
    function curCSS(elem, name, computed) {
      var ret, isCustomProp = rcustomProp.test(name);
      computed = computed || getStyles(elem);
      if (computed) {
        ret = computed.getPropertyValue(name) || computed[name];
        if (isCustomProp && ret) {
          ret = ret.replace(rtrimCSS, "$1") || void 0;
        }
        if (ret === "" && !isAttached(elem)) {
          ret = jQuery2.style(elem, name);
        }
      }
      return ret !== void 0 ? (
        // Support: IE <=9 - 11+
        // IE returns zIndex value as an integer.
        ret + ""
      ) : ret;
    }
    var cssPrefixes = ["Webkit", "Moz", "ms"], emptyStyle = document$1.createElement("div").style;
    function vendorPropName(name) {
      var capName = name[0].toUpperCase() + name.slice(1), i2 = cssPrefixes.length;
      while (i2--) {
        name = cssPrefixes[i2] + capName;
        if (name in emptyStyle) {
          return name;
        }
      }
    }
    function finalPropName(name) {
      if (name in emptyStyle) {
        return name;
      }
      return vendorPropName(name) || name;
    }
    var reliableTrDimensionsVal, reliableColDimensionsVal, table = document$1.createElement("table");
    function computeTableStyleTests() {
      if (
        // This is a singleton, we need to execute it only once
        !table || // Finish early in limited (non-browser) environments
        !table.style
      ) {
        return;
      }
      var trStyle, col = document$1.createElement("col"), tr = document$1.createElement("tr"), td = document$1.createElement("td");
      table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate;border-spacing:0";
      tr.style.cssText = "box-sizing:content-box;border:1px solid;height:1px";
      td.style.cssText = "height:9px;width:9px;padding:0";
      col.span = 2;
      documentElement$1.appendChild(table).appendChild(col).parentNode.appendChild(tr).appendChild(td).parentNode.appendChild(td.cloneNode(true));
      if (table.offsetWidth === 0) {
        documentElement$1.removeChild(table);
        return;
      }
      trStyle = window2.getComputedStyle(tr);
      reliableColDimensionsVal = isIE || Math.round(
        parseFloat(
          window2.getComputedStyle(col).width
        )
      ) === 18;
      reliableTrDimensionsVal = Math.round(parseFloat(trStyle.height) + parseFloat(trStyle.borderTopWidth) + parseFloat(trStyle.borderBottomWidth)) === tr.offsetHeight;
      documentElement$1.removeChild(table);
      table = null;
    }
    jQuery2.extend(support, {
      reliableTrDimensions: function() {
        computeTableStyleTests();
        return reliableTrDimensionsVal;
      },
      reliableColDimensions: function() {
        computeTableStyleTests();
        return reliableColDimensionsVal;
      }
    });
    var cssShow = { position: "absolute", visibility: "hidden", display: "block" }, cssNormalTransform = {
      letterSpacing: "0",
      fontWeight: "400"
    };
    function setPositiveNumber(_elem, value, subtract) {
      var matches2 = rcssNum.exec(value);
      return matches2 ? (
        // Guard against undefined "subtract", e.g., when used as in cssHooks
        Math.max(0, matches2[2] - (subtract || 0)) + (matches2[3] || "px")
      ) : value;
    }
    function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
      var i2 = dimension === "width" ? 1 : 0, extra = 0, delta = 0, marginDelta = 0;
      if (box === (isBorderBox ? "border" : "content")) {
        return 0;
      }
      for (; i2 < 4; i2 += 2) {
        if (box === "margin") {
          marginDelta += jQuery2.css(elem, box + cssExpand[i2], true, styles);
        }
        if (!isBorderBox) {
          delta += jQuery2.css(elem, "padding" + cssExpand[i2], true, styles);
          if (box !== "padding") {
            delta += jQuery2.css(elem, "border" + cssExpand[i2] + "Width", true, styles);
          } else {
            extra += jQuery2.css(elem, "border" + cssExpand[i2] + "Width", true, styles);
          }
        } else {
          if (box === "content") {
            delta -= jQuery2.css(elem, "padding" + cssExpand[i2], true, styles);
          }
          if (box !== "margin") {
            delta -= jQuery2.css(elem, "border" + cssExpand[i2] + "Width", true, styles);
          }
        }
      }
      if (!isBorderBox && computedVal >= 0) {
        delta += Math.max(0, Math.ceil(
          elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5
          // If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
          // Use an explicit zero to avoid NaN (gh-3964)
        )) || 0;
      }
      return delta + marginDelta;
    }
    function getWidthOrHeight(elem, dimension, extra) {
      var styles = getStyles(elem), boxSizingNeeded = isIE || extra, isBorderBox = boxSizingNeeded && jQuery2.css(elem, "boxSizing", false, styles) === "border-box", valueIsBorderBox = isBorderBox, val = curCSS(elem, dimension, styles), offsetProp = "offset" + dimension[0].toUpperCase() + dimension.slice(1);
      if (rnumnonpx.test(val)) {
        if (!extra) {
          return val;
        }
        val = "auto";
      }
      if (
        // Fall back to offsetWidth/offsetHeight when value is "auto"
        // This happens for inline elements with no explicit setting (gh-3571)
        (val === "auto" || // Support: IE 9 - 11+
        // Use offsetWidth/offsetHeight for when box sizing is unreliable.
        // In those cases, the computed value can be trusted to be border-box.
        isIE && isBorderBox || !support.reliableColDimensions() && nodeName(elem, "col") || !support.reliableTrDimensions() && nodeName(elem, "tr")) && // Make sure the element is visible & connected
        elem.getClientRects().length
      ) {
        isBorderBox = jQuery2.css(elem, "boxSizing", false, styles) === "border-box";
        valueIsBorderBox = offsetProp in elem;
        if (valueIsBorderBox) {
          val = elem[offsetProp];
        }
      }
      val = parseFloat(val) || 0;
      return val + boxModelAdjustment(
        elem,
        dimension,
        extra || (isBorderBox ? "border" : "content"),
        valueIsBorderBox,
        styles,
        // Provide the current computed size to request scroll gutter calculation (gh-3589)
        val
      ) + "px";
    }
    jQuery2.extend({
      // Add in style property hooks for overriding the default
      // behavior of getting and setting a style property
      cssHooks: {},
      // Get and set the style property on a DOM Node
      style: function(elem, name, value, extra) {
        if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
          return;
        }
        var ret, type, hooks, origName = cssCamelCase(name), isCustomProp = rcustomProp.test(name), style = elem.style;
        if (!isCustomProp) {
          name = finalPropName(origName);
        }
        hooks = jQuery2.cssHooks[name] || jQuery2.cssHooks[origName];
        if (value !== void 0) {
          type = typeof value;
          if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
            value = adjustCSS(elem, name, ret);
            type = "number";
          }
          if (value == null || value !== value) {
            return;
          }
          if (type === "number") {
            value += ret && ret[3] || (isAutoPx(origName) ? "px" : "");
          }
          if (isIE && value === "" && name.indexOf("background") === 0) {
            style[name] = "inherit";
          }
          if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== void 0) {
            if (isCustomProp) {
              style.setProperty(name, value);
            } else {
              style[name] = value;
            }
          }
        } else {
          if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== void 0) {
            return ret;
          }
          return style[name];
        }
      },
      css: function(elem, name, extra, styles) {
        var val, num, hooks, origName = cssCamelCase(name), isCustomProp = rcustomProp.test(name);
        if (!isCustomProp) {
          name = finalPropName(origName);
        }
        hooks = jQuery2.cssHooks[name] || jQuery2.cssHooks[origName];
        if (hooks && "get" in hooks) {
          val = hooks.get(elem, true, extra);
        }
        if (val === void 0) {
          val = curCSS(elem, name, styles);
        }
        if (val === "normal" && name in cssNormalTransform) {
          val = cssNormalTransform[name];
        }
        if (extra === "" || extra) {
          num = parseFloat(val);
          return extra === true || isFinite(num) ? num || 0 : val;
        }
        return val;
      }
    });
    jQuery2.each(["height", "width"], function(_i, dimension) {
      jQuery2.cssHooks[dimension] = {
        get: function(elem, computed, extra) {
          if (computed) {
            return jQuery2.css(elem, "display") === "none" ? swap(elem, cssShow, function() {
              return getWidthOrHeight(elem, dimension, extra);
            }) : getWidthOrHeight(elem, dimension, extra);
          }
        },
        set: function(elem, value, extra) {
          var matches2, styles = getStyles(elem), isBorderBox = extra && jQuery2.css(elem, "boxSizing", false, styles) === "border-box", subtract = extra ? boxModelAdjustment(
            elem,
            dimension,
            extra,
            isBorderBox,
            styles
          ) : 0;
          if (subtract && (matches2 = rcssNum.exec(value)) && (matches2[3] || "px") !== "px") {
            elem.style[dimension] = value;
            value = jQuery2.css(elem, dimension);
          }
          return setPositiveNumber(elem, value, subtract);
        }
      };
    });
    jQuery2.each({
      margin: "",
      padding: "",
      border: "Width"
    }, function(prefix, suffix) {
      jQuery2.cssHooks[prefix + suffix] = {
        expand: function(value) {
          var i2 = 0, expanded = {}, parts = typeof value === "string" ? value.split(" ") : [value];
          for (; i2 < 4; i2++) {
            expanded[prefix + cssExpand[i2] + suffix] = parts[i2] || parts[i2 - 2] || parts[0];
          }
          return expanded;
        }
      };
      if (prefix !== "margin") {
        jQuery2.cssHooks[prefix + suffix].set = setPositiveNumber;
      }
    });
    jQuery2.fn.extend({
      css: function(name, value) {
        return access(this, function(elem, name2, value2) {
          var styles, len, map = {}, i2 = 0;
          if (Array.isArray(name2)) {
            styles = getStyles(elem);
            len = name2.length;
            for (; i2 < len; i2++) {
              map[name2[i2]] = jQuery2.css(elem, name2[i2], false, styles);
            }
            return map;
          }
          return value2 !== void 0 ? jQuery2.style(elem, name2, value2) : jQuery2.css(elem, name2);
        }, name, value, arguments.length > 1);
      }
    });
    function Tween(elem, options, prop, end, easing) {
      return new Tween.prototype.init(elem, options, prop, end, easing);
    }
    jQuery2.Tween = Tween;
    Tween.prototype = {
      constructor: Tween,
      init: function(elem, options, prop, end, easing, unit) {
        this.elem = elem;
        this.prop = prop;
        this.easing = easing || jQuery2.easing._default;
        this.options = options;
        this.start = this.now = this.cur();
        this.end = end;
        this.unit = unit || (isAutoPx(prop) ? "px" : "");
      },
      cur: function() {
        var hooks = Tween.propHooks[this.prop];
        return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
      },
      run: function(percent) {
        var eased, hooks = Tween.propHooks[this.prop];
        if (this.options.duration) {
          this.pos = eased = jQuery2.easing[this.easing](
            percent,
            this.options.duration * percent,
            0,
            1,
            this.options.duration
          );
        } else {
          this.pos = eased = percent;
        }
        this.now = (this.end - this.start) * eased + this.start;
        if (this.options.step) {
          this.options.step.call(this.elem, this.now, this);
        }
        if (hooks && hooks.set) {
          hooks.set(this);
        } else {
          Tween.propHooks._default.set(this);
        }
        return this;
      }
    };
    Tween.prototype.init.prototype = Tween.prototype;
    Tween.propHooks = {
      _default: {
        get: function(tween) {
          var result;
          if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
            return tween.elem[tween.prop];
          }
          result = jQuery2.css(tween.elem, tween.prop, "");
          return !result || result === "auto" ? 0 : result;
        },
        set: function(tween) {
          if (jQuery2.fx.step[tween.prop]) {
            jQuery2.fx.step[tween.prop](tween);
          } else if (tween.elem.nodeType === 1 && (jQuery2.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) {
            jQuery2.style(tween.elem, tween.prop, tween.now + tween.unit);
          } else {
            tween.elem[tween.prop] = tween.now;
          }
        }
      }
    };
    jQuery2.easing = {
      linear: function(p) {
        return p;
      },
      swing: function(p) {
        return 0.5 - Math.cos(p * Math.PI) / 2;
      },
      _default: "swing"
    };
    jQuery2.fx = Tween.prototype.init;
    jQuery2.fx.step = {};
    var fxNow, inProgress, rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
    function schedule() {
      if (inProgress) {
        if (document$1.hidden === false && window2.requestAnimationFrame) {
          window2.requestAnimationFrame(schedule);
        } else {
          window2.setTimeout(schedule, 13);
        }
        jQuery2.fx.tick();
      }
    }
    function createFxNow() {
      window2.setTimeout(function() {
        fxNow = void 0;
      });
      return fxNow = Date.now();
    }
    function genFx(type, includeWidth) {
      var which, i2 = 0, attrs = { height: type };
      includeWidth = includeWidth ? 1 : 0;
      for (; i2 < 4; i2 += 2 - includeWidth) {
        which = cssExpand[i2];
        attrs["margin" + which] = attrs["padding" + which] = type;
      }
      if (includeWidth) {
        attrs.opacity = attrs.width = type;
      }
      return attrs;
    }
    function createTween(value, prop, animation) {
      var tween, collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]), index = 0, length = collection.length;
      for (; index < length; index++) {
        if (tween = collection[index].call(animation, prop, value)) {
          return tween;
        }
      }
    }
    function defaultPrefilter(elem, props, opts) {
      var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display, isBox = "width" in props || "height" in props, anim = this, orig = {}, style = elem.style, hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, "fxshow");
      if (!opts.queue) {
        hooks = jQuery2._queueHooks(elem, "fx");
        if (hooks.unqueued == null) {
          hooks.unqueued = 0;
          oldfire = hooks.empty.fire;
          hooks.empty.fire = function() {
            if (!hooks.unqueued) {
              oldfire();
            }
          };
        }
        hooks.unqueued++;
        anim.always(function() {
          anim.always(function() {
            hooks.unqueued--;
            if (!jQuery2.queue(elem, "fx").length) {
              hooks.empty.fire();
            }
          });
        });
      }
      for (prop in props) {
        value = props[prop];
        if (rfxtypes.test(value)) {
          delete props[prop];
          toggle = toggle || value === "toggle";
          if (value === (hidden ? "hide" : "show")) {
            if (value === "show" && dataShow && dataShow[prop] !== void 0) {
              hidden = true;
            } else {
              continue;
            }
          }
          orig[prop] = dataShow && dataShow[prop] || jQuery2.style(elem, prop);
        }
      }
      propTween = !jQuery2.isEmptyObject(props);
      if (!propTween && jQuery2.isEmptyObject(orig)) {
        return;
      }
      if (isBox && elem.nodeType === 1) {
        opts.overflow = [style.overflow, style.overflowX, style.overflowY];
        restoreDisplay = dataShow && dataShow.display;
        if (restoreDisplay == null) {
          restoreDisplay = dataPriv.get(elem, "display");
        }
        display = jQuery2.css(elem, "display");
        if (display === "none") {
          if (restoreDisplay) {
            display = restoreDisplay;
          } else {
            showHide([elem], true);
            restoreDisplay = elem.style.display || restoreDisplay;
            display = jQuery2.css(elem, "display");
            showHide([elem]);
          }
        }
        if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
          if (jQuery2.css(elem, "float") === "none") {
            if (!propTween) {
              anim.done(function() {
                style.display = restoreDisplay;
              });
              if (restoreDisplay == null) {
                display = style.display;
                restoreDisplay = display === "none" ? "" : display;
              }
            }
            style.display = "inline-block";
          }
        }
      }
      if (opts.overflow) {
        style.overflow = "hidden";
        anim.always(function() {
          style.overflow = opts.overflow[0];
          style.overflowX = opts.overflow[1];
          style.overflowY = opts.overflow[2];
        });
      }
      propTween = false;
      for (prop in orig) {
        if (!propTween) {
          if (dataShow) {
            if ("hidden" in dataShow) {
              hidden = dataShow.hidden;
            }
          } else {
            dataShow = dataPriv.set(elem, "fxshow", { display: restoreDisplay });
          }
          if (toggle) {
            dataShow.hidden = !hidden;
          }
          if (hidden) {
            showHide([elem], true);
          }
          anim.done(function() {
            if (!hidden) {
              showHide([elem]);
            }
            dataPriv.remove(elem, "fxshow");
            for (prop in orig) {
              jQuery2.style(elem, prop, orig[prop]);
            }
          });
        }
        propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
        if (!(prop in dataShow)) {
          dataShow[prop] = propTween.start;
          if (hidden) {
            propTween.end = propTween.start;
            propTween.start = 0;
          }
        }
      }
    }
    function propFilter(props, specialEasing) {
      var index, name, easing, value, hooks;
      for (index in props) {
        name = cssCamelCase(index);
        easing = specialEasing[name];
        value = props[index];
        if (Array.isArray(value)) {
          easing = value[1];
          value = props[index] = value[0];
        }
        if (index !== name) {
          props[name] = value;
          delete props[index];
        }
        hooks = jQuery2.cssHooks[name];
        if (hooks && "expand" in hooks) {
          value = hooks.expand(value);
          delete props[name];
          for (index in value) {
            if (!(index in props)) {
              props[index] = value[index];
              specialEasing[index] = easing;
            }
          }
        } else {
          specialEasing[name] = easing;
        }
      }
    }
    function Animation(elem, properties, options) {
      var result, stopped, index = 0, length = Animation.prefilters.length, deferred = jQuery2.Deferred().always(function() {
        delete tick.elem;
      }), tick = function() {
        if (stopped) {
          return false;
        }
        var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), percent = 1 - (remaining / animation.duration || 0), index2 = 0, length2 = animation.tweens.length;
        for (; index2 < length2; index2++) {
          animation.tweens[index2].run(percent);
        }
        deferred.notifyWith(elem, [animation, percent, remaining]);
        if (percent < 1 && length2) {
          return remaining;
        }
        if (!length2) {
          deferred.notifyWith(elem, [animation, 1, 0]);
        }
        deferred.resolveWith(elem, [animation]);
        return false;
      }, animation = deferred.promise({
        elem,
        props: jQuery2.extend({}, properties),
        opts: jQuery2.extend(true, {
          specialEasing: {},
          easing: jQuery2.easing._default
        }, options),
        originalProperties: properties,
        originalOptions: options,
        startTime: fxNow || createFxNow(),
        duration: options.duration,
        tweens: [],
        createTween: function(prop, end) {
          var tween = jQuery2.Tween(
            elem,
            animation.opts,
            prop,
            end,
            animation.opts.specialEasing[prop] || animation.opts.easing
          );
          animation.tweens.push(tween);
          return tween;
        },
        stop: function(gotoEnd) {
          var index2 = 0, length2 = gotoEnd ? animation.tweens.length : 0;
          if (stopped) {
            return this;
          }
          stopped = true;
          for (; index2 < length2; index2++) {
            animation.tweens[index2].run(1);
          }
          if (gotoEnd) {
            deferred.notifyWith(elem, [animation, 1, 0]);
            deferred.resolveWith(elem, [animation, gotoEnd]);
          } else {
            deferred.rejectWith(elem, [animation, gotoEnd]);
          }
          return this;
        }
      }), props = animation.props;
      propFilter(props, animation.opts.specialEasing);
      for (; index < length; index++) {
        result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
        if (result) {
          if (typeof result.stop === "function") {
            jQuery2._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
          }
          return result;
        }
      }
      jQuery2.map(props, createTween, animation);
      if (typeof animation.opts.start === "function") {
        animation.opts.start.call(elem, animation);
      }
      animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
      jQuery2.fx.timer(
        jQuery2.extend(tick, {
          elem,
          anim: animation,
          queue: animation.opts.queue
        })
      );
      return animation;
    }
    jQuery2.Animation = jQuery2.extend(Animation, {
      tweeners: {
        "*": [function(prop, value) {
          var tween = this.createTween(prop, value);
          adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
          return tween;
        }]
      },
      tweener: function(props, callback) {
        if (typeof props === "function") {
          callback = props;
          props = ["*"];
        } else {
          props = props.match(rnothtmlwhite);
        }
        var prop, index = 0, length = props.length;
        for (; index < length; index++) {
          prop = props[index];
          Animation.tweeners[prop] = Animation.tweeners[prop] || [];
          Animation.tweeners[prop].unshift(callback);
        }
      },
      prefilters: [defaultPrefilter],
      prefilter: function(callback, prepend) {
        if (prepend) {
          Animation.prefilters.unshift(callback);
        } else {
          Animation.prefilters.push(callback);
        }
      }
    });
    jQuery2.speed = function(speed, easing, fn) {
      var opt = speed && typeof speed === "object" ? jQuery2.extend({}, speed) : {
        complete: fn || easing || typeof speed === "function" && speed,
        duration: speed,
        easing: fn && easing || easing && typeof easing !== "function" && easing
      };
      if (jQuery2.fx.off) {
        opt.duration = 0;
      } else {
        if (typeof opt.duration !== "number") {
          if (opt.duration in jQuery2.fx.speeds) {
            opt.duration = jQuery2.fx.speeds[opt.duration];
          } else {
            opt.duration = jQuery2.fx.speeds._default;
          }
        }
      }
      if (opt.queue == null || opt.queue === true) {
        opt.queue = "fx";
      }
      opt.old = opt.complete;
      opt.complete = function() {
        if (typeof opt.old === "function") {
          opt.old.call(this);
        }
        if (opt.queue) {
          jQuery2.dequeue(this, opt.queue);
        }
      };
      return opt;
    };
    jQuery2.fn.extend({
      fadeTo: function(speed, to, easing, callback) {
        return this.filter(isHiddenWithinTree).css("opacity", 0).show().end().animate({ opacity: to }, speed, easing, callback);
      },
      animate: function(prop, speed, easing, callback) {
        var empty = jQuery2.isEmptyObject(prop), optall = jQuery2.speed(speed, easing, callback), doAnimation = function() {
          var anim = Animation(this, jQuery2.extend({}, prop), optall);
          if (empty || dataPriv.get(this, "finish")) {
            anim.stop(true);
          }
        };
        doAnimation.finish = doAnimation;
        return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
      },
      stop: function(type, clearQueue, gotoEnd) {
        var stopQueue = function(hooks) {
          var stop = hooks.stop;
          delete hooks.stop;
          stop(gotoEnd);
        };
        if (typeof type !== "string") {
          gotoEnd = clearQueue;
          clearQueue = type;
          type = void 0;
        }
        if (clearQueue) {
          this.queue(type || "fx", []);
        }
        return this.each(function() {
          var dequeue = true, index = type != null && type + "queueHooks", timers = jQuery2.timers, data = dataPriv.get(this);
          if (index) {
            if (data[index] && data[index].stop) {
              stopQueue(data[index]);
            }
          } else {
            for (index in data) {
              if (data[index] && data[index].stop && rrun.test(index)) {
                stopQueue(data[index]);
              }
            }
          }
          for (index = timers.length; index--; ) {
            if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
              timers[index].anim.stop(gotoEnd);
              dequeue = false;
              timers.splice(index, 1);
            }
          }
          if (dequeue || !gotoEnd) {
            jQuery2.dequeue(this, type);
          }
        });
      },
      finish: function(type) {
        if (type !== false) {
          type = type || "fx";
        }
        return this.each(function() {
          var index, data = dataPriv.get(this), queue = data[type + "queue"], hooks = data[type + "queueHooks"], timers = jQuery2.timers, length = queue ? queue.length : 0;
          data.finish = true;
          jQuery2.queue(this, type, []);
          if (hooks && hooks.stop) {
            hooks.stop.call(this, true);
          }
          for (index = timers.length; index--; ) {
            if (timers[index].elem === this && timers[index].queue === type) {
              timers[index].anim.stop(true);
              timers.splice(index, 1);
            }
          }
          for (index = 0; index < length; index++) {
            if (queue[index] && queue[index].finish) {
              queue[index].finish.call(this);
            }
          }
          delete data.finish;
        });
      }
    });
    jQuery2.each(["toggle", "show", "hide"], function(_i, name) {
      var cssFn = jQuery2.fn[name];
      jQuery2.fn[name] = function(speed, easing, callback) {
        return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
      };
    });
    jQuery2.each({
      slideDown: genFx("show"),
      slideUp: genFx("hide"),
      slideToggle: genFx("toggle"),
      fadeIn: { opacity: "show" },
      fadeOut: { opacity: "hide" },
      fadeToggle: { opacity: "toggle" }
    }, function(name, props) {
      jQuery2.fn[name] = function(speed, easing, callback) {
        return this.animate(props, speed, easing, callback);
      };
    });
    jQuery2.timers = [];
    jQuery2.fx.tick = function() {
      var timer, i2 = 0, timers = jQuery2.timers;
      fxNow = Date.now();
      for (; i2 < timers.length; i2++) {
        timer = timers[i2];
        if (!timer() && timers[i2] === timer) {
          timers.splice(i2--, 1);
        }
      }
      if (!timers.length) {
        jQuery2.fx.stop();
      }
      fxNow = void 0;
    };
    jQuery2.fx.timer = function(timer) {
      jQuery2.timers.push(timer);
      jQuery2.fx.start();
    };
    jQuery2.fx.start = function() {
      if (inProgress) {
        return;
      }
      inProgress = true;
      schedule();
    };
    jQuery2.fx.stop = function() {
      inProgress = null;
    };
    jQuery2.fx.speeds = {
      slow: 600,
      fast: 200,
      // Default speed
      _default: 400
    };
    jQuery2.fn.delay = function(time, type) {
      time = jQuery2.fx ? jQuery2.fx.speeds[time] || time : time;
      type = type || "fx";
      return this.queue(type, function(next, hooks) {
        var timeout = window2.setTimeout(next, time);
        hooks.stop = function() {
          window2.clearTimeout(timeout);
        };
      });
    };
    var rfocusable = /^(?:input|select|textarea|button)$/i, rclickable = /^(?:a|area)$/i;
    jQuery2.fn.extend({
      prop: function(name, value) {
        return access(this, jQuery2.prop, name, value, arguments.length > 1);
      },
      removeProp: function(name) {
        return this.each(function() {
          delete this[jQuery2.propFix[name] || name];
        });
      }
    });
    jQuery2.extend({
      prop: function(elem, name, value) {
        var ret, hooks, nType = elem.nodeType;
        if (nType === 3 || nType === 8 || nType === 2) {
          return;
        }
        if (nType !== 1 || !jQuery2.isXMLDoc(elem)) {
          name = jQuery2.propFix[name] || name;
          hooks = jQuery2.propHooks[name];
        }
        if (value !== void 0) {
          if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== void 0) {
            return ret;
          }
          return elem[name] = value;
        }
        if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
          return ret;
        }
        return elem[name];
      },
      propHooks: {
        tabIndex: {
          get: function(elem) {
            var tabindex = elem.getAttribute("tabindex");
            if (tabindex) {
              return parseInt(tabindex, 10);
            }
            if (rfocusable.test(elem.nodeName) || // href-less anchor's `tabIndex` property value is `0` and
            // the `tabindex` attribute value: `null`. We want `-1`.
            rclickable.test(elem.nodeName) && elem.href) {
              return 0;
            }
            return -1;
          }
        }
      },
      propFix: {
        "for": "htmlFor",
        "class": "className"
      }
    });
    if (isIE) {
      jQuery2.propHooks.selected = {
        get: function(elem) {
          var parent = elem.parentNode;
          if (parent && parent.parentNode) {
            parent.parentNode.selectedIndex;
          }
          return null;
        },
        set: function(elem) {
          var parent = elem.parentNode;
          if (parent) {
            parent.selectedIndex;
            if (parent.parentNode) {
              parent.parentNode.selectedIndex;
            }
          }
        }
      };
    }
    jQuery2.each([
      "tabIndex",
      "readOnly",
      "maxLength",
      "cellSpacing",
      "cellPadding",
      "rowSpan",
      "colSpan",
      "useMap",
      "frameBorder",
      "contentEditable"
    ], function() {
      jQuery2.propFix[this.toLowerCase()] = this;
    });
    function stripAndCollapse(value) {
      var tokens = value.match(rnothtmlwhite) || [];
      return tokens.join(" ");
    }
    function getClass(elem) {
      return elem.getAttribute && elem.getAttribute("class") || "";
    }
    function classesToArray(value) {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "string") {
        return value.match(rnothtmlwhite) || [];
      }
      return [];
    }
    jQuery2.fn.extend({
      addClass: function(value) {
        var classNames, cur, curValue, className, i2, finalValue;
        if (typeof value === "function") {
          return this.each(function(j) {
            jQuery2(this).addClass(value.call(this, j, getClass(this)));
          });
        }
        classNames = classesToArray(value);
        if (classNames.length) {
          return this.each(function() {
            curValue = getClass(this);
            cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
            if (cur) {
              for (i2 = 0; i2 < classNames.length; i2++) {
                className = classNames[i2];
                if (cur.indexOf(" " + className + " ") < 0) {
                  cur += className + " ";
                }
              }
              finalValue = stripAndCollapse(cur);
              if (curValue !== finalValue) {
                this.setAttribute("class", finalValue);
              }
            }
          });
        }
        return this;
      },
      removeClass: function(value) {
        var classNames, cur, curValue, className, i2, finalValue;
        if (typeof value === "function") {
          return this.each(function(j) {
            jQuery2(this).removeClass(value.call(this, j, getClass(this)));
          });
        }
        if (!arguments.length) {
          return this.attr("class", "");
        }
        classNames = classesToArray(value);
        if (classNames.length) {
          return this.each(function() {
            curValue = getClass(this);
            cur = this.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";
            if (cur) {
              for (i2 = 0; i2 < classNames.length; i2++) {
                className = classNames[i2];
                while (cur.indexOf(" " + className + " ") > -1) {
                  cur = cur.replace(" " + className + " ", " ");
                }
              }
              finalValue = stripAndCollapse(cur);
              if (curValue !== finalValue) {
                this.setAttribute("class", finalValue);
              }
            }
          });
        }
        return this;
      },
      toggleClass: function(value, stateVal) {
        var classNames, className, i2, self2;
        if (typeof value === "function") {
          return this.each(function(i3) {
            jQuery2(this).toggleClass(
              value.call(this, i3, getClass(this), stateVal),
              stateVal
            );
          });
        }
        if (typeof stateVal === "boolean") {
          return stateVal ? this.addClass(value) : this.removeClass(value);
        }
        classNames = classesToArray(value);
        if (classNames.length) {
          return this.each(function() {
            self2 = jQuery2(this);
            for (i2 = 0; i2 < classNames.length; i2++) {
              className = classNames[i2];
              if (self2.hasClass(className)) {
                self2.removeClass(className);
              } else {
                self2.addClass(className);
              }
            }
          });
        }
        return this;
      },
      hasClass: function(selector) {
        var className, elem, i2 = 0;
        className = " " + selector + " ";
        while (elem = this[i2++]) {
          if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
            return true;
          }
        }
        return false;
      }
    });
    jQuery2.fn.extend({
      val: function(value) {
        var hooks, ret, valueIsFunction, elem = this[0];
        if (!arguments.length) {
          if (elem) {
            hooks = jQuery2.valHooks[elem.type] || jQuery2.valHooks[elem.nodeName.toLowerCase()];
            if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== void 0) {
              return ret;
            }
            ret = elem.value;
            return ret == null ? "" : ret;
          }
          return;
        }
        valueIsFunction = typeof value === "function";
        return this.each(function(i2) {
          var val;
          if (this.nodeType !== 1) {
            return;
          }
          if (valueIsFunction) {
            val = value.call(this, i2, jQuery2(this).val());
          } else {
            val = value;
          }
          if (val == null) {
            val = "";
          } else if (typeof val === "number") {
            val += "";
          } else if (Array.isArray(val)) {
            val = jQuery2.map(val, function(value2) {
              return value2 == null ? "" : value2 + "";
            });
          }
          hooks = jQuery2.valHooks[this.type] || jQuery2.valHooks[this.nodeName.toLowerCase()];
          if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === void 0) {
            this.value = val;
          }
        });
      }
    });
    jQuery2.extend({
      valHooks: {
        select: {
          get: function(elem) {
            var value, option, i2, options = elem.options, index = elem.selectedIndex, one = elem.type === "select-one", values = one ? null : [], max = one ? index + 1 : options.length;
            if (index < 0) {
              i2 = max;
            } else {
              i2 = one ? index : 0;
            }
            for (; i2 < max; i2++) {
              option = options[i2];
              if (option.selected && // Don't return options that are disabled or in a disabled optgroup
              !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {
                value = jQuery2(option).val();
                if (one) {
                  return value;
                }
                values.push(value);
              }
            }
            return values;
          },
          set: function(elem, value) {
            var optionSet, option, options = elem.options, values = jQuery2.makeArray(value), i2 = options.length;
            while (i2--) {
              option = options[i2];
              if (option.selected = jQuery2.inArray(jQuery2(option).val(), values) > -1) {
                optionSet = true;
              }
            }
            if (!optionSet) {
              elem.selectedIndex = -1;
            }
            return values;
          }
        }
      }
    });
    if (isIE) {
      jQuery2.valHooks.option = {
        get: function(elem) {
          var val = elem.getAttribute("value");
          return val != null ? val : (
            // Support: IE <=10 - 11+
            // option.text throws exceptions (trac-14686, trac-14858)
            // Strip and collapse whitespace
            // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
            stripAndCollapse(jQuery2.text(elem))
          );
        }
      };
    }
    jQuery2.each(["radio", "checkbox"], function() {
      jQuery2.valHooks[this] = {
        set: function(elem, value) {
          if (Array.isArray(value)) {
            return elem.checked = jQuery2.inArray(jQuery2(elem).val(), value) > -1;
          }
        }
      };
    });
    var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, stopPropagationCallback = function(e) {
      e.stopPropagation();
    };
    jQuery2.extend(jQuery2.event, {
      trigger: function(event, data, elem, onlyHandlers) {
        var i2, cur, tmp, bubbleType, ontype, handle, special, lastElement, eventPath = [elem || document$1], type = hasOwn.call(event, "type") ? event.type : event, namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];
        cur = lastElement = tmp = elem = elem || document$1;
        if (elem.nodeType === 3 || elem.nodeType === 8) {
          return;
        }
        if (rfocusMorph.test(type + jQuery2.event.triggered)) {
          return;
        }
        if (type.indexOf(".") > -1) {
          namespaces = type.split(".");
          type = namespaces.shift();
          namespaces.sort();
        }
        ontype = type.indexOf(":") < 0 && "on" + type;
        event = event[jQuery2.expando] ? event : new jQuery2.Event(type, typeof event === "object" && event);
        event.isTrigger = onlyHandlers ? 2 : 3;
        event.namespace = namespaces.join(".");
        event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
        event.result = void 0;
        if (!event.target) {
          event.target = elem;
        }
        data = data == null ? [event] : jQuery2.makeArray(data, [event]);
        special = jQuery2.event.special[type] || {};
        if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
          return;
        }
        if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
          bubbleType = special.delegateType || type;
          if (!rfocusMorph.test(bubbleType + type)) {
            cur = cur.parentNode;
          }
          for (; cur; cur = cur.parentNode) {
            eventPath.push(cur);
            tmp = cur;
          }
          if (tmp === (elem.ownerDocument || document$1)) {
            eventPath.push(tmp.defaultView || tmp.parentWindow || window2);
          }
        }
        i2 = 0;
        while ((cur = eventPath[i2++]) && !event.isPropagationStopped()) {
          lastElement = cur;
          event.type = i2 > 1 ? bubbleType : special.bindType || type;
          handle = (dataPriv.get(cur, "events") || /* @__PURE__ */ Object.create(null))[event.type] && dataPriv.get(cur, "handle");
          if (handle) {
            handle.apply(cur, data);
          }
          handle = ontype && cur[ontype];
          if (handle && handle.apply && acceptData(cur)) {
            event.result = handle.apply(cur, data);
            if (event.result === false) {
              event.preventDefault();
            }
          }
        }
        event.type = type;
        if (!onlyHandlers && !event.isDefaultPrevented()) {
          if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
            if (ontype && typeof elem[type] === "function" && !isWindow(elem)) {
              tmp = elem[ontype];
              if (tmp) {
                elem[ontype] = null;
              }
              jQuery2.event.triggered = type;
              if (event.isPropagationStopped()) {
                lastElement.addEventListener(type, stopPropagationCallback);
              }
              elem[type]();
              if (event.isPropagationStopped()) {
                lastElement.removeEventListener(type, stopPropagationCallback);
              }
              jQuery2.event.triggered = void 0;
              if (tmp) {
                elem[ontype] = tmp;
              }
            }
          }
        }
        return event.result;
      },
      // Piggyback on a donor event to simulate a different one
      // Used only for `focus(in | out)` events
      simulate: function(type, elem, event) {
        var e = jQuery2.extend(
          new jQuery2.Event(),
          event,
          {
            type,
            isSimulated: true
          }
        );
        jQuery2.event.trigger(e, null, elem);
      }
    });
    jQuery2.fn.extend({
      trigger: function(type, data) {
        return this.each(function() {
          jQuery2.event.trigger(type, data, this);
        });
      },
      triggerHandler: function(type, data) {
        var elem = this[0];
        if (elem) {
          return jQuery2.event.trigger(type, data, elem, true);
        }
      }
    });
    var location2 = window2.location;
    var nonce = { guid: Date.now() };
    var rquery = /\?/;
    jQuery2.parseXML = function(data) {
      var xml, parserErrorElem;
      if (!data || typeof data !== "string") {
        return null;
      }
      try {
        xml = new window2.DOMParser().parseFromString(data, "text/xml");
      } catch (e) {
      }
      parserErrorElem = xml && xml.getElementsByTagName("parsererror")[0];
      if (!xml || parserErrorElem) {
        jQuery2.error("Invalid XML: " + (parserErrorElem ? jQuery2.map(parserErrorElem.childNodes, function(el) {
          return el.textContent;
        }).join("\n") : data));
      }
      return xml;
    };
    var rbracket = /\[\]$/, rCRLF = /\r?\n/g, rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rsubmittable = /^(?:input|select|textarea|keygen)/i;
    function buildParams(prefix, obj, traditional, add) {
      var name;
      if (Array.isArray(obj)) {
        jQuery2.each(obj, function(i2, v) {
          if (traditional || rbracket.test(prefix)) {
            add(prefix, v);
          } else {
            buildParams(
              prefix + "[" + (typeof v === "object" && v != null ? i2 : "") + "]",
              v,
              traditional,
              add
            );
          }
        });
      } else if (!traditional && toType(obj) === "object") {
        for (name in obj) {
          buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
        }
      } else {
        add(prefix, obj);
      }
    }
    jQuery2.param = function(a, traditional) {
      var prefix, s = [], add = function(key, valueOrFunction) {
        var value = typeof valueOrFunction === "function" ? valueOrFunction() : valueOrFunction;
        s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
      };
      if (a == null) {
        return "";
      }
      if (Array.isArray(a) || a.jquery && !jQuery2.isPlainObject(a)) {
        jQuery2.each(a, function() {
          add(this.name, this.value);
        });
      } else {
        for (prefix in a) {
          buildParams(prefix, a[prefix], traditional, add);
        }
      }
      return s.join("&");
    };
    jQuery2.fn.extend({
      serialize: function() {
        return jQuery2.param(this.serializeArray());
      },
      serializeArray: function() {
        return this.map(function() {
          var elements = jQuery2.prop(this, "elements");
          return elements ? jQuery2.makeArray(elements) : this;
        }).filter(function() {
          var type = this.type;
          return this.name && !jQuery2(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
        }).map(function(_i, elem) {
          var val = jQuery2(this).val();
          if (val == null) {
            return null;
          }
          if (Array.isArray(val)) {
            return jQuery2.map(val, function(val2) {
              return { name: elem.name, value: val2.replace(rCRLF, "\r\n") };
            });
          }
          return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
        }).get();
      }
    });
    var r20 = /%20/g, rhash = /#.*$/, rantiCache = /([?&])_=[^&]*/, rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg, rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, prefilters = {}, transports = {}, allTypes = "*/".concat("*"), originAnchor = document$1.createElement("a");
    originAnchor.href = location2.href;
    function addToPrefiltersOrTransports(structure) {
      return function(dataTypeExpression, func) {
        if (typeof dataTypeExpression !== "string") {
          func = dataTypeExpression;
          dataTypeExpression = "*";
        }
        var dataType, i2 = 0, dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];
        if (typeof func === "function") {
          while (dataType = dataTypes[i2++]) {
            if (dataType[0] === "+") {
              dataType = dataType.slice(1) || "*";
              (structure[dataType] = structure[dataType] || []).unshift(func);
            } else {
              (structure[dataType] = structure[dataType] || []).push(func);
            }
          }
        }
      };
    }
    function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
      var inspected = {}, seekingTransport = structure === transports;
      function inspect(dataType) {
        var selected;
        inspected[dataType] = true;
        jQuery2.each(structure[dataType] || [], function(_, prefilterOrFactory) {
          var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
          if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {
            options.dataTypes.unshift(dataTypeOrTransport);
            inspect(dataTypeOrTransport);
            return false;
          } else if (seekingTransport) {
            return !(selected = dataTypeOrTransport);
          }
        });
        return selected;
      }
      return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
    }
    function ajaxExtend(target, src) {
      var key, deep, flatOptions = jQuery2.ajaxSettings.flatOptions || {};
      for (key in src) {
        if (src[key] !== void 0) {
          (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
        }
      }
      if (deep) {
        jQuery2.extend(true, target, deep);
      }
      return target;
    }
    function ajaxHandleResponses(s, jqXHR, responses) {
      var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes;
      while (dataTypes[0] === "*") {
        dataTypes.shift();
        if (ct === void 0) {
          ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
        }
      }
      if (ct) {
        for (type in contents) {
          if (contents[type] && contents[type].test(ct)) {
            dataTypes.unshift(type);
            break;
          }
        }
      }
      if (dataTypes[0] in responses) {
        finalDataType = dataTypes[0];
      } else {
        for (type in responses) {
          if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
            finalDataType = type;
            break;
          }
          if (!firstDataType) {
            firstDataType = type;
          }
        }
        finalDataType = finalDataType || firstDataType;
      }
      if (finalDataType) {
        if (finalDataType !== dataTypes[0]) {
          dataTypes.unshift(finalDataType);
        }
        return responses[finalDataType];
      }
    }
    function ajaxConvert(s, response, jqXHR, isSuccess) {
      var conv2, current, conv, tmp, prev, converters = {}, dataTypes = s.dataTypes.slice();
      if (dataTypes[1]) {
        for (conv in s.converters) {
          converters[conv.toLowerCase()] = s.converters[conv];
        }
      }
      current = dataTypes.shift();
      while (current) {
        if (s.responseFields[current]) {
          jqXHR[s.responseFields[current]] = response;
        }
        if (!prev && isSuccess && s.dataFilter) {
          response = s.dataFilter(response, s.dataType);
        }
        prev = current;
        current = dataTypes.shift();
        if (current) {
          if (current === "*") {
            current = prev;
          } else if (prev !== "*" && prev !== current) {
            conv = converters[prev + " " + current] || converters["* " + current];
            if (!conv) {
              for (conv2 in converters) {
                tmp = conv2.split(" ");
                if (tmp[1] === current) {
                  conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
                  if (conv) {
                    if (conv === true) {
                      conv = converters[conv2];
                    } else if (converters[conv2] !== true) {
                      current = tmp[0];
                      dataTypes.unshift(tmp[1]);
                    }
                    break;
                  }
                }
              }
            }
            if (conv !== true) {
              if (conv && s.throws) {
                response = conv(response);
              } else {
                try {
                  response = conv(response);
                } catch (e) {
                  return {
                    state: "parsererror",
                    error: conv ? e : "No conversion from " + prev + " to " + current
                  };
                }
              }
            }
          }
        }
      }
      return { state: "success", data: response };
    }
    jQuery2.extend({
      // Counter for holding the number of active queries
      active: 0,
      // Last-Modified header cache for next request
      lastModified: {},
      etag: {},
      ajaxSettings: {
        url: location2.href,
        type: "GET",
        isLocal: rlocalProtocol.test(location2.protocol),
        global: true,
        processData: true,
        async: true,
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        /*
        timeout: 0,
        data: null,
        dataType: null,
        username: null,
        password: null,
        cache: null,
        throws: false,
        traditional: false,
        headers: {},
        */
        accepts: {
          "*": allTypes,
          text: "text/plain",
          html: "text/html",
          xml: "application/xml, text/xml",
          json: "application/json, text/javascript"
        },
        contents: {
          xml: /\bxml\b/,
          html: /\bhtml/,
          json: /\bjson\b/
        },
        responseFields: {
          xml: "responseXML",
          text: "responseText",
          json: "responseJSON"
        },
        // Data converters
        // Keys separate source (or catchall "*") and destination types with a single space
        converters: {
          // Convert anything to text
          "* text": String,
          // Text to html (true = no transformation)
          "text html": true,
          // Evaluate text as a json expression
          "text json": JSON.parse,
          // Parse text as xml
          "text xml": jQuery2.parseXML
        },
        // For options that shouldn't be deep extended:
        // you can add your own custom options here if
        // and when you create one that shouldn't be
        // deep extended (see ajaxExtend)
        flatOptions: {
          url: true,
          context: true
        }
      },
      // Creates a full fledged settings object into target
      // with both ajaxSettings and settings fields.
      // If target is omitted, writes into ajaxSettings.
      ajaxSetup: function(target, settings) {
        return settings ? (
          // Building a settings object
          ajaxExtend(ajaxExtend(target, jQuery2.ajaxSettings), settings)
        ) : (
          // Extending ajaxSettings
          ajaxExtend(jQuery2.ajaxSettings, target)
        );
      },
      ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
      ajaxTransport: addToPrefiltersOrTransports(transports),
      // Main method
      ajax: function(url, options) {
        if (typeof url === "object") {
          options = url;
          url = void 0;
        }
        options = options || {};
        var transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, urlAnchor, completed2, fireGlobals, i2, uncached, s = jQuery2.ajaxSetup({}, options), callbackContext = s.context || s, globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery2(callbackContext) : jQuery2.event, deferred = jQuery2.Deferred(), completeDeferred = jQuery2.Callbacks("once memory"), statusCode = s.statusCode || {}, requestHeaders = {}, requestHeadersNames = {}, strAbort = "canceled", jqXHR = {
          readyState: 0,
          // Builds headers hashtable if needed
          getResponseHeader: function(key) {
            var match;
            if (completed2) {
              if (!responseHeaders) {
                responseHeaders = {};
                while (match = rheaders.exec(responseHeadersString)) {
                  responseHeaders[match[1].toLowerCase() + " "] = (responseHeaders[match[1].toLowerCase() + " "] || []).concat(match[2]);
                }
              }
              match = responseHeaders[key.toLowerCase() + " "];
            }
            return match == null ? null : match.join(", ");
          },
          // Raw string
          getAllResponseHeaders: function() {
            return completed2 ? responseHeadersString : null;
          },
          // Caches the header
          setRequestHeader: function(name, value) {
            if (completed2 == null) {
              name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
              requestHeaders[name] = value;
            }
            return this;
          },
          // Overrides response content-type header
          overrideMimeType: function(type) {
            if (completed2 == null) {
              s.mimeType = type;
            }
            return this;
          },
          // Status-dependent callbacks
          statusCode: function(map) {
            var code;
            if (map) {
              if (completed2) {
                jqXHR.always(map[jqXHR.status]);
              } else {
                for (code in map) {
                  statusCode[code] = [statusCode[code], map[code]];
                }
              }
            }
            return this;
          },
          // Cancel the request
          abort: function(statusText) {
            var finalText = statusText || strAbort;
            if (transport) {
              transport.abort(finalText);
            }
            done2(0, finalText);
            return this;
          }
        };
        deferred.promise(jqXHR);
        s.url = ((url || s.url || location2.href) + "").replace(rprotocol, location2.protocol + "//");
        s.type = options.method || options.type || s.method || s.type;
        s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];
        if (s.crossDomain == null) {
          urlAnchor = document$1.createElement("a");
          try {
            urlAnchor.href = s.url;
            urlAnchor.href = urlAnchor.href;
            s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
          } catch (e) {
            s.crossDomain = true;
          }
        }
        inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);
        if (s.data && s.processData && typeof s.data !== "string") {
          s.data = jQuery2.param(s.data, s.traditional);
        }
        if (completed2) {
          return jqXHR;
        }
        fireGlobals = jQuery2.event && s.global;
        if (fireGlobals && jQuery2.active++ === 0) {
          jQuery2.event.trigger("ajaxStart");
        }
        s.type = s.type.toUpperCase();
        s.hasContent = !rnoContent.test(s.type);
        cacheURL = s.url.replace(rhash, "");
        if (!s.hasContent) {
          uncached = s.url.slice(cacheURL.length);
          if (s.data && (s.processData || typeof s.data === "string")) {
            cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;
            delete s.data;
          }
          if (s.cache === false) {
            cacheURL = cacheURL.replace(rantiCache, "$1");
            uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce.guid++ + uncached;
          }
          s.url = cacheURL + uncached;
        } else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
          s.data = s.data.replace(r20, "+");
        }
        if (s.ifModified) {
          if (jQuery2.lastModified[cacheURL]) {
            jqXHR.setRequestHeader("If-Modified-Since", jQuery2.lastModified[cacheURL]);
          }
          if (jQuery2.etag[cacheURL]) {
            jqXHR.setRequestHeader("If-None-Match", jQuery2.etag[cacheURL]);
          }
        }
        if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
          jqXHR.setRequestHeader("Content-Type", s.contentType);
        }
        jqXHR.setRequestHeader(
          "Accept",
          s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]
        );
        for (i2 in s.headers) {
          jqXHR.setRequestHeader(i2, s.headers[i2]);
        }
        if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed2)) {
          return jqXHR.abort();
        }
        strAbort = "abort";
        completeDeferred.add(s.complete);
        jqXHR.done(s.success);
        jqXHR.fail(s.error);
        transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);
        if (!transport) {
          done2(-1, "No Transport");
        } else {
          jqXHR.readyState = 1;
          if (fireGlobals) {
            globalEventContext.trigger("ajaxSend", [jqXHR, s]);
          }
          if (completed2) {
            return jqXHR;
          }
          if (s.async && s.timeout > 0) {
            timeoutTimer = window2.setTimeout(function() {
              jqXHR.abort("timeout");
            }, s.timeout);
          }
          try {
            completed2 = false;
            transport.send(requestHeaders, done2);
          } catch (e) {
            if (completed2) {
              throw e;
            }
            done2(-1, e);
          }
        }
        function done2(status, nativeStatusText, responses, headers) {
          var isSuccess, success, error, response, modified, statusText = nativeStatusText;
          if (completed2) {
            return;
          }
          completed2 = true;
          if (timeoutTimer) {
            window2.clearTimeout(timeoutTimer);
          }
          transport = void 0;
          responseHeadersString = headers || "";
          jqXHR.readyState = status > 0 ? 4 : 0;
          isSuccess = status >= 200 && status < 300 || status === 304;
          if (responses) {
            response = ajaxHandleResponses(s, jqXHR, responses);
          }
          if (!isSuccess && jQuery2.inArray("script", s.dataTypes) > -1 && jQuery2.inArray("json", s.dataTypes) < 0) {
            s.converters["text script"] = function() {
            };
          }
          response = ajaxConvert(s, response, jqXHR, isSuccess);
          if (isSuccess) {
            if (s.ifModified) {
              modified = jqXHR.getResponseHeader("Last-Modified");
              if (modified) {
                jQuery2.lastModified[cacheURL] = modified;
              }
              modified = jqXHR.getResponseHeader("etag");
              if (modified) {
                jQuery2.etag[cacheURL] = modified;
              }
            }
            if (status === 204 || s.type === "HEAD") {
              statusText = "nocontent";
            } else if (status === 304) {
              statusText = "notmodified";
            } else {
              statusText = response.state;
              success = response.data;
              error = response.error;
              isSuccess = !error;
            }
          } else {
            error = statusText;
            if (status || !statusText) {
              statusText = "error";
              if (status < 0) {
                status = 0;
              }
            }
          }
          jqXHR.status = status;
          jqXHR.statusText = (nativeStatusText || statusText) + "";
          if (isSuccess) {
            deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
          } else {
            deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
          }
          jqXHR.statusCode(statusCode);
          statusCode = void 0;
          if (fireGlobals) {
            globalEventContext.trigger(
              isSuccess ? "ajaxSuccess" : "ajaxError",
              [jqXHR, s, isSuccess ? success : error]
            );
          }
          completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
          if (fireGlobals) {
            globalEventContext.trigger("ajaxComplete", [jqXHR, s]);
            if (!--jQuery2.active) {
              jQuery2.event.trigger("ajaxStop");
            }
          }
        }
        return jqXHR;
      },
      getJSON: function(url, data, callback) {
        return jQuery2.get(url, data, callback, "json");
      },
      getScript: function(url, callback) {
        return jQuery2.get(url, void 0, callback, "script");
      }
    });
    jQuery2.each(["get", "post"], function(_i, method) {
      jQuery2[method] = function(url, data, callback, type) {
        if (typeof data === "function" || data === null) {
          type = type || callback;
          callback = data;
          data = void 0;
        }
        return jQuery2.ajax(jQuery2.extend({
          url,
          type: method,
          dataType: type,
          data,
          success: callback
        }, jQuery2.isPlainObject(url) && url));
      };
    });
    jQuery2.ajaxPrefilter(function(s) {
      var i2;
      for (i2 in s.headers) {
        if (i2.toLowerCase() === "content-type") {
          s.contentType = s.headers[i2] || "";
        }
      }
    });
    jQuery2._evalUrl = function(url, options, doc) {
      return jQuery2.ajax({
        url,
        // Make this explicit, since user can override this through ajaxSetup (trac-11264)
        type: "GET",
        dataType: "script",
        cache: true,
        async: false,
        global: false,
        scriptAttrs: options.crossOrigin ? { "crossOrigin": options.crossOrigin } : void 0,
        // Only evaluate the response if it is successful (gh-4126)
        // dataFilter is not invoked for failure responses, so using it instead
        // of the default converter is kludgy but it works.
        converters: {
          "text script": function() {
          }
        },
        dataFilter: function(response) {
          jQuery2.globalEval(response, options, doc);
        }
      });
    };
    jQuery2.fn.extend({
      wrapAll: function(html) {
        var wrap2;
        if (this[0]) {
          if (typeof html === "function") {
            html = html.call(this[0]);
          }
          wrap2 = jQuery2(html, this[0].ownerDocument).eq(0).clone(true);
          if (this[0].parentNode) {
            wrap2.insertBefore(this[0]);
          }
          wrap2.map(function() {
            var elem = this;
            while (elem.firstElementChild) {
              elem = elem.firstElementChild;
            }
            return elem;
          }).append(this);
        }
        return this;
      },
      wrapInner: function(html) {
        if (typeof html === "function") {
          return this.each(function(i2) {
            jQuery2(this).wrapInner(html.call(this, i2));
          });
        }
        return this.each(function() {
          var self2 = jQuery2(this), contents = self2.contents();
          if (contents.length) {
            contents.wrapAll(html);
          } else {
            self2.append(html);
          }
        });
      },
      wrap: function(html) {
        var htmlIsFunction = typeof html === "function";
        return this.each(function(i2) {
          jQuery2(this).wrapAll(htmlIsFunction ? html.call(this, i2) : html);
        });
      },
      unwrap: function(selector) {
        this.parent(selector).not("body").each(function() {
          jQuery2(this).replaceWith(this.childNodes);
        });
        return this;
      }
    });
    jQuery2.expr.pseudos.hidden = function(elem) {
      return !jQuery2.expr.pseudos.visible(elem);
    };
    jQuery2.expr.pseudos.visible = function(elem) {
      return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
    };
    jQuery2.ajaxSettings.xhr = function() {
      return new window2.XMLHttpRequest();
    };
    var xhrSuccessStatus = {
      // File protocol always yields status code 0, assume 200
      0: 200
    };
    jQuery2.ajaxTransport(function(options) {
      var callback;
      return {
        send: function(headers, complete) {
          var i2, xhr = options.xhr();
          xhr.open(
            options.type,
            options.url,
            options.async,
            options.username,
            options.password
          );
          if (options.xhrFields) {
            for (i2 in options.xhrFields) {
              xhr[i2] = options.xhrFields[i2];
            }
          }
          if (options.mimeType && xhr.overrideMimeType) {
            xhr.overrideMimeType(options.mimeType);
          }
          if (!options.crossDomain && !headers["X-Requested-With"]) {
            headers["X-Requested-With"] = "XMLHttpRequest";
          }
          for (i2 in headers) {
            xhr.setRequestHeader(i2, headers[i2]);
          }
          callback = function(type) {
            return function() {
              if (callback) {
                callback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = null;
                if (type === "abort") {
                  xhr.abort();
                } else if (type === "error") {
                  complete(
                    // File: protocol always yields status 0; see trac-8605, trac-14207
                    xhr.status,
                    xhr.statusText
                  );
                } else {
                  complete(
                    xhrSuccessStatus[xhr.status] || xhr.status,
                    xhr.statusText,
                    // For XHR2 non-text, let the caller handle it (gh-2498)
                    (xhr.responseType || "text") === "text" ? { text: xhr.responseText } : { binary: xhr.response },
                    xhr.getAllResponseHeaders()
                  );
                }
              }
            };
          };
          xhr.onload = callback();
          xhr.onabort = xhr.onerror = xhr.ontimeout = callback("error");
          callback = callback("abort");
          try {
            xhr.send(options.hasContent && options.data || null);
          } catch (e) {
            if (callback) {
              throw e;
            }
          }
        },
        abort: function() {
          if (callback) {
            callback();
          }
        }
      };
    });
    function canUseScriptTag(s) {
      return s.scriptAttrs || !s.headers && (s.crossDomain || // When dealing with JSONP (`s.dataTypes` include "json" then)
      // don't use a script tag so that error responses still may have
      // `responseJSON` set. Continue using a script tag for JSONP requests that:
      //   * are cross-domain as AJAX requests won't work without a CORS setup
      //   * have `scriptAttrs` set as that's a script-only functionality
      // Note that this means JSONP requests violate strict CSP script-src settings.
      // A proper solution is to migrate from using JSONP to a CORS setup.
      s.async && jQuery2.inArray("json", s.dataTypes) < 0);
    }
    jQuery2.ajaxSetup({
      accepts: {
        script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
      },
      converters: {
        "text script": function(text) {
          jQuery2.globalEval(text);
          return text;
        }
      }
    });
    jQuery2.ajaxPrefilter("script", function(s) {
      if (s.cache === void 0) {
        s.cache = false;
      }
      if (canUseScriptTag(s)) {
        s.type = "GET";
      }
    });
    jQuery2.ajaxTransport("script", function(s) {
      if (canUseScriptTag(s)) {
        var script, callback;
        return {
          send: function(_, complete) {
            script = jQuery2("<script>").attr(s.scriptAttrs || {}).prop({ charset: s.scriptCharset, src: s.url }).on("load error", callback = function(evt) {
              script.remove();
              callback = null;
              if (evt) {
                complete(evt.type === "error" ? 404 : 200, evt.type);
              }
            });
            document$1.head.appendChild(script[0]);
          },
          abort: function() {
            if (callback) {
              callback();
            }
          }
        };
      }
    });
    var oldCallbacks = [], rjsonp = /(=)\?(?=&|$)|\?\?/;
    jQuery2.ajaxSetup({
      jsonp: "callback",
      jsonpCallback: function() {
        var callback = oldCallbacks.pop() || jQuery2.expando + "_" + nonce.guid++;
        this[callback] = true;
        return callback;
      }
    });
    jQuery2.ajaxPrefilter("jsonp", function(s, originalSettings, jqXHR) {
      var callbackName, overwritten, responseContainer, jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");
      callbackName = s.jsonpCallback = typeof s.jsonpCallback === "function" ? s.jsonpCallback() : s.jsonpCallback;
      if (jsonProp) {
        s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
      } else if (s.jsonp !== false) {
        s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
      }
      s.converters["script json"] = function() {
        if (!responseContainer) {
          jQuery2.error(callbackName + " was not called");
        }
        return responseContainer[0];
      };
      s.dataTypes[0] = "json";
      overwritten = window2[callbackName];
      window2[callbackName] = function() {
        responseContainer = arguments;
      };
      jqXHR.always(function() {
        if (overwritten === void 0) {
          jQuery2(window2).removeProp(callbackName);
        } else {
          window2[callbackName] = overwritten;
        }
        if (s[callbackName]) {
          s.jsonpCallback = originalSettings.jsonpCallback;
          oldCallbacks.push(callbackName);
        }
        if (responseContainer && typeof overwritten === "function") {
          overwritten(responseContainer[0]);
        }
        responseContainer = overwritten = void 0;
      });
      return "script";
    });
    jQuery2.ajaxPrefilter(function(s, origOptions) {
      if (typeof s.data !== "string" && !jQuery2.isPlainObject(s.data) && !Array.isArray(s.data) && // Don't disable data processing if explicitly set by the user.
      !("processData" in origOptions)) {
        s.processData = false;
      }
      if (s.data instanceof window2.FormData) {
        s.contentType = false;
      }
    });
    jQuery2.parseHTML = function(data, context, keepScripts) {
      if (typeof data !== "string" && !isObviousHtml(data + "")) {
        return [];
      }
      if (typeof context === "boolean") {
        keepScripts = context;
        context = false;
      }
      var parsed, scripts;
      if (!context) {
        context = new window2.DOMParser().parseFromString("", "text/html");
      }
      parsed = rsingleTag.exec(data);
      scripts = !keepScripts && [];
      if (parsed) {
        return [context.createElement(parsed[1])];
      }
      parsed = buildFragment([data], context, scripts);
      if (scripts && scripts.length) {
        jQuery2(scripts).remove();
      }
      return jQuery2.merge([], parsed.childNodes);
    };
    jQuery2.fn.load = function(url, params, callback) {
      var selector, type, response, self2 = this, off = url.indexOf(" ");
      if (off > -1) {
        selector = stripAndCollapse(url.slice(off));
        url = url.slice(0, off);
      }
      if (typeof params === "function") {
        callback = params;
        params = void 0;
      } else if (params && typeof params === "object") {
        type = "POST";
      }
      if (self2.length > 0) {
        jQuery2.ajax({
          url,
          // If "type" variable is undefined, then "GET" method will be used.
          // Make value of this field explicit since
          // user can override it through ajaxSetup method
          type: type || "GET",
          dataType: "html",
          data: params
        }).done(function(responseText) {
          response = arguments;
          self2.html(selector ? (
            // If a selector was specified, locate the right elements in a dummy div
            // Exclude scripts to avoid IE 'Permission Denied' errors
            jQuery2("<div>").append(jQuery2.parseHTML(responseText)).find(selector)
          ) : (
            // Otherwise use the full result
            responseText
          ));
        }).always(callback && function(jqXHR, status) {
          self2.each(function() {
            callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
          });
        });
      }
      return this;
    };
    jQuery2.expr.pseudos.animated = function(elem) {
      return jQuery2.grep(jQuery2.timers, function(fn) {
        return elem === fn.elem;
      }).length;
    };
    jQuery2.offset = {
      setOffset: function(elem, options, i2) {
        var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition, position = jQuery2.css(elem, "position"), curElem = jQuery2(elem), props = {};
        if (position === "static") {
          elem.style.position = "relative";
        }
        curOffset = curElem.offset();
        curCSSTop = jQuery2.css(elem, "top");
        curCSSLeft = jQuery2.css(elem, "left");
        calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;
        if (calculatePosition) {
          curPosition = curElem.position();
          curTop = curPosition.top;
          curLeft = curPosition.left;
        } else {
          curTop = parseFloat(curCSSTop) || 0;
          curLeft = parseFloat(curCSSLeft) || 0;
        }
        if (typeof options === "function") {
          options = options.call(elem, i2, jQuery2.extend({}, curOffset));
        }
        if (options.top != null) {
          props.top = options.top - curOffset.top + curTop;
        }
        if (options.left != null) {
          props.left = options.left - curOffset.left + curLeft;
        }
        if ("using" in options) {
          options.using.call(elem, props);
        } else {
          curElem.css(props);
        }
      }
    };
    jQuery2.fn.extend({
      // offset() relates an element's border box to the document origin
      offset: function(options) {
        if (arguments.length) {
          return options === void 0 ? this : this.each(function(i2) {
            jQuery2.offset.setOffset(this, options, i2);
          });
        }
        var rect, win, elem = this[0];
        if (!elem) {
          return;
        }
        if (!elem.getClientRects().length) {
          return { top: 0, left: 0 };
        }
        rect = elem.getBoundingClientRect();
        win = elem.ownerDocument.defaultView;
        return {
          top: rect.top + win.pageYOffset,
          left: rect.left + win.pageXOffset
        };
      },
      // position() relates an element's margin box to its offset parent's padding box
      // This corresponds to the behavior of CSS absolute positioning
      position: function() {
        if (!this[0]) {
          return;
        }
        var offsetParent, offset, doc, elem = this[0], parentOffset = { top: 0, left: 0 };
        if (jQuery2.css(elem, "position") === "fixed") {
          offset = elem.getBoundingClientRect();
        } else {
          offset = this.offset();
          doc = elem.ownerDocument;
          offsetParent = elem.offsetParent || doc.documentElement;
          while (offsetParent && offsetParent !== doc.documentElement && jQuery2.css(offsetParent, "position") === "static") {
            offsetParent = offsetParent.offsetParent || doc.documentElement;
          }
          if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 && jQuery2.css(offsetParent, "position") !== "static") {
            parentOffset = jQuery2(offsetParent).offset();
            parentOffset.top += jQuery2.css(offsetParent, "borderTopWidth", true);
            parentOffset.left += jQuery2.css(offsetParent, "borderLeftWidth", true);
          }
        }
        return {
          top: offset.top - parentOffset.top - jQuery2.css(elem, "marginTop", true),
          left: offset.left - parentOffset.left - jQuery2.css(elem, "marginLeft", true)
        };
      },
      // This method will return documentElement in the following cases:
      // 1) For the element inside the iframe without offsetParent, this method will return
      //    documentElement of the parent window
      // 2) For the hidden or detached element
      // 3) For body or html element, i.e. in case of the html node - it will return itself
      //
      // but those exceptions were never presented as a real life use-cases
      // and might be considered as more preferable results.
      //
      // This logic, however, is not guaranteed and can change at any point in the future
      offsetParent: function() {
        return this.map(function() {
          var offsetParent = this.offsetParent;
          while (offsetParent && jQuery2.css(offsetParent, "position") === "static") {
            offsetParent = offsetParent.offsetParent;
          }
          return offsetParent || documentElement$1;
        });
      }
    });
    jQuery2.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function(method, prop) {
      var top = "pageYOffset" === prop;
      jQuery2.fn[method] = function(val) {
        return access(this, function(elem, method2, val2) {
          var win;
          if (isWindow(elem)) {
            win = elem;
          } else if (elem.nodeType === 9) {
            win = elem.defaultView;
          }
          if (val2 === void 0) {
            return win ? win[prop] : elem[method2];
          }
          if (win) {
            win.scrollTo(
              !top ? val2 : win.pageXOffset,
              top ? val2 : win.pageYOffset
            );
          } else {
            elem[method2] = val2;
          }
        }, method, val, arguments.length);
      };
    });
    jQuery2.each({ Height: "height", Width: "width" }, function(name, type) {
      jQuery2.each({
        padding: "inner" + name,
        content: type,
        "": "outer" + name
      }, function(defaultExtra, funcName) {
        jQuery2.fn[funcName] = function(margin, value) {
          var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"), extra = defaultExtra || (margin === true || value === true ? "margin" : "border");
          return access(this, function(elem, type2, value2) {
            var doc;
            if (isWindow(elem)) {
              return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
            }
            if (elem.nodeType === 9) {
              doc = elem.documentElement;
              return Math.max(
                elem.body["scroll" + name],
                doc["scroll" + name],
                elem.body["offset" + name],
                doc["offset" + name],
                doc["client" + name]
              );
            }
            return value2 === void 0 ? (
              // Get width or height on the element, requesting but not forcing parseFloat
              jQuery2.css(elem, type2, extra)
            ) : (
              // Set width or height on the element
              jQuery2.style(elem, type2, value2, extra)
            );
          }, type, chainable ? margin : void 0, chainable);
        };
      });
    });
    jQuery2.each([
      "ajaxStart",
      "ajaxStop",
      "ajaxComplete",
      "ajaxError",
      "ajaxSuccess",
      "ajaxSend"
    ], function(_i, type) {
      jQuery2.fn[type] = function(fn) {
        return this.on(type, fn);
      };
    });
    jQuery2.fn.extend({
      bind: function(types, data, fn) {
        return this.on(types, null, data, fn);
      },
      unbind: function(types, fn) {
        return this.off(types, null, fn);
      },
      delegate: function(selector, types, data, fn) {
        return this.on(types, selector, data, fn);
      },
      undelegate: function(selector, types, fn) {
        return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
      },
      hover: function(fnOver, fnOut) {
        return this.on("mouseenter", fnOver).on("mouseleave", fnOut || fnOver);
      }
    });
    jQuery2.each(
      "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),
      function(_i, name) {
        jQuery2.fn[name] = function(data, fn) {
          return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
        };
      }
    );
    jQuery2.proxy = function(fn, context) {
      var tmp, args, proxy;
      if (typeof context === "string") {
        tmp = fn[context];
        context = fn;
        fn = tmp;
      }
      if (typeof fn !== "function") {
        return void 0;
      }
      args = slice.call(arguments, 2);
      proxy = function() {
        return fn.apply(context || this, args.concat(slice.call(arguments)));
      };
      proxy.guid = fn.guid = fn.guid || jQuery2.guid++;
      return proxy;
    };
    jQuery2.holdReady = function(hold) {
      if (hold) {
        jQuery2.readyWait++;
      } else {
        jQuery2.ready(true);
      }
    };
    jQuery2.expr[":"] = jQuery2.expr.filters = jQuery2.expr.pseudos;
    if (typeof define === "function" && define.amd) {
      define("jquery", [], function() {
        return jQuery2;
      });
    }
    var _jQuery = window2.jQuery, _$ = window2.$;
    jQuery2.noConflict = function(deep) {
      if (window2.$ === jQuery2) {
        window2.$ = _$;
      }
      if (deep && window2.jQuery === jQuery2) {
        window2.jQuery = _jQuery;
      }
      return jQuery2;
    };
    if (typeof noGlobal === "undefined") {
      window2.jQuery = window2.$ = jQuery2;
    }
    return jQuery2;
  }
  var jQuery = jQueryFactory(window, true);
  var jquery_module_default = jQuery;

  // node_modules/datatables.net/js/dataTables.mjs
  var $ = jquery_module_default;
  var DataTable = function(selector, options) {
    if (DataTable.factory(selector, options)) {
      return DataTable;
    }
    if (this instanceof DataTable) {
      return $(selector).DataTable(options);
    } else {
      options = selector;
    }
    var _that = this;
    var emptyInit = options === void 0;
    var len = this.length;
    if (emptyInit) {
      options = {};
    }
    this.api = function() {
      return new _Api(this);
    };
    this.each(function() {
      var o = {};
      var oInit = len > 1 ? (
        // optimisation for single table case
        _fnExtend(o, options, true)
      ) : options;
      var i = 0, iLen;
      var sId = this.getAttribute("id");
      var defaults = DataTable.defaults;
      var $this = $(this);
      if (this.nodeName.toLowerCase() != "table") {
        _fnLog(null, 0, "Non-table node initialisation (" + this.nodeName + ")", 2);
        return;
      }
      if (oInit.on && oInit.on.options) {
        _fnListener($this, "options", oInit.on.options);
      }
      $this.trigger("options.dt", oInit);
      _fnCompatOpts(defaults);
      _fnCompatCols(defaults.column);
      _fnCamelToHungarian(defaults, defaults, true);
      _fnCamelToHungarian(defaults.column, defaults.column, true);
      _fnCamelToHungarian(defaults, $.extend(oInit, _fnEscapeObject($this.data())), true);
      var allSettings = DataTable.settings;
      for (i = 0, iLen = allSettings.length; i < iLen; i++) {
        var s = allSettings[i];
        if (s.nTable == this || s.nTHead && s.nTHead.parentNode == this || s.nTFoot && s.nTFoot.parentNode == this) {
          var bRetrieve = oInit.bRetrieve !== void 0 ? oInit.bRetrieve : defaults.bRetrieve;
          var bDestroy = oInit.bDestroy !== void 0 ? oInit.bDestroy : defaults.bDestroy;
          if (emptyInit || bRetrieve) {
            return s.oInstance;
          } else if (bDestroy) {
            new DataTable.Api(s).destroy();
            break;
          } else {
            _fnLog(s, 0, "Cannot reinitialise DataTable", 3);
            return;
          }
        }
        if (s.sTableId == this.id) {
          allSettings.splice(i, 1);
          break;
        }
      }
      if (sId === null || sId === "") {
        sId = "DataTables_Table_" + DataTable.ext._unique++;
        this.id = sId;
      }
      $this.children("colgroup").remove();
      var oSettings = $.extend(true, {}, DataTable.models.oSettings, {
        "sDestroyWidth": $this[0].style.width,
        "sInstance": sId,
        "sTableId": sId,
        colgroup: $("<colgroup>"),
        fastData: function(row, column, type) {
          return _fnGetCellData(oSettings, row, column, type);
        }
      });
      oSettings.nTable = this;
      oSettings.oInit = oInit;
      allSettings.push(oSettings);
      oSettings.api = new _Api(oSettings);
      oSettings.oInstance = _that.length === 1 ? _that : $this.dataTable();
      _fnCompatOpts(oInit);
      if (oInit.aLengthMenu && !oInit.iDisplayLength) {
        oInit.iDisplayLength = Array.isArray(oInit.aLengthMenu[0]) ? oInit.aLengthMenu[0][0] : $.isPlainObject(oInit.aLengthMenu[0]) ? oInit.aLengthMenu[0].value : oInit.aLengthMenu[0];
      }
      oInit = _fnExtend($.extend(true, {}, defaults), oInit);
      _fnMap(oSettings.oFeatures, oInit, [
        "bPaginate",
        "bLengthChange",
        "bFilter",
        "bSort",
        "bSortMulti",
        "bInfo",
        "bProcessing",
        "bAutoWidth",
        "bSortClasses",
        "bServerSide",
        "bDeferRender"
      ]);
      _fnMap(oSettings, oInit, [
        "ajax",
        "fnFormatNumber",
        "sServerMethod",
        "aaSorting",
        "aaSortingFixed",
        "aLengthMenu",
        "sPaginationType",
        "iStateDuration",
        "bSortCellsTop",
        "iTabIndex",
        "sDom",
        "fnStateLoadCallback",
        "fnStateSaveCallback",
        "renderer",
        "searchDelay",
        "rowId",
        "caption",
        "layout",
        "orderDescReverse",
        "orderIndicators",
        "orderHandler",
        "titleRow",
        "typeDetect",
        "columnTitleTag",
        ["iCookieDuration", "iStateDuration"],
        // backwards compat
        ["oSearch", "oPreviousSearch"],
        ["aoSearchCols", "aoPreSearchCols"],
        ["iDisplayLength", "_iDisplayLength"]
      ]);
      _fnMap(oSettings.oScroll, oInit, [
        ["sScrollX", "sX"],
        ["sScrollXInner", "sXInner"],
        ["sScrollY", "sY"],
        ["bScrollCollapse", "bCollapse"]
      ]);
      _fnMap(oSettings.oLanguage, oInit, "fnInfoCallback");
      _fnCallbackReg(oSettings, "aoDrawCallback", oInit.fnDrawCallback);
      _fnCallbackReg(oSettings, "aoStateSaveParams", oInit.fnStateSaveParams);
      _fnCallbackReg(oSettings, "aoStateLoadParams", oInit.fnStateLoadParams);
      _fnCallbackReg(oSettings, "aoStateLoaded", oInit.fnStateLoaded);
      _fnCallbackReg(oSettings, "aoRowCallback", oInit.fnRowCallback);
      _fnCallbackReg(oSettings, "aoRowCreatedCallback", oInit.fnCreatedRow);
      _fnCallbackReg(oSettings, "aoHeaderCallback", oInit.fnHeaderCallback);
      _fnCallbackReg(oSettings, "aoFooterCallback", oInit.fnFooterCallback);
      _fnCallbackReg(oSettings, "aoInitComplete", oInit.fnInitComplete);
      _fnCallbackReg(oSettings, "aoPreDrawCallback", oInit.fnPreDrawCallback);
      oSettings.rowIdFn = _fnGetObjectDataFn(oInit.rowId);
      if (oInit.on) {
        Object.keys(oInit.on).forEach(function(key) {
          _fnListener($this, key, oInit.on[key]);
        });
      }
      _fnBrowserDetect(oSettings);
      var oClasses = oSettings.oClasses;
      $.extend(oClasses, DataTable.ext.classes, oInit.oClasses);
      $this.addClass(oClasses.table);
      if (!oSettings.oFeatures.bPaginate) {
        oInit.iDisplayStart = 0;
      }
      if (oSettings.iInitDisplayStart === void 0) {
        oSettings.iInitDisplayStart = oInit.iDisplayStart;
        oSettings._iDisplayStart = oInit.iDisplayStart;
      }
      var defer = oInit.iDeferLoading;
      if (defer !== null) {
        oSettings.deferLoading = true;
        var tmp = Array.isArray(defer);
        oSettings._iRecordsDisplay = tmp ? defer[0] : defer;
        oSettings._iRecordsTotal = tmp ? defer[1] : defer;
      }
      var columnsInit = [];
      var thead = this.getElementsByTagName("thead");
      var initHeaderLayout = _fnDetectHeader(oSettings, thead[0]);
      if (oInit.aoColumns) {
        columnsInit = oInit.aoColumns;
      } else if (initHeaderLayout.length) {
        for (i = 0, iLen = initHeaderLayout[0].length; i < iLen; i++) {
          columnsInit.push(null);
        }
      }
      for (i = 0, iLen = columnsInit.length; i < iLen; i++) {
        _fnAddColumn(oSettings);
      }
      _fnApplyColumnDefs(oSettings, oInit.aoColumnDefs, columnsInit, initHeaderLayout, function(iCol, oDef) {
        _fnColumnOptions(oSettings, iCol, oDef);
      });
      var rowOne = $this.children("tbody").find("tr:first-child").eq(0);
      if (rowOne.length) {
        var a = function(cell, name) {
          return cell.getAttribute("data-" + name) !== null ? name : null;
        };
        $(rowOne[0]).children("th, td").each(function(i2, cell) {
          var col = oSettings.aoColumns[i2];
          if (!col) {
            _fnLog(oSettings, 0, "Incorrect column count", 18);
          }
          if (col.mData === i2) {
            var sort = a(cell, "sort") || a(cell, "order");
            var filter = a(cell, "filter") || a(cell, "search");
            if (sort !== null || filter !== null) {
              col.mData = {
                _: i2 + ".display",
                sort: sort !== null ? i2 + ".@data-" + sort : void 0,
                type: sort !== null ? i2 + ".@data-" + sort : void 0,
                filter: filter !== null ? i2 + ".@data-" + filter : void 0
              };
              col._isArrayHost = true;
              _fnColumnOptions(oSettings, i2);
            }
          }
        });
      }
      _fnCallbackReg(oSettings, "aoDrawCallback", _fnSaveState);
      var features = oSettings.oFeatures;
      if (oInit.bStateSave) {
        features.bStateSave = true;
      }
      if (oInit.aaSorting === void 0) {
        var sorting = oSettings.aaSorting;
        for (i = 0, iLen = sorting.length; i < iLen; i++) {
          sorting[i][1] = oSettings.aoColumns[i].asSorting[0];
        }
      }
      _fnSortingClasses(oSettings);
      _fnCallbackReg(oSettings, "aoDrawCallback", function() {
        if (oSettings.bSorted || _fnDataSource(oSettings) === "ssp" || features.bDeferRender) {
          _fnSortingClasses(oSettings);
        }
      });
      var caption = $this.children("caption");
      if (oSettings.caption) {
        if (caption.length === 0) {
          caption = $("<caption/>").prependTo($this);
        }
        caption.html(oSettings.caption);
      }
      if (caption.length) {
        caption[0]._captionSide = caption.css("caption-side");
        oSettings.captionNode = caption[0];
      }
      if (caption.length) {
        oSettings.colgroup.insertAfter(caption);
      } else {
        oSettings.colgroup.prependTo(oSettings.nTable);
      }
      if (thead.length === 0) {
        thead = $("<thead/>").appendTo($this);
      }
      oSettings.nTHead = thead[0];
      var tbody = $this.children("tbody");
      if (tbody.length === 0) {
        tbody = $("<tbody/>").insertAfter(thead);
      }
      oSettings.nTBody = tbody[0];
      var tfoot = $this.children("tfoot");
      if (tfoot.length === 0) {
        tfoot = $("<tfoot/>").appendTo($this);
      }
      oSettings.nTFoot = tfoot[0];
      oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
      oSettings.bInitialised = true;
      var oLanguage = oSettings.oLanguage;
      $.extend(true, oLanguage, oInit.oLanguage);
      if (oLanguage.sUrl) {
        $.ajax({
          dataType: "json",
          url: oLanguage.sUrl,
          success: function(json) {
            _fnCamelToHungarian(defaults.oLanguage, json);
            $.extend(true, oLanguage, json, oSettings.oInit.oLanguage);
            _fnCallbackFire(oSettings, null, "i18n", [oSettings], true);
            _fnInitialise(oSettings);
          },
          error: function() {
            _fnLog(oSettings, 0, "i18n file loading error", 21);
            _fnInitialise(oSettings);
          }
        });
      } else {
        _fnCallbackFire(oSettings, null, "i18n", [oSettings], true);
        _fnInitialise(oSettings);
      }
    });
    _that = null;
    return this;
  };
  DataTable.ext = _ext = {
    /**
     * DataTables build type (expanded by the download builder)
     *
     *  @type string
     */
    builder: "-source-",
    /**
     * Buttons. For use with the Buttons extension for DataTables. This is
     * defined here so other extensions can define buttons regardless of load
     * order. It is _not_ used by DataTables core.
     *
     *  @type object
     *  @default {}
     */
    buttons: {},
    /**
     * ColumnControl buttons and content
     *
     *  @type object
     */
    ccContent: {},
    /**
     * Element class names
     *
     *  @type object
     *  @default {}
     */
    classes: {},
    /**
     * Error reporting.
     * 
     * How should DataTables report an error. Can take the value 'alert',
     * 'throw', 'none' or a function.
     *
     *  @type string|function
     *  @default alert
     */
    errMode: "alert",
    /** HTML entity escaping */
    escape: {
      /** When reading data-* attributes for initialisation options */
      attributes: false
    },
    /**
     * Legacy so v1 plug-ins don't throw js errors on load
     */
    feature: [],
    /**
     * Feature plug-ins.
     * 
     * This is an object of callbacks which provide the features for DataTables
     * to be initialised via the `layout` option.
     */
    features: {},
    /**
     * Row searching.
     * 
     * This method of searching is complimentary to the default type based
     * searching, and a lot more comprehensive as it allows you complete control
     * over the searching logic. Each element in this array is a function
     * (parameters described below) that is called for every row in the table,
     * and your logic decides if it should be included in the searching data set
     * or not.
     *
     * Searching functions have the following input parameters:
     *
     * 1. `{object}` DataTables settings object: see
     *    {@link DataTable.models.oSettings}
     * 2. `{array|object}` Data for the row to be processed (same as the
     *    original format that was passed in as the data source, or an array
     *    from a DOM data source
     * 3. `{int}` Row index ({@link DataTable.models.oSettings.aoData}), which
     *    can be useful to retrieve the `TR` element if you need DOM interaction.
     *
     * And the following return is expected:
     *
     * * {boolean} Include the row in the searched result set (true) or not
     *   (false)
     *
     * Note that as with the main search ability in DataTables, technically this
     * is "filtering", since it is subtractive. However, for consistency in
     * naming we call it searching here.
     *
     *  @type array
     *  @default []
     *
     *  @example
     *    // The following example shows custom search being applied to the
     *    // fourth column (i.e. the data[3] index) based on two input values
     *    // from the end-user, matching the data in a certain range.
     *    $.fn.dataTable.ext.search.push(
     *      function( settings, data, dataIndex ) {
     *        var min = document.getElementById('min').value * 1;
     *        var max = document.getElementById('max').value * 1;
     *        var version = data[3] == "-" ? 0 : data[3]*1;
     *
     *        if ( min == "" && max == "" ) {
     *          return true;
     *        }
     *        else if ( min == "" && version < max ) {
     *          return true;
     *        }
     *        else if ( min < version && "" == max ) {
     *          return true;
     *        }
     *        else if ( min < version && version < max ) {
     *          return true;
     *        }
     *        return false;
     *      }
     *    );
     */
    search: [],
    /**
     * Selector extensions
     *
     * The `selector` option can be used to extend the options available for the
     * selector modifier options (`selector-modifier` object data type) that
     * each of the three built in selector types offer (row, column and cell +
     * their plural counterparts). For example the Select extension uses this
     * mechanism to provide an option to select only rows, columns and cells
     * that have been marked as selected by the end user (`{selected: true}`),
     * which can be used in conjunction with the existing built in selector
     * options.
     *
     * Each property is an array to which functions can be pushed. The functions
     * take three attributes:
     *
     * * Settings object for the host table
     * * Options object (`selector-modifier` object type)
     * * Array of selected item indexes
     *
     * The return is an array of the resulting item indexes after the custom
     * selector has been applied.
     *
     *  @type object
     */
    selector: {
      cell: [],
      column: [],
      row: []
    },
    /**
     * Legacy configuration options. Enable and disable legacy options that
     * are available in DataTables.
     *
     *  @type object
     */
    legacy: {
      /**
       * Enable / disable DataTables 1.9 compatible server-side processing
       * requests
       *
       *  @type boolean
       *  @default null
       */
      ajax: null
    },
    /**
     * Pagination plug-in methods.
     * 
     * Each entry in this object is a function and defines which buttons should
     * be shown by the pagination rendering method that is used for the table:
     * {@link DataTable.ext.renderer.pageButton}. The renderer addresses how the
     * buttons are displayed in the document, while the functions here tell it
     * what buttons to display. This is done by returning an array of button
     * descriptions (what each button will do).
     *
     * Pagination types (the four built in options and any additional plug-in
     * options defined here) can be used through the `paginationType`
     * initialisation parameter.
     *
     * The functions defined take two parameters:
     *
     * 1. `{int} page` The current page index
     * 2. `{int} pages` The number of pages in the table
     *
     * Each function is expected to return an array where each element of the
     * array can be one of:
     *
     * * `first` - Jump to first page when activated
     * * `last` - Jump to last page when activated
     * * `previous` - Show previous page when activated
     * * `next` - Show next page when activated
     * * `{int}` - Show page of the index given
     * * `{array}` - A nested array containing the above elements to add a
     *   containing 'DIV' element (might be useful for styling).
     *
     * Note that DataTables v1.9- used this object slightly differently whereby
     * an object with two functions would be defined for each plug-in. That
     * ability is still supported by DataTables 1.10+ to provide backwards
     * compatibility, but this option of use is now decremented and no longer
     * documented in DataTables 1.10+.
     *
     *  @type object
     *  @default {}
     *
     *  @example
     *    // Show previous, next and current page buttons only
     *    $.fn.dataTableExt.oPagination.current = function ( page, pages ) {
     *      return [ 'previous', page, 'next' ];
     *    };
     */
    pager: {},
    renderer: {
      pageButton: {},
      header: {}
    },
    /**
     * Ordering plug-ins - custom data source
     * 
     * The extension options for ordering of data available here is complimentary
     * to the default type based ordering that DataTables typically uses. It
     * allows much greater control over the data that is being used to
     * order a column, but is necessarily therefore more complex.
     * 
     * This type of ordering is useful if you want to do ordering based on data
     * live from the DOM (for example the contents of an 'input' element) rather
     * than just the static string that DataTables knows of.
     * 
     * The way these plug-ins work is that you create an array of the values you
     * wish to be ordering for the column in question and then return that
     * array. The data in the array much be in the index order of the rows in
     * the table (not the currently ordering order!). Which order data gathering
     * function is run here depends on the `dt-init columns.orderDataType`
     * parameter that is used for the column (if any).
     *
     * The functions defined take two parameters:
     *
     * 1. `{object}` DataTables settings object: see
     *    {@link DataTable.models.oSettings}
     * 2. `{int}` Target column index
     *
     * Each function is expected to return an array:
     *
     * * `{array}` Data for the column to be ordering upon
     *
     *  @type array
     *
     *  @example
     *    // Ordering using `input` node values
     *    $.fn.dataTable.ext.order['dom-text'] = function  ( settings, col )
     *    {
     *      return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
     *        return $('input', td).val();
     *      } );
     *    }
     */
    order: {},
    /**
     * Type based plug-ins.
     *
     * Each column in DataTables has a type assigned to it, either by automatic
     * detection or by direct assignment using the `type` option for the column.
     * The type of a column will effect how it is ordering and search (plug-ins
     * can also make use of the column type if required).
     *
     * @namespace
     */
    type: {
      /**
       * Automatic column class assignment
       */
      className: {},
      /**
       * Type detection functions.
       *
       * The functions defined in this object are used to automatically detect
       * a column's type, making initialisation of DataTables super easy, even
       * when complex data is in the table.
       *
       * The functions defined take two parameters:
       *
          *  1. `{*}` Data from the column cell to be analysed
          *  2. `{settings}` DataTables settings object. This can be used to
          *     perform context specific type detection - for example detection
          *     based on language settings such as using a comma for a decimal
          *     place. Generally speaking the options from the settings will not
          *     be required
       *
       * Each function is expected to return:
       *
       * * `{string|null}` Data type detected, or null if unknown (and thus
       *   pass it on to the other type detection functions.
       *
       *  @type array
       *
       *  @example
       *    // Currency type detection plug-in:
       *    $.fn.dataTable.ext.type.detect.push(
       *      function ( data, settings ) {
       *        // Check the numeric part
       *        if ( ! data.substring(1).match(/[0-9]/) ) {
       *          return null;
       *        }
       *
       *        // Check prefixed by currency
       *        if ( data.charAt(0) == '$' || data.charAt(0) == '&pound;' ) {
       *          return 'currency';
       *        }
       *        return null;
       *      }
       *    );
       */
      detect: [],
      /**
       * Automatic renderer assignment
       */
      render: {},
      /**
       * Type based search formatting.
       *
       * The type based searching functions can be used to pre-format the
       * data to be search on. For example, it can be used to strip HTML
       * tags or to de-format telephone numbers for numeric only searching.
       *
       * Note that is a search is not defined for a column of a given type,
       * no search formatting will be performed.
       * 
       * Pre-processing of searching data plug-ins - When you assign the sType
       * for a column (or have it automatically detected for you by DataTables
       * or a type detection plug-in), you will typically be using this for
       * custom sorting, but it can also be used to provide custom searching
       * by allowing you to pre-processing the data and returning the data in
       * the format that should be searched upon. This is done by adding
       * functions this object with a parameter name which matches the sType
       * for that target column. This is the corollary of <i>afnSortData</i>
       * for searching data.
       *
       * The functions defined take a single parameter:
       *
          *  1. `{*}` Data from the column cell to be prepared for searching
       *
       * Each function is expected to return:
       *
       * * `{string|null}` Formatted string that will be used for the searching.
       *
       *  @type object
       *  @default {}
       *
       *  @example
       *    $.fn.dataTable.ext.type.search['title-numeric'] = function ( d ) {
       *      return d.replace(/\n/g," ").replace( /<.*?>/g, "" );
       *    }
       */
      search: {},
      /**
       * Type based ordering.
       *
       * The column type tells DataTables what ordering to apply to the table
       * when a column is sorted upon. The order for each type that is defined,
       * is defined by the functions available in this object.
       *
       * Each ordering option can be described by three properties added to
       * this object:
       *
       * * `{type}-pre` - Pre-formatting function
       * * `{type}-asc` - Ascending order function
       * * `{type}-desc` - Descending order function
       *
       * All three can be used together, only `{type}-pre` or only
       * `{type}-asc` and `{type}-desc` together. It is generally recommended
       * that only `{type}-pre` is used, as this provides the optimal
       * implementation in terms of speed, although the others are provided
       * for compatibility with existing JavaScript sort functions.
       *
       * `{type}-pre`: Functions defined take a single parameter:
       *
          *  1. `{*}` Data from the column cell to be prepared for ordering
       *
       * And return:
       *
       * * `{*}` Data to be sorted upon
       *
       * `{type}-asc` and `{type}-desc`: Functions are typical JavaScript sort
       * functions, taking two parameters:
       *
          *  1. `{*}` Data to compare to the second parameter
          *  2. `{*}` Data to compare to the first parameter
       *
       * And returning:
       *
       * * `{*}` Ordering match: <0 if first parameter should be sorted lower
       *   than the second parameter, ===0 if the two parameters are equal and
       *   >0 if the first parameter should be sorted height than the second
       *   parameter.
       * 
       *  @type object
       *  @default {}
       *
       *  @example
       *    // Numeric ordering of formatted numbers with a pre-formatter
       *    $.extend( $.fn.dataTable.ext.type.order, {
       *      "string-pre": function(x) {
       *        a = (a === "-" || a === "") ? 0 : a.replace( /[^\d\-\.]/g, "" );
       *        return parseFloat( a );
       *      }
       *    } );
       *
       *  @example
       *    // Case-sensitive string ordering, with no pre-formatting method
       *    $.extend( $.fn.dataTable.ext.order, {
       *      "string-case-asc": function(x,y) {
       *        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
       *      },
       *      "string-case-desc": function(x,y) {
       *        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
       *      }
       *    } );
       */
      order: {}
    },
    /**
     * Unique DataTables instance counter
     *
     * @type int
     * @private
     */
    _unique: 0,
    //
    // Depreciated
    // The following properties are retained for backwards compatibility only.
    // The should not be used in new projects and will be removed in a future
    // version
    //
    /**
     * Version check function.
     *  @type function
     *  @depreciated Since 1.10
     */
    fnVersionCheck: DataTable.fnVersionCheck,
    /**
     * Index for what 'this' index API functions should use
     *  @type int
     *  @deprecated Since v1.10
     */
    iApiIndex: 0,
    /**
     * Software version
     *  @type string
     *  @deprecated Since v1.10
     */
    sVersion: DataTable.version
  };
  $.extend(_ext, {
    afnFiltering: _ext.search,
    aTypes: _ext.type.detect,
    ofnSearch: _ext.type.search,
    oSort: _ext.type.order,
    afnSortData: _ext.order,
    aoFeatures: _ext.feature,
    oStdClasses: _ext.classes,
    oPagination: _ext.pager
  });
  $.extend(DataTable.ext.classes, {
    container: "dt-container",
    empty: {
      row: "dt-empty"
    },
    info: {
      container: "dt-info"
    },
    layout: {
      row: "dt-layout-row",
      cell: "dt-layout-cell",
      tableRow: "dt-layout-table",
      tableCell: "",
      start: "dt-layout-start",
      end: "dt-layout-end",
      full: "dt-layout-full"
    },
    length: {
      container: "dt-length",
      select: "dt-input"
    },
    order: {
      canAsc: "dt-orderable-asc",
      canDesc: "dt-orderable-desc",
      isAsc: "dt-ordering-asc",
      isDesc: "dt-ordering-desc",
      none: "dt-orderable-none",
      position: "sorting_"
    },
    processing: {
      container: "dt-processing"
    },
    scrolling: {
      body: "dt-scroll-body",
      container: "dt-scroll",
      footer: {
        self: "dt-scroll-foot",
        inner: "dt-scroll-footInner"
      },
      header: {
        self: "dt-scroll-head",
        inner: "dt-scroll-headInner"
      }
    },
    search: {
      container: "dt-search",
      input: "dt-input"
    },
    table: "dataTable",
    tbody: {
      cell: "",
      row: ""
    },
    thead: {
      cell: "",
      row: ""
    },
    tfoot: {
      cell: "",
      row: ""
    },
    paging: {
      active: "current",
      button: "dt-paging-button",
      container: "dt-paging",
      disabled: "disabled",
      nav: ""
    }
  });
  var _ext;
  var _Api;
  var _api_register;
  var _api_registerPlural;
  var _re_dic = {};
  var _re_new_lines = /[\r\n\u2028]/g;
  var _re_html = /<([^>]*>)/g;
  var _max_str_len = Math.pow(2, 28);
  var _re_date = /^\d{2,4}[./-]\d{1,2}[./-]\d{1,2}([T ]{1}\d{1,2}[:.]\d{2}([.:]\d{2})?)?$/;
  var _re_escape_regex = new RegExp("(\\" + ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^", "-"].join("|\\") + ")", "g");
  var _re_formatted_numeric = /['\u00A0,$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi;
  var _empty = function(d) {
    return !d || d === true || d === "-" ? true : false;
  };
  var _intVal = function(s) {
    var integer = parseInt(s, 10);
    return !isNaN(integer) && isFinite(s) ? integer : null;
  };
  var _numToDecimal = function(num, decimalPoint) {
    if (!_re_dic[decimalPoint]) {
      _re_dic[decimalPoint] = new RegExp(_fnEscapeRegex(decimalPoint), "g");
    }
    return typeof num === "string" && decimalPoint !== "." ? num.replace(/\./g, "").replace(_re_dic[decimalPoint], ".") : num;
  };
  var _isNumber = function(d, decimalPoint, formatted, allowEmpty) {
    var type = typeof d;
    var strType = type === "string";
    if (type === "number" || type === "bigint") {
      return true;
    }
    if (allowEmpty && _empty(d)) {
      return true;
    }
    if (decimalPoint && strType) {
      d = _numToDecimal(d, decimalPoint);
    }
    if (formatted && strType) {
      d = d.replace(_re_formatted_numeric, "");
    }
    return !isNaN(parseFloat(d)) && isFinite(d);
  };
  var _isHtml = function(d) {
    return _empty(d) || typeof d === "string";
  };
  var _htmlNumeric = function(d, decimalPoint, formatted, allowEmpty) {
    if (allowEmpty && _empty(d)) {
      return true;
    }
    if (typeof d === "string" && d.match(/<(input|select)/i)) {
      return null;
    }
    var html = _isHtml(d);
    return !html ? null : _isNumber(_stripHtml(d), decimalPoint, formatted, allowEmpty) ? true : null;
  };
  var _pluck = function(a, prop, prop2) {
    var out = [];
    var i = 0, iLen = a.length;
    if (prop2 !== void 0) {
      for (; i < iLen; i++) {
        if (a[i] && a[i][prop]) {
          out.push(a[i][prop][prop2]);
        }
      }
    } else {
      for (; i < iLen; i++) {
        if (a[i]) {
          out.push(a[i][prop]);
        }
      }
    }
    return out;
  };
  var _pluck_order = function(a, order2, prop, prop2) {
    var out = [];
    var i = 0, iLen = order2.length;
    if (prop2 !== void 0) {
      for (; i < iLen; i++) {
        if (a[order2[i]] && a[order2[i]][prop]) {
          out.push(a[order2[i]][prop][prop2]);
        }
      }
    } else {
      for (; i < iLen; i++) {
        if (a[order2[i]]) {
          out.push(a[order2[i]][prop]);
        }
      }
    }
    return out;
  };
  var _range = function(len, start) {
    var out = [];
    var end;
    if (start === void 0) {
      start = 0;
      end = len;
    } else {
      end = start;
      start = len;
    }
    for (var i = start; i < end; i++) {
      out.push(i);
    }
    return out;
  };
  var _removeEmpty = function(a) {
    var out = [];
    for (var i = 0, iLen = a.length; i < iLen; i++) {
      if (a[i]) {
        out.push(a[i]);
      }
    }
    return out;
  };
  var _stripHtml = function(input, replacement) {
    if (!input || typeof input !== "string") {
      return input;
    }
    if (input.length > _max_str_len) {
      throw new Error("Exceeded max str len");
    }
    var previous;
    input = input.replace(_re_html, replacement || "");
    do {
      previous = input;
      input = input.replace(/<script/i, "");
    } while (input !== previous);
    return previous;
  };
  var _escapeHtml = function(d) {
    if (Array.isArray(d)) {
      d = d.join(",");
    }
    return typeof d === "string" ? d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : d;
  };
  var _normalize = function(str, both) {
    if (typeof str !== "string") {
      return str;
    }
    var res = str.normalize ? str.normalize("NFD") : str;
    return res.length !== str.length ? (both === true ? str + " " : "") + res.replace(/[\u0300-\u036f]/g, "") : res;
  };
  var _areAllUnique = function(src) {
    if (src.length < 2) {
      return true;
    }
    var sorted = src.slice().sort();
    var last = sorted[0];
    for (var i = 1, iLen = sorted.length; i < iLen; i++) {
      if (sorted[i] === last) {
        return false;
      }
      last = sorted[i];
    }
    return true;
  };
  var _unique = function(src) {
    if (Array.from && Set) {
      return Array.from(new Set(src));
    }
    if (_areAllUnique(src)) {
      return src.slice();
    }
    var out = [], val, i, iLen = src.length, j, k = 0;
    again: for (i = 0; i < iLen; i++) {
      val = src[i];
      for (j = 0; j < k; j++) {
        if (out[j] === val) {
          continue again;
        }
      }
      out.push(val);
      k++;
    }
    return out;
  };
  var _flatten = function(out, val) {
    if (Array.isArray(val)) {
      for (var i = 0; i < val.length; i++) {
        _flatten(out, val[i]);
      }
    } else {
      out.push(val);
    }
    return out;
  };
  function _addClass(el, name) {
    if (name) {
      name.split(" ").forEach(function(n) {
        if (n) {
          el.classList.add(n);
        }
      });
    }
  }
  DataTable.util = {
    /**
     * Return a string with diacritic characters decomposed
     * @param {*} mixed Function or string to normalize
     * @param {*} both Return original string and the normalized string
     * @returns String or undefined
     */
    diacritics: function(mixed, both) {
      var type = typeof mixed;
      if (type !== "function") {
        return _normalize(mixed, both);
      }
      _normalize = mixed;
    },
    /**
     * Debounce a function
     *
     * @param {function} fn Function to be called
     * @param {integer} freq Call frequency in mS
     * @return {function} Wrapped function
     */
    debounce: function(fn, timeout) {
      var timer;
      return function() {
        var that = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() {
          fn.apply(that, args);
        }, timeout || 250);
      };
    },
    /**
     * Throttle the calls to a function. Arguments and context are maintained
     * for the throttled function.
     *
     * @param {function} fn Function to be called
     * @param {integer} freq Call frequency in mS
     * @return {function} Wrapped function
     */
    throttle: function(fn, freq) {
      var frequency = freq !== void 0 ? freq : 200, last, timer;
      return function() {
        var that = this, now = +/* @__PURE__ */ new Date(), args = arguments;
        if (last && now < last + frequency) {
          clearTimeout(timer);
          timer = setTimeout(function() {
            last = void 0;
            fn.apply(that, args);
          }, frequency);
        } else {
          last = now;
          fn.apply(that, args);
        }
      };
    },
    /**
     * Escape a string such that it can be used in a regular expression
     *
     *  @param {string} val string to escape
     *  @returns {string} escaped string
     */
    escapeRegex: function(val) {
      return val.replace(_re_escape_regex, "\\$1");
    },
    /**
     * Create a function that will write to a nested object or array
     * @param {*} source JSON notation string
     * @returns Write function
     */
    set: function(source) {
      if ($.isPlainObject(source)) {
        return DataTable.util.set(source._);
      } else if (source === null) {
        return function() {
        };
      } else if (typeof source === "function") {
        return function(data, val, meta) {
          source(data, "set", val, meta);
        };
      } else if (typeof source === "string" && (source.indexOf(".") !== -1 || source.indexOf("[") !== -1 || source.indexOf("(") !== -1)) {
        var setData = function(data, val, src) {
          var a = _fnSplitObjNotation(src), b;
          var aLast = a[a.length - 1];
          var arrayNotation, funcNotation, o, innerSrc;
          for (var i = 0, iLen = a.length - 1; i < iLen; i++) {
            if (a[i] === "__proto__" || a[i] === "constructor") {
              throw new Error("Cannot set prototype values");
            }
            arrayNotation = a[i].match(__reArray);
            funcNotation = a[i].match(__reFn);
            if (arrayNotation) {
              a[i] = a[i].replace(__reArray, "");
              data[a[i]] = [];
              b = a.slice();
              b.splice(0, i + 1);
              innerSrc = b.join(".");
              if (Array.isArray(val)) {
                for (var j = 0, jLen = val.length; j < jLen; j++) {
                  o = {};
                  setData(o, val[j], innerSrc);
                  data[a[i]].push(o);
                }
              } else {
                data[a[i]] = val;
              }
              return;
            } else if (funcNotation) {
              a[i] = a[i].replace(__reFn, "");
              data = data[a[i]](val);
            }
            if (data[a[i]] === null || data[a[i]] === void 0) {
              data[a[i]] = {};
            }
            data = data[a[i]];
          }
          if (aLast.match(__reFn)) {
            data = data[aLast.replace(__reFn, "")](val);
          } else {
            data[aLast.replace(__reArray, "")] = val;
          }
        };
        return function(data, val) {
          return setData(data, val, source);
        };
      } else {
        return function(data, val) {
          data[source] = val;
        };
      }
    },
    /**
     * Create a function that will read nested objects from arrays, based on JSON notation
     * @param {*} source JSON notation string
     * @returns Value read
     */
    get: function(source) {
      if ($.isPlainObject(source)) {
        var o = {};
        $.each(source, function(key, val) {
          if (val) {
            o[key] = DataTable.util.get(val);
          }
        });
        return function(data, type, row, meta) {
          var t = o[type] || o._;
          return t !== void 0 ? t(data, type, row, meta) : data;
        };
      } else if (source === null) {
        return function(data) {
          return data;
        };
      } else if (typeof source === "function") {
        return function(data, type, row, meta) {
          return source(data, type, row, meta);
        };
      } else if (typeof source === "string" && (source.indexOf(".") !== -1 || source.indexOf("[") !== -1 || source.indexOf("(") !== -1)) {
        var fetchData = function(data, type, src) {
          var arrayNotation, funcNotation, out, innerSrc;
          if (src !== "") {
            var a = _fnSplitObjNotation(src);
            for (var i = 0, iLen = a.length; i < iLen; i++) {
              arrayNotation = a[i].match(__reArray);
              funcNotation = a[i].match(__reFn);
              if (arrayNotation) {
                a[i] = a[i].replace(__reArray, "");
                if (a[i] !== "") {
                  data = data[a[i]];
                }
                out = [];
                a.splice(0, i + 1);
                innerSrc = a.join(".");
                if (Array.isArray(data)) {
                  for (var j = 0, jLen = data.length; j < jLen; j++) {
                    out.push(fetchData(data[j], type, innerSrc));
                  }
                }
                var join = arrayNotation[0].substring(1, arrayNotation[0].length - 1);
                data = join === "" ? out : out.join(join);
                break;
              } else if (funcNotation) {
                a[i] = a[i].replace(__reFn, "");
                data = data[a[i]]();
                continue;
              }
              if (data === null || data[a[i]] === null) {
                return null;
              } else if (data === void 0 || data[a[i]] === void 0) {
                return void 0;
              }
              data = data[a[i]];
            }
          }
          return data;
        };
        return function(data, type) {
          return fetchData(data, type, source);
        };
      } else {
        return function(data) {
          return data[source];
        };
      }
    },
    stripHtml: function(mixed, replacement) {
      var type = typeof mixed;
      if (type === "function") {
        _stripHtml = mixed;
        return;
      } else if (type === "string") {
        return _stripHtml(mixed, replacement);
      }
      return mixed;
    },
    escapeHtml: function(mixed) {
      var type = typeof mixed;
      if (type === "function") {
        _escapeHtml = mixed;
        return;
      } else if (type === "string" || Array.isArray(mixed)) {
        return _escapeHtml(mixed);
      }
      return mixed;
    },
    unique: _unique
  };
  function _fnHungarianMap(o) {
    var hungarian = "a aa ai ao as b fn i m o s ", match, newKey, map = {};
    $.each(o, function(key) {
      match = key.match(/^([^A-Z]+?)([A-Z])/);
      if (match && hungarian.indexOf(match[1] + " ") !== -1) {
        newKey = key.replace(match[0], match[2].toLowerCase());
        map[newKey] = key;
        if (match[1] === "o") {
          _fnHungarianMap(o[key]);
        }
      }
    });
    o._hungarianMap = map;
  }
  function _fnCamelToHungarian(src, user, force) {
    if (!src._hungarianMap) {
      _fnHungarianMap(src);
    }
    var hungarianKey;
    $.each(user, function(key) {
      hungarianKey = src._hungarianMap[key];
      if (hungarianKey !== void 0 && (force || user[hungarianKey] === void 0)) {
        if (hungarianKey.charAt(0) === "o") {
          if (!user[hungarianKey]) {
            user[hungarianKey] = {};
          }
          $.extend(true, user[hungarianKey], user[key]);
          _fnCamelToHungarian(src[hungarianKey], user[hungarianKey], force);
        } else {
          user[hungarianKey] = user[key];
        }
      }
    });
  }
  var _fnCompatMap = function(o, knew, old) {
    if (o[knew] !== void 0) {
      o[old] = o[knew];
    }
  };
  function _fnCompatOpts(init3) {
    _fnCompatMap(init3, "ordering", "bSort");
    _fnCompatMap(init3, "orderMulti", "bSortMulti");
    _fnCompatMap(init3, "orderClasses", "bSortClasses");
    _fnCompatMap(init3, "orderCellsTop", "bSortCellsTop");
    _fnCompatMap(init3, "order", "aaSorting");
    _fnCompatMap(init3, "orderFixed", "aaSortingFixed");
    _fnCompatMap(init3, "paging", "bPaginate");
    _fnCompatMap(init3, "pagingType", "sPaginationType");
    _fnCompatMap(init3, "pageLength", "iDisplayLength");
    _fnCompatMap(init3, "searching", "bFilter");
    if (typeof init3.sScrollX === "boolean") {
      init3.sScrollX = init3.sScrollX ? "100%" : "";
    }
    if (typeof init3.scrollX === "boolean") {
      init3.scrollX = init3.scrollX ? "100%" : "";
    }
    if (typeof init3.bSort === "object") {
      init3.orderIndicators = init3.bSort.indicators !== void 0 ? init3.bSort.indicators : true;
      init3.orderHandler = init3.bSort.handler !== void 0 ? init3.bSort.handler : true;
      init3.bSort = true;
    } else if (init3.bSort === false) {
      init3.orderIndicators = false;
      init3.orderHandler = false;
    } else if (init3.bSort === true) {
      init3.orderIndicators = true;
      init3.orderHandler = true;
    }
    if (typeof init3.bSortCellsTop === "boolean") {
      init3.titleRow = init3.bSortCellsTop;
    }
    var searchCols = init3.aoSearchCols;
    if (searchCols) {
      for (var i = 0, iLen = searchCols.length; i < iLen; i++) {
        if (searchCols[i]) {
          _fnCamelToHungarian(DataTable.models.oSearch, searchCols[i]);
        }
      }
    }
    if (init3.serverSide && !init3.searchDelay) {
      init3.searchDelay = 400;
    }
  }
  function _fnCompatCols(init3) {
    _fnCompatMap(init3, "orderable", "bSortable");
    _fnCompatMap(init3, "orderData", "aDataSort");
    _fnCompatMap(init3, "orderSequence", "asSorting");
    _fnCompatMap(init3, "orderDataType", "sortDataType");
    var dataSort = init3.aDataSort;
    if (typeof dataSort === "number" && !Array.isArray(dataSort)) {
      init3.aDataSort = [dataSort];
    }
  }
  function _fnBrowserDetect(settings) {
    if (!DataTable.__browser) {
      var browser = {};
      DataTable.__browser = browser;
      var n = $("<div/>").css({
        position: "fixed",
        top: 0,
        left: -1 * window.pageXOffset,
        // allow for scrolling
        height: 1,
        width: 1,
        overflow: "hidden"
      }).append(
        $("<div/>").css({
          position: "absolute",
          top: 1,
          left: 1,
          width: 100,
          overflow: "scroll"
        }).append(
          $("<div/>").css({
            width: "100%",
            height: 10
          })
        )
      ).appendTo("body");
      var outer = n.children();
      var inner = outer.children();
      browser.barWidth = outer[0].offsetWidth - outer[0].clientWidth;
      browser.bScrollbarLeft = Math.round(inner.offset().left) !== 1;
      n.remove();
    }
    $.extend(settings.oBrowser, DataTable.__browser);
    settings.oScroll.iBarWidth = DataTable.__browser.barWidth;
  }
  function _fnAddColumn(oSettings) {
    var oDefaults = DataTable.defaults.column;
    var iCol = oSettings.aoColumns.length;
    var oCol = $.extend({}, DataTable.models.oColumn, oDefaults, {
      "aDataSort": oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
      "mData": oDefaults.mData ? oDefaults.mData : iCol,
      idx: iCol,
      searchFixed: {},
      colEl: $("<col>").attr("data-dt-column", iCol)
    });
    oSettings.aoColumns.push(oCol);
    var searchCols = oSettings.aoPreSearchCols;
    searchCols[iCol] = $.extend({}, DataTable.models.oSearch, searchCols[iCol]);
  }
  function _fnColumnOptions(oSettings, iCol, oOptions) {
    var oCol = oSettings.aoColumns[iCol];
    if (oOptions !== void 0 && oOptions !== null) {
      _fnCompatCols(oOptions);
      _fnCamelToHungarian(DataTable.defaults.column, oOptions, true);
      if (oOptions.mDataProp !== void 0 && !oOptions.mData) {
        oOptions.mData = oOptions.mDataProp;
      }
      if (oOptions.sType) {
        oCol._sManualType = oOptions.sType;
      }
      if (oOptions.className && !oOptions.sClass) {
        oOptions.sClass = oOptions.className;
      }
      var origClass = oCol.sClass;
      $.extend(oCol, oOptions);
      _fnMap(oCol, oOptions, "sWidth", "sWidthOrig");
      if (origClass !== oCol.sClass) {
        oCol.sClass = origClass + " " + oCol.sClass;
      }
      if (oOptions.iDataSort !== void 0) {
        oCol.aDataSort = [oOptions.iDataSort];
      }
      _fnMap(oCol, oOptions, "aDataSort");
    }
    var mDataSrc = oCol.mData;
    var mData = _fnGetObjectDataFn(mDataSrc);
    if (oCol.mRender && Array.isArray(oCol.mRender)) {
      var copy = oCol.mRender.slice();
      var name = copy.shift();
      oCol.mRender = DataTable.render[name].apply(window, copy);
    }
    oCol._render = oCol.mRender ? _fnGetObjectDataFn(oCol.mRender) : null;
    var attrTest = function(src) {
      return typeof src === "string" && src.indexOf("@") !== -1;
    };
    oCol._bAttrSrc = $.isPlainObject(mDataSrc) && (attrTest(mDataSrc.sort) || attrTest(mDataSrc.type) || attrTest(mDataSrc.filter));
    oCol._setter = null;
    oCol.fnGetData = function(rowData, type, meta) {
      var innerData = mData(rowData, type, void 0, meta);
      return oCol._render && type ? oCol._render(innerData, type, rowData, meta) : innerData;
    };
    oCol.fnSetData = function(rowData, val, meta) {
      return _fnSetObjectDataFn(mDataSrc)(rowData, val, meta);
    };
    if (typeof mDataSrc !== "number" && !oCol._isArrayHost) {
      oSettings._rowReadObject = true;
    }
    if (!oSettings.oFeatures.bSort) {
      oCol.bSortable = false;
    }
  }
  function _fnAdjustColumnSizing(settings) {
    _fnCalculateColumnWidths(settings);
    _fnColumnSizes(settings);
    var scroll = settings.oScroll;
    if (scroll.sY !== "" || scroll.sX !== "") {
      _fnScrollDraw(settings);
    }
    _fnCallbackFire(settings, null, "column-sizing", [settings]);
  }
  function _fnColumnSizes(settings) {
    var cols = settings.aoColumns;
    for (var i = 0; i < cols.length; i++) {
      var width = _fnColumnsSumWidth(settings, [i], false, false);
      cols[i].colEl.css("width", width);
      if (settings.oScroll.sX) {
        cols[i].colEl.css("min-width", width);
      }
    }
  }
  function _fnVisibleToColumnIndex(oSettings, iMatch) {
    var aiVis = _fnGetColumns(oSettings, "bVisible");
    return typeof aiVis[iMatch] === "number" ? aiVis[iMatch] : null;
  }
  function _fnColumnIndexToVisible(oSettings, iMatch) {
    var aiVis = _fnGetColumns(oSettings, "bVisible");
    var iPos = aiVis.indexOf(iMatch);
    return iPos !== -1 ? iPos : null;
  }
  function _fnVisibleColumns(settings) {
    var layout = settings.aoHeader;
    var columns = settings.aoColumns;
    var vis = 0;
    if (layout.length) {
      for (var i = 0, iLen = layout[0].length; i < iLen; i++) {
        if (columns[i].bVisible && $(layout[0][i].cell).css("display") !== "none") {
          vis++;
        }
      }
    }
    return vis;
  }
  function _fnGetColumns(oSettings, sParam) {
    var a = [];
    oSettings.aoColumns.map(function(val, i) {
      if (val[sParam]) {
        a.push(i);
      }
    });
    return a;
  }
  function _typeResult(typeDetect, res) {
    return res === true ? typeDetect._name : res;
  }
  function _fnColumnTypes(settings) {
    var columns = settings.aoColumns;
    var data = settings.aoData;
    var types = DataTable.ext.type.detect;
    var i, iLen, j, jen, k, ken;
    var col, detectedType, cache;
    for (i = 0, iLen = columns.length; i < iLen; i++) {
      col = columns[i];
      cache = [];
      if (!col.sType && col._sManualType) {
        col.sType = col._sManualType;
      } else if (!col.sType) {
        if (!settings.typeDetect) {
          return;
        }
        for (j = 0, jen = types.length; j < jen; j++) {
          var typeDetect = types[j];
          var oneOf = typeDetect.oneOf;
          var allOf = typeDetect.allOf || typeDetect;
          var init3 = typeDetect.init;
          var one = false;
          detectedType = null;
          if (init3) {
            detectedType = _typeResult(typeDetect, init3(settings, col, i));
            if (detectedType) {
              col.sType = detectedType;
              break;
            }
          }
          for (k = 0, ken = data.length; k < ken; k++) {
            if (!data[k]) {
              continue;
            }
            if (cache[k] === void 0) {
              cache[k] = _fnGetCellData(settings, k, i, "type");
            }
            if (oneOf && !one) {
              one = _typeResult(typeDetect, oneOf(cache[k], settings));
            }
            detectedType = _typeResult(typeDetect, allOf(cache[k], settings));
            if (!detectedType && j !== types.length - 3) {
              break;
            }
            if (detectedType === "html" && !_empty(cache[k])) {
              break;
            }
          }
          if (oneOf && one && detectedType || !oneOf && detectedType) {
            col.sType = detectedType;
            break;
          }
        }
        if (!col.sType) {
          col.sType = "string";
        }
      }
      var autoClass = _ext.type.className[col.sType];
      if (autoClass) {
        _columnAutoClass(settings.aoHeader, i, autoClass);
        _columnAutoClass(settings.aoFooter, i, autoClass);
      }
      var renderer = _ext.type.render[col.sType];
      if (renderer && !col._render) {
        col._render = DataTable.util.get(renderer);
        _columnAutoRender(settings, i);
      }
    }
  }
  function _columnAutoRender(settings, colIdx) {
    var data = settings.aoData;
    for (var i = 0; i < data.length; i++) {
      if (data[i].nTr) {
        var display = _fnGetCellData(settings, i, colIdx, "display");
        data[i].displayData[colIdx] = display;
        _fnWriteCell(data[i].anCells[colIdx], display);
      }
    }
  }
  function _columnAutoClass(container, colIdx, className) {
    container.forEach(function(row) {
      if (row[colIdx] && row[colIdx].unique) {
        _addClass(row[colIdx].cell, className);
      }
    });
  }
  function _fnApplyColumnDefs(oSettings, aoColDefs, aoCols, headerLayout, fn) {
    var i, iLen, j, jLen, k, kLen, def;
    var columns = oSettings.aoColumns;
    if (aoCols) {
      for (i = 0, iLen = aoCols.length; i < iLen; i++) {
        if (aoCols[i] && aoCols[i].name) {
          columns[i].sName = aoCols[i].name;
        }
      }
    }
    if (aoColDefs) {
      for (i = aoColDefs.length - 1; i >= 0; i--) {
        def = aoColDefs[i];
        var aTargets = def.target !== void 0 ? def.target : def.targets !== void 0 ? def.targets : def.aTargets;
        if (!Array.isArray(aTargets)) {
          aTargets = [aTargets];
        }
        for (j = 0, jLen = aTargets.length; j < jLen; j++) {
          var target = aTargets[j];
          if (typeof target === "number" && target >= 0) {
            while (columns.length <= target) {
              _fnAddColumn(oSettings);
            }
            fn(target, def);
          } else if (typeof target === "number" && target < 0) {
            fn(columns.length + target, def);
          } else if (typeof target === "string") {
            for (k = 0, kLen = columns.length; k < kLen; k++) {
              if (target === "_all") {
                fn(k, def);
              } else if (target.indexOf(":name") !== -1) {
                if (columns[k].sName === target.replace(":name", "")) {
                  fn(k, def);
                }
              } else {
                headerLayout.forEach(function(row) {
                  if (row[k]) {
                    var cell = $(row[k].cell);
                    if (target.match(/^[a-z][\w-]*$/i)) {
                      target = "." + target;
                    }
                    if (cell.is(target)) {
                      fn(k, def);
                    }
                  }
                });
              }
            }
          }
        }
      }
    }
    if (aoCols) {
      for (i = 0, iLen = aoCols.length; i < iLen; i++) {
        fn(i, aoCols[i]);
      }
    }
  }
  function _fnColumnsSumWidth(settings, targets, original, incVisible) {
    if (!Array.isArray(targets)) {
      targets = _fnColumnsFromHeader(targets);
    }
    var sum = 0;
    var unit;
    var columns = settings.aoColumns;
    for (var i = 0, iLen = targets.length; i < iLen; i++) {
      var column = columns[targets[i]];
      var definedWidth = original ? column.sWidthOrig : column.sWidth;
      if (!incVisible && column.bVisible === false) {
        continue;
      }
      if (definedWidth === null || definedWidth === void 0) {
        return null;
      } else if (typeof definedWidth === "number") {
        unit = "px";
        sum += definedWidth;
      } else {
        var matched = definedWidth.match(/([\d\.]+)([^\d]*)/);
        if (matched) {
          sum += matched[1] * 1;
          unit = matched.length === 3 ? matched[2] : "px";
        }
      }
    }
    return sum + unit;
  }
  function _fnColumnsFromHeader(cell) {
    var attr = $(cell).closest("[data-dt-column]").attr("data-dt-column");
    if (!attr) {
      return [];
    }
    return attr.split(",").map(function(val) {
      return val * 1;
    });
  }
  function _fnAddData(settings, dataIn, tr, tds) {
    var rowIdx = settings.aoData.length;
    var rowModel = $.extend(true, {}, DataTable.models.oRow, {
      src: tr ? "dom" : "data",
      idx: rowIdx
    });
    rowModel._aData = dataIn;
    settings.aoData.push(rowModel);
    var columns = settings.aoColumns;
    for (var i = 0, iLen = columns.length; i < iLen; i++) {
      columns[i].sType = null;
    }
    settings.aiDisplayMaster.push(rowIdx);
    var id = settings.rowIdFn(dataIn);
    if (id !== void 0) {
      settings.aIds[id] = rowModel;
    }
    if (tr || !settings.oFeatures.bDeferRender) {
      _fnCreateTr(settings, rowIdx, tr, tds);
    }
    return rowIdx;
  }
  function _fnAddTr(settings, trs) {
    var row;
    if (!(trs instanceof $)) {
      trs = $(trs);
    }
    return trs.map(function(i, el) {
      row = _fnGetRowElements(settings, el);
      return _fnAddData(settings, row.data, el, row.cells);
    });
  }
  function _fnGetCellData(settings, rowIdx, colIdx, type) {
    if (type === "search") {
      type = "filter";
    } else if (type === "order") {
      type = "sort";
    }
    var row = settings.aoData[rowIdx];
    if (!row) {
      return void 0;
    }
    var draw = settings.iDraw;
    var col = settings.aoColumns[colIdx];
    var rowData = row._aData;
    var defaultContent = col.sDefaultContent;
    var cellData = col.fnGetData(rowData, type, {
      settings,
      row: rowIdx,
      col: colIdx
    });
    if (type !== "display" && cellData && typeof cellData === "object" && cellData.nodeName) {
      cellData = cellData.innerHTML;
    }
    if (cellData === void 0) {
      if (settings.iDrawError != draw && defaultContent === null) {
        _fnLog(settings, 0, "Requested unknown parameter " + (typeof col.mData == "function" ? "{function}" : "'" + col.mData + "'") + " for row " + rowIdx + ", column " + colIdx, 4);
        settings.iDrawError = draw;
      }
      return defaultContent;
    }
    if ((cellData === rowData || cellData === null) && defaultContent !== null && type !== void 0) {
      cellData = defaultContent;
    } else if (typeof cellData === "function") {
      return cellData.call(rowData);
    }
    if (cellData === null && type === "display") {
      return "";
    }
    if (type === "filter") {
      var formatters = DataTable.ext.type.search;
      if (formatters[col.sType]) {
        cellData = formatters[col.sType](cellData);
      }
    }
    return cellData;
  }
  function _fnSetCellData(settings, rowIdx, colIdx, val) {
    var col = settings.aoColumns[colIdx];
    var rowData = settings.aoData[rowIdx]._aData;
    col.fnSetData(rowData, val, {
      settings,
      row: rowIdx,
      col: colIdx
    });
  }
  function _fnWriteCell(td, val) {
    if (val && typeof val === "object" && val.nodeName) {
      $(td).empty().append(val);
    } else {
      td.innerHTML = val;
    }
  }
  var __reArray = /\[.*?\]$/;
  var __reFn = /\(\)$/;
  function _fnSplitObjNotation(str) {
    var parts = str.match(/(\\.|[^.])+/g) || [""];
    return parts.map(function(s) {
      return s.replace(/\\\./g, ".");
    });
  }
  var _fnGetObjectDataFn = DataTable.util.get;
  var _fnSetObjectDataFn = DataTable.util.set;
  function _fnGetDataMaster(settings) {
    return _pluck(settings.aoData, "_aData");
  }
  function _fnClearTable(settings) {
    settings.aoData.length = 0;
    settings.aiDisplayMaster.length = 0;
    settings.aiDisplay.length = 0;
    settings.aIds = {};
  }
  function _fnInvalidate(settings, rowIdx, src, colIdx) {
    var row = settings.aoData[rowIdx];
    var i, iLen;
    row._aSortData = null;
    row._aFilterData = null;
    row.displayData = null;
    if (src === "dom" || (!src || src === "auto") && row.src === "dom") {
      row._aData = _fnGetRowElements(
        settings,
        row,
        colIdx,
        colIdx === void 0 ? void 0 : row._aData
      ).data;
    } else {
      var cells = row.anCells;
      var display = _fnGetRowDisplay(settings, rowIdx);
      if (cells) {
        if (colIdx !== void 0) {
          _fnWriteCell(cells[colIdx], display[colIdx]);
        } else {
          for (i = 0, iLen = cells.length; i < iLen; i++) {
            _fnWriteCell(cells[i], display[i]);
          }
        }
      }
    }
    var cols = settings.aoColumns;
    if (colIdx !== void 0) {
      cols[colIdx].sType = null;
      cols[colIdx].wideStrings = null;
    } else {
      for (i = 0, iLen = cols.length; i < iLen; i++) {
        cols[i].sType = null;
        cols[i].wideStrings = null;
      }
      _fnRowAttributes(settings, row);
    }
  }
  function _fnGetRowElements(settings, row, colIdx, d) {
    var tds = [], td = row.firstChild, name, col, i = 0, contents, columns = settings.aoColumns, objectRead = settings._rowReadObject;
    d = d !== void 0 ? d : objectRead ? {} : [];
    var attr = function(str, td2) {
      if (typeof str === "string") {
        var idx = str.indexOf("@");
        if (idx !== -1) {
          var attr2 = str.substring(idx + 1);
          var setter = _fnSetObjectDataFn(str);
          setter(d, td2.getAttribute(attr2));
        }
      }
    };
    var cellProcess = function(cell) {
      if (colIdx === void 0 || colIdx === i) {
        col = columns[i];
        contents = cell.innerHTML.trim();
        if (col && col._bAttrSrc) {
          var setter = _fnSetObjectDataFn(col.mData._);
          setter(d, contents);
          attr(col.mData.sort, cell);
          attr(col.mData.type, cell);
          attr(col.mData.filter, cell);
        } else {
          if (objectRead) {
            if (!col._setter) {
              col._setter = _fnSetObjectDataFn(col.mData);
            }
            col._setter(d, contents);
          } else {
            d[i] = contents;
          }
        }
      }
      i++;
    };
    if (td) {
      while (td) {
        name = td.nodeName.toUpperCase();
        if (name == "TD" || name == "TH") {
          cellProcess(td);
          tds.push(td);
        }
        td = td.nextSibling;
      }
    } else {
      tds = row.anCells;
      for (var j = 0, jen = tds.length; j < jen; j++) {
        cellProcess(tds[j]);
      }
    }
    var rowNode = row.firstChild ? row : row.nTr;
    if (rowNode) {
      var id = rowNode.getAttribute("id");
      if (id) {
        _fnSetObjectDataFn(settings.rowId)(d, id);
      }
    }
    return {
      data: d,
      cells: tds
    };
  }
  function _fnGetRowDisplay(settings, rowIdx) {
    var rowModal = settings.aoData[rowIdx];
    var columns = settings.aoColumns;
    if (!rowModal.displayData) {
      rowModal.displayData = [];
      for (var colIdx = 0, len = columns.length; colIdx < len; colIdx++) {
        rowModal.displayData.push(
          _fnGetCellData(settings, rowIdx, colIdx, "display")
        );
      }
    }
    return rowModal.displayData;
  }
  function _fnCreateTr(oSettings, iRow, nTrIn, anTds) {
    var row = oSettings.aoData[iRow], rowData = row._aData, cells = [], nTr, nTd, oCol, i, iLen, create, trClass = oSettings.oClasses.tbody.row;
    if (row.nTr === null) {
      nTr = nTrIn || document.createElement("tr");
      row.nTr = nTr;
      row.anCells = cells;
      _addClass(nTr, trClass);
      nTr._DT_RowIndex = iRow;
      _fnRowAttributes(oSettings, row);
      for (i = 0, iLen = oSettings.aoColumns.length; i < iLen; i++) {
        oCol = oSettings.aoColumns[i];
        create = nTrIn && anTds[i] ? false : true;
        nTd = create ? document.createElement(oCol.sCellType) : anTds[i];
        if (!nTd) {
          _fnLog(oSettings, 0, "Incorrect column count", 18);
        }
        nTd._DT_CellIndex = {
          row: iRow,
          column: i
        };
        cells.push(nTd);
        var display = _fnGetRowDisplay(oSettings, iRow);
        if (create || (oCol.mRender || oCol.mData !== i) && (!$.isPlainObject(oCol.mData) || oCol.mData._ !== i + ".display")) {
          _fnWriteCell(nTd, display[i]);
        }
        _addClass(nTd, oCol.sClass);
        if (oCol.bVisible && create) {
          nTr.appendChild(nTd);
        } else if (!oCol.bVisible && !create) {
          nTd.parentNode.removeChild(nTd);
        }
        if (oCol.fnCreatedCell) {
          oCol.fnCreatedCell.call(
            oSettings.oInstance,
            nTd,
            _fnGetCellData(oSettings, iRow, i),
            rowData,
            iRow,
            i
          );
        }
      }
      _fnCallbackFire(oSettings, "aoRowCreatedCallback", "row-created", [nTr, rowData, iRow, cells]);
    } else {
      _addClass(row.nTr, trClass);
    }
  }
  function _fnRowAttributes(settings, row) {
    var tr = row.nTr;
    var data = row._aData;
    if (tr) {
      var id = settings.rowIdFn(data);
      if (id) {
        tr.id = id;
      }
      if (data.DT_RowClass) {
        var a = data.DT_RowClass.split(" ");
        row.__rowc = row.__rowc ? _unique(row.__rowc.concat(a)) : a;
        $(tr).removeClass(row.__rowc.join(" ")).addClass(data.DT_RowClass);
      }
      if (data.DT_RowAttr) {
        $(tr).attr(data.DT_RowAttr);
      }
      if (data.DT_RowData) {
        $(tr).data(data.DT_RowData);
      }
    }
  }
  function _fnBuildHead(settings, side) {
    var classes = settings.oClasses;
    var columns = settings.aoColumns;
    var i, iLen, row;
    var target = side === "header" ? settings.nTHead : settings.nTFoot;
    var titleProp = side === "header" ? "sTitle" : side;
    if (!target) {
      return;
    }
    if (side === "header" || _pluck(settings.aoColumns, titleProp).join("")) {
      row = $("tr", target);
      if (!row.length) {
        row = $("<tr/>").appendTo(target);
      }
      if (row.length === 1) {
        var cellCount = 0;
        $("td, th", row).each(function() {
          cellCount += this.colSpan;
        });
        for (i = cellCount, iLen = columns.length; i < iLen; i++) {
          $("<th/>").html(columns[i][titleProp] || "").appendTo(row);
        }
      }
    }
    var detected = _fnDetectHeader(settings, target, true);
    if (side === "header") {
      settings.aoHeader = detected;
      $("tr", target).addClass(classes.thead.row);
    } else {
      settings.aoFooter = detected;
      $("tr", target).addClass(classes.tfoot.row);
    }
    $(target).children("tr").children("th, td").each(function() {
      _fnRenderer(settings, side)(
        settings,
        $(this),
        classes
      );
    });
  }
  function _fnHeaderLayout(settings, source, incColumns) {
    var row, column, cell;
    var local = [];
    var structure = [];
    var columns = settings.aoColumns;
    var columnCount = columns.length;
    var rowspan, colspan;
    if (!source) {
      return;
    }
    if (!incColumns) {
      incColumns = _range(columnCount).filter(function(idx) {
        return columns[idx].bVisible;
      });
    }
    for (row = 0; row < source.length; row++) {
      local[row] = source[row].slice().filter(function(cell2, i) {
        return incColumns.includes(i);
      });
      structure.push([]);
    }
    for (row = 0; row < local.length; row++) {
      for (column = 0; column < local[row].length; column++) {
        rowspan = 1;
        colspan = 1;
        if (structure[row][column] === void 0) {
          cell = local[row][column].cell;
          while (local[row + rowspan] !== void 0 && local[row][column].cell == local[row + rowspan][column].cell) {
            structure[row + rowspan][column] = null;
            rowspan++;
          }
          while (local[row][column + colspan] !== void 0 && local[row][column].cell == local[row][column + colspan].cell) {
            for (var k = 0; k < rowspan; k++) {
              structure[row + k][column + colspan] = null;
            }
            colspan++;
          }
          var titleSpan = $(".dt-column-title", cell);
          structure[row][column] = {
            cell,
            colspan,
            rowspan,
            title: titleSpan.length ? titleSpan.html() : $(cell).html()
          };
        }
      }
    }
    return structure;
  }
  function _fnDrawHead(settings, source) {
    var layout = _fnHeaderLayout(settings, source);
    var tr, n;
    for (var row = 0; row < source.length; row++) {
      tr = source[row].row;
      if (tr) {
        while (n = tr.firstChild) {
          tr.removeChild(n);
        }
      }
      for (var column = 0; column < layout[row].length; column++) {
        var point = layout[row][column];
        if (point) {
          $(point.cell).appendTo(tr).attr("rowspan", point.rowspan).attr("colspan", point.colspan);
        }
      }
    }
  }
  function _fnDraw(oSettings, ajaxComplete) {
    _fnStart(oSettings);
    var aPreDraw = _fnCallbackFire(oSettings, "aoPreDrawCallback", "preDraw", [oSettings]);
    if (aPreDraw.indexOf(false) !== -1) {
      _fnProcessingDisplay(oSettings, false);
      return;
    }
    var anRows = [];
    var iRowCount = 0;
    var bServerSide = _fnDataSource(oSettings) == "ssp";
    var aiDisplay = oSettings.aiDisplay;
    var iDisplayStart = oSettings._iDisplayStart;
    var iDisplayEnd = oSettings.fnDisplayEnd();
    var columns = oSettings.aoColumns;
    var body = $(oSettings.nTBody);
    oSettings.bDrawing = true;
    if (oSettings.deferLoading) {
      oSettings.deferLoading = false;
      oSettings.iDraw++;
      _fnProcessingDisplay(oSettings, false);
    } else if (!bServerSide) {
      oSettings.iDraw++;
    } else if (!oSettings.bDestroying && !ajaxComplete) {
      if (oSettings.iDraw === 0) {
        body.empty().append(_emptyRow(oSettings));
      }
      _fnAjaxUpdate(oSettings);
      return;
    }
    if (aiDisplay.length !== 0) {
      var iStart = bServerSide ? 0 : iDisplayStart;
      var iEnd = bServerSide ? oSettings.aoData.length : iDisplayEnd;
      for (var j = iStart; j < iEnd; j++) {
        var iDataIndex = aiDisplay[j];
        var aoData = oSettings.aoData[iDataIndex];
        if (aoData === null) {
          continue;
        }
        if (aoData.nTr === null) {
          _fnCreateTr(oSettings, iDataIndex);
        }
        var nRow = aoData.nTr;
        for (var i = 0; i < columns.length; i++) {
          var col = columns[i];
          var td = aoData.anCells[i];
          _addClass(td, _ext.type.className[col.sType]);
          _addClass(td, oSettings.oClasses.tbody.cell);
        }
        _fnCallbackFire(
          oSettings,
          "aoRowCallback",
          null,
          [nRow, aoData._aData, iRowCount, j, iDataIndex]
        );
        anRows.push(nRow);
        iRowCount++;
      }
    } else {
      anRows[0] = _emptyRow(oSettings);
    }
    _fnCallbackFire(oSettings, "aoHeaderCallback", "header", [
      $(oSettings.nTHead).children("tr")[0],
      _fnGetDataMaster(oSettings),
      iDisplayStart,
      iDisplayEnd,
      aiDisplay
    ]);
    _fnCallbackFire(oSettings, "aoFooterCallback", "footer", [
      $(oSettings.nTFoot).children("tr")[0],
      _fnGetDataMaster(oSettings),
      iDisplayStart,
      iDisplayEnd,
      aiDisplay
    ]);
    if (body[0].replaceChildren) {
      body[0].replaceChildren.apply(body[0], anRows);
    } else {
      body.children().detach();
      body.append($(anRows));
    }
    $(oSettings.nTableWrapper).toggleClass("dt-empty-footer", $("tr", oSettings.nTFoot).length === 0);
    _fnCallbackFire(oSettings, "aoDrawCallback", "draw", [oSettings], true);
    oSettings.bSorted = false;
    oSettings.bFiltered = false;
    oSettings.bDrawing = false;
  }
  function _fnReDraw(settings, holdPosition, recompute) {
    var features = settings.oFeatures, sort = features.bSort, filter = features.bFilter;
    if (recompute === void 0 || recompute === true) {
      _fnColumnTypes(settings);
      if (sort) {
        _fnSort(settings);
      }
      if (filter) {
        _fnFilterComplete(settings, settings.oPreviousSearch);
      } else {
        settings.aiDisplay = settings.aiDisplayMaster.slice();
      }
    }
    if (holdPosition !== true) {
      settings._iDisplayStart = 0;
    }
    settings._drawHold = holdPosition;
    _fnDraw(settings);
    settings.api.one("draw", function() {
      settings._drawHold = false;
    });
  }
  function _emptyRow(settings) {
    var oLang = settings.oLanguage;
    var zero = oLang.sZeroRecords;
    var dataSrc = _fnDataSource(settings);
    if ((dataSrc === "ssp" || dataSrc === "ajax") && !settings.json) {
      zero = oLang.sLoadingRecords;
    } else if (oLang.sEmptyTable && settings.fnRecordsTotal() === 0) {
      zero = oLang.sEmptyTable;
    }
    return $("<tr/>").append($("<td />", {
      "colSpan": _fnVisibleColumns(settings),
      "class": settings.oClasses.empty.row
    }).html(zero))[0];
  }
  function _layoutItems(row, align, items) {
    if (Array.isArray(items)) {
      for (var i = 0; i < items.length; i++) {
        _layoutItems(row, align, items[i]);
      }
      return;
    }
    var rowCell = row[align];
    if ($.isPlainObject(items)) {
      if (items.features) {
        if (items.rowId) {
          row.id = items.rowId;
        }
        if (items.rowClass) {
          row.className = items.rowClass;
        }
        rowCell.id = items.id;
        rowCell.className = items.className;
        _layoutItems(row, align, items.features);
      } else {
        Object.keys(items).map(function(key) {
          rowCell.contents.push({
            feature: key,
            opts: items[key]
          });
        });
      }
    } else {
      rowCell.contents.push(items);
    }
  }
  function _layoutGetRow(rows, rowNum, align) {
    var row;
    for (var i = 0; i < rows.length; i++) {
      row = rows[i];
      if (row.rowNum === rowNum) {
        if (align === "full" && row.full || (align === "start" || align === "end") && (row.start || row.end)) {
          if (!row[align]) {
            row[align] = {
              contents: []
            };
          }
          return row;
        }
      }
    }
    row = {
      rowNum
    };
    row[align] = {
      contents: []
    };
    rows.push(row);
    return row;
  }
  function _layoutArray(settings, layout, side) {
    var rows = [];
    $.each(layout, function(pos, items) {
      if (items === null) {
        return;
      }
      var parts = pos.match(/^([a-z]+)([0-9]*)([A-Za-z]*)$/);
      var rowNum = parts[2] ? parts[2] * 1 : 0;
      var align = parts[3] ? parts[3].toLowerCase() : "full";
      if (parts[1] !== side) {
        return;
      }
      var row2 = _layoutGetRow(rows, rowNum, align);
      _layoutItems(row2, align, items);
    });
    rows.sort(function(a, b) {
      var order1 = a.rowNum;
      var order2 = b.rowNum;
      if (order1 === order2) {
        var ret = a.full && !b.full ? -1 : 1;
        return side === "bottom" ? ret * -1 : ret;
      }
      return order2 - order1;
    });
    if (side === "bottom") {
      rows.reverse();
    }
    for (var row = 0; row < rows.length; row++) {
      delete rows[row].rowNum;
      _layoutResolve(settings, rows[row]);
    }
    return rows;
  }
  function _layoutResolve(settings, row) {
    var getFeature = function(feature, opts) {
      if (!_ext.features[feature]) {
        _fnLog(settings, 0, "Unknown feature: " + feature);
      }
      return _ext.features[feature].apply(this, [settings, opts]);
    };
    var resolve = function(item) {
      if (!row[item]) {
        return;
      }
      var line = row[item].contents;
      for (var i = 0, iLen = line.length; i < iLen; i++) {
        if (!line[i]) {
          continue;
        } else if (typeof line[i] === "string") {
          line[i] = getFeature(line[i], null);
        } else if ($.isPlainObject(line[i])) {
          line[i] = getFeature(line[i].feature, line[i].opts);
        } else if (typeof line[i].node === "function") {
          line[i] = line[i].node(settings);
        } else if (typeof line[i] === "function") {
          var inst = line[i](settings);
          line[i] = typeof inst.node === "function" ? inst.node() : inst;
        }
      }
    };
    resolve("start");
    resolve("end");
    resolve("full");
  }
  function _fnAddOptionsHtml(settings) {
    var classes = settings.oClasses;
    var table = $(settings.nTable);
    var insert = $("<div/>").attr({
      id: settings.sTableId + "_wrapper",
      "class": classes.container
    }).insertBefore(table);
    settings.nTableWrapper = insert[0];
    if (settings.sDom) {
      _fnLayoutDom(settings, settings.sDom, insert);
    } else {
      var top = _layoutArray(settings, settings.layout, "top");
      var bottom = _layoutArray(settings, settings.layout, "bottom");
      var renderer = _fnRenderer(settings, "layout");
      top.forEach(function(item) {
        renderer(settings, insert, item);
      });
      renderer(settings, insert, {
        full: {
          table: true,
          contents: [_fnFeatureHtmlTable(settings)]
        }
      });
      bottom.forEach(function(item) {
        renderer(settings, insert, item);
      });
    }
    _processingHtml(settings);
  }
  function _fnLayoutDom(settings, dom, insert) {
    var parts = dom.match(/(".*?")|('.*?')|./g);
    var featureNode, option, newNode, next, attr;
    for (var i = 0; i < parts.length; i++) {
      featureNode = null;
      option = parts[i];
      if (option == "<") {
        newNode = $("<div/>");
        next = parts[i + 1];
        if (next[0] == "'" || next[0] == '"') {
          attr = next.replace(/['"]/g, "");
          var id = "", className;
          if (attr.indexOf(".") != -1) {
            var split = attr.split(".");
            id = split[0];
            className = split[1];
          } else if (attr[0] == "#") {
            id = attr;
          } else {
            className = attr;
          }
          newNode.attr("id", id.substring(1)).addClass(className);
          i++;
        }
        insert.append(newNode);
        insert = newNode;
      } else if (option == ">") {
        insert = insert.parent();
      } else if (option == "t") {
        featureNode = _fnFeatureHtmlTable(settings);
      } else {
        DataTable.ext.feature.forEach(function(feature) {
          if (option == feature.cFeature) {
            featureNode = feature.fnInit(settings);
          }
        });
      }
      if (featureNode) {
        insert.append(featureNode);
      }
    }
  }
  function _fnDetectHeader(settings, thead, write) {
    var columns = settings.aoColumns;
    var rows = $(thead).children("tr");
    var row, cell;
    var i, k, l, iLen, shifted, column, colspan, rowspan;
    var titleRow = settings.titleRow;
    var isHeader = thead && thead.nodeName.toLowerCase() === "thead";
    var layout = [];
    var unique;
    var shift = function(a, i2, j) {
      var k2 = a[i2];
      while (k2[j]) {
        j++;
      }
      return j;
    };
    for (i = 0, iLen = rows.length; i < iLen; i++) {
      layout.push([]);
    }
    for (i = 0, iLen = rows.length; i < iLen; i++) {
      row = rows[i];
      column = 0;
      cell = row.firstChild;
      while (cell) {
        if (cell.nodeName.toUpperCase() == "TD" || cell.nodeName.toUpperCase() == "TH") {
          var cols = [];
          var jqCell = $(cell);
          colspan = cell.getAttribute("colspan") * 1;
          rowspan = cell.getAttribute("rowspan") * 1;
          colspan = !colspan || colspan === 0 || colspan === 1 ? 1 : colspan;
          rowspan = !rowspan || rowspan === 0 || rowspan === 1 ? 1 : rowspan;
          shifted = shift(layout, i, column);
          unique = colspan === 1 ? true : false;
          if (write) {
            if (unique) {
              _fnColumnOptions(settings, shifted, _fnEscapeObject(jqCell.data()));
              var columnDef = columns[shifted];
              var width = cell.getAttribute("width") || null;
              var t = cell.style.width.match(/width:\s*(\d+[pxem%]+)/);
              if (t) {
                width = t[1];
              }
              columnDef.sWidthOrig = columnDef.sWidth || width;
              if (isHeader) {
                if (columnDef.sTitle !== null && !columnDef.autoTitle) {
                  if (titleRow === true && i === 0 || // top row
                  titleRow === false && i === rows.length - 1 || // bottom row
                  titleRow === i || // specific row
                  titleRow === null) {
                    cell.innerHTML = columnDef.sTitle;
                  }
                }
                if (!columnDef.sTitle && unique) {
                  columnDef.sTitle = _stripHtml(cell.innerHTML);
                  columnDef.autoTitle = true;
                }
              } else {
                if (columnDef.footer) {
                  cell.innerHTML = columnDef.footer;
                }
              }
              if (!columnDef.ariaTitle) {
                columnDef.ariaTitle = jqCell.attr("aria-label") || columnDef.sTitle;
              }
              if (columnDef.className) {
                jqCell.addClass(columnDef.className);
              }
            }
            if ($(".dt-column-title", cell).length === 0) {
              $(document.createElement(settings.columnTitleTag)).addClass("dt-column-title").append(cell.childNodes).appendTo(cell);
            }
            if (settings.orderIndicators && isHeader && jqCell.filter(":not([data-dt-order=disable])").length !== 0 && jqCell.parent(":not([data-dt-order=disable])").length !== 0 && $(".dt-column-order", cell).length === 0) {
              $(document.createElement(settings.columnTitleTag)).addClass("dt-column-order").appendTo(cell);
            }
            var headerFooter = isHeader ? "header" : "footer";
            if ($("div.dt-column-" + headerFooter, cell).length === 0) {
              $("<div>").addClass("dt-column-" + headerFooter).append(cell.childNodes).appendTo(cell);
            }
          }
          for (l = 0; l < colspan; l++) {
            for (k = 0; k < rowspan; k++) {
              layout[i + k][shifted + l] = {
                cell,
                unique
              };
              layout[i + k].row = row;
            }
            cols.push(shifted + l);
          }
          cell.setAttribute("data-dt-column", _unique(cols).join(","));
        }
        cell = cell.nextSibling;
      }
    }
    return layout;
  }
  function _fnStart(oSettings) {
    var bServerSide = _fnDataSource(oSettings) == "ssp";
    var iInitDisplayStart = oSettings.iInitDisplayStart;
    if (iInitDisplayStart !== void 0 && iInitDisplayStart !== -1) {
      oSettings._iDisplayStart = bServerSide ? iInitDisplayStart : iInitDisplayStart >= oSettings.fnRecordsDisplay() ? 0 : iInitDisplayStart;
      oSettings.iInitDisplayStart = -1;
    }
  }
  function _fnBuildAjax(oSettings, data, fn) {
    var ajaxData;
    var ajax = oSettings.ajax;
    var instance = oSettings.oInstance;
    var callback = function(json) {
      var status = oSettings.jqXHR ? oSettings.jqXHR.status : null;
      if (json === null || typeof status === "number" && status == 204) {
        json = {};
        _fnAjaxDataSrc(oSettings, json, []);
      }
      var error = json.error || json.sError;
      if (error) {
        _fnLog(oSettings, 0, error);
      }
      if (json.d && typeof json.d === "string") {
        try {
          json = JSON.parse(json.d);
        } catch (e) {
        }
      }
      oSettings.json = json;
      _fnCallbackFire(oSettings, null, "xhr", [oSettings, json, oSettings.jqXHR], true);
      fn(json);
    };
    if ($.isPlainObject(ajax) && ajax.data) {
      ajaxData = ajax.data;
      var newData = typeof ajaxData === "function" ? ajaxData(data, oSettings) : ajaxData;
      data = typeof ajaxData === "function" && newData ? newData : $.extend(true, data, newData);
      delete ajax.data;
    }
    var baseAjax = {
      url: typeof ajax === "string" ? ajax : "",
      data,
      success: callback,
      dataType: "json",
      cache: false,
      type: oSettings.sServerMethod,
      error: function(xhr, error) {
        var ret = _fnCallbackFire(
          oSettings,
          null,
          "xhr",
          [oSettings, null, oSettings.jqXHR],
          true
        );
        if (ret.indexOf(true) === -1) {
          if (error == "parsererror") {
            _fnLog(oSettings, 0, "Invalid JSON response", 1);
          } else if (xhr.readyState === 4) {
            _fnLog(oSettings, 0, "Ajax error", 7);
          }
        }
        _fnProcessingDisplay(oSettings, false);
      }
    };
    if ($.isPlainObject(ajax)) {
      $.extend(baseAjax, ajax);
    }
    oSettings.oAjaxData = data;
    _fnCallbackFire(oSettings, null, "preXhr", [oSettings, data, baseAjax], true);
    if (baseAjax.submitAs === "json" && typeof data === "object") {
      baseAjax.data = JSON.stringify(data);
      if (!baseAjax.contentType) {
        baseAjax.contentType = "application/json; charset=utf-8";
      }
    }
    if (typeof ajax === "function") {
      oSettings.jqXHR = ajax.call(instance, data, callback, oSettings);
    } else if (ajax.url === "") {
      var empty = {};
      _fnAjaxDataSrc(oSettings, empty, []);
      callback(empty);
    } else {
      oSettings.jqXHR = $.ajax(baseAjax);
    }
    if (ajaxData) {
      ajax.data = ajaxData;
    }
  }
  function _fnAjaxUpdate(settings) {
    settings.iDraw++;
    _fnProcessingDisplay(settings, true);
    _fnBuildAjax(settings, _fnAjaxParameters(settings), function(json) {
      _fnAjaxUpdateDraw(settings, json);
    });
  }
  function _fnAjaxParameters(settings) {
    var columns = settings.aoColumns, features = settings.oFeatures, preSearch = settings.oPreviousSearch, preColSearch = settings.aoPreSearchCols, colData = function(idx, prop) {
      return typeof columns[idx][prop] === "function" ? "function" : columns[idx][prop];
    };
    return {
      draw: settings.iDraw,
      columns: columns.map(function(column, i) {
        return {
          data: colData(i, "mData"),
          name: column.sName,
          searchable: column.bSearchable,
          orderable: column.bSortable,
          search: {
            value: preColSearch[i].search,
            regex: preColSearch[i].regex,
            fixed: Object.keys(column.searchFixed).map(function(name) {
              return {
                name,
                term: typeof column.searchFixed[name] !== "function" ? column.searchFixed[name].toString() : "function"
              };
            })
          }
        };
      }),
      order: _fnSortFlatten(settings).map(function(val) {
        return {
          column: val.col,
          dir: val.dir,
          name: colData(val.col, "sName")
        };
      }),
      start: settings._iDisplayStart,
      length: features.bPaginate ? settings._iDisplayLength : -1,
      search: {
        value: preSearch.search,
        regex: preSearch.regex,
        fixed: Object.keys(settings.searchFixed).map(function(name) {
          return {
            name,
            term: typeof settings.searchFixed[name] !== "function" ? settings.searchFixed[name].toString() : "function"
          };
        })
      }
    };
  }
  function _fnAjaxUpdateDraw(settings, json) {
    var data = _fnAjaxDataSrc(settings, json);
    var draw = _fnAjaxDataSrcParam(settings, "draw", json);
    var recordsTotal = _fnAjaxDataSrcParam(settings, "recordsTotal", json);
    var recordsFiltered = _fnAjaxDataSrcParam(settings, "recordsFiltered", json);
    if (draw !== void 0) {
      if (draw * 1 < settings.iDraw) {
        return;
      }
      settings.iDraw = draw * 1;
    }
    if (!data) {
      data = [];
    }
    _fnClearTable(settings);
    settings._iRecordsTotal = parseInt(recordsTotal, 10);
    settings._iRecordsDisplay = parseInt(recordsFiltered, 10);
    for (var i = 0, iLen = data.length; i < iLen; i++) {
      _fnAddData(settings, data[i]);
    }
    settings.aiDisplay = settings.aiDisplayMaster.slice();
    _fnColumnTypes(settings);
    _fnDraw(settings, true);
    _fnInitComplete(settings);
    _fnProcessingDisplay(settings, false);
  }
  function _fnAjaxDataSrc(settings, json, write) {
    var dataProp = "data";
    if ($.isPlainObject(settings.ajax) && settings.ajax.dataSrc !== void 0) {
      var dataSrc = settings.ajax.dataSrc;
      if (typeof dataSrc === "string" || typeof dataSrc === "function") {
        dataProp = dataSrc;
      } else if (dataSrc.data !== void 0) {
        dataProp = dataSrc.data;
      }
    }
    if (!write) {
      if (dataProp === "data") {
        return json.aaData || json[dataProp];
      }
      return dataProp !== "" ? _fnGetObjectDataFn(dataProp)(json) : json;
    }
    _fnSetObjectDataFn(dataProp)(json, write);
  }
  function _fnAjaxDataSrcParam(settings, param, json) {
    var dataSrc = $.isPlainObject(settings.ajax) ? settings.ajax.dataSrc : null;
    if (dataSrc && dataSrc[param]) {
      return _fnGetObjectDataFn(dataSrc[param])(json);
    }
    var old = "";
    if (param === "draw") {
      old = "sEcho";
    } else if (param === "recordsTotal") {
      old = "iTotalRecords";
    } else if (param === "recordsFiltered") {
      old = "iTotalDisplayRecords";
    }
    return json[old] !== void 0 ? json[old] : json[param];
  }
  function _fnFilterComplete(settings, input) {
    var columnsSearch = settings.aoPreSearchCols;
    if (_fnDataSource(settings) != "ssp") {
      _fnFilterData(settings);
      settings.aiDisplay = settings.aiDisplayMaster.slice();
      _fnFilter(settings.aiDisplay, settings, input.search, input);
      $.each(settings.searchFixed, function(name, term) {
        _fnFilter(settings.aiDisplay, settings, term, {});
      });
      for (var i = 0; i < columnsSearch.length; i++) {
        var col = columnsSearch[i];
        _fnFilter(
          settings.aiDisplay,
          settings,
          col.search,
          col,
          i
        );
        $.each(settings.aoColumns[i].searchFixed, function(name, term) {
          _fnFilter(settings.aiDisplay, settings, term, {}, i);
        });
      }
      _fnFilterCustom(settings);
    }
    settings.bFiltered = true;
    _fnCallbackFire(settings, null, "search", [settings]);
  }
  function _fnFilterCustom(settings) {
    var filters = DataTable.ext.search;
    var displayRows = settings.aiDisplay;
    var row, rowIdx;
    for (var i = 0, iLen = filters.length; i < iLen; i++) {
      var rows = [];
      for (var j = 0, jen = displayRows.length; j < jen; j++) {
        rowIdx = displayRows[j];
        row = settings.aoData[rowIdx];
        if (filters[i](settings, row._aFilterData, rowIdx, row._aData, j)) {
          rows.push(rowIdx);
        }
      }
      displayRows.length = 0;
      _fnArrayApply(displayRows, rows);
    }
  }
  function _fnFilter(searchRows, settings, input, options, column) {
    if (input === "") {
      return;
    }
    var i = 0;
    var matched = [];
    var searchFunc = typeof input === "function" ? input : null;
    var rpSearch = input instanceof RegExp ? input : searchFunc ? null : _fnFilterCreateSearch(input, options);
    for (i = 0; i < searchRows.length; i++) {
      var row = settings.aoData[searchRows[i]];
      var data = column === void 0 ? row._sFilterRow : row._aFilterData[column];
      if (searchFunc && searchFunc(data, row._aData, searchRows[i], column) || rpSearch && rpSearch.test(data)) {
        matched.push(searchRows[i]);
      }
    }
    searchRows.length = matched.length;
    for (i = 0; i < matched.length; i++) {
      searchRows[i] = matched[i];
    }
  }
  function _fnFilterCreateSearch(search2, inOpts) {
    var not = [];
    var options = $.extend({}, {
      boundary: false,
      caseInsensitive: true,
      exact: false,
      regex: false,
      smart: true
    }, inOpts);
    if (typeof search2 !== "string") {
      search2 = search2.toString();
    }
    search2 = _normalize(search2);
    if (options.exact) {
      return new RegExp(
        "^" + _fnEscapeRegex(search2) + "$",
        options.caseInsensitive ? "i" : ""
      );
    }
    search2 = options.regex ? search2 : _fnEscapeRegex(search2);
    if (options.smart) {
      var parts = search2.match(/!?["\u201C][^"\u201D]+["\u201D]|[^ ]+/g) || [""];
      var a = parts.map(function(word) {
        var negative = false;
        var m;
        if (word.charAt(0) === "!") {
          negative = true;
          word = word.substring(1);
        }
        if (word.charAt(0) === '"') {
          m = word.match(/^"(.*)"$/);
          word = m ? m[1] : word;
        } else if (word.charAt(0) === "\u201C") {
          m = word.match(/^\u201C(.*)\u201D$/);
          word = m ? m[1] : word;
        }
        if (negative) {
          if (word.length > 1) {
            not.push("(?!" + word + ")");
          }
          word = "";
        }
        return word.replace(/"/g, "");
      });
      var match = not.length ? not.join("") : "";
      var boundary = options.boundary ? "\\b" : "";
      search2 = "^(?=.*?" + boundary + a.join(")(?=.*?" + boundary) + ")(" + match + ".)*$";
    }
    return new RegExp(search2, options.caseInsensitive ? "i" : "");
  }
  var _fnEscapeRegex = DataTable.util.escapeRegex;
  var __filter_div = $("<div>")[0];
  var __filter_div_textContent = __filter_div.textContent !== void 0;
  function _fnFilterData(settings) {
    var columns = settings.aoColumns;
    var data = settings.aoData;
    var column;
    var j, jen, filterData, cellData, row;
    var wasInvalidated = false;
    for (var rowIdx = 0; rowIdx < data.length; rowIdx++) {
      if (!data[rowIdx]) {
        continue;
      }
      row = data[rowIdx];
      if (!row._aFilterData) {
        filterData = [];
        for (j = 0, jen = columns.length; j < jen; j++) {
          column = columns[j];
          if (column.bSearchable) {
            cellData = _fnGetCellData(settings, rowIdx, j, "filter");
            if (cellData === null) {
              cellData = "";
            }
            if (typeof cellData !== "string" && cellData.toString) {
              cellData = cellData.toString();
            }
          } else {
            cellData = "";
          }
          if (cellData.indexOf && cellData.indexOf("&") !== -1) {
            __filter_div.innerHTML = cellData;
            cellData = __filter_div_textContent ? __filter_div.textContent : __filter_div.innerText;
          }
          if (cellData.replace) {
            cellData = cellData.replace(/[\r\n\u2028]/g, "");
          }
          filterData.push(cellData);
        }
        row._aFilterData = filterData;
        row._sFilterRow = filterData.join("  ");
        wasInvalidated = true;
      }
    }
    return wasInvalidated;
  }
  function _fnInitialise(settings) {
    var i;
    var init3 = settings.oInit;
    var deferLoading = settings.deferLoading;
    var dataSrc = _fnDataSource(settings);
    if (!settings.bInitialised) {
      setTimeout(function() {
        _fnInitialise(settings);
      }, 200);
      return;
    }
    _fnBuildHead(settings, "header");
    _fnBuildHead(settings, "footer");
    _fnLoadState(settings, init3, function() {
      _fnDrawHead(settings, settings.aoHeader);
      _fnDrawHead(settings, settings.aoFooter);
      var iAjaxStart = settings.iInitDisplayStart;
      if (init3.aaData) {
        for (i = 0; i < init3.aaData.length; i++) {
          _fnAddData(settings, init3.aaData[i]);
        }
      } else if (deferLoading || dataSrc == "dom") {
        _fnAddTr(settings, $(settings.nTBody).children("tr"));
      }
      settings.aiDisplay = settings.aiDisplayMaster.slice();
      _fnAddOptionsHtml(settings);
      _fnSortInit(settings);
      _colGroup(settings);
      _fnProcessingDisplay(settings, true);
      _fnCallbackFire(settings, null, "preInit", [settings], true);
      _fnReDraw(settings);
      if (dataSrc != "ssp" || deferLoading) {
        if (dataSrc == "ajax") {
          _fnBuildAjax(settings, {}, function(json) {
            var aData = _fnAjaxDataSrc(settings, json);
            for (i = 0; i < aData.length; i++) {
              _fnAddData(settings, aData[i]);
            }
            settings.iInitDisplayStart = iAjaxStart;
            _fnReDraw(settings);
            _fnProcessingDisplay(settings, false);
            _fnInitComplete(settings);
          }, settings);
        } else {
          _fnInitComplete(settings);
          _fnProcessingDisplay(settings, false);
        }
      }
    });
  }
  function _fnInitComplete(settings) {
    if (settings._bInitComplete) {
      return;
    }
    var args = [settings, settings.json];
    settings._bInitComplete = true;
    _fnAdjustColumnSizing(settings);
    _fnCallbackFire(settings, null, "plugin-init", args, true);
    _fnCallbackFire(settings, "aoInitComplete", "init", args, true);
  }
  function _fnLengthChange(settings, val) {
    var len = parseInt(val, 10);
    settings._iDisplayLength = len;
    _fnLengthOverflow(settings);
    _fnCallbackFire(settings, null, "length", [settings, len]);
  }
  function _fnPageChange(settings, action, redraw) {
    var start = settings._iDisplayStart, len = settings._iDisplayLength, records = settings.fnRecordsDisplay();
    if (records === 0 || len === -1) {
      start = 0;
    } else if (typeof action === "number") {
      start = action * len;
      if (start > records) {
        start = 0;
      }
    } else if (action == "first") {
      start = 0;
    } else if (action == "previous") {
      start = len >= 0 ? start - len : 0;
      if (start < 0) {
        start = 0;
      }
    } else if (action == "next") {
      if (start + len < records) {
        start += len;
      }
    } else if (action == "last") {
      start = Math.floor((records - 1) / len) * len;
    } else if (action === "ellipsis") {
      return;
    } else {
      _fnLog(settings, 0, "Unknown paging action: " + action, 5);
    }
    var changed = settings._iDisplayStart !== start;
    settings._iDisplayStart = start;
    _fnCallbackFire(settings, null, changed ? "page" : "page-nc", [settings]);
    if (changed && redraw) {
      _fnDraw(settings);
    }
    return changed;
  }
  function _processingHtml(settings) {
    var table = settings.nTable;
    var scrolling = settings.oScroll.sX !== "" || settings.oScroll.sY !== "";
    if (settings.oFeatures.bProcessing) {
      var n = $("<div/>", {
        "id": settings.sTableId + "_processing",
        "class": settings.oClasses.processing.container,
        "role": "status"
      }).html(settings.oLanguage.sProcessing).append("<div><div></div><div></div><div></div><div></div></div>");
      if (scrolling) {
        n.prependTo($("div.dt-scroll", settings.nTableWrapper));
      } else {
        n.insertBefore(table);
      }
      $(table).on("processing.dt.DT", function(e, s, show) {
        n.css("display", show ? "block" : "none");
      });
    }
  }
  function _fnProcessingDisplay(settings, show) {
    if (settings.bDrawing && show === false) {
      return;
    }
    _fnCallbackFire(settings, null, "processing", [settings, show]);
  }
  function _fnProcessingRun(settings, enable, run) {
    if (!enable) {
      run();
    } else {
      _fnProcessingDisplay(settings, true);
      setTimeout(function() {
        run();
        _fnProcessingDisplay(settings, false);
      }, 0);
    }
  }
  function _fnFeatureHtmlTable(settings) {
    var table = $(settings.nTable);
    var scroll = settings.oScroll;
    if (scroll.sX === "" && scroll.sY === "") {
      return settings.nTable;
    }
    var scrollX = scroll.sX;
    var scrollY = scroll.sY;
    var classes = settings.oClasses.scrolling;
    var caption = settings.captionNode;
    var captionSide = caption ? caption._captionSide : null;
    var headerClone = $(table[0].cloneNode(false));
    var footerClone = $(table[0].cloneNode(false));
    var footer = table.children("tfoot");
    var _div = "<div/>";
    var size = function(s) {
      return !s ? null : _fnStringToCss(s);
    };
    if (!footer.length) {
      footer = null;
    }
    var scroller = $(_div, { "class": classes.container }).append(
      $(_div, { "class": classes.header.self }).css({
        overflow: "hidden",
        position: "relative",
        border: 0,
        width: scrollX ? size(scrollX) : "100%"
      }).append(
        $(_div, { "class": classes.header.inner }).css({
          "box-sizing": "content-box",
          width: scroll.sXInner || "100%"
        }).append(
          headerClone.removeAttr("id").css("margin-left", 0).append(captionSide === "top" ? caption : null).append(
            table.children("thead")
          )
        )
      )
    ).append(
      $(_div, { "class": classes.body }).css({
        position: "relative",
        overflow: "auto",
        width: size(scrollX)
      }).append(table)
    );
    if (footer) {
      scroller.append(
        $(_div, { "class": classes.footer.self }).css({
          overflow: "hidden",
          border: 0,
          width: scrollX ? size(scrollX) : "100%"
        }).append(
          $(_div, { "class": classes.footer.inner }).append(
            footerClone.removeAttr("id").css("margin-left", 0).append(captionSide === "bottom" ? caption : null).append(
              table.children("tfoot")
            )
          )
        )
      );
    }
    var children = scroller.children();
    var scrollHead = children[0];
    var scrollBody = children[1];
    var scrollFoot = footer ? children[2] : null;
    $(scrollBody).on("scroll.DT", function() {
      var scrollLeft = this.scrollLeft;
      scrollHead.scrollLeft = scrollLeft;
      if (footer) {
        scrollFoot.scrollLeft = scrollLeft;
      }
    });
    $("th, td", scrollHead).on("focus", function() {
      var scrollLeft = scrollHead.scrollLeft;
      scrollBody.scrollLeft = scrollLeft;
      if (footer) {
        scrollBody.scrollLeft = scrollLeft;
      }
    });
    $(scrollBody).css("max-height", scrollY);
    if (!scroll.bCollapse) {
      $(scrollBody).css("height", scrollY);
    }
    settings.nScrollHead = scrollHead;
    settings.nScrollBody = scrollBody;
    settings.nScrollFoot = scrollFoot;
    settings.aoDrawCallback.push(_fnScrollDraw);
    return scroller[0];
  }
  function _fnScrollDraw(settings) {
    var scroll = settings.oScroll, barWidth = scroll.iBarWidth, divHeader = $(settings.nScrollHead), divHeaderInner = divHeader.children("div"), divHeaderTable = divHeaderInner.children("table"), divBodyEl = settings.nScrollBody, divBody = $(divBodyEl), divFooter = $(settings.nScrollFoot), divFooterInner = divFooter.children("div"), divFooterTable = divFooterInner.children("table"), header = $(settings.nTHead), table = $(settings.nTable), footer = settings.nTFoot && $("th, td", settings.nTFoot).length ? $(settings.nTFoot) : null, browser = settings.oBrowser, headerCopy, footerCopy;
    var scrollBarVis = divBodyEl.scrollHeight > divBodyEl.clientHeight;
    if (settings.scrollBarVis !== scrollBarVis && settings.scrollBarVis !== void 0) {
      settings.scrollBarVis = scrollBarVis;
      _fnAdjustColumnSizing(settings);
      return;
    } else {
      settings.scrollBarVis = scrollBarVis;
    }
    table.children("thead, tfoot").remove();
    headerCopy = header.clone().prependTo(table);
    headerCopy.find("th, td").removeAttr("tabindex");
    headerCopy.find("[id]").removeAttr("id");
    if (footer) {
      footerCopy = footer.clone().prependTo(table);
      footerCopy.find("[id]").removeAttr("id");
    }
    if (settings.aiDisplay.length) {
      var firstTr = null;
      var start = _fnDataSource(settings) !== "ssp" ? settings._iDisplayStart : 0;
      for (i = start; i < start + settings.aiDisplay.length; i++) {
        var idx = settings.aiDisplay[i];
        var tr = settings.aoData[idx].nTr;
        if (tr) {
          firstTr = tr;
          break;
        }
      }
      if (firstTr) {
        var colSizes = $(firstTr).children("th, td").map(function(vis) {
          return {
            idx: _fnVisibleToColumnIndex(settings, vis),
            width: $(this).outerWidth()
          };
        });
        for (var i = 0; i < colSizes.length; i++) {
          var colEl = settings.aoColumns[colSizes[i].idx].colEl[0];
          var colWidth = colEl.style.width.replace("px", "");
          if (colWidth !== colSizes[i].width) {
            colEl.style.width = colSizes[i].width + "px";
            if (scroll.sX) {
              colEl.style.minWidth = colSizes[i].width + "px";
            }
          }
        }
      }
    }
    divHeaderTable.find("colgroup").remove();
    divHeaderTable.append(settings.colgroup.clone());
    if (footer) {
      divFooterTable.find("colgroup").remove();
      divFooterTable.append(settings.colgroup.clone());
    }
    $("th, td", headerCopy).each(function() {
      $(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
    });
    if (footer) {
      $("th, td", footerCopy).each(function() {
        $(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
      });
    }
    var isScrolling = Math.floor(table.height()) > divBodyEl.clientHeight || divBody.css("overflow-y") == "scroll";
    var paddingSide = "padding" + (browser.bScrollbarLeft ? "Left" : "Right");
    var outerWidth = table.outerWidth();
    divHeaderTable.css("width", _fnStringToCss(outerWidth));
    divHeaderInner.css("width", _fnStringToCss(outerWidth)).css(paddingSide, isScrolling ? barWidth + "px" : "0px");
    if (footer) {
      divFooterTable.css("width", _fnStringToCss(outerWidth));
      divFooterInner.css("width", _fnStringToCss(outerWidth)).css(paddingSide, isScrolling ? barWidth + "px" : "0px");
    }
    table.children("colgroup").prependTo(table);
    divBody.trigger("scroll");
    if ((settings.bSorted || settings.bFiltered) && !settings._drawHold) {
      divBodyEl.scrollTop = 0;
    }
  }
  function _fnCalculateColumnWidths(settings) {
    if (!settings.oFeatures.bAutoWidth) {
      return;
    }
    var table = settings.nTable, columns = settings.aoColumns, scroll = settings.oScroll, scrollY = scroll.sY, scrollX = scroll.sX, scrollXInner = scroll.sXInner, visibleColumns = _fnGetColumns(settings, "bVisible"), tableWidthAttr = table.getAttribute("width"), tableContainer = table.parentNode, i, j, column, columnIdx;
    var styleWidth = table.style.width;
    var containerWidth = _fnWrapperWidth(settings);
    if (containerWidth === settings.containerWidth) {
      return false;
    }
    settings.containerWidth = containerWidth;
    if (!styleWidth && !tableWidthAttr) {
      table.style.width = "100%";
      styleWidth = "100%";
    }
    if (styleWidth && styleWidth.indexOf("%") !== -1) {
      tableWidthAttr = styleWidth;
    }
    _fnCallbackFire(
      settings,
      null,
      "column-calc",
      { visible: visibleColumns },
      false
    );
    var tmpTable = $(table.cloneNode()).css("visibility", "hidden").css("margin", 0).removeAttr("id");
    tmpTable.append("<tbody/>");
    tmpTable.append($(settings.nTHead).clone()).append($(settings.nTFoot).clone());
    tmpTable.find("tfoot th, tfoot td").css("width", "");
    tmpTable.find("thead th, thead td").each(function() {
      var width = _fnColumnsSumWidth(settings, this, true, false);
      if (width) {
        this.style.width = width;
        if (scrollX) {
          this.style.minWidth = width;
          $(this).append($("<div/>").css({
            width,
            margin: 0,
            padding: 0,
            border: 0,
            height: 1
          }));
        }
      } else {
        this.style.width = "";
      }
    });
    var longestData = [];
    for (i = 0; i < visibleColumns.length; i++) {
      longestData.push(_fnGetWideStrings(settings, visibleColumns[i]));
    }
    if (longestData.length) {
      for (i = 0; i < longestData[0].length; i++) {
        var tr = $("<tr/>").appendTo(tmpTable.find("tbody"));
        for (j = 0; j < visibleColumns.length; j++) {
          columnIdx = visibleColumns[j];
          column = columns[columnIdx];
          var longest = longestData[j][i] || "";
          var autoClass = _ext.type.className[column.sType];
          var padding = column.sContentPadding || (scrollX ? "-" : "");
          var text = longest + padding;
          var insert = longest.indexOf("<") === -1 && longest.indexOf("&") === -1 ? document.createTextNode(text) : text;
          $("<td/>").addClass(autoClass).addClass(column.sClass).append(insert).appendTo(tr);
        }
      }
    }
    $("[name]", tmpTable).removeAttr("name");
    var holder = $("<div/>").css(
      scrollX || scrollY ? {
        position: "absolute",
        top: 0,
        left: 0,
        height: 1,
        right: 0,
        overflow: "hidden"
      } : {}
    ).append(tmpTable).appendTo(tableContainer);
    if (scrollX && scrollXInner) {
      tmpTable.width(scrollXInner);
    } else if (scrollX) {
      tmpTable.css("width", "auto");
      tmpTable.removeAttr("width");
      if (tmpTable.outerWidth() < tableContainer.clientWidth && tableWidthAttr) {
        tmpTable.outerWidth(tableContainer.clientWidth);
      }
    } else if (scrollY) {
      tmpTable.outerWidth(tableContainer.clientWidth);
    } else if (tableWidthAttr) {
      tmpTable.outerWidth(tableWidthAttr);
    }
    var total = 0;
    var bodyCells = tmpTable.find("tbody tr").eq(0).children();
    for (i = 0; i < visibleColumns.length; i++) {
      var bounding = bodyCells[i].getBoundingClientRect().width;
      total += bounding;
      columns[visibleColumns[i]].sWidth = _fnStringToCss(bounding);
    }
    table.style.width = _fnStringToCss(total);
    holder.remove();
    if (tableWidthAttr) {
      table.style.width = _fnStringToCss(tableWidthAttr);
    }
    if ((tableWidthAttr || scrollX) && !settings._reszEvt) {
      var resize = DataTable.util.throttle(function() {
        var newWidth = _fnWrapperWidth(settings);
        if (!settings.bDestroying && newWidth !== 0) {
          _fnAdjustColumnSizing(settings);
        }
      });
      if (window.ResizeObserver) {
        var first = $(settings.nTableWrapper).is(":visible");
        var resizer = $("<div>").css({
          width: "100%",
          height: 0
        }).addClass("dt-autosize").appendTo(settings.nTableWrapper);
        settings.resizeObserver = new ResizeObserver(function(e) {
          if (first) {
            first = false;
          } else {
            resize();
          }
        });
        settings.resizeObserver.observe(resizer[0]);
      } else {
        $(window).on("resize.DT-" + settings.sInstance, resize);
      }
      settings._reszEvt = true;
    }
  }
  function _fnWrapperWidth(settings) {
    return $(settings.nTableWrapper).is(":visible") ? $(settings.nTableWrapper).width() : 0;
  }
  function _fnGetWideStrings(settings, colIdx) {
    var column = settings.aoColumns[colIdx];
    if (!column.wideStrings) {
      var allStrings = [];
      var collection = [];
      for (var i = 0, iLen = settings.aiDisplayMaster.length; i < iLen; i++) {
        var rowIdx = settings.aiDisplayMaster[i];
        var data = _fnGetRowDisplay(settings, rowIdx)[colIdx];
        var cellString = data && typeof data === "object" && data.nodeType ? data.innerHTML : data + "";
        cellString = cellString.replace(/id=".*?"/g, "").replace(/name=".*?"/g, "");
        cellString = cellString.replace(/<script.*?<\/script>/gi, " ");
        var noHtml = _stripHtml(cellString, " ").replace(/&nbsp;/g, " ");
        collection.push({
          str: cellString,
          len: noHtml.length
        });
        allStrings.push(noHtml);
      }
      collection.sort(function(a, b) {
        return b.len - a.len;
      }).splice(3);
      column.wideStrings = collection.map(function(item) {
        return item.str;
      });
      let parts = allStrings.join(" ").split(" ");
      parts.sort(function(a, b) {
        return b.length - a.length;
      });
      if (parts.length) {
        column.wideStrings.push(parts[0]);
      }
      if (parts.length > 1) {
        column.wideStrings.push(parts[1]);
      }
      if (parts.length > 2) {
        column.wideStrings.push(parts[3]);
      }
    }
    return column.wideStrings;
  }
  function _fnStringToCss(s) {
    if (s === null) {
      return "0px";
    }
    if (typeof s == "number") {
      return s < 0 ? "0px" : s + "px";
    }
    return s.match(/\d$/) ? s + "px" : s;
  }
  function _colGroup(settings) {
    var cols = settings.aoColumns;
    settings.colgroup.empty();
    for (i = 0; i < cols.length; i++) {
      if (cols[i].bVisible) {
        settings.colgroup.append(cols[i].colEl);
      }
    }
  }
  function _fnSortInit(settings) {
    var target = settings.nTHead;
    var headerRows = target.querySelectorAll("tr");
    var titleRow = settings.titleRow;
    var notSelector = ':not([data-dt-order="disable"]):not([data-dt-order="icon-only"])';
    if (titleRow === true) {
      target = headerRows[0];
    } else if (titleRow === false) {
      target = headerRows[headerRows.length - 1];
    } else if (titleRow !== null) {
      target = headerRows[titleRow];
    }
    if (settings.orderHandler) {
      _fnSortAttachListener(
        settings,
        target,
        target === settings.nTHead ? "tr" + notSelector + " th" + notSelector + ", tr" + notSelector + " td" + notSelector : "th" + notSelector + ", td" + notSelector
      );
    }
    var order2 = [];
    _fnSortResolve(settings, order2, settings.aaSorting);
    settings.aaSorting = order2;
  }
  function _fnSortAttachListener(settings, node, selector, column, callback) {
    _fnBindAction(node, selector, function(e) {
      var run = false;
      var columns = column === void 0 ? _fnColumnsFromHeader(e.target) : typeof column === "function" ? column() : Array.isArray(column) ? column : [column];
      if (columns.length) {
        for (var i = 0, iLen = columns.length; i < iLen; i++) {
          var ret = _fnSortAdd(settings, columns[i], i, e.shiftKey);
          if (ret !== false) {
            run = true;
          }
          if (settings.aaSorting.length === 1 && settings.aaSorting[0][1] === "") {
            break;
          }
        }
        if (run) {
          _fnProcessingRun(settings, true, function() {
            _fnSort(settings);
            _fnSortDisplay(settings, settings.aiDisplay);
            _fnReDraw(settings, false, false);
            if (callback) {
              callback();
            }
          });
        }
      }
    });
  }
  function _fnSortDisplay(settings, display) {
    if (display.length < 2) {
      return;
    }
    var master = settings.aiDisplayMaster;
    var masterMap = {};
    var map = {};
    var i;
    for (i = 0; i < master.length; i++) {
      masterMap[master[i]] = i;
    }
    for (i = 0; i < display.length; i++) {
      map[display[i]] = masterMap[display[i]];
    }
    display.sort(function(a, b) {
      return map[a] - map[b];
    });
  }
  function _fnSortResolve(settings, nestedSort, sort) {
    var push = function(a) {
      if ($.isPlainObject(a)) {
        if (a.idx !== void 0) {
          nestedSort.push([a.idx, a.dir]);
        } else if (a.name) {
          var cols = _pluck(settings.aoColumns, "sName");
          var idx = cols.indexOf(a.name);
          if (idx !== -1) {
            nestedSort.push([idx, a.dir]);
          }
        }
      } else {
        nestedSort.push(a);
      }
    };
    if ($.isPlainObject(sort)) {
      push(sort);
    } else if (sort.length && typeof sort[0] === "number") {
      push(sort);
    } else if (sort.length) {
      for (var z = 0; z < sort.length; z++) {
        push(sort[z]);
      }
    }
  }
  function _fnSortFlatten(settings) {
    var i, k, kLen, aSort = [], extSort = DataTable.ext.type.order, aoColumns = settings.aoColumns, aDataSort, iCol, sType, srcCol, fixed = settings.aaSortingFixed, fixedObj = $.isPlainObject(fixed), nestedSort = [];
    if (!settings.oFeatures.bSort) {
      return aSort;
    }
    if (Array.isArray(fixed)) {
      _fnSortResolve(settings, nestedSort, fixed);
    }
    if (fixedObj && fixed.pre) {
      _fnSortResolve(settings, nestedSort, fixed.pre);
    }
    _fnSortResolve(settings, nestedSort, settings.aaSorting);
    if (fixedObj && fixed.post) {
      _fnSortResolve(settings, nestedSort, fixed.post);
    }
    for (i = 0; i < nestedSort.length; i++) {
      srcCol = nestedSort[i][0];
      if (aoColumns[srcCol]) {
        aDataSort = aoColumns[srcCol].aDataSort;
        for (k = 0, kLen = aDataSort.length; k < kLen; k++) {
          iCol = aDataSort[k];
          sType = aoColumns[iCol].sType || "string";
          if (nestedSort[i]._idx === void 0) {
            nestedSort[i]._idx = aoColumns[iCol].asSorting.indexOf(nestedSort[i][1]);
          }
          if (nestedSort[i][1]) {
            aSort.push({
              src: srcCol,
              col: iCol,
              dir: nestedSort[i][1],
              index: nestedSort[i]._idx,
              type: sType,
              formatter: extSort[sType + "-pre"],
              sorter: extSort[sType + "-" + nestedSort[i][1]]
            });
          }
        }
      }
    }
    return aSort;
  }
  function _fnSort(oSettings, col, dir) {
    var i, iLen, aiOrig = [], extSort = DataTable.ext.type.order, aoData = oSettings.aoData, sortCol, displayMaster = oSettings.aiDisplayMaster, aSort;
    _fnColumnTypes(oSettings);
    if (col !== void 0) {
      var srcCol = oSettings.aoColumns[col];
      aSort = [{
        src: col,
        col,
        dir,
        index: 0,
        type: srcCol.sType,
        formatter: extSort[srcCol.sType + "-pre"],
        sorter: extSort[srcCol.sType + "-" + dir]
      }];
      displayMaster = displayMaster.slice();
    } else {
      aSort = _fnSortFlatten(oSettings);
    }
    for (i = 0, iLen = aSort.length; i < iLen; i++) {
      sortCol = aSort[i];
      _fnSortData(oSettings, sortCol.col);
    }
    if (_fnDataSource(oSettings) != "ssp" && aSort.length !== 0) {
      for (i = 0, iLen = displayMaster.length; i < iLen; i++) {
        aiOrig[i] = i;
      }
      if (aSort.length && aSort[0].dir === "desc" && oSettings.orderDescReverse) {
        aiOrig.reverse();
      }
      displayMaster.sort(function(a, b) {
        var x, y, k, test, sort, len = aSort.length, dataA = aoData[a]._aSortData, dataB = aoData[b]._aSortData;
        for (k = 0; k < len; k++) {
          sort = aSort[k];
          x = dataA[sort.col];
          y = dataB[sort.col];
          if (sort.sorter) {
            test = sort.sorter(x, y);
            if (test !== 0) {
              return test;
            }
          } else {
            test = x < y ? -1 : x > y ? 1 : 0;
            if (test !== 0) {
              return sort.dir === "asc" ? test : -test;
            }
          }
        }
        x = aiOrig[a];
        y = aiOrig[b];
        return x < y ? -1 : x > y ? 1 : 0;
      });
    } else if (aSort.length === 0) {
      displayMaster.sort(function(x, y) {
        return x < y ? -1 : x > y ? 1 : 0;
      });
    }
    if (col === void 0) {
      oSettings.bSorted = true;
      oSettings.sortDetails = aSort;
      _fnCallbackFire(oSettings, null, "order", [oSettings, aSort]);
    }
    return displayMaster;
  }
  function _fnSortAdd(settings, colIdx, addIndex, shift) {
    var col = settings.aoColumns[colIdx];
    var sorting = settings.aaSorting;
    var asSorting = col.asSorting;
    var nextSortIdx;
    var next = function(a, overflow) {
      var idx = a._idx;
      if (idx === void 0) {
        idx = asSorting.indexOf(a[1]);
      }
      return idx + 1 < asSorting.length ? idx + 1 : overflow ? null : 0;
    };
    if (!col.bSortable) {
      return false;
    }
    if (typeof sorting[0] === "number") {
      sorting = settings.aaSorting = [sorting];
    }
    if ((shift || addIndex) && settings.oFeatures.bSortMulti) {
      var sortIdx = _pluck(sorting, "0").indexOf(colIdx);
      if (sortIdx !== -1) {
        nextSortIdx = next(sorting[sortIdx], true);
        if (nextSortIdx === null && sorting.length === 1) {
          nextSortIdx = 0;
        }
        if (nextSortIdx === null || asSorting[nextSortIdx] === "") {
          sorting.splice(sortIdx, 1);
        } else {
          sorting[sortIdx][1] = asSorting[nextSortIdx];
          sorting[sortIdx]._idx = nextSortIdx;
        }
      } else if (shift) {
        sorting.push([colIdx, asSorting[0], 0]);
        sorting[sorting.length - 1]._idx = 0;
      } else {
        sorting.push([colIdx, sorting[0][1], 0]);
        sorting[sorting.length - 1]._idx = 0;
      }
    } else if (sorting.length && sorting[0][0] == colIdx) {
      nextSortIdx = next(sorting[0]);
      sorting.length = 1;
      sorting[0][1] = asSorting[nextSortIdx];
      sorting[0]._idx = nextSortIdx;
    } else {
      sorting.length = 0;
      sorting.push([colIdx, asSorting[0]]);
      sorting[0]._idx = 0;
    }
  }
  function _fnSortingClasses(settings) {
    var oldSort = settings.aLastSort;
    var sortClass = settings.oClasses.order.position;
    var sort = _fnSortFlatten(settings);
    var features = settings.oFeatures;
    var i, iLen, colIdx;
    if (features.bSort && features.bSortClasses) {
      for (i = 0, iLen = oldSort.length; i < iLen; i++) {
        colIdx = oldSort[i].src;
        $(_pluck(settings.aoData, "anCells", colIdx)).removeClass(sortClass + (i < 2 ? i + 1 : 3));
      }
      for (i = 0, iLen = sort.length; i < iLen; i++) {
        colIdx = sort[i].src;
        $(_pluck(settings.aoData, "anCells", colIdx)).addClass(sortClass + (i < 2 ? i + 1 : 3));
      }
    }
    settings.aLastSort = sort;
  }
  function _fnSortData(settings, colIdx) {
    var column = settings.aoColumns[colIdx];
    var customSort = DataTable.ext.order[column.sSortDataType];
    var customData;
    if (customSort) {
      customData = customSort.call(
        settings.oInstance,
        settings,
        colIdx,
        _fnColumnIndexToVisible(settings, colIdx)
      );
    }
    var row, cellData;
    var formatter = DataTable.ext.type.order[column.sType + "-pre"];
    var data = settings.aoData;
    for (var rowIdx = 0; rowIdx < data.length; rowIdx++) {
      if (!data[rowIdx]) {
        continue;
      }
      row = data[rowIdx];
      if (!row._aSortData) {
        row._aSortData = [];
      }
      if (!row._aSortData[colIdx] || customSort) {
        cellData = customSort ? customData[rowIdx] : (
          // If there was a custom sort function, use data from there
          _fnGetCellData(settings, rowIdx, colIdx, "sort")
        );
        row._aSortData[colIdx] = formatter ? formatter(cellData, settings) : cellData;
      }
    }
  }
  function _fnSaveState(settings) {
    if (settings._bLoadingState) {
      return;
    }
    var sorting = [];
    _fnSortResolve(settings, sorting, settings.aaSorting);
    var columns = settings.aoColumns;
    var state = {
      time: +/* @__PURE__ */ new Date(),
      start: settings._iDisplayStart,
      length: settings._iDisplayLength,
      order: sorting.map(function(sort) {
        return columns[sort[0]] && columns[sort[0]].sName ? [columns[sort[0]].sName, sort[1]] : sort.slice();
      }),
      search: $.extend({}, settings.oPreviousSearch),
      columns: settings.aoColumns.map(function(col, i) {
        return {
          name: col.sName,
          visible: col.bVisible,
          search: $.extend({}, settings.aoPreSearchCols[i])
        };
      })
    };
    settings.oSavedState = state;
    _fnCallbackFire(settings, "aoStateSaveParams", "stateSaveParams", [settings, state]);
    if (settings.oFeatures.bStateSave && !settings.bDestroying) {
      settings.fnStateSaveCallback.call(settings.oInstance, settings, state);
    }
  }
  function _fnLoadState(settings, init3, callback) {
    if (!settings.oFeatures.bStateSave) {
      callback();
      return;
    }
    var loaded = function(state2) {
      _fnImplementState(settings, state2, callback);
    };
    var state = settings.fnStateLoadCallback.call(settings.oInstance, settings, loaded);
    if (state !== void 0) {
      _fnImplementState(settings, state, callback);
    }
    return true;
  }
  function _fnImplementState(settings, s, callback) {
    var i, iLen;
    var columns = settings.aoColumns;
    var currentNames = _pluck(settings.aoColumns, "sName");
    settings._bLoadingState = true;
    var api = settings._bInitComplete ? new DataTable.Api(settings) : null;
    if (!s || !s.time) {
      settings._bLoadingState = false;
      callback();
      return;
    }
    var duration = settings.iStateDuration;
    if (duration > 0 && s.time < +/* @__PURE__ */ new Date() - duration * 1e3) {
      settings._bLoadingState = false;
      callback();
      return;
    }
    var abStateLoad = _fnCallbackFire(settings, "aoStateLoadParams", "stateLoadParams", [settings, s]);
    if (abStateLoad.indexOf(false) !== -1) {
      settings._bLoadingState = false;
      callback();
      return;
    }
    settings.oLoadedState = $.extend(true, {}, s);
    _fnCallbackFire(settings, null, "stateLoadInit", [settings, s], true);
    if (s.length !== void 0) {
      if (api) {
        api.page.len(s.length);
      } else {
        settings._iDisplayLength = s.length;
      }
    }
    if (s.start !== void 0) {
      if (api === null) {
        settings._iDisplayStart = s.start;
        settings.iInitDisplayStart = s.start;
      } else {
        _fnPageChange(settings, s.start / settings._iDisplayLength);
      }
    }
    if (s.order !== void 0) {
      settings.aaSorting = [];
      $.each(s.order, function(i2, col2) {
        var set2 = [col2[0], col2[1]];
        if (typeof col2[0] === "string") {
          var idx2 = currentNames.indexOf(col2[0]);
          if (idx2 < 0) {
            return;
          }
          set2[0] = idx2;
        } else if (set2[0] >= columns.length) {
          return;
        }
        settings.aaSorting.push(set2);
      });
    }
    if (s.search !== void 0) {
      $.extend(settings.oPreviousSearch, s.search);
    }
    if (s.columns) {
      var set = s.columns;
      var incoming = _pluck(s.columns, "name");
      if (incoming.join("").length && incoming.join("") !== currentNames.join("")) {
        set = [];
        for (i = 0; i < currentNames.length; i++) {
          if (currentNames[i] != "") {
            var idx = incoming.indexOf(currentNames[i]);
            if (idx >= 0) {
              set.push(s.columns[idx]);
            } else {
              set.push({});
            }
          } else {
            set.push({});
          }
        }
      }
      if (set.length === columns.length) {
        for (i = 0, iLen = set.length; i < iLen; i++) {
          var col = set[i];
          if (col.visible !== void 0) {
            if (api) {
              api.column(i).visible(col.visible, false);
            } else {
              columns[i].bVisible = col.visible;
            }
          }
          if (col.search !== void 0) {
            $.extend(settings.aoPreSearchCols[i], col.search);
          }
        }
        if (api) {
          api.one("draw", function() {
            api.columns.adjust();
          });
        }
      }
    }
    settings._bLoadingState = false;
    _fnCallbackFire(settings, "aoStateLoaded", "stateLoaded", [settings, s]);
    callback();
  }
  function _fnLog(settings, level, msg, tn) {
    msg = "DataTables warning: " + (settings ? "table id=" + settings.sTableId + " - " : "") + msg;
    if (tn) {
      msg += ". For more information about this error, please see https://datatables.net/tn/" + tn;
    }
    if (!level) {
      var ext = DataTable.ext;
      var type = ext.sErrMode || ext.errMode;
      if (settings) {
        _fnCallbackFire(settings, null, "dt-error", [settings, tn, msg], true);
      }
      if (type == "alert") {
        alert(msg);
      } else if (type == "throw") {
        throw new Error(msg);
      } else if (typeof type == "function") {
        type(settings, tn, msg);
      }
    } else if (window.console && console.log) {
      console.log(msg);
    }
  }
  function _fnMap(ret, src, name, mappedName) {
    if (Array.isArray(name)) {
      $.each(name, function(i, val) {
        if (Array.isArray(val)) {
          _fnMap(ret, src, val[0], val[1]);
        } else {
          _fnMap(ret, src, val);
        }
      });
      return;
    }
    if (mappedName === void 0) {
      mappedName = name;
    }
    if (src[name] !== void 0) {
      ret[mappedName] = src[name];
    }
  }
  function _fnExtend(out, extender, breakRefs) {
    var val;
    for (var prop in extender) {
      if (Object.prototype.hasOwnProperty.call(extender, prop)) {
        val = extender[prop];
        if ($.isPlainObject(val)) {
          if (!$.isPlainObject(out[prop])) {
            out[prop] = {};
          }
          $.extend(true, out[prop], val);
        } else if (breakRefs && prop !== "data" && prop !== "aaData" && Array.isArray(val)) {
          out[prop] = val.slice();
        } else {
          out[prop] = val;
        }
      }
    }
    return out;
  }
  function _fnBindAction(n, selector, fn) {
    $(n).on("click.DT", selector, function(e) {
      fn(e);
    }).on("keypress.DT", selector, function(e) {
      if (e.which === 13) {
        e.preventDefault();
        fn(e);
      }
    }).on("selectstart.DT", selector, function() {
      return false;
    });
  }
  function _fnCallbackReg(settings, store, fn) {
    if (fn) {
      settings[store].push(fn);
    }
  }
  function _fnCallbackFire(settings, callbackArr, eventName, args, bubbles) {
    var ret = [];
    if (callbackArr) {
      ret = settings[callbackArr].slice().reverse().map(function(val) {
        return val.apply(settings.oInstance, args);
      });
    }
    if (eventName !== null) {
      var e = $.Event(eventName + ".dt");
      var table = $(settings.nTable);
      e.dt = settings.api;
      table[bubbles ? "trigger" : "triggerHandler"](e, args);
      if (bubbles && table.parents("body").length === 0) {
        $("body").trigger(e, args);
      }
      ret.push(e.result);
    }
    return ret;
  }
  function _fnLengthOverflow(settings) {
    var start = settings._iDisplayStart, end = settings.fnDisplayEnd(), len = settings._iDisplayLength;
    if (start >= end) {
      start = end - len;
    }
    start -= start % len;
    if (len === -1 || start < 0) {
      start = 0;
    }
    settings._iDisplayStart = start;
  }
  function _fnRenderer(settings, type) {
    var renderer = settings.renderer;
    var host = DataTable.ext.renderer[type];
    if ($.isPlainObject(renderer) && renderer[type]) {
      return host[renderer[type]] || host._;
    } else if (typeof renderer === "string") {
      return host[renderer] || host._;
    }
    return host._;
  }
  function _fnDataSource(settings) {
    if (settings.oFeatures.bServerSide) {
      return "ssp";
    } else if (settings.ajax) {
      return "ajax";
    }
    return "dom";
  }
  function _fnMacros(settings, str, entries) {
    var formatter = settings.fnFormatNumber, start = settings._iDisplayStart + 1, len = settings._iDisplayLength, vis = settings.fnRecordsDisplay(), max = settings.fnRecordsTotal(), all = len === -1;
    return str.replace(/_START_/g, formatter.call(settings, start)).replace(/_END_/g, formatter.call(settings, settings.fnDisplayEnd())).replace(/_MAX_/g, formatter.call(settings, max)).replace(/_TOTAL_/g, formatter.call(settings, vis)).replace(/_PAGE_/g, formatter.call(settings, all ? 1 : Math.ceil(start / len))).replace(/_PAGES_/g, formatter.call(settings, all ? 1 : Math.ceil(vis / len))).replace(/_ENTRIES_/g, settings.api.i18n("entries", "", entries)).replace(/_ENTRIES-MAX_/g, settings.api.i18n("entries", "", max)).replace(/_ENTRIES-TOTAL_/g, settings.api.i18n("entries", "", vis));
  }
  function _fnArrayApply(arr, data) {
    if (!data) {
      return;
    }
    if (data.length < 1e4) {
      arr.push.apply(arr, data);
    } else {
      for (i = 0; i < data.length; i++) {
        arr.push(data[i]);
      }
    }
  }
  function _fnListener(that, name, src) {
    if (!Array.isArray(src)) {
      src = [src];
    }
    for (i = 0; i < src.length; i++) {
      that.on(name + ".dt", src[i]);
    }
  }
  function _fnEscapeObject(obj) {
    if (DataTable.ext.escape.attributes) {
      $.each(obj, function(key, val) {
        obj[key] = _escapeHtml(val);
      });
    }
    return obj;
  }
  var __apiStruct = [];
  var __arrayProto = Array.prototype;
  var _toSettings = function(mixed) {
    var idx, jq;
    var settings = DataTable.settings;
    var tables = _pluck(settings, "nTable");
    if (!mixed) {
      return [];
    } else if (mixed.nTable && mixed.oFeatures) {
      return [mixed];
    } else if (mixed.nodeName && mixed.nodeName.toLowerCase() === "table") {
      idx = tables.indexOf(mixed);
      return idx !== -1 ? [settings[idx]] : null;
    } else if (mixed && typeof mixed.settings === "function") {
      return mixed.settings().toArray();
    } else if (typeof mixed === "string") {
      jq = $(mixed).get();
    } else if (mixed instanceof $) {
      jq = mixed.get();
    }
    if (jq) {
      return settings.filter(function(v, idx2) {
        return jq.includes(tables[idx2]);
      });
    }
  };
  _Api = function(context, data) {
    if (!(this instanceof _Api)) {
      return new _Api(context, data);
    }
    var i;
    var settings = [];
    var ctxSettings = function(o) {
      var a = _toSettings(o);
      if (a) {
        settings.push.apply(settings, a);
      }
    };
    if (Array.isArray(context)) {
      for (i = 0; i < context.length; i++) {
        ctxSettings(context[i]);
      }
    } else {
      ctxSettings(context);
    }
    this.context = settings.length > 1 ? _unique(settings) : settings;
    _fnArrayApply(this, data);
    this.selector = {
      rows: null,
      cols: null,
      opts: null
    };
    _Api.extend(this, this, __apiStruct);
  };
  DataTable.Api = _Api;
  $.extend(_Api.prototype, {
    any: function() {
      return this.count() !== 0;
    },
    context: [],
    // array of table settings objects
    count: function() {
      return this.flatten().length;
    },
    each: function(fn) {
      for (var i = 0, iLen = this.length; i < iLen; i++) {
        fn.call(this, this[i], i, this);
      }
      return this;
    },
    eq: function(idx) {
      var ctx = this.context;
      return ctx.length > idx ? new _Api(ctx[idx], this[idx]) : null;
    },
    filter: function(fn) {
      var a = __arrayProto.filter.call(this, fn, this);
      return new _Api(this.context, a);
    },
    flatten: function() {
      var a = [];
      return new _Api(this.context, a.concat.apply(a, this.toArray()));
    },
    get: function(idx) {
      return this[idx];
    },
    join: __arrayProto.join,
    includes: function(find) {
      return this.indexOf(find) === -1 ? false : true;
    },
    indexOf: __arrayProto.indexOf,
    iterator: function(flatten, type, fn, alwaysNew) {
      var a = [], ret, i, iLen, j, jen, context = this.context, rows, items, item, selector = this.selector;
      if (typeof flatten === "string") {
        alwaysNew = fn;
        fn = type;
        type = flatten;
        flatten = false;
      }
      for (i = 0, iLen = context.length; i < iLen; i++) {
        var apiInst = new _Api(context[i]);
        if (type === "table") {
          ret = fn.call(apiInst, context[i], i);
          if (ret !== void 0) {
            a.push(ret);
          }
        } else if (type === "columns" || type === "rows") {
          ret = fn.call(apiInst, context[i], this[i], i);
          if (ret !== void 0) {
            a.push(ret);
          }
        } else if (type === "every" || type === "column" || type === "column-rows" || type === "row" || type === "cell") {
          items = this[i];
          if (type === "column-rows") {
            rows = _selector_row_indexes(context[i], selector.opts);
          }
          for (j = 0, jen = items.length; j < jen; j++) {
            item = items[j];
            if (type === "cell") {
              ret = fn.call(apiInst, context[i], item.row, item.column, i, j);
            } else {
              ret = fn.call(apiInst, context[i], item, i, j, rows);
            }
            if (ret !== void 0) {
              a.push(ret);
            }
          }
        }
      }
      if (a.length || alwaysNew) {
        var api = new _Api(context, flatten ? a.concat.apply([], a) : a);
        var apiSelector = api.selector;
        apiSelector.rows = selector.rows;
        apiSelector.cols = selector.cols;
        apiSelector.opts = selector.opts;
        return api;
      }
      return this;
    },
    lastIndexOf: __arrayProto.lastIndexOf,
    length: 0,
    map: function(fn) {
      var a = __arrayProto.map.call(this, fn, this);
      return new _Api(this.context, a);
    },
    pluck: function(prop) {
      var fn = DataTable.util.get(prop);
      return this.map(function(el) {
        return fn(el);
      });
    },
    pop: __arrayProto.pop,
    push: __arrayProto.push,
    reduce: __arrayProto.reduce,
    reduceRight: __arrayProto.reduceRight,
    reverse: __arrayProto.reverse,
    // Object with rows, columns and opts
    selector: null,
    shift: __arrayProto.shift,
    slice: function() {
      return new _Api(this.context, this);
    },
    sort: __arrayProto.sort,
    splice: __arrayProto.splice,
    toArray: function() {
      return __arrayProto.slice.call(this);
    },
    to$: function() {
      return $(this);
    },
    toJQuery: function() {
      return $(this);
    },
    unique: function() {
      return new _Api(this.context, _unique(this.toArray()));
    },
    unshift: __arrayProto.unshift
  });
  function _api_scope(scope, fn, struct) {
    return function() {
      var ret = fn.apply(scope || this, arguments);
      _Api.extend(ret, ret, struct.methodExt);
      return ret;
    };
  }
  function _api_find(src, name) {
    for (var i = 0, iLen = src.length; i < iLen; i++) {
      if (src[i].name === name) {
        return src[i];
      }
    }
    return null;
  }
  window.__apiStruct = __apiStruct;
  _Api.extend = function(scope, obj, ext) {
    if (!ext.length || !obj || !(obj instanceof _Api) && !obj.__dt_wrapper) {
      return;
    }
    var i, iLen, struct;
    for (i = 0, iLen = ext.length; i < iLen; i++) {
      struct = ext[i];
      if (struct.name === "__proto__") {
        continue;
      }
      obj[struct.name] = struct.type === "function" ? _api_scope(scope, struct.val, struct) : struct.type === "object" ? {} : struct.val;
      obj[struct.name].__dt_wrapper = true;
      _Api.extend(scope, obj[struct.name], struct.propExt);
    }
  };
  _Api.register = _api_register = function(name, val) {
    if (Array.isArray(name)) {
      for (var j = 0, jen = name.length; j < jen; j++) {
        _Api.register(name[j], val);
      }
      return;
    }
    var i, iLen, heir = name.split("."), struct = __apiStruct, key, method;
    for (i = 0, iLen = heir.length; i < iLen; i++) {
      method = heir[i].indexOf("()") !== -1;
      key = method ? heir[i].replace("()", "") : heir[i];
      var src = _api_find(struct, key);
      if (!src) {
        src = {
          name: key,
          val: {},
          methodExt: [],
          propExt: [],
          type: "object"
        };
        struct.push(src);
      }
      if (i === iLen - 1) {
        src.val = val;
        src.type = typeof val === "function" ? "function" : $.isPlainObject(val) ? "object" : "other";
      } else {
        struct = method ? src.methodExt : src.propExt;
      }
    }
  };
  _Api.registerPlural = _api_registerPlural = function(pluralName, singularName, val) {
    _Api.register(pluralName, val);
    _Api.register(singularName, function() {
      var ret = val.apply(this, arguments);
      if (ret === this) {
        return this;
      } else if (ret instanceof _Api) {
        return ret.length ? Array.isArray(ret[0]) ? new _Api(ret.context, ret[0]) : (
          // Array results are 'enhanced'
          ret[0]
        ) : void 0;
      }
      return ret;
    });
  };
  var __table_selector = function(selector, a) {
    if (Array.isArray(selector)) {
      var result = [];
      selector.forEach(function(sel) {
        var inner = __table_selector(sel, a);
        _fnArrayApply(result, inner);
      });
      return result.filter(function(item) {
        return item;
      });
    }
    if (typeof selector === "number") {
      return [a[selector]];
    }
    var nodes = a.map(function(el) {
      return el.nTable;
    });
    return $(nodes).filter(selector).map(function() {
      var idx = nodes.indexOf(this);
      return a[idx];
    }).toArray();
  };
  _api_register("tables()", function(selector) {
    return selector !== void 0 && selector !== null ? new _Api(__table_selector(selector, this.context)) : this;
  });
  _api_register("table()", function(selector) {
    var tables = this.tables(selector);
    var ctx = tables.context;
    return ctx.length ? new _Api(ctx[0]) : tables;
  });
  [
    ["nodes", "node", "nTable"],
    ["body", "body", "nTBody"],
    ["header", "header", "nTHead"],
    ["footer", "footer", "nTFoot"]
  ].forEach(function(item) {
    _api_registerPlural(
      "tables()." + item[0] + "()",
      "table()." + item[1] + "()",
      function() {
        return this.iterator("table", function(ctx) {
          return ctx[item[2]];
        }, 1);
      }
    );
  });
  [
    ["header", "aoHeader"],
    ["footer", "aoFooter"]
  ].forEach(function(item) {
    _api_register("table()." + item[0] + ".structure()", function(selector) {
      var indexes = this.columns(selector).indexes().flatten().toArray();
      var ctx = this.context[0];
      var structure = _fnHeaderLayout(ctx, ctx[item[1]], indexes);
      var orderedIndexes = indexes.slice().sort(function(a, b) {
        return a - b;
      });
      return structure.map(function(row) {
        return indexes.map(function(colIdx) {
          return row[orderedIndexes.indexOf(colIdx)];
        });
      });
    });
  });
  _api_registerPlural("tables().containers()", "table().container()", function() {
    return this.iterator("table", function(ctx) {
      return ctx.nTableWrapper;
    }, 1);
  });
  _api_register("tables().every()", function(fn) {
    var that = this;
    return this.iterator("table", function(s, i) {
      fn.call(that.table(i), i);
    });
  });
  _api_register("caption()", function(value, side) {
    var context = this.context;
    if (value === void 0) {
      var caption = context[0].captionNode;
      return caption && context.length ? caption.innerHTML : null;
    }
    return this.iterator("table", function(ctx) {
      var table = $(ctx.nTable);
      var caption2 = $(ctx.captionNode);
      var container = $(ctx.nTableWrapper);
      if (!caption2.length) {
        caption2 = $("<caption/>").html(value);
        ctx.captionNode = caption2[0];
        if (!side) {
          table.prepend(caption2);
          side = caption2.css("caption-side");
        }
      }
      caption2.html(value);
      if (side) {
        caption2.css("caption-side", side);
        caption2[0]._captionSide = side;
      }
      if (container.find("div.dataTables_scroll").length) {
        var selector = side === "top" ? "Head" : "Foot";
        container.find("div.dataTables_scroll" + selector + " table").prepend(caption2);
      } else {
        table.prepend(caption2);
      }
    }, 1);
  });
  _api_register("caption.node()", function() {
    var ctx = this.context;
    return ctx.length ? ctx[0].captionNode : null;
  });
  _api_register("draw()", function(paging) {
    return this.iterator("table", function(settings) {
      if (paging === "page") {
        _fnDraw(settings);
      } else {
        if (typeof paging === "string") {
          paging = paging === "full-hold" ? false : true;
        }
        _fnReDraw(settings, paging === false);
      }
    });
  });
  _api_register("page()", function(action) {
    if (action === void 0) {
      return this.page.info().page;
    }
    return this.iterator("table", function(settings) {
      _fnPageChange(settings, action);
    });
  });
  _api_register("page.info()", function() {
    if (this.context.length === 0) {
      return void 0;
    }
    var settings = this.context[0], start = settings._iDisplayStart, len = settings.oFeatures.bPaginate ? settings._iDisplayLength : -1, visRecords = settings.fnRecordsDisplay(), all = len === -1;
    return {
      "page": all ? 0 : Math.floor(start / len),
      "pages": all ? 1 : Math.ceil(visRecords / len),
      "start": start,
      "end": settings.fnDisplayEnd(),
      "length": len,
      "recordsTotal": settings.fnRecordsTotal(),
      "recordsDisplay": visRecords,
      "serverSide": _fnDataSource(settings) === "ssp"
    };
  });
  _api_register("page.len()", function(len) {
    if (len === void 0) {
      return this.context.length !== 0 ? this.context[0]._iDisplayLength : void 0;
    }
    return this.iterator("table", function(settings) {
      _fnLengthChange(settings, len);
    });
  });
  var __reload = function(settings, holdPosition, callback) {
    if (callback) {
      var api = new _Api(settings);
      api.one("draw", function() {
        callback(api.ajax.json());
      });
    }
    if (_fnDataSource(settings) == "ssp") {
      _fnReDraw(settings, holdPosition);
    } else {
      _fnProcessingDisplay(settings, true);
      var xhr = settings.jqXHR;
      if (xhr && xhr.readyState !== 4) {
        xhr.abort();
      }
      _fnBuildAjax(settings, {}, function(json) {
        _fnClearTable(settings);
        var data = _fnAjaxDataSrc(settings, json);
        for (var i = 0, iLen = data.length; i < iLen; i++) {
          _fnAddData(settings, data[i]);
        }
        _fnReDraw(settings, holdPosition);
        _fnInitComplete(settings);
        _fnProcessingDisplay(settings, false);
      });
    }
  };
  _api_register("ajax.json()", function() {
    var ctx = this.context;
    if (ctx.length > 0) {
      return ctx[0].json;
    }
  });
  _api_register("ajax.params()", function() {
    var ctx = this.context;
    if (ctx.length > 0) {
      return ctx[0].oAjaxData;
    }
  });
  _api_register("ajax.reload()", function(callback, resetPaging) {
    return this.iterator("table", function(settings) {
      __reload(settings, resetPaging === false, callback);
    });
  });
  _api_register("ajax.url()", function(url) {
    var ctx = this.context;
    if (url === void 0) {
      if (ctx.length === 0) {
        return void 0;
      }
      ctx = ctx[0];
      return $.isPlainObject(ctx.ajax) ? ctx.ajax.url : ctx.ajax;
    }
    return this.iterator("table", function(settings) {
      if ($.isPlainObject(settings.ajax)) {
        settings.ajax.url = url;
      } else {
        settings.ajax = url;
      }
    });
  });
  _api_register("ajax.url().load()", function(callback, resetPaging) {
    return this.iterator("table", function(ctx) {
      __reload(ctx, resetPaging === false, callback);
    });
  });
  var _selector_run = function(type, selector, selectFn, settings, opts) {
    var out = [], res, i, iLen, selectorType = typeof selector;
    if (!selector || selectorType === "string" || selectorType === "function" || selector.length === void 0) {
      selector = [selector];
    }
    for (i = 0, iLen = selector.length; i < iLen; i++) {
      res = selectFn(typeof selector[i] === "string" ? selector[i].trim() : selector[i]);
      res = res.filter(function(item) {
        return item !== null && item !== void 0;
      });
      if (res && res.length) {
        out = out.concat(res);
      }
    }
    var ext = _ext.selector[type];
    if (ext.length) {
      for (i = 0, iLen = ext.length; i < iLen; i++) {
        out = ext[i](settings, opts, out);
      }
    }
    return _unique(out);
  };
  var _selector_opts = function(opts) {
    if (!opts) {
      opts = {};
    }
    if (opts.filter && opts.search === void 0) {
      opts.search = opts.filter;
    }
    return $.extend({
      columnOrder: "implied",
      search: "none",
      order: "current",
      page: "all"
    }, opts);
  };
  var _selector_first = function(old) {
    var inst = new _Api(old.context[0]);
    if (old.length) {
      inst.push(old[0]);
    }
    inst.selector = old.selector;
    if (inst.length && inst[0].length > 1) {
      inst[0].splice(1);
    }
    return inst;
  };
  var _selector_row_indexes = function(settings, opts) {
    var i, iLen, tmp, a = [], displayFiltered = settings.aiDisplay, displayMaster = settings.aiDisplayMaster;
    var search2 = opts.search, order2 = opts.order, page = opts.page;
    if (_fnDataSource(settings) == "ssp") {
      return search2 === "removed" ? [] : _range(0, displayMaster.length);
    }
    if (page == "current") {
      for (i = settings._iDisplayStart, iLen = settings.fnDisplayEnd(); i < iLen; i++) {
        a.push(displayFiltered[i]);
      }
    } else if (order2 == "current" || order2 == "applied") {
      if (search2 == "none") {
        a = displayMaster.slice();
      } else if (search2 == "applied") {
        a = displayFiltered.slice();
      } else if (search2 == "removed") {
        var displayFilteredMap = {};
        for (i = 0, iLen = displayFiltered.length; i < iLen; i++) {
          displayFilteredMap[displayFiltered[i]] = null;
        }
        displayMaster.forEach(function(item) {
          if (!Object.prototype.hasOwnProperty.call(displayFilteredMap, item)) {
            a.push(item);
          }
        });
      }
    } else if (order2 == "index" || order2 == "original") {
      for (i = 0, iLen = settings.aoData.length; i < iLen; i++) {
        if (!settings.aoData[i]) {
          continue;
        }
        if (search2 == "none") {
          a.push(i);
        } else {
          tmp = displayFiltered.indexOf(i);
          if (tmp === -1 && search2 == "removed" || tmp >= 0 && search2 == "applied") {
            a.push(i);
          }
        }
      }
    } else if (typeof order2 === "number") {
      var ordered = _fnSort(settings, order2, "asc");
      if (search2 === "none") {
        a = ordered;
      } else {
        for (i = 0; i < ordered.length; i++) {
          tmp = displayFiltered.indexOf(ordered[i]);
          if (tmp === -1 && search2 == "removed" || tmp >= 0 && search2 == "applied") {
            a.push(ordered[i]);
          }
        }
      }
    }
    return a;
  };
  var __row_selector = function(settings, selector, opts) {
    var rows;
    var run = function(sel) {
      var selInt = _intVal(sel);
      var aoData = settings.aoData;
      if (selInt !== null && !opts) {
        return [selInt];
      }
      if (!rows) {
        rows = _selector_row_indexes(settings, opts);
      }
      if (selInt !== null && rows.indexOf(selInt) !== -1) {
        return [selInt];
      } else if (sel === null || sel === void 0 || sel === "") {
        return rows;
      }
      if (typeof sel === "function") {
        return rows.map(function(idx) {
          var row = aoData[idx];
          return sel(idx, row._aData, row.nTr) ? idx : null;
        });
      }
      if (sel.nodeName) {
        var rowIdx = sel._DT_RowIndex;
        var cellIdx = sel._DT_CellIndex;
        if (rowIdx !== void 0) {
          return aoData[rowIdx] && aoData[rowIdx].nTr === sel ? [rowIdx] : [];
        } else if (cellIdx) {
          return aoData[cellIdx.row] && aoData[cellIdx.row].nTr === sel.parentNode ? [cellIdx.row] : [];
        } else {
          var host = $(sel).closest("*[data-dt-row]");
          return host.length ? [host.data("dt-row")] : [];
        }
      }
      if (typeof sel === "string" && sel.charAt(0) === "#") {
        var rowObj = settings.aIds[sel.replace(/^#/, "")];
        if (rowObj !== void 0) {
          return [rowObj.idx];
        }
      }
      var nodes = _removeEmpty(
        _pluck_order(settings.aoData, rows, "nTr")
      );
      return $(nodes).filter(sel).map(function() {
        return this._DT_RowIndex;
      }).toArray();
    };
    var matched = _selector_run("row", selector, run, settings, opts);
    if (opts.order === "current" || opts.order === "applied") {
      _fnSortDisplay(settings, matched);
    }
    return matched;
  };
  _api_register("rows()", function(selector, opts) {
    if (selector === void 0) {
      selector = "";
    } else if ($.isPlainObject(selector)) {
      opts = selector;
      selector = "";
    }
    opts = _selector_opts(opts);
    var inst = this.iterator("table", function(settings) {
      return __row_selector(settings, selector, opts);
    }, 1);
    inst.selector.rows = selector;
    inst.selector.opts = opts;
    return inst;
  });
  _api_register("rows().nodes()", function() {
    return this.iterator("row", function(settings, row) {
      return settings.aoData[row].nTr || void 0;
    }, 1);
  });
  _api_register("rows().data()", function() {
    return this.iterator(true, "rows", function(settings, rows) {
      return _pluck_order(settings.aoData, rows, "_aData");
    }, 1);
  });
  _api_registerPlural("rows().cache()", "row().cache()", function(type) {
    return this.iterator("row", function(settings, row) {
      var r = settings.aoData[row];
      return type === "search" ? r._aFilterData : r._aSortData;
    }, 1);
  });
  _api_registerPlural("rows().invalidate()", "row().invalidate()", function(src) {
    return this.iterator("row", function(settings, row) {
      _fnInvalidate(settings, row, src);
    });
  });
  _api_registerPlural("rows().indexes()", "row().index()", function() {
    return this.iterator("row", function(settings, row) {
      return row;
    }, 1);
  });
  _api_registerPlural("rows().ids()", "row().id()", function(hash) {
    var a = [];
    var context = this.context;
    for (var i = 0, iLen = context.length; i < iLen; i++) {
      for (var j = 0, jen = this[i].length; j < jen; j++) {
        var id = context[i].rowIdFn(context[i].aoData[this[i][j]]._aData);
        a.push((hash === true ? "#" : "") + id);
      }
    }
    return new _Api(context, a);
  });
  _api_registerPlural("rows().remove()", "row().remove()", function() {
    this.iterator("row", function(settings, row) {
      var data = settings.aoData;
      var rowData = data[row];
      var idx = settings.aiDisplayMaster.indexOf(row);
      if (idx !== -1) {
        settings.aiDisplayMaster.splice(idx, 1);
      }
      if (settings._iRecordsDisplay > 0) {
        settings._iRecordsDisplay--;
      }
      _fnLengthOverflow(settings);
      var id = settings.rowIdFn(rowData._aData);
      if (id !== void 0) {
        delete settings.aIds[id];
      }
      data[row] = null;
    });
    return this;
  });
  _api_register("rows.add()", function(rows) {
    var newRows = this.iterator("table", function(settings) {
      var row, i, iLen;
      var out = [];
      for (i = 0, iLen = rows.length; i < iLen; i++) {
        row = rows[i];
        if (row.nodeName && row.nodeName.toUpperCase() === "TR") {
          out.push(_fnAddTr(settings, row)[0]);
        } else {
          out.push(_fnAddData(settings, row));
        }
      }
      return out;
    }, 1);
    var modRows = this.rows(-1);
    modRows.pop();
    _fnArrayApply(modRows, newRows);
    return modRows;
  });
  _api_register("row()", function(selector, opts) {
    return _selector_first(this.rows(selector, opts));
  });
  _api_register("row().data()", function(data) {
    var ctx = this.context;
    if (data === void 0) {
      return ctx.length && this.length && this[0].length ? ctx[0].aoData[this[0]]._aData : void 0;
    }
    var row = ctx[0].aoData[this[0]];
    row._aData = data;
    if (Array.isArray(data) && row.nTr && row.nTr.id) {
      _fnSetObjectDataFn(ctx[0].rowId)(data, row.nTr.id);
    }
    _fnInvalidate(ctx[0], this[0], "data");
    return this;
  });
  _api_register("row().node()", function() {
    var ctx = this.context;
    if (ctx.length && this.length && this[0].length) {
      var row = ctx[0].aoData[this[0]];
      if (row && row.nTr) {
        return row.nTr;
      }
    }
    return null;
  });
  _api_register("row.add()", function(row) {
    if (row instanceof $ && row.length) {
      row = row[0];
    }
    var rows = this.iterator("table", function(settings) {
      if (row.nodeName && row.nodeName.toUpperCase() === "TR") {
        return _fnAddTr(settings, row)[0];
      }
      return _fnAddData(settings, row);
    });
    return this.row(rows[0]);
  });
  $(document).on("plugin-init.dt", function(e, context) {
    var api = new _Api(context);
    api.on("stateSaveParams.DT", function(e2, settings, d) {
      var idFn = settings.rowIdFn;
      var rows = settings.aiDisplayMaster;
      var ids = [];
      for (var i = 0; i < rows.length; i++) {
        var rowIdx = rows[i];
        var data = settings.aoData[rowIdx];
        if (data._detailsShow) {
          ids.push("#" + idFn(data._aData));
        }
      }
      d.childRows = ids;
    });
    api.on("stateLoaded.DT", function(e2, settings, state) {
      __details_state_load(api, state);
    });
    __details_state_load(api, api.state.loaded());
  });
  var __details_state_load = function(api, state) {
    if (state && state.childRows) {
      api.rows(state.childRows.map(function(id) {
        return id.replace(/([^:\\]*(?:\\.[^:\\]*)*):/g, "$1\\:");
      })).every(function() {
        _fnCallbackFire(api.settings()[0], null, "requestChild", [this]);
      });
    }
  };
  var __details_add = function(ctx, row, data, klass) {
    var rows = [];
    var addRow = function(r, k) {
      if (Array.isArray(r) || r instanceof $) {
        for (var i = 0, iLen = r.length; i < iLen; i++) {
          addRow(r[i], k);
        }
        return;
      }
      if (r.nodeName && r.nodeName.toLowerCase() === "tr") {
        r.setAttribute("data-dt-row", row.idx);
        rows.push(r);
      } else {
        var created = $("<tr><td></td></tr>").attr("data-dt-row", row.idx).addClass(k);
        $("td", created).addClass(k).html(r)[0].colSpan = _fnVisibleColumns(ctx);
        rows.push(created[0]);
      }
    };
    addRow(data, klass);
    if (row._details) {
      row._details.detach();
    }
    row._details = $(rows);
    if (row._detailsShow) {
      row._details.insertAfter(row.nTr);
    }
  };
  var __details_state = DataTable.util.throttle(
    function(ctx) {
      _fnSaveState(ctx[0]);
    },
    500
  );
  var __details_remove = function(api, idx) {
    var ctx = api.context;
    if (ctx.length) {
      var row = ctx[0].aoData[idx !== void 0 ? idx : api[0]];
      if (row && row._details) {
        row._details.detach();
        row._detailsShow = void 0;
        row._details = void 0;
        $(row.nTr).removeClass("dt-hasChild");
        __details_state(ctx);
      }
    }
  };
  var __details_display = function(api, show) {
    var ctx = api.context;
    if (ctx.length && api.length) {
      var row = ctx[0].aoData[api[0]];
      if (row._details) {
        row._detailsShow = show;
        if (show) {
          row._details.insertAfter(row.nTr);
          $(row.nTr).addClass("dt-hasChild");
        } else {
          row._details.detach();
          $(row.nTr).removeClass("dt-hasChild");
        }
        _fnCallbackFire(ctx[0], null, "childRow", [show, api.row(api[0])]);
        __details_events(ctx[0]);
        __details_state(ctx);
      }
    }
  };
  var __details_events = function(settings) {
    var api = new _Api(settings);
    var namespace = ".dt.DT_details";
    var drawEvent = "draw" + namespace;
    var colvisEvent = "column-sizing" + namespace;
    var destroyEvent = "destroy" + namespace;
    var data = settings.aoData;
    api.off(drawEvent + " " + colvisEvent + " " + destroyEvent);
    if (_pluck(data, "_details").length > 0) {
      api.on(drawEvent, function(e, ctx) {
        if (settings !== ctx) {
          return;
        }
        api.rows({ page: "current" }).eq(0).each(function(idx) {
          var row = data[idx];
          if (row._detailsShow) {
            row._details.insertAfter(row.nTr);
          }
        });
      });
      api.on(colvisEvent, function(e, ctx) {
        if (settings !== ctx) {
          return;
        }
        var row, visible = _fnVisibleColumns(ctx);
        for (var i = 0, iLen = data.length; i < iLen; i++) {
          row = data[i];
          if (row && row._details) {
            row._details.each(function() {
              var el = $(this).children("td");
              if (el.length == 1) {
                el.attr("colspan", visible);
              }
            });
          }
        }
      });
      api.on(destroyEvent, function(e, ctx) {
        if (settings !== ctx) {
          return;
        }
        for (var i = 0, iLen = data.length; i < iLen; i++) {
          if (data[i] && data[i]._details) {
            __details_remove(api, i);
          }
        }
      });
    }
  };
  var _emp = "";
  var _child_obj = _emp + "row().child";
  var _child_mth = _child_obj + "()";
  _api_register(_child_mth, function(data, klass) {
    var ctx = this.context;
    if (data === void 0) {
      return ctx.length && this.length && ctx[0].aoData[this[0]] ? ctx[0].aoData[this[0]]._details : void 0;
    } else if (data === true) {
      this.child.show();
    } else if (data === false) {
      __details_remove(this);
    } else if (ctx.length && this.length) {
      __details_add(ctx[0], ctx[0].aoData[this[0]], data, klass);
    }
    return this;
  });
  _api_register([
    _child_obj + ".show()",
    _child_mth + ".show()"
    // only when `child()` was called with parameters (without
  ], function() {
    __details_display(this, true);
    return this;
  });
  _api_register([
    _child_obj + ".hide()",
    _child_mth + ".hide()"
    // only when `child()` was called with parameters (without
  ], function() {
    __details_display(this, false);
    return this;
  });
  _api_register([
    _child_obj + ".remove()",
    _child_mth + ".remove()"
    // only when `child()` was called with parameters (without
  ], function() {
    __details_remove(this);
    return this;
  });
  _api_register(_child_obj + ".isShown()", function() {
    var ctx = this.context;
    if (ctx.length && this.length && ctx[0].aoData[this[0]]) {
      return ctx[0].aoData[this[0]]._detailsShow || false;
    }
    return false;
  });
  var __re_column_selector = /^([^:]+)?:(name|title|visIdx|visible)$/;
  var __columnData = function(settings, column, r1, r2, rows, type) {
    var a = [];
    for (var row = 0, iLen = rows.length; row < iLen; row++) {
      a.push(_fnGetCellData(settings, rows[row], column, type));
    }
    return a;
  };
  var __column_header = function(settings, column, row) {
    var header = settings.aoHeader;
    var titleRow = settings.titleRow;
    var target = null;
    if (row !== void 0) {
      target = row;
    } else if (titleRow === true) {
      target = 0;
    } else if (titleRow === false) {
      target = header.length - 1;
    } else if (titleRow !== null) {
      target = titleRow;
    } else {
      for (var i = 0; i < header.length; i++) {
        if (header[i][column].unique && $(".dt-column-title", header[i][column].cell).text()) {
          target = i;
        }
      }
      if (target === null) {
        target = 0;
      }
    }
    return header[target][column].cell;
  };
  var __column_header_cells = function(header) {
    var out = [];
    for (var i = 0; i < header.length; i++) {
      for (var j = 0; j < header[i].length; j++) {
        var cell = header[i][j].cell;
        if (!out.includes(cell)) {
          out.push(cell);
        }
      }
    }
    return out;
  };
  var __column_selector = function(settings, selector, opts) {
    var columns = settings.aoColumns, names, titles, nodes = __column_header_cells(settings.aoHeader);
    var run = function(s) {
      var selInt = _intVal(s);
      if (s === "") {
        return _range(columns.length);
      }
      if (selInt !== null) {
        return [
          selInt >= 0 ? selInt : (
            // Count from left
            columns.length + selInt
          )
          // Count from right (+ because its a negative value)
        ];
      }
      if (typeof s === "function") {
        var rows = _selector_row_indexes(settings, opts);
        return columns.map(function(col, idx2) {
          return s(
            idx2,
            __columnData(settings, idx2, 0, 0, rows),
            __column_header(settings, idx2)
          ) ? idx2 : null;
        });
      }
      var match = typeof s === "string" ? s.match(__re_column_selector) : "";
      if (match) {
        switch (match[2]) {
          case "visIdx":
          case "visible":
            if (match[1] && match[1].match(/^\d+$/)) {
              var idx = parseInt(match[1], 10);
              if (idx < 0) {
                var visColumns = columns.map(function(col, i) {
                  return col.bVisible ? i : null;
                });
                return [visColumns[visColumns.length + idx]];
              }
              return [_fnVisibleToColumnIndex(settings, idx)];
            }
            return columns.map(function(col, idx2) {
              if (!col.bVisible) {
                return null;
              }
              if (col.responsiveVisible === false) {
                return null;
              }
              if (match[1]) {
                return $(nodes[idx2]).filter(match[1]).length > 0 ? idx2 : null;
              }
              return idx2;
            });
          case "name":
            if (!names) {
              names = _pluck(columns, "sName");
            }
            return names.map(function(name, i) {
              return name === match[1] ? i : null;
            });
          case "title":
            if (!titles) {
              titles = _pluck(columns, "sTitle");
            }
            return titles.map(function(title2, i) {
              return title2 === match[1] ? i : null;
            });
          default:
            return [];
        }
      }
      if (s.nodeName && s._DT_CellIndex) {
        return [s._DT_CellIndex.column];
      }
      var jqResult = $(nodes).filter(s).map(function() {
        return _fnColumnsFromHeader(this);
      }).toArray().sort(function(a, b) {
        return a - b;
      });
      if (jqResult.length || !s.nodeName) {
        return jqResult;
      }
      var host = $(s).closest("*[data-dt-column]");
      return host.length ? [host.data("dt-column")] : [];
    };
    var selected = _selector_run("column", selector, run, settings, opts);
    return opts.columnOrder && opts.columnOrder === "index" ? selected.sort(function(a, b) {
      return a - b;
    }) : selected;
  };
  var __setColumnVis = function(settings, column, vis) {
    var cols = settings.aoColumns, col = cols[column], data = settings.aoData, cells, i, iLen, tr;
    if (vis === void 0) {
      return col.bVisible;
    }
    if (col.bVisible === vis) {
      return false;
    }
    if (vis) {
      var insertBefore = _pluck(cols, "bVisible").indexOf(true, column + 1);
      for (i = 0, iLen = data.length; i < iLen; i++) {
        if (data[i]) {
          tr = data[i].nTr;
          cells = data[i].anCells;
          if (tr) {
            tr.insertBefore(cells[column], cells[insertBefore] || null);
          }
        }
      }
    } else {
      $(_pluck(settings.aoData, "anCells", column)).detach();
    }
    col.bVisible = vis;
    _colGroup(settings);
    return true;
  };
  _api_register("columns()", function(selector, opts) {
    if (selector === void 0) {
      selector = "";
    } else if ($.isPlainObject(selector)) {
      opts = selector;
      selector = "";
    }
    opts = _selector_opts(opts);
    var inst = this.iterator("table", function(settings) {
      return __column_selector(settings, selector, opts);
    }, 1);
    inst.selector.cols = selector;
    inst.selector.opts = opts;
    return inst;
  });
  _api_registerPlural("columns().header()", "column().header()", function(row) {
    return this.iterator("column", function(settings, column) {
      return __column_header(settings, column, row);
    }, 1);
  });
  _api_registerPlural("columns().footer()", "column().footer()", function(row) {
    return this.iterator("column", function(settings, column) {
      var footer = settings.aoFooter;
      if (!footer.length) {
        return null;
      }
      return settings.aoFooter[row !== void 0 ? row : 0][column].cell;
    }, 1);
  });
  _api_registerPlural("columns().data()", "column().data()", function() {
    return this.iterator("column-rows", __columnData, 1);
  });
  _api_registerPlural("columns().render()", "column().render()", function(type) {
    return this.iterator("column-rows", function(settings, column, i, j, rows) {
      return __columnData(settings, column, i, j, rows, type);
    }, 1);
  });
  _api_registerPlural("columns().dataSrc()", "column().dataSrc()", function() {
    return this.iterator("column", function(settings, column) {
      return settings.aoColumns[column].mData;
    }, 1);
  });
  _api_registerPlural("columns().cache()", "column().cache()", function(type) {
    return this.iterator("column-rows", function(settings, column, i, j, rows) {
      return _pluck_order(
        settings.aoData,
        rows,
        type === "search" ? "_aFilterData" : "_aSortData",
        column
      );
    }, 1);
  });
  _api_registerPlural("columns().init()", "column().init()", function() {
    return this.iterator("column", function(settings, column) {
      return settings.aoColumns[column];
    }, 1);
  });
  _api_registerPlural("columns().names()", "column().name()", function() {
    return this.iterator("column", function(settings, column) {
      return settings.aoColumns[column].sName;
    }, 1);
  });
  _api_registerPlural("columns().nodes()", "column().nodes()", function() {
    return this.iterator("column-rows", function(settings, column, i, j, rows) {
      return _pluck_order(settings.aoData, rows, "anCells", column);
    }, 1);
  });
  _api_registerPlural("columns().titles()", "column().title()", function(title2, row) {
    return this.iterator("column", function(settings, column) {
      if (typeof title2 === "number") {
        row = title2;
        title2 = void 0;
      }
      var span = $(".dt-column-title", this.column(column).header(row));
      if (title2 !== void 0) {
        span.html(title2);
        return this;
      }
      return span.html();
    }, 1);
  });
  _api_registerPlural("columns().types()", "column().type()", function() {
    return this.iterator("column", function(settings, column) {
      var colObj = settings.aoColumns[column];
      var type = colObj.sType;
      if (!type) {
        _fnColumnTypes(settings);
        type = colObj.sType;
      }
      return type;
    }, 1);
  });
  _api_registerPlural("columns().visible()", "column().visible()", function(vis, calc) {
    var that = this;
    var changed = [];
    var ret = this.iterator("column", function(settings, column) {
      if (vis === void 0) {
        return settings.aoColumns[column].bVisible;
      }
      if (__setColumnVis(settings, column, vis)) {
        changed.push(column);
      }
    });
    if (vis !== void 0) {
      this.iterator("table", function(settings) {
        _fnDrawHead(settings, settings.aoHeader);
        _fnDrawHead(settings, settings.aoFooter);
        if (!settings.aiDisplay.length) {
          $(settings.nTBody).find("td[colspan]").attr("colspan", _fnVisibleColumns(settings));
        }
        _fnSaveState(settings);
        that.iterator("column", function(settings2, column) {
          if (changed.includes(column)) {
            _fnCallbackFire(settings2, null, "column-visibility", [settings2, column, vis, calc]);
          }
        });
        if (changed.length && (calc === void 0 || calc)) {
          that.columns.adjust();
        }
      });
    }
    return ret;
  });
  _api_registerPlural("columns().widths()", "column().width()", function() {
    var columns = this.columns(":visible").count();
    var row = $("<tr>").html("<td>" + Array(columns).join("</td><td>") + "</td>");
    $(this.table().body()).append(row);
    var widths = row.children().map(function() {
      return $(this).outerWidth();
    });
    row.remove();
    return this.iterator("column", function(settings, column) {
      var visIdx = _fnColumnIndexToVisible(settings, column);
      return visIdx !== null ? widths[visIdx] : 0;
    }, 1);
  });
  _api_registerPlural("columns().indexes()", "column().index()", function(type) {
    return this.iterator("column", function(settings, column) {
      return type === "visible" ? _fnColumnIndexToVisible(settings, column) : column;
    }, 1);
  });
  _api_register("columns.adjust()", function() {
    return this.iterator("table", function(settings) {
      settings.containerWidth = -1;
      _fnAdjustColumnSizing(settings);
    }, 1);
  });
  _api_register("column.index()", function(type, idx) {
    if (this.context.length !== 0) {
      var ctx = this.context[0];
      if (type === "fromVisible" || type === "toData") {
        return _fnVisibleToColumnIndex(ctx, idx);
      } else if (type === "fromData" || type === "toVisible") {
        return _fnColumnIndexToVisible(ctx, idx);
      }
    }
  });
  _api_register("column()", function(selector, opts) {
    return _selector_first(this.columns(selector, opts));
  });
  var __cell_selector = function(settings, selector, opts) {
    var data = settings.aoData;
    var rows = _selector_row_indexes(settings, opts);
    var cells = _removeEmpty(_pluck_order(data, rows, "anCells"));
    var allCells = $(_flatten([], cells));
    var row;
    var columns = settings.aoColumns.length;
    var a, i, iLen, j, o, host;
    var run = function(s) {
      var fnSelector = typeof s === "function";
      if (s === null || s === void 0 || fnSelector) {
        a = [];
        for (i = 0, iLen = rows.length; i < iLen; i++) {
          row = rows[i];
          for (j = 0; j < columns; j++) {
            o = {
              row,
              column: j
            };
            if (fnSelector) {
              host = data[row];
              if (s(o, _fnGetCellData(settings, row, j), host.anCells ? host.anCells[j] : null)) {
                a.push(o);
              }
            } else {
              a.push(o);
            }
          }
        }
        return a;
      }
      if ($.isPlainObject(s)) {
        return s.column !== void 0 && s.row !== void 0 && rows.indexOf(s.row) !== -1 ? [s] : [];
      }
      var jqResult = allCells.filter(s).map(function(i2, el) {
        return {
          // use a new object, in case someone changes the values
          row: el._DT_CellIndex.row,
          column: el._DT_CellIndex.column
        };
      }).toArray();
      if (jqResult.length || !s.nodeName) {
        return jqResult;
      }
      host = $(s).closest("*[data-dt-row]");
      return host.length ? [{
        row: host.data("dt-row"),
        column: host.data("dt-column")
      }] : [];
    };
    return _selector_run("cell", selector, run, settings, opts);
  };
  _api_register("cells()", function(rowSelector, columnSelector, opts) {
    if ($.isPlainObject(rowSelector)) {
      if (rowSelector.row === void 0) {
        opts = rowSelector;
        rowSelector = null;
      } else {
        opts = columnSelector;
        columnSelector = null;
      }
    }
    if ($.isPlainObject(columnSelector)) {
      opts = columnSelector;
      columnSelector = null;
    }
    if (columnSelector === null || columnSelector === void 0) {
      return this.iterator("table", function(settings) {
        return __cell_selector(settings, rowSelector, _selector_opts(opts));
      });
    }
    var internalOpts = opts ? {
      page: opts.page,
      order: opts.order,
      search: opts.search
    } : {};
    var columns = this.columns(columnSelector, internalOpts);
    var rows = this.rows(rowSelector, internalOpts);
    var i, iLen, j, jen;
    var cellsNoOpts = this.iterator("table", function(settings, idx) {
      var a = [];
      for (i = 0, iLen = rows[idx].length; i < iLen; i++) {
        for (j = 0, jen = columns[idx].length; j < jen; j++) {
          a.push({
            row: rows[idx][i],
            column: columns[idx][j]
          });
        }
      }
      return a;
    }, 1);
    var cells = opts && opts.selected ? this.cells(cellsNoOpts, opts) : cellsNoOpts;
    $.extend(cells.selector, {
      cols: columnSelector,
      rows: rowSelector,
      opts
    });
    return cells;
  });
  _api_registerPlural("cells().nodes()", "cell().node()", function() {
    return this.iterator("cell", function(settings, row, column) {
      var data = settings.aoData[row];
      return data && data.anCells ? data.anCells[column] : void 0;
    }, 1);
  });
  _api_register("cells().data()", function() {
    return this.iterator("cell", function(settings, row, column) {
      return _fnGetCellData(settings, row, column);
    }, 1);
  });
  _api_registerPlural("cells().cache()", "cell().cache()", function(type) {
    type = type === "search" ? "_aFilterData" : "_aSortData";
    return this.iterator("cell", function(settings, row, column) {
      return settings.aoData[row][type][column];
    }, 1);
  });
  _api_registerPlural("cells().render()", "cell().render()", function(type) {
    return this.iterator("cell", function(settings, row, column) {
      return _fnGetCellData(settings, row, column, type);
    }, 1);
  });
  _api_registerPlural("cells().indexes()", "cell().index()", function() {
    return this.iterator("cell", function(settings, row, column) {
      return {
        row,
        column,
        columnVisible: _fnColumnIndexToVisible(settings, column)
      };
    }, 1);
  });
  _api_registerPlural("cells().invalidate()", "cell().invalidate()", function(src) {
    return this.iterator("cell", function(settings, row, column) {
      _fnInvalidate(settings, row, src, column);
    });
  });
  _api_register("cell()", function(rowSelector, columnSelector, opts) {
    return _selector_first(this.cells(rowSelector, columnSelector, opts));
  });
  _api_register("cell().data()", function(data) {
    var ctx = this.context;
    var cell = this[0];
    if (data === void 0) {
      return ctx.length && cell.length ? _fnGetCellData(ctx[0], cell[0].row, cell[0].column) : void 0;
    }
    _fnSetCellData(ctx[0], cell[0].row, cell[0].column, data);
    _fnInvalidate(ctx[0], cell[0].row, "data", cell[0].column);
    return this;
  });
  _api_register("order()", function(order2, dir) {
    var ctx = this.context;
    var args = Array.prototype.slice.call(arguments);
    if (order2 === void 0) {
      return ctx.length !== 0 ? ctx[0].aaSorting : void 0;
    }
    if (typeof order2 === "number") {
      order2 = [[order2, dir]];
    } else if (args.length > 1) {
      order2 = args;
    }
    return this.iterator("table", function(settings) {
      var resolved = [];
      _fnSortResolve(settings, resolved, order2);
      settings.aaSorting = resolved;
    });
  });
  _api_register("order.listener()", function(node, column, callback) {
    return this.iterator("table", function(settings) {
      _fnSortAttachListener(settings, node, {}, column, callback);
    });
  });
  _api_register("order.fixed()", function(set) {
    if (!set) {
      var ctx = this.context;
      var fixed = ctx.length ? ctx[0].aaSortingFixed : void 0;
      return Array.isArray(fixed) ? { pre: fixed } : fixed;
    }
    return this.iterator("table", function(settings) {
      settings.aaSortingFixed = $.extend(true, {}, set);
    });
  });
  _api_register([
    "columns().order()",
    "column().order()"
  ], function(dir) {
    var that = this;
    if (!dir) {
      return this.iterator("column", function(settings, idx) {
        var sort = _fnSortFlatten(settings);
        for (var i = 0, iLen = sort.length; i < iLen; i++) {
          if (sort[i].col === idx) {
            return sort[i].dir;
          }
        }
        return null;
      }, 1);
    } else {
      return this.iterator("table", function(settings, i) {
        settings.aaSorting = that[i].map(function(col) {
          return [col, dir];
        });
      });
    }
  });
  _api_registerPlural("columns().orderable()", "column().orderable()", function(directions) {
    return this.iterator("column", function(settings, idx) {
      var col = settings.aoColumns[idx];
      return directions ? col.asSorting : col.bSortable;
    }, 1);
  });
  _api_register("processing()", function(show) {
    return this.iterator("table", function(ctx) {
      _fnProcessingDisplay(ctx, show);
    });
  });
  _api_register("search()", function(input, regex, smart, caseInsen) {
    var ctx = this.context;
    if (input === void 0) {
      return ctx.length !== 0 ? ctx[0].oPreviousSearch.search : void 0;
    }
    return this.iterator("table", function(settings) {
      if (!settings.oFeatures.bFilter) {
        return;
      }
      if (typeof regex === "object") {
        _fnFilterComplete(settings, $.extend(settings.oPreviousSearch, regex, {
          search: input
        }));
      } else {
        _fnFilterComplete(settings, $.extend(settings.oPreviousSearch, {
          search: input,
          regex: regex === null ? false : regex,
          smart: smart === null ? true : smart,
          caseInsensitive: caseInsen === null ? true : caseInsen
        }));
      }
    });
  });
  _api_register("search.fixed()", function(name, search2) {
    var ret = this.iterator(true, "table", function(settings) {
      var fixed = settings.searchFixed;
      if (!name) {
        return Object.keys(fixed);
      } else if (search2 === void 0) {
        return fixed[name];
      } else if (search2 === null) {
        delete fixed[name];
      } else {
        fixed[name] = search2;
      }
      return this;
    });
    return name !== void 0 && search2 === void 0 ? ret[0] : ret;
  });
  _api_registerPlural(
    "columns().search()",
    "column().search()",
    function(input, regex, smart, caseInsen) {
      return this.iterator("column", function(settings, column) {
        var preSearch = settings.aoPreSearchCols;
        if (input === void 0) {
          return preSearch[column].search;
        }
        if (!settings.oFeatures.bFilter) {
          return;
        }
        if (typeof regex === "object") {
          $.extend(preSearch[column], regex, {
            search: input
          });
        } else {
          $.extend(preSearch[column], {
            search: input,
            regex: regex === null ? false : regex,
            smart: smart === null ? true : smart,
            caseInsensitive: caseInsen === null ? true : caseInsen
          });
        }
        _fnFilterComplete(settings, settings.oPreviousSearch);
      });
    }
  );
  _api_register(
    [
      "columns().search.fixed()",
      "column().search.fixed()"
    ],
    function(name, search2) {
      var ret = this.iterator(true, "column", function(settings, colIdx) {
        var fixed = settings.aoColumns[colIdx].searchFixed;
        if (!name) {
          return Object.keys(fixed);
        } else if (search2 === void 0) {
          return fixed[name] || null;
        } else if (search2 === null) {
          delete fixed[name];
        } else {
          fixed[name] = search2;
        }
        return this;
      });
      return name !== void 0 && search2 === void 0 ? ret[0] : ret;
    }
  );
  _api_register("state()", function(set, ignoreTime) {
    if (!set) {
      return this.context.length ? this.context[0].oSavedState : null;
    }
    var setMutate = $.extend(true, {}, set);
    return this.iterator("table", function(settings) {
      if (ignoreTime !== false) {
        setMutate.time = +/* @__PURE__ */ new Date() + 100;
      }
      _fnImplementState(settings, setMutate, function() {
      });
    });
  });
  _api_register("state.clear()", function() {
    return this.iterator("table", function(settings) {
      settings.fnStateSaveCallback.call(settings.oInstance, settings, {});
    });
  });
  _api_register("state.loaded()", function() {
    return this.context.length ? this.context[0].oLoadedState : null;
  });
  _api_register("state.save()", function() {
    return this.iterator("table", function(settings) {
      _fnSaveState(settings);
    });
  });
  var __bootstrap;
  var __foundation;
  DataTable.use = function(arg1, arg2) {
    var module = typeof arg1 === "string" ? arg2 : arg1;
    var type = typeof arg2 === "string" ? arg2 : arg1;
    if (module === void 0 && typeof type === "string") {
      switch (type) {
        case "lib":
        case "jq":
          return $;
        case "win":
          return window;
        case "datetime":
          return DataTable.DateTime;
        case "luxon":
          return __luxon;
        case "moment":
          return __moment;
        case "bootstrap":
          return __bootstrap || window.bootstrap;
        case "foundation":
          return __foundation || window.Foundation;
        default:
          return null;
      }
    }
    if (type === "lib" || type === "jq" || module && module.fn && module.fn.jquery) {
      $ = module;
    } else if (type === "win" || module && module.document) {
      window = module;
      document = module.document;
    } else if (type === "datetime" || module && module.type === "DateTime") {
      DataTable.DateTime = module;
    } else if (type === "luxon" || module && module.FixedOffsetZone) {
      __luxon = module;
    } else if (type === "moment" || module && module.isMoment) {
      __moment = module;
    } else if (type === "bootstrap" || module && module.Modal && module.Modal.NAME === "modal") {
      __bootstrap = module;
    } else if (type === "foundation" || module && module.Reveal) {
      __foundation = module;
    }
  };
  DataTable.factory = function(root, jq) {
    var is = false;
    if (root && root.document) {
      window = root;
      document = root.document;
    }
    if (jq && jq.fn && jq.fn.jquery) {
      $ = jq;
      is = true;
    }
    return is;
  };
  DataTable.versionCheck = function(version, version2) {
    var aThis = version2 ? version2.split(".") : DataTable.version.split(".");
    var aThat = version.split(".");
    var iThis, iThat;
    for (var i = 0, iLen = aThat.length; i < iLen; i++) {
      iThis = parseInt(aThis[i], 10) || 0;
      iThat = parseInt(aThat[i], 10) || 0;
      if (iThis === iThat) {
        continue;
      }
      return iThis > iThat;
    }
    return true;
  };
  DataTable.isDataTable = function(table) {
    var t = $(table).get(0);
    var is = false;
    if (table instanceof DataTable.Api) {
      return true;
    }
    $.each(DataTable.settings, function(i, o) {
      var head = o.nScrollHead ? $("table", o.nScrollHead)[0] : null;
      var foot = o.nScrollFoot ? $("table", o.nScrollFoot)[0] : null;
      if (o.nTable === t || head === t || foot === t) {
        is = true;
      }
    });
    return is;
  };
  DataTable.tables = function(visible) {
    var api = false;
    if ($.isPlainObject(visible)) {
      api = visible.api;
      visible = visible.visible;
    }
    var a = DataTable.settings.filter(function(o) {
      return !visible || visible && $(o.nTable).is(":visible") ? true : false;
    }).map(function(o) {
      return o.nTable;
    });
    return api ? new _Api(a) : a;
  };
  DataTable.camelToHungarian = _fnCamelToHungarian;
  _api_register("$()", function(selector, opts) {
    var rows = this.rows(opts).nodes(), jqRows = $(rows);
    return $([].concat(
      jqRows.filter(selector).toArray(),
      jqRows.find(selector).toArray()
    ));
  });
  $.each(["on", "one", "off"], function(i, key) {
    _api_register(key + "()", function() {
      var args = Array.prototype.slice.call(arguments);
      args[0] = args[0].split(/\s/).map(function(e) {
        return !e.match(/\.dt\b/) ? e + ".dt" : e;
      }).join(" ");
      var inst = $(this.tables().nodes());
      inst[key].apply(inst, args);
      return this;
    });
  });
  _api_register("clear()", function() {
    return this.iterator("table", function(settings) {
      _fnClearTable(settings);
    });
  });
  _api_register("error()", function(msg) {
    return this.iterator("table", function(settings) {
      _fnLog(settings, 0, msg);
    });
  });
  _api_register("settings()", function() {
    return new _Api(this.context, this.context);
  });
  _api_register("init()", function() {
    var ctx = this.context;
    return ctx.length ? ctx[0].oInit : null;
  });
  _api_register("data()", function() {
    return this.iterator("table", function(settings) {
      return _pluck(settings.aoData, "_aData");
    }).flatten();
  });
  _api_register("trigger()", function(name, args, bubbles) {
    return this.iterator("table", function(settings) {
      return _fnCallbackFire(settings, null, name, args, bubbles);
    }).flatten();
  });
  _api_register("ready()", function(fn) {
    var ctx = this.context;
    if (!fn) {
      return ctx.length ? ctx[0]._bInitComplete || false : null;
    }
    return this.tables().every(function() {
      var api = this;
      if (this.context[0]._bInitComplete) {
        fn.call(api);
      } else {
        this.on("init.dt.DT", function() {
          fn.call(api);
        });
      }
    });
  });
  _api_register("destroy()", function(remove) {
    remove = remove || false;
    return this.iterator("table", function(settings) {
      var classes = settings.oClasses;
      var table = settings.nTable;
      var tbody = settings.nTBody;
      var thead = settings.nTHead;
      var tfoot = settings.nTFoot;
      var jqTable = $(table);
      var jqTbody = $(tbody);
      var jqWrapper = $(settings.nTableWrapper);
      var rows = settings.aoData.map(function(r) {
        return r ? r.nTr : null;
      });
      var orderClasses = classes.order;
      settings.bDestroying = true;
      _fnCallbackFire(settings, "aoDestroyCallback", "destroy", [settings], true);
      if (!remove) {
        new _Api(settings).columns().visible(true);
      }
      if (settings.resizeObserver) {
        settings.resizeObserver.disconnect();
      }
      jqWrapper.off(".DT").find(":not(tbody *)").off(".DT");
      $(window).off(".DT-" + settings.sInstance);
      if (table != thead.parentNode) {
        jqTable.children("thead").detach();
        jqTable.append(thead);
      }
      if (tfoot && table != tfoot.parentNode) {
        jqTable.children("tfoot").detach();
        jqTable.append(tfoot);
      }
      cleanHeader(thead, "header");
      cleanHeader(tfoot, "footer");
      settings.colgroup.remove();
      settings.aaSorting = [];
      settings.aaSortingFixed = [];
      _fnSortingClasses(settings);
      $(jqTable).find("th, td").removeClass(
        $.map(DataTable.ext.type.className, function(v) {
          return v;
        }).join(" ")
      );
      $("th, td", thead).removeClass(
        orderClasses.none + " " + orderClasses.canAsc + " " + orderClasses.canDesc + " " + orderClasses.isAsc + " " + orderClasses.isDesc
      ).css("width", "").removeAttr("aria-sort");
      jqTbody.children().detach();
      jqTbody.append(rows);
      var orig = settings.nTableWrapper.parentNode;
      var insertBefore = settings.nTableWrapper.nextSibling;
      var removedMethod = remove ? "remove" : "detach";
      jqTable[removedMethod]();
      jqWrapper[removedMethod]();
      if (!remove && orig) {
        orig.insertBefore(table, insertBefore);
        jqTable.css("width", settings.sDestroyWidth).removeClass(classes.table);
      }
      var idx = DataTable.settings.indexOf(settings);
      if (idx !== -1) {
        DataTable.settings.splice(idx, 1);
      }
    });
  });
  $.each(["column", "row", "cell"], function(i, type) {
    _api_register(type + "s().every()", function(fn) {
      var opts = this.selector.opts;
      var api = this;
      var inst;
      var counter = 0;
      return this.iterator("every", function(settings, selectedIdx, tableIdx) {
        inst = api[type](selectedIdx, opts);
        if (type === "cell") {
          fn.call(inst, inst[0][0].row, inst[0][0].column, tableIdx, counter);
        } else {
          fn.call(inst, selectedIdx, tableIdx, counter);
        }
        counter++;
      });
    });
  });
  _api_register("i18n()", function(token, def, plural) {
    var ctx = this.context[0];
    var resolved = _fnGetObjectDataFn(token)(ctx.oLanguage);
    if (resolved === void 0) {
      resolved = def;
    }
    if ($.isPlainObject(resolved)) {
      resolved = plural !== void 0 && resolved[plural] !== void 0 ? resolved[plural] : plural === false ? resolved : resolved._;
    }
    return typeof resolved === "string" ? resolved.replace("%d", plural) : resolved;
  });
  function cleanHeader(node, className) {
    $(node).find(".dt-column-order").remove();
    $(node).find(".dt-column-title").each(function() {
      var title2 = $(this).html();
      $(this).parent().parent().append(title2);
      $(this).remove();
    });
    $(node).find("div.dt-column-" + className).remove();
    $("th, td", node).removeAttr("data-dt-column");
  }
  DataTable.version = "2.3.7";
  DataTable.settings = [];
  DataTable.models = {};
  DataTable.models.oSearch = {
    /**
     * Flag to whether or not the filtering should be case-insensitive
     */
    "caseInsensitive": true,
    /**
     * Applied search term
     */
    "search": "",
    /**
     * Flag to indicate if the search term should be interpreted as a
     * regular expression (true) or not (false) and therefore and special
     * regex characters escaped.
     */
    "regex": false,
    /**
     * Flag to indicate if DataTables is to use its smart filtering or not.
     */
    "smart": true,
    /**
     * Flag to indicate if DataTables should only trigger a search when
     * the return key is pressed.
     */
    "return": false
  };
  DataTable.models.oRow = {
    /**
     * TR element for the row
     */
    "nTr": null,
    /**
     * Array of TD elements for each row. This is null until the row has been
     * created.
     */
    "anCells": null,
    /**
     * Data object from the original data source for the row. This is either
     * an array if using the traditional form of DataTables, or an object if
     * using mData options. The exact type will depend on the passed in
     * data from the data source, or will be an array if using DOM a data
     * source.
     */
    "_aData": [],
    /**
     * Sorting data cache - this array is ostensibly the same length as the
     * number of columns (although each index is generated only as it is
     * needed), and holds the data that is used for sorting each column in the
     * row. We do this cache generation at the start of the sort in order that
     * the formatting of the sort data need be done only once for each cell
     * per sort. This array should not be read from or written to by anything
     * other than the master sorting methods.
     */
    "_aSortData": null,
    /**
     * Per cell filtering data cache. As per the sort data cache, used to
     * increase the performance of the filtering in DataTables
     */
    "_aFilterData": null,
    /**
     * Filtering data cache. This is the same as the cell filtering cache, but
     * in this case a string rather than an array. This is easily computed with
     * a join on `_aFilterData`, but is provided as a cache so the join isn't
     * needed on every search (memory traded for performance)
     */
    "_sFilterRow": null,
    /**
     * Denote if the original data source was from the DOM, or the data source
     * object. This is used for invalidating data, so DataTables can
     * automatically read data from the original source, unless uninstructed
     * otherwise.
     */
    "src": null,
    /**
     * Index in the aoData array. This saves an indexOf lookup when we have the
     * object, but want to know the index
     */
    "idx": -1,
    /**
     * Cached display value
     */
    displayData: null
  };
  DataTable.models.oColumn = {
    /**
     * Column index.
     */
    "idx": null,
    /**
     * A list of the columns that sorting should occur on when this column
     * is sorted. That this property is an array allows multi-column sorting
     * to be defined for a column (for example first name / last name columns
     * would benefit from this). The values are integers pointing to the
     * columns to be sorted on (typically it will be a single integer pointing
     * at itself, but that doesn't need to be the case).
     */
    "aDataSort": null,
    /**
     * Define the sorting directions that are applied to the column, in sequence
     * as the column is repeatedly sorted upon - i.e. the first value is used
     * as the sorting direction when the column if first sorted (clicked on).
     * Sort it again (click again) and it will move on to the next index.
     * Repeat until loop.
     */
    "asSorting": null,
    /**
     * Flag to indicate if the column is searchable, and thus should be included
     * in the filtering or not.
     */
    "bSearchable": null,
    /**
     * Flag to indicate if the column is sortable or not.
     */
    "bSortable": null,
    /**
     * Flag to indicate if the column is currently visible in the table or not
     */
    "bVisible": null,
    /**
     * Store for manual type assignment using the `column.type` option. This
     * is held in store so we can manipulate the column's `sType` property.
     */
    "_sManualType": null,
    /**
     * Flag to indicate if HTML5 data attributes should be used as the data
     * source for filtering or sorting. True is either are.
     */
    "_bAttrSrc": false,
    /**
     * Developer definable function that is called whenever a cell is created (Ajax source,
     * etc) or processed for input (DOM source). This can be used as a compliment to mRender
     * allowing you to modify the DOM element (add background colour for example) when the
     * element is available.
     */
    "fnCreatedCell": null,
    /**
     * Function to get data from a cell in a column. You should <b>never</b>
     * access data directly through _aData internally in DataTables - always use
     * the method attached to this property. It allows mData to function as
     * required. This function is automatically assigned by the column
     * initialisation method
     */
    "fnGetData": null,
    /**
     * Function to set data for a cell in the column. You should <b>never</b>
     * set the data directly to _aData internally in DataTables - always use
     * this method. It allows mData to function as required. This function
     * is automatically assigned by the column initialisation method
     */
    "fnSetData": null,
    /**
     * Property to read the value for the cells in the column from the data
     * source array / object. If null, then the default content is used, if a
     * function is given then the return from the function is used.
     */
    "mData": null,
    /**
     * Partner property to mData which is used (only when defined) to get
     * the data - i.e. it is basically the same as mData, but without the
     * 'set' option, and also the data fed to it is the result from mData.
     * This is the rendering method to match the data method of mData.
     */
    "mRender": null,
    /**
     * The class to apply to all TD elements in the table's TBODY for the column
     */
    "sClass": null,
    /**
     * When DataTables calculates the column widths to assign to each column,
     * it finds the longest string in each column and then constructs a
     * temporary table and reads the widths from that. The problem with this
     * is that "mmm" is much wider then "iiii", but the latter is a longer
     * string - thus the calculation can go wrong (doing it properly and putting
     * it into an DOM object and measuring that is horribly(!) slow). Thus as
     * a "work around" we provide this option. It will append its value to the
     * text that is found to be the longest string for the column - i.e. padding.
     */
    "sContentPadding": null,
    /**
     * Allows a default value to be given for a column's data, and will be used
     * whenever a null data source is encountered (this can be because mData
     * is set to null, or because the data source itself is null).
     */
    "sDefaultContent": null,
    /**
     * Name for the column, allowing reference to the column by name as well as
     * by index (needs a lookup to work by name).
     */
    "sName": null,
    /**
     * Custom sorting data type - defines which of the available plug-ins in
     * afnSortData the custom sorting will use - if any is defined.
     */
    "sSortDataType": "std",
    /**
     * Class to be applied to the header element when sorting on this column
     */
    "sSortingClass": null,
    /**
     * Title of the column - what is seen in the TH element (nTh).
     */
    "sTitle": null,
    /**
     * Column sorting and filtering type
     */
    "sType": null,
    /**
     * Width of the column
     */
    "sWidth": null,
    /**
     * Width of the column when it was first "encountered"
     */
    "sWidthOrig": null,
    /** Cached longest strings from a column */
    wideStrings: null,
    /**
     * Store for named searches
     */
    searchFixed: null
  };
  DataTable.defaults = {
    /**
     * An array of data to use for the table, passed in at initialisation which
     * will be used in preference to any data which is already in the DOM. This is
     * particularly useful for constructing tables purely in JavaScript, for
     * example with a custom Ajax call.
     */
    "aaData": null,
    /**
     * If ordering is enabled, then DataTables will perform a first pass sort on
     * initialisation. You can define which column(s) the sort is performed
     * upon, and the sorting direction, with this variable. The `sorting` array
     * should contain an array for each column to be sorted initially containing
     * the column's index and a direction string ('asc' or 'desc').
     */
    "aaSorting": [[0, "asc"]],
    /**
     * This parameter is basically identical to the `sorting` parameter, but
     * cannot be overridden by user interaction with the table. What this means
     * is that you could have a column (visible or hidden) which the sorting
     * will always be forced on first - any sorting after that (from the user)
     * will then be performed as required. This can be useful for grouping rows
     * together.
     */
    "aaSortingFixed": [],
    /**
     * DataTables can be instructed to load data to display in the table from a
     * Ajax source. This option defines how that Ajax call is made and where to.
     *
     * The `ajax` property has three different modes of operation, depending on
     * how it is defined. These are:
     *
     * * `string` - Set the URL from where the data should be loaded from.
     * * `object` - Define properties for `jQuery.ajax`.
     * * `function` - Custom data get function
     *
     * `string`
     * --------
     *
     * As a string, the `ajax` property simply defines the URL from which
     * DataTables will load data.
     *
     * `object`
     * --------
     *
     * As an object, the parameters in the object are passed to
     * [jQuery.ajax](https://api.jquery.com/jQuery.ajax/) allowing fine control
     * of the Ajax request. DataTables has a number of default parameters which
     * you can override using this option. Please refer to the jQuery
     * documentation for a full description of the options available, although
     * the following parameters provide additional options in DataTables or
     * require special consideration:
     *
     * * `data` - As with jQuery, `data` can be provided as an object, but it
     *   can also be used as a function to manipulate the data DataTables sends
     *   to the server. The function takes a single parameter, an object of
     *   parameters with the values that DataTables has readied for sending. An
     *   object may be returned which will be merged into the DataTables
     *   defaults, or you can add the items to the object that was passed in and
     *   not return anything from the function. This supersedes `fnServerParams`
     *   from DataTables 1.9-.
     *
     * * `dataSrc` - By default DataTables will look for the property `data` (or
     *   `aaData` for compatibility with DataTables 1.9-) when obtaining data
     *   from an Ajax source or for server-side processing - this parameter
     *   allows that property to be changed. You can use JavaScript dotted
     *   object notation to get a data source for multiple levels of nesting, or
     *   it my be used as a function. As a function it takes a single parameter,
     *   the JSON returned from the server, which can be manipulated as
     *   required, with the returned value being that used by DataTables as the
     *   data source for the table.
     *
     * * `success` - Should not be overridden it is used internally in
     *   DataTables. To manipulate / transform the data returned by the server
     *   use `ajax.dataSrc`, or use `ajax` as a function (see below).
     *
     * `function`
     * ----------
     *
     * As a function, making the Ajax call is left up to yourself allowing
     * complete control of the Ajax request. Indeed, if desired, a method other
     * than Ajax could be used to obtain the required data, such as Web storage
     * or an AIR database.
     *
     * The function is given four parameters and no return is required. The
     * parameters are:
     *
     * 1. _object_ - Data to send to the server
     * 2. _function_ - Callback function that must be executed when the required
     *    data has been obtained. That data should be passed into the callback
     *    as the only parameter
     * 3. _object_ - DataTables settings object for the table
     */
    "ajax": null,
    /**
     * This parameter allows you to readily specify the entries in the length drop
     * down menu that DataTables shows when pagination is enabled. It can be
     * either a 1D array of options which will be used for both the displayed
     * option and the value, or a 2D array which will use the array in the first
     * position as the value, and the array in the second position as the
     * displayed options (useful for language strings such as 'All').
     *
     * Note that the `pageLength` property will be automatically set to the
     * first value given in this array, unless `pageLength` is also provided.
     */
    "aLengthMenu": [10, 25, 50, 100],
    /**
     * The `columns` option in the initialisation parameter allows you to define
     * details about the way individual columns behave. For a full list of
     * column options that can be set, please see
     * {@link DataTable.defaults.column}. Note that if you use `columns` to
     * define your columns, you must have an entry in the array for every single
     * column that you have in your table (these can be null if you don't which
     * to specify any options).
     */
    "aoColumns": null,
    /**
     * Very similar to `columns`, `columnDefs` allows you to target a specific
     * column, multiple columns, or all columns, using the `targets` property of
     * each object in the array. This allows great flexibility when creating
     * tables, as the `columnDefs` arrays can be of any length, targeting the
     * columns you specifically want. `columnDefs` may use any of the column
     * options available: {@link DataTable.defaults.column}, but it _must_
     * have `targets` defined in each object in the array. Values in the `targets`
     * array may be:
     *   <ul>
     *     <li>a string - class name will be matched on the TH for the column</li>
     *     <li>0 or a positive integer - column index counting from the left</li>
     *     <li>a negative integer - column index counting from the right</li>
     *     <li>the string "_all" - all columns (i.e. assign a default)</li>
     *   </ul>
     */
    "aoColumnDefs": null,
    /**
     * Basically the same as `search`, this parameter defines the individual column
     * filtering state at initialisation time. The array must be of the same size
     * as the number of columns, and each element be an object with the parameters
     * `search` and `escapeRegex` (the latter is optional). 'null' is also
     * accepted and the default will be used.
     */
    "aoSearchCols": [],
    /**
     * Enable or disable automatic column width calculation. This can be disabled
     * as an optimisation (it takes some time to calculate the widths) if the
     * tables widths are passed in using `columns`.
     */
    "bAutoWidth": true,
    /**
     * Deferred rendering can provide DataTables with a huge speed boost when you
     * are using an Ajax or JS data source for the table. This option, when set to
     * true, will cause DataTables to defer the creation of the table elements for
     * each row until they are needed for a draw - saving a significant amount of
     * time.
     */
    "bDeferRender": true,
    /**
     * Replace a DataTable which matches the given selector and replace it with
     * one which has the properties of the new initialisation object passed. If no
     * table matches the selector, then the new DataTable will be constructed as
     * per normal.
     */
    "bDestroy": false,
    /**
     * Enable or disable filtering of data. Filtering in DataTables is "smart" in
     * that it allows the end user to input multiple words (space separated) and
     * will match a row containing those words, even if not in the order that was
     * specified (this allow matching across multiple columns). Note that if you
     * wish to use filtering in DataTables this must remain 'true' - to remove the
     * default filtering input box and retain filtering abilities, please use
     * {@link DataTable.defaults.dom}.
     */
    "bFilter": true,
    /**
     * Used only for compatibility with DT1
     * @deprecated
     */
    "bInfo": true,
    /**
     * Used only for compatibility with DT1
     * @deprecated
     */
    "bLengthChange": true,
    /**
     * Enable or disable pagination.
     */
    "bPaginate": true,
    /**
     * Enable or disable the display of a 'processing' indicator when the table is
     * being processed (e.g. a sort). This is particularly useful for tables with
     * large amounts of data where it can take a noticeable amount of time to sort
     * the entries.
     */
    "bProcessing": false,
    /**
     * Retrieve the DataTables object for the given selector. Note that if the
     * table has already been initialised, this parameter will cause DataTables
     * to simply return the object that has already been set up - it will not take
     * account of any changes you might have made to the initialisation object
     * passed to DataTables (setting this parameter to true is an acknowledgement
     * that you understand this). `destroy` can be used to reinitialise a table if
     * you need.
     */
    "bRetrieve": false,
    /**
     * When vertical (y) scrolling is enabled, DataTables will force the height of
     * the table's viewport to the given height at all times (useful for layout).
     * However, this can look odd when filtering data down to a small data set,
     * and the footer is left "floating" further down. This parameter (when
     * enabled) will cause DataTables to collapse the table's viewport down when
     * the result set will fit within the given Y height.
     */
    "bScrollCollapse": false,
    /**
     * Configure DataTables to use server-side processing. Note that the
     * `ajax` parameter must also be given in order to give DataTables a
     * source to obtain the required data for each draw.
     */
    "bServerSide": false,
    /**
     * Enable or disable sorting of columns. Sorting of individual columns can be
     * disabled by the `sortable` option for each column.
     */
    "bSort": true,
    /**
     * Enable or display DataTables' ability to sort multiple columns at the
     * same time (activated by shift-click by the user).
     */
    "bSortMulti": true,
    /**
     * Allows control over whether DataTables should use the top (true) unique
     * cell that is found for a single column, or the bottom (false - default).
     * This is useful when using complex headers.
     */
    "bSortCellsTop": null,
    /** Specify which row is the title row in the header. Replacement for bSortCellsTop */
    titleRow: null,
    /**
     * Enable or disable the addition of the classes `sorting\_1`, `sorting\_2` and
     * `sorting\_3` to the columns which are currently being sorted on. This is
     * presented as a feature switch as it can increase processing time (while
     * classes are removed and added) so for large data sets you might want to
     * turn this off.
     */
    "bSortClasses": true,
    /**
     * Enable or disable state saving. When enabled HTML5 `localStorage` will be
     * used to save table display information such as pagination information,
     * display length, filtering and sorting. As such when the end user reloads
     * the page the display will match what thy had previously set up.
     */
    "bStateSave": false,
    /**
     * This function is called when a TR element is created (and all TD child
     * elements have been inserted), or registered if using a DOM source, allowing
     * manipulation of the TR element (adding classes etc).
     */
    "fnCreatedRow": null,
    /**
     * This function is called on every 'draw' event, and allows you to
     * dynamically modify any aspect you want about the created DOM.
     */
    "fnDrawCallback": null,
    /**
     * Identical to fnHeaderCallback() but for the table footer this function
     * allows you to modify the table footer on every 'draw' event.
     */
    "fnFooterCallback": null,
    /**
     * When rendering large numbers in the information element for the table
     * (i.e. "Showing 1 to 10 of 57 entries") DataTables will render large numbers
     * to have a comma separator for the 'thousands' units (e.g. 1 million is
     * rendered as "1,000,000") to help readability for the end user. This
     * function will override the default method DataTables uses.
     */
    "fnFormatNumber": function(toFormat) {
      return toFormat.toString().replace(
        /\B(?=(\d{3})+(?!\d))/g,
        this.oLanguage.sThousands
      );
    },
    /**
     * This function is called on every 'draw' event, and allows you to
     * dynamically modify the header row. This can be used to calculate and
     * display useful information about the table.
     */
    "fnHeaderCallback": null,
    /**
     * The information element can be used to convey information about the current
     * state of the table. Although the internationalisation options presented by
     * DataTables are quite capable of dealing with most customisations, there may
     * be times where you wish to customise the string further. This callback
     * allows you to do exactly that.
     */
    "fnInfoCallback": null,
    /**
     * Called when the table has been initialised. Normally DataTables will
     * initialise sequentially and there will be no need for this function,
     * however, this does not hold true when using external language information
     * since that is obtained using an async XHR call.
     */
    "fnInitComplete": null,
    /**
     * Called at the very start of each table draw and can be used to cancel the
     * draw by returning false, any other return (including undefined) results in
     * the full draw occurring).
     */
    "fnPreDrawCallback": null,
    /**
     * This function allows you to 'post process' each row after it have been
     * generated for each table draw, but before it is rendered on screen. This
     * function might be used for setting the row class name etc.
     */
    "fnRowCallback": null,
    /**
     * Load the table state. With this function you can define from where, and how, the
     * state of a table is loaded. By default DataTables will load from `localStorage`
     * but you might wish to use a server-side database or cookies.
     */
    "fnStateLoadCallback": function(settings) {
      try {
        return JSON.parse(
          (settings.iStateDuration === -1 ? sessionStorage : localStorage).getItem(
            "DataTables_" + settings.sInstance + "_" + location.pathname
          )
        );
      } catch (e) {
        return {};
      }
    },
    /**
     * Callback which allows modification of the saved state prior to loading that state.
     * This callback is called when the table is loading state from the stored data, but
     * prior to the settings object being modified by the saved state. Note that for
     * plug-in authors, you should use the `stateLoadParams` event to load parameters for
     * a plug-in.
     */
    "fnStateLoadParams": null,
    /**
     * Callback that is called when the state has been loaded from the state saving method
     * and the DataTables settings object has been modified as a result of the loaded state.
     */
    "fnStateLoaded": null,
    /**
     * Save the table state. This function allows you to define where and how the state
     * information for the table is stored By default DataTables will use `localStorage`
     * but you might wish to use a server-side database or cookies.
     */
    "fnStateSaveCallback": function(settings, data) {
      try {
        (settings.iStateDuration === -1 ? sessionStorage : localStorage).setItem(
          "DataTables_" + settings.sInstance + "_" + location.pathname,
          JSON.stringify(data)
        );
      } catch (e) {
      }
    },
    /**
     * Callback which allows modification of the state to be saved. Called when the table
     * has changed state a new state save is required. This method allows modification of
     * the state saving object prior to actually doing the save, including addition or
     * other state properties or modification. Note that for plug-in authors, you should
     * use the `stateSaveParams` event to save parameters for a plug-in.
     */
    "fnStateSaveParams": null,
    /**
     * Duration for which the saved state information is considered valid. After this period
     * has elapsed the state will be returned to the default.
     * Value is given in seconds.
     */
    "iStateDuration": 7200,
    /**
     * Number of rows to display on a single page when using pagination. If
     * feature enabled (`lengthChange`) then the end user will be able to override
     * this to a custom setting using a pop-up menu.
     */
    "iDisplayLength": 10,
    /**
     * Define the starting point for data display when using DataTables with
     * pagination. Note that this parameter is the number of records, rather than
     * the page number, so if you have 10 records per page and want to start on
     * the third page, it should be "20".
     */
    "iDisplayStart": 0,
    /**
     * By default DataTables allows keyboard navigation of the table (sorting, paging,
     * and filtering) by adding a `tabindex` attribute to the required elements. This
     * allows you to tab through the controls and press the enter key to activate them.
     * The tabindex is default 0, meaning that the tab follows the flow of the document.
     * You can overrule this using this parameter if you wish. Use a value of -1 to
     * disable built-in keyboard navigation.
     */
    "iTabIndex": 0,
    /**
     * Classes that DataTables assigns to the various components and features
     * that it adds to the HTML table. This allows classes to be configured
     * during initialisation in addition to through the static
     * {@link DataTable.ext.oStdClasses} object).
     */
    "oClasses": {},
    /**
     * All strings that DataTables uses in the user interface that it creates
     * are defined in this object, allowing you to modified them individually or
     * completely replace them all as required.
     */
    "oLanguage": {
      /**
       * Strings that are used for WAI-ARIA labels and controls only (these are not
       * actually visible on the page, but will be read by screenreaders, and thus
       * must be internationalised as well).
       */
      "oAria": {
        /**
         * ARIA label that is added to the table headers when the column may be sorted
         */
        "orderable": ": Activate to sort",
        /**
         * ARIA label that is added to the table headers when the column is currently being sorted
         */
        "orderableReverse": ": Activate to invert sorting",
        /**
         * ARIA label that is added to the table headers when the column is currently being 
         * sorted and next step is to remove sorting
         */
        "orderableRemove": ": Activate to remove sorting",
        paginate: {
          first: "First",
          last: "Last",
          next: "Next",
          previous: "Previous",
          number: ""
        }
      },
      /**
       * Pagination string used by DataTables for the built-in pagination
       * control types.
       */
      "oPaginate": {
        /**
         * Label and character for first page button («)
         */
        "sFirst": "\xAB",
        /**
         * Last page button (»)
         */
        "sLast": "\xBB",
        /**
         * Next page button (›)
         */
        "sNext": "\u203A",
        /**
         * Previous page button (‹)
         */
        "sPrevious": "\u2039"
      },
      /**
       * Plural object for the data type the table is showing
       */
      entries: {
        _: "entries",
        1: "entry"
      },
      /**
       * Page length options
       */
      lengthLabels: {
        "-1": "All"
      },
      /**
       * This string is shown in preference to `zeroRecords` when the table is
       * empty of data (regardless of filtering). Note that this is an optional
       * parameter - if it is not given, the value of `zeroRecords` will be used
       * instead (either the default or given value).
       */
      "sEmptyTable": "No data available in table",
      /**
       * This string gives information to the end user about the information
       * that is current on display on the page. The following tokens can be
       * used in the string and will be dynamically replaced as the table
       * display updates. This tokens can be placed anywhere in the string, or
       * removed as needed by the language requires:
       *
       * * `\_START\_` - Display index of the first record on the current page
       * * `\_END\_` - Display index of the last record on the current page
       * * `\_TOTAL\_` - Number of records in the table after filtering
       * * `\_MAX\_` - Number of records in the table without filtering
       * * `\_PAGE\_` - Current page number
       * * `\_PAGES\_` - Total number of pages of data in the table
       */
      "sInfo": "Showing _START_ to _END_ of _TOTAL_ _ENTRIES-TOTAL_",
      /**
       * Display information string for when the table is empty. Typically the
       * format of this string should match `info`.
       */
      "sInfoEmpty": "Showing 0 to 0 of 0 _ENTRIES-TOTAL_",
      /**
       * When a user filters the information in a table, this string is appended
       * to the information (`info`) to give an idea of how strong the filtering
       * is. The variable _MAX_ is dynamically updated.
       */
      "sInfoFiltered": "(filtered from _MAX_ total _ENTRIES-MAX_)",
      /**
       * If can be useful to append extra information to the info string at times,
       * and this variable does exactly that. This information will be appended to
       * the `info` (`infoEmpty` and `infoFiltered` in whatever combination they are
       * being used) at all times.
       */
      "sInfoPostFix": "",
      /**
       * This decimal place operator is a little different from the other
       * language options since DataTables doesn't output floating point
       * numbers, so it won't ever use this for display of a number. Rather,
       * what this parameter does is modify the sort methods of the table so
       * that numbers which are in a format which has a character other than
       * a period (`.`) as a decimal place will be sorted numerically.
       *
       * Note that numbers with different decimal places cannot be shown in
       * the same table and still be sortable, the table must be consistent.
       * However, multiple different tables on the page can use different
       * decimal place characters.
       */
      "sDecimal": "",
      /**
       * DataTables has a build in number formatter (`formatNumber`) which is
       * used to format large numbers that are used in the table information.
       * By default a comma is used, but this can be trivially changed to any
       * character you wish with this parameter.
       */
      "sThousands": ",",
      /**
       * Detail the action that will be taken when the drop down menu for the
       * pagination length option is changed. The '_MENU_' variable is replaced
       * with a default select list of 10, 25, 50 and 100, and can be replaced
       * with a custom select box if required.
       */
      "sLengthMenu": "_MENU_ _ENTRIES_ per page",
      /**
       * When using Ajax sourced data and during the first draw when DataTables is
       * gathering the data, this message is shown in an empty row in the table to
       * indicate to the end user the data is being loaded. Note that this
       * parameter is not used when loading data by server-side processing, just
       * Ajax sourced data with client-side processing.
       */
      "sLoadingRecords": "Loading...",
      /**
       * Text which is displayed when the table is processing a user action
       * (usually a sort command or similar).
       */
      "sProcessing": "",
      /**
       * Details the actions that will be taken when the user types into the
       * filtering input text box. The variable "_INPUT_", if used in the string,
       * is replaced with the HTML text box for the filtering input allowing
       * control over where it appears in the string. If "_INPUT_" is not given
       * then the input box is appended to the string automatically.
       */
      "sSearch": "Search:",
      /**
       * Assign a `placeholder` attribute to the search `input` element
       *  @type string
       *  @default 
       *
       *  @dtopt Language
       *  @name DataTable.defaults.language.searchPlaceholder
       */
      "sSearchPlaceholder": "",
      /**
       * All of the language information can be stored in a file on the
       * server-side, which DataTables will look up if this parameter is passed.
       * It must store the URL of the language file, which is in a JSON format,
       * and the object has the same properties as the oLanguage object in the
       * initialiser object (i.e. the above parameters). Please refer to one of
       * the example language files to see how this works in action.
       */
      "sUrl": "",
      /**
       * Text shown inside the table records when the is no information to be
       * displayed after filtering. `emptyTable` is shown when there is simply no
       * information in the table at all (regardless of filtering).
       */
      "sZeroRecords": "No matching records found"
    },
    /** The initial data order is reversed when `desc` ordering */
    orderDescReverse: true,
    /**
     * This parameter allows you to have define the global filtering state at
     * initialisation time. As an object the `search` parameter must be
     * defined, but all other parameters are optional. When `regex` is true,
     * the search string will be treated as a regular expression, when false
     * (default) it will be treated as a straight string. When `smart`
     * DataTables will use it's smart filtering methods (to word match at
     * any point in the data), when false this will not be done.
     */
    "oSearch": $.extend({}, DataTable.models.oSearch),
    /**
     * Table and control layout. This replaces the legacy `dom` option.
     */
    layout: {
      topStart: "pageLength",
      topEnd: "search",
      bottomStart: "info",
      bottomEnd: "paging"
    },
    /**
     * Legacy DOM layout option
     */
    "sDom": null,
    /**
     * Search delay option. This will throttle full table searches that use the
     * DataTables provided search input element (it does not effect calls to
     * `dt-api search()`, providing a delay before the search is made.
     */
    "searchDelay": null,
    /**
     * DataTables features six different built-in options for the buttons to
     * display for pagination control:
     *
     * * `numbers` - Page number buttons only
     * * `simple` - 'Previous' and 'Next' buttons only
     * * 'simple_numbers` - 'Previous' and 'Next' buttons, plus page numbers
     * * `full` - 'First', 'Previous', 'Next' and 'Last' buttons
     * * `full_numbers` - 'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers
     * * `first_last_numbers` - 'First' and 'Last' buttons, plus page numbers
     */
    "sPaginationType": "",
    /**
     * Enable horizontal scrolling. When a table is too wide to fit into a
     * certain layout, or you have a large number of columns in the table, you
     * can enable x-scrolling to show the table in a viewport, which can be
     * scrolled. This property can be `true` which will allow the table to
     * scroll horizontally when needed, or any CSS unit, or a number (in which
     * case it will be treated as a pixel measurement). Setting as simply `true`
     * is recommended.
     */
    "sScrollX": "",
    /**
     * This property can be used to force a DataTable to use more width than it
     * might otherwise do when x-scrolling is enabled. For example if you have a
     * table which requires to be well spaced, this parameter is useful for
     * "over-sizing" the table, and thus forcing scrolling. This property can by
     * any CSS unit, or a number (in which case it will be treated as a pixel
     * measurement).
     */
    "sScrollXInner": "",
    /**
     * Enable vertical scrolling. Vertical scrolling will constrain the DataTable
     * to the given height, and enable scrolling for any data which overflows the
     * current viewport. This can be used as an alternative to paging to display
     * a lot of data in a small area (although paging and scrolling can both be
     * enabled at the same time). This property can be any CSS unit, or a number
     * (in which case it will be treated as a pixel measurement).
     */
    "sScrollY": "",
    /**
     * __Deprecated__ The functionality provided by this parameter has now been
     * superseded by that provided through `ajax`, which should be used instead.
     *
     * Set the HTTP method that is used to make the Ajax call for server-side
     * processing or Ajax sourced data.
     */
    "sServerMethod": "GET",
    /**
     * DataTables makes use of renderers when displaying HTML elements for
     * a table. These renderers can be added or modified by plug-ins to
     * generate suitable mark-up for a site. For example the Bootstrap
     * integration plug-in for DataTables uses a paging button renderer to
     * display pagination buttons in the mark-up required by Bootstrap.
     *
     * For further information about the renderers available see
     * DataTable.ext.renderer
     */
    "renderer": null,
    /**
     * Set the data property name that DataTables should use to get a row's id
     * to set as the `id` property in the node.
     */
    "rowId": "DT_RowId",
    /**
     * Caption value
     */
    "caption": null,
    /**
     * For server-side processing - use the data from the DOM for the first draw
     */
    iDeferLoading: null,
    /** Event listeners */
    on: null,
    /** Title wrapper element type */
    columnTitleTag: "span"
  };
  _fnHungarianMap(DataTable.defaults);
  DataTable.defaults.column = {
    /**
     * Define which column(s) an order will occur on for this column. This
     * allows a column's ordering to take multiple columns into account when
     * doing a sort or use the data from a different column. For example first
     * name / last name columns make sense to do a multi-column sort over the
     * two columns.
     */
    "aDataSort": null,
    "iDataSort": -1,
    ariaTitle: "",
    /**
     * You can control the default ordering direction, and even alter the
     * behaviour of the sort handler (i.e. only allow ascending ordering etc)
     * using this parameter.
     */
    "asSorting": ["asc", "desc", ""],
    /**
     * Enable or disable filtering on the data in this column.
     */
    "bSearchable": true,
    /**
     * Enable or disable ordering on this column.
     */
    "bSortable": true,
    /**
     * Enable or disable the display of this column.
     */
    "bVisible": true,
    /**
     * Developer definable function that is called whenever a cell is created (Ajax source,
     * etc) or processed for input (DOM source). This can be used as a compliment to mRender
     * allowing you to modify the DOM element (add background colour for example) when the
     * element is available.
     */
    "fnCreatedCell": null,
    /**
     * This property can be used to read data from any data source property,
     * including deeply nested objects / properties. `data` can be given in a
     * number of different ways which effect its behaviour:
     *
     * * `integer` - treated as an array index for the data source. This is the
     *   default that DataTables uses (incrementally increased for each column).
     * * `string` - read an object property from the data source. There are
     *   three 'special' options that can be used in the string to alter how
     *   DataTables reads the data from the source object:
     *    * `.` - Dotted JavaScript notation. Just as you use a `.` in
     *      JavaScript to read from nested objects, so to can the options
     *      specified in `data`. For example: `browser.version` or
     *      `browser.name`. If your object parameter name contains a period, use
     *      `\\` to escape it - i.e. `first\\.name`.
     *    * `[]` - Array notation. DataTables can automatically combine data
     *      from and array source, joining the data with the characters provided
     *      between the two brackets. For example: `name[, ]` would provide a
     *      comma-space separated list from the source array. If no characters
     *      are provided between the brackets, the original array source is
     *      returned.
     *    * `()` - Function notation. Adding `()` to the end of a parameter will
     *      execute a function of the name given. For example: `browser()` for a
     *      simple function on the data source, `browser.version()` for a
     *      function in a nested property or even `browser().version` to get an
     *      object property if the function called returns an object. Note that
     *      function notation is recommended for use in `render` rather than
     *      `data` as it is much simpler to use as a renderer.
     * * `null` - use the original data source for the row rather than plucking
     *   data directly from it. This action has effects on two other
     *   initialisation options:
     *    * `defaultContent` - When null is given as the `data` option and
     *      `defaultContent` is specified for the column, the value defined by
     *      `defaultContent` will be used for the cell.
     *    * `render` - When null is used for the `data` option and the `render`
     *      option is specified for the column, the whole data source for the
     *      row is used for the renderer.
     * * `function` - the function given will be executed whenever DataTables
     *   needs to set or get the data for a cell in the column. The function
     *   takes three parameters:
     *    * Parameters:
     *      * `{array|object}` The data source for the row
     *      * `{string}` The type call data requested - this will be 'set' when
     *        setting data or 'filter', 'display', 'type', 'sort' or undefined
     *        when gathering data. Note that when `undefined` is given for the
     *        type DataTables expects to get the raw data for the object back<
     *      * `{*}` Data to set when the second parameter is 'set'.
     *    * Return:
     *      * The return value from the function is not required when 'set' is
     *        the type of call, but otherwise the return is what will be used
     *        for the data requested.
     *
     * Note that `data` is a getter and setter option. If you just require
     * formatting of data for output, you will likely want to use `render` which
     * is simply a getter and thus simpler to use.
     *
     * Note that prior to DataTables 1.9.2 `data` was called `mDataProp`. The
     * name change reflects the flexibility of this property and is consistent
     * with the naming of mRender. If 'mDataProp' is given, then it will still
     * be used by DataTables, as it automatically maps the old name to the new
     * if required.
     */
    "mData": null,
    /**
     * This property is the rendering partner to `data` and it is suggested that
     * when you want to manipulate data for display (including filtering,
     * sorting etc) without altering the underlying data for the table, use this
     * property. `render` can be considered to be the read only companion to
     * `data` which is read / write (then as such more complex). Like `data`
     * this option can be given in a number of different ways to effect its
     * behaviour:
     *
     * * `integer` - treated as an array index for the data source. This is the
     *   default that DataTables uses (incrementally increased for each column).
     * * `string` - read an object property from the data source. There are
     *   three 'special' options that can be used in the string to alter how
     *   DataTables reads the data from the source object:
     *    * `.` - Dotted JavaScript notation. Just as you use a `.` in
     *      JavaScript to read from nested objects, so to can the options
     *      specified in `data`. For example: `browser.version` or
     *      `browser.name`. If your object parameter name contains a period, use
     *      `\\` to escape it - i.e. `first\\.name`.
     *    * `[]` - Array notation. DataTables can automatically combine data
     *      from and array source, joining the data with the characters provided
     *      between the two brackets. For example: `name[, ]` would provide a
     *      comma-space separated list from the source array. If no characters
     *      are provided between the brackets, the original array source is
     *      returned.
     *    * `()` - Function notation. Adding `()` to the end of a parameter will
     *      execute a function of the name given. For example: `browser()` for a
     *      simple function on the data source, `browser.version()` for a
     *      function in a nested property or even `browser().version` to get an
     *      object property if the function called returns an object.
     * * `object` - use different data for the different data types requested by
     *   DataTables ('filter', 'display', 'type' or 'sort'). The property names
     *   of the object is the data type the property refers to and the value can
     *   defined using an integer, string or function using the same rules as
     *   `render` normally does. Note that an `_` option _must_ be specified.
     *   This is the default value to use if you haven't specified a value for
     *   the data type requested by DataTables.
     * * `function` - the function given will be executed whenever DataTables
     *   needs to set or get the data for a cell in the column. The function
     *   takes three parameters:
     *    * Parameters:
     *      * {array|object} The data source for the row (based on `data`)
     *      * {string} The type call data requested - this will be 'filter',
     *        'display', 'type' or 'sort'.
     *      * {array|object} The full data source for the row (not based on
     *        `data`)
     *    * Return:
     *      * The return value from the function is what will be used for the
     *        data requested.
     */
    "mRender": null,
    /**
     * Change the cell type created for the column - either TD cells or TH cells. This
     * can be useful as TH cells have semantic meaning in the table body, allowing them
     * to act as a header for a row (you may wish to add scope='row' to the TH elements).
     */
    "sCellType": "td",
    /**
     * Class to give to each cell in this column.
     */
    "sClass": "",
    /**
     * When DataTables calculates the column widths to assign to each column,
     * it finds the longest string in each column and then constructs a
     * temporary table and reads the widths from that. The problem with this
     * is that "mmm" is much wider then "iiii", but the latter is a longer
     * string - thus the calculation can go wrong (doing it properly and putting
     * it into an DOM object and measuring that is horribly(!) slow). Thus as
     * a "work around" we provide this option. It will append its value to the
     * text that is found to be the longest string for the column - i.e. padding.
     * Generally you shouldn't need this!
     */
    "sContentPadding": "",
    /**
     * Allows a default value to be given for a column's data, and will be used
     * whenever a null data source is encountered (this can be because `data`
     * is set to null, or because the data source itself is null).
     */
    "sDefaultContent": null,
    /**
     * This parameter is only used in DataTables' server-side processing. It can
     * be exceptionally useful to know what columns are being displayed on the
     * client side, and to map these to database fields. When defined, the names
     * also allow DataTables to reorder information from the server if it comes
     * back in an unexpected order (i.e. if you switch your columns around on the
     * client-side, your server-side code does not also need updating).
     */
    "sName": "",
    /**
     * Defines a data source type for the ordering which can be used to read
     * real-time information from the table (updating the internally cached
     * version) prior to ordering. This allows ordering to occur on user
     * editable elements such as form inputs.
     */
    "sSortDataType": "std",
    /**
     * The title of this column.
     */
    "sTitle": null,
    /**
     * The type allows you to specify how the data for this column will be
     * ordered. Four types (string, numeric, date and html (which will strip
     * HTML tags before ordering)) are currently available. Note that only date
     * formats understood by JavaScript's Date() object will be accepted as type
     * date. For example: "Mar 26, 2008 5:03 PM". May take the values: 'string',
     * 'numeric', 'date' or 'html' (by default). Further types can be adding
     * through plug-ins.
     */
    "sType": null,
    /**
     * Defining the width of the column, this parameter may take any CSS value
     * (3em, 20px etc). DataTables applies 'smart' widths to columns which have not
     * been given a specific width through this interface ensuring that the table
     * remains readable.
     */
    "sWidth": null
  };
  _fnHungarianMap(DataTable.defaults.column);
  DataTable.models.oSettings = {
    /**
     * Primary features of DataTables and their enablement state.
     */
    "oFeatures": {
      /**
       * Flag to say if DataTables should automatically try to calculate the
       * optimum table and columns widths (true) or not (false).
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bAutoWidth": null,
      /**
       * Delay the creation of TR and TD elements until they are actually
       * needed by a driven page draw. This can give a significant speed
       * increase for Ajax source and JavaScript source data, but makes no
       * difference at all for DOM and server-side processing tables.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bDeferRender": null,
      /**
       * Enable filtering on the table or not. Note that if this is disabled
       * then there is no filtering at all on the table, including fnFilter.
       * To just remove the filtering input use sDom and remove the 'f' option.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bFilter": null,
      /**
       * Used only for compatibility with DT1
       * @deprecated
       */
      "bInfo": true,
      /**
       * Used only for compatibility with DT1
       * @deprecated
       */
      "bLengthChange": true,
      /**
       * Pagination enabled or not. Note that if this is disabled then length
       * changing must also be disabled.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bPaginate": null,
      /**
       * Processing indicator enable flag whenever DataTables is enacting a
       * user request - typically an Ajax request for server-side processing.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bProcessing": null,
      /**
       * Server-side processing enabled flag - when enabled DataTables will
       * get all data from the server for every draw - there is no filtering,
       * sorting or paging done on the client-side.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bServerSide": null,
      /**
       * Sorting enablement flag.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bSort": null,
      /**
       * Multi-column sorting
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bSortMulti": null,
      /**
       * Apply a class to the columns which are being sorted to provide a
       * visual highlight or not. This can slow things down when enabled since
       * there is a lot of DOM interaction.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bSortClasses": null,
      /**
       * State saving enablement flag.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bStateSave": null
    },
    /**
     * Scrolling settings for a table.
     */
    "oScroll": {
      /**
       * When the table is shorter in height than sScrollY, collapse the
       * table container down to the height of the table (when true).
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "bCollapse": null,
      /**
       * Width of the scrollbar for the web-browser's platform. Calculated
       * during table initialisation.
       */
      "iBarWidth": 0,
      /**
       * Viewport width for horizontal scrolling. Horizontal scrolling is
       * disabled if an empty string.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "sX": null,
      /**
       * Width to expand the table to when using x-scrolling. Typically you
       * should not need to use this.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       *  @deprecated
       */
      "sXInner": null,
      /**
       * Viewport height for vertical scrolling. Vertical scrolling is disabled
       * if an empty string.
       * Note that this parameter will be set by the initialisation routine. To
       * set a default use {@link DataTable.defaults}.
       */
      "sY": null
    },
    /**
     * Language information for the table.
     */
    "oLanguage": {
      /**
       * Information callback function. See
       * {@link DataTable.defaults.fnInfoCallback}
       */
      "fnInfoCallback": null
    },
    /**
     * Browser support parameters
     */
    "oBrowser": {
      /**
       * Determine if the vertical scrollbar is on the right or left of the
       * scrolling container - needed for rtl language layout, although not
       * all browsers move the scrollbar (Safari).
       */
      "bScrollbarLeft": false,
      /**
       * Browser scrollbar width
       */
      "barWidth": 0
    },
    "ajax": null,
    /**
     * Array referencing the nodes which are used for the features. The
     * parameters of this object match what is allowed by sDom - i.e.
     *   <ul>
     *     <li>'l' - Length changing</li>
     *     <li>'f' - Filtering input</li>
     *     <li>'t' - The table!</li>
     *     <li>'i' - Information</li>
     *     <li>'p' - Pagination</li>
     *     <li>'r' - pRocessing</li>
     *   </ul>
     */
    "aanFeatures": [],
    /**
     * Store data information - see {@link DataTable.models.oRow} for detailed
     * information.
     */
    "aoData": [],
    /**
     * Array of indexes which are in the current display (after filtering etc)
     */
    "aiDisplay": [],
    /**
     * Array of indexes for display - no filtering
     */
    "aiDisplayMaster": [],
    /**
     * Map of row ids to data indexes
     */
    "aIds": {},
    /**
     * Store information about each column that is in use
     */
    "aoColumns": [],
    /**
     * Store information about the table's header
     */
    "aoHeader": [],
    /**
     * Store information about the table's footer
     */
    "aoFooter": [],
    /**
     * Store the applied global search information in case we want to force a
     * research or compare the old search to a new one.
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "oPreviousSearch": {},
    /**
     * Store for named searches
     */
    searchFixed: {},
    /**
     * Store the applied search for each column - see
     * {@link DataTable.models.oSearch} for the format that is used for the
     * filtering information for each column.
     */
    "aoPreSearchCols": [],
    /**
     * Sorting that is applied to the table. Note that the inner arrays are
     * used in the following manner:
     * <ul>
     *   <li>Index 0 - column number</li>
     *   <li>Index 1 - current sorting direction</li>
     * </ul>
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "aaSorting": null,
    /**
     * Sorting that is always applied to the table (i.e. prefixed in front of
     * aaSorting).
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "aaSortingFixed": [],
    /**
     * If restoring a table - we should restore its width
     */
    "sDestroyWidth": 0,
    /**
     * Callback functions array for every time a row is inserted (i.e. on a draw).
     */
    "aoRowCallback": [],
    /**
     * Callback functions for the header on each draw.
     */
    "aoHeaderCallback": [],
    /**
     * Callback function for the footer on each draw.
     */
    "aoFooterCallback": [],
    /**
     * Array of callback functions for draw callback functions
     */
    "aoDrawCallback": [],
    /**
     * Array of callback functions for row created function
     */
    "aoRowCreatedCallback": [],
    /**
     * Callback functions for just before the table is redrawn. A return of
     * false will be used to cancel the draw.
     */
    "aoPreDrawCallback": [],
    /**
     * Callback functions for when the table has been initialised.
     */
    "aoInitComplete": [],
    /**
     * Callbacks for modifying the settings to be stored for state saving, prior to
     * saving state.
     */
    "aoStateSaveParams": [],
    /**
     * Callbacks for modifying the settings that have been stored for state saving
     * prior to using the stored values to restore the state.
     */
    "aoStateLoadParams": [],
    /**
     * Callbacks for operating on the settings object once the saved state has been
     * loaded
     */
    "aoStateLoaded": [],
    /**
     * Cache the table ID for quick access
     */
    "sTableId": "",
    /**
     * The TABLE node for the main table
     */
    "nTable": null,
    /**
     * Permanent ref to the thead element
     */
    "nTHead": null,
    /**
     * Permanent ref to the tfoot element - if it exists
     */
    "nTFoot": null,
    /**
     * Permanent ref to the tbody element
     */
    "nTBody": null,
    /**
     * Cache the wrapper node (contains all DataTables controlled elements)
     */
    "nTableWrapper": null,
    /**
     * Indicate if all required information has been read in
     */
    "bInitialised": false,
    /**
     * Information about open rows. Each object in the array has the parameters
     * 'nTr' and 'nParent'
     */
    "aoOpenRows": [],
    /**
     * Dictate the positioning of DataTables' control elements - see
     * {@link DataTable.model.oInit.sDom}.
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "sDom": null,
    /**
     * Search delay (in mS)
     */
    "searchDelay": null,
    /**
     * Which type of pagination should be used.
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "sPaginationType": "two_button",
    /**
     * Number of paging controls on the page. Only used for backwards compatibility
     */
    pagingControls: 0,
    /**
     * The state duration (for `stateSave`) in seconds.
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "iStateDuration": 0,
    /**
     * Array of callback functions for state saving. Each array element is an
     * object with the following parameters:
     *   <ul>
     *     <li>function:fn - function to call. Takes two parameters, oSettings
     *       and the JSON string to save that has been thus far created. Returns
     *       a JSON string to be inserted into a json object
     *       (i.e. '"param": [ 0, 1, 2]')</li>
     *     <li>string:sName - name of callback</li>
     *   </ul>
     */
    "aoStateSave": [],
    /**
     * Array of callback functions for state loading. Each array element is an
     * object with the following parameters:
     *   <ul>
     *     <li>function:fn - function to call. Takes two parameters, oSettings
     *       and the object stored. May return false to cancel state loading</li>
     *     <li>string:sName - name of callback</li>
     *   </ul>
     */
    "aoStateLoad": [],
    /**
     * State that was saved. Useful for back reference
     */
    "oSavedState": null,
    /**
     * State that was loaded. Useful for back reference
     */
    "oLoadedState": null,
    /**
     * Note if draw should be blocked while getting data
     */
    "bAjaxDataGet": true,
    /**
     * The last jQuery XHR object that was used for server-side data gathering.
     * This can be used for working with the XHR information in one of the
     * callbacks
     */
    "jqXHR": null,
    /**
     * JSON returned from the server in the last Ajax request
     */
    "json": void 0,
    /**
     * Data submitted as part of the last Ajax request
     */
    "oAjaxData": void 0,
    /**
     * Send the XHR HTTP method - GET or POST (could be PUT or DELETE if
     * required).
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "sServerMethod": null,
    /**
     * Format numbers for display.
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "fnFormatNumber": null,
    /**
     * List of options that can be used for the user selectable length menu.
     * Note that this parameter will be set by the initialisation routine. To
     * set a default use {@link DataTable.defaults}.
     */
    "aLengthMenu": null,
    /**
     * Counter for the draws that the table does. Also used as a tracker for
     * server-side processing
     */
    "iDraw": 0,
    /**
     * Indicate if a redraw is being done - useful for Ajax
     */
    "bDrawing": false,
    /**
     * Draw index (iDraw) of the last error when parsing the returned data
     */
    "iDrawError": -1,
    /**
     * Paging display length
     */
    "_iDisplayLength": 10,
    /**
     * Paging start point - aiDisplay index
     */
    "_iDisplayStart": 0,
    /**
     * Server-side processing - number of records in the result set
     * (i.e. before filtering), Use fnRecordsTotal rather than
     * this property to get the value of the number of records, regardless of
     * the server-side processing setting.
     */
    "_iRecordsTotal": 0,
    /**
     * Server-side processing - number of records in the current display set
     * (i.e. after filtering). Use fnRecordsDisplay rather than
     * this property to get the value of the number of records, regardless of
     * the server-side processing setting.
     */
    "_iRecordsDisplay": 0,
    /**
     * The classes to use for the table
     */
    "oClasses": {},
    /**
     * Flag attached to the settings object so you can check in the draw
     * callback if filtering has been done in the draw. Deprecated in favour of
     * events.
     *  @deprecated
     */
    "bFiltered": false,
    /**
     * Flag attached to the settings object so you can check in the draw
     * callback if sorting has been done in the draw. Deprecated in favour of
     * events.
     *  @deprecated
     */
    "bSorted": false,
    /**
     * Indicate that if multiple rows are in the header and there is more than
     * one unique cell per column. Replaced by titleRow
     */
    "bSortCellsTop": null,
    /**
     * Initialisation object that is used for the table
     */
    "oInit": null,
    /**
     * Destroy callback functions - for plug-ins to attach themselves to the
     * destroy so they can clean up markup and events.
     */
    "aoDestroyCallback": [],
    /**
     * Get the number of records in the current record set, before filtering
     */
    "fnRecordsTotal": function() {
      return _fnDataSource(this) == "ssp" ? this._iRecordsTotal * 1 : this.aiDisplayMaster.length;
    },
    /**
     * Get the number of records in the current record set, after filtering
     */
    "fnRecordsDisplay": function() {
      return _fnDataSource(this) == "ssp" ? this._iRecordsDisplay * 1 : this.aiDisplay.length;
    },
    /**
     * Get the display end point - aiDisplay index
     */
    "fnDisplayEnd": function() {
      var len = this._iDisplayLength, start = this._iDisplayStart, calc = start + len, records = this.aiDisplay.length, features = this.oFeatures, paginate = features.bPaginate;
      if (features.bServerSide) {
        return paginate === false || len === -1 ? start + records : Math.min(start + len, this._iRecordsDisplay);
      } else {
        return !paginate || calc > records || len === -1 ? records : calc;
      }
    },
    /**
     * The DataTables object for this table
     */
    "oInstance": null,
    /**
     * Unique identifier for each instance of the DataTables object. If there
     * is an ID on the table node, then it takes that value, otherwise an
     * incrementing internal counter is used.
     */
    "sInstance": null,
    /**
     * tabindex attribute value that is added to DataTables control elements, allowing
     * keyboard navigation of the table and its controls.
     */
    "iTabIndex": 0,
    /**
     * DIV container for the footer scrolling table if scrolling
     */
    "nScrollHead": null,
    /**
     * DIV container for the footer scrolling table if scrolling
     */
    "nScrollFoot": null,
    /**
     * Last applied sort
     */
    "aLastSort": [],
    /**
     * Stored plug-in instances
     */
    "oPlugins": {},
    /**
     * Function used to get a row's id from the row's data
     */
    "rowIdFn": null,
    /**
     * Data location where to store a row's id
     */
    "rowId": null,
    caption: "",
    captionNode: null,
    colgroup: null,
    /** Delay loading of data */
    deferLoading: null,
    /** Allow auto type detection */
    typeDetect: true,
    /** ResizeObserver for the container div */
    resizeObserver: null,
    /** Keep a record of the last size of the container, so we can skip duplicates */
    containerWidth: -1,
    /** Reverse the initial order of the data set on desc ordering */
    orderDescReverse: null,
    /** Show / hide ordering indicators in headers */
    orderIndicators: true,
    /** Default ordering listener */
    orderHandler: true,
    /** Title row indicator */
    titleRow: null,
    /** Title wrapper element type */
    columnTitleTag: "span"
  };
  var extPagination = DataTable.ext.pager;
  $.extend(extPagination, {
    simple: function() {
      return ["previous", "next"];
    },
    full: function() {
      return ["first", "previous", "next", "last"];
    },
    numbers: function() {
      return ["numbers"];
    },
    simple_numbers: function() {
      return ["previous", "numbers", "next"];
    },
    full_numbers: function() {
      return ["first", "previous", "numbers", "next", "last"];
    },
    first_last: function() {
      return ["first", "last"];
    },
    first_last_numbers: function() {
      return ["first", "numbers", "last"];
    },
    // For testing and plug-ins to use
    _numbers: _pagingNumbers,
    // Number of number buttons - legacy, use `numbers` option for paging feature
    numbers_length: 7
  });
  $.extend(true, DataTable.ext.renderer, {
    pagingButton: {
      _: function(settings, buttonType, content, active, disabled) {
        var classes = settings.oClasses.paging;
        var btnClasses = [classes.button];
        var btn;
        if (active) {
          btnClasses.push(classes.active);
        }
        if (disabled) {
          btnClasses.push(classes.disabled);
        }
        if (buttonType === "ellipsis") {
          btn = $('<span class="ellipsis"></span>').html(content)[0];
        } else {
          btn = $("<button>", {
            class: btnClasses.join(" "),
            role: "link",
            type: "button"
          }).html(content);
        }
        return {
          display: btn,
          clicker: btn
        };
      }
    },
    pagingContainer: {
      _: function(settings, buttons) {
        return buttons;
      }
    }
  });
  var _filterString = function(stripHtml, normalize) {
    return function(str) {
      if (_empty(str) || typeof str !== "string") {
        return str;
      }
      str = str.replace(_re_new_lines, " ");
      if (stripHtml) {
        str = _stripHtml(str);
      }
      if (normalize) {
        str = _normalize(str, false);
      }
      return str;
    };
  };
  function __mld(dtLib, momentFn, luxonFn, dateFn, arg1) {
    if (__moment) {
      return dtLib[momentFn](arg1);
    } else if (__luxon) {
      return dtLib[luxonFn](arg1);
    }
    return dateFn ? dtLib[dateFn](arg1) : dtLib;
  }
  var __mlWarning = false;
  var __luxon;
  var __moment;
  function resolveWindowLibs() {
    if (window.luxon && !__luxon) {
      __luxon = window.luxon;
    }
    if (window.moment && !__moment) {
      __moment = window.moment;
    }
  }
  function __mldObj(d, format, locale) {
    var dt;
    resolveWindowLibs();
    if (__moment) {
      dt = __moment.utc(d, format, locale, true);
      if (!dt.isValid()) {
        return null;
      }
    } else if (__luxon) {
      dt = format && typeof d === "string" ? __luxon.DateTime.fromFormat(d, format) : __luxon.DateTime.fromISO(d);
      if (!dt.isValid) {
        return null;
      }
      dt = dt.setLocale(locale);
    } else if (!format) {
      dt = new Date(d);
    } else {
      if (!__mlWarning) {
        alert("DataTables warning: Formatted date without Moment.js or Luxon - https://datatables.net/tn/17");
      }
      __mlWarning = true;
    }
    return dt;
  }
  function __mlHelper(localeString) {
    return function(from, to, locale, def) {
      if (arguments.length === 0) {
        locale = "en";
        to = null;
        from = null;
      } else if (arguments.length === 1) {
        locale = "en";
        to = from;
        from = null;
      } else if (arguments.length === 2) {
        locale = to;
        to = from;
        from = null;
      }
      var typeName = "datetime" + (to ? "-" + to : "");
      if (!DataTable.ext.type.order[typeName + "-pre"]) {
        DataTable.type(typeName, {
          detect: function(d) {
            return d === typeName ? typeName : false;
          },
          order: {
            pre: function(d) {
              return d.valueOf();
            }
          },
          className: "dt-right"
        });
      }
      return function(d, type) {
        if (d === null || d === void 0) {
          if (def === "--now") {
            var local = /* @__PURE__ */ new Date();
            d = new Date(Date.UTC(
              local.getFullYear(),
              local.getMonth(),
              local.getDate(),
              local.getHours(),
              local.getMinutes(),
              local.getSeconds()
            ));
          } else {
            d = "";
          }
        }
        if (type === "type") {
          return typeName;
        }
        if (d === "") {
          return type !== "sort" ? "" : __mldObj("0000-01-01 00:00:00", null, locale);
        }
        if (to !== null && from === to && type !== "sort" && type !== "type" && !(d instanceof Date)) {
          return d;
        }
        var dt = __mldObj(d, from, locale);
        if (dt === null) {
          return d;
        }
        if (type === "sort") {
          return dt;
        }
        var formatted = to === null ? __mld(dt, "toDate", "toJSDate", "")[localeString](
          navigator.language,
          { timeZone: "UTC" }
        ) : __mld(dt, "format", "toFormat", "toISOString", to);
        return type === "display" ? _escapeHtml(formatted) : formatted;
      };
    };
  }
  var __thousands = ",";
  var __decimal = ".";
  if (window.Intl !== void 0) {
    try {
      num = new Intl.NumberFormat().formatToParts(100000.1);
      for (i = 0; i < num.length; i++) {
        if (num[i].type === "group") {
          __thousands = num[i].value;
        } else if (num[i].type === "decimal") {
          __decimal = num[i].value;
        }
      }
    } catch (e) {
    }
  }
  var num;
  var i;
  DataTable.datetime = function(format, locale) {
    var typeName = "datetime-" + format;
    if (!locale) {
      locale = "en";
    }
    if (!DataTable.ext.type.order[typeName]) {
      DataTable.type(typeName, {
        detect: function(d) {
          var dt = __mldObj(d, format, locale);
          return d === "" || dt ? typeName : false;
        },
        order: {
          pre: function(d) {
            return __mldObj(d, format, locale) || 0;
          }
        },
        className: "dt-right"
      });
    }
  };
  DataTable.render = {
    date: __mlHelper("toLocaleDateString"),
    datetime: __mlHelper("toLocaleString"),
    time: __mlHelper("toLocaleTimeString"),
    number: function(thousands, decimal, precision, prefix, postfix) {
      if (thousands === null || thousands === void 0) {
        thousands = __thousands;
      }
      if (decimal === null || decimal === void 0) {
        decimal = __decimal;
      }
      return {
        display: function(d) {
          if (typeof d !== "number" && typeof d !== "string") {
            return d;
          }
          if (d === "" || d === null) {
            return d;
          }
          var negative = d < 0 ? "-" : "";
          var flo = parseFloat(d);
          var abs = Math.abs(flo);
          if (abs >= 1e11 || abs < 1e-4 && abs !== 0) {
            var exp = flo.toExponential(precision).split(/e\+?/);
            return exp[0] + " x 10<sup>" + exp[1] + "</sup>";
          }
          if (isNaN(flo)) {
            return _escapeHtml(d);
          }
          flo = flo.toFixed(precision);
          d = Math.abs(flo);
          var intPart = parseInt(d, 10);
          var floatPart = precision ? decimal + (d - intPart).toFixed(precision).substring(2) : "";
          if (intPart === 0 && parseFloat(floatPart) === 0) {
            negative = "";
          }
          return negative + (prefix || "") + intPart.toString().replace(
            /\B(?=(\d{3})+(?!\d))/g,
            thousands
          ) + floatPart + (postfix || "");
        }
      };
    },
    text: function() {
      return {
        display: _escapeHtml,
        filter: _escapeHtml
      };
    }
  };
  var _extTypes = DataTable.ext.type;
  DataTable.type = function(name, prop, val) {
    if (!prop) {
      return {
        className: _extTypes.className[name],
        detect: _extTypes.detect.find(function(fn) {
          return fn._name === name;
        }),
        order: {
          pre: _extTypes.order[name + "-pre"],
          asc: _extTypes.order[name + "-asc"],
          desc: _extTypes.order[name + "-desc"]
        },
        render: _extTypes.render[name],
        search: _extTypes.search[name]
      };
    }
    var setProp = function(prop2, propVal) {
      _extTypes[prop2][name] = propVal;
    };
    var setDetect = function(detect) {
      Object.defineProperty(detect, "_name", { value: name });
      var idx = _extTypes.detect.findIndex(function(item) {
        return item._name === name;
      });
      if (idx === -1) {
        _extTypes.detect.unshift(detect);
      } else {
        _extTypes.detect.splice(idx, 1, detect);
      }
    };
    var setOrder2 = function(obj) {
      _extTypes.order[name + "-pre"] = obj.pre;
      _extTypes.order[name + "-asc"] = obj.asc;
      _extTypes.order[name + "-desc"] = obj.desc;
    };
    if (val === void 0) {
      val = prop;
      prop = null;
    }
    if (prop === "className") {
      setProp("className", val);
    } else if (prop === "detect") {
      setDetect(val);
    } else if (prop === "order") {
      setOrder2(val);
    } else if (prop === "render") {
      setProp("render", val);
    } else if (prop === "search") {
      setProp("search", val);
    } else if (!prop) {
      if (val.className) {
        setProp("className", val.className);
      }
      if (val.detect !== void 0) {
        setDetect(val.detect);
      }
      if (val.order) {
        setOrder2(val.order);
      }
      if (val.render !== void 0) {
        setProp("render", val.render);
      }
      if (val.search !== void 0) {
        setProp("search", val.search);
      }
    }
  };
  DataTable.types = function() {
    return _extTypes.detect.map(function(fn) {
      return fn._name;
    });
  };
  var __diacriticSort = function(a, b) {
    a = a !== null && a !== void 0 ? a.toString().toLowerCase() : "";
    b = b !== null && b !== void 0 ? b.toString().toLowerCase() : "";
    return a.localeCompare(b, navigator.languages[0] || navigator.language, {
      numeric: true,
      ignorePunctuation: true
    });
  };
  var __diacriticHtmlSort = function(a, b) {
    a = _stripHtml(a);
    b = _stripHtml(b);
    return __diacriticSort(a, b);
  };
  DataTable.type("string", {
    detect: function() {
      return "string";
    },
    order: {
      pre: function(a) {
        return _empty(a) && typeof a !== "boolean" ? "" : typeof a === "string" ? a.toLowerCase() : !a.toString ? "" : a.toString();
      }
    },
    search: _filterString(false, true)
  });
  DataTable.type("string-utf8", {
    detect: {
      allOf: function(d) {
        return true;
      },
      oneOf: function(d) {
        return !_empty(d) && navigator.languages && typeof d === "string" && d.match(/[^\x00-\x7F]/);
      }
    },
    order: {
      asc: __diacriticSort,
      desc: function(a, b) {
        return __diacriticSort(a, b) * -1;
      }
    },
    search: _filterString(false, true)
  });
  DataTable.type("html", {
    detect: {
      allOf: function(d) {
        return _empty(d) || typeof d === "string" && d.indexOf("<") !== -1;
      },
      oneOf: function(d) {
        return !_empty(d) && typeof d === "string" && d.indexOf("<") !== -1;
      }
    },
    order: {
      pre: function(a) {
        return _empty(a) ? "" : a.replace ? _stripHtml(a).trim().toLowerCase() : a + "";
      }
    },
    search: _filterString(true, true)
  });
  DataTable.type("html-utf8", {
    detect: {
      allOf: function(d) {
        return _empty(d) || typeof d === "string" && d.indexOf("<") !== -1;
      },
      oneOf: function(d) {
        return navigator.languages && !_empty(d) && typeof d === "string" && d.indexOf("<") !== -1 && typeof d === "string" && d.match(/[^\x00-\x7F]/);
      }
    },
    order: {
      asc: __diacriticHtmlSort,
      desc: function(a, b) {
        return __diacriticHtmlSort(a, b) * -1;
      }
    },
    search: _filterString(true, true)
  });
  DataTable.type("date", {
    className: "dt-type-date",
    detect: {
      allOf: function(d) {
        if (d && !(d instanceof Date) && !_re_date.test(d)) {
          return null;
        }
        var parsed = Date.parse(d);
        return parsed !== null && !isNaN(parsed) || _empty(d);
      },
      oneOf: function(d) {
        return d instanceof Date || typeof d === "string" && _re_date.test(d);
      }
    },
    order: {
      pre: function(d) {
        var ts = Date.parse(d);
        return isNaN(ts) ? -Infinity : ts;
      }
    }
  });
  DataTable.type("html-num-fmt", {
    className: "dt-type-numeric",
    detect: {
      allOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _htmlNumeric(d, decimal, true, false);
      },
      oneOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _htmlNumeric(d, decimal, true, false);
      }
    },
    order: {
      pre: function(d, s) {
        var dp = s.oLanguage.sDecimal;
        return __numericReplace(d, dp, _re_html, _re_formatted_numeric);
      }
    },
    search: _filterString(true, true)
  });
  DataTable.type("html-num", {
    className: "dt-type-numeric",
    detect: {
      allOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _htmlNumeric(d, decimal, false, true);
      },
      oneOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _htmlNumeric(d, decimal, false, false);
      }
    },
    order: {
      pre: function(d, s) {
        var dp = s.oLanguage.sDecimal;
        return __numericReplace(d, dp, _re_html);
      }
    },
    search: _filterString(true, true)
  });
  DataTable.type("num-fmt", {
    className: "dt-type-numeric",
    detect: {
      allOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _isNumber(d, decimal, true, true);
      },
      oneOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _isNumber(d, decimal, true, false);
      }
    },
    order: {
      pre: function(d, s) {
        var dp = s.oLanguage.sDecimal;
        return __numericReplace(d, dp, _re_formatted_numeric);
      }
    }
  });
  DataTable.type("num", {
    className: "dt-type-numeric",
    detect: {
      allOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _isNumber(d, decimal, false, true);
      },
      oneOf: function(d, settings) {
        var decimal = settings.oLanguage.sDecimal;
        return _isNumber(d, decimal, false, false);
      }
    },
    order: {
      pre: function(d, s) {
        var dp = s.oLanguage.sDecimal;
        return __numericReplace(d, dp);
      }
    }
  });
  var __numericReplace = function(d, decimalPlace, re1, re2) {
    if (d !== 0 && (!d || d === "-")) {
      return -Infinity;
    }
    var type = typeof d;
    if (type === "number" || type === "bigint") {
      return d;
    }
    if (decimalPlace) {
      d = _numToDecimal(d, decimalPlace);
    }
    if (d.replace) {
      if (re1) {
        d = d.replace(re1, "");
      }
      if (re2) {
        d = d.replace(re2, "");
      }
    }
    return d * 1;
  };
  $.extend(true, DataTable.ext.renderer, {
    footer: {
      _: function(settings, cell, classes) {
        cell.addClass(classes.tfoot.cell);
      }
    },
    header: {
      _: function(settings, cell, classes) {
        cell.addClass(classes.thead.cell);
        if (!settings.oFeatures.bSort) {
          cell.addClass(classes.order.none);
        }
        var titleRow = settings.titleRow;
        var headerRows = cell.closest("thead").find("tr");
        var rowIdx = cell.parent().index();
        if (
          // Cells and rows which have the attribute to disable the icons
          cell.attr("data-dt-order") === "disable" || cell.parent().attr("data-dt-order") === "disable" || // titleRow support, for defining a specific row in the header
          titleRow === true && rowIdx !== 0 || titleRow === false && rowIdx !== headerRows.length - 1 || typeof titleRow === "number" && rowIdx !== titleRow
        ) {
          return;
        }
        $(settings.nTable).on("order.dt.DT column-visibility.dt.DT", function(e, ctx, column) {
          if (settings !== ctx) {
            return;
          }
          var sorting = ctx.sortDetails;
          if (!sorting) {
            return;
          }
          var orderedColumns = _pluck(sorting, "col");
          if (e.type === "column-visibility" && !orderedColumns.includes(column)) {
            return;
          }
          var i;
          var orderClasses = classes.order;
          var columns = ctx.api.columns(cell);
          var col = settings.aoColumns[columns.flatten()[0]];
          var orderable = columns.orderable().includes(true);
          var ariaType = "";
          var indexes = columns.indexes();
          var sortDirs = columns.orderable(true).flatten();
          var tabIndex = settings.iTabIndex;
          var canOrder = ctx.orderHandler && orderable;
          cell.removeClass(
            orderClasses.isAsc + " " + orderClasses.isDesc
          ).toggleClass(orderClasses.none, !orderable).toggleClass(orderClasses.canAsc, canOrder && sortDirs.includes("asc")).toggleClass(orderClasses.canDesc, canOrder && sortDirs.includes("desc"));
          var isOrdering = true;
          for (i = 0; i < indexes.length; i++) {
            if (!orderedColumns.includes(indexes[i])) {
              isOrdering = false;
            }
          }
          if (isOrdering) {
            var orderDirs = columns.order();
            cell.addClass(
              orderDirs.includes("asc") ? orderClasses.isAsc : "" + orderDirs.includes("desc") ? orderClasses.isDesc : ""
            );
          }
          var firstVis = -1;
          for (i = 0; i < orderedColumns.length; i++) {
            if (settings.aoColumns[orderedColumns[i]].bVisible) {
              firstVis = orderedColumns[i];
              break;
            }
          }
          if (indexes[0] == firstVis) {
            var firstSort = sorting[0];
            var sortOrder = col.asSorting;
            cell.attr("aria-sort", firstSort.dir === "asc" ? "ascending" : "descending");
            ariaType = !sortOrder[firstSort.index + 1] ? "Remove" : "Reverse";
          } else {
            cell.removeAttr("aria-sort");
          }
          if (orderable) {
            var orderSpan = cell.find(".dt-column-order");
            orderSpan.attr("role", "button").attr(
              "aria-label",
              orderable ? col.ariaTitle + ctx.api.i18n("oAria.orderable" + ariaType) : col.ariaTitle
            );
            if (tabIndex !== -1) {
              orderSpan.attr("tabindex", tabIndex);
            }
          }
        });
      }
    },
    layout: {
      _: function(settings, container, items) {
        var classes = settings.oClasses.layout;
        var row = $("<div/>").attr("id", items.id || null).addClass(items.className || classes.row).appendTo(container);
        DataTable.ext.renderer.layout._forLayoutRow(items, function(key, val) {
          if (key === "id" || key === "className") {
            return;
          }
          var klass = "";
          if (val.table) {
            row.addClass(classes.tableRow);
            klass += classes.tableCell + " ";
          }
          if (key === "start") {
            klass += classes.start;
          } else if (key === "end") {
            klass += classes.end;
          } else {
            klass += classes.full;
          }
          $("<div/>").attr({
            id: val.id || null,
            "class": val.className ? val.className : classes.cell + " " + klass
          }).append(val.contents).appendTo(row);
        });
      },
      // Shared for use by the styling frameworks
      _forLayoutRow: function(items, fn) {
        var layoutEnum = function(x) {
          switch (x) {
            case "":
              return 0;
            case "start":
              return 1;
            case "end":
              return 2;
            default:
              return 3;
          }
        };
        Object.keys(items).sort(function(a, b) {
          return layoutEnum(a) - layoutEnum(b);
        }).forEach(function(key) {
          fn(key, items[key]);
        });
      }
    }
  });
  DataTable.feature = {};
  DataTable.feature.register = function(name, cb, legacy) {
    DataTable.ext.features[name] = cb;
    if (legacy) {
      _ext.feature.push({
        cFeature: legacy,
        fnInit: cb
      });
    }
  };
  function _divProp(el, prop, val) {
    if (val) {
      el[prop] = val;
    }
  }
  DataTable.feature.register("div", function(settings, opts) {
    var n = $("<div>")[0];
    if (opts) {
      _divProp(n, "className", opts.className);
      _divProp(n, "id", opts.id);
      _divProp(n, "innerHTML", opts.html);
      _divProp(n, "textContent", opts.text);
    }
    return n;
  });
  DataTable.feature.register("info", function(settings, opts) {
    if (!settings.oFeatures.bInfo) {
      return null;
    }
    var lang = settings.oLanguage, tid = settings.sTableId, n = $("<div/>", {
      "class": settings.oClasses.info.container
    });
    opts = $.extend({
      callback: lang.fnInfoCallback,
      empty: lang.sInfoEmpty,
      postfix: lang.sInfoPostFix,
      search: lang.sInfoFiltered,
      text: lang.sInfo
    }, opts);
    settings.aoDrawCallback.push(function(s) {
      _fnUpdateInfo(s, opts, n);
    });
    if (!settings._infoEl) {
      n.attr({
        "aria-live": "polite",
        id: tid + "_info",
        role: "status"
      });
      $(settings.nTable).attr("aria-describedby", tid + "_info");
      settings._infoEl = n;
    }
    return n;
  }, "i");
  function _fnUpdateInfo(settings, opts, node) {
    var start = settings._iDisplayStart + 1, end = settings.fnDisplayEnd(), max = settings.fnRecordsTotal(), total = settings.fnRecordsDisplay(), out = total ? opts.text : opts.empty;
    if (total !== max) {
      out += " " + opts.search;
    }
    out += opts.postfix;
    out = _fnMacros(settings, out);
    if (opts.callback) {
      out = opts.callback.call(
        settings.oInstance,
        settings,
        start,
        end,
        max,
        total,
        out
      );
    }
    node.html(out);
    _fnCallbackFire(settings, null, "info", [settings, node[0], out]);
  }
  var __searchCounter = 0;
  DataTable.feature.register("search", function(settings, opts) {
    if (!settings.oFeatures.bFilter) {
      return null;
    }
    var classes = settings.oClasses.search;
    var tableId = settings.sTableId;
    var language = settings.oLanguage;
    var previousSearch = settings.oPreviousSearch;
    var input = '<input type="search" class="' + classes.input + '"/>';
    opts = $.extend({
      placeholder: language.sSearchPlaceholder,
      processing: false,
      text: language.sSearch
    }, opts);
    if (opts.text.indexOf("_INPUT_") === -1) {
      opts.text += "_INPUT_";
    }
    opts.text = _fnMacros(settings, opts.text);
    var end = opts.text.match(/_INPUT_$/);
    var start = opts.text.match(/^_INPUT_/);
    var removed = opts.text.replace(/_INPUT_/, "");
    var str = "<label>" + opts.text + "</label>";
    if (start) {
      str = "_INPUT_<label>" + removed + "</label>";
    } else if (end) {
      str = "<label>" + removed + "</label>_INPUT_";
    }
    var filter = $("<div>").addClass(classes.container).append(str.replace(/_INPUT_/, input));
    filter.find("label").attr("for", "dt-search-" + __searchCounter);
    filter.find("input").attr("id", "dt-search-" + __searchCounter);
    __searchCounter++;
    var searchFn = function(event) {
      var val = this.value;
      if (previousSearch.return && event.key !== "Enter") {
        return;
      }
      if (val != previousSearch.search) {
        _fnProcessingRun(settings, opts.processing, function() {
          previousSearch.search = val;
          _fnFilterComplete(settings, previousSearch);
          settings._iDisplayStart = 0;
          _fnDraw(settings);
        });
      }
    };
    var searchDelay = settings.searchDelay !== null ? settings.searchDelay : 0;
    var jqFilter = $("input", filter).val(previousSearch.search).attr("placeholder", opts.placeholder).on(
      "keyup.DT search.DT input.DT paste.DT cut.DT",
      searchDelay ? DataTable.util.debounce(searchFn, searchDelay) : searchFn
    ).on("mouseup.DT", function(e) {
      setTimeout(function() {
        searchFn.call(jqFilter[0], e);
      }, 10);
    }).on("keypress.DT", function(e) {
      if (e.keyCode == 13) {
        return false;
      }
    }).attr("aria-controls", tableId);
    $(settings.nTable).on("search.dt.DT", function(ev, s) {
      if (settings === s && jqFilter[0] !== document.activeElement) {
        jqFilter.val(
          typeof previousSearch.search !== "function" ? previousSearch.search : ""
        );
      }
    });
    return filter;
  }, "f");
  DataTable.feature.register("paging", function(settings, opts) {
    if (!settings.oFeatures.bPaginate) {
      return null;
    }
    opts = $.extend({
      buttons: DataTable.ext.pager.numbers_length,
      type: settings.sPaginationType,
      boundaryNumbers: true,
      firstLast: true,
      previousNext: true,
      numbers: true
    }, opts);
    var host = $("<div/>").addClass(settings.oClasses.paging.container + (opts.type ? " paging_" + opts.type : "")).append(
      $("<nav>").attr("aria-label", "pagination").addClass(settings.oClasses.paging.nav)
    );
    var draw = function() {
      _pagingDraw(settings, host.children(), opts);
    };
    settings.aoDrawCallback.push(draw);
    $(settings.nTable).on("column-sizing.dt.DT", draw);
    return host;
  }, "p");
  function _pagingDynamic(opts) {
    var out = [];
    if (opts.numbers) {
      out.push("numbers");
    }
    if (opts.previousNext) {
      out.unshift("previous");
      out.push("next");
    }
    if (opts.firstLast) {
      out.unshift("first");
      out.push("last");
    }
    return out;
  }
  function _pagingDraw(settings, host, opts) {
    if (!settings._bInitComplete) {
      return;
    }
    var plugin = opts.type ? DataTable.ext.pager[opts.type] : _pagingDynamic, aria = settings.oLanguage.oAria.paginate || {}, start = settings._iDisplayStart, len = settings._iDisplayLength, visRecords = settings.fnRecordsDisplay(), all = len === -1, page = all ? 0 : Math.ceil(start / len), pages = all ? 1 : Math.ceil(visRecords / len), buttons = [], buttonEls = [], buttonsNested = plugin(opts).map(function(val) {
      return val === "numbers" ? _pagingNumbers(page, pages, opts.buttons, opts.boundaryNumbers) : val;
    });
    buttons = buttons.concat.apply(buttons, buttonsNested);
    for (var i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      var btnInfo = _pagingButtonInfo(settings, button, page, pages);
      var btn = _fnRenderer(settings, "pagingButton")(
        settings,
        button,
        btnInfo.display,
        btnInfo.active,
        btnInfo.disabled
      );
      var ariaLabel = typeof button === "string" ? aria[button] : aria.number ? aria.number + (button + 1) : null;
      $(btn.clicker).attr({
        "aria-controls": settings.sTableId,
        "aria-disabled": btnInfo.disabled ? "true" : null,
        "aria-current": btnInfo.active ? "page" : null,
        "aria-label": ariaLabel,
        "data-dt-idx": button,
        "tabIndex": btnInfo.disabled ? -1 : settings.iTabIndex && btn.clicker[0].nodeName.toLowerCase() !== "span" ? settings.iTabIndex : null
        // `0` doesn't need a tabIndex since it is the default
      });
      if (typeof button !== "number") {
        $(btn.clicker).addClass(button);
      }
      _fnBindAction(
        btn.clicker,
        { action: button },
        function(e) {
          e.preventDefault();
          _fnPageChange(settings, e.data.action, true);
        }
      );
      buttonEls.push(btn.display);
    }
    var wrapped = _fnRenderer(settings, "pagingContainer")(
      settings,
      buttonEls
    );
    var activeEl = host.find(document.activeElement).data("dt-idx");
    host.empty().append(wrapped);
    if (activeEl !== void 0) {
      host.find("[data-dt-idx=" + activeEl + "]").trigger("focus");
    }
    if (buttonEls.length) {
      var outerHeight = $(buttonEls[0]).outerHeight();
      if (opts.buttons > 1 && // prevent infinite
      outerHeight > 0 && // will be 0 if hidden
      $(host).height() >= outerHeight * 2 - 10) {
        _pagingDraw(settings, host, $.extend({}, opts, { buttons: opts.buttons - 2 }));
      }
    }
  }
  function _pagingButtonInfo(settings, button, page, pages) {
    var lang = settings.oLanguage.oPaginate;
    var o = {
      display: "",
      active: false,
      disabled: false
    };
    switch (button) {
      case "ellipsis":
        o.display = "&#x2026;";
        break;
      case "first":
        o.display = lang.sFirst;
        if (page === 0) {
          o.disabled = true;
        }
        break;
      case "previous":
        o.display = lang.sPrevious;
        if (page === 0) {
          o.disabled = true;
        }
        break;
      case "next":
        o.display = lang.sNext;
        if (pages === 0 || page === pages - 1) {
          o.disabled = true;
        }
        break;
      case "last":
        o.display = lang.sLast;
        if (pages === 0 || page === pages - 1) {
          o.disabled = true;
        }
        break;
      default:
        if (typeof button === "number") {
          o.display = settings.fnFormatNumber(button + 1);
          if (page === button) {
            o.active = true;
          }
        }
        break;
    }
    return o;
  }
  function _pagingNumbers(page, pages, buttons, addFirstLast) {
    var numbers = [], half = Math.floor(buttons / 2), before = addFirstLast ? 2 : 1, after = addFirstLast ? 1 : 0;
    if (pages <= buttons) {
      numbers = _range(0, pages);
    } else if (buttons === 1) {
      numbers = [page];
    } else if (buttons === 3) {
      if (page <= 1) {
        numbers = [0, 1, "ellipsis"];
      } else if (page >= pages - 2) {
        numbers = _range(pages - 2, pages);
        numbers.unshift("ellipsis");
      } else {
        numbers = ["ellipsis", page, "ellipsis"];
      }
    } else if (page <= half) {
      numbers = _range(0, buttons - before);
      numbers.push("ellipsis");
      if (addFirstLast) {
        numbers.push(pages - 1);
      }
    } else if (page >= pages - 1 - half) {
      numbers = _range(pages - (buttons - before), pages);
      numbers.unshift("ellipsis");
      if (addFirstLast) {
        numbers.unshift(0);
      }
    } else {
      numbers = _range(page - half + before, page + half - after);
      numbers.push("ellipsis");
      numbers.unshift("ellipsis");
      if (addFirstLast) {
        numbers.push(pages - 1);
        numbers.unshift(0);
      }
    }
    return numbers;
  }
  var __lengthCounter = 0;
  DataTable.feature.register("pageLength", function(settings, opts) {
    var features = settings.oFeatures;
    if (!features.bPaginate || !features.bLengthChange) {
      return null;
    }
    opts = $.extend({
      menu: settings.aLengthMenu,
      text: settings.oLanguage.sLengthMenu
    }, opts);
    var classes = settings.oClasses.length, tableId = settings.sTableId, menu = opts.menu, lengths = [], language = [], i;
    if (Array.isArray(menu[0])) {
      lengths = menu[0];
      language = menu[1];
    } else {
      for (i = 0; i < menu.length; i++) {
        if ($.isPlainObject(menu[i])) {
          lengths.push(menu[i].value);
          language.push(menu[i].label);
        } else {
          lengths.push(menu[i]);
          language.push(menu[i]);
        }
      }
    }
    var end = opts.text.match(/_MENU_$/);
    var start = opts.text.match(/^_MENU_/);
    var removed = opts.text.replace(/_MENU_/, "");
    var str = "<label>" + opts.text + "</label>";
    if (start) {
      str = "_MENU_<label>" + removed + "</label>";
    } else if (end) {
      str = "<label>" + removed + "</label>_MENU_";
    }
    var tmpId = "tmp-" + +/* @__PURE__ */ new Date();
    var div = $("<div/>").addClass(classes.container).append(
      str.replace("_MENU_", '<span id="' + tmpId + '"></span>')
    );
    var textNodes = [];
    Array.prototype.slice.call(div.find("label")[0].childNodes).forEach(function(el) {
      if (el.nodeType === Node.TEXT_NODE) {
        textNodes.push({
          el,
          text: el.textContent
        });
      }
    });
    var updateEntries = function(len) {
      textNodes.forEach(function(node) {
        node.el.textContent = _fnMacros(settings, node.text, len);
      });
    };
    var select = $("<select/>", {
      "aria-controls": tableId,
      "class": classes.select
    });
    for (i = 0; i < lengths.length; i++) {
      var label = settings.api.i18n("lengthLabels." + lengths[i], null);
      if (label === null) {
        label = typeof language[i] === "number" ? settings.fnFormatNumber(language[i]) : language[i];
      }
      select[0][i] = new Option(label, lengths[i]);
    }
    div.find("label").attr("for", "dt-length-" + __lengthCounter);
    select.attr("id", "dt-length-" + __lengthCounter);
    __lengthCounter++;
    div.find("#" + tmpId).replaceWith(select);
    $("select", div).val(settings._iDisplayLength).on("change.DT", function() {
      _fnLengthChange(settings, $(this).val());
      _fnDraw(settings);
    });
    $(settings.nTable).on("length.dt.DT", function(e, s, len) {
      if (settings === s) {
        $("select", div).val(len);
        updateEntries(len);
      }
    });
    updateEntries(settings._iDisplayLength);
    return div;
  }, "l");
  $.fn.dataTable = DataTable;
  DataTable.$ = $;
  $.fn.dataTableSettings = DataTable.settings;
  $.fn.dataTableExt = DataTable.ext;
  $.fn.DataTable = function(opts) {
    return $(this).dataTable(opts).api();
  };
  $.each(DataTable, function(prop, val) {
    $.fn.DataTable[prop] = val;
  });
  var dataTables_default = DataTable;

  // node_modules/datatables.net-dt/js/dataTables.dataTables.mjs
  var dataTables_dataTables_default = dataTables_default;

  // node_modules/datatables.net-buttons/js/dataTables.buttons.mjs
  var $2 = jquery_module_default;
  var _instCounter = 0;
  var _buttonCounter = 0;
  var _dtButtons = dataTables_default.ext.buttons;
  var _entityDecoder = null;
  function _fadeIn(el, duration, fn) {
    if ($2.fn.animate) {
      el.stop().fadeIn(duration, fn);
    } else {
      el.css("display", "block");
      if (fn) {
        fn.call(el);
      }
    }
  }
  function _fadeOut(el, duration, fn) {
    if ($2.fn.animate) {
      el.stop().fadeOut(duration, fn);
    } else {
      el.css("display", "none");
      if (fn) {
        fn.call(el);
      }
    }
  }
  var Buttons = function(dt, config) {
    if (!dataTables_default.versionCheck("2")) {
      throw "Warning: Buttons requires DataTables 2 or newer";
    }
    if (!(this instanceof Buttons)) {
      return function(settings) {
        return new Buttons(settings, dt).container();
      };
    }
    if (typeof config === "undefined") {
      config = {};
    }
    if (config === true) {
      config = {};
    }
    if (Array.isArray(config)) {
      config = { buttons: config };
    }
    this.c = $2.extend(true, {}, Buttons.defaults, config);
    if (config.buttons) {
      this.c.buttons = config.buttons;
    }
    this.s = {
      dt: new dataTables_default.Api(dt),
      buttons: [],
      listenKeys: "",
      namespace: "dtb" + _instCounter++
    };
    this.dom = {
      container: $2("<" + this.c.dom.container.tag + "/>").addClass(
        this.c.dom.container.className
      )
    };
    this._constructor();
  };
  $2.extend(Buttons.prototype, {
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Public methods
     */
    /**
     * Get the action of a button
     * @param  {int|string} Button index
     * @return {function}
     */
    /**
    * Set the action of a button
    * @param  {node} node Button element
    * @param  {function} action Function to set
    * @return {Buttons} Self for chaining
    */
    action: function(node, action) {
      var button = this._nodeToButton(node);
      if (action === void 0) {
        return button.conf.action;
      }
      button.conf.action = action;
      return this;
    },
    /**
     * Add an active class to the button to make to look active or get current
     * active state.
     * @param  {node} node Button element
     * @param  {boolean} [flag] Enable / disable flag
     * @return {Buttons} Self for chaining or boolean for getter
     */
    active: function(node, flag) {
      var button = this._nodeToButton(node);
      var klass = this.c.dom.button.active;
      var jqNode = $2(button.node);
      if (button.inCollection && this.c.dom.collection.button && this.c.dom.collection.button.active !== void 0) {
        klass = this.c.dom.collection.button.active;
      }
      if (flag === void 0) {
        return jqNode.hasClass(klass);
      }
      jqNode.toggleClass(klass, flag === void 0 ? true : flag);
      return this;
    },
    /**
     * Add a new button
     * @param {object} config Button configuration object, base string name or function
     * @param {int|string} [idx] Button index for where to insert the button
     * @param {boolean} [draw=true] Trigger a draw. Set a false when adding
     *   lots of buttons, until the last button.
     * @return {Buttons} Self for chaining
     */
    add: function(config, idx, draw) {
      var buttons = this.s.buttons;
      if (typeof idx === "string") {
        var split = idx.split("-");
        var base = this.s;
        for (var i = 0, ien = split.length - 1; i < ien; i++) {
          base = base.buttons[split[i] * 1];
        }
        buttons = base.buttons;
        idx = split[split.length - 1] * 1;
      }
      let node = this._expandButton(
        buttons,
        config,
        config !== void 0 ? config.split : void 0,
        (config === void 0 || config.split === void 0 || config.split.length === 0) && base !== void 0,
        false,
        idx
      );
      if (draw === void 0 || draw === true) {
        this._draw();
      }
      return node;
    },
    /**
     * Clear buttons from a collection and then insert new buttons
     */
    collectionRebuild: function(node, newButtons) {
      var button = this._nodeToButton(node);
      if (newButtons !== void 0) {
        var i;
        for (i = button.buttons.length - 1; i >= 0; i--) {
          this.remove(button.buttons[i].node);
        }
        if (button.conf.prefixButtons) {
          newButtons.unshift.apply(newButtons, button.conf.prefixButtons);
        }
        if (button.conf.postfixButtons) {
          newButtons.push.apply(newButtons, button.conf.postfixButtons);
        }
        for (i = 0; i < newButtons.length; i++) {
          var newBtn = newButtons[i];
          this._expandButton(
            button.buttons,
            newBtn,
            newBtn !== void 0 && newBtn.config !== void 0 && newBtn.config.split !== void 0,
            true,
            newBtn.parentConf !== void 0 && newBtn.parentConf.split !== void 0,
            null,
            newBtn.parentConf
          );
        }
      }
      this._draw(button.collection, button.buttons);
    },
    /**
     * Get the container node for the buttons
     * @return {jQuery} Buttons node
     */
    container: function() {
      return this.dom.container;
    },
    /**
     * Disable a button
     * @param  {node} node Button node
     * @return {Buttons} Self for chaining
     */
    disable: function(node) {
      var button = this._nodeToButton(node);
      if (button.isSplit) {
        $2(button.node.childNodes[0]).addClass(this.c.dom.button.disabled).prop("disabled", true);
      } else {
        $2(button.node).addClass(this.c.dom.button.disabled).prop("disabled", true);
      }
      button.disabled = true;
      this._checkSplitEnable();
      return this;
    },
    /**
     * Destroy the instance, cleaning up event handlers and removing DOM
     * elements
     * @return {Buttons} Self for chaining
     */
    destroy: function() {
      $2("body").off("keyup." + this.s.namespace);
      var buttons = this.s.buttons.slice();
      var i, ien;
      for (i = 0, ien = buttons.length; i < ien; i++) {
        this.remove(buttons[i].node);
      }
      this.dom.container.remove();
      var buttonInsts = this.s.dt.settings()[0];
      for (i = 0, ien = buttonInsts.length; i < ien; i++) {
        if (buttonInsts.inst === this) {
          buttonInsts.splice(i, 1);
          break;
        }
      }
      return this;
    },
    /**
     * Enable / disable a button
     * @param  {node} node Button node
     * @param  {boolean} [flag=true] Enable / disable flag
     * @return {Buttons} Self for chaining
     */
    enable: function(node, flag) {
      if (flag === false) {
        return this.disable(node);
      }
      var button = this._nodeToButton(node);
      if (button.isSplit) {
        $2(button.node.childNodes[0]).removeClass(this.c.dom.button.disabled).prop("disabled", false);
      } else {
        $2(button.node).removeClass(this.c.dom.button.disabled).prop("disabled", false);
      }
      button.disabled = false;
      this._checkSplitEnable();
      return this;
    },
    /**
     * Get a button's index
     *
     * This is internally recursive
     * @param {element} node Button to get the index of
     * @return {string} Button index
     */
    index: function(node, nested, buttons) {
      if (!nested) {
        nested = "";
        buttons = this.s.buttons;
      }
      for (var i = 0, ien = buttons.length; i < ien; i++) {
        var inner = buttons[i].buttons;
        if (buttons[i].node === node) {
          return nested + i;
        }
        if (inner && inner.length) {
          var match = this.index(node, i + "-", inner);
          if (match !== null) {
            return match;
          }
        }
      }
      return null;
    },
    /**
     * Get the instance name for the button set selector
     * @return {string} Instance name
     */
    name: function() {
      return this.c.name;
    },
    /**
     * Get a button's node of the buttons container if no button is given
     * @param  {node} [node] Button node
     * @return {jQuery} Button element, or container
     */
    node: function(node) {
      if (!node) {
        return this.dom.container;
      }
      var button = this._nodeToButton(node);
      return $2(button.node);
    },
    /**
     * Set / get a processing class on the selected button
     * @param {element} node Triggering button node
     * @param  {boolean} flag true to add, false to remove, undefined to get
     * @return {boolean|Buttons} Getter value or this if a setter.
     */
    processing: function(node, flag) {
      var dt = this.s.dt;
      var button = this._nodeToButton(node);
      if (flag === void 0) {
        return $2(button.node).hasClass("processing");
      }
      $2(button.node).toggleClass("processing", flag);
      $2(dt.table().node()).triggerHandler("buttons-processing.dt", [
        flag,
        dt.button(node),
        dt,
        $2(node),
        button.conf
      ]);
      return this;
    },
    /**
     * Remove a button.
     * @param  {node} node Button node
     * @return {Buttons} Self for chaining
     */
    remove: function(node) {
      var button = this._nodeToButton(node);
      var host = this._nodeToHost(node);
      var dt = this.s.dt;
      if (button.buttons.length) {
        for (var i = button.buttons.length - 1; i >= 0; i--) {
          this.remove(button.buttons[i].node);
        }
      }
      button.conf.destroying = true;
      if (button.conf.destroy) {
        button.conf.destroy.call(dt.button(node), dt, $2(node), button.conf);
      }
      this._removeKey(button.conf);
      $2(button.node).remove();
      if (button.inserter) {
        $2(button.inserter).remove();
      }
      var idx = $2.inArray(button, host);
      host.splice(idx, 1);
      return this;
    },
    /**
     * Get the text for a button
     * @param  {int|string} node Button index
     * @return {string} Button text
     */
    /**
    * Set the text for a button
    * @param  {int|string|function} node Button index
    * @param  {string} label Text
    * @return {Buttons} Self for chaining
    */
    text: function(node, label) {
      var button = this._nodeToButton(node);
      var textNode = button.textNode;
      var dt = this.s.dt;
      var jqNode = $2(button.node);
      var text = function(opt) {
        return typeof opt === "function" ? opt(dt, jqNode, button.conf) : opt;
      };
      if (label === void 0) {
        return text(button.conf.text);
      }
      button.conf.text = label;
      textNode.html(text(label));
      return this;
    },
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Constructor
     */
    /**
     * Buttons constructor
     * @private
     */
    _constructor: function() {
      var that = this;
      var dt = this.s.dt;
      var dtSettings = dt.settings()[0];
      var buttons = this.c.buttons;
      if (!dtSettings._buttons) {
        dtSettings._buttons = [];
      }
      dtSettings._buttons.push({
        inst: this,
        name: this.c.name
      });
      for (var i = 0, ien = buttons.length; i < ien; i++) {
        this.add(buttons[i]);
      }
      dt.on("destroy", function(e, settings) {
        if (settings === dtSettings) {
          that.destroy();
        }
      });
      $2("body").on("keyup." + this.s.namespace, function(e) {
        if (!document.activeElement || document.activeElement === document.body) {
          var character = String.fromCharCode(e.keyCode).toLowerCase();
          if (that.s.listenKeys.toLowerCase().indexOf(character) !== -1) {
            that._keypress(character, e);
          }
        }
      });
    },
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Private methods
     */
    /**
     * Add a new button to the key press listener
     * @param {object} conf Resolved button configuration object
     * @private
     */
    _addKey: function(conf) {
      if (conf.key) {
        this.s.listenKeys += $2.isPlainObject(conf.key) ? conf.key.key : conf.key;
      }
    },
    /**
     * Insert the buttons into the container. Call without parameters!
     * @param  {node} [container] Recursive only - Insert point
     * @param  {array} [buttons] Recursive only - Buttons array
     * @private
     */
    _draw: function(container, buttons) {
      if (!container) {
        container = this.dom.container;
        buttons = this.s.buttons;
      }
      container.children().detach();
      for (var i = 0, ien = buttons.length; i < ien; i++) {
        container.append(buttons[i].inserter);
        container.append(" ");
        if (buttons[i].buttons && buttons[i].buttons.length) {
          this._draw(buttons[i].collection, buttons[i].buttons);
        }
      }
    },
    /**
     * Create buttons from an array of buttons
     * @param  {array} attachTo Buttons array to attach to
     * @param  {object} button Button definition
     * @param  {boolean} inCollection true if the button is in a collection
     * @private
     */
    _expandButton: function(attachTo, button, split, inCollection, inSplit, attachPoint, parentConf) {
      var dt = this.s.dt;
      var isSplit = false;
      var domCollection = this.c.dom.collection;
      var buttons = !Array.isArray(button) ? [button] : button;
      var lastButton;
      if (button === void 0) {
        buttons = !Array.isArray(split) ? [split] : split;
      }
      for (var i = 0, ien = buttons.length; i < ien; i++) {
        var conf = this._resolveExtends(buttons[i]);
        if (!conf) {
          continue;
        }
        isSplit = conf.config && conf.config.split ? true : false;
        if (Array.isArray(conf)) {
          this._expandButton(
            attachTo,
            conf,
            built !== void 0 && built.conf !== void 0 ? built.conf.split : void 0,
            inCollection,
            parentConf !== void 0 && parentConf.split !== void 0,
            attachPoint,
            parentConf
          );
          continue;
        }
        var built = this._buildButton(
          conf,
          inCollection,
          conf.split !== void 0 || conf.config !== void 0 && conf.config.split !== void 0,
          inSplit
        );
        if (!built) {
          continue;
        }
        if (attachPoint !== void 0 && attachPoint !== null) {
          attachTo.splice(attachPoint, 0, built);
          attachPoint++;
        } else {
          attachTo.push(built);
        }
        if (built.conf.dropIcon && !built.conf.split) {
          $2(built.node).addClass(this.c.dom.button.dropClass).append(this.c.dom.button.dropHtml);
        }
        if (built.conf.buttons) {
          built.collection = $2(
            "<" + domCollection.container.content.tag + "/>"
          );
          built.conf._collection = built.collection;
          this._expandButton(
            built.buttons,
            built.conf.buttons,
            built.conf.split,
            !isSplit,
            isSplit,
            attachPoint,
            built.conf
          );
        }
        if (built.conf.split) {
          built.collection = $2("<" + domCollection.container.tag + "/>");
          built.conf._collection = built.collection;
          for (var j = 0; j < built.conf.split.length; j++) {
            var item = built.conf.split[j];
            if (typeof item === "object") {
              item.parent = parentConf;
              if (item.collectionLayout === void 0) {
                item.collectionLayout = built.conf.collectionLayout;
              }
              if (item.dropup === void 0) {
                item.dropup = built.conf.dropup;
              }
              if (item.fade === void 0) {
                item.fade = built.conf.fade;
              }
            }
          }
          this._expandButton(
            built.buttons,
            built.conf.buttons,
            built.conf.split,
            !isSplit,
            isSplit,
            attachPoint,
            built.conf
          );
        }
        built.conf.parent = parentConf;
        if (conf.init) {
          conf.init.call(dt.button(built.node), dt, $2(built.node), conf);
        }
        lastButton = built.node;
      }
      return lastButton;
    },
    /**
     * Create an individual button
     * @param  {object} config            Resolved button configuration
     * @param  {boolean} inCollection `true` if a collection button
     * @return {object} Completed button description object
     * @private
     */
    _buildButton: function(config, inCollection, isSplit, inSplit) {
      var that = this;
      var configDom = this.c.dom;
      var textNode;
      var dt = this.s.dt;
      var setLinerTab = false;
      var text = function(opt) {
        return typeof opt === "function" ? opt(dt, button, config) : opt;
      };
      var dom = $2.extend(true, {}, configDom.button);
      if (inCollection && isSplit && configDom.collection.split) {
        $2.extend(true, dom, configDom.collection.split.action);
      } else if (inSplit || inCollection) {
        $2.extend(true, dom, configDom.collection.button);
      } else if (isSplit) {
        $2.extend(true, dom, configDom.split.button);
      }
      if (config.spacer) {
        var spacer2 = $2("<" + dom.spacer.tag + "/>").addClass(
          "dt-button-spacer " + config.style + " " + dom.spacer.className
        ).html(text(config.text));
        return {
          conf: config,
          node: spacer2,
          nodeChild: null,
          inserter: spacer2,
          buttons: [],
          inCollection,
          isSplit,
          collection: null,
          textNode: spacer2
        };
      }
      if (config.available && !config.available(dt, config) && !config.html) {
        return false;
      }
      var button;
      if (!config.html) {
        var run = function(e, dt2, button2, config2, done) {
          config2.action.call(dt2.button(button2), e, dt2, button2, config2, done);
          $2(dt2.table().node()).triggerHandler("buttons-action.dt", [
            dt2.button(button2),
            dt2,
            button2,
            config2
          ]);
        };
        var action = function(e, dt2, button2, config2) {
          if (config2.async) {
            that.processing(button2[0], true);
            setTimeout(function() {
              run(e, dt2, button2, config2, function() {
                that.processing(button2[0], false);
              });
            }, config2.async);
          } else {
            run(e, dt2, button2, config2, function() {
            });
          }
        };
        var tag = config.tag || dom.tag;
        var clickBlurs = config.clickBlurs === void 0 ? true : config.clickBlurs;
        button = $2("<" + tag + "/>").addClass(dom.className).attr("aria-controls", this.s.dt.table().node().id).on("click.dtb", function(e) {
          e.preventDefault();
          if (!button.hasClass(dom.disabled) && config.action) {
            action(e, dt, button, config);
          }
          if (clickBlurs) {
            button.trigger("blur");
          }
        }).on("keypress.dtb", function(e) {
          if (e.keyCode === 13) {
            e.preventDefault();
            if (!button.hasClass(dom.disabled) && config.action) {
              action(e, dt, button, config);
            }
          }
        });
        if (tag.toLowerCase() === "a") {
          button.attr("href", "#");
        }
        if (tag.toLowerCase() === "button") {
          button.attr("type", "button");
        }
        if (dom.liner.tag) {
          var lc = dom.liner.tag.toLowerCase();
          var liner = $2("<" + lc + "/>").html(text(config.text)).addClass(dom.liner.className);
          if (lc === "a") {
            liner.attr("href", "#");
          }
          if (lc === "a" || lc === "button") {
            liner.attr("tabindex", this.s.dt.settings()[0].iTabIndex);
            setLinerTab = true;
          }
          button.append(liner);
          textNode = liner;
        } else {
          button.html(text(config.text));
          textNode = button;
        }
        if (!setLinerTab) {
          button.attr("tabindex", this.s.dt.settings()[0].iTabIndex);
        }
        if (config.enabled === false) {
          button.addClass(dom.disabled);
        }
        if (config.className) {
          button.addClass(config.className);
        }
        if (config.titleAttr) {
          button.attr("title", text(config.titleAttr));
        }
        if (config.attr) {
          button.attr(config.attr);
        }
        if (!config.namespace) {
          config.namespace = ".dt-button-" + _buttonCounter++;
        }
        if (config.config !== void 0 && config.config.split) {
          config.split = config.config.split;
        }
      } else {
        button = $2(config.html);
      }
      var buttonContainer = this.c.dom.buttonContainer;
      var inserter;
      if (buttonContainer && buttonContainer.tag) {
        inserter = $2("<" + buttonContainer.tag + "/>").addClass(buttonContainer.className).append(button);
      } else {
        inserter = button;
      }
      this._addKey(config);
      if (this.c.buttonCreated) {
        inserter = this.c.buttonCreated(config, inserter);
      }
      var splitDiv;
      if (isSplit) {
        var dropdownConf = inCollection ? $2.extend(true, this.c.dom.split, this.c.dom.collection.split) : this.c.dom.split;
        var wrapperConf = dropdownConf.wrapper;
        splitDiv = $2("<" + wrapperConf.tag + "/>").addClass(wrapperConf.className).append(button);
        var dropButtonConfig = $2.extend(config, {
          autoClose: true,
          align: dropdownConf.dropdown.align,
          attr: {
            "aria-haspopup": "dialog",
            "aria-expanded": false
          },
          className: dropdownConf.dropdown.className,
          closeButton: false,
          splitAlignClass: dropdownConf.dropdown.splitAlignClass,
          text: dropdownConf.dropdown.text
        });
        this._addKey(dropButtonConfig);
        var splitAction = function(e, dt2, button2, config2) {
          _dtButtons.split.action.call(
            dt2.button(splitDiv),
            e,
            dt2,
            button2,
            config2
          );
          $2(dt2.table().node()).triggerHandler("buttons-action.dt", [
            dt2.button(button2),
            dt2,
            button2,
            config2
          ]);
          button2.attr("aria-expanded", true);
        };
        var dropButton = $2(
          '<button class="' + dropdownConf.dropdown.className + ' dt-button"></button>'
        ).html(this.c.dom.button.dropHtml).addClass(this.c.dom.button.dropClass).on("click.dtb", function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (!dropButton.hasClass(dom.disabled)) {
            splitAction(e, dt, dropButton, dropButtonConfig);
          }
          if (clickBlurs) {
            dropButton.trigger("blur");
          }
        }).on("keypress.dtb", function(e) {
          if (e.keyCode === 13) {
            e.preventDefault();
            if (!dropButton.hasClass(dom.disabled)) {
              splitAction(e, dt, dropButton, dropButtonConfig);
            }
          }
        });
        if (config.split.length === 0) {
          dropButton.addClass("dtb-hide-drop");
        }
        splitDiv.append(dropButton).attr(dropButtonConfig.attr);
      }
      var node = isSplit ? splitDiv.get(0) : button.get(0);
      return {
        conf: config,
        node,
        nodeChild: node && node.children && node.children.length ? node.children[0] : null,
        inserter: isSplit ? splitDiv : inserter,
        buttons: [],
        inCollection,
        isSplit,
        inSplit,
        collection: null,
        textNode
      };
    },
    /**
     * Spin over buttons checking if splits should be enabled or not.
     * @param {*} buttons Array of buttons to check
     */
    _checkSplitEnable: function(buttons) {
      if (!buttons) {
        buttons = this.s.buttons;
      }
      for (var i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        if (button.isSplit) {
          var splitBtn = button.node.childNodes[1];
          if (this._checkAnyEnabled(button.buttons)) {
            $2(splitBtn).removeClass(this.c.dom.button.disabled).prop("disabled", false);
          } else {
            $2(splitBtn).addClass(this.c.dom.button.disabled).prop("disabled", false);
          }
        } else if (button.isCollection) {
          this._checkSplitEnable(button.buttons);
        }
      }
    },
    /**
     * Check an array of buttons and see if any are enabled in it
     * @param {*} buttons Button array
     * @returns true if a button is enabled, false otherwise
     */
    _checkAnyEnabled: function(buttons) {
      for (var i = 0; i < buttons.length; i++) {
        if (!buttons[i].disabled) {
          return true;
        }
      }
      return false;
    },
    /**
     * Get the button object from a node (recursive)
     * @param  {node} node Button node
     * @param  {array} [buttons] Button array, uses base if not defined
     * @return {object} Button object
     * @private
     */
    _nodeToButton: function(node, buttons) {
      if (!buttons) {
        buttons = this.s.buttons;
      }
      for (var i = 0, ien = buttons.length; i < ien; i++) {
        if (buttons[i].node === node || buttons[i].nodeChild === node) {
          return buttons[i];
        }
        if (buttons[i].buttons.length) {
          var ret = this._nodeToButton(node, buttons[i].buttons);
          if (ret) {
            return ret;
          }
        }
      }
    },
    /**
     * Get container array for a button from a button node (recursive)
     * @param  {node} node Button node
     * @param  {array} [buttons] Button array, uses base if not defined
     * @return {array} Button's host array
     * @private
     */
    _nodeToHost: function(node, buttons) {
      if (!buttons) {
        buttons = this.s.buttons;
      }
      for (var i = 0, ien = buttons.length; i < ien; i++) {
        if (buttons[i].node === node) {
          return buttons;
        }
        if (buttons[i].buttons.length) {
          var ret = this._nodeToHost(node, buttons[i].buttons);
          if (ret) {
            return ret;
          }
        }
      }
    },
    /**
     * Handle a key press - determine if any button's key configured matches
     * what was typed and trigger the action if so.
     * @param  {string} character The character pressed
     * @param  {object} e Key event that triggered this call
     * @private
     */
    _keypress: function(character, e) {
      if (e._buttonsHandled) {
        return;
      }
      var run = function(conf, node) {
        if (!conf.key) {
          return;
        }
        if (conf.key === character) {
          e._buttonsHandled = true;
          $2(node).click();
        } else if ($2.isPlainObject(conf.key)) {
          if (conf.key.key !== character) {
            return;
          }
          if (conf.key.shiftKey && !e.shiftKey) {
            return;
          }
          if (conf.key.altKey && !e.altKey) {
            return;
          }
          if (conf.key.ctrlKey && !e.ctrlKey) {
            return;
          }
          if (conf.key.metaKey && !e.metaKey) {
            return;
          }
          e._buttonsHandled = true;
          $2(node).click();
        }
      };
      var recurse = function(a) {
        for (var i = 0, ien = a.length; i < ien; i++) {
          run(a[i].conf, a[i].node);
          if (a[i].buttons.length) {
            recurse(a[i].buttons);
          }
        }
      };
      recurse(this.s.buttons);
    },
    /**
     * Remove a key from the key listener for this instance (to be used when a
     * button is removed)
     * @param  {object} conf Button configuration
     * @private
     */
    _removeKey: function(conf) {
      if (conf.key) {
        var character = $2.isPlainObject(conf.key) ? conf.key.key : conf.key;
        var a = this.s.listenKeys.split("");
        var idx = $2.inArray(character, a);
        a.splice(idx, 1);
        this.s.listenKeys = a.join("");
      }
    },
    /**
     * Resolve a button configuration
     * @param  {string|function|object} conf Button config to resolve
     * @return {object} Button configuration
     * @private
     */
    _resolveExtends: function(conf) {
      var that = this;
      var dt = this.s.dt;
      var i, ien;
      var toConfObject = function(base) {
        var loop = 0;
        while (!$2.isPlainObject(base) && !Array.isArray(base)) {
          if (base === void 0) {
            return;
          }
          if (typeof base === "function") {
            base = base.call(that, dt, conf);
            if (!base) {
              return false;
            }
          } else if (typeof base === "string") {
            if (!_dtButtons[base]) {
              return { html: base };
            }
            base = _dtButtons[base];
          }
          loop++;
          if (loop > 30) {
            throw "Buttons: Too many iterations";
          }
        }
        return Array.isArray(base) ? base : $2.extend({}, base);
      };
      conf = toConfObject(conf);
      while (conf && conf.extend) {
        if (!_dtButtons[conf.extend]) {
          throw "Cannot extend unknown button type: " + conf.extend;
        }
        var objArray = toConfObject(_dtButtons[conf.extend]);
        if (Array.isArray(objArray)) {
          return objArray;
        } else if (!objArray) {
          return false;
        }
        var originalClassName = objArray.className;
        if (conf.config !== void 0 && objArray.config !== void 0) {
          conf.config = $2.extend({}, objArray.config, conf.config);
        }
        conf = $2.extend({}, objArray, conf);
        if (originalClassName && conf.className !== originalClassName) {
          conf.className = originalClassName + " " + conf.className;
        }
        conf.extend = objArray.extend;
      }
      var postfixButtons = conf.postfixButtons;
      if (postfixButtons) {
        if (!conf.buttons) {
          conf.buttons = [];
        }
        for (i = 0, ien = postfixButtons.length; i < ien; i++) {
          conf.buttons.push(postfixButtons[i]);
        }
      }
      var prefixButtons = conf.prefixButtons;
      if (prefixButtons) {
        if (!conf.buttons) {
          conf.buttons = [];
        }
        for (i = 0, ien = prefixButtons.length; i < ien; i++) {
          conf.buttons.splice(i, 0, prefixButtons[i]);
        }
      }
      return conf;
    },
    /**
     * Display (and replace if there is an existing one) a popover attached to a button
     * @param {string|node} content Content to show
     * @param {DataTable.Api} hostButton DT API instance of the button
     * @param {object} inOpts Options (see object below for all options)
     */
    _popover: function(content, hostButton, inOpts) {
      var dt = hostButton;
      var c = this.c;
      var closed = false;
      var options = $2.extend(
        {
          align: "button-left",
          // button-right, dt-container, split-left, split-right
          autoClose: false,
          background: true,
          backgroundClassName: "dt-button-background",
          closeButton: true,
          containerClassName: c.dom.collection.container.className,
          contentClassName: c.dom.collection.container.content.className,
          collectionLayout: "",
          collectionTitle: "",
          dropup: false,
          fade: 400,
          popoverTitle: "",
          rightAlignClassName: "dt-button-right",
          tag: c.dom.collection.container.tag
        },
        inOpts
      );
      var containerSelector = options.tag + "." + options.containerClassName.replace(/ /g, ".");
      var hostButtonNode = hostButton.node();
      var hostNode = options.collectionLayout.includes("fixed") ? $2("body") : hostButton.node();
      var close2 = function() {
        closed = true;
        _fadeOut($2(containerSelector), options.fade, function() {
          $2(this).detach();
        });
        $2(
          dt.buttons('[aria-haspopup="dialog"][aria-expanded="true"]').nodes()
        ).attr("aria-expanded", "false");
        $2("div.dt-button-background").off("click.dtb-collection");
        Buttons.background(
          false,
          options.backgroundClassName,
          options.fade,
          hostNode
        );
        $2(window).off("resize.resize.dtb-collection");
        $2("body").off(".dtb-collection");
        dt.off("buttons-action.b-internal");
        dt.off("destroy.dtb-popover");
        $2("body").trigger("buttons-popover-hide.dt");
      };
      if (content === false) {
        close2();
        return;
      }
      var existingExpanded = $2(
        dt.buttons('[aria-haspopup="dialog"][aria-expanded="true"]').nodes()
      );
      if (existingExpanded.length) {
        if (hostNode.closest(containerSelector).length) {
          hostNode = existingExpanded.eq(0);
        }
        close2();
      }
      if (options.sort) {
        var elements = $2("button", content).map(function(idx, el) {
          return {
            text: $2(el).text(),
            el
          };
        }).toArray();
        elements.sort(function(a, b) {
          return a.text.localeCompare(b.text);
        });
        $2(content).append(elements.map(function(v) {
          return v.el;
        }));
      }
      var cnt = $2(".dt-button", content).length;
      var mod = "";
      if (cnt === 3) {
        mod = "dtb-b3";
      } else if (cnt === 2) {
        mod = "dtb-b2";
      } else if (cnt === 1) {
        mod = "dtb-b1";
      }
      var display = $2("<" + options.tag + "/>").addClass(options.containerClassName).addClass(options.collectionLayout).addClass(options.splitAlignClass).addClass(mod).css("display", "none").attr({
        "aria-modal": true,
        role: "dialog"
      });
      content = $2(content).addClass(options.contentClassName).attr("role", "menu").appendTo(display);
      hostButtonNode.attr("aria-expanded", "true");
      if (hostNode.parents("body")[0] !== document.body) {
        hostNode = $2(document.body).children("div, section, p").last();
      }
      if (options.popoverTitle) {
        display.prepend(
          '<div class="dt-button-collection-title">' + options.popoverTitle + "</div>"
        );
      } else if (options.collectionTitle) {
        display.prepend(
          '<div class="dt-button-collection-title">' + options.collectionTitle + "</div>"
        );
      }
      if (options.closeButton) {
        display.prepend('<div class="dtb-popover-close">&times;</div>').addClass("dtb-collection-closeable");
      }
      _fadeIn(display.insertAfter(hostNode), options.fade);
      var tableContainer = $2(hostButton.table().container());
      var position = display.css("position");
      if (options.span === "container" || options.align === "dt-container") {
        hostNode = hostNode.parent();
        display.css("width", tableContainer.width());
      }
      if (position === "absolute") {
        var offsetParent = $2(hostNode[0].offsetParent);
        var buttonPosition = hostNode.position();
        var buttonOffset = hostNode.offset();
        var tableSizes = offsetParent.offset();
        var containerPosition = offsetParent.position();
        var computed = window.getComputedStyle(offsetParent[0]);
        tableSizes.height = offsetParent.outerHeight();
        tableSizes.width = offsetParent.width() + parseFloat(computed.paddingLeft);
        tableSizes.right = tableSizes.left + tableSizes.width;
        tableSizes.bottom = tableSizes.top + tableSizes.height;
        var top = buttonPosition.top + hostNode.outerHeight();
        var left = buttonPosition.left;
        display.css({
          top,
          left
        });
        computed = window.getComputedStyle(display[0]);
        var popoverSizes = display.offset();
        popoverSizes.height = display.outerHeight();
        popoverSizes.width = display.outerWidth();
        popoverSizes.right = popoverSizes.left + popoverSizes.width;
        popoverSizes.bottom = popoverSizes.top + popoverSizes.height;
        popoverSizes.marginTop = parseFloat(computed.marginTop);
        popoverSizes.marginBottom = parseFloat(computed.marginBottom);
        if (options.dropup) {
          top = buttonPosition.top - popoverSizes.height - popoverSizes.marginTop - popoverSizes.marginBottom;
        }
        if (options.align === "button-right" || display.hasClass(options.rightAlignClassName)) {
          left = buttonPosition.left - popoverSizes.width + hostNode.outerWidth();
        }
        if (options.align === "dt-container" || options.align === "container") {
          if (left < buttonPosition.left) {
            left = -buttonPosition.left;
          }
        }
        if (containerPosition.left + left + popoverSizes.width > $2(window).width()) {
          left = $2(window).width() - popoverSizes.width - containerPosition.left;
        }
        if (buttonOffset.left + left < 0) {
          left = -buttonOffset.left;
        }
        if (containerPosition.top + top + popoverSizes.height > $2(window).height() + $2(window).scrollTop()) {
          top = buttonPosition.top - popoverSizes.height - popoverSizes.marginTop - popoverSizes.marginBottom;
        }
        if (offsetParent.offset().top + top < $2(window).scrollTop()) {
          top = buttonPosition.top + hostNode.outerHeight();
        }
        display.css({
          top,
          left
        });
      } else {
        var place = function() {
          var half = $2(window).height() / 2;
          var top2 = display.height() / 2;
          if (top2 > half) {
            top2 = half;
          }
          display.css("marginTop", top2 * -1);
        };
        place();
        $2(window).on("resize.dtb-collection", function() {
          place();
        });
      }
      if (options.background) {
        Buttons.background(
          true,
          options.backgroundClassName,
          options.fade,
          options.backgroundHost || hostNode
        );
      }
      $2("div.dt-button-background").on(
        "click.dtb-collection",
        function() {
        }
      );
      if (options.autoClose) {
        setTimeout(function() {
          dt.on("buttons-action.b-internal", function(e, btn, dt2, node) {
            if (node[0] === hostNode[0]) {
              return;
            }
            close2();
          });
        }, 0);
      }
      $2(display).trigger("buttons-popover.dt");
      dt.on("destroy.dtb-popover", close2);
      setTimeout(function() {
        closed = false;
        $2("body").on("click.dtb-collection", function(e) {
          if (closed) {
            return;
          }
          var back = $2.fn.addBack ? "addBack" : "andSelf";
          var parent = $2(e.target).parent()[0];
          if (!$2(e.target).parents()[back]().filter(content).length && !$2(parent).hasClass("dt-buttons") || $2(e.target).hasClass("dt-button-background")) {
            close2();
          }
        }).on("keyup.dtb-collection", function(e) {
          if (e.keyCode === 27) {
            close2();
          }
        }).on("keydown.dtb-collection", function(e) {
          var elements2 = $2("a, button", content);
          var active = document.activeElement;
          if (e.keyCode !== 9) {
            return;
          }
          if (elements2.index(active) === -1) {
            elements2.first().focus();
            e.preventDefault();
          } else if (e.shiftKey) {
            if (active === elements2[0]) {
              elements2.last().focus();
              e.preventDefault();
            }
          } else {
            if (active === elements2.last()[0]) {
              elements2.first().focus();
              e.preventDefault();
            }
          }
        });
      }, 0);
    }
  });
  Buttons.background = function(show, className, fade, insertPoint) {
    if (fade === void 0) {
      fade = 400;
    }
    if (!insertPoint) {
      insertPoint = document.body;
    }
    if (show) {
      _fadeIn(
        $2("<div/>").addClass(className).css("display", "none").insertAfter(insertPoint),
        fade
      );
    } else {
      _fadeOut($2("div." + className), fade, function() {
        $2(this).removeClass(className).remove();
      });
    }
  };
  Buttons.instanceSelector = function(group, buttons) {
    if (group === void 0 || group === null) {
      return $2.map(buttons, function(v) {
        return v.inst;
      });
    }
    var ret = [];
    var names = $2.map(buttons, function(v) {
      return v.name;
    });
    var process = function(input) {
      if (Array.isArray(input)) {
        for (var i = 0, ien = input.length; i < ien; i++) {
          process(input[i]);
        }
        return;
      }
      if (typeof input === "string") {
        if (input.indexOf(",") !== -1) {
          process(input.split(","));
        } else {
          var idx = $2.inArray(input.trim(), names);
          if (idx !== -1) {
            ret.push(buttons[idx].inst);
          }
        }
      } else if (typeof input === "number") {
        ret.push(buttons[input].inst);
      } else if (typeof input === "object" && input.nodeName) {
        for (var j = 0; j < buttons.length; j++) {
          if (buttons[j].inst.dom.container[0] === input) {
            ret.push(buttons[j].inst);
          }
        }
      } else if (typeof input === "object") {
        ret.push(input);
      }
    };
    process(group);
    return ret;
  };
  Buttons.buttonSelector = function(insts, selector) {
    var ret = [];
    var nodeBuilder = function(a, buttons, baseIdx) {
      var button;
      var idx;
      for (var i2 = 0, ien2 = buttons.length; i2 < ien2; i2++) {
        button = buttons[i2];
        if (button) {
          idx = baseIdx !== void 0 ? baseIdx + i2 : i2 + "";
          a.push({
            node: button.node,
            name: button.conf.name,
            idx
          });
          if (button.buttons) {
            nodeBuilder(a, button.buttons, idx + "-");
          }
        }
      }
    };
    var run = function(selector2, inst2) {
      var i2, ien2;
      var buttons = [];
      nodeBuilder(buttons, inst2.s.buttons);
      var nodes = $2.map(buttons, function(v) {
        return v.node;
      });
      if (Array.isArray(selector2) || selector2 instanceof $2) {
        for (i2 = 0, ien2 = selector2.length; i2 < ien2; i2++) {
          run(selector2[i2], inst2);
        }
        return;
      }
      if (selector2 === null || selector2 === void 0 || selector2 === "*") {
        for (i2 = 0, ien2 = buttons.length; i2 < ien2; i2++) {
          ret.push({
            inst: inst2,
            node: buttons[i2].node
          });
        }
      } else if (typeof selector2 === "number") {
        if (inst2.s.buttons[selector2]) {
          ret.push({
            inst: inst2,
            node: inst2.s.buttons[selector2].node
          });
        }
      } else if (typeof selector2 === "string") {
        if (selector2.indexOf(",") !== -1) {
          var a = selector2.split(",");
          for (i2 = 0, ien2 = a.length; i2 < ien2; i2++) {
            run(a[i2].trim(), inst2);
          }
        } else if (selector2.match(/^\d+(\-\d+)*$/)) {
          var indexes = $2.map(buttons, function(v) {
            return v.idx;
          });
          ret.push({
            inst: inst2,
            node: buttons[$2.inArray(selector2, indexes)].node
          });
        } else if (selector2.indexOf(":name") !== -1) {
          var name = selector2.replace(":name", "");
          for (i2 = 0, ien2 = buttons.length; i2 < ien2; i2++) {
            if (buttons[i2].name === name) {
              ret.push({
                inst: inst2,
                node: buttons[i2].node
              });
            }
          }
        } else {
          $2(nodes).filter(selector2).each(function() {
            ret.push({
              inst: inst2,
              node: this
            });
          });
        }
      } else if (typeof selector2 === "object" && selector2.nodeName) {
        var idx = $2.inArray(selector2, nodes);
        if (idx !== -1) {
          ret.push({
            inst: inst2,
            node: nodes[idx]
          });
        }
      }
    };
    for (var i = 0, ien = insts.length; i < ien; i++) {
      var inst = insts[i];
      run(selector, inst);
    }
    return ret;
  };
  Buttons.stripData = function(str, config) {
    if (str !== null && typeof str === "object" && str.nodeName && str.nodeType) {
      str = str.innerHTML;
    }
    if (typeof str !== "string") {
      return str;
    }
    str = Buttons.stripHtmlScript(str);
    str = Buttons.stripHtmlComments(str);
    if (!config || config.stripHtml) {
      str = dataTables_default.util.stripHtml(str);
    }
    if (!config || config.trim) {
      str = str.trim();
    }
    if (!config || config.stripNewlines) {
      str = str.replace(/\n/g, " ");
    }
    if (!config || config.decodeEntities) {
      if (_entityDecoder) {
        str = _entityDecoder(str);
      } else {
        _exportTextarea.innerHTML = str;
        str = _exportTextarea.value;
      }
    }
    if (!config || config.escapeExcelFormula) {
      if (str.match(/^[=@\t\r]/)) {
        str = "'" + str;
      }
    }
    return str;
  };
  Buttons.entityDecoder = function(fn) {
    _entityDecoder = fn;
  };
  Buttons.stripHtmlComments = function(input) {
    var previous;
    do {
      previous = input;
      input = input.replace(/(<!--.*?--!?>)|(<!--[\S\s]+?--!?>)|(<!--[\S\s]*?$)/g, "");
    } while (input !== previous);
    return input;
  };
  Buttons.stripHtmlScript = function(input) {
    var previous;
    do {
      previous = input;
      input = input.replace(/<script\b[^<]*(?:(?!<\/script[^>]*>)<[^<]*)*<\/script[^>]*>/gi, "");
    } while (input !== previous);
    return input;
  };
  Buttons.defaults = {
    buttons: ["copy", "excel", "csv", "pdf", "print"],
    name: "main",
    tabIndex: 0,
    dom: {
      container: {
        tag: "div",
        className: "dt-buttons"
      },
      collection: {
        container: {
          // The element used for the dropdown
          className: "dt-button-collection",
          content: {
            className: "",
            tag: "div"
          },
          tag: "div"
        }
        // optionally
        // , button: IButton - buttons inside the collection container
        // , split: ISplit - splits inside the collection container
      },
      button: {
        tag: "button",
        className: "dt-button",
        active: "dt-button-active",
        // class name
        disabled: "disabled",
        // class name
        spacer: {
          className: "dt-button-spacer",
          tag: "span"
        },
        liner: {
          tag: "span",
          className: ""
        },
        dropClass: "",
        dropHtml: '<span class="dt-button-down-arrow">&#x25BC;</span>'
      },
      split: {
        action: {
          // action button
          className: "dt-button-split-drop-button dt-button",
          tag: "button"
        },
        dropdown: {
          // button to trigger the dropdown
          align: "split-right",
          className: "dt-button-split-drop",
          splitAlignClass: "dt-button-split-left",
          tag: "button"
        },
        wrapper: {
          // wrap around both
          className: "dt-button-split",
          tag: "div"
        }
      }
    }
  };
  Buttons.version = "3.2.6";
  $2.extend(_dtButtons, {
    collection: {
      text: function(dt) {
        return dt.i18n("buttons.collection", "Collection");
      },
      className: "buttons-collection",
      closeButton: false,
      dropIcon: true,
      init: function(dt, button) {
        button.attr("aria-expanded", false);
      },
      action: function(e, dt, button, config) {
        if (config._collection.parents("body").length) {
          this.popover(false, config);
        } else {
          this.popover(config._collection, config);
        }
        if (e.type === "keypress") {
          $2("a, button", config._collection).eq(0).focus();
        }
      },
      attr: {
        "aria-haspopup": "dialog"
      }
      // Also the popover options, defined in Buttons.popover
    },
    split: {
      text: function(dt) {
        return dt.i18n("buttons.split", "Split");
      },
      className: "buttons-split",
      closeButton: false,
      init: function(dt, button) {
        return button.attr("aria-expanded", false);
      },
      action: function(e, dt, button, config) {
        this.popover(config._collection, config);
      },
      attr: {
        "aria-haspopup": "dialog"
      }
      // Also the popover options, defined in Buttons.popover
    },
    copy: function() {
      if (_dtButtons.copyHtml5) {
        return "copyHtml5";
      }
    },
    csv: function(dt, conf) {
      if (_dtButtons.csvHtml5 && _dtButtons.csvHtml5.available(dt, conf)) {
        return "csvHtml5";
      }
    },
    excel: function(dt, conf) {
      if (_dtButtons.excelHtml5 && _dtButtons.excelHtml5.available(dt, conf)) {
        return "excelHtml5";
      }
    },
    pdf: function(dt, conf) {
      if (_dtButtons.pdfHtml5 && _dtButtons.pdfHtml5.available(dt, conf)) {
        return "pdfHtml5";
      }
    },
    pageLength: function(dt) {
      var lengthMenu = dt.settings()[0].aLengthMenu;
      var vals = [];
      var lang = [];
      var text = function(dt2) {
        return dt2.i18n(
          "buttons.pageLength",
          {
            "-1": "Show all rows",
            _: "Show %d rows"
          },
          dt2.page.len()
        );
      };
      if (Array.isArray(lengthMenu[0])) {
        vals = lengthMenu[0];
        lang = lengthMenu[1];
      } else {
        for (var i = 0; i < lengthMenu.length; i++) {
          var option = lengthMenu[i];
          if ($2.isPlainObject(option)) {
            vals.push(option.value);
            lang.push(option.label);
          } else {
            vals.push(option);
            lang.push(option);
          }
        }
      }
      return {
        extend: "collection",
        text,
        className: "buttons-page-length",
        autoClose: true,
        buttons: $2.map(vals, function(val, i2) {
          return {
            text: lang[i2],
            className: "button-page-length",
            action: function(e, dt2) {
              dt2.page.len(val).draw();
            },
            init: function(dt2, node, conf) {
              var that = this;
              var fn = function() {
                that.active(dt2.page.len() === val);
              };
              dt2.on("length.dt" + conf.namespace, fn);
              fn();
            },
            destroy: function(dt2, node, conf) {
              dt2.off("length.dt" + conf.namespace);
            }
          };
        }),
        init: function(dt2, node, conf) {
          var that = this;
          dt2.on("length.dt" + conf.namespace, function() {
            that.text(conf.text);
          });
        },
        destroy: function(dt2, node, conf) {
          dt2.off("length.dt" + conf.namespace);
        }
      };
    },
    spacer: {
      style: "empty",
      spacer: true,
      text: function(dt) {
        return dt.i18n("buttons.spacer", "");
      }
    }
  });
  dataTables_default.Api.register("buttons()", function(group, selector) {
    if (selector === void 0) {
      selector = group;
      group = void 0;
    }
    this.selector.buttonGroup = group;
    var res = this.iterator(
      true,
      "table",
      function(ctx) {
        if (ctx._buttons) {
          return Buttons.buttonSelector(
            Buttons.instanceSelector(group, ctx._buttons),
            selector
          );
        }
      },
      true
    );
    res._groupSelector = group;
    return res;
  });
  dataTables_default.Api.register("button()", function(group, selector) {
    var buttons = this.buttons(group, selector);
    if (buttons.length > 1) {
      buttons.splice(1, buttons.length);
    }
    return buttons;
  });
  dataTables_default.Api.registerPlural(
    "buttons().active()",
    "button().active()",
    function(flag) {
      if (flag === void 0) {
        return this.map(function(set) {
          return set.inst.active(set.node);
        });
      }
      return this.each(function(set) {
        set.inst.active(set.node, flag);
      });
    }
  );
  dataTables_default.Api.registerPlural(
    "buttons().action()",
    "button().action()",
    function(action) {
      if (action === void 0) {
        return this.map(function(set) {
          return set.inst.action(set.node);
        });
      }
      return this.each(function(set) {
        set.inst.action(set.node, action);
      });
    }
  );
  dataTables_default.Api.registerPlural(
    "buttons().collectionRebuild()",
    "button().collectionRebuild()",
    function(buttons) {
      return this.each(function(set) {
        for (var i = 0; i < buttons.length; i++) {
          if (typeof buttons[i] === "object") {
            buttons[i].parentConf = set;
          }
        }
        set.inst.collectionRebuild(set.node, buttons);
      });
    }
  );
  dataTables_default.Api.register(
    ["buttons().enable()", "button().enable()"],
    function(flag) {
      return this.each(function(set) {
        set.inst.enable(set.node, flag);
      });
    }
  );
  dataTables_default.Api.register(
    ["buttons().disable()", "button().disable()"],
    function() {
      return this.each(function(set) {
        set.inst.disable(set.node);
      });
    }
  );
  dataTables_default.Api.register("button().index()", function() {
    var idx = null;
    this.each(function(set) {
      var res = set.inst.index(set.node);
      if (res !== null) {
        idx = res;
      }
    });
    return idx;
  });
  dataTables_default.Api.registerPlural(
    "buttons().nodes()",
    "button().node()",
    function() {
      var jq = $2();
      $2(
        this.each(function(set) {
          jq = jq.add(set.inst.node(set.node));
        })
      );
      return jq;
    }
  );
  dataTables_default.Api.registerPlural(
    "buttons().processing()",
    "button().processing()",
    function(flag) {
      if (flag === void 0) {
        return this.map(function(set) {
          return set.inst.processing(set.node);
        });
      }
      return this.each(function(set) {
        set.inst.processing(set.node, flag);
      });
    }
  );
  dataTables_default.Api.registerPlural(
    "buttons().text()",
    "button().text()",
    function(label) {
      if (label === void 0) {
        return this.map(function(set) {
          return set.inst.text(set.node);
        });
      }
      return this.each(function(set) {
        set.inst.text(set.node, label);
      });
    }
  );
  dataTables_default.Api.registerPlural(
    "buttons().trigger()",
    "button().trigger()",
    function() {
      return this.each(function(set) {
        set.inst.node(set.node).trigger("click");
      });
    }
  );
  dataTables_default.Api.register("button().popover()", function(content, options) {
    return this.map(function(set) {
      return set.inst._popover(content, this.button(this[0].node), options);
    });
  });
  dataTables_default.Api.register("buttons().containers()", function() {
    var jq = $2();
    var groupSelector = this._groupSelector;
    this.iterator(true, "table", function(ctx) {
      if (ctx._buttons) {
        var insts = Buttons.instanceSelector(groupSelector, ctx._buttons);
        for (var i = 0, ien = insts.length; i < ien; i++) {
          jq = jq.add(insts[i].container());
        }
      }
    });
    return jq;
  });
  dataTables_default.Api.register("buttons().container()", function() {
    return this.containers().eq(0);
  });
  dataTables_default.Api.register("button().add()", function(idx, conf, draw) {
    var ctx = this.context;
    var node;
    if (ctx.length) {
      var inst = Buttons.instanceSelector(
        this._groupSelector,
        ctx[0]._buttons
      );
      if (inst.length) {
        node = inst[0].add(conf, idx, draw);
      }
    }
    return node ? this.button(this._groupSelector, node) : this;
  });
  dataTables_default.Api.register("buttons().destroy()", function() {
    this.pluck("inst").unique().each(function(inst) {
      inst.destroy();
    });
    return this;
  });
  dataTables_default.Api.registerPlural(
    "buttons().remove()",
    "buttons().remove()",
    function() {
      this.each(function(set) {
        set.inst.remove(set.node);
      });
      return this;
    }
  );
  var _infoTimer;
  dataTables_default.Api.register("buttons.info()", function(title2, message, time) {
    var that = this;
    if (title2 === false) {
      this.off("destroy.btn-info");
      _fadeOut($2("#datatables_buttons_info"), 400, function() {
        $2(this).remove();
      });
      clearTimeout(_infoTimer);
      _infoTimer = null;
      return this;
    }
    if (_infoTimer) {
      clearTimeout(_infoTimer);
    }
    if ($2("#datatables_buttons_info").length) {
      $2("#datatables_buttons_info").remove();
    }
    title2 = title2 ? "<h2>" + title2 + "</h2>" : "";
    _fadeIn(
      $2('<div id="datatables_buttons_info" class="dt-button-info"/>').html(title2).append(
        $2("<div/>")[typeof message === "string" ? "html" : "append"](
          message
        )
      ).css("display", "none").appendTo("body")
    );
    if (time !== void 0 && time !== 0) {
      _infoTimer = setTimeout(function() {
        that.buttons.info(false);
      }, time);
    }
    this.on("destroy.btn-info", function() {
      that.buttons.info(false);
    });
    return this;
  });
  dataTables_default.Api.register("buttons.exportData()", function(options) {
    if (this.context.length) {
      return _exportData(new dataTables_default.Api(this.context[0]), options);
    }
  });
  dataTables_default.Api.register("buttons.exportInfo()", function(conf) {
    if (!conf) {
      conf = {};
    }
    return {
      filename: _filename(conf, this),
      title: _title(conf, this),
      messageTop: _message(this, conf, conf.message || conf.messageTop, "top"),
      messageBottom: _message(this, conf, conf.messageBottom, "bottom")
    };
  });
  var _filename = function(config, dt) {
    var filename = config.filename === "*" && config.title !== "*" && config.title !== void 0 && config.title !== null && config.title !== "" ? config.title : config.filename;
    if (typeof filename === "function") {
      filename = filename(config, dt);
    }
    if (filename === void 0 || filename === null) {
      return null;
    }
    if (filename.indexOf("*") !== -1) {
      filename = filename.replace(/\*/g, $2("head > title").text()).trim();
    }
    filename = filename.replace(/[^a-zA-Z0-9_\u00A1-\uFFFF\.,\-_ !\(\)]/g, "");
    var extension = _stringOrFunction(config.extension, config, dt);
    if (!extension) {
      extension = "";
    }
    return filename + extension;
  };
  var _stringOrFunction = function(option, config, dt) {
    if (option === null || option === void 0) {
      return null;
    } else if (typeof option === "function") {
      return option(config, dt);
    }
    return option;
  };
  var _title = function(config, dt) {
    var title2 = _stringOrFunction(config.title, config, dt);
    return title2 === null ? null : title2.indexOf("*") !== -1 ? title2.replace(/\*/g, $2("head > title").text() || "Exported data") : title2;
  };
  var _message = function(dt, config, option, position) {
    var message = _stringOrFunction(option, config, dt);
    if (message === null) {
      return null;
    }
    var caption = $2("caption", dt.table().container()).eq(0);
    if (message === "*") {
      var side = caption.css("caption-side");
      if (side !== position) {
        return null;
      }
      return caption.length ? caption.text() : "";
    }
    return message;
  };
  var _exportTextarea = $2("<textarea/>")[0];
  var _exportData = function(dt, inOpts) {
    var config = $2.extend(
      true,
      {},
      {
        rows: null,
        columns: "",
        modifier: {
          search: "applied",
          order: "applied"
        },
        orthogonal: "display",
        stripHtml: true,
        stripNewlines: true,
        decodeEntities: true,
        escapeExcelFormula: false,
        trim: true,
        format: {
          header: function(d) {
            return Buttons.stripData(d, config);
          },
          footer: function(d) {
            return Buttons.stripData(d, config);
          },
          body: function(d) {
            return Buttons.stripData(d, config);
          }
        },
        customizeData: null,
        customizeZip: null
      },
      inOpts
    );
    var header = dt.columns(config.columns).indexes().map(function(idx) {
      var col = dt.column(idx);
      return config.format.header(col.title(), idx, col.header());
    }).toArray();
    var footer = dt.table().footer() ? dt.columns(config.columns).indexes().map(function(idx) {
      var el = dt.column(idx).footer();
      var val = "";
      if (el) {
        var inner = $2(".dt-column-title", el);
        val = inner.length ? inner.html() : $2(el).html();
      }
      return config.format.footer(val, idx, el);
    }).toArray() : null;
    var modifier = $2.extend({}, config.modifier);
    if (dt.select && typeof dt.select.info === "function" && modifier.selected === void 0) {
      if (dt.rows(config.rows, $2.extend({ selected: true }, modifier)).any()) {
        $2.extend(modifier, { selected: true });
      }
    }
    var rowIndexes = dt.rows(config.rows, modifier).indexes().toArray();
    var selectedCells = dt.cells(rowIndexes, config.columns, {
      order: modifier.order
    });
    var cells = selectedCells.render(config.orthogonal).toArray();
    var cellNodes = selectedCells.nodes().toArray();
    var cellIndexes = selectedCells.indexes().toArray();
    var columns = dt.columns(config.columns).count();
    var rows = columns > 0 ? cells.length / columns : 0;
    var body = [];
    var cellCounter = 0;
    for (var i = 0, ien = rows; i < ien; i++) {
      var row = [columns];
      for (var j = 0; j < columns; j++) {
        row[j] = config.format.body(
          cells[cellCounter],
          cellIndexes[cellCounter].row,
          cellIndexes[cellCounter].column,
          cellNodes[cellCounter]
        );
        cellCounter++;
      }
      body[i] = row;
    }
    var data = {
      header,
      headerStructure: _headerFormatter(
        config.format.header,
        dt.table().header.structure(config.columns)
      ),
      footer,
      footerStructure: _headerFormatter(
        config.format.footer,
        dt.table().footer.structure(config.columns)
      ),
      body
    };
    if (config.customizeData) {
      config.customizeData(data);
    }
    return data;
  };
  function _headerFormatter(formatter, struct) {
    for (var i = 0; i < struct.length; i++) {
      for (var j = 0; j < struct[i].length; j++) {
        var item = struct[i][j];
        if (item) {
          item.title = formatter(
            item.title,
            j,
            item.cell
          );
        }
      }
    }
    return struct;
  }
  $2.fn.dataTable.Buttons = Buttons;
  $2.fn.DataTable.Buttons = Buttons;
  $2(document).on("init.dt plugin-init.dt", function(e, settings) {
    if (e.namespace !== "dt") {
      return;
    }
    var opts = settings.oInit.buttons || dataTables_default.defaults.buttons;
    if (opts && !settings._buttons) {
      new Buttons(settings, opts).container();
    }
  });
  function _init(settings, options) {
    var api = new dataTables_default.Api(settings);
    var opts = options ? options : api.init().buttons || dataTables_default.defaults.buttons;
    return new Buttons(api, opts).container();
  }
  dataTables_default.ext.feature.push({
    fnInit: _init,
    cFeature: "B"
  });
  if (dataTables_default.feature) {
    dataTables_default.feature.register("buttons", _init);
  }

  // node_modules/datatables.net-buttons/js/buttons.colVis.mjs
  var $3 = jquery_module_default;
  $3.extend(dataTables_default.ext.buttons, {
    // A collection of column visibility buttons
    colvis: function(dt, conf) {
      var node = null;
      var buttonConf = {
        extend: "collection",
        init: function(dt2, n) {
          node = n;
        },
        text: function(dt2) {
          return dt2.i18n("buttons.colvis", "Column visibility");
        },
        className: "buttons-colvis",
        closeButton: false,
        buttons: [
          {
            extend: "columnsToggle",
            columns: conf.columns,
            columnText: conf.columnText
          }
        ]
      };
      dt.on("column-reorder.dt" + conf.namespace, function() {
        dt.button(null, dt.button(null, node).node()).collectionRebuild([
          {
            extend: "columnsToggle",
            columns: conf.columns,
            columnText: conf.columnText
          }
        ]);
      });
      return buttonConf;
    },
    // Selected columns with individual buttons - toggle column visibility
    columnsToggle: function(dt, conf) {
      var columns = dt.columns(conf.columns).indexes().map(function(idx) {
        return {
          extend: "columnToggle",
          columns: idx,
          columnText: conf.columnText
        };
      }).toArray();
      return columns;
    },
    // Single button to toggle column visibility
    columnToggle: function(dt, conf) {
      return {
        extend: "columnVisibility",
        columns: conf.columns,
        columnText: conf.columnText
      };
    },
    // Selected columns with individual buttons - set column visibility
    columnsVisibility: function(dt, conf) {
      var columns = dt.columns(conf.columns).indexes().map(function(idx) {
        return {
          extend: "columnVisibility",
          columns: idx,
          visibility: conf.visibility,
          columnText: conf.columnText
        };
      }).toArray();
      return columns;
    },
    // Single button to set column visibility
    columnVisibility: {
      columns: void 0,
      // column selector
      text: function(dt, button, conf) {
        return conf._columnText(dt, conf);
      },
      className: "buttons-columnVisibility",
      action: function(e, dt, button, conf) {
        var col = dt.columns(conf.columns);
        var curr = col.visible();
        col.visible(
          conf.visibility !== void 0 ? conf.visibility : !(curr.length ? curr[0] : false)
        );
      },
      init: function(dt, button, conf) {
        var that = this;
        var column = dt.column(conf.columns);
        button.attr("data-cv-idx", conf.columns);
        dt.on("column-visibility.dt" + conf.namespace, function(e, settings, index, state) {
          if (column.index() === index && !settings.bDestroying && settings.nTable == dt.settings()[0].nTable) {
            that.active(state);
          }
        }).on("column-reorder.dt" + conf.namespace, function() {
          if (conf.destroying) {
            return;
          }
          if (dt.columns(conf.columns).count() !== 1) {
            return;
          }
          column = dt.column(conf.columns);
          that.text(conf._columnText(dt, conf));
          that.active(column.visible());
        });
        this.active(column.visible());
      },
      destroy: function(dt, button, conf) {
        dt.off("column-visibility.dt" + conf.namespace).off(
          "column-reorder.dt" + conf.namespace
        );
      },
      _columnText: function(dt, conf) {
        if (typeof conf.text === "string") {
          return conf.text;
        }
        var title2 = dt.column(conf.columns).title();
        var idx = dt.column(conf.columns).index();
        title2 = title2.replace(/\n/g, " ").replace(/<br\s*\/?>/gi, " ").replace(/<select(.*?)<\/select\s*>/gi, "");
        title2 = dataTables_default.Buttons.stripHtmlComments(title2);
        title2 = dataTables_default.util.stripHtml(title2).trim();
        return conf.columnText ? conf.columnText(dt, idx, title2) : title2;
      }
    },
    colvisRestore: {
      className: "buttons-colvisRestore",
      text: function(dt) {
        return dt.i18n("buttons.colvisRestore", "Restore visibility");
      },
      init: function(dt, button, conf) {
        dt.columns().every(function() {
          var init3 = this.init();
          if (init3.__visOriginal === void 0) {
            init3.__visOriginal = this.visible();
          }
        });
      },
      action: function(e, dt, button, conf) {
        dt.columns().every(function(i) {
          var init3 = this.init();
          this.visible(init3.__visOriginal);
        });
      }
    },
    colvisGroup: {
      className: "buttons-colvisGroup",
      action: function(e, dt, button, conf) {
        dt.columns(conf.show).visible(true, false);
        dt.columns(conf.hide).visible(false, false);
        dt.columns.adjust();
      },
      show: [],
      hide: []
    }
  });

  // node_modules/datatables.net-buttons/js/buttons.html5.mjs
  var $4 = jquery_module_default;
  var useJszip;
  var usePdfmake;
  function _jsZip() {
    return useJszip || window.JSZip;
  }
  function _pdfMake() {
    return usePdfmake || window.pdfMake;
  }
  dataTables_default.Buttons.pdfMake = function(_) {
    if (!_) {
      return _pdfMake();
    }
    usePdfmake = _;
  };
  dataTables_default.Buttons.jszip = function(_) {
    if (!_) {
      return _jsZip();
    }
    useJszip = _;
  };
  var _saveAs = function(view) {
    "use strict";
    if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
      return;
    }
    var doc = view.document, get_URL = function() {
      return view.URL || view.webkitURL || view;
    }, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"), can_use_save_link = "download" in save_link, click = function(node) {
      var event = new MouseEvent("click");
      node.dispatchEvent(event);
    }, is_safari = /constructor/i.test(view.HTMLElement) || view.safari, is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent), throw_outside = function(ex) {
      (view.setImmediate || view.setTimeout)(function() {
        throw ex;
      }, 0);
    }, force_saveable_type = "application/octet-stream", arbitrary_revoke_timeout = 1e3 * 40, revoke = function(file) {
      var revoker = function() {
        if (typeof file === "string") {
          get_URL().revokeObjectURL(file);
        } else {
          file.remove();
        }
      };
      setTimeout(revoker, arbitrary_revoke_timeout);
    }, dispatch = function(filesaver, event_types, event) {
      event_types = [].concat(event_types);
      var i = event_types.length;
      while (i--) {
        var listener = filesaver["on" + event_types[i]];
        if (typeof listener === "function") {
          try {
            listener.call(filesaver, event || filesaver);
          } catch (ex) {
            throw_outside(ex);
          }
        }
      }
    }, auto_bom = function(blob) {
      if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
        blob.type
      )) {
        return new Blob([String.fromCharCode(65279), blob], {
          type: blob.type
        });
      }
      return blob;
    }, FileSaver = function(blob, name, no_auto_bom) {
      if (!no_auto_bom) {
        blob = auto_bom(blob);
      }
      var filesaver = this, type = blob.type, force = type === force_saveable_type, object_url, dispatch_all = function() {
        dispatch(
          filesaver,
          "writestart progress write writeend".split(" ")
        );
      }, fs_error = function() {
        if ((is_chrome_ios || force && is_safari) && view.FileReader) {
          var reader = new FileReader();
          reader.onloadend = function() {
            var url = is_chrome_ios ? reader.result : reader.result.replace(
              /^data:[^;]*;/,
              "data:attachment/file;"
            );
            var popup = view.open(url, "_blank");
            if (!popup) view.location.href = url;
            url = void 0;
            filesaver.readyState = filesaver.DONE;
            dispatch_all();
          };
          reader.readAsDataURL(blob);
          filesaver.readyState = filesaver.INIT;
          return;
        }
        if (!object_url) {
          object_url = get_URL().createObjectURL(blob);
        }
        if (force) {
          view.location.href = object_url;
        } else {
          var opened = view.open(object_url, "_blank");
          if (!opened) {
            view.location.href = object_url;
          }
        }
        filesaver.readyState = filesaver.DONE;
        dispatch_all();
        revoke(object_url);
      };
      filesaver.readyState = filesaver.INIT;
      if (can_use_save_link) {
        object_url = get_URL().createObjectURL(blob);
        setTimeout(function() {
          save_link.href = object_url;
          save_link.download = name;
          click(save_link);
          dispatch_all();
          revoke(object_url);
          filesaver.readyState = filesaver.DONE;
        });
        return;
      }
      fs_error();
    }, FS_proto = FileSaver.prototype, saveAs = function(blob, name, no_auto_bom) {
      return new FileSaver(
        blob,
        name || blob.name || "download",
        no_auto_bom
      );
    };
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
      return function(blob, name, no_auto_bom) {
        name = name || blob.name || "download";
        if (!no_auto_bom) {
          blob = auto_bom(blob);
        }
        return navigator.msSaveOrOpenBlob(blob, name);
      };
    }
    FS_proto.abort = function() {
    };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;
    FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
    return saveAs;
  }(
    typeof self !== "undefined" && self || typeof window !== "undefined" && window || (void 0).content
  );
  dataTables_default.fileSave = _saveAs;
  var _sheetname = function(config) {
    var sheetName = "Sheet1";
    if (config.sheetName) {
      sheetName = config.sheetName.replace(/[\[\]\*\/\\\?\:]/g, "");
    }
    return sheetName;
  };
  var _newLine = function(config) {
    return config.newline ? config.newline : navigator.userAgent.match(/Windows/) ? "\r\n" : "\n";
  };
  var _exportData2 = function(dt, config) {
    var newLine = _newLine(config);
    var data = dt.buttons.exportData(config.exportOptions);
    var boundary = config.fieldBoundary;
    var separator = config.fieldSeparator;
    var reBoundary = new RegExp(boundary, "g");
    var escapeChar = config.escapeChar !== void 0 ? config.escapeChar : "\\";
    var join = function(a) {
      var s = "";
      for (var i2 = 0, ien2 = a.length; i2 < ien2; i2++) {
        if (i2 > 0) {
          s += separator;
        }
        s += boundary ? boundary + ("" + a[i2]).replace(reBoundary, escapeChar + boundary) + boundary : a[i2];
      }
      return s;
    };
    var header = "";
    var footer = "";
    var body = [];
    if (config.header) {
      header = data.headerStructure.map(function(row) {
        return join(
          row.map(function(cell) {
            return cell ? cell.title : "";
          })
        );
      }).join(newLine) + newLine;
    }
    if (config.footer && data.footer) {
      footer = data.footerStructure.map(function(row) {
        return join(
          row.map(function(cell) {
            return cell ? cell.title : "";
          })
        );
      }).join(newLine) + newLine;
    }
    for (var i = 0, ien = data.body.length; i < ien; i++) {
      body.push(join(data.body[i]));
    }
    return {
      str: header + body.join(newLine) + newLine + footer,
      rows: body.length
    };
  };
  var _isDuffSafari = function() {
    var safari = navigator.userAgent.indexOf("Safari") !== -1 && navigator.userAgent.indexOf("Chrome") === -1 && navigator.userAgent.indexOf("Opera") === -1;
    if (!safari) {
      return false;
    }
    var version = navigator.userAgent.match(/AppleWebKit\/(\d+\.\d+)/);
    if (version && version.length > 1 && version[1] * 1 < 603.1) {
      return true;
    }
    return false;
  };
  function createCellPos(n) {
    var ordA = "A".charCodeAt(0);
    var ordZ = "Z".charCodeAt(0);
    var len = ordZ - ordA + 1;
    var s = "";
    while (n >= 0) {
      s = String.fromCharCode(n % len + ordA) + s;
      n = Math.floor(n / len) - 1;
    }
    return s;
  }
  try {
    _serialiser = new XMLSerializer();
  } catch (t) {
  }
  var _serialiser;
  var _ieExcel;
  function _addToZip(zip, obj) {
    if (_ieExcel === void 0) {
      _ieExcel = _serialiser.serializeToString(
        new window.DOMParser().parseFromString(
          excelStrings["xl/worksheets/sheet1.xml"],
          "text/xml"
        )
      ).indexOf("xmlns:r") === -1;
    }
    $4.each(obj, function(name, val) {
      if ($4.isPlainObject(val)) {
        var newDir = zip.folder(name);
        _addToZip(newDir, val);
      } else {
        if (_ieExcel) {
          var worksheet = val.childNodes[0];
          var i, ien;
          var attrs = [];
          for (i = worksheet.attributes.length - 1; i >= 0; i--) {
            var attrName = worksheet.attributes[i].nodeName;
            var attrValue = worksheet.attributes[i].nodeValue;
            if (attrName.indexOf(":") !== -1) {
              attrs.push({ name: attrName, value: attrValue });
              worksheet.removeAttribute(attrName);
            }
          }
          for (i = 0, ien = attrs.length; i < ien; i++) {
            var attr = val.createAttribute(
              attrs[i].name.replace(":", "_dt_b_namespace_token_")
            );
            attr.value = attrs[i].value;
            worksheet.setAttributeNode(attr);
          }
        }
        var str = _serialiser.serializeToString(val);
        if (_ieExcel) {
          if (str.indexOf("<?xml") === -1) {
            str = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + str;
          }
          str = str.replace(/_dt_b_namespace_token_/g, ":");
          str = str.replace(/xmlns:NS[\d]+="" NS[\d]+:/g, "");
        }
        str = str.replace(/<([^<>]*?) xmlns=""([^<>]*?)>/g, "<$1 $2>");
        zip.file(name, str);
      }
    });
  }
  function _createNode(doc, nodeName, opts) {
    var tempNode = doc.createElement(nodeName);
    if (opts) {
      if (opts.attr) {
        $4(tempNode).attr(opts.attr);
      }
      if (opts.children) {
        $4.each(opts.children, function(key, value) {
          tempNode.appendChild(value);
        });
      }
      if (opts.text !== null && opts.text !== void 0) {
        tempNode.appendChild(doc.createTextNode(opts.text));
      }
    }
    return tempNode;
  }
  function _excelColWidth(data, col) {
    var max = data.header[col].length;
    var len, lineSplit, str;
    if (data.footer && data.footer[col] && data.footer[col].length > max) {
      max = data.footer[col].length;
    }
    for (var i = 0, ien = data.body.length; i < ien; i++) {
      var point = data.body[i][col];
      str = point !== null && point !== void 0 ? point.toString() : "";
      if (str.indexOf("\n") !== -1) {
        lineSplit = str.split("\n");
        lineSplit.sort(function(a, b) {
          return b.length - a.length;
        });
        len = lineSplit[0].length;
      } else {
        len = str.length;
      }
      if (len > max) {
        max = len;
      }
      if (max > 40) {
        return 54;
      }
    }
    max *= 1.35;
    return max > 6 ? max : 6;
  }
  var excelStrings = {
    "_rels/.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/_rels/workbook.xml.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml" /><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" /><Default Extension="jpeg" ContentType="image/jpeg" /><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" /><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" /><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" /></Types>',
    "xl/workbook.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="24816"/><workbookPr showInkAnnotation="0" autoCompressPictures="0"/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="19020" tabRatio="500"/></bookViews><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets><definedNames/></workbook>',
    "xl/worksheets/sheet1.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><sheetData/><mergeCells count="0"/></worksheet>',
    "xl/styles.xml": '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><numFmts count="6"><numFmt numFmtId="164" formatCode="[$$-409]#,##0.00;-[$$-409]#,##0.00"/><numFmt numFmtId="165" formatCode="&quot;\xA3&quot;#,##0.00"/><numFmt numFmtId="166" formatCode="[$\u20AC-2] #,##0.00"/><numFmt numFmtId="167" formatCode="0.0%"/><numFmt numFmtId="168" formatCode="#,##0;(#,##0)"/><numFmt numFmtId="169" formatCode="#,##0.00;(#,##0.00)"/></numFmts><fonts count="5" x14ac:knownFonts="1"><font><sz val="11" /><name val="Calibri" /></font><font><sz val="11" /><name val="Calibri" /><color rgb="FFFFFFFF" /></font><font><sz val="11" /><name val="Calibri" /><b /></font><font><sz val="11" /><name val="Calibri" /><i /></font><font><sz val="11" /><name val="Calibri" /><u /></font></fonts><fills count="6"><fill><patternFill patternType="none" /></fill><fill><patternFill patternType="none" /></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9" /><bgColor indexed="64" /></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD99795" /><bgColor indexed="64" /></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="ffc6efce" /><bgColor indexed="64" /></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="ffc6cfef" /><bgColor indexed="64" /></patternFill></fill></fills><borders count="2"><border><left /><right /><top /><bottom /><diagonal /></border><border diagonalUp="false" diagonalDown="false"><left style="thin"><color auto="1" /></left><right style="thin"><color auto="1" /></right><top style="thin"><color auto="1" /></top><bottom style="thin"><color auto="1" /></bottom><diagonal /></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" /></cellStyleXfs><cellXfs count="68"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="4" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="left"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="right"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment horizontal="fill"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment textRotation="90"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="9"   fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="167" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="168" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="169" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="1" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0" /></cellStyles><dxfs count="0" /><tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4" /></styleSheet>'
  };
  var _excelSpecials = [
    {
      match: /^\-?\d+\.\d%$/,
      style: 60,
      fmt: function(d) {
        return d / 100;
      }
    },
    // Percent with d.p.
    {
      match: /^\-?\d+\.?\d*%$/,
      style: 56,
      fmt: function(d) {
        return d / 100;
      }
    },
    // Percent
    { match: /^\-?\$[\d,]+.?\d*$/, style: 57 },
    // Dollars
    { match: /^\-?£[\d,]+.?\d*$/, style: 58 },
    // Pounds
    { match: /^\-?€[\d,]+.?\d*$/, style: 59 },
    // Euros
    { match: /^\-?\d+$/, style: 65 },
    // Numbers without thousand separators
    { match: /^\-?\d+\.\d{2}$/, style: 66 },
    // Numbers 2 d.p. without thousands separators
    {
      match: /^\([\d,]+\)$/,
      style: 61,
      fmt: function(d) {
        return -1 * d.replace(/[\(\)]/g, "");
      }
    },
    // Negative numbers indicated by brackets
    {
      match: /^\([\d,]+\.\d{2}\)$/,
      style: 62,
      fmt: function(d) {
        return -1 * d.replace(/[\(\)]/g, "");
      }
    },
    // Negative numbers indicated by brackets - 2d.p.
    { match: /^\-?[\d,]+$/, style: 63 },
    // Numbers with thousand separators
    { match: /^\-?[\d,]+\.\d{2}$/, style: 64 },
    {
      match: /^(19\d\d|[2-9]\d\d\d)\-(0\d|1[012])\-[0123][\d]$/,
      style: 67,
      fmt: function(d) {
        return Math.round(25569 + Date.parse(d) / (86400 * 1e3));
      }
    }
    //Date yyyy-mm-dd
  ];
  var _excelMergeCells = function(rels, row, column, rowspan, colspan) {
    var mergeCells = $4("mergeCells", rels);
    mergeCells[0].appendChild(
      _createNode(rels, "mergeCell", {
        attr: {
          ref: createCellPos(column) + row + ":" + createCellPos(column + colspan - 1) + (row + rowspan - 1)
        }
      })
    );
    mergeCells.attr("count", parseFloat(mergeCells.attr("count")) + 1);
  };
  dataTables_default.ext.buttons.copyHtml5 = {
    className: "buttons-copy buttons-html5",
    text: function(dt) {
      return dt.i18n("buttons.copy", "Copy");
    },
    action: function(e, dt, button, config, cb) {
      var exportData = _exportData2(dt, config);
      var info2 = dt.buttons.exportInfo(config);
      var newline = _newLine(config);
      var output = exportData.str;
      var hiddenDiv = $4("<div/>").css({
        height: 1,
        width: 1,
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0
      });
      if (info2.title) {
        output = info2.title + newline + newline + output;
      }
      if (info2.messageTop) {
        output = info2.messageTop + newline + newline + output;
      }
      if (info2.messageBottom) {
        output = output + newline + newline + info2.messageBottom;
      }
      if (config.customize) {
        output = config.customize(output, config, dt);
      }
      var textarea = $4("<textarea readonly/>").val(output).appendTo(hiddenDiv);
      if (document.queryCommandSupported("copy")) {
        hiddenDiv.appendTo(dt.table().container());
        textarea[0].focus();
        textarea[0].select();
        try {
          var successful = document.execCommand("copy");
          hiddenDiv.remove();
          if (successful) {
            if (config.copySuccess) {
              dt.buttons.info(
                dt.i18n("buttons.copyTitle", "Copy to clipboard"),
                dt.i18n(
                  "buttons.copySuccess",
                  {
                    1: "Copied one row to clipboard",
                    _: "Copied %d rows to clipboard"
                  },
                  exportData.rows
                ),
                2e3
              );
            }
            cb();
            return;
          }
        } catch (t) {
        }
      }
      var message = $4(
        "<span>" + dt.i18n(
          "buttons.copyKeys",
          "Press <i>ctrl</i> or <i>\u2318</i> + <i>C</i> to copy the table data<br>to your system clipboard.<br><br>To cancel, click this message or press escape."
        ) + "</span>"
      ).append(hiddenDiv);
      dt.buttons.info(
        dt.i18n("buttons.copyTitle", "Copy to clipboard"),
        message,
        0
      );
      textarea[0].focus();
      textarea[0].select();
      var container = $4(message).closest(".dt-button-info");
      var close2 = function() {
        container.off("click.buttons-copy");
        $4(document).off(".buttons-copy");
        dt.buttons.info(false);
      };
      container.on("click.buttons-copy", function() {
        close2();
        cb();
      });
      $4(document).on("keydown.buttons-copy", function(e2) {
        if (e2.keyCode === 27) {
          close2();
          cb();
        }
      }).on("copy.buttons-copy cut.buttons-copy", function() {
        close2();
        cb();
      });
    },
    async: 100,
    copySuccess: true,
    exportOptions: {},
    fieldSeparator: "	",
    fieldBoundary: "",
    header: true,
    footer: true,
    title: "*",
    messageTop: "*",
    messageBottom: "*"
  };
  dataTables_default.ext.buttons.csvHtml5 = {
    bom: false,
    className: "buttons-csv buttons-html5",
    available: function() {
      return window.FileReader !== void 0 && window.Blob;
    },
    text: function(dt) {
      return dt.i18n("buttons.csv", "CSV");
    },
    action: function(e, dt, button, config, cb) {
      var output = _exportData2(dt, config).str;
      var info2 = dt.buttons.exportInfo(config);
      var charset = config.charset;
      if (config.customize) {
        output = config.customize(output, config, dt);
      }
      if (charset !== false) {
        if (!charset) {
          charset = document.characterSet || document.charset;
        }
        if (charset) {
          charset = ";charset=" + charset;
        }
      } else {
        charset = "";
      }
      if (config.bom) {
        output = String.fromCharCode(65279) + output;
      }
      _saveAs(
        new Blob([output], { type: "text/csv" + charset }),
        info2.filename,
        true
      );
      cb();
    },
    async: 100,
    filename: "*",
    extension: ".csv",
    exportOptions: {
      escapeExcelFormula: true
    },
    fieldSeparator: ",",
    fieldBoundary: '"',
    escapeChar: '"',
    charset: null,
    header: true,
    footer: true
  };
  dataTables_default.ext.buttons.excelHtml5 = {
    className: "buttons-excel buttons-html5",
    available: function() {
      return window.FileReader !== void 0 && _jsZip() !== void 0 && !_isDuffSafari() && _serialiser;
    },
    text: function(dt) {
      return dt.i18n("buttons.excel", "Excel");
    },
    action: function(e, dt, button, config, cb) {
      var rowPos = 0;
      var dataStartRow, dataEndRow;
      var getXml = function(type) {
        var str = excelStrings[type];
        return $4.parseXML(str);
      };
      var rels = getXml("xl/worksheets/sheet1.xml");
      var relsGet = rels.getElementsByTagName("sheetData")[0];
      var xlsx = {
        _rels: {
          ".rels": getXml("_rels/.rels")
        },
        xl: {
          _rels: {
            "workbook.xml.rels": getXml("xl/_rels/workbook.xml.rels")
          },
          "workbook.xml": getXml("xl/workbook.xml"),
          "styles.xml": getXml("xl/styles.xml"),
          worksheets: {
            "sheet1.xml": rels
          }
        },
        "[Content_Types].xml": getXml("[Content_Types].xml")
      };
      var data = dt.buttons.exportData(config.exportOptions);
      var currentRow, rowNode;
      var addRow = function(row) {
        currentRow = rowPos + 1;
        rowNode = _createNode(rels, "row", { attr: { r: currentRow } });
        for (var i2 = 0, ien2 = row.length; i2 < ien2; i2++) {
          var cellId = createCellPos(i2) + "" + currentRow;
          var cell = null;
          if (row[i2] === null || row[i2] === void 0 || row[i2] === "") {
            if (config.createEmptyCells === true) {
              row[i2] = "";
            } else {
              continue;
            }
          }
          var originalContent = row[i2];
          row[i2] = typeof row[i2].trim === "function" ? row[i2].trim() : row[i2];
          for (var j = 0, jen = _excelSpecials.length; j < jen; j++) {
            var special = _excelSpecials[j];
            if (row[i2].match && !row[i2].match(/^0\d+/) && row[i2].match(special.match)) {
              var val = row[i2].replace(/[^\d\.\-]/g, "");
              if (special.fmt) {
                val = special.fmt(val);
              }
              cell = _createNode(rels, "c", {
                attr: {
                  r: cellId,
                  s: special.style
                },
                children: [_createNode(rels, "v", { text: val })]
              });
              break;
            }
          }
          if (!cell) {
            if (typeof row[i2] === "number" || row[i2].match && row[i2].match(/^-?\d+(\.\d+)?([eE]\-?\d+)?$/) && // Includes exponential format
            !row[i2].match(/^0\d+/)) {
              cell = _createNode(rels, "c", {
                attr: {
                  t: "n",
                  r: cellId
                },
                children: [_createNode(rels, "v", { text: row[i2] })]
              });
            } else {
              var text = !originalContent.replace ? originalContent : originalContent.replace(
                /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g,
                ""
              );
              cell = _createNode(rels, "c", {
                attr: {
                  t: "inlineStr",
                  r: cellId
                },
                children: {
                  row: _createNode(rels, "is", {
                    children: {
                      row: _createNode(rels, "t", {
                        text,
                        attr: {
                          "xml:space": "preserve"
                        }
                      })
                    }
                  })
                }
              });
            }
          }
          rowNode.appendChild(cell);
        }
        relsGet.appendChild(rowNode);
        rowPos++;
      };
      var addHeader = function(structure) {
        structure.forEach(function(row) {
          addRow(
            row.map(function(cell) {
              return cell ? cell.title : "";
            }),
            rowPos
          );
          $4("row:last c", rels).attr("s", "2");
          row.forEach(function(cell, columnCounter) {
            if (cell && (cell.colSpan > 1 || cell.rowSpan > 1)) {
              _excelMergeCells(
                rels,
                rowPos,
                columnCounter,
                cell.rowSpan,
                cell.colSpan
              );
            }
          });
        });
      };
      var exportInfo = dt.buttons.exportInfo(config);
      if (exportInfo.title) {
        addRow([exportInfo.title], rowPos);
        _excelMergeCells(rels, rowPos, 0, 1, data.header.length);
        $4("row:last c", rels).attr("s", "51");
      }
      if (exportInfo.messageTop) {
        addRow([exportInfo.messageTop], rowPos);
        _excelMergeCells(rels, rowPos, 0, 1, data.header.length);
      }
      if (config.header) {
        addHeader(data.headerStructure);
      }
      dataStartRow = rowPos;
      for (var n = 0, ie = data.body.length; n < ie; n++) {
        addRow(data.body[n], rowPos);
      }
      dataEndRow = rowPos;
      if (config.footer && data.footer) {
        addHeader(data.footerStructure);
      }
      if (exportInfo.messageBottom) {
        addRow([exportInfo.messageBottom], rowPos);
        _excelMergeCells(rels, rowPos, 0, 1, data.header.length);
      }
      var cols = _createNode(rels, "cols");
      $4("worksheet", rels).prepend(cols);
      for (var i = 0, ien = data.header.length; i < ien; i++) {
        cols.appendChild(
          _createNode(rels, "col", {
            attr: {
              min: i + 1,
              max: i + 1,
              width: _excelColWidth(data, i),
              customWidth: 1
            }
          })
        );
      }
      var workbook = xlsx.xl["workbook.xml"];
      $4("sheets sheet", workbook).attr("name", _sheetname(config));
      if (config.autoFilter) {
        $4("mergeCells", rels).before(
          _createNode(rels, "autoFilter", {
            attr: {
              ref: "A" + dataStartRow + ":" + createCellPos(data.header.length - 1) + dataEndRow
            }
          })
        );
        $4("definedNames", workbook).append(
          _createNode(workbook, "definedName", {
            attr: {
              name: "_xlnm._FilterDatabase",
              localSheetId: "0",
              hidden: 1
            },
            text: "'" + _sheetname(config).replace(/'/g, "''") + "'!$A$" + dataStartRow + ":$" + createCellPos(data.header.length - 1) + "$" + dataEndRow
          })
        );
      }
      if (config.customize) {
        config.customize(xlsx, config, dt);
      }
      if ($4("mergeCells", rels).children().length === 0) {
        $4("mergeCells", rels).remove();
      }
      var jszip = _jsZip();
      var zip = new jszip();
      var zipConfig = {
        compression: "DEFLATE",
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      };
      _addToZip(zip, xlsx);
      var filename = exportInfo.filename;
      if (filename > 175) {
        filename = filename.substr(0, 175);
      }
      if (config.customizeZip) {
        config.customizeZip(zip, data, filename);
      }
      if (zip.generateAsync) {
        zip.generateAsync(zipConfig).then(function(blob) {
          _saveAs(blob, filename);
          cb();
        });
      } else {
        _saveAs(zip.generate(zipConfig), filename);
        cb();
      }
    },
    async: 100,
    filename: "*",
    extension: ".xlsx",
    exportOptions: {},
    header: true,
    footer: true,
    title: "*",
    messageTop: "*",
    messageBottom: "*",
    createEmptyCells: false,
    autoFilter: false,
    sheetName: ""
  };
  dataTables_default.ext.buttons.pdfHtml5 = {
    className: "buttons-pdf buttons-html5",
    available: function() {
      return window.FileReader !== void 0 && _pdfMake();
    },
    text: function(dt) {
      return dt.i18n("buttons.pdf", "PDF");
    },
    action: function(e, dt, button, config, cb) {
      var data = dt.buttons.exportData(config.exportOptions);
      var info2 = dt.buttons.exportInfo(config);
      var rows = [];
      if (config.header) {
        data.headerStructure.forEach(function(row) {
          rows.push(
            row.map(function(cell) {
              return cell ? {
                text: cell.title,
                colSpan: cell.colspan,
                rowSpan: cell.rowspan,
                style: "tableHeader"
              } : {};
            })
          );
        });
      }
      for (var i = 0, ien = data.body.length; i < ien; i++) {
        rows.push(
          data.body[i].map(function(d) {
            return {
              text: d === null || d === void 0 ? "" : typeof d === "string" ? d : d.toString()
            };
          })
        );
      }
      if (config.footer) {
        data.footerStructure.forEach(function(row) {
          rows.push(
            row.map(function(cell) {
              return cell ? {
                text: cell.title,
                colSpan: cell.colspan,
                rowSpan: cell.rowspan,
                style: "tableFooter"
              } : {};
            })
          );
        });
      }
      var doc = {
        pageSize: config.pageSize,
        pageOrientation: config.orientation,
        content: [
          {
            style: "table",
            table: {
              headerRows: config.header ? data.headerStructure.length : 0,
              footerRows: config.footer ? data.footerStructure.length : 0,
              body: rows
            },
            layout: {
              hLineWidth: function(i2, node) {
                if (i2 === 0 || i2 === node.table.body.length) {
                  return 0;
                }
                return 0.5;
              },
              vLineWidth: function() {
                return 0;
              },
              hLineColor: function(i2, node) {
                return i2 === node.table.headerRows || i2 === node.table.body.length - node.table.footerRows ? "#333" : "#ddd";
              },
              fillColor: function(rowIndex) {
                if (rowIndex < data.headerStructure.length) {
                  return "#fff";
                }
                return rowIndex % 2 === 0 ? "#f3f3f3" : null;
              },
              paddingTop: function() {
                return 5;
              },
              paddingBottom: function() {
                return 5;
              }
            }
          }
        ],
        styles: {
          tableHeader: {
            bold: true,
            fontSize: 11,
            alignment: "center"
          },
          tableFooter: {
            bold: true,
            fontSize: 11,
            alignment: "center"
          },
          table: {
            margin: [0, 5, 0, 5]
          },
          title: {
            alignment: "center",
            fontSize: 13
          },
          message: {}
        },
        defaultStyle: {
          fontSize: 10
        }
      };
      if (info2.messageTop) {
        doc.content.unshift({
          text: info2.messageTop,
          style: "message",
          margin: [0, 0, 0, 12]
        });
      }
      if (info2.messageBottom) {
        doc.content.push({
          text: info2.messageBottom,
          style: "message",
          margin: [0, 0, 0, 12]
        });
      }
      if (info2.title) {
        doc.content.unshift({
          text: info2.title,
          style: "title",
          margin: [0, 0, 0, 12]
        });
      }
      if (config.customize) {
        config.customize(doc, config, dt);
      }
      var pdf = _pdfMake().createPdf(doc);
      if (config.download === "open" && !_isDuffSafari()) {
        pdf.open();
      } else {
        pdf.download(info2.filename);
      }
      cb();
    },
    async: 100,
    title: "*",
    filename: "*",
    extension: ".pdf",
    exportOptions: {},
    orientation: "portrait",
    // This isn't perfect, but it is close
    pageSize: navigator.language === "en-US" || navigator.language === "en-CA" ? "LETTER" : "A4",
    header: true,
    footer: true,
    messageTop: "*",
    messageBottom: "*",
    customize: null,
    download: "download"
  };

  // node_modules/datatables.net-colreorder/js/dataTables.colReorder.mjs
  var $5 = jquery_module_default;
  function arrayMove(arr, from, count, to) {
    var movers = arr.splice(from, count);
    movers.unshift(0);
    movers.unshift(to < from ? to : to - count + 1);
    arr.splice.apply(arr, movers);
  }
  function finalise(dt) {
    dt.rows().invalidate("data");
    dt.column(0).visible(dt.column(0).visible());
    dt.columns.adjust();
    var order2 = dt.colReorder.order();
    dt.trigger("columns-reordered", [
      {
        order: order2,
        mapping: invertKeyValues(order2)
      }
    ]);
  }
  function getOrder(dt) {
    return dt.settings()[0].aoColumns.map(function(col) {
      return col._crOriginalIdx;
    });
  }
  function headerUpdate(structure, map, from, to) {
    var done = [];
    for (var i = 0; i < structure.length; i++) {
      var headerRow = structure[i];
      arrayMove(headerRow, from[0], from.length, to);
      for (var j = 0; j < headerRow.length; j++) {
        var cell = headerRow[j].cell;
        if (done.includes(cell)) {
          continue;
        }
        var indexes = cell.getAttribute("data-dt-column").split(",");
        var mapped = indexes.map(function(idx) {
          return map[idx];
        }).join(",");
        cell.setAttribute("data-dt-column", mapped);
        done.push(cell);
      }
    }
  }
  function init(api) {
    api.columns().iterator("column", function(s, idx) {
      var columns = s.aoColumns;
      if (columns[idx]._crOriginalIdx === void 0) {
        columns[idx]._crOriginalIdx = idx;
      }
    });
  }
  function invertKeyValues(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
      result[arr[i]] = i;
    }
    return result;
  }
  function move(dt, from, to) {
    var i, j;
    var settings = dt.settings()[0];
    var columns = settings.aoColumns;
    var newOrder = columns.map(function(col, idx) {
      return idx;
    });
    if (from.includes(to)) {
      return;
    }
    arrayMove(newOrder, from[0], from.length, to);
    var reverseIndexes = invertKeyValues(newOrder);
    arrayMove(columns, from[0], from.length, to);
    for (i = 0; i < settings.aoData.length; i++) {
      var data = settings.aoData[i];
      if (!data) {
        continue;
      }
      var cells = data.anCells;
      if (!cells) {
        continue;
      }
      arrayMove(cells, from[0], from.length, to);
      for (j = 0; j < cells.length; j++) {
        if (data.nTr && cells[j] && columns[j].bVisible) {
          data.nTr.appendChild(cells[j]);
        }
        if (cells[j] && cells[j]._DT_CellIndex) {
          cells[j]._DT_CellIndex.column = j;
        }
      }
    }
    for (i = 0; i < columns.length; i++) {
      var column = columns[i];
      for (j = 0; j < column.aDataSort.length; j++) {
        column.aDataSort[j] = reverseIndexes[column.aDataSort[j]];
      }
      column.idx = reverseIndexes[column.idx];
      if (column.bVisible) {
        settings.colgroup.append(column.colEl);
      }
    }
    headerUpdate(settings.aoHeader, reverseIndexes, from, to);
    headerUpdate(settings.aoFooter, reverseIndexes, from, to);
    arrayMove(settings.aoPreSearchCols, from[0], from.length, to);
    orderingIndexes(reverseIndexes, settings.aaSorting);
    if (Array.isArray(settings.aaSortingFixed)) {
      orderingIndexes(reverseIndexes, settings.aaSortingFixed);
    } else if (settings.aaSortingFixed.pre) {
      orderingIndexes(reverseIndexes, settings.aaSortingFixed.pre);
    } else if (settings.aaSortingFixed.post) {
      orderingIndexes(reverseIndexes, settings.aaSortingFixed.pre);
    }
    settings.aLastSort.forEach(function(el) {
      el.src = reverseIndexes[el.src];
    });
    dt.trigger("column-reorder", [
      dt.settings()[0],
      {
        from,
        to,
        mapping: reverseIndexes
      }
    ]);
  }
  function orderingIndexes(map, order2) {
    if (!order2) {
      return;
    }
    for (var i = 0; i < order2.length; i++) {
      var el = order2[i];
      if (typeof el === "number") {
        order2[i] = map[el];
      } else if ($5.isPlainObject(el) && el.idx !== void 0) {
        el.idx = map[el.idx];
      } else if (Array.isArray(el) && typeof el[0] === "number") {
        el[0] = map[el[0]];
      }
    }
  }
  function setOrder(dt, order2, original) {
    var changed = false;
    var i;
    if (order2.length !== dt.columns().count()) {
      dt.error("ColReorder - column count mismatch");
      return;
    }
    if (original) {
      order2 = transpose(dt, order2, "toCurrent");
    }
    var setOrder2 = invertKeyValues(order2);
    for (i = 0; i < setOrder2.length; i++) {
      var currentIndex = setOrder2.indexOf(i);
      if (i !== currentIndex) {
        arrayMove(setOrder2, currentIndex, 1, i);
        move(dt, [currentIndex], i);
        changed = true;
      }
    }
    if (changed) {
      finalise(dt);
    }
  }
  function structureFill(structure) {
    var filledIn = [];
    for (var row = 0; row < structure.length; row++) {
      filledIn.push([]);
      for (var col = 0; col < structure[row].length; col++) {
        var cell = structure[row][col];
        if (cell) {
          for (var rowInner = 0; rowInner < cell.rowspan; rowInner++) {
            if (!filledIn[row + rowInner]) {
              filledIn[row + rowInner] = [];
            }
            for (var colInner = 0; colInner < cell.colspan; colInner++) {
              filledIn[row + rowInner][col + colInner] = cell.cell;
            }
          }
        }
      }
    }
    return filledIn;
  }
  function transpose(dt, idx, dir) {
    var order2 = dt.colReorder.order();
    var columns = dt.settings()[0].aoColumns;
    if (dir === "toCurrent" || dir === "fromOriginal") {
      return !Array.isArray(idx) ? order2.indexOf(idx) : idx.map(function(index) {
        return order2.indexOf(index);
      });
    }
    return !Array.isArray(idx) ? columns[idx]._crOriginalIdx : idx.map(function(index) {
      return columns[index]._crOriginalIdx;
    });
  }
  function validateMove(table, from, to) {
    var columns = table.columns().count();
    if (from[0] < to && to < from[from.length]) {
      return false;
    }
    if (from[0] < 0 && from[from.length - 1] > columns) {
      return false;
    }
    if (to < 0 && to > columns) {
      return false;
    }
    if (from.includes(to)) {
      return true;
    }
    if (!validateStructureMove(table.table().header.structure(), from, to)) {
      return false;
    }
    if (!validateStructureMove(table.table().footer.structure(), from, to)) {
      return false;
    }
    return true;
  }
  function validateStructureMove(structure, from, to) {
    var header = structureFill(structure);
    var i;
    for (i = 0; i < header.length; i++) {
      arrayMove(header[i], from[0], from.length, to);
    }
    for (i = 0; i < header.length; i++) {
      var seen = [];
      for (var j = 0; j < header[i].length; j++) {
        var cell = header[i][j];
        if (!seen.includes(cell)) {
          seen.push(cell);
        } else if (seen[seen.length - 1] !== cell) {
          return false;
        }
      }
    }
    return true;
  }
  var ColReorder = (
    /** @class */
    function() {
      function ColReorder2(dt, opts) {
        this.dom = {
          drag: null
        };
        this.c = {
          columns: null,
          enable: null,
          headerRows: null,
          order: null
        };
        this.s = {
          dropZones: [],
          mouse: {
            absLeft: -1,
            offset: {
              x: -1,
              y: -1
            },
            start: {
              x: -1,
              y: -1
            },
            target: null,
            targets: []
          },
          scrollInterval: null
        };
        var that = this;
        var ctx = dt.settings()[0];
        if (ctx._colReorder) {
          return;
        }
        dt.settings()[0]._colReorder = this;
        this.dt = dt;
        $5.extend(this.c, ColReorder2.defaults, opts);
        init(dt);
        dt.on("stateSaveParams", function(e, s, d) {
          d.colReorder = getOrder(dt);
        });
        dt.on("destroy", function() {
          dt.off(".colReorder");
          dt.colReorder.reset();
        });
        var loaded = dt.state.loaded();
        var order2 = this.c.order;
        if (loaded && loaded.colReorder && dt.columns().count() === loaded.colReorder.length) {
          order2 = loaded.colReorder;
        }
        if (order2) {
          dt.ready(function() {
            setOrder(dt, order2, true);
          });
        }
        dt.table().header.structure().forEach(function(row, rowIdx) {
          var headerRows = opts.headerRows;
          for (var i = 0; i < row.length; i++) {
            if (!headerRows || headerRows.includes(rowIdx)) {
              if (row[i] && row[i].cell) {
                that._addListener(row[i].cell);
              }
            }
          }
        });
      }
      ColReorder2.prototype.disable = function() {
        this.c.enable = false;
        return this;
      };
      ColReorder2.prototype.enable = function(flag) {
        if (flag === void 0) {
          flag = true;
        }
        if (flag === false) {
          return this.disable();
        }
        this.c.enable = true;
        return this;
      };
      ColReorder2.prototype._addListener = function(el) {
        var that = this;
        $5(el).on("selectstart.colReorder", function() {
          return false;
        }).on("mousedown.colReorder touchstart.colReorder", function(e) {
          if (e.type === "mousedown" && e.which !== 1) {
            return;
          }
          if (!that.c.enable) {
            return;
          }
          var btn = $5("button.dtcc-button_reorder", this);
          if (btn.length && e.target !== btn[0] && btn.find(e.target).length === 0) {
            return;
          }
          that._mouseDown(e, this);
        });
      };
      ColReorder2.prototype._createDragNode = function() {
        var origCell = this.s.mouse.target;
        var origTr = origCell.parent();
        var origThead = origTr.parent();
        var origTable = origThead.parent();
        var cloneCell = origCell.clone();
        this.dom.drag = $5(origTable[0].cloneNode(false)).addClass("dtcr-cloned").append(
          $5(origThead[0].cloneNode(false)).append($5(origTr[0].cloneNode(false)).append(cloneCell[0]))
          // Not sure why  it doesn't want to append a jQuery node
        ).css({
          position: "absolute",
          top: 0,
          left: 0,
          width: $5(origCell).outerWidth(),
          height: $5(origCell).outerHeight()
        }).appendTo("body");
      };
      ColReorder2.prototype._cursorPosition = function(e, prop) {
        return e.type.indexOf("touch") !== -1 ? e.originalEvent.touches[0][prop] : e[prop];
      };
      ColReorder2.prototype._mouseDown = function(e, cell) {
        var _this = this;
        var target = $5(e.target).closest("th, td");
        var offset = target.offset();
        var moveableColumns = this.dt.columns(this.c.columns).indexes().toArray();
        var moveColumnIndexes = $5(cell).attr("data-dt-column").split(",").map(function(val) {
          return parseInt(val, 10);
        });
        for (var j = 0; j < moveColumnIndexes.length; j++) {
          if (!moveableColumns.includes(moveColumnIndexes[j])) {
            return false;
          }
        }
        this.s.mouse.start.x = this._cursorPosition(e, "pageX");
        this.s.mouse.start.y = this._cursorPosition(e, "pageY");
        this.s.mouse.offset.x = this._cursorPosition(e, "pageX") - offset.left;
        this.s.mouse.offset.y = this._cursorPosition(e, "pageY") - offset.top;
        this.s.mouse.target = target;
        this.s.mouse.targets = moveColumnIndexes;
        for (var i = 0; i < moveColumnIndexes.length; i++) {
          var cells = this.dt.cells(null, moveColumnIndexes[i], { page: "current" }).nodes().to$();
          var klass = "dtcr-moving";
          if (i === 0) {
            klass += " dtcr-moving-first";
          }
          if (i === moveColumnIndexes.length - 1) {
            klass += " dtcr-moving-last";
          }
          cells.addClass(klass);
        }
        this._regions(moveColumnIndexes);
        this._scrollRegions();
        $5(document).on("mousemove.colReorder touchmove.colReorder", function(e2) {
          _this._mouseMove(e2);
        }).on("mouseup.colReorder touchend.colReorder", function(e2) {
          _this._mouseUp(e2);
        });
      };
      ColReorder2.prototype._mouseMove = function(e) {
        if (this.dom.drag === null) {
          if (Math.pow(Math.pow(this._cursorPosition(e, "pageX") - this.s.mouse.start.x, 2) + Math.pow(this._cursorPosition(e, "pageY") - this.s.mouse.start.y, 2), 0.5) < 5) {
            return;
          }
          $5(document.body).addClass("dtcr-dragging");
          this._createDragNode();
        }
        this.dom.drag.css({
          left: this._cursorPosition(e, "pageX") - this.s.mouse.offset.x,
          top: this._cursorPosition(e, "pageY") - this.s.mouse.offset.y
        });
        var tableNode = this.dt.table().node();
        var tableOffset = $5(tableNode).offset().left;
        var cursorMouseLeft = this._cursorPosition(e, "pageX") - tableOffset;
        var cursorInlineStart;
        if (this._isRtl()) {
          var tableWidth = tableNode.clientWidth;
          cursorInlineStart = tableWidth - cursorMouseLeft;
        } else {
          cursorInlineStart = cursorMouseLeft;
        }
        var dropZone = this.s.dropZones.find(function(zone) {
          if (zone.inlineStart <= cursorInlineStart && cursorInlineStart <= zone.inlineStart + zone.width) {
            return true;
          }
          return false;
        });
        this.s.mouse.absLeft = this._cursorPosition(e, "pageX");
        if (!dropZone) {
          return;
        }
        if (!dropZone.self) {
          this._move(dropZone, cursorInlineStart);
        }
      };
      ColReorder2.prototype._mouseUp = function(e) {
        var _this = this;
        $5(document).off(".colReorder");
        $5(document.body).removeClass("dtcr-dragging");
        if (this.dom.drag) {
          this.dom.drag.remove();
          this.dom.drag = null;
          this.s.mouse.target.on("click.dtcr", function(e2) {
            return false;
          });
          setTimeout(function() {
            _this.s.mouse.target.off(".dtcr");
          }, 10);
        }
        if (this.s.scrollInterval) {
          clearInterval(this.s.scrollInterval);
        }
        this.dt.cells(".dtcr-moving").nodes().to$().removeClass("dtcr-moving dtcr-moving-first dtcr-moving-last");
      };
      ColReorder2.prototype._move = function(dropZone, cursorInlineStart) {
        var that = this;
        this.dt.colReorder.move(this.s.mouse.targets, dropZone.colIdx);
        this.s.mouse.targets = $5(this.s.mouse.target).attr("data-dt-column").split(",").map(function(val) {
          return parseInt(val, 10);
        });
        this._regions(this.s.mouse.targets);
        var visibleTargets = this.s.mouse.targets.filter(function(val) {
          return that.dt.column(val).visible();
        });
        var dz = this.s.dropZones.find(function(zone) {
          return zone.colIdx === visibleTargets[0];
        });
        var dzIdx = this.s.dropZones.indexOf(dz);
        if (dz.inlineStart > cursorInlineStart) {
          var previousDiff = dz.inlineStart - cursorInlineStart;
          var previousDz = this.s.dropZones[dzIdx - 1];
          dz.inlineStart -= previousDiff;
          dz.width += previousDiff;
          if (previousDz) {
            previousDz.width -= previousDiff;
          }
        }
        dz = this.s.dropZones.find(function(zone) {
          return zone.colIdx === visibleTargets[visibleTargets.length - 1];
        });
        if (dz.inlineStart + dz.width < cursorInlineStart) {
          var nextDiff = cursorInlineStart - (dz.inlineStart + dz.width);
          var nextDz = this.s.dropZones[dzIdx + 1];
          dz.width += nextDiff;
          if (nextDz) {
            nextDz.inlineStart += nextDiff;
            nextDz.width -= nextDiff;
          }
        }
      };
      ColReorder2.prototype._regions = function(moveColumns) {
        var that = this;
        var dropZones = [];
        var totalWidth = 0;
        var negativeCorrect = 0;
        var allowedColumns = this.dt.columns(this.c.columns).indexes().toArray();
        var widths = this.dt.columns().widths();
        this.dt.columns().every(function(colIdx, tabIdx, i) {
          if (!this.visible()) {
            return;
          }
          var columnWidth = widths[colIdx];
          if (!allowedColumns.includes(colIdx)) {
            totalWidth += columnWidth;
            return;
          }
          var valid = validateMove(that.dt, moveColumns, colIdx);
          if (valid) {
            dropZones.push({
              colIdx,
              inlineStart: totalWidth - negativeCorrect,
              self: moveColumns[0] <= colIdx && colIdx <= moveColumns[moveColumns.length - 1],
              width: columnWidth + negativeCorrect
            });
          } else if (colIdx < moveColumns[0]) {
            if (dropZones.length) {
              dropZones[dropZones.length - 1].width += columnWidth;
            }
          } else if (colIdx > moveColumns[moveColumns.length - 1]) {
            negativeCorrect += columnWidth;
          }
          totalWidth += columnWidth;
        });
        this.s.dropZones = dropZones;
      };
      ColReorder2.prototype._isScrolling = function() {
        return this.dt.table().body().parentNode !== this.dt.table().header().parentNode;
      };
      ColReorder2.prototype._scrollRegions = function() {
        if (!this._isScrolling()) {
          return;
        }
        var that = this;
        var tableLeft = $5(this.dt.table().container()).offset().left;
        var tableWidth = $5(this.dt.table().container()).outerWidth();
        var mouseBuffer = 75;
        var scrollContainer = this.dt.table().body().parentElement.parentElement;
        this.s.scrollInterval = setInterval(function() {
          var mouseLeft = that.s.mouse.absLeft;
          if (mouseLeft === -1) {
            return;
          }
          if (mouseLeft < tableLeft + mouseBuffer && scrollContainer.scrollLeft) {
            scrollContainer.scrollLeft -= 5;
          } else if (mouseLeft > tableLeft + tableWidth - mouseBuffer && scrollContainer.scrollLeft < scrollContainer.scrollWidth) {
            scrollContainer.scrollLeft += 5;
          }
        }, 25);
      };
      ColReorder2.prototype._isRtl = function() {
        return $5(this.dt.table().node()).css("direction") === "rtl";
      };
      ColReorder2.defaults = {
        columns: "",
        enable: true,
        headerRows: null,
        order: null
      };
      ColReorder2.version = "2.1.2";
      return ColReorder2;
    }()
  );
  dataTables_default.Api.register("colReorder.enable()", function(flag) {
    return this.iterator("table", function(ctx) {
      if (ctx._colReorder) {
        ctx._colReorder.enable(flag);
      }
    });
  });
  dataTables_default.Api.register("colReorder.disable()", function() {
    return this.iterator("table", function(ctx) {
      if (ctx._colReorder) {
        ctx._colReorder.disable();
      }
    });
  });
  dataTables_default.Api.register("colReorder.move()", function(from, to) {
    init(this);
    if (!Array.isArray(from)) {
      from = [from];
    }
    if (!validateMove(this, from, to)) {
      this.error("ColReorder - invalid move");
      return this;
    }
    return this.tables().every(function() {
      move(this, from, to);
      finalise(this);
    });
  });
  dataTables_default.Api.register("colReorder.order()", function(set, original) {
    init(this);
    if (!set) {
      return this.context.length ? getOrder(this) : null;
    }
    return this.tables().every(function() {
      setOrder(this, set, original);
    });
  });
  dataTables_default.Api.register("colReorder.reset()", function() {
    init(this);
    return this.tables().every(function() {
      var order2 = this.columns().every(function(i) {
        return i;
      }).flatten().toArray();
      setOrder(this, order2, true);
    });
  });
  dataTables_default.Api.register("colReorder.transpose()", function(idx, dir) {
    init(this);
    if (!dir) {
      dir = "toCurrent";
    }
    return transpose(this, idx, dir);
  });
  dataTables_default.ColReorder = ColReorder;
  $5(document).on("stateLoadInit.dt", function(e, settings, state) {
    if (e.namespace !== "dt") {
      return;
    }
    var dt = new dataTables_default.Api(settings);
    if (state.colReorder && dt.columns().count() === state.colReorder.length) {
      if (dt.ready()) {
        setOrder(dt, state.colReorder, true);
      } else {
        orderingIndexes(state.colReorder, state.order);
        if (state.columns) {
          for (var i = 0; i < state.columns.length; i++) {
            state.columns[i]._cr_sort = state.colReorder[i];
          }
          state.columns.sort(function(a, b) {
            return a._cr_sort - b._cr_sort;
          });
        }
      }
    }
  });
  $5(document).on("preInit.dt", function(e, settings) {
    if (e.namespace !== "dt") {
      return;
    }
    var init3 = settings.oInit.colReorder;
    var defaults = dataTables_default.defaults.colReorder;
    if (init3 || defaults) {
      var opts = $5.extend({}, defaults, init3);
      if (init3 !== false) {
        var dt = new dataTables_default.Api(settings);
        new ColReorder(dt, opts);
      }
    }
  });

  // node_modules/datatables.net-columncontrol/js/dataTables.columnControl.mjs
  var $6 = jquery_module_default;
  function createElement(type, classes, text, children) {
    if (classes === void 0) {
      classes = [];
    }
    if (text === void 0) {
      text = null;
    }
    if (children === void 0) {
      children = [];
    }
    var el = document.createElement(type);
    addClass(el, classes);
    if (text) {
      el.innerHTML = text;
    }
    children.forEach(function(child) {
      el.appendChild(child);
    });
    return el;
  }
  function addClass(el, classes) {
    if (!classes) {
      return;
    }
    if (!Array.isArray(classes)) {
      classes = [classes];
    }
    classes.forEach(function(className) {
      if (el && className) {
        el.classList.add(className);
      }
    });
  }
  function close(e) {
    if (e === void 0) {
      e = null;
    }
    document.querySelectorAll("div.dtcc-dropdown").forEach(function(el) {
      if (e === null || !el.contains(e.target)) {
        el._close();
        if (!e._closed) {
          e._closed = [];
        }
        e._closed.push(el);
      }
    });
  }
  function getContainer(dt, btn) {
    return btn.closest("div.dtfh-floatingparent") || dt.table().container();
  }
  function positionDropdown(dropdown, dt, btn) {
    var header = btn.closest("div.dt-column-header");
    var container = getContainer(dt, btn);
    var headerStyle = getComputedStyle(header);
    var dropdownWidth = dropdown.offsetWidth;
    var position = relativePosition(container, btn);
    var left, top;
    top = position.top + btn.offsetHeight;
    if (headerStyle.flexDirection === "row-reverse") {
      left = position.left;
    } else {
      left = position.left - dropdownWidth + btn.offsetWidth;
    }
    var containerWidth = container.offsetWidth;
    if (left + dropdownWidth > containerWidth) {
      left -= left + dropdownWidth - containerWidth;
    }
    if (left < 0) {
      left = 0;
    }
    dropdown.style.top = top + "px";
    dropdown.style.left = left + "px";
  }
  function attachDropdown(dropdown, dt, btn) {
    var dtContainer = getContainer(dt, btn.element());
    dropdown._shown = true;
    dtContainer.append(dropdown);
    positionDropdown(dropdown, dt, btn.element());
    btn.element().setAttribute("aria-expanded", "true");
    var removeDropdown = function(e) {
      if (!dropdown._shown) {
        document.body.removeEventListener("click", removeDropdown);
        return;
      }
      if (e.target === dropdown || dropdown.contains(e.target)) {
        return;
      }
      var datetime = document.querySelector("div.dt-datetime");
      if (datetime && (e.target === datetime || datetime.contains(e.target))) {
        return;
      }
      dropdown._close();
      document.body.removeEventListener("click", removeDropdown);
    };
    document.body.addEventListener("click", removeDropdown);
    return removeDropdown;
  }
  function relativePosition(parent, origin) {
    var top = 0;
    var left = 0;
    while (origin && origin !== parent && origin !== document.body) {
      top += origin.offsetTop;
      left += origin.offsetLeft;
      if (origin.scrollTop) {
        left -= origin.scrollTop;
      }
      if (origin.scrollLeft) {
        left -= origin.scrollLeft;
      }
      origin = origin.offsetParent;
    }
    return {
      top,
      left
    };
  }
  function focusCapture(dropdown, host) {
    return function(e) {
      if (!dropdown._shown) {
        return;
      }
      var elements = Array.from(dropdown.querySelectorAll("a, button, input, select"));
      var active = document.activeElement;
      if (e.key === "Escape") {
        dropdown._close();
        host.focus();
        return;
      } else if (e.key !== "Tab" || elements.length === 0) {
        return;
      }
      if (!elements.includes(active)) {
        elements[0].focus();
        e.preventDefault();
      } else if (e.shiftKey) {
        if (active === elements[0]) {
          elements[elements.length - 1].focus();
          e.preventDefault();
        }
      } else {
        if (active === elements[elements.length - 1]) {
          elements[0].focus();
          e.preventDefault();
        }
      }
    };
  }
  var dropdownContent = {
    classes: {
      container: "dtcc-dropdown",
      liner: "dtcc-dropdown-liner"
    },
    defaults: {
      className: "dropdown",
      content: [],
      icon: "menu",
      text: "More..."
    },
    init: function(config) {
      var dt = this.dt();
      var dropdown = createElement("div", dropdownContent.classes.container, "", [
        createElement("div", dropdownContent.classes.liner)
      ]);
      dropdown._shown = false;
      dropdown._close = function() {
        dropdown.remove();
        dropdown._shown = false;
        btn.element().setAttribute("aria-expanded", "false");
      };
      dropdown.setAttribute("role", "dialog");
      dropdown.setAttribute("aria-label", dt.i18n("columnControl.dropdown", config.text));
      dt.on("fixedheader-mode", function() {
        if (dropdown._shown) {
          attachDropdown(dropdown, dt, config._parents ? config._parents[0] : btn);
        }
      });
      var liner = dropdown.childNodes[0];
      var btn = new Button(dt, this).text(dt.i18n("columnControl.dropdown", config.text)).icon(config.icon).className(config.className).dropdownDisplay(liner).handler(function(e) {
        if (e._closed && e._closed.includes(dropdown)) {
          return;
        }
        attachDropdown(dropdown, dt, config._parents ? config._parents[0] : btn);
        var focusable = dropdown.querySelector("input, a, button");
        if (focusable && e.type === "keypress") {
          focusable.focus();
        }
      });
      btn.element().setAttribute("aria-haspopup", "dialog");
      btn.element().setAttribute("aria-expanded", "false");
      for (var i = 0; i < config.content.length; i++) {
        var content = this.resolve(config.content[i]);
        if (!content.config._parents) {
          content.config._parents = [];
        }
        content.config._parents.push(btn);
        var el = content.plugin.init.call(this, content.config);
        liner.appendChild(el);
      }
      if (config._parents && config._parents.length) {
        btn.extra("chevronRight");
      }
      dt.on("columns-reordered", function() {
        positionDropdown(dropdown, dt, btn.element());
      });
      var capture = focusCapture(dropdown, btn.element());
      document.body.addEventListener("keydown", capture);
      dt.on("destroy", function() {
        document.body.removeEventListener("keydown", capture);
      });
      return btn.element();
    }
  };
  function wrap(paths) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
  }
  var icons = {
    chevronRight: wrap('<path d="m9 18 6-6-6-6"/>'),
    // columns-3
    columns: wrap('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>'),
    // Custom
    contains: wrap('<path d="M10 3h4v18h-4z"/><path d="M18 8h3v9h-3"/><path d="M6 17H3V8h3"/>'),
    empty: wrap('<circle cx="12" cy="12" r="10"/>'),
    ends: wrap('<path d="M21 3h-4v18h4z"/><path d="M13 8H3v9h10"/>'),
    // Customised
    equal: wrap('<line x1="5" x2="19" y1="9" y2="9"/><line x1="5" x2="19" y1="15" y2="15"/>'),
    greater: wrap('<path d="m9 18 6-6-6-6"/>'),
    // Custom
    greaterOrEqual: wrap('<path d="m9 16 6-6-6-6"/><path d="m9 21 6-6"/>'),
    // Custom
    groupAdd: wrap('<path d="M6 21v-7.5m-3.549 3.75H9.75"/><rect width="13.5" height="7.5" x="3" y="3" rx="1.5"/><rect width="7.5" height="7.5" x="13.5" y="13.5" fill="currentColor" rx="1.5"/>'),
    // Custom
    groupClear: wrap('<rect width="13.5" height="7.5" x="3" y="3" rx="1.5"/><rect width="7.5" height="7.5" x="13.5" y="13.5" rx="1.5"/>'),
    // Custom
    groupTop: wrap('<rect width="13.5" height="7.5" x="3" y="3" fill="currentColor" rx="1.5"/><rect width="7.5" height="7.5" x="13.5" y="13.5" rx="1.5"/>'),
    // Custom
    groupRemove: wrap('<path d="M2.451 17.25H9.75"/><rect width="13.5" height="7.5" x="3" y="3" rx="1.5"/><rect width="7.5" height="7.5" x="13.5" y="13.5" rx="1.5"/>'),
    less: wrap('<path d="m15 18-6-6 6-6"/>'),
    // Custom
    lessOrEqual: wrap('<path d="m15 16-6-6 6-6"/><path d="m15 21-6-6"/>'),
    menu: wrap('<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>'),
    // move-horizontal
    move: wrap('<line x1="12" x2="12" y1="3" y2="21"/><polyline points="8 8 4 12 8 16"/><polyline points="16 16 20 12 16 8"/>'),
    // arrow-left-from-line
    moveLeft: wrap('<path d="m9 6-6 6 6 6"/><path d="M3 12h14"/><path d="M21 19V5"/>'),
    // arrow-right-from-line
    moveRight: wrap('<path d="M3 5v14"/><path d="M21 12H7"/><path d="m15 18 6-6-6-6"/>'),
    // Custom
    notContains: wrap('<path d="M15 4 9 20"/><path d="M3 8h18v9H3z"/>'),
    notEmpty: wrap('<circle cx="12" cy="12" r="10"/><line x1="9" x2="15" y1="15" y2="9"/>'),
    notEqual: wrap('<path d="M5 9h14"/><path d="M5 15h14"/><path d="M15 5 9 19"/>'),
    // Custom
    orderAddAsc: wrap('<path d="M17 21v-8"/><path d="M3 4h6"/><path d="M3 8h9"/><path d="M3 12h10"/><path d="M13 17h8"/>'),
    // Custom
    orderAddDesc: wrap('<path d="M17 21v-8"/><path d="M3 4h12"/><path d="M3 8h9"/><path d="M3 12h6"/><path d="M13 17h8"/>'),
    orderAsc: wrap('<path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h4"/><path d="M11 16h7"/><path d="M11 20h10"/>'),
    // Custom
    orderClear: wrap('<path d="m21 21-8-8"/><path d="M3 4h12"/><path d="M3 8h9"/><path d="M3 12h6"/><path d="m13 21 8-8"/>'),
    orderDesc: wrap('<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10"/><path d="M11 8h7"/><path d="M11 12h4"/>'),
    // Custom
    orderRemove: wrap('<path d="M3 4h12"/><path d="M3 8h9"/><path d="M3 12h6"/><path d="M13 17h8"/>'),
    // Custom
    orderNone: wrap('<path d="m3 8 4-4 4 4"/><path d="m11 16-4 4-4-4"/><path d="M7 4v16"/><path d="M15 8h6"/><path d="M15 16h6"/><path d="M13 12h8"/>'),
    // search
    search: wrap('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    // search-x
    searchClear: wrap('<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    // Custom
    starts: wrap('<path d="M3 3h4v18H3z"/><path d="M11 8h10v9H11"/>'),
    // tick
    tick: wrap('<path d="M20 6 9 17l-5-5"/>'),
    // x
    x: wrap('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')
  };
  var _namespace = 0;
  var Button = (
    /** @class */
    function() {
      function Button2(dt, host) {
        this._s = {
          active: false,
          activeList: [],
          buttonClick: null,
          dt: null,
          enabled: true,
          host: null,
          label: "",
          namespace: "",
          value: null
        };
        this._s.dt = dt;
        this._s.host = host;
        this._dom = {
          button: createElement("button", Button2.classes.container),
          dropdownDisplay: null,
          extra: createElement("span", "dtcc-button-extra"),
          icon: createElement("span", "dtcc-button-icon"),
          state: createElement("span", "dtcc-button-state"),
          text: createElement("span", "dtcc-button-text")
        };
        this._dom.button.setAttribute("type", "button");
        this._dom.button.append(this._dom.icon);
        this._dom.button.append(this._dom.text);
        this._dom.button.append(this._dom.state);
        this._dom.button.append(this._dom.extra);
        this.enable(true);
      }
      Button2.prototype.active = function(active) {
        if (active === void 0) {
          return this._s.active;
        }
        this._s.active = active;
        this._checkActive();
        return this;
      };
      Button2.prototype.activeList = function(unique, active) {
        this._s.activeList[unique] = active;
        this._checkActive();
        return this;
      };
      Button2.prototype.checkDisplay = function() {
        var visible = 0;
        var children = this._dom.dropdownDisplay.childNodes;
        for (var i = 0; i < children.length; i++) {
          if (children[i].style.display !== "none") {
            visible++;
          }
        }
        if (visible === 0) {
          this._dom.button.style.display = "none";
        }
        return this;
      };
      Button2.prototype.className = function(className) {
        this._dom.button.classList.add("dtcc-button_" + className);
        return this;
      };
      Button2.prototype.destroy = function() {
        if (this._s.buttonClick) {
          this._dom.button.removeEventListener("click", this._s.buttonClick);
          this._dom.button.removeEventListener("keypress", this._s.buttonClick);
        }
        this._s.host.destroyRemove(this);
      };
      Button2.prototype.dropdownDisplay = function(el) {
        this._dom.dropdownDisplay = el;
        return this;
      };
      Button2.prototype.element = function() {
        return this._dom.button;
      };
      Button2.prototype.enable = function(enable) {
        if (enable === void 0) {
          return this._s.enabled;
        }
        this._dom.button.classList.toggle("dtcc-button_disabled", !enable);
        this._s.enabled = enable;
        return this;
      };
      Button2.prototype.extra = function(icon) {
        this._dom.extra.innerHTML = icon ? icons[icon] : "";
        return this;
      };
      Button2.prototype.handler = function(fn) {
        var _this = this;
        var buttonClick = function(e) {
          close(e);
          e.stopPropagation();
          e.preventDefault();
          if (_this._s.enabled) {
            fn(e);
          }
        };
        this._s.buttonClick = buttonClick;
        this._s.namespace = "dtcc-" + _namespace++;
        this._dom.button.addEventListener("click", buttonClick);
        this._dom.button.addEventListener("keypress", buttonClick);
        this._s.host.destroyAdd(this);
        return this;
      };
      Button2.prototype.icon = function(icon) {
        this._dom.icon.innerHTML = icon ? icons[icon] : "";
        return this;
      };
      Button2.prototype.text = function(text) {
        if (text === void 0) {
          return this._s.label;
        }
        this._dom.text.innerHTML = text;
        this._s.label = text;
        this._dom.button.setAttribute("aria-label", text);
        return this;
      };
      Button2.prototype.value = function(val) {
        if (val === void 0) {
          return this._s.value;
        }
        this._s.value = val;
        return this;
      };
      Button2.prototype._checkActive = function() {
        if (this._s.active === true || Object.values(this._s.activeList).includes(true)) {
          this._dom.state.innerHTML = icons.tick;
          this._dom.button.classList.add("dtcc-button_active");
        } else {
          this._dom.state.innerHTML = "";
          this._dom.button.classList.remove("dtcc-button_active");
        }
        return this;
      };
      Button2.classes = {
        container: "dtcc-button"
      };
      return Button2;
    }()
  );
  var CheckList = (
    /** @class */
    function() {
      function CheckList2(dt, host, opts) {
        var _this = this;
        this._s = {
          buttons: [],
          dt: null,
          handler: function() {
          },
          host: null,
          search: ""
        };
        this._s.dt = dt;
        this._s.host = host;
        this._dom = {
          buttons: createElement("div", "dtcc-list-buttons"),
          container: createElement("div", CheckList2.classes.container),
          controls: createElement("div", "dtcc-list-controls"),
          empty: createElement("div", "dtcc-list-empty", dt.i18n("columnControl.list.empty", "No options")),
          title: createElement("div", "dtcc-list-title"),
          selectAll: createElement("button", "dtcc-list-selectAll", dt.i18n("columnControl.list.all", "Select all")),
          selectAllCount: createElement("span"),
          selectNone: createElement("button", "dtcc-list-selectNone", dt.i18n("columnControl.list.none", "Deselect")),
          selectNoneCount: createElement("span"),
          search: createElement("input", CheckList2.classes.input)
        };
        var dom = this._dom;
        dom.search.setAttribute("type", "text");
        dom.container.append(dom.title);
        dom.container.append(dom.controls);
        dom.container.append(dom.empty);
        dom.container.append(dom.buttons);
        if (opts.select) {
          dom.controls.append(dom.selectAll);
          dom.controls.append(dom.selectNone);
          dom.selectAll.append(dom.selectAllCount);
          dom.selectNone.append(dom.selectNoneCount);
          dom.selectAll.setAttribute("type", "button");
          dom.selectNone.setAttribute("type", "button");
        }
        var searchInput = function() {
          _this._s.search = dom.search.value;
          _this._redraw();
        };
        var selectAllClick = function(e) {
          _this.selectAll();
          _this._s.handler(e, null, _this._s.buttons, true);
          _this._updateCount();
        };
        var selectNoneClick = function(e) {
          _this.selectNone();
          _this._s.handler(e, null, _this._s.buttons, true);
          _this._updateCount();
        };
        if (opts.search) {
          dom.controls.append(dom.search);
          dom.search.setAttribute("placeholder", dt.i18n("columnControl.list.search", "Search..."));
          dom.search.addEventListener("input", searchInput);
        }
        dom.selectAll.addEventListener("click", selectAllClick);
        dom.selectNone.addEventListener("click", selectNoneClick);
        dt.on("destroy", function() {
          dom.selectAll.removeEventListener("click", selectAllClick);
          dom.selectNone.removeEventListener("click", selectNoneClick);
          dom.search.removeEventListener("input", searchInput);
        });
      }
      CheckList2.prototype.add = function(options, update) {
        var _this = this;
        if (!Array.isArray(options)) {
          options = [options];
        }
        var _loop_1 = function(i2) {
          var option = options[i2];
          var btn = new Button(this_1._s.dt, this_1._s.host).active(option.active || false).handler(function(e) {
            _this._s.handler(e, btn, _this._s.buttons, true);
            _this._updateCount();
          }).icon(option.icon || "").text(option.label !== "" ? option.label : this_1._s.dt.i18n("columnControl.list.empty", "Empty")).value(option.value);
          if (option.label === "") {
            btn.className("empty");
          }
          this_1._s.buttons.push(btn);
        };
        var this_1 = this;
        for (var i = 0; i < options.length; i++) {
          _loop_1(i);
        }
        var count = this._s.buttons.length;
        if (update === true || update === void 0) {
          this._dom.selectAllCount.innerHTML = count ? "(" + count + ")" : "";
          this._redraw();
        }
        return this;
      };
      CheckList2.prototype.button = function(val) {
        var buttons = this._s.buttons;
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].value() === val) {
            return buttons[i];
          }
        }
        return null;
      };
      CheckList2.prototype.clear = function() {
        for (var i = 0; i < this._s.buttons.length; i++) {
          this._s.buttons[i].destroy();
        }
        this._dom.buttons.replaceChildren();
        this._s.buttons.length = 0;
        return this;
      };
      CheckList2.prototype.element = function() {
        return this._dom.container;
      };
      CheckList2.prototype.handler = function(fn) {
        this._s.handler = fn;
        return this;
      };
      CheckList2.prototype.searchListener = function(dt) {
        var _this = this;
        dt.on("cc-search-clear", function(e, colIdx) {
          if (colIdx === _this._s.host.idx()) {
            _this.selectNone();
            _this._s.handler(e, null, _this._s.buttons, false);
            _this._s.search = "";
            _this._dom.search.value = "";
            _this._redraw();
            _this._updateCount();
          }
        });
        return this;
      };
      CheckList2.prototype.selectAll = function() {
        for (var i = 0; i < this._s.buttons.length; i++) {
          this._s.buttons[i].active(true);
        }
        return this;
      };
      CheckList2.prototype.selectNone = function() {
        for (var i = 0; i < this._s.buttons.length; i++) {
          this._s.buttons[i].active(false);
        }
        return this;
      };
      CheckList2.prototype.title = function(title2) {
        this._dom.title.innerHTML = title2;
        return this;
      };
      CheckList2.prototype.values = function(values) {
        var i;
        var result = [];
        var buttons = this._s.buttons;
        if (values !== void 0) {
          for (i = 0; i < buttons.length; i++) {
            if (values.includes(buttons[i].value())) {
              buttons[i].active(true);
            }
          }
          this._updateCount();
          return this;
        }
        for (i = 0; i < buttons.length; i++) {
          if (buttons[i].active()) {
            result.push(buttons[i].value());
          }
        }
        return result;
      };
      CheckList2.prototype._updateCount = function() {
        var count = this.values().length;
        this._dom.selectNoneCount.innerHTML = count ? "(" + count + ")" : "";
      };
      CheckList2.prototype._redraw = function() {
        var buttons = this._s.buttons;
        var el = this._dom.buttons;
        var searchTerm = this._s.search.toLowerCase();
        el.replaceChildren();
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          if (!searchTerm || btn.text().toLowerCase().includes(searchTerm)) {
            el.appendChild(btn.element());
          }
        }
        this._dom.empty.style.display = buttons.length === 0 ? "block" : "none";
        el.style.display = buttons.length > 0 ? "block" : "none";
      };
      CheckList2.classes = {
        container: "dtcc-list",
        input: "dtcc-list-search"
      };
      return CheckList2;
    }()
  );
  var colVis = {
    defaults: {
      className: "colVis",
      columns: "",
      search: false,
      select: false,
      title: "Column visibility"
    },
    init: function(config) {
      var dt = this.dt();
      var checkList = new CheckList(dt, this, {
        search: config.search,
        select: config.select
      }).title(dt.i18n("columnControl.colVis", config.title)).handler(function(e, btn, buttons) {
        if (btn) {
          btn.active(!btn.active());
        }
        apply(buttons);
      });
      var apply = function(buttons) {
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          var idx = btn.value();
          var col = dt.column(idx);
          if (btn.active() && !col.visible()) {
            col.visible(true);
          } else if (!btn.active() && col.visible()) {
            col.visible(false);
          }
        }
      };
      var rebuild = function() {
        var columns = dt.columns(config.columns);
        columns.every(function() {
          checkList.add({
            active: this.visible(),
            label: this.title(),
            value: this.index()
          });
        });
      };
      rebuild();
      dt.on("column-visibility", function(e, s, colIdx, state) {
        var btn = checkList.button(colIdx);
        if (btn) {
          btn.active(state);
        }
      });
      dt.on("columns-reordered", function(e, details) {
        checkList.clear();
        rebuild();
      });
      return checkList.element();
    }
  };
  var colVisDropdown = {
    defaults: {
      className: "colVis",
      columns: "",
      search: false,
      select: false,
      text: "Column visibility",
      title: "Column visibility"
    },
    extend: function(config) {
      var dt = this.dt();
      return {
        extend: "dropdown",
        icon: "columns",
        text: dt.i18n("columnControl.colVisDropdown", config.text),
        content: [
          Object.assign(config, {
            extend: "colVis"
          })
        ]
      };
    }
  };
  var reorder = {
    defaults: {
      className: "reorder",
      icon: "move",
      text: "Reorder columns"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.reorder", config.text)).icon(config.icon).className(config.className);
      if (this.idx() === 0) {
        btn.enable(false);
      }
      dt.on("columns-reordered", function(e, details) {
        btn.enable(_this.idx() > 0);
      });
      if (!dt.init().colReorder) {
        new dataTables_default.ColReorder(dt, {});
      }
      return btn.element();
    }
  };
  var reorderLeft = {
    defaults: {
      className: "reorderLeft",
      icon: "moveLeft",
      text: "Move column left"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.reorderLeft", config.text)).icon(config.icon).className(config.className).handler(function() {
        var idx = _this.idx();
        if (idx > 0) {
          dt.colReorder.move(idx, idx - 1);
        }
      });
      if (this.idx() === 0) {
        btn.enable(false);
      }
      dt.on("columns-reordered", function(e, details) {
        btn.enable(_this.idx() > 0);
      });
      return btn.element();
    }
  };
  var reorderRight = {
    defaults: {
      className: "reorderRight",
      icon: "moveRight",
      text: "Move column right"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.reorderRight", config.text)).icon(config.icon).className(config.className).handler(function() {
        var idx = _this.idx();
        if (idx < dt.columns().count() - 1) {
          dt.colReorder.move(idx, idx + 1);
        }
      });
      if (this.idx() === dt.columns().count() - 1) {
        btn.enable(false);
      }
      dt.on("columns-reordered", function(e, details) {
        btn.enable(_this.idx() < dt.columns().count() - 1);
      });
      return btn.element();
    }
  };
  var order = {
    defaults: {
      className: "order",
      iconAsc: "orderAsc",
      iconDesc: "orderDesc",
      iconNone: "orderNone",
      statusOnly: false,
      text: "Toggle ordering"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.order", config.text)).icon("orderAsc").className(config.className);
      if (!config.statusOnly) {
        dt.order.listener(btn.element(), dataTables_default.versionCheck("2.3.2") ? function() {
          return [_this.idx()];
        } : this.idx(), function() {
        });
      }
      dt.on("order", function(e, s, order2) {
        var found = order2.find(function(o) {
          return o.col === _this.idx();
        });
        if (!found) {
          btn.active(false).icon(config.iconNone);
        } else if (found.dir === "asc") {
          btn.active(true).icon(config.iconAsc);
        } else if (found.dir === "desc") {
          btn.active(true).icon(config.iconDesc);
        }
      });
      return btn.element();
    }
  };
  var orderAddAsc = {
    defaults: {
      className: "orderAddAsc",
      icon: "orderAddAsc",
      text: "Add Sort Ascending"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.orderAddAsc", config.text)).icon(config.icon).className(config.className).handler(function() {
        var order2 = dt.order();
        order2.push([_this.idx(), "asc"]);
        dt.draw();
      });
      dt.on("order", function(e, s, order2) {
        var found = order2.some(function(o) {
          return o.col === _this.idx();
        });
        btn.enable(!found);
      });
      return btn.element();
    }
  };
  var orderAddDesc = {
    defaults: {
      className: "orderAddDesc",
      icon: "orderAddDesc",
      text: "Add Sort Descending"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.orderAddDesc", config.text)).icon(config.icon).className(config.className).handler(function() {
        var order2 = dt.order();
        order2.push([_this.idx(), "desc"]);
        dt.draw();
      });
      dt.on("order", function(e, s, order2) {
        var found = order2.some(function(o) {
          return o.col === _this.idx();
        });
        btn.enable(!found);
      });
      return btn.element();
    }
  };
  var orderAsc = {
    defaults: {
      className: "orderAsc",
      icon: "orderAsc",
      text: "Sort Ascending"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.orderAsc", config.text)).icon(config.icon).className(config.className).handler(function() {
        _this.dt().order([
          {
            idx: _this.idx(),
            dir: "asc"
          }
        ]).draw();
      });
      dt.on("order", function(e, s, order2) {
        var found = order2.some(function(o) {
          return o.col === _this.idx() && o.dir === "asc";
        });
        btn.active(found);
      });
      return btn.element();
    }
  };
  var orderClear = {
    defaults: {
      className: "orderClear",
      icon: "orderClear",
      text: "Clear sort"
    },
    init: function(config) {
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.orderClear", config.text)).icon(config.icon).className(config.className).handler(function() {
        dt.order([]).draw();
      });
      dt.on("order", function(e, s, order2) {
        btn.enable(order2.length > 0);
      });
      if (dt.order().length === 0) {
        btn.enable(false);
      }
      return btn.element();
    }
  };
  var orderDesc = {
    defaults: {
      className: "orderDesc",
      icon: "orderDesc",
      text: "Sort Descending"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.orderDesc", config.text)).icon(config.icon).className(config.className).handler(function() {
        _this.dt().order([
          {
            idx: _this.idx(),
            dir: "desc"
          }
        ]).draw();
      });
      dt.on("order", function(e, s, order2) {
        var found = order2.some(function(o) {
          return o.col === _this.idx() && o.dir === "desc";
        });
        btn.active(found);
      });
      return btn.element();
    }
  };
  var orderRemove = {
    defaults: {
      className: "orderRemove",
      icon: "orderRemove",
      text: "Remove from sort"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.orderRemove", config.text)).icon(config.icon).className(config.className).handler(function() {
        var order2 = dt.order();
        var idx = order2.findIndex(function(o) {
          return o[0] === _this.idx();
        });
        order2.splice(idx, 1);
        dt.order(order2).draw();
      });
      dt.on("order", function(e, s, order2) {
        var found = order2.some(function(o) {
          return o.col === _this.idx();
        });
        btn.enable(found);
      });
      btn.enable(false);
      return btn.element();
    }
  };
  var orderStatus = {
    defaults: {
      className: "order",
      iconAsc: "orderAsc",
      iconDesc: "orderDesc",
      iconNone: "orderNone",
      statusOnly: true,
      text: "Sort status"
    },
    extend: function(config) {
      return Object.assign(config, { extend: "order" });
    }
  };
  function rowGroupAdd$1(dt, dataSrc) {
    var applied = rowGroupApplied(dt);
    var idx = applied.indexOf(dataSrc);
    if (idx === -1) {
      applied.push(dataSrc);
      dt.rowGroup().dataSrc(applied);
    }
    return applied;
  }
  function rowGroupApplied(dt) {
    var applied = dt.rowGroup().dataSrc();
    return Array.isArray(applied) ? applied : [applied];
  }
  function rowGroupClear$1(dt) {
    dt.rowGroup().dataSrc([]);
  }
  function rowGroupRemove$1(dt, dataSrc) {
    var applied = rowGroupApplied(dt);
    var idx = applied.indexOf(dataSrc);
    if (idx !== -1) {
      applied.splice(idx, 1);
      dt.rowGroup().dataSrc(applied);
    }
    return applied;
  }
  var rowGroup = {
    defaults: {
      className: "rowGroup",
      icon: "groupTop",
      order: true,
      text: "Group rows"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.rowGroup", config.text)).icon(config.icon).className(config.className).handler(function() {
        var dataSrc = dt.column(_this.idx()).dataSrc();
        if (btn.active()) {
          rowGroupRemove$1(dt, dataSrc);
        } else {
          rowGroupClear$1(dt);
          rowGroupAdd$1(dt, dataSrc);
          if (config.order !== false) {
            dt.order([_this.idx(), "asc"]);
          }
        }
        dt.draw();
      });
      dt.on("rowgroup-datasrc", function() {
        var applied = rowGroupApplied(dt);
        var ours = dt.column(_this.idx()).dataSrc();
        btn.active(applied.includes(ours));
      });
      return btn.element();
    }
  };
  var rowGroupAdd = {
    defaults: {
      className: "rowGroupAdd",
      icon: "groupAdd",
      order: true,
      text: "Add to grouping"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.rowGroup", config.text)).icon(config.icon).className(config.className).handler(function() {
        var dataSrc = dt.column(_this.idx()).dataSrc();
        if (btn.enable()) {
          rowGroupAdd$1(dt, dataSrc);
        }
        dt.draw();
      });
      dt.on("rowgroup-datasrc", function() {
        var applied = rowGroupApplied(dt);
        var ours = dt.column(_this.idx()).dataSrc();
        btn.enable(!applied.includes(ours));
      });
      return btn.element();
    }
  };
  var rowGroupClear = {
    defaults: {
      className: "rowGroupClear",
      icon: "groupClear",
      text: "Clear all grouping"
    },
    init: function(config) {
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.rowGroup", config.text)).icon(config.icon).className(config.className).handler(function() {
        rowGroupClear$1(dt);
        dt.draw();
      });
      dt.on("rowgroup-datasrc", function() {
        btn.enable(rowGroupApplied(dt).length > 0);
      });
      btn.enable(rowGroupApplied(dt).length > 0);
      return btn.element();
    }
  };
  var rowGroupRemove = {
    defaults: {
      className: "rowGroupRemove",
      icon: "groupRemove",
      order: true,
      text: "Remove from grouping"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.rowGroup", config.text)).icon(config.icon).className(config.className).handler(function() {
        var dataSrc = dt.column(_this.idx()).dataSrc();
        if (btn.enable()) {
          rowGroupRemove$1(dt, dataSrc);
          dt.draw();
        }
      });
      dt.on("rowgroup-datasrc", function() {
        var applied = rowGroupApplied(dt);
        var ours = dt.column(_this.idx()).dataSrc();
        btn.enable(applied.includes(ours));
      });
      btn.enable(false);
      return btn.element();
    }
  };
  var SearchInput = (
    /** @class */
    function() {
      function SearchInput2(dt, idx, columnUnique) {
        var _this = this;
        this._type = "text";
        this._sspTransform = null;
        this._sspData = {};
        this._dt = dt;
        this._idx = idx;
        this._colUnique = columnUnique;
        this._dom = {
          clear: createElement("span", "dtcc-search-clear", icons["x"]),
          container: createElement("div", SearchInput2.classes.container),
          typeIcon: createElement("div", "dtcc-search-type-icon"),
          searchIcon: createElement("div", "dtcc-search-icon", icons["search"]),
          input: createElement("input", SearchInput2.classes.input),
          inputs: createElement("div"),
          select: createElement("select", SearchInput2.classes.select),
          title: createElement("div", "dtcc-search-title")
        };
        var dom = this._dom;
        var originalIdx = idx;
        dom.input.setAttribute("type", "text");
        dom.container.append(dom.title, dom.inputs);
        dom.inputs.append(dom.typeIcon, dom.select, dom.searchIcon, dom.clear, dom.input);
        var inputInput = function() {
          _this.runSearch();
        };
        var selectInput = function() {
          dom.typeIcon.innerHTML = icons[dom.select.value];
          _this.runSearch();
        };
        var clearClick = function() {
          _this.clear();
        };
        dom.input.addEventListener("input", inputInput);
        dom.select.addEventListener("input", selectInput);
        dom.clear.addEventListener("click", clearClick);
        dt.on("destroy", function() {
          dom.input.removeEventListener("input", inputInput);
          dom.select.removeEventListener("input", selectInput);
          dom.clear.removeEventListener("click", clearClick);
        });
        dt.on("stateSaveParams.DT", function(e, s, data) {
          if (!data.columnControl) {
            data.columnControl = {};
          }
          if (!data.columnControl[_this._colUnique]) {
            data.columnControl[_this._colUnique] = {};
          }
          data.columnControl[_this._colUnique].searchInput = {
            logic: dom.select.value,
            type: _this._type,
            value: dom.input.value
          };
        });
        dt.on("stateLoaded.DT", function(e, s, state) {
          _this._stateLoad(state);
        });
        dt.on("columns-reordered.DT", function(e, details) {
          _this._idx = dt.colReorder.transpose(originalIdx, "fromOriginal");
        });
        dt.on("cc-search-clear.DT", function(e, colIdx) {
          if (colIdx === _this._idx) {
            _this._loadingState = true;
            _this.clear();
            _this._loadingState = false;
          }
        });
        if (dt.page.info().serverSide) {
          dt.on("preXhr.DT", function(e, s, d) {
            if (!d.columns || !d.columns[_this._idx]) {
              return;
            }
            if (!d.columns[_this._idx].columnControl) {
              d.columns[_this._idx].columnControl = {};
            }
            var val = _this._dom.input.value;
            if (_this._sspTransform) {
              val = _this._sspTransform(val);
            }
            d.columns[_this._idx].columnControl.search = Object.assign({
              value: val,
              logic: _this._dom.select.value,
              type: _this._type
            }, _this._sspData);
          });
        }
      }
      SearchInput2.prototype.addClass = function(name) {
        this._dom.container.classList.add(name);
        return this;
      };
      SearchInput2.prototype.clear = function() {
        this.set(this._dom.select.children[0].getAttribute("value"), "");
        return this;
      };
      SearchInput2.prototype.clearable = function(set) {
        if (!set) {
          this._dom.clear.remove();
        }
        return this;
      };
      SearchInput2.prototype.element = function() {
        return this._dom.container;
      };
      SearchInput2.prototype.input = function() {
        return this._dom.input;
      };
      SearchInput2.prototype.options = function(opts) {
        var select = this._dom.select;
        for (var i = 0; i < opts.length; i++) {
          select.add(new Option(opts[i].label, opts[i].value));
        }
        this._dom.typeIcon.innerHTML = icons[opts[0].value];
        return this;
      };
      SearchInput2.prototype.placeholder = function(placeholder) {
        if (placeholder) {
          var columnTitle = this._dt.column(this._idx).title();
          this._dom.input.placeholder = placeholder.replace("[title]", columnTitle);
        }
        return this;
      };
      SearchInput2.prototype.runSearch = function() {
        var dom = this._dom;
        var isActive = dom.select.value === "empty" || dom.select.value === "notEmpty" || dom.input.value !== "";
        dom.container.classList.toggle("dtcc-search_active", isActive);
        if (this._search && (this._lastValue !== dom.input.value || this._lastType !== dom.select.value)) {
          this._search(dom.select.value, dom.input.value, this._loadingState);
          this._lastValue = dom.input.value;
          this._lastType = dom.select.value;
        }
      };
      SearchInput2.prototype.search = function(fn) {
        this._search = fn;
        this._stateLoad(this._dt.state.loaded());
        return this;
      };
      SearchInput2.prototype.set = function(logic, val) {
        var dom = this._dom;
        dom.input.value = val;
        dom.select.value = logic;
        dom.typeIcon.innerHTML = icons[dom.select.value];
        this.runSearch();
        return this;
      };
      SearchInput2.prototype.sspTransform = function(fn) {
        this._sspTransform = fn;
        return this;
      };
      SearchInput2.prototype.sspData = function(data) {
        this._sspData = data;
        return this;
      };
      SearchInput2.prototype.title = function(text) {
        if (text) {
          var columnTitle = this._dt.column(this._idx).title();
          this._dom.title.innerHTML = text.replace("[title]", columnTitle);
        }
        return this;
      };
      SearchInput2.prototype.titleAttr = function(title2) {
        if (title2) {
          var columnTitle = this._dt.column(this._idx).title();
          this._dom.input.title = title2.replace("[title]", columnTitle);
        }
        return this;
      };
      SearchInput2.prototype.type = function(t) {
        this._type = t;
        return this;
      };
      SearchInput2.prototype._stateLoad = function(state) {
        var _a, _b;
        var dom = this._dom;
        var idx = this._colUnique;
        var loadedState = (_b = (_a = state === null || state === void 0 ? void 0 : state.columnControl) === null || _a === void 0 ? void 0 : _a[idx]) === null || _b === void 0 ? void 0 : _b.searchInput;
        if (loadedState) {
          this._loadingState = true;
          dom.select.value = loadedState.logic;
          dom.input.value = loadedState.value;
          dom.select.dispatchEvent(new Event("input"));
          this._loadingState = false;
        }
      };
      SearchInput2.classes = {
        container: ["dtcc-content", "dtcc-search"],
        input: "",
        select: ""
      };
      return SearchInput2;
    }()
  );
  var searchDateTime = {
    defaults: {
      clear: true,
      excludeLogic: [],
      format: "",
      mask: "",
      placeholder: "",
      title: "",
      titleAttr: ""
    },
    init: function(config) {
      var _this = this;
      var fromPicker = false;
      var moment = dataTables_default.use("moment");
      var luxon = dataTables_default.use("luxon");
      var dt = this.dt();
      var i18nBase = "columnControl.search.datetime.";
      var pickerFormat = "";
      var dataSrcFormat = "";
      var dateTime;
      var searchInput = new SearchInput(dt, this.idx(), this.idxOriginal()).type("date").addClass("dtcc-searchDateTime").sspTransform(function(val) {
        return toISO(val, pickerFormat, moment, luxon);
      }).sspData({ mask: config.mask }).clearable(config.clear).placeholder(config.placeholder).title(config.title).titleAttr(config.titleAttr).options([
        { label: dt.i18n(i18nBase + "equal", "Equals"), value: "equal" },
        { label: dt.i18n(i18nBase + "notEqual", "Does not equal"), value: "notEqual" },
        { label: dt.i18n(i18nBase + "greater", "After"), value: "greater" },
        { label: dt.i18n(i18nBase + "less", "Before"), value: "less" },
        { label: dt.i18n(i18nBase + "empty", "Empty"), value: "empty" },
        { label: dt.i18n(i18nBase + "notEmpty", "Not empty"), value: "notEmpty" }
      ].filter(function(x) {
        return !config.excludeLogic.includes(x.value);
      })).search(function(searchType, searchTerm, loadingState) {
        if (config._parents) {
          config._parents.forEach(function(btn) {
            return btn.activeList(_this.unique() + "date", searchType === "empty" || searchType === "notEmpty" || !!searchTerm);
          });
        }
        var column = dt.column(_this.idx());
        if (dt.page.info().serverSide) {
          column.init().__ccList = !!(searchType === "empty" || searchType === "notEmpty" || searchTerm);
          if (!loadingState) {
            dt.draw();
          }
          return;
        }
        var mask = config.mask;
        var search2 = searchTerm === "" ? "" : dateToNum(dateTime && fromPicker ? dateTime.val() : searchTerm.trim(), pickerFormat, moment, luxon, mask);
        if (searchType === "empty") {
          column.search.fixed("dtcc", function(haystack) {
            return !haystack;
          });
        } else if (searchType === "notEmpty") {
          column.search.fixed("dtcc", function(haystack) {
            return !!haystack;
          });
        } else if (column.search.fixed("dtcc") === "" && search2 === "") {
          return;
        } else if (!search2) {
          column.search.fixed("dtcc", "");
        } else if (searchType === "equal") {
          column.search.fixed("dtcc", function(haystack) {
            return dateToNum(haystack, dataSrcFormat, moment, luxon, mask) == search2;
          });
        } else if (searchType === "notEqual") {
          column.search.fixed("dtcc", function(haystack) {
            return dateToNum(haystack, dataSrcFormat, moment, luxon, mask) != search2;
          });
        } else if (searchType === "greater") {
          column.search.fixed("dtcc", function(haystack) {
            return dateToNum(haystack, dataSrcFormat, moment, luxon, mask) > search2;
          });
        } else if (searchType === "less") {
          column.search.fixed("dtcc", function(haystack) {
            return dateToNum(haystack, dataSrcFormat, moment, luxon, mask) < search2;
          });
        }
        if (!loadingState) {
          column.draw();
        }
      });
      dt.ready(function() {
        var DateTime = dataTables_default.use("datetime");
        dataSrcFormat = getFormat(dt, _this.idx());
        pickerFormat = config.format ? config.format : dataSrcFormat;
        if (DateTime) {
          dateTime = new DateTime(searchInput.input(), {
            format: pickerFormat,
            i18n: dt.settings()[0].oLanguage.datetime,
            // could be undefined
            onChange: function() {
              fromPicker = true;
              searchInput.runSearch();
              fromPicker = false;
            }
          });
        }
      });
      return searchInput.element();
    }
  };
  function getFormat(dt, column) {
    var type = dt.column(column).type();
    if (!type) {
      return "YYYY-MM-DD";
    } else if (type === "datetime") {
      var renderer = dt.settings()[0].aoColumns[column].mRender;
      var resultPm = renderer("1999-08-07T23:05:04Z", "display");
      var resultAm = renderer("1999-08-07T03:05:04Z", "display");
      var leadingZero = resultAm.includes("03");
      if (dataTables_default.use("moment")) {
        return resultPm.replace("23", leadingZero ? "HH" : "H").replace("11", leadingZero ? "hh" : "h").replace("05", "mm").replace("04", "ss").replace("PM", "A").replace("pm", "a").replace("07", "DD").replace("7", "D").replace("08", "MM").replace("8", "M").replace("1999", "YYYY").replace("99", "YY");
      } else if (dataTables_default.use("luxon")) {
        return resultPm.replace("23", leadingZero ? "HH" : "H").replace("11", leadingZero ? "hh" : "h").replace("05", "mm").replace("04", "ss").replace("PM", "a").replace("07", "dd").replace("7", "d").replace("08", "MM").replace("8", "M").replace("1999", "yyyy").replace("99", "yy");
      } else if (resultPm.includes("23") && resultPm.includes("1999")) {
        return "YYYY-MM-DD hh:mm:ss";
      } else if (resultPm.includes("23")) {
        return "hh:mm:ss";
      }
    } else if (type.includes("datetime-")) {
      return type.replace(/datetime-/g, "");
    } else if (type.includes("moment")) {
      return type.replace(/moment-/g, "");
    } else if (type.includes("luxon")) {
      return type.replace(/luxon-/g, "");
    }
    return "YYYY-MM-DD";
  }
  function dateToNum(input, srcFormat, moment, luxon, mask) {
    var d;
    if (input === "") {
      return "";
    }
    if (input instanceof Date) {
      d = input;
    } else if (srcFormat !== "YYYY-MM-DD" && (moment || luxon)) {
      d = new Date(moment ? moment(input, srcFormat).unix() * 1e3 : luxon.DateTime.fromFormat(input, srcFormat).toMillis());
    } else {
      d = new Date(input.replace(/\//g, "-"));
    }
    if (mask) {
      if (!mask.includes("YYYY")) {
        d.setFullYear(1970);
      }
      if (!mask.includes("MM")) {
        d.setUTCMonth(0);
      }
      if (!mask.includes("DD")) {
        d.setUTCDate(1);
      }
      if (!mask.includes("hh")) {
        d.setUTCHours(0);
      }
      if (!mask.includes("mm")) {
        d.setUTCMinutes(0);
      }
      if (!mask.includes("ss")) {
        d.setUTCSeconds(0);
      }
      if (!mask.includes("sss")) {
        d.setUTCMilliseconds(0);
      }
    }
    return d.getTime();
  }
  function toISO(input, srcFormat, moment, luxon) {
    if (input === "") {
      return "";
    } else if (srcFormat !== "YYYY-MM-DD" && moment) {
      return moment.utc(input, srcFormat).toISOString();
    } else if (srcFormat !== "YYYY-MM-DD" && luxon) {
      return luxon.DateTime.fromFormat(input, srcFormat).toISO();
    }
    input = input.replace(/\//g, "-");
    return input;
  }
  function setOptions(checkList, opts, activeList) {
    if (activeList === void 0) {
      activeList = [];
    }
    var existing = checkList.values();
    checkList.clear();
    for (var i = 0; i < opts.length; i++) {
      if (typeof opts[i] === "object") {
        checkList.add({
          active: activeList.includes(opts[i].value),
          label: opts[i].label,
          value: opts[i].value
        }, i === opts.length - 1);
      } else {
        checkList.add({
          active: activeList.includes(opts[i]),
          label: opts[i],
          value: opts[i]
        }, i === opts.length - 1);
      }
    }
    if (existing.length) {
      checkList.values(existing);
    }
  }
  function getState(columnIdx, state) {
    var _a, _b;
    var loadedState = (_b = (_a = state === null || state === void 0 ? void 0 : state.columnControl) === null || _a === void 0 ? void 0 : _a[columnIdx]) === null || _b === void 0 ? void 0 : _b.searchList;
    if (loadedState) {
      return loadedState;
    }
  }
  function getJsonOptions(dt, idx) {
    var _a;
    var json = (_a = dt.ajax.json()) === null || _a === void 0 ? void 0 : _a.columnControl;
    var column = dt.column(idx);
    var name = column.name();
    var dataSrc = column.dataSrc();
    if (json && json[name]) {
      return json[name];
    } else if (json && typeof dataSrc === "string" && json[dataSrc]) {
      return json[dataSrc];
    } else if (json && json[idx]) {
      return json[idx];
    }
    return null;
  }
  function reloadOptions(dt, config, idx, checkList, loadedValues) {
    var _a;
    var json = (_a = dt.ajax.json()) === null || _a === void 0 ? void 0 : _a.columnControl;
    var options = [];
    var jsonOptions = getJsonOptions(dt, idx);
    if (jsonOptions) {
      options = jsonOptions;
    } else if (json && config.ajaxOnly) {
      if (config.hidable) {
        checkList.element().style.display = "none";
        if (config._parents) {
          config._parents.forEach(function(btn) {
            return btn.checkDisplay();
          });
        }
      }
      return;
    } else if (!dt.page.info().serverSide) {
      var found = {};
      var rows = dt.rows({ order: idx }).indexes().toArray();
      var settings = dt.settings()[0];
      for (var i = 0; i < rows.length; i++) {
        var raw = settings.fastData(rows[i], idx, "filter");
        var filter = raw !== null && raw !== void 0 ? raw.toString() : "";
        if (!found[filter]) {
          found[filter] = true;
          options.push({
            label: settings.fastData(rows[i], idx, config.orthogonal),
            value: filter
          });
        }
      }
    }
    setOptions(checkList, options);
    if (loadedValues) {
      checkList.values(loadedValues);
    }
  }
  var searchList = {
    defaults: {
      ajaxOnly: true,
      className: "searchList",
      hidable: true,
      options: null,
      orthogonal: "display",
      search: true,
      select: true,
      title: ""
    },
    init: function(config) {
      var _this = this;
      var loadedValues = null;
      var dt = this.dt();
      var applySearch = function(values) {
        if (config._parents) {
          config._parents.forEach(function(btn) {
            return btn.activeList(_this.unique() + "list", values && !!values.length);
          });
        }
        var col = dt.column(_this.idx());
        if (dt.page.info().serverSide) {
          col.init().__ccList = values && values.length !== 0;
          return;
        }
        if (!values) {
          return;
        } else if (values.length === 0) {
          col.search.fixed("dtcc-list", "");
        } else {
          col.search.fixed("dtcc-list", function(val) {
            return values.includes(val);
          });
        }
      };
      var checkList = new CheckList(dt, this, {
        search: config.search,
        select: config.select
      }).searchListener(dt).title(dt.i18n("columnControl.searchList", config.title).replace("[title]", dt.column(this.idx()).title())).handler(function(e, btn, btns, redraw) {
        if (btn) {
          btn.active(!btn.active());
        }
        applySearch(checkList.values());
        if (redraw) {
          dt.draw();
        }
      });
      loadedValues = getState(this.idx(), dt.state.loaded());
      if (config.options) {
        setOptions(checkList, config.options, loadedValues);
      } else {
        dt.ready(function() {
          reloadOptions(dt, config, _this.idx(), checkList, loadedValues);
        });
        dt.on("xhr", function(e, s, json) {
          dt.one("draw", function() {
            reloadOptions(dt, config, _this.idx(), checkList, loadedValues);
            loadedValues = null;
          });
        });
      }
      var sspValues = [];
      if (dt.page.info().serverSide) {
        dt.on("preXhr.DT", function(e, s, d) {
          if (!d.columns || !d.columns[_this.idx()]) {
            return;
          }
          if (!d.columns[_this.idx()].columnControl) {
            d.columns[_this.idx()].columnControl = {};
          }
          var values = sspValues.length ? sspValues : checkList.values();
          sspValues = [];
          d.columns[_this.idx()].columnControl.list = Object.assign({}, values);
        });
      }
      dt.on("stateLoaded", function(e, s, state) {
        var values = getState(_this.idxOriginal(), state);
        if (values) {
          checkList.values(values);
          applySearch(values);
        }
      });
      dt.on("stateSaveParams", function(e, s, data) {
        var idx = _this.idxOriginal();
        if (!data.columnControl) {
          data.columnControl = {};
        }
        if (!data.columnControl[idx]) {
          data.columnControl[idx] = {};
        }
        data.columnControl[idx].searchList = dt.ready() ? checkList.values() : loadedValues;
      });
      dt.settings()[0].aoColumns[this.idx()].columnControlSearchList = function(options) {
        if (options === "refresh") {
          reloadOptions(dt, config, _this.idx(), checkList, null);
        } else {
          setOptions(checkList, options);
        }
      };
      applySearch(loadedValues);
      if (dt.page.info().serverSide && loadedValues && loadedValues.length) {
        sspValues = loadedValues;
      }
      return checkList.element();
    }
  };
  var searchNumber = {
    defaults: {
      clear: true,
      excludeLogic: [],
      placeholder: "",
      title: "",
      titleAttr: ""
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var i18nBase = "columnControl.search.number.";
      var searchInput = new SearchInput(dt, this.idx(), this.idxOriginal()).type("num").addClass("dtcc-searchNumber").clearable(config.clear).placeholder(config.placeholder).title(config.title).titleAttr(config.titleAttr).options([
        { label: dt.i18n(i18nBase + "equal", "Equals"), value: "equal" },
        { label: dt.i18n(i18nBase + "notEqual", "Does not equal"), value: "notEqual" },
        { label: dt.i18n(i18nBase + "greater", "Greater than"), value: "greater" },
        {
          label: dt.i18n(i18nBase + "greaterOrEqual", "Greater or equal"),
          value: "greaterOrEqual"
        },
        { label: dt.i18n(i18nBase + "less", "Less than"), value: "less" },
        {
          label: dt.i18n(i18nBase + "lessOrEqual", "Less or equal"),
          value: "lessOrEqual"
        },
        { label: dt.i18n(i18nBase + "empty", "Empty"), value: "empty" },
        { label: dt.i18n(i18nBase + "notEmpty", "Not empty"), value: "notEmpty" }
      ].filter(function(x) {
        return !config.excludeLogic.includes(x.value);
      })).search(function(searchType, searchTerm, loadingState) {
        if (config._parents) {
          config._parents.forEach(function(btn) {
            return btn.activeList(_this.unique() + "number", searchType === "empty" || searchType === "notEmpty" || !!searchTerm);
          });
        }
        var column = dt.column(_this.idx());
        if (dt.page.info().serverSide) {
          column.init().__ccList = !!(searchType === "empty" || searchType === "notEmpty" || searchTerm);
          if (!loadingState) {
            dt.draw();
          }
          return;
        }
        if (searchType === "empty") {
          column.search.fixed("dtcc", function(haystack) {
            return !haystack;
          });
        } else if (searchType === "notEmpty") {
          column.search.fixed("dtcc", function(haystack) {
            return !!haystack;
          });
        } else if (column.search.fixed("dtcc") === "" && searchTerm === "") {
          return;
        } else if (searchTerm === "") {
          column.search.fixed("dtcc", "");
        } else if (searchType === "equal") {
          column.search.fixed("dtcc", function(haystack) {
            return stringToNum(haystack) == searchTerm;
          });
        } else if (searchType === "notEqual") {
          column.search.fixed("dtcc", function(haystack) {
            return stringToNum(haystack) != searchTerm;
          });
        } else if (searchType === "greater") {
          column.search.fixed("dtcc", function(haystack) {
            return stringToNum(haystack) > searchTerm;
          });
        } else if (searchType === "greaterOrEqual") {
          column.search.fixed("dtcc", function(haystack) {
            return stringToNum(haystack) >= searchTerm;
          });
        } else if (searchType === "less") {
          column.search.fixed("dtcc", function(haystack) {
            return stringToNum(haystack) < searchTerm;
          });
        } else if (searchType === "lessOrEqual") {
          column.search.fixed("dtcc", function(haystack) {
            return stringToNum(haystack) <= searchTerm;
          });
        }
        if (!loadingState) {
          column.draw();
        }
      });
      searchInput.input().setAttribute("inputmode", "numeric");
      searchInput.input().setAttribute("pattern", "[0-9]*");
      return searchInput.element();
    }
  };
  var _re_html2 = /<([^>]*>)/g;
  var _re_formatted_numeric2 = /['\u00A0,$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi;
  function stringToNum(d) {
    if (d !== 0 && (!d || d === "-")) {
      return -Infinity;
    }
    var type = typeof d;
    if (type === "number" || type === "bigint") {
      return d;
    }
    if (d.replace) {
      d = d.replace(_re_html2, "").replace(_re_formatted_numeric2, "");
    }
    return d * 1;
  }
  var searchText = {
    defaults: {
      clear: true,
      excludeLogic: [],
      placeholder: "",
      title: "",
      titleAttr: ""
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var i18nBase = "columnControl.search.text.";
      var searchInput = new SearchInput(dt, this.idx(), this.idxOriginal()).addClass("dtcc-searchText").clearable(config.clear).placeholder(config.placeholder).title(config.title).titleAttr(config.titleAttr).options([
        { label: dt.i18n(i18nBase + "contains", "Contains"), value: "contains" },
        {
          label: dt.i18n(i18nBase + "notContains", "Does not contain"),
          value: "notContains"
        },
        { label: dt.i18n(i18nBase + "equal", "Equals"), value: "equal" },
        { label: dt.i18n(i18nBase + "notEqual", "Does not equal"), value: "notEqual" },
        { label: dt.i18n(i18nBase + "starts", "Starts"), value: "starts" },
        { label: dt.i18n(i18nBase + "ends", "Ends"), value: "ends" },
        { label: dt.i18n(i18nBase + "empty", "Empty"), value: "empty" },
        { label: dt.i18n(i18nBase + "notEmpty", "Not empty"), value: "notEmpty" }
      ].filter(function(x) {
        return !config.excludeLogic.includes(x.value);
      })).search(function(searchType, searchTerm, loadingState) {
        if (config._parents) {
          config._parents.forEach(function(btn) {
            return btn.activeList(_this.unique() + "text", searchType === "empty" || searchType === "notEmpty" || !!searchTerm);
          });
        }
        var column = dt.column(_this.idx());
        if (dt.page.info().serverSide) {
          column.init().__ccList = !!(searchType === "empty" || searchType === "notEmpty" || searchTerm);
          if (!loadingState) {
            dt.draw();
          }
          return;
        }
        searchTerm = searchTerm.toLowerCase();
        if (searchType === "empty") {
          column.search.fixed("dtcc", function(haystack) {
            return !haystack;
          });
        } else if (searchType === "notEmpty") {
          column.search.fixed("dtcc", function(haystack) {
            return !!haystack;
          });
        } else if (column.search.fixed("dtcc") === "" && searchTerm === "") {
          return;
        } else if (searchTerm === "") {
          column.search.fixed("dtcc", "");
        } else if (searchType === "equal") {
          column.search.fixed("dtcc", function(haystack) {
            return haystack.toLowerCase() == searchTerm;
          });
        } else if (searchType === "notEqual") {
          column.search.fixed("dtcc", function(haystack) {
            return haystack.toLowerCase() != searchTerm;
          });
        } else if (searchType === "contains") {
          column.search.fixed("dtcc", searchTerm);
        } else if (searchType === "notContains") {
          column.search.fixed("dtcc", function(haystack) {
            return !haystack.toLowerCase().includes(searchTerm);
          });
        } else if (searchType === "starts") {
          column.search.fixed("dtcc", function(haystack) {
            return haystack.toLowerCase().startsWith(searchTerm);
          });
        } else if (searchType === "ends") {
          column.search.fixed("dtcc", function(haystack) {
            return haystack.toLowerCase().endsWith(searchTerm);
          });
        }
        if (config._parents) {
          config._parents.forEach(function(btn) {
            return btn.activeList(_this.unique() + "string", !!column.search.fixed("dtcc"));
          });
        }
        if (!loadingState) {
          column.draw();
        }
      });
      return searchInput.element();
    }
  };
  var search = {
    defaults: {
      allowSearchList: false
    },
    init: function(config) {
      var _this = this;
      var _a, _b;
      var dt = this.dt();
      var idx = this.idx();
      var displayEl;
      var loadedState = (_b = (_a = dt.state.loaded()) === null || _a === void 0 ? void 0 : _a.columnControl) === null || _b === void 0 ? void 0 : _b[idx];
      var initType = function(type) {
        var json = getJsonOptions(dt, idx);
        if (type === "list" || config.allowSearchList && json) {
          return searchList.init.call(_this, Object.assign({}, searchList.defaults, config));
        } else if (type === "date" || type.startsWith("datetime")) {
          return searchDateTime.init.call(_this, Object.assign({}, searchDateTime.defaults, config));
        } else if (type.includes("num")) {
          return searchNumber.init.call(_this, Object.assign({}, searchNumber.defaults, config));
        } else {
          return searchText.init.call(_this, Object.assign({}, searchText.defaults, config));
        }
      };
      if (loadedState) {
        if (loadedState.searchInput) {
          displayEl = initType(loadedState.searchInput.type);
        } else if (loadedState.searchList) {
          displayEl = initType("list");
        }
      }
      if (!displayEl) {
        displayEl = document.createElement("div");
        dt.ready(function() {
          var column = dt.column(idx);
          var display = initType(column.type());
          displayEl.replaceWith(display);
        });
      }
      return displayEl;
    }
  };
  var searchClear$1 = {
    defaults: {
      className: "searchClear",
      icon: "searchClear",
      text: "Clear Search"
    },
    init: function(config) {
      var _this = this;
      var dt = this.dt();
      var btn = new Button(dt, this).text(dt.i18n("columnControl.searchClear", config.text)).icon(config.icon).className(config.className).handler(function() {
        dt.column(_this.idx()).columnControl.searchClear().draw();
      }).enable(false);
      dt.on("draw", function() {
        var col = dt.column(_this.idx());
        var search2 = col.search.fixed("dtcc");
        var searchList2 = col.search.fixed("dtcc-list");
        var searchSearchSsp = col.init().__ccSearch;
        var searchListSsp = col.init().__ccList;
        btn.enable(!!(search2 || searchList2 || searchSearchSsp || searchListSsp));
      });
      return btn.element();
    }
  };
  var searchDropdown = {
    defaults: {
      ajaxOnly: true,
      allowSearchList: true,
      className: "searchDropdown",
      clear: true,
      columns: "",
      hidable: true,
      options: null,
      orthogonal: "display",
      placeholder: "",
      search: true,
      select: true,
      text: "Search",
      title: "",
      titleAttr: ""
    },
    extend: function(config) {
      var dt = this.dt();
      return {
        extend: "dropdown",
        icon: "search",
        text: dt.i18n("columnControl.searchDropdown", config.text),
        content: [
          Object.assign(config, {
            extend: "search"
          })
        ]
      };
    }
  };
  var spacer = {
    defaults: {
      className: "dtcc-spacer",
      text: ""
    },
    init: function(config) {
      var dt = this.dt();
      var spacer2 = createElement("div", config.className, dt.i18n("columnControl.spacer", config.text));
      spacer2.setAttribute("role", "separator");
      return spacer2;
    }
  };
  var title = {
    defaults: {
      className: "dtcc-title",
      text: null
    },
    init: function(config) {
      var dt = this.dt();
      var title2 = dt.column(this.idx()).title();
      var text = config.text === null ? "[title]" : config.text;
      var el = createElement("div", config.className, text.replace("[title]", title2));
      return el;
    }
  };
  var contentTypes = {
    colVis,
    colVisDropdown,
    dropdown: dropdownContent,
    reorder,
    reorderLeft,
    reorderRight,
    rowGroup,
    rowGroupAdd,
    rowGroupClear,
    rowGroupRemove,
    order,
    orderAddAsc,
    orderAddDesc,
    orderAsc,
    orderClear,
    orderDesc,
    orderRemove,
    orderStatus,
    search,
    searchClear: searchClear$1,
    searchDropdown,
    searchDateTime,
    searchList,
    searchNumber,
    searchText,
    spacer,
    title
  };
  var ColumnControl = (
    /** @class */
    function() {
      function ColumnControl2(dt, columnIdx, opts) {
        var _this = this;
        this._dom = {
          target: null,
          wrapper: null
        };
        this._c = {};
        this._s = {
          columnIdx: null,
          unique: null,
          toDestroy: []
        };
        this._dt = dt;
        this._s.columnIdx = columnIdx;
        this._s.unique = Math.random();
        var originalIdx = columnIdx;
        Object.assign(this._c, ColumnControl2.defaults, opts);
        this._dom.target = this._target();
        if (opts.className) {
          addClass(this._dom.target.closest("tr"), opts.className);
        }
        if (this._c.content) {
          dt.on("columns-reordered", function(e, details) {
            _this._s.columnIdx = dt.colReorder.transpose(originalIdx, "fromOriginal");
          });
          this._dom.wrapper = document.createElement("span");
          this._dom.wrapper.classList.add("dtcc");
          this._dom.target.appendChild(this._dom.wrapper);
          this._c.content.forEach(function(content) {
            var _a = _this.resolve(content), plugin = _a.plugin, config = _a.config;
            var el = plugin.init.call(_this, config);
            _this._dom.wrapper.appendChild(el);
          });
          dt.on("destroy", function() {
            _this._s.toDestroy.slice().forEach(function(el) {
              el.destroy();
            });
            _this._dom.wrapper.remove();
          });
        }
      }
      ColumnControl2.prototype.destroyAdd = function(component) {
        this._s.toDestroy.push(component);
      };
      ColumnControl2.prototype.destroyRemove = function(component) {
        var idx = this._s.toDestroy.indexOf(component);
        if (idx !== -1) {
          this._s.toDestroy.splice(idx, 1);
        }
      };
      ColumnControl2.prototype.dt = function() {
        return this._dt;
      };
      ColumnControl2.prototype.idx = function() {
        return this._s.columnIdx;
      };
      ColumnControl2.prototype.idxOriginal = function() {
        var currentIdx = this.idx();
        if (this._dt.colReorder) {
          return this._dt.colReorder.transpose(currentIdx, "toOriginal");
        }
        return currentIdx;
      };
      ColumnControl2.prototype.resolve = function(content) {
        var plugin = null;
        var config = null;
        var type = null;
        if (typeof content === "string") {
          type = content;
          plugin = ColumnControl2.content[type];
          config = Object.assign({}, plugin === null || plugin === void 0 ? void 0 : plugin.defaults);
        } else if (Array.isArray(content)) {
          type = "dropdown";
          plugin = ColumnControl2.content[type];
          config = Object.assign({}, plugin === null || plugin === void 0 ? void 0 : plugin.defaults, {
            content
          });
        } else if (content.extend) {
          type = content.extend;
          plugin = ColumnControl2.content[type];
          config = Object.assign({}, plugin === null || plugin === void 0 ? void 0 : plugin.defaults, content);
        }
        if (!plugin) {
          throw new Error("Unknown ColumnControl content type: " + type);
        }
        if (plugin.extend) {
          var self_1 = plugin.extend.call(this, config);
          return this.resolve(self_1);
        }
        return {
          config,
          type,
          plugin
        };
      };
      ColumnControl2.prototype.unique = function() {
        return this._s.unique;
      };
      ColumnControl2.prototype._target = function() {
        var target = this._c.target;
        var column = this._dt.column(this._s.columnIdx);
        var node;
        var className = "header";
        if (typeof target === "number") {
          node = column.header(target);
        } else {
          var parts = target.split(":");
          var isHeader = parts[0] === "tfoot" ? false : true;
          var row = parts[1] ? parseInt(parts[1]) : 0;
          if (isHeader) {
            node = column.header(row);
          } else {
            node = column.footer(row);
            className = "footer";
          }
        }
        return node.querySelector("div.dt-column-" + className);
      };
      ColumnControl2.Button = Button;
      ColumnControl2.CheckList = CheckList;
      ColumnControl2.SearchInput = SearchInput;
      ColumnControl2.content = contentTypes;
      ColumnControl2.defaults = {
        className: "",
        content: null,
        target: 0
      };
      ColumnControl2.icons = icons;
      ColumnControl2.version = "1.2.1";
      return ColumnControl2;
    }()
  );
  dataTables_default.ColumnControl = ColumnControl;
  $6(document).on("i18n.dt", function(e, settings) {
    if (e.namespace !== "dt") {
      return;
    }
    var api = new dataTables_default.Api(settings);
    var thead = api.table().header();
    var tableInit = settings.oInit.columnControl;
    var defaultInit = ColumnControl.defaults;
    var baseTargets = [];
    var ackTargets = {};
    if (thead.querySelectorAll("tr").length <= 1 && settings.titleRow === null) {
      settings.titleRow = 0;
    }
    identifyTargets(baseTargets, tableInit);
    if (ColumnControl.defaults.content) {
      identifyTargets(baseTargets, defaultInit);
    }
    api.columns().every(function(i2) {
      var columnInit = this.init().columnControl;
      identifyTargets(baseTargets, columnInit);
    });
    for (var i = 0; i < baseTargets.length; i++) {
      assetTarget(ackTargets, baseTargets[i], api);
    }
  });
  $6(document).on("preInit.dt", function(e, settings) {
    if (e.namespace !== "dt") {
      return;
    }
    var api = new dataTables_default.Api(settings);
    var tableInit = settings.oInit.columnControl;
    var defaultInit = ColumnControl.defaults;
    var baseTargets = [];
    identifyTargets(baseTargets, tableInit);
    if (ColumnControl.defaults.content) {
      identifyTargets(baseTargets, defaultInit);
    }
    api.columns().every(function(i) {
      var columnInit = this.init().columnControl;
      var targets = identifyTargets(baseTargets.slice(), columnInit);
      for (var i_1 = 0; i_1 < targets.length; i_1++) {
        var columnTargetInit = getOptionsForTarget(targets[i_1], columnInit);
        var tableTargetInit = getOptionsForTarget(targets[i_1], tableInit);
        var defaultTargetInit = getOptionsForTarget(targets[i_1], defaultInit);
        if (defaultTargetInit || tableTargetInit || columnTargetInit) {
          new ColumnControl(api, this.index(), Object.assign({}, defaultTargetInit || {}, tableTargetInit || {}, columnTargetInit || {}));
        }
      }
    });
  });
  function searchClear() {
    var ctx = this;
    return this.iterator("column", function(settings, idx) {
      ctx.trigger("cc-search-clear", [idx]);
    });
  }
  dataTables_default.Api.registerPlural("columns().columnControl.searchClear()", "column().columnControl.searchClear()", searchClear);
  dataTables_default.Api.registerPlural("columns().ccSearchClear()", "column().ccSearchClear()", searchClear);
  dataTables_default.Api.registerPlural("columns().columnControl.searchList()", "column().columnControl.searchList()", function(options) {
    return this.iterator("column", function(settings, idx) {
      var fn = settings.aoColumns[idx].columnControlSearchList;
      if (fn) {
        fn(options);
      }
    });
  });
  dataTables_default.ext.buttons.ccSearchClear = {
    text: function(dt) {
      return dt.i18n("columnControl.buttons.searchClear", "Clear search");
    },
    init: function(dt, node, config) {
      var _this = this;
      dt.on("draw.DT", function() {
        var enabled2 = false;
        var glob = !!dt.search();
        if (!glob) {
          dt.columns().every(function() {
            if (this.search.fixed("dtcc") || this.search.fixed("dtcc-list") || this.init().__ccList) {
              enabled2 = true;
            }
          });
        }
        _this.enable(glob || enabled2);
      });
      this.enable(false);
    },
    action: function(e, dt, node, config) {
      dt.search("");
      dt.columns().columnControl.searchClear();
      dt.draw();
    }
  };
  function assetTarget(ackTargets, target, dt) {
    if (ackTargets[target]) {
      return;
    }
    var isHeader = true;
    var row = 0;
    if (typeof target === "number") {
      row = target;
    } else {
      var parts = target.split(":");
      if (parts[0] === "tfoot") {
        isHeader = false;
      }
      if (parts[1]) {
        row = parseInt(parts[1]);
      }
    }
    var node = isHeader ? dt.table().header() : dt.table().footer();
    if (!node.querySelectorAll("tr")[row]) {
      var columns = dt.columns().count();
      var tr = createElement("tr");
      tr.setAttribute("data-dt-order", "disable");
      for (var i = 0; i < columns; i++) {
        tr.appendChild(createElement("td"));
      }
      node.appendChild(tr);
    }
    ackTargets[target] = true;
  }
  function getOptionsForTarget(target, input) {
    var defaultTarget = ColumnControl.defaults.target;
    var selfTarget;
    if (isIContentArray(input)) {
      if (defaultTarget === target) {
        return {
          target: defaultTarget,
          content: input
        };
      }
    } else if (Array.isArray(input)) {
      for (var i = 0; i < input.length; i++) {
        var item = input[i];
        if (isIContentArray(item)) {
          if (defaultTarget === target) {
            return {
              target: defaultTarget,
              content: item
            };
          }
        } else if (isIConfig(item)) {
          selfTarget = item.target !== void 0 ? item.target : defaultTarget;
          if (target === selfTarget) {
            return item;
          }
        } else {
          if (target === defaultTarget) {
            return {
              target: defaultTarget,
              content: input
            };
          }
        }
      }
    } else if (typeof input === "object") {
      if (isIConfig(input)) {
        selfTarget = input.target !== void 0 ? input.target : defaultTarget;
        if (target === selfTarget) {
          return input;
        }
      } else {
        if (target === defaultTarget) {
          return {
            target: defaultTarget,
            content: input
          };
        }
      }
    }
  }
  function identifyTargets(targets, input) {
    function add(target) {
      if (!targets.includes(target)) {
        targets.push(target);
      }
    }
    if (Array.isArray(input)) {
      if (input.length === 0) {
        add(ColumnControl.defaults.target);
      } else {
        input.forEach(function(item) {
          add(typeof item === "object" && item.target !== void 0 ? item.target : ColumnControl.defaults.target);
        });
      }
    } else if (typeof input === "object") {
      add(input.target !== void 0 ? input.target : ColumnControl.defaults.target);
    }
    return targets;
  }
  function isIConfig(item) {
    return typeof item === "object" && item.target !== void 0 ? true : false;
  }
  function isIContentArray(arr) {
    var detectedConfig = false;
    if (!Array.isArray(arr)) {
      return false;
    }
    for (var i = 0; i < arr.length; i++) {
      if (isIConfig(arr[i])) {
        detectedConfig = true;
        break;
      }
    }
    return !detectedConfig;
  }

  // node_modules/datatables.net-select/js/dataTables.select.mjs
  var $7 = jquery_module_default;
  dataTables_default.select = {};
  dataTables_default.select.classes = {
    checkbox: "dt-select-checkbox"
  };
  dataTables_default.select.version = "3.1.3";
  dataTables_default.select.init = function(dt) {
    var ctx = dt.settings()[0];
    if (!dataTables_default.versionCheck("2")) {
      throw "Warning: Select requires DataTables 2 or newer";
    }
    if (ctx._select) {
      return;
    }
    var savedSelected = dt.state.loaded();
    var selectAndSave = function(e, settings, data) {
      if (data === null || data.select === void 0) {
        return;
      }
      if (dt.rows({ selected: true }).any()) {
        dt.rows().deselect();
      }
      if (data.select.rows !== void 0) {
        dt.rows(data.select.rows).select();
      }
      if (dt.columns({ selected: true }).any()) {
        dt.columns().deselect();
      }
      if (data.select.columns !== void 0) {
        dt.columns(data.select.columns).select();
      }
      if (dt.cells({ selected: true }).any()) {
        dt.cells().deselect();
      }
      if (data.select.cells !== void 0) {
        for (var i = 0; i < data.select.cells.length; i++) {
          dt.cell(data.select.cells[i].row, data.select.cells[i].column).select();
        }
      }
      dt.state.save();
    };
    dt.on("stateSaveParams", function(e, settings, data) {
      data.select = {};
      data.select.rows = dt.rows({ selected: true }).ids(true).toArray();
      data.select.columns = dt.columns({ selected: true })[0];
      data.select.cells = dt.cells({ selected: true })[0].map(function(coords) {
        return { row: dt.row(coords.row).id(true), column: coords.column };
      });
    }).on("stateLoadParams", selectAndSave).one("init", function() {
      selectAndSave(void 0, void 0, savedSelected);
    });
    var init3 = ctx.oInit.select;
    var defaults = dataTables_default.defaults.select;
    var opts = init3 === void 0 ? defaults : init3;
    var items = "row";
    var style = "api";
    var blurable = false;
    var toggleable = true;
    var selectable = null;
    var info2 = true;
    var selector = "td, th";
    var className = "selected";
    var headerCheckbox = true;
    var setStyle = false;
    var keys = false;
    var keysWrap = false;
    ctx._select = {
      infoEls: []
    };
    if (opts === true) {
      style = "os";
      setStyle = true;
    } else if (typeof opts === "string") {
      style = opts;
      setStyle = true;
    } else if ($7.isPlainObject(opts)) {
      if (opts.blurable !== void 0) {
        blurable = opts.blurable;
      }
      if (opts.toggleable !== void 0) {
        toggleable = opts.toggleable;
      }
      if (opts.info !== void 0) {
        info2 = opts.info;
      }
      if (opts.items !== void 0) {
        items = opts.items;
      }
      if (opts.style !== void 0) {
        style = opts.style;
        setStyle = true;
      } else {
        style = "os";
        setStyle = true;
      }
      if (opts.selector !== void 0) {
        selector = opts.selector;
      }
      if (opts.className !== void 0) {
        className = opts.className;
      }
      if (opts.headerCheckbox !== void 0) {
        headerCheckbox = opts.headerCheckbox;
      }
      if (opts.selectable !== void 0) {
        selectable = opts.selectable;
      }
      if (opts.keys !== void 0) {
        keys = opts.keys;
      }
      if (opts.keysWrap !== void 0) {
        keysWrap = opts.keysWrap;
      }
    }
    dt.select.selector(selector);
    dt.select.items(items);
    dt.select.style(style);
    dt.select.blurable(blurable);
    dt.select.toggleable(toggleable);
    dt.select.info(info2);
    dt.select.keys(keys, keysWrap);
    dt.select.selectable(selectable);
    ctx._select.className = className;
    if (!setStyle && $7(dt.table().node()).hasClass("selectable")) {
      dt.select.style("os");
    }
    if (headerCheckbox || headerCheckbox === "select-page" || headerCheckbox === "select-all") {
      dt.ready(function() {
        initCheckboxHeader(dt, headerCheckbox);
      });
    }
  };
  function cellRange(dt, idx, last) {
    var indexes;
    var columnIndexes;
    var rowIndexes;
    var selectColumns = function(start, end) {
      if (start > end) {
        var tmp = end;
        end = start;
        start = tmp;
      }
      var record = false;
      return dt.columns(":visible").indexes().filter(function(i) {
        if (i === start) {
          record = true;
        }
        if (i === end) {
          record = false;
          return true;
        }
        return record;
      });
    };
    var selectRows = function(start, end) {
      var indexes2 = dt.rows({ search: "applied" }).indexes();
      if (indexes2.indexOf(start) > indexes2.indexOf(end)) {
        var tmp = end;
        end = start;
        start = tmp;
      }
      var record = false;
      return indexes2.filter(function(i) {
        if (i === start) {
          record = true;
        }
        if (i === end) {
          record = false;
          return true;
        }
        return record;
      });
    };
    if (!dt.cells({ selected: true }).any() && !last) {
      columnIndexes = selectColumns(0, idx.column);
      rowIndexes = selectRows(0, idx.row);
    } else {
      columnIndexes = selectColumns(last.column, idx.column);
      rowIndexes = selectRows(last.row, idx.row);
    }
    indexes = dt.cells(rowIndexes, columnIndexes).flatten();
    if (!dt.cells(idx, { selected: true }).any()) {
      dt.cells(indexes).select();
    } else {
      dt.cells(indexes).deselect();
    }
  }
  function checkboxClass(selector) {
    var name = dataTables_default.select.classes.checkbox;
    return selector ? name.replace(/ /g, ".") : name;
  }
  function disableMouseSelection(dt) {
    var ctx = dt.settings()[0];
    var selector = ctx._select.selector;
    $7(dt.table().container()).off("mousedown.dtSelect", selector).off("mouseup.dtSelect", selector).off("click.dtSelect", selector);
    $7("body").off("click.dtSelect" + _safeId(dt.table().node()));
  }
  function enableMouseSelection(dt) {
    var container = $7(dt.table().container());
    var ctx = dt.settings()[0];
    var selector = ctx._select.selector;
    var matchSelection;
    container.on("mousedown.dtSelect", selector, function(e) {
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        container.css("-moz-user-select", "none").one("selectstart.dtSelect", selector, function() {
          return false;
        });
      }
      if (window.getSelection) {
        matchSelection = window.getSelection();
      }
    }).on("mouseup.dtSelect", selector, function() {
      container.css("-moz-user-select", "");
    }).on("click.dtSelect", selector, function(e) {
      var items = dt.select.items();
      var idx;
      if (matchSelection) {
        var selection = window.getSelection();
        if (!selection.anchorNode || $7(selection.anchorNode).closest("table")[0] === dt.table().node()) {
          if (selection !== matchSelection) {
            return;
          }
        }
      }
      var ctx2 = dt.settings()[0];
      var container2 = dt.table().container();
      if ($7(e.target).closest("div.dt-container")[0] != container2) {
        return;
      }
      var cell = dt.cell($7(e.target).closest("td, th"));
      if (!cell.any()) {
        return;
      }
      var event = $7.Event("user-select.dt");
      eventTrigger(dt, event, [items, cell, e]);
      if (event.isDefaultPrevented()) {
        return;
      }
      var cellIndex = cell.index();
      if (items === "row") {
        idx = cellIndex.row;
        typeSelect(e, dt, ctx2, "row", idx);
      } else if (items === "column") {
        idx = cell.index().column;
        typeSelect(e, dt, ctx2, "column", idx);
      } else if (items === "cell") {
        idx = cell.index();
        typeSelect(e, dt, ctx2, "cell", idx);
      }
      ctx2._select_lastCell = cellIndex;
    });
    $7("body").on("click.dtSelect" + _safeId(dt.table().node()), function(e) {
      if (ctx._select.blurable) {
        if ($7(e.target).parents().filter(dt.table().container()).length) {
          return;
        }
        if ($7(e.target).parents("html").length === 0) {
          return;
        }
        if ($7(e.target).parents("div.DTE").length) {
          return;
        }
        var event = $7.Event("select-blur.dt");
        eventTrigger(dt, event, [e.target, e]);
        if (event.isDefaultPrevented()) {
          return;
        }
        clear(ctx, true);
      }
    });
  }
  function eventTrigger(api, type, args, any) {
    if (any && !api.flatten().length) {
      return;
    }
    if (typeof type === "string") {
      type = type + ".dt";
    }
    args.unshift(api);
    $7(api.table().node()).trigger(type, args);
  }
  function isCheckboxColumn(col) {
    return col.mRender && col.mRender._name === "selectCheckbox";
  }
  function info(api, node) {
    if (api.select.style() === "api" || api.select.info() === false) {
      return;
    }
    var ctx = api.settings()[0];
    var rowSet = ctx._select_set;
    if (!api.page.info().serverSide) {
      for (var i = rowSet.length - 1; i >= 0; i--) {
        if (!ctx.aIds[rowSet[i]]) {
          rowSet.splice(i, 1);
        }
      }
    }
    var rows = rowSet.length ? rowSet.length : api.rows({ selected: true }).count();
    var columns = api.columns({ selected: true }).count();
    var cells = api.cells({ selected: true }).count();
    if (ctx._select_mode === "subtractive") {
      rows = api.page.info().recordsDisplay - rowSet.length;
    }
    var add = function(el2, name, num) {
      el2.append(
        $7('<span class="select-item"/>').append(
          api.i18n(
            "select." + name + "s",
            { _: "%d " + name + "s selected", 0: "", 1: "1 " + name + " selected" },
            num
          )
        )
      );
    };
    var el = $7(node);
    var output = $7('<span class="select-info"/>');
    add(output, "row", rows);
    add(output, "column", columns);
    add(output, "cell", cells);
    var existing = el.children("span.select-info");
    if (existing.length) {
      existing.remove();
    }
    if (output.text() !== "") {
      el.append(output);
    }
  }
  function initCheckboxHeader(dt, headerCheckbox) {
    var dtSettings = dt.settings()[0];
    var dtInternalColumns = dtSettings.aoColumns;
    dt.columns().iterator("column", function(s, idx) {
      var col = dtInternalColumns[idx];
      if (!isCheckboxColumn(col)) {
        return;
      }
      var header = dt.column(idx).header();
      var liner = $7("div.dt-column-header", header);
      if (liner.length) {
        header = liner;
      }
      if (!$7("input", header).length) {
        var input = $7("<input>").attr({
          class: checkboxClass(false),
          type: "checkbox",
          "aria-label": dt.i18n("select.aria.headerCheckbox") || "Select all rows"
        }).appendTo(header).on("change", function() {
          if (this.checked) {
            if (headerCheckbox == "select-page") {
              dt.rows({ page: "current" }).select();
            } else {
              dt.rows({ search: "applied" }).select();
            }
          } else {
            if (headerCheckbox == "select-page") {
              dt.rows({ page: "current", selected: true }).deselect();
            } else {
              dt.rows({ selected: true }).deselect();
            }
          }
        }).on("click", function(e) {
          e.stopPropagation();
        });
        dt.on("draw select deselect", function(e, pass, type) {
          if (type === "row" || !type) {
            var nums = headerCheckboxState(dt, headerCheckbox);
            if (nums.search && nums.search <= nums.count && nums.search === nums.available) {
              input.prop("checked", true).prop("indeterminate", false);
            } else if (nums.search === 0 && nums.count === 0) {
              input.prop("checked", false).prop("indeterminate", false);
            } else {
              input.prop("checked", false).prop("indeterminate", true);
            }
          }
        });
      }
    });
  }
  function keysSet(dt) {
    var ctx = dt.settings()[0];
    var flag = ctx._select.keys;
    var wrap2 = ctx._select.keysWrap;
    var namespace = "dts-keys-" + ctx.sTableId;
    if (flag) {
      $7(dt.rows({ page: "current" }).nodes()).attr("tabindex", 0);
      dt.on("draw." + namespace, function() {
        $7(dt.rows({ page: "current" }).nodes()).attr("tabindex", 0);
      });
      $7(document).on("keydown." + namespace, function(e) {
        var key = e.keyCode;
        var active = document.activeElement;
        if (![9, 13, 32, 38, 40].includes(key)) {
          return;
        }
        var nodes = dt.rows({ page: "current" }).nodes().toArray();
        var idx = nodes.indexOf(active);
        var preventDefault = true;
        var pageInfo = dt.page.info();
        if (idx === -1) {
          return;
        }
        if (key === 9) {
          if (e.shift === false && idx === nodes.length - 1) {
            keysPageChange(dt, "next", ":first-child");
          } else if (e.shift === true && idx === 0) {
            keysPageChange(dt, "previous", ":last-child");
          } else {
            preventDefault = false;
          }
        } else if (key === 13 || key === 32) {
          var row = dt.row(active);
          if (row.selected()) {
            row.deselect();
          } else {
            row.select();
          }
        } else if (key === 38) {
          if (idx > 0) {
            nodes[idx - 1].focus();
          } else if (pageInfo.start > 0) {
            keysPageChange(dt, "previous", ":last-child");
          } else if (wrap2) {
            keysPageChange(dt, "last", ":last-child");
          }
        } else {
          if (idx < nodes.length - 1) {
            nodes[idx + 1].focus();
          } else if (pageInfo.page < pageInfo.pages - 1) {
            keysPageChange(dt, "next", ":first-child");
          } else if (wrap2) {
            keysPageChange(dt, "first", ":first-child");
          }
        }
        if (preventDefault) {
          e.stopPropagation();
          e.preventDefault();
        }
      });
    } else {
      $7(dt.rows().nodes()).removeAttr("tabindex");
      dt.off("draw." + namespace);
      $7(document).off("keydown." + namespace);
    }
  }
  function keysPageChange(dt, page, focus) {
    dt.one("draw", function() {
      dt.row(focus).node().focus();
    }).page(page).draw(false);
  }
  function headerCheckboxState(dt, headerCheckbox) {
    var ctx = dt.settings()[0];
    var selectable = ctx._select.selectable;
    var available = 0;
    var count = headerCheckbox == "select-page" ? dt.rows({ page: "current", selected: true }).count() : dt.rows({ selected: true }).count();
    var search2 = headerCheckbox == "select-page" ? dt.rows({ page: "current", selected: true }).count() : dt.rows({ search: "applied", selected: true }).count();
    if (!selectable) {
      available = headerCheckbox == "select-page" ? dt.rows({ page: "current" }).count() : dt.rows({ search: "applied" }).count();
    } else {
      var indexes = headerCheckbox == "select-page" ? dt.rows({ page: "current" }).indexes() : dt.rows({ search: "applied" }).indexes();
      for (var i = 0; i < indexes.length; i++) {
        var rowInternal = ctx.aoData[indexes[i]];
        var result = selectable(rowInternal._aData, rowInternal.nTr, indexes[i]);
        if (result) {
          available++;
        }
      }
    }
    return {
      available,
      count,
      search: search2
    };
  }
  function init2(ctx) {
    var api = new dataTables_default.Api(ctx);
    ctx._select_init = true;
    ctx._select_mode = "additive";
    ctx._select_set = [];
    ctx.aoRowCreatedCallback.push(
      function(row, data, index) {
        var i, ien;
        var d = ctx.aoData[index];
        var id = api.row(index).id();
        if (d._select_selected || ctx._select_mode === "additive" && ctx._select_set.includes(id) || ctx._select_mode === "subtractive" && !ctx._select_set.includes(id)) {
          d._select_selected = true;
          $7(row).addClass(ctx._select.className).find("input." + checkboxClass(true)).prop("checked", true);
        }
        for (i = 0, ien = ctx.aoColumns.length; i < ien; i++) {
          if (ctx.aoColumns[i]._select_selected || d._selected_cells && d._selected_cells[i]) {
            $7(d.anCells[i]).addClass(ctx._select.className);
          }
        }
      }
    );
    _cumulativeEvents(api);
    api.on("info.dt", function(e, ctx2, node) {
      if (!ctx2._select.infoEls.includes(node)) {
        ctx2._select.infoEls.push(node);
      }
      info(api, node);
    });
    api.on("select.dtSelect.dt deselect.dtSelect.dt", function() {
      ctx._select.infoEls.forEach(function(el) {
        info(api, el);
      });
      api.state.save();
    });
    api.on("destroy.dtSelect", function() {
      $7(api.rows({ selected: true }).nodes()).removeClass(api.settings()[0]._select.className);
      $7("input." + checkboxClass(true), api.table().header()).remove();
      disableMouseSelection(api);
      api.off(".dtSelect");
      $7("body").off(".dtSelect" + _safeId(api.table().node()));
    });
  }
  function rowColumnRange(dt, type, idx, last) {
    var indexes = dt[type + "s"]({ search: "applied" }).indexes();
    var idx1 = indexes.indexOf(last);
    var idx2 = indexes.indexOf(idx);
    if (!dt[type + "s"]({ selected: true }).any() && idx1 === -1) {
      indexes.splice(indexes.indexOf(idx) + 1, indexes.length);
    } else {
      if (idx1 > idx2) {
        var tmp = idx2;
        idx2 = idx1;
        idx1 = tmp;
      }
      indexes.splice(idx2 + 1, indexes.length);
      indexes.splice(0, idx1);
    }
    if (!dt[type](idx, { selected: true }).any()) {
      dt[type + "s"](indexes).select();
    } else {
      indexes.splice(indexes.indexOf(idx), 1);
      dt[type + "s"](indexes).deselect();
    }
  }
  function clear(ctx, force) {
    if (force || ctx._select.style === "single") {
      var api = new dataTables_default.Api(ctx);
      api.rows({ selected: true }).deselect();
      api.columns({ selected: true }).deselect();
      api.cells({ selected: true }).deselect();
    }
  }
  function typeSelect(e, dt, ctx, type, idx) {
    var style = dt.select.style();
    var toggleable = dt.select.toggleable();
    var isSelected = dt[type](idx, { selected: true }).any();
    if (isSelected && !toggleable) {
      return;
    }
    if (style === "os") {
      if (e.ctrlKey || e.metaKey) {
        dt[type](idx).select(!isSelected);
      } else if (e.shiftKey) {
        if (type === "cell") {
          cellRange(dt, idx, ctx._select_lastCell || null);
        } else {
          rowColumnRange(
            dt,
            type,
            idx,
            ctx._select_lastCell ? ctx._select_lastCell[type] : null
          );
        }
      } else {
        var selected = dt[type + "s"]({ selected: true });
        if (isSelected && selected.flatten().length === 1) {
          dt[type](idx).deselect();
        } else {
          selected.deselect();
          dt[type](idx).select();
        }
      }
    } else if (style == "multi+shift") {
      if (e.shiftKey) {
        if (type === "cell") {
          cellRange(dt, idx, ctx._select_lastCell || null);
        } else {
          rowColumnRange(
            dt,
            type,
            idx,
            ctx._select_lastCell ? ctx._select_lastCell[type] : null
          );
        }
      } else {
        dt[type](idx).select(!isSelected);
      }
    } else {
      dt[type](idx).select(!isSelected);
    }
  }
  function _safeId(node) {
    return node.id.replace(/[^a-zA-Z0-9\-\_]/g, "-");
  }
  function _cumulativeEvents(api) {
    api.on("select", function(e, dt, type, indexes) {
      if (type !== "row") {
        return;
      }
      var ctx = api.settings()[0];
      if (ctx._select_mode === "additive") {
        _add(api, ctx._select_set, indexes);
      } else {
        _remove(api, ctx._select_set, indexes);
      }
    });
    api.on("deselect", function(e, dt, type, indexes) {
      if (type !== "row") {
        return;
      }
      var ctx = api.settings()[0];
      if (ctx._select_mode === "additive") {
        _remove(api, ctx._select_set, indexes);
      } else {
        _add(api, ctx._select_set, indexes);
      }
    });
  }
  function _add(api, arr, indexes) {
    for (var i = 0; i < indexes.length; i++) {
      var id = api.row(indexes[i]).id();
      if (id && id !== "undefined" && !arr.includes(id)) {
        arr.push(id);
      }
    }
  }
  function _remove(api, arr, indexes) {
    for (var i = 0; i < indexes.length; i++) {
      var id = api.row(indexes[i]).id();
      var idx = arr.indexOf(id);
      if (idx !== -1) {
        arr.splice(idx, 1);
      }
    }
  }
  $7.each(
    [
      { type: "row", prop: "aoData" },
      { type: "column", prop: "aoColumns" }
    ],
    function(i, o) {
      dataTables_default.ext.selector[o.type].push(function(settings, opts, indexes) {
        var selected = opts.selected;
        var data;
        var out = [];
        if (selected !== true && selected !== false) {
          return indexes;
        }
        for (var i2 = 0, ien = indexes.length; i2 < ien; i2++) {
          data = settings[o.prop][indexes[i2]];
          if (data && (selected === true && data._select_selected === true || selected === false && !data._select_selected)) {
            out.push(indexes[i2]);
          }
        }
        return out;
      });
    }
  );
  dataTables_default.ext.selector.cell.push(function(settings, opts, cells) {
    var selected = opts.selected;
    var rowData;
    var out = [];
    if (selected === void 0) {
      return cells;
    }
    for (var i = 0, ien = cells.length; i < ien; i++) {
      rowData = settings.aoData[cells[i].row];
      if (rowData && (selected === true && rowData._selected_cells && rowData._selected_cells[cells[i].column] === true || selected === false && (!rowData._selected_cells || !rowData._selected_cells[cells[i].column]))) {
        out.push(cells[i]);
      }
    }
    return out;
  });
  var apiRegister = dataTables_default.Api.register;
  var apiRegisterPlural = dataTables_default.Api.registerPlural;
  apiRegister("select()", function() {
    return this.iterator("table", function(ctx) {
      dataTables_default.select.init(new dataTables_default.Api(ctx));
    });
  });
  apiRegister("select.blurable()", function(flag) {
    if (flag === void 0) {
      return this.context[0]._select.blurable;
    }
    return this.iterator("table", function(ctx) {
      ctx._select.blurable = flag;
    });
  });
  apiRegister("select.toggleable()", function(flag) {
    if (flag === void 0) {
      return this.context[0]._select.toggleable;
    }
    return this.iterator("table", function(ctx) {
      ctx._select.toggleable = flag;
    });
  });
  apiRegister("select.info()", function(flag) {
    if (flag === void 0) {
      return this.context[0]._select.info;
    }
    return this.iterator("table", function(ctx) {
      ctx._select.info = flag;
    });
  });
  apiRegister("select.items()", function(items) {
    if (items === void 0) {
      return this.context[0]._select.items;
    }
    return this.iterator("table", function(ctx) {
      ctx._select.items = items;
      eventTrigger(new dataTables_default.Api(ctx), "selectItems", [items]);
    });
  });
  apiRegister("select.keys()", function(flag, wrap2) {
    if (flag === void 0) {
      return this.context[0]._select.keys;
    }
    return this.iterator("table", function(ctx) {
      if (!ctx._select) {
        dataTables_default.select.init(new dataTables_default.Api(ctx));
      }
      ctx._select.keys = flag;
      ctx._select.keysWrap = wrap2;
      keysSet(new dataTables_default.Api(ctx));
    });
  });
  apiRegister("select.style()", function(style) {
    if (style === void 0) {
      return this.context[0]._select.style;
    }
    return this.iterator("table", function(ctx) {
      if (!ctx._select) {
        dataTables_default.select.init(new dataTables_default.Api(ctx));
      }
      if (!ctx._select_init) {
        init2(ctx);
      }
      ctx._select.style = style;
      var dt = new dataTables_default.Api(ctx);
      if (style !== "api") {
        dt.ready(function() {
          disableMouseSelection(dt);
          enableMouseSelection(dt);
        });
      } else {
        disableMouseSelection(dt);
      }
      eventTrigger(new dataTables_default.Api(ctx), "selectStyle", [style]);
    });
  });
  apiRegister("select.selector()", function(selector) {
    if (selector === void 0) {
      return this.context[0]._select.selector;
    }
    return this.iterator("table", function(ctx) {
      var dt = new dataTables_default.Api(ctx);
      var style = ctx._select.style;
      disableMouseSelection(dt);
      ctx._select.selector = selector;
      if (style && style !== "api") {
        dt.ready(function() {
          disableMouseSelection(dt);
          enableMouseSelection(dt);
        });
      } else {
        disableMouseSelection(dt);
      }
    });
  });
  apiRegister("select.selectable()", function(set) {
    let ctx = this.context[0];
    if (set) {
      ctx._select.selectable = set;
      return this;
    }
    return ctx._select.selectable;
  });
  apiRegister("select.last()", function(set) {
    let ctx = this.context[0];
    if (set) {
      ctx._select_lastCell = set;
      return this;
    }
    return ctx._select_lastCell;
  });
  apiRegister("select.cumulative()", function(mode) {
    if (mode) {
      return this.iterator("table", function(ctx2) {
        if (ctx2._select_mode === mode) {
          return;
        }
        var dt = new dataTables_default.Api(ctx2);
        if (mode === "subtractive") {
          var unselected = dt.rows({ selected: false }).ids().toArray();
          ctx2._select_mode = mode;
          ctx2._select_set.length = 0;
          ctx2._select_set.push.apply(ctx2._select_set, unselected);
        } else {
          var selected = dt.rows({ selected: true }).ids().toArray();
          ctx2._select_mode = mode;
          ctx2._select_set.length = 0;
          ctx2._select_set.push.apply(ctx2._select_set, selected);
        }
      }).draw(false);
    }
    let ctx = this.context[0];
    if (ctx && ctx._select_set) {
      return {
        mode: ctx._select_mode,
        rows: ctx._select_set
      };
    }
    return null;
  });
  apiRegisterPlural("rows().select()", "row().select()", function(select) {
    var api = this;
    var selectedIndexes = [];
    if (select === false) {
      return this.deselect();
    }
    this.iterator("row", function(ctx, idx) {
      clear(ctx);
      var dtData = ctx.aoData[idx];
      var dtColumns = ctx.aoColumns;
      if (ctx._select.selectable) {
        var result = ctx._select.selectable(dtData._aData, dtData.nTr, idx);
        if (result === false) {
          return;
        }
      }
      $7(dtData.nTr).addClass(ctx._select.className);
      dtData._select_selected = true;
      selectedIndexes.push(idx);
      for (var i = 0; i < dtColumns.length; i++) {
        var col = dtColumns[i];
        if (col.sType === null) {
          api.columns().types();
        }
        if (isCheckboxColumn(col)) {
          var cells = dtData.anCells;
          if (cells && cells[i]) {
            $7("input." + checkboxClass(true), cells[i]).prop("checked", true);
          }
          if (dtData._aSortData !== null) {
            dtData._aSortData[i] = null;
          }
        }
      }
    });
    this.iterator("table", function(ct) {
      eventTrigger(api, "select", ["row", selectedIndexes], true);
    });
    return this;
  });
  apiRegister("row().selected()", function() {
    var ctx = this.context[0];
    if (ctx && this.length && ctx.aoData[this[0]] && ctx.aoData[this[0]]._select_selected) {
      return true;
    }
    return false;
  });
  apiRegister("row().focus()", function() {
    var ctx = this.context[0];
    if (ctx && this.length && ctx.aoData[this[0]] && ctx.aoData[this[0]].nTr) {
      ctx.aoData[this[0]].nTr.focus();
    }
  });
  apiRegister("row().blur()", function() {
    var ctx = this.context[0];
    if (ctx && this.length && ctx.aoData[this[0]] && ctx.aoData[this[0]].nTr) {
      ctx.aoData[this[0]].nTr.blur();
    }
  });
  apiRegisterPlural("columns().select()", "column().select()", function(select) {
    var api = this;
    if (select === false) {
      return this.deselect();
    }
    this.iterator("column", function(ctx, idx) {
      clear(ctx);
      ctx.aoColumns[idx]._select_selected = true;
      var column = new dataTables_default.Api(ctx).column(idx);
      $7(column.header()).addClass(ctx._select.className);
      $7(column.footer()).addClass(ctx._select.className);
      column.nodes().to$().addClass(ctx._select.className);
    });
    this.iterator("table", function(ctx, i) {
      eventTrigger(api, "select", ["column", api[i]], true);
    });
    return this;
  });
  apiRegister("column().selected()", function() {
    var ctx = this.context[0];
    if (ctx && this.length && ctx.aoColumns[this[0]] && ctx.aoColumns[this[0]]._select_selected) {
      return true;
    }
    return false;
  });
  apiRegisterPlural("cells().select()", "cell().select()", function(select) {
    var api = this;
    if (select === false) {
      return this.deselect();
    }
    this.iterator("cell", function(ctx, rowIdx, colIdx) {
      clear(ctx);
      var data = ctx.aoData[rowIdx];
      if (data._selected_cells === void 0) {
        data._selected_cells = [];
      }
      data._selected_cells[colIdx] = true;
      if (data.anCells) {
        $7(data.anCells[colIdx]).addClass(ctx._select.className);
      }
    });
    this.iterator("table", function(ctx, i) {
      eventTrigger(api, "select", ["cell", api.cells(api[i]).indexes().toArray()], true);
    });
    return this;
  });
  apiRegister("cell().selected()", function() {
    var ctx = this.context[0];
    if (ctx && this.length) {
      var row = ctx.aoData[this[0][0].row];
      if (row && row._selected_cells && row._selected_cells[this[0][0].column]) {
        return true;
      }
    }
    return false;
  });
  apiRegisterPlural("rows().deselect()", "row().deselect()", function() {
    var api = this;
    this.iterator("row", function(ctx, idx) {
      var dtData = ctx.aoData[idx];
      var dtColumns = ctx.aoColumns;
      $7(dtData.nTr).removeClass(ctx._select.className);
      dtData._select_selected = false;
      ctx._select_lastCell = null;
      for (var i = 0; i < dtColumns.length; i++) {
        var col = dtColumns[i];
        if (col.sType === null) {
          api.columns().types();
        }
        if (isCheckboxColumn(col)) {
          var cells = dtData.anCells;
          if (cells && cells[i]) {
            $7("input." + checkboxClass(true), dtData.anCells[i]).prop("checked", false);
          }
          if (dtData._aSortData !== null) {
            dtData._aSortData[i] = null;
          }
        }
      }
    });
    this.iterator("table", function(ctx, i) {
      eventTrigger(api, "deselect", ["row", api[i]], true);
    });
    return this;
  });
  apiRegisterPlural("columns().deselect()", "column().deselect()", function() {
    var api = this;
    this.iterator("column", function(ctx, idx) {
      ctx.aoColumns[idx]._select_selected = false;
      var api2 = new dataTables_default.Api(ctx);
      var column = api2.column(idx);
      $7(column.header()).removeClass(ctx._select.className);
      $7(column.footer()).removeClass(ctx._select.className);
      api2.cells(null, idx).indexes().each(function(cellIdx) {
        var data = ctx.aoData[cellIdx.row];
        var cellSelected = data._selected_cells;
        if (data.anCells && (!cellSelected || !cellSelected[cellIdx.column])) {
          $7(data.anCells[cellIdx.column]).removeClass(ctx._select.className);
        }
      });
    });
    this.iterator("table", function(ctx, i) {
      eventTrigger(api, "deselect", ["column", api[i]], true);
    });
    return this;
  });
  apiRegisterPlural("cells().deselect()", "cell().deselect()", function() {
    var api = this;
    this.iterator("cell", function(ctx, rowIdx, colIdx) {
      var data = ctx.aoData[rowIdx];
      if (data._selected_cells !== void 0) {
        data._selected_cells[colIdx] = false;
      }
      if (data.anCells && !ctx.aoColumns[colIdx]._select_selected) {
        $7(data.anCells[colIdx]).removeClass(ctx._select.className);
      }
    });
    this.iterator("table", function(ctx, i) {
      eventTrigger(api, "deselect", ["cell", api[i]], true);
    });
    return this;
  });
  function i18n(label, def) {
    return function(dt) {
      return dt.i18n("buttons." + label, def);
    };
  }
  function namespacedEvents(config) {
    var unique = config._eventNamespace;
    return "draw.dt.DT" + unique + " select.dt.DT" + unique + " deselect.dt.DT" + unique;
  }
  function enabled(dt, config) {
    if (config.limitTo.indexOf("rows") !== -1 && dt.rows({ selected: true }).any()) {
      return true;
    }
    if (config.limitTo.indexOf("columns") !== -1 && dt.columns({ selected: true }).any()) {
      return true;
    }
    if (config.limitTo.indexOf("cells") !== -1 && dt.cells({ selected: true }).any()) {
      return true;
    }
    return false;
  }
  var _buttonNamespace = 0;
  $7.extend(dataTables_default.ext.buttons, {
    selected: {
      text: i18n("selected", "Selected"),
      className: "buttons-selected",
      limitTo: ["rows", "columns", "cells"],
      init: function(dt, node, config) {
        var that = this;
        config._eventNamespace = ".select" + _buttonNamespace++;
        dt.on(namespacedEvents(config), function() {
          that.enable(enabled(dt, config));
        });
        this.disable();
      },
      destroy: function(dt, node, config) {
        dt.off(config._eventNamespace);
      }
    },
    selectedSingle: {
      text: i18n("selectedSingle", "Selected single"),
      className: "buttons-selected-single",
      init: function(dt, node, config) {
        var that = this;
        config._eventNamespace = ".select" + _buttonNamespace++;
        dt.on(namespacedEvents(config), function() {
          var count = dt.rows({ selected: true }).flatten().length + dt.columns({ selected: true }).flatten().length + dt.cells({ selected: true }).flatten().length;
          that.enable(count === 1);
        });
        this.disable();
      },
      destroy: function(dt, node, config) {
        dt.off(config._eventNamespace);
      }
    },
    selectAll: {
      text: i18n("selectAll", "Select all"),
      className: "buttons-select-all",
      action: function(e, dt, node, config) {
        var items = this.select.items();
        var mod = config.selectorModifier;
        if (mod) {
          if (typeof mod === "function") {
            mod = mod.call(dt, e, dt, node, config);
          }
          this[items + "s"](mod).select();
        } else {
          this[items + "s"]().select();
        }
      }
      // selectorModifier can be specified
    },
    selectNone: {
      text: i18n("selectNone", "Deselect all"),
      className: "buttons-select-none",
      action: function() {
        clear(this.settings()[0], true);
      },
      init: function(dt, node, config) {
        var that = this;
        config._eventNamespace = ".select" + _buttonNamespace++;
        dt.on(namespacedEvents(config), function() {
          var count = dt.rows({ selected: true }).flatten().length + dt.columns({ selected: true }).flatten().length + dt.cells({ selected: true }).flatten().length;
          that.enable(count > 0);
        });
        this.disable();
      },
      destroy: function(dt, node, config) {
        dt.off(config._eventNamespace);
      }
    },
    showSelected: {
      text: i18n("showSelected", "Show only selected"),
      className: "buttons-show-selected",
      action: function(e, dt) {
        if (dt.search.fixed("dt-select")) {
          dt.search.fixed("dt-select", null);
          this.active(false);
        } else {
          var dataSrc = dt.settings()[0].aoData;
          dt.search.fixed("dt-select", function(text, data, idx) {
            return dataSrc[idx]._select_selected;
          });
          this.active(true);
        }
        dt.draw();
      }
    }
  });
  $7.each(["Row", "Column", "Cell"], function(i, item) {
    var lc = item.toLowerCase();
    dataTables_default.ext.buttons["select" + item + "s"] = {
      text: i18n("select" + item + "s", "Select " + lc + "s"),
      className: "buttons-select-" + lc + "s",
      action: function() {
        this.select.items(lc);
      },
      init: function(dt) {
        var that = this;
        this.active(dt.select.items() === lc);
        dt.on("selectItems.dt.DT", function(e, ctx, items) {
          that.active(items === lc);
        });
      }
    };
  });
  dataTables_default.type("select-checkbox", {
    className: "dt-select",
    detect: dataTables_default.versionCheck("2.1") ? {
      oneOf: function() {
        return false;
      },
      allOf: function() {
        return false;
      },
      init: function(settings, col, idx) {
        return isCheckboxColumn(col);
      }
    } : function(data) {
      return data === "select-checkbox" ? data : false;
    },
    order: {
      pre: function(d) {
        return d === "X" ? -1 : 0;
      }
    }
  });
  $7.extend(true, dataTables_default.defaults.oLanguage, {
    select: {
      aria: {
        rowCheckbox: "Select row"
      }
    }
  });
  dataTables_default.render.select = function(valueProp, nameProp) {
    var valueFn = valueProp ? dataTables_default.util.get(valueProp) : null;
    var nameFn = nameProp ? dataTables_default.util.get(nameProp) : null;
    var fn = function(data, type, row, meta) {
      var dtRow = meta.settings.aoData[meta.row];
      var selected = dtRow._select_selected;
      var ariaLabel = meta.settings.oLanguage.select.aria.rowCheckbox;
      var selectable = meta.settings._select.selectable;
      if (type === "display") {
        if (selectable) {
          var result = selectable(row, dtRow.nTr, meta.row);
          if (result === false) {
            return "";
          }
        }
        return $7("<input>").attr({
          "aria-label": ariaLabel,
          class: checkboxClass(),
          name: nameFn ? nameFn(row) : null,
          type: "checkbox",
          value: valueFn ? valueFn(row) : null,
          checked: selected
        }).on("input", function(e) {
          e.preventDefault();
          this.checked = $7(this).closest("tr").hasClass("selected");
        })[0];
      } else if (type === "type") {
        return "select-checkbox";
      } else if (type === "filter") {
        return "";
      }
      return selected ? "X" : "";
    };
    fn._name = "selectCheckbox";
    return fn;
  };
  dataTables_default.ext.order["select-checkbox"] = function(settings, col) {
    return this.api().column(col, { order: "index" }).nodes().map(function(td) {
      if (settings._select.items === "row") {
        return $7(td).parent().hasClass(settings._select.className).toString();
      } else if (settings._select.items === "cell") {
        return $7(td).hasClass(settings._select.className).toString();
      }
      return false;
    });
  };
  $7.fn.DataTable.select = dataTables_default.select;
  $7(document).on("i18n.dt.dtSelect preInit.dt.dtSelect", function(e, ctx) {
    if (e.namespace !== "dt") {
      return;
    }
    dataTables_default.select.init(new dataTables_default.Api(ctx));
  });

  // node_modules/datatables.net-staterestore/js/dataTables.stateRestore.mjs
  var $8 = jquery_module_default;
  (function() {
    "use strict";
    var $$2;
    var dataTable$1;
    function setJQuery$1(jq) {
      $$2 = jq;
      dataTable$1 = jq.fn.dataTable;
    }
    var StateRestore = (
      /** @class */
      function() {
        function StateRestore2(settings, opts, identifier, state, isPreDefined, successCallback) {
          if (state === void 0) {
            state = void 0;
          }
          if (isPreDefined === void 0) {
            isPreDefined = false;
          }
          if (successCallback === void 0) {
            successCallback = function() {
              return null;
            };
          }
          if (!dataTable$1 || !dataTable$1.versionCheck || !dataTable$1.versionCheck("1.10.0")) {
            throw new Error("StateRestore requires DataTables 1.10 or newer");
          }
          if (!dataTable$1.Buttons) {
            throw new Error("StateRestore requires Buttons");
          }
          var table = new dataTable$1.Api(settings);
          this.classes = $$2.extend(true, {}, StateRestore2.classes);
          this.c = $$2.extend(true, {}, StateRestore2.defaults, opts);
          this.s = {
            dt: table,
            identifier,
            isPreDefined,
            savedState: state,
            tableId: state && state.stateRestore ? state.stateRestore.tableId : void 0
          };
          this.dom = {
            background: $$2('<div class="' + this.classes.background + '"/>'),
            closeButton: $$2('<div class="' + this.classes.closeButton + '">&times;</div>'),
            confirmation: $$2('<div class="' + this.classes.confirmation + '"/>'),
            confirmationButton: $$2('<button class="' + this.classes.confirmationButton + " " + this.classes.dtButton + '">'),
            confirmationTitleRow: $$2('<div class="' + this.classes.confirmationTitleRow + '"></div>'),
            dtContainer: $$2(this.s.dt.table().container()),
            duplicateError: $$2('<span class="' + this.classes.modalError + '">' + this.s.dt.i18n("stateRestore.duplicateError", this.c.i18n.duplicateError) + "</span>"),
            emptyError: $$2('<span class="' + this.classes.modalError + '">' + this.s.dt.i18n("stateRestore.emptyError", this.c.i18n.emptyError) + "</span>"),
            removeContents: $$2('<div class="' + this.classes.confirmationText + '"><span>' + this.s.dt.i18n("stateRestore.removeConfirm", this.c.i18n.removeConfirm).replace(/%s/g, StateRestore2.entityEncode(this.s.identifier)) + "</span></div>"),
            removeError: $$2('<span class="' + this.classes.modalError + '">' + this.s.dt.i18n("stateRestore.removeError", this.c.i18n.removeError) + "</span>"),
            removeTitle: $$2('<h2 class="' + this.classes.confirmationTitle + '">' + this.s.dt.i18n("stateRestore.removeTitle", this.c.i18n.removeTitle) + "</h2>"),
            renameContents: $$2('<div class="' + this.classes.confirmationText + " " + this.classes.renameModal + '"><label class="' + this.classes.confirmationMessage + '">' + this.s.dt.i18n("stateRestore.renameLabel", this.c.i18n.renameLabel).replace(/%s/g, StateRestore2.entityEncode(this.s.identifier)) + "</label></div>"),
            renameInput: $$2('<input class="' + this.classes.input + '" type="text"></input>'),
            renameTitle: $$2('<h2 class="' + this.classes.confirmationTitle + '">' + this.s.dt.i18n("stateRestore.renameTitle", this.c.i18n.renameTitle) + "</h2>")
          };
          this.save(state, successCallback, !isPreDefined);
        }
        StateRestore2.prototype.remove = function(skipModal) {
          var _a;
          var _this = this;
          if (skipModal === void 0) {
            skipModal = false;
          }
          if (!this.c.remove) {
            return false;
          }
          var removeFunction;
          var ajaxData = {
            action: "remove",
            stateRestore: (_a = {}, _a[this.s.identifier] = this.s.savedState, _a)
          };
          var successCallback = function() {
            _this.dom.confirmation.trigger("dtsr-remove");
            $$2(_this.s.dt.table().node()).trigger("stateRestore-change");
            _this.dom.background.click();
            _this.dom.confirmation.remove();
            $$2(document).unbind("keyup", function(e) {
              return _this._keyupFunction(e);
            });
            _this.dom.confirmationButton.off("click");
          };
          if (!this.c.ajax) {
            removeFunction = function() {
              try {
                localStorage.removeItem("DataTables_stateRestore_" + _this.s.identifier + "_" + location.pathname + (_this.s.tableId ? "_" + _this.s.tableId : ""));
                successCallback();
              } catch (e) {
                _this.dom.confirmation.children("." + _this.classes.modalError).remove();
                _this.dom.confirmation.append(_this.dom.removeError);
                return "remove";
              }
              return true;
            };
          } else if (typeof this.c.ajax === "string" && this.s.dt.settings()[0]._bInitComplete) {
            removeFunction = function() {
              $$2.ajax({
                data: ajaxData,
                success: successCallback,
                type: "POST",
                url: _this.c.ajax
              });
              return true;
            };
          } else if (typeof this.c.ajax === "function") {
            removeFunction = function() {
              if (typeof _this.c.ajax === "function") {
                _this.c.ajax.call(_this.s.dt, ajaxData, successCallback);
              }
              return true;
            };
          }
          if (skipModal) {
            this.dom.confirmation.appendTo(this.dom.dtContainer);
            $$2(this.s.dt.table().node()).trigger("dtsr-modal-inserted");
            removeFunction();
            this.dom.confirmation.remove();
          } else {
            this._newModal(this.dom.removeTitle, this.s.dt.i18n("stateRestore.removeSubmit", this.c.i18n.removeSubmit), removeFunction, this.dom.removeContents);
          }
          return true;
        };
        StateRestore2.prototype.compare = function(state) {
          if (!this.c.saveState.order) {
            state.order = void 0;
          }
          if (!this.c.saveState.search) {
            state.search = void 0;
          }
          if (this.c.saveState.columns && state.columns) {
            for (var i = 0, ien = state.columns.length; i < ien; i++) {
              if (typeof this.c.saveState.columns !== "boolean" && !this.c.saveState.columns.visible) {
                state.columns[i].visible = void 0;
              }
              if (typeof this.c.saveState.columns !== "boolean" && !this.c.saveState.columns.search) {
                state.columns[i].search = void 0;
              }
            }
          } else if (!this.c.saveState.columns) {
            state.columns = void 0;
          }
          if (!this.c.saveState.paging) {
            state.page = void 0;
          }
          if (!this.c.saveState.searchBuilder) {
            state.searchBuilder = void 0;
          }
          if (!this.c.saveState.searchPanes) {
            state.searchPanes = void 0;
          }
          if (!this.c.saveState.select) {
            state.select = void 0;
          }
          if (!this.c.saveState.colReorder) {
            state.ColReorder = void 0;
          }
          if (!this.c.saveState.scroller) {
            state.scroller = void 0;
            if (dataTable$1.Scroller !== void 0) {
              state.start = 0;
            }
          }
          if (!this.c.saveState.paging) {
            state.start = 0;
          }
          if (!this.c.saveState.length) {
            state.length = void 0;
          }
          delete state.time;
          var copyState = this.s.savedState;
          delete copyState.time;
          delete copyState.c;
          delete copyState.stateRestore;
          return this._deepCompare(state, copyState);
        };
        StateRestore2.prototype.destroy = function() {
          $$2.each(this.dom, function(name, el) {
            el.off().remove();
          });
        };
        StateRestore2.prototype.load = function() {
          var _this = this;
          var loadedState = this.s.savedState;
          var settings = this.s.dt.settings()[0];
          loadedState.time = +/* @__PURE__ */ new Date();
          settings.oLoadedState = $$2.extend(true, {}, loadedState);
          $$2("div.dt-button-background").click();
          var loaded = function() {
            var correctPaging = function(e, preSettings) {
              setTimeout(function() {
                var currpage = preSettings._iDisplayStart / preSettings._iDisplayLength;
                var intendedPage = loadedState.start / loadedState.length;
                if (currpage >= 0 && intendedPage >= 0 && currpage !== intendedPage) {
                  _this.s.dt.page(intendedPage).draw(false);
                }
              }, 50);
            };
            _this.s.dt.one("preDraw", correctPaging);
            _this.s.dt.draw(false);
          };
          if (dataTables_default.versionCheck("2")) {
            this.s.dt.state(loadedState);
            loaded();
          } else {
            dataTables_default.ext.oApi._fnImplementState(settings, loadedState, loaded);
          }
          return loadedState;
        };
        StateRestore2.prototype.rename = function(newIdentifier, currentIdentifiers) {
          var _this = this;
          if (newIdentifier === void 0) {
            newIdentifier = null;
          }
          if (!this.c.rename) {
            return;
          }
          var renameFunction = function() {
            var _a;
            if (newIdentifier === null) {
              var tempIdentifier = $$2("input." + _this.classes.input.replace(/ /g, ".")).val();
              if (tempIdentifier.length === 0) {
                _this.dom.confirmation.children("." + _this.classes.modalError).remove();
                _this.dom.confirmation.append(_this.dom.emptyError);
                return "empty";
              } else if (currentIdentifiers.includes(tempIdentifier)) {
                _this.dom.confirmation.children("." + _this.classes.modalError).remove();
                _this.dom.confirmation.append(_this.dom.duplicateError);
                return "duplicate";
              } else {
                newIdentifier = tempIdentifier;
              }
            }
            var ajaxData = {
              action: "rename",
              stateRestore: (_a = {}, _a[_this.s.identifier] = newIdentifier, _a)
            };
            var successCallback = function() {
              _this.s.identifier = newIdentifier;
              _this.save(_this.s.savedState, function() {
                return null;
              }, false);
              _this.dom.removeContents = $$2('<div class="' + _this.classes.confirmationText + '"><span>' + _this.s.dt.i18n("stateRestore.removeConfirm", _this.c.i18n.removeConfirm).replace(/%s/g, _this.s.identifier) + "</span></div>");
              _this.dom.confirmation.trigger("dtsr-rename");
              _this.dom.background.click();
              _this.dom.confirmation.remove();
              $$2(document).unbind("keyup", function(e) {
                return _this._keyupFunction(e);
              });
              _this.dom.confirmationButton.off("click");
            };
            if (!_this.c.ajax) {
              try {
                localStorage.removeItem("DataTables_stateRestore_" + _this.s.identifier + "_" + location.pathname + (_this.s.tableId ? "_" + _this.s.tableId : ""));
                successCallback();
              } catch (e) {
                _this.dom.confirmation.children("." + _this.classes.modalError).remove();
                _this.dom.confirmation.append(_this.dom.removeError);
                return false;
              }
            } else if (typeof _this.c.ajax === "string" && _this.s.dt.settings()[0]._bInitComplete) {
              $$2.ajax({
                data: ajaxData,
                success: successCallback,
                type: "POST",
                url: _this.c.ajax
              });
            } else if (typeof _this.c.ajax === "function") {
              _this.c.ajax.call(_this.s.dt, ajaxData, successCallback);
            }
            return true;
          };
          if (newIdentifier !== null) {
            if (currentIdentifiers.includes(newIdentifier)) {
              throw new Error(this.s.dt.i18n("stateRestore.duplicateError", this.c.i18n.duplicateError));
            } else if (newIdentifier.length === 0) {
              throw new Error(this.s.dt.i18n("stateRestore.emptyError", this.c.i18n.emptyError));
            } else {
              this.dom.confirmation.appendTo(this.dom.dtContainer);
              $$2(this.s.dt.table().node()).trigger("dtsr-modal-inserted");
              renameFunction();
              this.dom.confirmation.remove();
            }
          } else {
            this.dom.renameInput.val(this.s.identifier);
            this.dom.renameContents.append(this.dom.renameInput);
            this._newModal(this.dom.renameTitle, this.s.dt.i18n("stateRestore.renameButton", this.c.i18n.renameButton), renameFunction, this.dom.renameContents);
          }
        };
        StateRestore2.prototype.save = function(state, passedSuccessCallback, callAjax) {
          var _a;
          var _this = this;
          if (callAjax === void 0) {
            callAjax = true;
          }
          if (!this.c.save) {
            if (passedSuccessCallback) {
              passedSuccessCallback.call(this);
            }
            return;
          }
          var savedState;
          this.s.dt.state.save();
          if (state === void 0) {
            savedState = this.s.dt.state();
          } else if (typeof state !== "object") {
            return;
          } else {
            savedState = state;
          }
          if (savedState.stateRestore) {
            savedState.stateRestore.isPreDefined = this.s.isPreDefined;
            savedState.stateRestore.state = this.s.identifier;
            savedState.stateRestore.tableId = this.s.tableId;
          } else {
            savedState.stateRestore = {
              isPreDefined: this.s.isPreDefined,
              state: this.s.identifier,
              tableId: this.s.tableId
            };
          }
          this.s.savedState = savedState;
          if (!this.c.saveState.order) {
            this.s.savedState.order = void 0;
          }
          if (!this.c.saveState.search) {
            this.s.savedState.search = void 0;
          }
          if (this.c.saveState.columns && this.s.savedState.columns) {
            for (var i = 0, ien = this.s.savedState.columns.length; i < ien; i++) {
              if (typeof this.c.saveState.columns !== "boolean" && !this.c.saveState.columns.visible) {
                this.s.savedState.columns[i].visible = void 0;
              }
              if (typeof this.c.saveState.columns !== "boolean" && !this.c.saveState.columns.search) {
                this.s.savedState.columns[i].search = void 0;
              }
            }
          } else if (!this.c.saveState.columns) {
            this.s.savedState.columns = void 0;
          }
          if (!this.c.saveState.searchBuilder) {
            this.s.savedState.searchBuilder = void 0;
          }
          if (!this.c.saveState.searchPanes) {
            this.s.savedState.searchPanes = void 0;
          }
          if (!this.c.saveState.select) {
            this.s.savedState.select = void 0;
          }
          if (!this.c.saveState.colReorder) {
            this.s.savedState.ColReorder = void 0;
          }
          if (!this.c.saveState.scroller) {
            this.s.savedState.scroller = void 0;
            if (dataTable$1.Scroller !== void 0) {
              this.s.savedState.start = 0;
            }
          }
          if (!this.c.saveState.paging) {
            this.s.savedState.start = 0;
          }
          if (!this.c.saveState.length) {
            this.s.savedState.length = void 0;
          }
          this.s.savedState.c = this.c;
          if (this.s.savedState.c.splitSecondaries.length) {
            for (var _i = 0, _b = this.s.savedState.c.splitSecondaries; _i < _b.length; _i++) {
              var secondary = _b[_i];
              if (secondary.parent) {
                secondary.parent = void 0;
              }
            }
          }
          var ajaxData = {
            action: "save",
            stateRestore: (_a = {}, _a[this.s.identifier] = this.s.savedState, _a)
          };
          var successCallback = function() {
            if (passedSuccessCallback) {
              passedSuccessCallback.call(_this);
            }
            _this.dom.confirmation.trigger("dtsr-save");
            $$2(_this.s.dt.table().node()).trigger("stateRestore-change");
          };
          if (!this.c.ajax) {
            localStorage.setItem("DataTables_stateRestore_" + this.s.identifier + "_" + location.pathname + (this.s.tableId ? "_" + this.s.tableId : ""), JSON.stringify(this.s.savedState));
            successCallback();
          } else if (typeof this.c.ajax === "string" && callAjax) {
            if (this.s.dt.settings()[0]._bInitComplete) {
              $$2.ajax({
                data: ajaxData,
                success: successCallback,
                type: "POST",
                url: this.c.ajax
              });
            } else {
              this.s.dt.one("init", function() {
                $$2.ajax({
                  data: ajaxData,
                  success: successCallback,
                  type: "POST",
                  url: _this.c.ajax
                });
              });
            }
          } else if (typeof this.c.ajax === "function" && callAjax) {
            this.c.ajax.call(this.s.dt, ajaxData, successCallback);
          } else if (!callAjax) {
            successCallback();
          }
        };
        StateRestore2.entityEncode = function(d) {
          return typeof d === "string" ? d.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : d;
        };
        StateRestore2.prototype._deepCompare = function(state1, state2) {
          if (state1 === null && state2 === null) {
            return true;
          } else if (state1 === null || state2 === null) {
            return false;
          }
          var states = [state1, state2];
          var keys = [Object.keys(state1).sort(), Object.keys(state2).sort()];
          var startIdx, i;
          if (keys[0].includes("scroller")) {
            startIdx = keys[0].indexOf("start");
            if (startIdx) {
              keys[0].splice(startIdx, 1);
            }
          }
          if (keys[1].includes("scroller")) {
            startIdx = keys[1].indexOf("start");
            if (startIdx) {
              keys[1].splice(startIdx, 1);
            }
          }
          for (i = 0; i < keys[0].length; i++) {
            if (keys[0][i].indexOf("_") === 0) {
              keys[0].splice(i, 1);
              i--;
              continue;
            }
            if (keys[0][i] === "baseRowTop" || keys[0][i] === "baseScrollTop" || keys[0][i] === "scrollTop" || !this.c.saveState.paging && keys[0][i] === "page") {
              keys[0].splice(i, 1);
              i--;
              continue;
            }
          }
          for (i = 0; i < keys[1].length; i++) {
            if (keys[1][i].indexOf("_") === 0) {
              keys[1].splice(i, 1);
              i--;
              continue;
            }
            if (keys[1][i] === "baseRowTop" || keys[1][i] === "baseScrollTop" || keys[1][i] === "scrollTop" || !this.c.saveState.paging && keys[0][i] === "page") {
              keys[1].splice(i, 1);
              i--;
              continue;
            }
          }
          if (keys[0].length === 0 && keys[1].length > 0 || keys[1].length === 0 && keys[0].length > 0) {
            return false;
          }
          for (i = 0; i < keys[0].length; i++) {
            if (!keys[1].includes(keys[0][i])) {
              keys[0].splice(i, 1);
              i--;
            }
          }
          for (i = 0; i < keys[1].length; i++) {
            if (!keys[0].includes(keys[1][i])) {
              keys[1].splice(i, 1);
              i--;
            }
          }
          for (i = 0; i < keys[0].length; i++) {
            if (keys[0][i] !== keys[1][i] || typeof states[0][keys[0][i]] !== typeof states[1][keys[1][i]]) {
              return false;
            }
            if (typeof states[0][keys[0][i]] === "object") {
              if (Array.isArray(states[0][keys[0][i]]) && Array.isArray(states[1][keys[1][i]])) {
                if (states[0][keys[0][i]].length !== states[1][keys[0][i]].length) {
                  return false;
                }
              }
              if (!this._deepCompare(states[0][keys[0][i]], states[1][keys[1][i]])) {
                return false;
              }
            } else if (typeof states[0][keys[0][i]] === "number" && typeof states[1][keys[1][i]] === "number") {
              if (Math.round(states[0][keys[0][i]]) !== Math.round(states[1][keys[1][i]])) {
                return false;
              }
            } else if (states[0][keys[0][i]] !== states[1][keys[1][i]]) {
              return false;
            }
          }
          return true;
        };
        StateRestore2.prototype._keyupFunction = function(e) {
          if (e.key === "Enter") {
            this.dom.confirmationButton.click();
          } else if (e.key === "Escape") {
            $$2("div." + this.classes.background.replace(/ /g, ".")).click();
          }
        };
        StateRestore2.prototype._newModal = function(title2, buttonText, buttonAction, modalContents) {
          var _this = this;
          this.dom.background.appendTo(this.dom.dtContainer);
          this.dom.confirmationTitleRow.empty().append(title2);
          this.dom.confirmationButton.html(buttonText);
          this.dom.confirmation.empty().append(this.dom.confirmationTitleRow).append(modalContents).append($$2('<div class="' + this.classes.confirmationButtons + '"></div>').append(this.dom.confirmationButton)).appendTo(this.dom.dtContainer);
          $$2(this.s.dt.table().node()).trigger("dtsr-modal-inserted");
          var inputs = modalContents.children("input");
          if (inputs.length > 0) {
            $$2(inputs[0]).focus();
          } else {
            this.dom.confirmationButton.focus();
          }
          var background = $$2("div." + this.classes.background.replace(/ /g, "."));
          if (this.c.modalCloseButton) {
            this.dom.confirmation.append(this.dom.closeButton);
            this.dom.closeButton.on("click", function() {
              return background.click();
            });
          }
          this.dom.confirmationButton.on("click", function() {
            return buttonAction();
          });
          this.dom.confirmation.on("click", function(e) {
            e.stopPropagation();
          });
          background.one("click", function() {
            _this.dom.background.remove();
            _this.dom.confirmation.remove();
            $$2(document).unbind("keyup", function(e) {
              return _this._keyupFunction(e);
            });
          });
          $$2(document).on("keyup", function(e) {
            return _this._keyupFunction(e);
          });
        };
        StateRestore2.version = "1.4.3";
        StateRestore2.classes = {
          background: "dtsr-background",
          closeButton: "dtsr-popover-close",
          confirmation: "dtsr-confirmation",
          confirmationButton: "dtsr-confirmation-button",
          confirmationButtons: "dtsr-confirmation-buttons",
          confirmationMessage: "dtsr-confirmation-message dtsr-name-label",
          confirmationText: "dtsr-confirmation-text",
          confirmationTitle: "dtsr-confirmation-title",
          confirmationTitleRow: "dtsr-confirmation-title-row",
          dtButton: "dt-button",
          input: "dtsr-input",
          modalError: "dtsr-modal-error",
          renameModal: "dtsr-rename-modal"
        };
        StateRestore2.defaults = {
          _createInSaved: false,
          ajax: false,
          create: true,
          creationModal: false,
          i18n: {
            creationModal: {
              button: "Create",
              colReorder: "Column Order:",
              columns: {
                search: "Column Search:",
                visible: "Column Visibility:"
              },
              length: "Page Length:",
              name: "Name:",
              order: "Sorting:",
              paging: "Paging:",
              scroller: "Scroll Position:",
              search: "Search:",
              searchBuilder: "SearchBuilder:",
              searchPanes: "SearchPanes:",
              select: "Select:",
              title: "Create New State",
              toggleLabel: "Includes:"
            },
            duplicateError: "A state with this name already exists.",
            emptyError: "Name cannot be empty.",
            emptyStates: "No saved states",
            removeConfirm: 'Are you sure you want to remove "%s"?',
            removeError: "Failed to remove state.",
            removeJoiner: " and ",
            removeSubmit: "Remove",
            removeTitle: "Remove State",
            renameButton: "Rename",
            renameLabel: 'New Name for "%s":',
            renameTitle: "Rename State"
          },
          modalCloseButton: true,
          remove: true,
          rename: true,
          save: true,
          saveState: {
            colReorder: true,
            columns: {
              search: true,
              visible: true
            },
            length: true,
            order: true,
            paging: true,
            scroller: true,
            search: true,
            searchBuilder: true,
            searchPanes: true,
            select: true
          },
          splitSecondaries: [
            "updateState",
            "renameState",
            "removeState"
          ],
          toggle: {
            colReorder: false,
            columns: {
              search: false,
              visible: false
            },
            length: false,
            order: false,
            paging: false,
            scroller: false,
            search: false,
            searchBuilder: false,
            searchPanes: false,
            select: false
          },
          createButton: null,
          createState: null
        };
        return StateRestore2;
      }()
    );
    var $$1;
    var dataTable;
    function setJQuery(jq) {
      $$1 = jq;
      dataTable = jq.fn.dataTable;
    }
    var StateRestoreCollection = (
      /** @class */
      function() {
        function StateRestoreCollection2(settings, opts) {
          var _this = this;
          if (!dataTable || !dataTable.versionCheck || !dataTable.versionCheck("1.10.0")) {
            throw new Error("StateRestore requires DataTables 1.10 or newer");
          }
          if (!dataTable.Buttons) {
            throw new Error("StateRestore requires Buttons");
          }
          var table = new dataTable.Api(settings);
          this.classes = $$1.extend(true, {}, StateRestoreCollection2.classes);
          if (table.settings()[0]._stateRestore !== void 0) {
            return;
          }
          this.c = $$1.extend(true, {}, StateRestoreCollection2.defaults, opts);
          this.s = {
            dt: table,
            hasColReorder: dataTable.ColReorder !== void 0,
            hasScroller: dataTable.Scroller !== void 0,
            hasSearchBuilder: dataTable.SearchBuilder !== void 0,
            hasSearchPanes: dataTable.SearchPanes !== void 0,
            hasSelect: dataTable.select !== void 0,
            states: []
          };
          this.s.dt.on("xhr", function(e, xhrsettings, json) {
            if (json && json.stateRestore) {
              _this._addPreDefined(json.stateRestore);
            }
          });
          this.dom = {
            background: $$1('<div class="' + this.classes.background + '"/>'),
            checkboxInputRow: $$1('<div class="' + this.classes.formRow + '"><label class="' + this.classes.nameLabel + '">' + this.s.dt.i18n("stateRestore.creationModal.toggleLabel", this.c.i18n.creationModal.toggleLabel) + '</label><div class="dtsr-input"></div></div>'),
            closeButton: $$1('<div class="' + this.classes.closeButton + '">x</div>'),
            colReorderToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.colReorderToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.colReorder", this.c.i18n.creationModal.colReorder) + "</div>"),
            columnsSearchToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.columnsSearchToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.columns.search", this.c.i18n.creationModal.columns.search) + "</div>"),
            columnsVisibleToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.columnsVisibleToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.columns.visible", this.c.i18n.creationModal.columns.visible) + "</div>"),
            confirmation: $$1('<div class="' + this.classes.confirmation + '"/>'),
            confirmationTitleRow: $$1('<div class="' + this.classes.confirmationTitleRow + '"></div>'),
            createButtonRow: $$1('<div class="' + this.classes.formRow + " " + this.classes.modalFoot + '"><button class="' + this.classes.creationButton + " " + this.classes.dtButton + '">' + this.s.dt.i18n("stateRestore.creationModal.button", this.c.i18n.creationModal.button) + "</button></div>"),
            creation: $$1('<div class="' + this.classes.creation + '"/>'),
            creationForm: $$1('<div class="' + this.classes.creationForm + '"/>'),
            creationTitle: $$1('<div class="' + this.classes.creationText + '"><h2 class="' + this.classes.creationTitle + '">' + this.s.dt.i18n("stateRestore.creationModal.title", this.c.i18n.creationModal.title) + "</h2></div>"),
            dtContainer: $$1(this.s.dt.table().container()),
            duplicateError: $$1('<span class="' + this.classes.modalError + '">' + this.s.dt.i18n("stateRestore.duplicateError", this.c.i18n.duplicateError) + "</span>"),
            emptyError: $$1('<span class="' + this.classes.modalError + '">' + this.s.dt.i18n("stateRestore.emptyError", this.c.i18n.emptyError) + "</span>"),
            lengthToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.lengthToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.length", this.c.i18n.creationModal.length) + "</div>"),
            nameInputRow: $$1('<div class="' + this.classes.formRow + '"><label class="' + this.classes.nameLabel + '">' + this.s.dt.i18n("stateRestore.creationModal.name", this.c.i18n.creationModal.name) + '</label><div class="dtsr-input"><input class="' + this.classes.nameInput + '" type="text"></div></div>'),
            orderToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.orderToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.order", this.c.i18n.creationModal.order) + "</div>"),
            pagingToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.pagingToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.paging", this.c.i18n.creationModal.paging) + "</div>"),
            removeContents: $$1('<div class="' + this.classes.confirmationText + '"><span></span></div>'),
            removeTitle: $$1('<div class="' + this.classes.creationText + '"><h2 class="' + this.classes.creationTitle + '">' + this.s.dt.i18n("stateRestore.removeTitle", this.c.i18n.removeTitle) + "</h2></div>"),
            scrollerToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.scrollerToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.scroller", this.c.i18n.creationModal.scroller) + "</div>"),
            searchBuilderToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.searchBuilderToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.searchBuilder", this.c.i18n.creationModal.searchBuilder) + "</div>"),
            searchPanesToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.searchPanesToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.searchPanes", this.c.i18n.creationModal.searchPanes) + "</div>"),
            searchToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.searchToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.search", this.c.i18n.creationModal.search) + "</div>"),
            selectToggle: $$1('<div class="' + this.classes.checkLabel + '"><input type="checkbox" class="' + this.classes.selectToggle + " " + this.classes.checkBox + '" checked>' + this.s.dt.i18n("stateRestore.creationModal.select", this.c.i18n.creationModal.select) + "</div>")
          };
          table.settings()[0]._stateRestore = this;
          this._searchForStates();
          this._addPreDefined(this.c.preDefined);
          var ajaxFunction;
          var ajaxData = {
            action: "load"
          };
          if (typeof this.c.ajax === "function") {
            ajaxFunction = function() {
              if (typeof _this.c.ajax === "function") {
                _this.c.ajax.call(_this.s.dt, ajaxData, function(s) {
                  return _this._addPreDefined(s);
                });
              }
            };
          } else if (typeof this.c.ajax === "string") {
            ajaxFunction = function() {
              $$1.ajax({
                data: ajaxData,
                dataType: "json",
                success: function(data) {
                  _this._addPreDefined(data);
                },
                type: "POST",
                url: _this.c.ajax
              });
            };
          }
          if (typeof ajaxFunction === "function") {
            if (this.s.dt.settings()[0]._bInitComplete) {
              ajaxFunction();
            } else {
              this.s.dt.one("preInit.dtsr", function() {
                ajaxFunction();
              });
            }
          }
          this.s.dt.on("destroy.dtsr", function() {
            _this.destroy();
          });
          this.s.dt.on("draw.dtsr buttons-action.dtsr", function() {
            return _this.findActive();
          });
          return this;
        }
        StateRestoreCollection2.prototype.addState = function(identifier, currentIdentifiers, options) {
          var _this = this;
          if (!this.c.create || !this.c.save) {
            return;
          }
          var state = this.getState(identifier);
          var createFunction = function(id, toggles) {
            if (id.length === 0) {
              return "empty";
            } else if (currentIdentifiers.includes(id)) {
              return "duplicate";
            }
            _this.s.dt.state.save();
            var that = _this;
            var successCallback = function() {
              that.s.states.push(this);
              that._collectionRebuild();
            };
            var currState = _this.s.dt.state();
            currState.stateRestore = {
              isPredefined: false,
              state: id,
              tableId: _this.s.dt.table().node().id
            };
            if (toggles.saveState) {
              var opts = _this.c.saveState;
              for (var _i = 0, _a = Object.keys(toggles.saveState); _i < _a.length; _i++) {
                var key = _a[_i];
                if (typeof toggles.saveState[key] === "object") {
                  for (var _b = 0, _c = Object.keys(toggles.saveState[key]); _b < _c.length; _b++) {
                    var nestedKey = _c[_b];
                    if (!toggles.saveState[key][nestedKey]) {
                      opts[key][nestedKey] = false;
                    }
                  }
                } else if (!toggles.saveState[key]) {
                  opts[key] = false;
                }
              }
              _this.c.saveState = opts;
            }
            var newState = new StateRestore(_this.s.dt.settings()[0], $$1.extend(true, {}, _this.c, options), id, currState, false, successCallback);
            $$1(_this.s.dt.table().node()).on("dtsr-modal-inserted", function() {
              newState.dom.confirmation.one("dtsr-remove", function() {
                return _this._removeCallback(newState.s.identifier);
              });
              newState.dom.confirmation.one("dtsr-rename", function() {
                return _this._collectionRebuild();
              });
              newState.dom.confirmation.one("dtsr-save", function() {
                return _this._collectionRebuild();
              });
            });
            return true;
          };
          if (state === null) {
            if (this.c.creationModal || options !== void 0 && options.creationModal) {
              this._creationModal(createFunction, identifier, options);
            } else {
              var success = createFunction(identifier, {});
              if (success === "empty") {
                throw new Error(this.s.dt.i18n("stateRestore.emptyError", this.c.i18n.emptyError));
              } else if (success === "duplicate") {
                throw new Error(this.s.dt.i18n("stateRestore.duplicateError", this.c.i18n.duplicateError));
              }
            }
          } else {
            throw new Error(this.s.dt.i18n("stateRestore.duplicateError", this.c.i18n.duplicateError));
          }
        };
        StateRestoreCollection2.prototype.removeAll = function(removeFunction) {
          if (this.s.states.length === 0) {
            return;
          }
          var ids = this.s.states.map(function(state) {
            return state.s.identifier;
          });
          var replacementString = ids[0];
          if (ids.length > 1) {
            replacementString = ids.slice(0, -1).join(", ") + this.s.dt.i18n("stateRestore.removeJoiner", this.c.i18n.removeJoiner) + ids.slice(-1);
          }
          $$1(this.dom.removeContents.children("span")).html(this.s.dt.i18n("stateRestore.removeConfirm", this.c.i18n.removeConfirm).replace(/%s/g, replacementString));
          this._newModal(this.dom.removeTitle, this.s.dt.i18n("stateRestore.removeSubmit", this.c.i18n.removeSubmit), removeFunction, this.dom.removeContents);
        };
        StateRestoreCollection2.prototype.destroy = function() {
          for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
            var state = _a[_i];
            state.destroy();
          }
          $$1.each(this.dom, function(name, el) {
            el.off().remove();
          });
          this.s.states = [];
          this.s.dt.off(".dtsr");
          $$1(this.s.dt.table().node()).off(".dtsr");
        };
        StateRestoreCollection2.prototype.findActive = function() {
          this.s.dt.state.save();
          var currState = this.s.dt.state();
          var button;
          var buttons = this.s.dt.buttons().nodes();
          for (var _i = 0, buttons_1 = buttons; _i < buttons_1.length; _i++) {
            button = buttons_1[_i];
            if ($$1(button).hasClass("dtsr-state") || $$1(button).children().hasClass("dtsr-state")) {
              this.s.dt.button(button).active(false);
            }
          }
          var results = [];
          for (var _a = 0, _b = this.s.states; _a < _b.length; _a++) {
            var state = _b[_a];
            if (state.compare(currState)) {
              results.push({
                data: state.s.savedState,
                name: state.s.identifier
              });
              for (var _c = 0, buttons_2 = buttons; _c < buttons_2.length; _c++) {
                button = buttons_2[_c];
                var btn = this.s.dt.button(button);
                if (btn.text() === state.s.identifier) {
                  btn.active(true);
                  break;
                }
              }
            }
          }
          return results;
        };
        StateRestoreCollection2.prototype.getState = function(identifier) {
          for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
            var state = _a[_i];
            if (state.s.identifier === identifier) {
              return state;
            }
          }
          return null;
        };
        StateRestoreCollection2.prototype.getStates = function(ids) {
          if (ids === void 0) {
            return this.s.states;
          } else {
            var states = [];
            for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
              var id = ids_1[_i];
              var found = false;
              for (var _a = 0, _b = this.s.states; _a < _b.length; _a++) {
                var state = _b[_a];
                if (id === state.s.identifier) {
                  states.push(state);
                  found = true;
                  break;
                }
              }
              if (!found) {
                states.push(void 0);
              }
            }
            return states;
          }
        };
        StateRestoreCollection2.prototype._addPreDefined = function(preDefined) {
          var _this = this;
          var states = Object.keys(preDefined).sort(function(a, b) {
            return a > b ? 1 : a < b ? -1 : 0;
          });
          var _loop_1 = function(state2) {
            for (var i = 0; i < this_1.s.states.length; i++) {
              if (this_1.s.states[i].s.identifier === state2) {
                this_1.s.states.splice(i, 1);
              }
            }
            var that = this_1;
            var successCallback = function() {
              that.s.states.push(this);
              that._collectionRebuild();
            };
            var loadedState = this_1._fixTypes(preDefined[state2]);
            var stateConfig = $$1.extend(true, {}, this_1.c, loadedState.c !== void 0 ? {
              saveState: loadedState.c.saveState,
              remove: loadedState.c.remove,
              rename: loadedState.c.rename,
              save: loadedState.c.save
            } : void 0, true);
            if (this_1.c.createState) {
              this_1.c.createState(stateConfig, loadedState);
            }
            var newState = new StateRestore(this_1.s.dt, stateConfig, state2, loadedState, true, successCallback);
            $$1(this_1.s.dt.table().node()).on("dtsr-modal-inserted", function() {
              newState.dom.confirmation.one("dtsr-remove", function() {
                return _this._removeCallback(newState.s.identifier);
              });
              newState.dom.confirmation.one("dtsr-rename", function() {
                return _this._collectionRebuild();
              });
              newState.dom.confirmation.one("dtsr-save", function() {
                return _this._collectionRebuild();
              });
            });
          };
          var this_1 = this;
          for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
            var state = states_1[_i];
            _loop_1(state);
          }
        };
        StateRestoreCollection2.prototype._collectionRebuild = function() {
          var button = this.s.dt.button("SaveStateRestore:name");
          var stateButtons = [];
          var i;
          if (button[0]) {
            var idxs = button.index().split("-");
            stateButtons = button[0].inst.c.buttons;
            for (i = 0; i < idxs.length; i++) {
              if (stateButtons[idxs[i]].buttons) {
                stateButtons = stateButtons[idxs[i]].buttons;
              } else {
                stateButtons = [];
                break;
              }
            }
          }
          for (i = 0; i < stateButtons.length; i++) {
            if (stateButtons[i].extend === "stateRestore") {
              stateButtons.splice(i, 1);
              i--;
            }
          }
          if (this.c._createInSaved) {
            stateButtons.push("createState");
          }
          var emptyText = '<span class="' + this.classes.emptyStates + '">' + this.s.dt.i18n("stateRestore.emptyStates", this.c.i18n.emptyStates) + "</span>";
          if (this.s.states.length === 0) {
            if (!stateButtons.includes(emptyText)) {
              stateButtons.push(emptyText);
            }
          } else {
            while (stateButtons.includes(emptyText)) {
              stateButtons.splice(stateButtons.indexOf(emptyText), 1);
            }
            this.s.states = this.s.states.sort(function(a, b) {
              var aId = a.s.identifier;
              var bId = b.s.identifier;
              return aId > bId ? 1 : aId < bId ? -1 : 0;
            });
            for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
              var state = _a[_i];
              var split = this.c.splitSecondaries.slice();
              if (split.includes("updateState") && (!this.c.save || !state.c.save)) {
                split.splice(split.indexOf("updateState"), 1);
              }
              if (split.includes("renameState") && (!this.c.save || !state.c.save || !this.c.rename || !state.c.rename)) {
                split.splice(split.indexOf("renameState"), 1);
              }
              if (split.includes("removeState") && (!this.c.remove || !state.c.remove)) {
                split.splice(split.indexOf("removeState"), 1);
              }
              var buttonConfig = {
                _stateRestore: state,
                attr: {
                  title: state.s.identifier
                },
                config: {
                  split
                },
                extend: "stateRestore",
                text: StateRestore.entityEncode(state.s.identifier),
                popoverTitle: StateRestore.entityEncode(state.s.identifier)
              };
              if (this.c.createButton) {
                this.c.createButton(buttonConfig, state.s.savedState);
              }
              stateButtons.push(buttonConfig);
            }
          }
          button.collectionRebuild(stateButtons);
          var buttons = this.s.dt.buttons();
          for (var _b = 0, buttons_3 = buttons; _b < buttons_3.length; _b++) {
            var butt = buttons_3[_b];
            if ($$1(butt.node).hasClass("dtsr-removeAllStates")) {
              if (this.s.states.length === 0) {
                this.s.dt.button(butt.node).disable();
              } else {
                this.s.dt.button(butt.node).enable();
              }
            }
          }
        };
        StateRestoreCollection2.prototype._creationModal = function(buttonAction, identifier, options) {
          var _this = this;
          this.dom.creation.empty();
          this.dom.creationForm.empty();
          this.dom.nameInputRow.find("input").val(identifier);
          this.dom.creationForm.append(this.dom.nameInputRow);
          var tableConfig = this.s.dt.settings()[0].oInit;
          var toggle;
          var togglesToInsert = [];
          var toggleDefined = options !== void 0 && options.toggle !== void 0;
          if (((!toggleDefined || options.toggle.order === void 0) && this.c.toggle.order || toggleDefined && options.toggle.order) && this.c.saveState.order && (tableConfig.ordering === void 0 || tableConfig.ordering)) {
            togglesToInsert.push(this.dom.orderToggle);
          }
          if (((!toggleDefined || options.toggle.search === void 0) && this.c.toggle.search || toggleDefined && options.toggle.search) && this.c.saveState.search && (tableConfig.searching === void 0 || tableConfig.searching)) {
            togglesToInsert.push(this.dom.searchToggle);
          }
          if (((!toggleDefined || options.toggle.paging === void 0) && this.c.toggle.paging || toggleDefined && options.toggle.paging) && this.c.saveState.paging && (tableConfig.paging === void 0 || tableConfig.paging)) {
            togglesToInsert.push(this.dom.pagingToggle);
          }
          if (((!toggleDefined || options.toggle.length === void 0) && this.c.toggle.length || toggleDefined && options.toggle.length) && this.c.saveState.length && (tableConfig.length === void 0 || tableConfig.length)) {
            togglesToInsert.push(this.dom.lengthToggle);
          }
          if (this.s.hasColReorder && ((!toggleDefined || options.toggle.colReorder === void 0) && this.c.toggle.colReorder || toggleDefined && options.toggle.colReorder) && this.c.saveState.colReorder) {
            togglesToInsert.push(this.dom.colReorderToggle);
          }
          if (this.s.hasScroller && ((!toggleDefined || options.toggle.scroller === void 0) && this.c.toggle.scroller || toggleDefined && options.toggle.scroller) && this.c.saveState.scroller) {
            togglesToInsert.push(this.dom.scrollerToggle);
          }
          if (this.s.hasSearchBuilder && ((!toggleDefined || options.toggle.searchBuilder === void 0) && this.c.toggle.searchBuilder || toggleDefined && options.toggle.searchBuilder) && this.c.saveState.searchBuilder) {
            togglesToInsert.push(this.dom.searchBuilderToggle);
          }
          if (this.s.hasSearchPanes && ((!toggleDefined || options.toggle.searchPanes === void 0) && this.c.toggle.searchPanes || toggleDefined && options.toggle.searchPanes) && this.c.saveState.searchPanes) {
            togglesToInsert.push(this.dom.searchPanesToggle);
          }
          if (this.s.hasSelect && ((!toggleDefined || options.toggle.select === void 0) && this.c.toggle.select || toggleDefined && options.toggle.select) && this.c.saveState.select) {
            togglesToInsert.push(this.dom.selectToggle);
          }
          if (typeof this.c.toggle.columns === "boolean" && ((!toggleDefined || options.toggle.order === void 0) && this.c.toggle.columns || toggleDefined && options.toggle.order) && this.c.saveState.columns) {
            togglesToInsert.push(this.dom.columnsSearchToggle);
            togglesToInsert.push(this.dom.columnsVisibleToggle);
          } else if ((!toggleDefined || options.toggle.columns === void 0) && typeof this.c.toggle.columns !== "boolean" || typeof options.toggle.order !== "boolean") {
            if (typeof this.c.saveState.columns !== "boolean" && this.c.saveState.columns) {
              if (
                // columns.search is defined when passed in
                (toggleDefined && options.toggle.columns !== void 0 && typeof options.toggle.columns !== "boolean" && options.toggle.columns.search || // Columns search is not defined when passed in but is in defaults
                (!toggleDefined || options.toggle.columns === void 0 || typeof options.toggle.columns !== "boolean" && options.toggle.columns.search === void 0) && typeof this.c.toggle.columns !== "boolean" && this.c.toggle.columns.search) && this.c.saveState.columns.search
              ) {
                togglesToInsert.push(this.dom.columnsSearchToggle);
              }
              if (
                // columns.visible is defined when passed in
                (toggleDefined && options.toggle.columns !== void 0 && typeof options.toggle.columns !== "boolean" && options.toggle.columns.visible || // Columns visible is not defined when passed in but is in defaults
                (!toggleDefined || options.toggle.columns === void 0 || typeof options.toggle.columns !== "boolean" && options.toggle.columns.visible === void 0) && typeof this.c.toggle.columns !== "boolean" && this.c.toggle.columns.visible) && this.c.saveState.columns.visible
              ) {
                togglesToInsert.push(this.dom.columnsVisibleToggle);
              }
            } else if (this.c.saveState.columns) {
              togglesToInsert.push(this.dom.columnsSearchToggle);
              togglesToInsert.push(this.dom.columnsVisibleToggle);
            }
          }
          togglesToInsert.sort(function(a, b) {
            var aVal = a.text();
            var bVal = b.text();
            if (aVal < bVal) {
              return -1;
            } else if (aVal > bVal) {
              return 1;
            } else {
              return 0;
            }
          });
          var checkboxesEl = this.dom.checkboxInputRow.css("display", togglesToInsert.length ? "block" : "none").appendTo(this.dom.creationForm).find("div.dtsr-input").empty();
          for (var _i = 0, togglesToInsert_1 = togglesToInsert; _i < togglesToInsert_1.length; _i++) {
            toggle = togglesToInsert_1[_i];
            checkboxesEl.append(toggle);
          }
          this.dom.background.appendTo(this.dom.dtContainer);
          this.dom.creation.append(this.dom.creationTitle).append(this.dom.creationForm).append(this.dom.createButtonRow).appendTo(this.dom.dtContainer);
          $$1(this.s.dt.table().node()).trigger("dtsr-modal-inserted");
          for (var _a = 0, togglesToInsert_2 = togglesToInsert; _a < togglesToInsert_2.length; _a++) {
            toggle = togglesToInsert_2[_a];
            $$1(toggle.children("label:last-child")).on("click", function() {
              toggle.children("input").prop("checked", !toggle.children("input").prop("checked"));
            });
          }
          var creationButton = $$1("button." + this.classes.creationButton.replace(/ /g, "."));
          var inputs = this.dom.creationForm.find("input");
          if (inputs.length > 0) {
            $$1(inputs[0]).focus();
          } else {
            creationButton.focus();
          }
          var background = $$1("div." + this.classes.background.replace(/ /g, "."));
          var keyupFunction = function(e) {
            if (e.key === "Enter") {
              creationButton.click();
            } else if (e.key === "Escape") {
              background.click();
            }
          };
          if (this.c.modalCloseButton) {
            this.dom.creation.append(this.dom.closeButton);
            this.dom.closeButton.on("click", function() {
              return background.click();
            });
          }
          creationButton.on("click", function() {
            var saveState = {
              colReorder: _this.dom.colReorderToggle.find("input").is(":checked"),
              columns: {
                search: _this.dom.columnsSearchToggle.find("input").is(":checked"),
                visible: _this.dom.columnsVisibleToggle.find("input").is(":checked")
              },
              length: _this.dom.lengthToggle.find("input").is(":checked"),
              order: _this.dom.orderToggle.find("input").is(":checked"),
              paging: _this.dom.pagingToggle.find("input").is(":checked"),
              scroller: _this.dom.scrollerToggle.find("input").is(":checked"),
              search: _this.dom.searchToggle.find("input").is(":checked"),
              searchBuilder: _this.dom.searchBuilderToggle.find("input").is(":checked"),
              searchPanes: _this.dom.searchPanesToggle.find("input").is(":checked"),
              select: _this.dom.selectToggle.find("input").is(":checked")
            };
            var success = buttonAction($$1("input." + _this.classes.nameInput.replace(/ /g, ".")).val(), { saveState });
            if (success === true) {
              _this.dom.background.remove();
              _this.dom.creation.remove();
              $$1(document).unbind("keyup", keyupFunction);
            } else {
              _this.dom.creation.children("." + _this.classes.modalError).remove();
              _this.dom.creation.append(_this.dom[success + "Error"]);
            }
          });
          background.one("click", function() {
            _this.dom.background.remove();
            _this.dom.creation.remove();
            $$1(document).unbind("keyup", keyupFunction);
            _this._collectionRebuild();
          });
          $$1(document).on("keyup", keyupFunction);
          this.s.dt.state.save();
        };
        StateRestoreCollection2.prototype._fixTypes = function(state) {
          var i;
          var fixNum = function(d, prop) {
            var val = d[prop];
            if (val !== void 0) {
              d[prop] = typeof val === "number" ? val : parseInt(val);
            }
          };
          var fixBool = function(d, prop) {
            var val = d[prop];
            if (val !== void 0) {
              d[prop] = typeof val !== "string" ? val : val === "true" ? true : false;
            }
          };
          fixNum(state, "start");
          fixNum(state, "length");
          fixNum(state, "time");
          if (state.order) {
            for (i = 0; i < state.order.length; i++) {
              fixNum(state.order[i], 0);
            }
          }
          if (state.search) {
            fixBool(state.search, "caseInsensitive");
            fixBool(state.search, "regex");
            fixBool(state.search, "smart");
            fixBool(state.search, "visible");
            fixBool(state.search, "return");
          }
          if (state.columns) {
            for (i = 0; i < state.columns.length; i++) {
              fixBool(state.columns[i], "caseInsensitive");
              fixBool(state.columns[i], "regex");
              fixBool(state.columns[i], "smart");
              fixBool(state.columns[i], "visible");
            }
          }
          if (state.colReorder) {
            for (i = 0; i < state.colReorder.length; i++) {
              fixNum(state.colReorder, i);
            }
          }
          return state;
        };
        StateRestoreCollection2.prototype._removeCallback = function(identifier) {
          for (var i = 0; i < this.s.states.length; i++) {
            if (this.s.states[i].s.identifier === identifier) {
              this.s.states.splice(i, 1);
              i--;
            }
          }
          this._collectionRebuild();
          return true;
        };
        StateRestoreCollection2.prototype._newModal = function(title2, buttonText, buttonAction, modalContents) {
          var _this = this;
          this.dom.background.appendTo(this.dom.dtContainer);
          this.dom.confirmationTitleRow.empty().append(title2);
          var confirmationButton = $$1('<button class="' + this.classes.confirmationButton + " " + this.classes.dtButton + '">' + buttonText + "</button>");
          this.dom.confirmation.empty().append(this.dom.confirmationTitleRow).append(modalContents).append($$1('<div class="' + this.classes.confirmationButtons + '"></div>').append(confirmationButton)).appendTo(this.dom.dtContainer);
          $$1(this.s.dt.table().node()).trigger("dtsr-modal-inserted");
          var inputs = modalContents.children("input");
          if (inputs.length > 0) {
            $$1(inputs[0]).focus();
          } else {
            confirmationButton.focus();
          }
          var background = $$1("div." + this.classes.background.replace(/ /g, "."));
          var keyupFunction = function(e) {
            if (e.key === "Enter") {
              confirmationButton.click();
            } else if (e.key === "Escape") {
              background.click();
            }
          };
          confirmationButton.on("click", function() {
            var success = buttonAction(true);
            if (success === true) {
              _this.dom.background.remove();
              _this.dom.confirmation.remove();
              $$1(document).unbind("keyup", keyupFunction);
              confirmationButton.off("click");
            } else {
              _this.dom.confirmation.children("." + _this.classes.modalError).remove();
              _this.dom.confirmation.append(_this.dom[success + "Error"]);
            }
          });
          this.dom.confirmation.on("click", function(e) {
            e.stopPropagation();
          });
          background.one("click", function() {
            _this.dom.background.remove();
            _this.dom.confirmation.remove();
            $$1(document).unbind("keyup", keyupFunction);
          });
          $$1(document).on("keyup", keyupFunction);
        };
        StateRestoreCollection2.prototype._searchForStates = function() {
          var _this = this;
          var keys = Object.keys(localStorage);
          var _loop_2 = function(key2) {
            if (key2.startsWith("DataTables_stateRestore_") && (key2.endsWith(location.pathname) || key2.endsWith(location.pathname + "_" + this_2.s.dt.table().node().id))) {
              var loadedState_1 = JSON.parse(localStorage.getItem(key2));
              if (loadedState_1.stateRestore.isPreDefined || loadedState_1.stateRestore.tableId && loadedState_1.stateRestore.tableId !== this_2.s.dt.table().node().id) {
                return "continue";
              }
              var that_1 = this_2;
              var successCallback = function() {
                this.s.savedState = loadedState_1;
                that_1.s.states.push(this);
                that_1._collectionRebuild();
              };
              var newState_1 = new StateRestore(this_2.s.dt, $$1.extend(true, {}, this_2.c, { saveState: loadedState_1.c.saveState }), loadedState_1.stateRestore.state, loadedState_1, false, successCallback);
              $$1(this_2.s.dt.table().node()).on("dtsr-modal-inserted", function() {
                newState_1.dom.confirmation.one("dtsr-remove", function() {
                  return _this._removeCallback(newState_1.s.identifier);
                });
                newState_1.dom.confirmation.one("dtsr-rename", function() {
                  return _this._collectionRebuild();
                });
                newState_1.dom.confirmation.one("dtsr-save", function() {
                  return _this._collectionRebuild();
                });
              });
            }
          };
          var this_2 = this;
          for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var key = keys_1[_i];
            _loop_2(key);
          }
        };
        StateRestoreCollection2.version = "1.0.0";
        StateRestoreCollection2.classes = {
          background: "dtsr-background",
          checkBox: "dtsr-check-box",
          checkLabel: "dtsr-check-label",
          checkRow: "dtsr-check-row",
          closeButton: "dtsr-popover-close",
          colReorderToggle: "dtsr-colReorder-toggle",
          columnsSearchToggle: "dtsr-columns-search-toggle",
          columnsVisibleToggle: "dtsr-columns-visible-toggle",
          confirmation: "dtsr-confirmation",
          confirmationButton: "dtsr-confirmation-button",
          confirmationButtons: "dtsr-confirmation-buttons",
          confirmationMessage: "dtsr-confirmation-message dtsr-name-label",
          confirmationText: "dtsr-confirmation-text",
          confirmationTitle: "dtsr-confirmation-title",
          confirmationTitleRow: "dtsr-confirmation-title-row",
          creation: "dtsr-creation",
          creationButton: "dtsr-creation-button",
          creationForm: "dtsr-creation-form",
          creationText: "dtsr-creation-text",
          creationTitle: "dtsr-creation-title",
          dtButton: "dt-button",
          emptyStates: "dtsr-emptyStates",
          formRow: "dtsr-form-row",
          leftSide: "dtsr-left",
          lengthToggle: "dtsr-length-toggle",
          modalError: "dtsr-modal-error",
          modalFoot: "dtsr-modal-foot",
          nameInput: "dtsr-name-input",
          nameLabel: "dtsr-name-label",
          orderToggle: "dtsr-order-toggle",
          pagingToggle: "dtsr-paging-toggle",
          rightSide: "dtsr-right",
          scrollerToggle: "dtsr-scroller-toggle",
          searchBuilderToggle: "dtsr-searchBuilder-toggle",
          searchPanesToggle: "dtsr-searchPanes-toggle",
          searchToggle: "dtsr-search-toggle",
          selectToggle: "dtsr-select-toggle",
          toggleLabel: "dtsr-toggle-title"
        };
        StateRestoreCollection2.defaults = {
          _createInSaved: false,
          ajax: false,
          create: true,
          creationModal: false,
          i18n: {
            creationModal: {
              button: "Create",
              colReorder: "Column Order",
              columns: {
                search: "Column Search",
                visible: "Column Visibility"
              },
              length: "Page Length",
              name: "Name:",
              order: "Sorting",
              paging: "Paging",
              scroller: "Scroll Position",
              search: "Search",
              searchBuilder: "SearchBuilder",
              searchPanes: "SearchPanes",
              select: "Select",
              title: "Create New State",
              toggleLabel: "Include:"
            },
            duplicateError: "A state with this name already exists.",
            emptyError: "Name cannot be empty.",
            emptyStates: "No saved states",
            removeConfirm: "Are you sure you want to remove %s?",
            removeError: "Failed to remove state.",
            removeJoiner: " and ",
            removeSubmit: "Remove",
            removeTitle: "Remove State",
            renameButton: "Rename",
            renameLabel: "New Name for %s:",
            renameTitle: "Rename State"
          },
          modalCloseButton: true,
          preDefined: {},
          remove: true,
          rename: true,
          save: true,
          saveState: {
            colReorder: true,
            columns: {
              search: true,
              visible: true
            },
            length: true,
            order: true,
            paging: true,
            scroller: true,
            search: true,
            searchBuilder: true,
            searchPanes: true,
            select: true
          },
          splitSecondaries: [
            "updateState",
            "renameState",
            "removeState"
          ],
          toggle: {
            colReorder: false,
            columns: {
              search: false,
              visible: false
            },
            length: false,
            order: false,
            paging: false,
            scroller: false,
            search: false,
            searchBuilder: false,
            searchPanes: false,
            select: false
          },
          createButton: null,
          createState: null
        };
        return StateRestoreCollection2;
      }()
    );
    setJQuery$1($8);
    setJQuery($8);
    $8.fn.dataTable.StateRestore = StateRestore;
    $8.fn.DataTable.StateRestore = StateRestore;
    $8.fn.dataTable.StateRestoreCollection = StateRestoreCollection;
    $8.fn.DataTable.StateRestoreCollection = StateRestoreCollection;
    var apiRegister2 = dataTables_default.Api.register;
    apiRegister2("stateRestore()", function() {
      return this;
    });
    apiRegister2("stateRestore.state()", function(identifier) {
      var ctx = this.context[0];
      if (!ctx._stateRestore) {
        var api = dataTables_default.Api(ctx);
        var src = new dataTables_default.StateRestoreCollection(api, {});
        _stateRegen(api, src);
      }
      this[0] = ctx._stateRestore.getState(identifier);
      return this;
    });
    apiRegister2("stateRestore.state.add()", function(identifier, options) {
      var ctx = this.context[0];
      if (!ctx._stateRestore) {
        var api = dataTables_default.Api(ctx);
        var src = new dataTables_default.StateRestoreCollection(api, {});
        _stateRegen(api, src);
      }
      if (!ctx._stateRestore.c.create) {
        return this;
      }
      if (ctx._stateRestore.addState) {
        var states = ctx._stateRestore.s.states;
        var ids = [];
        for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
          var intState = states_1[_i];
          ids.push(intState.s.identifier);
        }
        ctx._stateRestore.addState(identifier, ids, options);
        return this;
      }
    });
    apiRegister2("stateRestore.states()", function(ids) {
      var ctx = this.context[0];
      if (!ctx._stateRestore) {
        var api = dataTables_default.Api(ctx);
        var src = new dataTables_default.StateRestoreCollection(api, {});
        _stateRegen(api, src);
      }
      this.length = 0;
      this.push.apply(this, ctx._stateRestore.getStates(ids));
      return this;
    });
    apiRegister2("stateRestore.state().save()", function() {
      var ctx = this[0];
      if (ctx.c.save) {
        ctx.save();
      }
      return this;
    });
    apiRegister2("stateRestore.state().rename()", function(newIdentifier) {
      var ctx = this.context[0];
      var state = this[0];
      if (state.c.save) {
        var states = ctx._stateRestore.s.states;
        var ids = [];
        for (var _i = 0, states_2 = states; _i < states_2.length; _i++) {
          var intState = states_2[_i];
          ids.push(intState.s.identifier);
        }
        state.rename(newIdentifier, ids);
      }
      return this;
    });
    apiRegister2("stateRestore.state().load()", function() {
      var ctx = this[0];
      ctx.load();
      return this;
    });
    apiRegister2("stateRestore.state().remove()", function(skipModal) {
      var ctx = this[0];
      if (ctx.c.remove) {
        ctx.remove(skipModal);
      }
      return this;
    });
    apiRegister2("stateRestore.states().remove()", function(skipModal) {
      var _this = this;
      var removeAllCallBack = function(skipModalIn) {
        var success = true;
        var that = _this.toArray();
        while (that.length > 0) {
          var set = that[0];
          if (set !== void 0 && set.c.remove) {
            var tempSuccess = set.remove(skipModalIn);
            if (tempSuccess !== true) {
              success = tempSuccess;
            } else {
              that.splice(0, 1);
            }
          } else {
            break;
          }
        }
        return success;
      };
      if (this.context[0]._stateRestore && this.context[0]._stateRestore.c.remove) {
        if (skipModal) {
          removeAllCallBack(skipModal);
        } else {
          this.context[0]._stateRestore.removeAll(removeAllCallBack);
        }
      }
      return this;
    });
    apiRegister2("stateRestore.activeStates()", function() {
      var ctx = this.context[0];
      this.length = 0;
      if (!ctx._stateRestore) {
        var api = dataTables_default.Api(ctx);
        var src = new dataTables_default.StateRestoreCollection(api, {});
        _stateRegen(api, src);
      }
      if (ctx._stateRestore) {
        this.push.apply(this, ctx._stateRestore.findActive());
      }
      return this;
    });
    dataTables_default.ext.buttons.stateRestore = {
      action: function(e, dt, node, config) {
        config._stateRestore.load();
        node.blur();
      },
      className: "dtsr-state",
      config: {
        split: ["updateState", "renameState", "removeState"]
      },
      text: function(dt) {
        return dt.i18n("buttons.stateRestore", "State %d", dt.stateRestore.states()[0].length + 1);
      }
    };
    dataTables_default.ext.buttons.updateState = {
      action: function(e, dt, node, config) {
        $8("div.dt-button-background").click();
        config.parent._stateRestore.save();
      },
      text: function(dt) {
        return dt.i18n("buttons.updateState", "Update");
      }
    };
    dataTables_default.ext.buttons.savedStates = {
      buttons: [],
      extend: "collection",
      init: function(dt, node, config) {
        dt.on("stateRestore-change", function() {
          dt.button(node).text(dt.i18n("buttons.savedStates", "Saved States", dt.stateRestore.states().length));
        });
        if (dt.settings()[0]._stateRestore === void 0) {
          _buttonInit(dt, config);
        }
      },
      name: "SaveStateRestore",
      text: function(dt) {
        return dt.i18n("buttons.savedStates", "Saved States", 0);
      }
    };
    dataTables_default.ext.buttons.savedStatesCreate = {
      buttons: [],
      extend: "collection",
      init: function(dt, node, config) {
        dt.on("stateRestore-change", function() {
          dt.button(node).text(dt.i18n("buttons.savedStates", "Saved States", dt.stateRestore.states().length));
        });
        if (dt.settings()[0]._stateRestore === void 0) {
          if (config.config === void 0) {
            config.config = {};
          }
          config.config._createInSaved = true;
          _buttonInit(dt, config);
        }
      },
      name: "SaveStateRestore",
      text: function(dt) {
        return dt.i18n("buttons.savedStates", "Saved States", 0);
      }
    };
    dataTables_default.ext.buttons.createState = {
      action: function(e, dt, node, config) {
        e.stopPropagation();
        var stateRestoreOpts = dt.settings()[0]._stateRestore.c;
        var language = dt.settings()[0].oLanguage;
        if (!stateRestoreOpts.create || !stateRestoreOpts.save) {
          return;
        }
        var prevStates = dt.stateRestore.states().toArray();
        var defaultString = language.buttons !== void 0 && language.buttons.stateRestore !== void 0 ? language.buttons.stateRestore : "State ";
        var replaceRegex;
        if (defaultString.indexOf("%d") === defaultString.length - 3) {
          replaceRegex = new RegExp(defaultString.replace(/%d/g, ""));
        } else {
          var splitString = defaultString.split("%d");
          replaceRegex = [];
          for (var _i = 0, splitString_1 = splitString; _i < splitString_1.length; _i++) {
            var parts = splitString_1[_i];
            replaceRegex.push(new RegExp(parts));
          }
        }
        var getId = function(identifier) {
          var id;
          if (Array.isArray(replaceRegex)) {
            id = identifier;
            for (var _i2 = 0, replaceRegex_1 = replaceRegex; _i2 < replaceRegex_1.length; _i2++) {
              var reg = replaceRegex_1[_i2];
              id = id.replace(reg, "");
            }
          } else {
            id = identifier.replace(replaceRegex, "");
          }
          if (isNaN(+id) || id.length === identifier) {
            return 0;
          } else {
            return +id;
          }
        };
        var identifiers = prevStates.map(function(state2) {
          return getId(state2.s.identifier);
        }).sort(function(a, b) {
          return +a < +b ? 1 : +a > +b ? -1 : 0;
        });
        var lastNumber = identifiers[0];
        dt.stateRestore.state.add(dt.i18n("buttons.stateRestore", "State %d", lastNumber !== void 0 ? lastNumber + 1 : 1), config.config);
        var states = dt.stateRestore.states().sort(function(a, b) {
          var aId = +getId(a.s.identifier);
          var bId = +getId(b.s.identifier);
          return aId > bId ? 1 : aId < bId ? -1 : 0;
        });
        var button = dt.button("SaveStateRestore:name");
        var buttonIndex = parseInt(button.index());
        var stateButtons = button[0] !== void 0 && button[0].inst.c.buttons[buttonIndex].buttons !== void 0 ? button[0].inst.c.buttons[buttonIndex].buttons : [];
        for (var i = 0; i < stateButtons.length; i++) {
          if (stateButtons[i].extend === "stateRestore") {
            stateButtons.splice(i, 1);
            i--;
          }
        }
        if (stateRestoreOpts._createInSaved) {
          stateButtons.push("createState");
        }
        for (var _a = 0, states_3 = states; _a < states_3.length; _a++) {
          var state = states_3[_a];
          var split = stateRestoreOpts.splitSecondaries.slice();
          if (split.includes("updateState") && !stateRestoreOpts.save) {
            split.splice(split.indexOf("updateState"), 1);
          }
          if (split.includes("renameState") && (!stateRestoreOpts.save || !stateRestoreOpts.rename)) {
            split.splice(split.indexOf("renameState"), 1);
          }
          if (split.includes("removeState") && !stateRestoreOpts.remove) {
            split.splice(split.indexOf("removeState"), 1);
          }
          stateButtons.push({
            _stateRestore: state,
            attr: {
              title: state.s.identifier
            },
            config: {
              split
            },
            extend: "stateRestore",
            text: StateRestore.entityEncode(state.s.identifier),
            popoverTitle: StateRestore.entityEncode(state.s.identifier)
          });
        }
        dt.button("SaveStateRestore:name").collectionRebuild(stateButtons);
        node.blur();
        var buttons = dt.buttons();
        for (var _b = 0, buttons_1 = buttons; _b < buttons_1.length; _b++) {
          var butt = buttons_1[_b];
          if ($8(butt.node).hasClass("dtsr-removeAllStates")) {
            if (states.length === 0) {
              dt.button(butt.node).disable();
            } else {
              dt.button(butt.node).enable();
            }
          }
        }
      },
      init: function(dt, node, config) {
        if (dt.settings()[0]._stateRestore === void 0 && dt.button("SaveStateRestore:name").length > 1) {
          _buttonInit(dt, config);
        }
      },
      text: function(dt) {
        return dt.i18n("buttons.createState", "Create State");
      }
    };
    dataTables_default.ext.buttons.removeState = {
      action: function(e, dt, node, config) {
        config.parent._stateRestore.remove();
        node.blur();
      },
      text: function(dt) {
        return dt.i18n("buttons.removeState", "Remove");
      }
    };
    dataTables_default.ext.buttons.removeAllStates = {
      action: function(e, dt, node) {
        dt.stateRestore.states().remove(true);
        node.blur();
      },
      className: "dt-button dtsr-removeAllStates",
      init: function(dt, node) {
        if (!dt.settings()[0]._stateRestore || dt.stateRestore.states().length === 0) {
          $8(node).addClass("disabled");
        }
      },
      text: function(dt) {
        return dt.i18n("buttons.removeAllStates", "Remove All States");
      }
    };
    dataTables_default.ext.buttons.renameState = {
      action: function(e, dt, node, config) {
        var states = dt.settings()[0]._stateRestore.s.states;
        var ids = [];
        for (var _i = 0, states_4 = states; _i < states_4.length; _i++) {
          var state = states_4[_i];
          ids.push(state.s.identifier);
        }
        config.parent._stateRestore.rename(void 0, ids);
        node.blur();
      },
      text: function(dt) {
        return dt.i18n("buttons.renameState", "Rename");
      }
    };
    function _init2(settings, options) {
      if (options === void 0) {
        options = null;
      }
      var api = new dataTables_default.Api(settings);
      var opts = options ? options : api.init().stateRestore || dataTables_default.defaults.stateRestore;
      var stateRestore = new StateRestoreCollection(api, opts);
      _stateRegen(api, stateRestore);
      return stateRestore;
    }
    function _buttonInit(dt, config) {
      var SRC = new dataTables_default.StateRestoreCollection(dt, config.config);
      _stateRegen(dt, SRC);
    }
    function _stateRegen(dt, src) {
      var states = dt.stateRestore.states();
      var button = dt.button("SaveStateRestore:name");
      var stateButtons = [];
      var i;
      if (button[0]) {
        var idxs = button.index().split("-");
        stateButtons = button[0].inst.c.buttons;
        for (i = 0; i < idxs.length; i++) {
          if (stateButtons[idxs[i]].buttons) {
            stateButtons = stateButtons[idxs[i]].buttons;
          } else {
            stateButtons = [];
            break;
          }
        }
      }
      var stateRestoreOpts = dt.settings()[0]._stateRestore.c;
      for (i = 0; i < stateButtons.length; i++) {
        if (stateButtons[i].extend === "stateRestore") {
          stateButtons.splice(i, 1);
          i--;
        }
      }
      if (stateRestoreOpts._createInSaved) {
        stateButtons.push("createState");
      }
      if (states === void 0 || states.length === 0) {
        stateButtons.push('<span class="' + src.classes.emptyStates + '">' + dt.i18n("stateRestore.emptyStates", src.c.i18n.emptyStates) + "</span>");
      } else {
        for (var _i = 0, states_5 = states; _i < states_5.length; _i++) {
          var state = states_5[_i];
          var split = stateRestoreOpts.splitSecondaries.slice();
          if (split.includes("updateState") && !stateRestoreOpts.save) {
            split.splice(split.indexOf("updateState"), 1);
          }
          if (split.includes("renameState") && (!stateRestoreOpts.save || !stateRestoreOpts.rename)) {
            split.splice(split.indexOf("renameState"), 1);
          }
          if (split.includes("removeState") && !stateRestoreOpts.remove) {
            split.splice(split.indexOf("removeState"), 1);
          }
          stateButtons.push({
            _stateRestore: state,
            attr: {
              title: state.s.identifier
            },
            config: {
              split
            },
            extend: "stateRestore",
            text: StateRestore.entityEncode(state.s.identifier),
            popoverTitle: StateRestore.entityEncode(state.s.identifier)
          });
        }
      }
      dt.button("SaveStateRestore:name").collectionRebuild(stateButtons);
      var buttons = dt.buttons();
      for (var _a = 0, buttons_2 = buttons; _a < buttons_2.length; _a++) {
        var butt = buttons_2[_a];
        if ($8(butt.node).hasClass("dtsr-removeAllStates")) {
          if (states.length === 0) {
            dt.button(butt.node).disable();
          } else {
            dt.button(butt.node).enable();
          }
        }
      }
    }
    $8(document).on("preInit.dt.dtsr", function(e, settings) {
      if (e.namespace !== "dt") {
        return;
      }
      if (settings.oInit.stateRestore || dataTables_default.defaults.stateRestore) {
        if (!settings._stateRestore) {
          _init2(settings, null);
        }
      }
    });
  })();

  // open_ess/frontend/src/types.ts
  async function efficiencyScatter(params) {
    const searchParams = new URLSearchParams();
    if (params.limit !== void 0) searchParams.set("limit", String(params.limit));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    if (params.idle_threshold !== void 0) searchParams.set("idle_threshold", String(params.idle_threshold));
    if (params.balancing_threshold !== void 0) searchParams.set("balancing_threshold", String(params.balancing_threshold));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/efficiency-scatter${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function cycles(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.min_soc_swing !== void 0) searchParams.set("min_soc_swing", String(params.min_soc_swing));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/cycles${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  // open_ess/frontend/src/settings.ts
  var defaultSettings = {
    theme: "dark",
    priceUnit: "eur",
    powerUnit: "w",
    weekStartDay: 1
  };
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop()?.split(";").shift();
      return val ?? null;
    }
    return null;
  }
  function setCookie(name, value) {
    const expires = /* @__PURE__ */ new Date();
    expires.setFullYear(expires.getFullYear() + 10);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
  function loadSettings() {
    const settings = { ...defaultSettings };
    const theme = getCookie("theme");
    if (theme) settings.theme = theme;
    const priceUnit = getCookie("priceUnit");
    if (priceUnit) settings.priceUnit = priceUnit;
    const powerUnit = getCookie("powerUnit");
    if (powerUnit) settings.powerUnit = powerUnit;
    const weekStartDay = getCookie("weekStartDay");
    if (weekStartDay !== null) settings.weekStartDay = parseInt(weekStartDay, 10);
    return settings;
  }
  function saveSetting(name, value) {
    setCookie(name, value);
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
  function savePagePref(page, key, value) {
    setCookie(`${page}_${key}`, value);
  }
  function loadPagePref(page, key, defaultValue) {
    const value = getCookie(`${page}_${key}`);
    return value !== null ? value : defaultValue;
  }
  function initSettings() {
    const settings = loadSettings();
    const themeSelect = document.getElementById("theme-select");
    themeSelect.value = settings.theme;
    themeSelect.addEventListener("change", function() {
      saveSetting("theme", this.value);
      applyTheme(this.value);
    });
    const priceUnitSelect = document.getElementById("price-unit-select");
    priceUnitSelect.value = settings.priceUnit;
    priceUnitSelect.addEventListener("change", function() {
      saveSetting("priceUnit", this.value);
    });
    const powerUnitSelect = document.getElementById("power-unit-select");
    powerUnitSelect.value = settings.powerUnit;
    powerUnitSelect.addEventListener("change", function() {
      saveSetting("powerUnit", this.value);
    });
    const weekStartSelect = document.getElementById("week-start-select");
    weekStartSelect.value = settings.weekStartDay;
    weekStartSelect.addEventListener("change", function() {
      saveSetting("weekStartDay", this.value);
    });
    applyTheme(settings.theme);
  }
  document.addEventListener("DOMContentLoaded", initSettings);
  if (document.readyState !== "loading") {
    initSettings();
  }

  // open_ess/frontend/src/utils.ts
  function isDarkTheme() {
    const settings = loadSettings();
    return settings.theme === "dark";
  }
  function formatDate(date) {
    return date.toISOString();
  }
  function formatEnergy(kwh) {
    if (kwh == null) return "-";
    return kwh + " kWh";
  }
  function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function formatDuration(hours) {
    if (hours < 1) {
      return Math.round(hours * 60) + " min";
    } else if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return h + "h " + m + "m";
    } else {
      const d = Math.floor(hours / 24);
      const h = Math.round(hours % 24);
      return d + "d " + h + "h";
    }
  }

  // open_ess/frontend/src/cycles.ts
  var cyclesTable = null;
  function getEfficiencyClass(efficiency) {
    if (efficiency == null) return "";
    if (efficiency >= 90) return "efficiency-good";
    if (efficiency >= 80) return "efficiency-ok";
    return "efficiency-poor";
  }
  function formatEfficiency(eff) {
    if (eff == null) return "-";
    return eff.toFixed(1) + "%";
  }
  function formatScatterTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  async function loadScatterChart() {
    const elementId = "scatter-chart";
    const aggregate = document.getElementById("scatter-aggregate-select").value;
    const limit = document.getElementById("scatter-limit-select").value;
    document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';
    try {
      let buildHoverText2 = function(d) {
        const eff = d.efficiency != null ? `${d.efficiency.toFixed(1)}%` : "N/A";
        const soc = d.soc != null ? `${d.soc}%` : "N/A";
        const time = formatScatterTime(d.time ?? "");
        switch (d.category) {
          case "charging":
            return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power ?? 0)} ${powerUnit}<br>Charger: ${fmtPower(d.inverter_charger_power ?? 0)} ${powerUnit}<br>Losses: ${fmtPower(d.losses ?? 0)} ${powerUnit}<br>Efficiency: ${eff}`;
          case "discharging":
            return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power ?? 0)} ${powerUnit}<br>Inverter: ${fmtPower(Math.abs(d.inverter_charger_power ?? 0))} ${powerUnit}<br>Losses: ${fmtPower(d.losses ?? 0)} ${powerUnit}<br>Efficiency: ${eff}`;
          case "balancing":
            return `Time: ${time}<br>SOC: ${soc}<br>Battery: ${fmtPower(d.battery_power ?? 0)} ${powerUnit}<br>Balancing power`;
          case "idling":
            return `Time: ${time}<br>SOC: ${soc}<br>Idle consumption: ${fmtPower(d.losses ?? 0)} ${powerUnit}`;
          default:
            return `Time: ${time}`;
        }
      };
      var buildHoverText = buildHoverText2;
      const data = await efficiencyScatter({
        aggregate_minutes: parseInt(aggregate),
        limit: parseInt(limit)
      });
      if (data.length === 0) {
        document.getElementById(elementId).innerHTML = '<div class="no-data">No data available</div>';
        return;
      }
      const isDark = isDarkTheme();
      const settings = loadSettings();
      const useKw = settings.powerUnit === "kw";
      const divisor = useKw ? 1e3 : 1;
      const powerUnit = useKw ? "kW" : "W";
      const categories = {
        charging: { data: [], color: "rgba(52, 152, 219, 0.5)", name: "Charging" },
        discharging: { data: [], color: "rgba(231, 76, 60, 0.5)", name: "Discharging" },
        idling: { data: [], color: "rgba(149, 165, 166, 0.5)", name: "Idling" },
        balancing: { data: [], color: "rgba(155, 89, 182, 0.5)", name: "Balancing" }
      };
      for (const d of data) {
        if (d.category && categories[d.category]) {
          categories[d.category].data.push(d);
        }
      }
      const fmtPower = (w) => useKw ? (w / 1e3).toFixed(2) : Math.round(w).toString();
      const traces = Object.entries(categories).map(([, cat]) => ({
        x: cat.data.map((d) => (d.battery_power ?? 0) / divisor),
        y: cat.data.map((d) => (d.losses ?? 0) / divisor),
        type: "scatter",
        mode: "markers",
        name: cat.name,
        marker: {
          color: cat.color,
          size: 8
        },
        text: cat.data.map(buildHoverText2),
        hoverinfo: "text"
      }));
      const layout = {
        margin: { t: 30, r: 30, b: 60, l: 60 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: isDark ? "#e4e4e4" : "#333333"
        },
        xaxis: {
          title: `Battery Power (${powerUnit})`,
          gridcolor: isDark ? "#2a2a4a" : "#eeeeee",
          linecolor: isDark ? "#3a3a5a" : "#dddddd",
          rangemode: "tozero"
        },
        yaxis: {
          title: `Losses (${powerUnit})`,
          gridcolor: isDark ? "#2a2a4a" : "#eeeeee",
          linecolor: isDark ? "#3a3a5a" : "#dddddd",
          rangemode: "tozero"
        },
        legend: {
          orientation: "h",
          y: -0.15,
          font: { color: isDark ? "#e4e4e4" : "#333333" }
        },
        hovermode: "closest"
      };
      document.getElementById(elementId).innerHTML = "";
      Plotly.newPlot(elementId, traces, layout, { responsive: true, displayModeBar: false });
    } catch (error) {
      console.error("Error loading scatter chart:", error);
      document.getElementById(elementId).innerHTML = '<div class="error">Failed to load scatter chart</div>';
    }
  }
  function efficiencyRenderer(data) {
    if (data == null) return "-";
    const cls = getEfficiencyClass(data);
    return `<span class="${cls}">${data.toFixed(1)}%</span>`;
  }
  function initCyclesTable() {
    cyclesTable = new dataTables_dataTables_default("#cycles-table", {
      data: [],
      columns: [
        { data: "start_time", render: (data) => formatDateTime(data) },
        { data: "end_time", render: (data) => formatDateTime(data), visible: false },
        { data: "duration_hours", render: (data) => formatDuration(data) },
        { data: "min_soc", render: (data) => data + "%", visible: false },
        { data: "max_soc", render: (data) => data + "%", visible: false },
        { data: "ac_energy_in", render: (data) => formatEnergy(data) },
        { data: "ac_energy_out", render: (data) => formatEnergy(data) },
        { data: "dc_energy_in", render: (data) => formatEnergy(data), visible: false },
        { data: "dc_energy_out", render: (data) => formatEnergy(data), visible: false },
        { data: "charger_efficiency", render: efficiencyRenderer },
        { data: "battery_efficiency", render: efficiencyRenderer },
        { data: "inverter_efficiency", render: efficiencyRenderer },
        { data: "system_efficiency", render: efficiencyRenderer },
        { data: "profit", render: (data) => data != null ? data.toFixed(2) : "-" },
        { data: "scheduled_profit", render: (data) => data != null ? data.toFixed(2) : "-", visible: false }
      ],
      order: [[0, "desc"]],
      colReorder: true,
      stateSave: true,
      stateDuration: -1,
      language: {
        emptyTable: "No cycles found",
        loadingRecords: "Loading..."
      },
      layout: {
        topStart: null,
        topEnd: {
          buttons: [
            {
              extend: "colvis",
              text: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
              titleAttr: "Select columns",
              className: "btn-colvis"
            }
          ]
        }
      }
    });
    return cyclesTable;
  }
  async function loadCycles() {
    const days = parseInt(document.getElementById("days-select").value);
    const minSwing = parseInt(document.getElementById("swing-select").value);
    const now = /* @__PURE__ */ new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
    try {
      const cyclesData = await cycles({
        start: formatDate(start),
        end: formatDate(now),
        min_soc_swing: minSwing
      });
      cyclesTable.clear();
      cyclesTable.rows.add(cyclesData);
      cyclesTable.draw();
      if (cyclesData.length === 0) {
        document.getElementById("cycle-stats").innerHTML = "";
        return;
      }
      const totalAcIn = cyclesData.reduce((sum, c) => sum + (c.ac_energy_in ?? 0), 0);
      const totalAcOut = cyclesData.reduce((sum, c) => sum + (c.ac_energy_out ?? 0), 0);
      const avgEfficiency = totalAcIn > 0 ? totalAcOut / totalAcIn * 100 : null;
      document.getElementById("cycle-stats").innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${cyclesData.length}</div>
                <div class="stat-label">Total Cycles</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatEnergy(totalAcIn)}</div>
                <div class="stat-label">Total AC In</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatEnergy(totalAcOut)}</div>
                <div class="stat-label">Total AC Out</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatEfficiency(avgEfficiency)}</div>
                <div class="stat-label">Avg Efficiency</div>
            </div>
        `;
    } catch (error) {
      console.error("Error loading cycles:", error);
      cyclesTable.clear().draw();
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const settings = loadSettings();
    applyTheme(settings.theme);
    document.getElementById("scatter-aggregate-select").value = loadPagePref("cycles", "aggregate", "10");
    document.getElementById("scatter-limit-select").value = loadPagePref("cycles", "limit", "2000");
    document.getElementById("days-select").value = loadPagePref("cycles", "days", "30");
    document.getElementById("swing-select").value = loadPagePref("cycles", "swing", "10");
    document.getElementById("scatter-aggregate-select").addEventListener("change", (e) => {
      savePagePref("cycles", "aggregate", e.target.value);
      loadScatterChart();
    });
    document.getElementById("scatter-limit-select").addEventListener("change", (e) => {
      savePagePref("cycles", "limit", e.target.value);
      loadScatterChart();
    });
    loadScatterChart();
    initCyclesTable();
    document.getElementById("days-select").addEventListener("change", (e) => {
      savePagePref("cycles", "days", e.target.value);
      loadCycles();
    });
    document.getElementById("swing-select").addEventListener("change", (e) => {
      savePagePref("cycles", "swing", e.target.value);
      loadCycles();
    });
    loadCycles();
  });
})();
/*! Bundled license information:

jquery/dist-module/jquery.module.js:
  (*!
   * jQuery JavaScript Library v4.0.0
   * https://jquery.com/
   *
   * Copyright OpenJS Foundation and other contributors
   * Released under the MIT license
   * https://jquery.com/license/
   *
   * Date: 2026-01-18T00:20Z
   *)

datatables.net/js/dataTables.mjs:
  (*! DataTables 2.3.7
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-dt/js/dataTables.dataTables.mjs:
  (*! DataTables styling integration
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-buttons/js/dataTables.buttons.mjs:
  (*! Buttons for DataTables 3.2.6
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-buttons-dt/js/buttons.dataTables.mjs:
  (*! DataTables styling wrapper for Buttons
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-buttons/js/buttons.colVis.mjs:
  (*!
   * Column visibility buttons for Buttons and DataTables.
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-buttons/js/buttons.html5.mjs:
  (*!
   * HTML5 export buttons for Buttons and DataTables.
   * © SpryMedia Ltd - datatables.net/license
   *
   * FileSaver.js (1.3.3) - MIT license
   * Copyright © 2016 Eli Grey - http://eligrey.com
   *)

datatables.net-colreorder/js/dataTables.colReorder.mjs:
  (*! ColReorder 2.1.2
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-colreorder-dt/js/colReorder.dataTables.mjs:
datatables.net-columncontrol-dt/js/columnControl.dataTables.mjs:
  (*! DataTables styling wrapper for ColReorder
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-columncontrol/js/dataTables.columnControl.mjs:
  (*! ColumnControl 1.2.1
   * Copyright (c) SpryMedia Ltd - datatables.net/license
   *
   * SVG icons: ISC License
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
   * All other copyright (c) for Lucide are held by Lucide Contributors 2022.
   *)

datatables.net-select/js/dataTables.select.mjs:
  (*! Select for DataTables 3.1.3
   * © SpryMedia Ltd - datatables.net/license/mit
   *)

datatables.net-select-dt/js/select.dataTables.mjs:
  (*! DataTables styling wrapper for Select
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-staterestore/js/dataTables.stateRestore.mjs:
  (*! StateRestore 1.4.3
   * © SpryMedia Ltd - datatables.net/license
   *)

datatables.net-staterestore-dt/js/stateRestore.dataTables.mjs:
  (*! Bootstrap integration for DataTables' StateRestore
   * © SpryMedia Ltd - datatables.net/license
   *)
*/
