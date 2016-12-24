(function(){
let { classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
		log = mapaPlus.core.log;

function $(id)
{
	return document.getElementById(id);
}
mapaPlus.mainWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator)
                   .getMostRecentWindow((mapaPlus.core.isTB ? "mail:3pane" : "navigator:browser"));

mapaPlus.iconSelected = {};
Object.defineProperty(mapaPlus, "instantApply", {
	get: function()
	{
		return Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefBranch).getBoolPref("browser.preferences.instantApply");
	}
});

mapaPlus.autoSave = mapaPlus.instantApply ? mapaPlus.saveOptions : function(){};
mapaPlus.isLocked = false;
mapaPlus.windowIDCommon = 0;

mapaPlus.keyName = {};
mapaPlus.hotkeyTaken = {mapa:[], all:[]};

mapaPlus.lastKeyDown = [];
mapaPlus.hotkeyDownRepeat = false;

//mapaPlus.iniIcons("urlbar-icons", "mapa_urlbar", "urlbar", "mapaPlusUrlbar")
mapaPlus.iniIcons = function(objId, iconId, id, checkbox)
{
	var skipId = ["statusbar-display"];
	var skipTag = ["tooltip", "popup", "prefpane"];
	var clone;
	var icon, vbox;
	var urlBarIcons = this.mainWindow.document.getElementById(objId);
	if (urlBarIcons)
	{
		var children = urlBarIcons.childNodes;
		icon = document.createElement("image");
		icon.collapsed = false;
		vbox = document.createElement("vbox");
		vbox.className = "mapapl";
		vbox.collapsed = true;
		vbox.setAttribute("onclick", "mapaPlus.mouseClick(this);");
		vbox.setAttribute("directionId", null);
		vbox.setAttribute("direction", false);
		vbox.setAttribute("selected", false);
		vbox.id = "mapapl-"+id+"-" + children[0].id;
		vbox.appendChild(icon);
		var last = document.importNode(vbox, true);
		$(objId).appendChild(last);
		for (var i = 0; i < children.length; i++)
		{
			if (skipId.indexOf(children[i].id) != -1 || skipTag.indexOf(children[i].tagName) != -1)
				continue;

			clone = document.importNode(children[i], true);
			if (clone.id == iconId)
			{
				this.iconSelected[id] = clone;
				continue;
			}
			this.cloneClass(children[i], clone);
			this.cleanClone(clone);

			clone.setAttribute("onclick", "mapaPlus.mouseClick(this);");
			if (["label", "description"].indexOf(clone.tagName) != -1 && clone.getAttribute("value") == "")
				clone.setAttribute("value", "??");

			if (clone.style.listStyleImage == "none")
			 clone.style.listStyleImage = 'url("resource://gre-resources/broken-image.png")';

			if (clone.children.length == 1 && clone.children[0].style.listStyleImage == "none")
				clone.children[0].style.listStyleImage = clone.style.listStyleImage;
			$(objId).appendChild(clone);
			clone.addEventListener("mousemove", function(e)
			{
				if (!mapaPlus.isLocked && $(checkbox).checked)
					mapaPlus.mouseMove(e);
			}, false);
			last = document.importNode(vbox, true);
			last.setAttribute("directionId", clone.id);
			last.id = "mapapl-"+ id + "-" + clone.id;
			$(objId).appendChild(last);
		};
		if (this.iconSelected[id])
		{
			var elId = this.iconSelected[id].getAttribute("insertafter");
			var dir = 0
			var el;
			if (elId)
			{
				dir = 1;
				if ($(elId))
					el = $(elId).nextSibling;
			}
			else
			{
				elId = this.iconSelected[id].getAttribute("insertbefore");
				if ($(elId))
					el = $(elId).previousSibling;
			}
			if (el)
			{
				el.setAttribute("directionId", elId);
				el.setAttribute("direction", dir);
				el.setAttribute("selected", true);
				el.collapsed = false;
			}
		}
	}
	return urlBarIcons;
}

mapaPlus.showSelected = function (e)
{
	var p, pp;
	try
	{
		p = e.target.parentNode.id;
	}
	catch(error){}
	try
	{
		pp = e.target.parentNode.parentNode.id;
	}
	catch(error){}
	if (e.target.id.match(/^mapapl-/) || p == "urlbar-icons" || p == "status-bar" || pp == "urlbar-icons" || pp == "status-bar")
		return;

	var c = $("urlbar-icons").childNodes;
	for(var i = 0; i < c.length; i++)
	{
		if (c[i].id.match(/^mapapl-/))
		{
			c[i].collapsed = c[i].getAttribute("selected") != "true";
		}
	}
	if ($("status-bar"))
	{
		var c = $("status-bar").childNodes;
		for(var i = 0; i < c.length; i++)
		{
			if (c[i].id.match(/^mapapl-/))
			{
				c[i].collapsed = c[i].getAttribute("selected") != "true";
			}
		}
	}
}

mapaPlus.mouseMove = function(event)
{
	if (mapaPlus.protected)
		return;

	var dropTarget = event.target;
	while(dropTarget.parentNode && dropTarget.parentNode.id != "urlbar-icons")
		dropTarget = dropTarget.parentNode;

	var direction = window.getComputedStyle(dropTarget.parentNode, null).direction;
	var dropTargetCenter = dropTarget.boxObject.x + (dropTarget.boxObject.width / 2);
	var dragAfter;
	if (direction == "ltr")
		dragAfter = event.clientX > dropTargetCenter;
	else
		dragAfter = event.clientX < dropTargetCenter;

	var c = dropTarget.parentNode.childNodes;
	for(var i = 0; i < c.length; i++)
	{
		if (c[i].id.match(/^mapapl-/) && (c[i].getAttribute("directionId" != dropTarget.id) || c[i].getAttribute("direction") != dragAfter))
		{
			c[i].collapsed = true;
		}
	}
	var icon;
	if (dragAfter)
	{
		icon = dropTarget.nextSibling || dropTarget;
	}
	else
	{
		icon = dropTarget.previousSibling || dropTarget;
	}
	icon.collapsed = false;
	icon.setAttribute("directionId", dropTarget.id);
	icon.setAttribute("direction", dragAfter);
}

mapaPlus.mouseClick = function(obj)
{
	var c = obj.parentNode.childNodes;
	for(var i = 0; i < c.length; i++)
	{
		if (!c[i].id.match(/^mapapl-/))
			continue;
		if (!c[i].collapsed)
		{
			this.iconSelected[c[i].id.split("-")[1]] = c[i];
			c[i].setAttribute("selected", true);
		}
		else
			c[i].setAttribute("selected", false);
	}
	this.autoSave();
}

mapaPlus.cloneStyle = function(orig, obj)
{
	if (!orig || !obj)
		return;

	let ignore = ["background-color", "width", "display", "visibility", "height", "cursor",]
	let o = window.getComputedStyle(orig, null);
	for(let i = 0; i < o.length; i++)
	{
		try
		{
			if (ignore.indexOf(o[i]) == -1)
				obj.style.setProperty(o[i], o.getPropertyValue(o[i]), o.getPropertyPriority(o[i]));
		}
		catch(e)
		{
			log.error(e);
		}
	}
	obj.className += " clone";
	if (obj.tagName == "image")
		obj.style.maxWidth = "24px";
}
mapaPlus.cloneClass = function(orig, obj)
{
	if (!orig || !obj)
		return;

	mapaPlus.cloneStyle(orig, obj);
	for(let i = 0; i < orig.childNodes.length; i++)
		mapaPlus.cloneClass(orig.childNodes[i], obj.childNodes[i]);
}
mapaPlus.cleanClone =	function(obj)
{
	let skipId = ["statusbar-display", "show_location_drag_icon"],
			skipTag = ["tooltip", "popup", "prefpane"];
	obj.display = "";
	obj.hidden = false;
	obj.collapsed = false;
	obj.style.display = "";
	obj.style.visibility = "";
	obj.style.overflow = "hidden";

	if (obj.tagName == "label" && obj.getAttribute("tooltiptext") == "" && obj.parentNode)
		obj.setAttribute("tooltiptext", obj.getAttribute("value"));

	if (obj.getAttribute("tooltiptext") == "")
		obj.setAttribute("tooltiptext", obj.id);

	for(let i = 0; i < obj.attributes.length; i++)
	{
		if (obj.attributes[i].name.match(/^(on*|tooltip|context|ondblclick)$/))
		{
			obj.removeAttribute(obj.attributes[i].name);
			i--;
		}
	}

	let children = obj.childNodes;
	for (let i = 0; i < children.length; i++)
	{
		if (skipId.indexOf(obj.children[i].id) != -1
				|| skipTag.indexOf(obj.children[i].tagName) != -1
				|| (obj.children[i].tagName == "label"
						&& (((!obj.children[i].value && obj.children[i].getAttribute("value") == '') && !obj.children[i].childNodes.length)
								|| (obj.children[i].previousSibling && obj.children[i].previousSibling.tagName == "label"))))
		{
			if (obj.children[i].getAttribute("value") != '')
			{
				if (obj.children[i].previousSibling && obj.children[i].previousSibling.tagName == "label")
					obj.children[i].previousSibling.setAttribute("value", obj.children[i].previousSibling.getAttribute("value") + (obj.children[i].previousSibling.getAttribute("value") == "" ? " " : "") + obj.children[i].getAttribute("value"));

				obj.children[i].parentNode.setAttribute("tooltiptext", obj.children[i].parentNode.getAttribute("tooltiptext") + (obj.children[i].parentNode.getAttribute("tooltiptext") == "" ? "" : "") + obj.children[i].getAttribute("value"));
			}

			obj.removeChild(obj.children[i]);
			i--;
		}
		else
			mapaPlus.cleanClone(obj.children[i]);
	}
	return obj;

}

mapaPlus.getOrder = function(obj)
{
	let id = "",
			dir = false,
			sel = null,
			c = $(obj),
			first, last;

	if (!c)
		return false;

	c = c.childNodes;
	for(let i = 0; i < c.length; i++)
	{
		if (c[i].id.match(/^mapapl-/))
		{
			if (c[i].getAttribute("selected") == "true")
				sel = c[i];
		}
		else
		{
			if (!first)
				first = c[i];

			last = c[i];
		}
	}
	if (sel)
	{
		id = sel.getAttribute("directionId");
		dir = sel.getAttribute("direction") == "true";
		if ((id == first.id && !dir) || (id == last.id && dir))
			id = "mapapl";

		return {id: id, dir: dir};
	}
	return false;
}

mapaPlus.timer = {
	timer: Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer),
	init: function()
	{
		this.timer.init(this, 500, this.timer.TYPE_REPEATING_SLACK);
		window.addEventListener("unload", this.cancel, false);
	},
	cancel: function()
	{
		mapaPlus.timer.timer.cancel();
	},
	observe: function()
	{
		$("mapaPlusIndicateIcon").setAttribute("suppressed", ($("mapaPlusSuppressBlink").checked ? !($("mapaPlusIndicateIcon").getAttribute("suppressed") == "true") : true));
	}
}

mapaPlus.setProtect = function(n, v)
{
	mapaPlus[n] = v;
	this.timer[n] = v;
}

mapaPlus.checkboxTriState = function(event)
{
	event.target.setAttribute("indeterminate", false);
	return;
}


mapaPlus.suppressedPopup = function()
{
	if (this.mainWindow.mapaPlus)
		this.mainWindow.mapaPlus.suppressedPopup(true, $("mapaPlusSuppressPopupRemove").value);
}

mapaPlus.close = function()
{
	window.removeEventListener("mousemove", mapaPlus.showSelected, true);

}

mapaPlus.confirmPasswordDone = {};
mapaPlus.confirmPassword = function(e)
{
	var r = true
	if ((e.type == "keydown" && e.keyCode != 32) || (e.type == "click" && e.button))
		return r;

	if (e.target.tagName == "checkbox")
	{
		if (!e.target.checked && this.core.pref(e.target.getAttribute("preference")))
		{
			e.target.checked = true;
			e.target.checked = r = !this.confirmPasswordDo("");
		}
	}
	else
	{
		var p = e.target.parentNode.parentNode;
		var d = p.hasAttribute("prevset") ? parseInt(p.getAttribute("prevset")) : this.core.pref(p.getAttribute("preference"));
		if (d && !this.confirmPasswordDo(""))
		{
			r = false;
			p.value = d;
		}
		else
			d = p.value;

		p.setAttribute("prevset", d);
	}
	return r;
}

mapaPlus.confirmPasswordDo = function confirmPasswordDo(id, f)
{
log.debug();
	f = f || false;
	if (!f && !this.isLocked && (this.pass || this.confirmPasswordDone[id] || (!this.instantApply && !this.protected && this.protectedBegin)))
		return true;

	this.core.dialogBackup = {
		dialogOptions: this.core.dialogOptions,
		dialogTemp: this.core.dialogTemp,
		dialogShow: this.core.dialogShow,
	};
	this.core.dialogShow = true;
	this.core.dialogTemp = false;
	this.core.dialogOptions = false;
	this.core.dialogForce = true;//false;
	var ret = false;
	var status = this.core.status == 1;
	this.core.lockDo = false;
	try
	{
		this.core.tokenDB.login(true);
		this.core.locked = false;
		this.confirmPasswordDone[id] = true;
//		if (!status)
//			this.core.tokenDB.logoutAndDropAuthenticatedResources();

		ret = true;
	}
	catch(e){}
	this.core.lockDo = true;
	return ret;
}
mapaPlus.addEventListener = function(id, callback, pref)
{
	let observer = new MutationObserver(callback);
	observer.observe($(id), pref);
// do we need disconnect on unload?
}

mapaPlus.setListeners = function()
{
	$("mapaPlusEnabled").addEventListener("CheckboxStateChange", this.enableDisable, false);
	$("mapaPlusStartup").addEventListener("CheckboxStateChange", this.enableDisable, false);
	$("mapaPlusStartupShort").addEventListener("CheckboxStateChange", this.enableDisable, false);
	$("mapaPlusSuppressPopup").addEventListener("CheckboxStateChange", this.suppress, false);
	$("mapaPlusToolsmenu").addEventListener("CheckboxStateChange", this.viewTogle, false);
	$("mapaPlusContextmenu").addEventListener("CheckboxStateChange", this.viewTogle, false);
	$("mapaPlusStatusbar").addEventListener("CheckboxStateChange", this.viewTogle, false);
	$("mapaPlusUrlbar").addEventListener("CheckboxStateChange", this.enableDisable, false);
	$("mapaPlusLockTimer").addEventListener("CheckboxStateChange", this.enableDisable, false);
	$("mapaPlusLockMinimize").addEventListener("CheckboxStateChange", this.enableDisable, false);
	try
	{
		this.addEventListener("mapaPlusSuppress", this.suppress, {attributes: true, attributeFilter: ["value"]});
		this.addEventListener("mapaPlusLogoutHotkey", this.hotkeyChanged, {attributes: true, attributeFilter: ["value"]});
		this.addEventListener("mapaPlusLockHotkey", this.hotkeyChanged, {attributes: true, attributeFilter: ["value"]});
		this.addEventListener("mapaPlusLockWinHotkey", this.hotkeyChanged, {attributes: true, attributeFilter: ["value"]});
	}
	catch(e)
	{
		$("mapaPlusSuppress").addEventListener("DOMAttrModified", this.suppress, false);
		$("mapaPlusLogoutHotkey").addEventListener("DOMAttrModified", this.hotkeyChanged, false);
		$("mapaPlusLockHotkey").addEventListener("DOMAttrModified", this.hotkeyChanged, false);
		$("mapaPlusLockWinHotkey").addEventListener("DOMAttrModified", this.hotkeyChanged, false);
	}
}

mapaPlus.onLoadCommon = function()
{
	mapaPlus.initCommon();
}

mapaPlus.closeCommon = function()
{
}

mapaPlus.initCommon = function(id)
{
	if (id == this.windowID)
		return;

	$("mapaPlusDebug").addEventListener("command", this.debugClick, true);
	$("mapaPlusChangesLog").addEventListener("command", this.changesLogClick, true);
	let obj = $("mapaPlusShowChangesLog_button");
	obj.setAttribute("linkCopy", mapaPlus.CHANGESLOG_URL);
	obj.addEventListener("click", function(e)
	{
		if (e.button != 2)
			mapaPlus.showChangesLog()

		e.stopPropagation();
		e.preventDefault();
	}, true);
	this.debugMenu();
	this.changesLogMenu();
	this.hotkeyInit();
	this.protectedBegin = this.core.pref("protect");

	this.setAttribute("mapaPlusLockTimerBox", "tooltiptext", $("mapaPlusLockTimerBox").getAttribute("tooltiptext").replace("#", this.core.appInfo.name));
	$("mapaPlusStartupFail").setAttribute("prevset", this.core.pref("startupfail"));
	window.addEventListener("CheckboxStateChange", this.checkboxTriState, false);
	window.addEventListener("unload", this.closeCommon, false);
	if (Components.classes["@mozilla.org/xpcom/version-comparator;1"]
			.getService(Components.interfaces.nsIVersionComparator)
			.compare(this.core.appInfo.version, "8.0") < 0)
	{
		$("mapaPlusAllPrefs").collapsed = true;
	}
	if ("arguments" in window && window.arguments[0])
	{
		var a = window.arguments[0];
		if (typeof(a) == "string")
			a = {selectTab: a};

		for(var c in a)
		{
			switch(c)
			{
				default:
				case "selectTab":
						var t = $("options").childNodes[0].childNodes;
						for(var i = 0; i < t.length; i++)
							if (t[i].id == a[c])
							{
								$("options").selectedIndex = i;
								break;
							}
					break;
			}
		}
	}
	if (!this.core.status)
	{
		this.setProtect("protectedBegin", false);
	}

	if (this.protectedBegin)
	{
//		this.core.tokenDB.logoutAndDropAuthenticatedResources();
	}
	this.setProtect("protected", this.protectedBegin)

	this.observer.init();
	if (this.core.locked)
		this.lock(true);
	else
		this.enableDisable();

	let sup = $("mapaPlusSupportSite");
	sup.setAttribute("href", mapaPlusCore.SUPPORTSITE + mapaPlusCore.SUPPORTSITEQUERY);
	sup.setAttribute("link", mapaPlusCore.SUPPORTSITE);
	sup.setAttribute("tooltiptext", mapaPlusCore.SUPPORTSITE);
	sup = $("mapaPlusSupportHomepage");
	sup.setAttribute("href", mapaPlusCore.HOMEPAGE);
	sup.setAttribute("link", mapaPlusCore.HOMEPAGE);
	sup.setAttribute("tooltiptext", mapaPlusCore.HOMEPAGE);

	if (this.core.isTB)
		return;

	var w = $("urlbar").inputField.parentNode.boxObject.width;
	$("urlbar").inputField.parentNode.style.minWidth = "140px";
	var w2 = $("urlbar").inputField.parentNode.boxObject.width;
	if (w2 > w)
	{
		$("urlbar").width = $("urlbar").boxObject.width + (w2-w);
	}
}//initCommon()

mapaPlus.loadArgs = function()
{
	if ("arguments" in window && window.arguments[0])
	{
		var a = window.arguments[0];
		if (typeof(a)	== "object")
		{
			for(var c in a)
			{
				this[c] = a[c];
			}
		}
	}
}

mapaPlus.viewTogle = function(e)
{
	if (!this.instantApply)
		return;

	this.core.pref(e.target.getAttribute("preference"), e.target.checked);
	this.core.windowUpdate(true,true);
}

mapaPlus.observer = {
	_observerService: Components.classes["@mozilla.org/observer-service;1"]
														.getService(Components.interfaces.nsIObserverService),
	_name: null,
	init: function()
	{
		this._name = "mapaPlusDialog";
		this._observerService.addObserver(this, this._name, false);
		window.addEventListener("unload", function() { mapaPlus.observer.uninit();}, false);
	},

	uninit: function()
	{
		this._observerService.removeObserver(this, this._name);
	},

	observe: function(aSubject, aTopic, aData)
	{
		aSubject.QueryInterface(Components.interfaces.nsISupportsString);
//log("commonop observe " + aSubject.data);
		if (aTopic != this._name || !mapaPlus[aSubject.data])
			return;

//log("commonop "+aData);
		mapaPlus[aSubject.data](aData);
	},
}

mapaPlus.lock = function(l)
{
	if (typeof(l) != "boolean")
	{
		l =  l.split("|");
		if (l[1] && l[1] == this.windowID)
			return;

		l = l[0] == "true";
	}
	try{document.documentElement.getButton("extra1").hidden = !l}catch(e){};
	this.protectUnlockDo(l);
	this.enableDisable(false);
}

mapaPlus.protectUnlock = function()
{
	if (this.confirmPasswordDo(""))
	{
		this.protectUnlockDo(false);
		this.enableDisable();
	}
}

mapaPlus.protectUnlockDo = function(p)
{
	if (!p)
		this.confirmPasswordDone[""] = true;

	this.isLocked = p;
	this.setProtect("protectedBegin", p);
	this.setProtect("protected", p);
	try{document.documentElement.getButton("extra1").hidden = !p}catch(e){};
}

mapaPlus.hotkeyPress = function(e)
{
	return !mapaPlus.hotkeyDownRepeat;
}

mapaPlus.hotkeyBlur = function(e)
{
	if (e.target.getAttribute("error") == "true")
	{
		var d = mapaPlus.hotkeyCheckDup(e.target.id, e.target.keys, false, "mapa");
		if (!d)
			mapaPlus.hotkeyShow([e.target.keysOrig], e.target, "init");
	}
	return true;
}
mapaPlus.hotkeyDown = function(e)
{
	if (e.keyCode == 9 || e.keyCode == 27 || e.keyCode == 13) //TAB, ESCAPE, ENTER
	{
		this.hotkeyDownRepeat = false;
		return true;
	}

	var keys = this.core.getKeys(e);
	if (this.core.matchKeys(this.lastKeyDown, keys[0])) //prevent repeats
	{
		this.hotkeyDownRepeat = true;
		return false;
	}
	this.hotkeyDownRepeat = false;
	this.lastKeyDown = keys[0];
	return this.hotkey(e, "down");
}

mapaPlus.hotkeyUp = function(e)
{
	var keys = this.core.getKeys(e);
	this.lastKeyDown = [];
	var k = e.target.keys;
/*
	if ((!keys[1][0].length && !e.target.keys.length) || (keys[1][0].length == e.target.keys.length))
	{
		k = [];
	}
*/
	if (e.keyCode == 8) //BACKSPACE
		k = [];
	else if (!k.length || (!keys[1][0].length && !k.length) || (keys[1][0].length == k.length))
	{
		k = e.target.keysOrig;
	}
	this.hotkeyShow([k], e.target, "up");
	if (e.target.getAttribute("error") != "true")
	{
		e.target.keysNew = e.target.keys;
		this.autoSave();
	}
}

mapaPlus.hotkey = function(e, type)
{
	if (e.keyCode == 9 || e.keyCode == 27 || e.keyCode == 13) //TAB, ESCAPE, ENTER
		return true;

	e.preventDefault();
	e.stopPropagation();
	var keys = this.core.getKeys(e);
/*
	if (e.keyCode == 27) //ESCAPE
		keys = [[],[[]]];
*/

	if (e.keyCode == 8) //BACKSPACE
		keys = [[],[[]]];

	mapaPlus.hotkeyShow(keys, e.target, type);
	return true;
}

mapaPlus.hotkeyChanged = function(e)
{
	if (e.target.keys)
	{
		mapaPlus.hotkeyShow([e.target.keys], e.target);
	}
}

mapaPlus.hotkeyShow = function(keys, obj, type)
{
	if (type == "down" && keys[1] && keys[1][0].length == 1 && keys[1][0][0] == "SHIFT")
		return false;

	var s = false;
	var r = "";
	type = type || null;
	var r = this.hotkeyGet(keys[0]);
	var fKeys = r[1];
	r = r[0];
	
//log(type + "\n-\n" + keys[0] + "\n-\n" + keys[1] + "\n-\n" + obj.keys)
	if ((type != "down" && keys[0].length < 2))
	{
		r = "";
		s = true;
	}
	else
	{
		if (type == "down")
		{
			if (keys[0].length == 1 || keys[0].length == keys[1][0].length)
			{
				if (keys[1][0].length)
					r += " + ";

				fKeys = [];
			}
		}
		s = true;
	}
	var dup = this.hotkeyCheckDup(obj.id, fKeys);

	if (dup)
		s = true;

	if (!r)
	{
		fKeys = [];
		r = "none";
		if (!obj.keys || obj.keys.length)
			s = true;
	}

	if (s)
	{
		obj.keys = fKeys;
		this.hotkeyTaken.mapa[obj.id] = fKeys;
		if (!obj.keysOrig || type == "init")
		{
			obj.keysOrig = obj.keys;
			obj.keysNew = obj.keys;
		}
	}

	if (type == "down" || type == "init" || type == "up")
		this.hotkeyDupMark();

	obj.value = r;
	return [r, dup];
}

mapaPlus.hotkeyGet = function(keys)
{
	var f = [];
	var r = "";
	for(var i = 0; i < keys.length; i++)
	{
		var k = null
		try
		{
			var t = keys[i];
			if (t == "ACCEL")
				t = this.core.accel;

			k = $("platformKeys").getString("VK_" + t);
		}
		catch(e)
		{
			try
			{
				k = $("localeKeys").getString("VK_" + keys[i]);
			}
			catch(e)
			{
				k = this.hotkeyFormat(keys[i]);
			}
		}
		
		if (k === null || typeof k == "undefined")
			continue;

		f.push(keys[i]);
		r = r + (r != "" ? " + " : "") + k;
	}
	return [r, keys];
}

mapaPlus.hotkeyFormat = function(k)
{
	if (this.hotkeyString[k.toUpperCase()])
		return this.hotkeyString[k.toUpperCase()];

	return k;
}

mapaPlus.hotkeyDupMark = function()
{
	var l = this.hotkeyTaken.mapa;
	for(var i in l)
	{
		$(i).setAttribute("error", this.hotkeyCheckDup(i, l[i]) ? true : false);
	}
}

mapaPlus.hotkeyCheckDup = function(id, keys, skip, type)
{
	if (!keys.length)
		return false;

	var l = {};
	if (type)
		l[type] = this.hotkeyTaken[type];
	else
		l = this.hotkeyTaken;

	for(var n in l)
		for (var i in l[n])
			if (skip && skip.indexOf(i) != 1)
				continue;
			else if (i != id && this.core.matchKeys(keys, l[n][i]))
				return i;

	return false;
}

mapaPlus.hotkeyInit = function(id)
{
	if (this.windowID == id)
		return;

	this.hotkeyTaken = {mapa:[], all:[]};
	var keys = this.mainWindow.document.getElementsByTagName("key");
	for(var i = 0, l = keys.length; i < l; i++)
	{
		if (keys[i].id.indexOf("mapaPlus_key") != -1 || !keys[i].hasAttribute("modifiers") || (!keys[i].hasAttribute("key") && !keys[i].hasAttribute("keycode") && !keys[i].hasAttribute("charcode")))
			continue;
		var k = keys[i].hasAttribute("keycode") ? keys[i].getAttribute("keycode").toUpperCase().replace("VK_", "") : 
							keys[i].hasAttribute("key") ? keys[i].getAttribute("key").toUpperCase() :
								keys[i].getAttribute("charcode").toUpperCase();
		if (!k)
			continue;
		var m = keys[i].getAttribute("modifiers").toUpperCase().replace("ACCEL", this.core.accel).replace(/^\s+|\s+$/g,"").replace(/[^A-Z]/g, " ").split(" ");
		this.hotkeyTaken.all["mapaPlusHotkeyTaken"+i] = m;
		this.hotkeyTaken.all["mapaPlusHotkeyTaken"+i].push(k);
	}
	this.hotkeyShow([this.core.prefLogoutHotkey], $("mapaPlusLogoutHotkey"), "init");
	this.hotkeyShow([this.core.prefLockHotkey], $("mapaPlusLockHotkey"), "init");
	this.hotkeyShow([this.core.prefLockWinHotkey], $("mapaPlusLockWinHotkey"), "init");
	this.hotkeyShow([this.core.prefLockLogoutHotkey], $("mapaPlusLockLogoutHotkey"), "init");
	document.documentElement.getButton("disclosure").removeAttribute("accesskey");
}

mapaPlus.hotkeySave = function(id, pref)
{
	if ($(id).getAttribute("error") == "true")
		return;

	this.core.pref(pref, $(id).keys.join(" ").toUpperCase());
	$(id).keysOrig = $(id).keys;
}

mapaPlus.openAllPrefs = function()
{
	let first = mapaPlus.core.windowFirst();
	if (first === null)
		return;

	mapaPlus.core.window["Window"][first].openURL('about:config?filter=' + mapaPlus.core.PREF_BRANCH);
	mapaPlus.core.windowFocus();
}
mapaPlus.debugParse = function debugParse()
{
	let c = $("mapaPlusDebugMenu").children,
	r = 0;
	for (let i = 0; i < c.length; i++)
		if (c[i].getAttribute("checked"))
			r += Number(c[i].getAttribute("value"));

	return r;
}
mapaPlus.debugSave = function()
{
	mapaPlusCore.pref("debug", this.debugParse());
}

mapaPlus.debugClick = function debugClick(e)
{
log.debug();
	mapaPlus.debugMenu(mapaPlus.debugParse());
	if (mapaPlus.instantApply)
		mapaPlus.debugSave();
}

mapaPlus.debugMenu = function debugMenu(v)
{
	v = typeof(v) == "undefined" ? mapaPlusCore.pref("debug") : v;
	let c = $("mapaPlusDebugMenu"),
			t = [];

	c = c.children;
	for (let i = 0; i < c.length; i++)
	{
		let val = Number(c[i].getAttribute("value"));
		if (v & val)
		{
			c[i].setAttribute("checked", true);
		}
		else
		{
			c[i].removeAttribute("checked");
		}
		if (val & 1)
			c[i].disabled = (v & val);
	}
}


mapaPlus.changesLogMenuParse = function changesLogMenuParse()
{
	let c = $("mapaPlusChangesLogMenu").children,
	r = 0;
	for (let i = 0; i < c.length; i++)
		if (c[i].getAttribute("checked"))
			r += Number(c[i].getAttribute("value"));

	return r;
}
mapaPlus.changesLogSave = function()
{
	mapaPlusCore.pref("showchangeslog", this.changesLogMenuParse());
}

mapaPlus.changesLogClick = function changesLogClick(e)
{
	let first = mapaPlus.core.windowFirst();
	if (first !== null)
	{
		let win = mapaPlus.core.window["Window"][first];

		if (e.explicitOriginalTarget.getAttribute("checked")
				&& Number(e.explicitOriginalTarget.getAttribute("value")) & mapaPlus.CHANGESLOG_NOTIFICATION)
			mapaPlus.showChangesLog(mapaPlus.CHANGESLOG_NOTIFICATION, win)

	}
	mapaPlus.changesLogMenu(mapaPlus.changesLogMenuParse());
	if (mapaPlus.instantApply)
		mapaPlus.changesLogSave();
}

mapaPlus.changesLogMenu = function changesLogMenu(v)
{
log.debug();
	v = typeof(v) == "undefined" ? mapaPlusCore.pref("showchangeslog") : v;
	let c = $("mapaPlusChangesLogMenu"),
			t = [];

	c = c.children;
	for (let i = 0; i < c.length; i++)
	{
		if (c[i].getAttribute("value") == 1 && !mapaPlus.notificationAvailable)
			c[i].disabled = true;

		if (!c[i].disabled && v & Number(c[i].getAttribute("value")))
		{
			t.push(mapaPlus.strings["changesLog" + Number(c[i].getAttribute("value"))]);
			c[i].setAttribute("checked", true);
		}
		else
			c[i].removeAttribute("checked");
	}
	if (!t.length)
		t = [mapaPlus.strings["none"]];

	$("mapaPlusChangesLog").setAttribute("label", (t.join(" + ")));
}

mapaPlus.linkClick = function linkClick(obj, e)
{
	let url = obj.getAttribute("href");
	let email = url.match(/^mailto:/);
	if (!obj.fixed)
	{
		let tags = {
					OS: mapaPlus.core.appInfo.OS + " (" + mapaPlus.core.appInfo.XPCOMABI + ")",
					VER: mapaPlus.core.addon.version,
					APP: mapaPlus.core.appInfo.name + " " + mapaPlus.core.appInfo.version,
				}
		if (email)
		{
			let reg = new RegExp("\{([A-Z]+)\}", "gm");
			url = url.replace(reg, function(a, b, c, d)
			{
				if (b in tags)
					return " " + tags[b];
				return a;
			});
			obj.setAttribute("href", url);
			obj.fixed = true;
		}
	}
	if (!mapaPlus.core.isTB || e.button == 2)
		return true;

	try
	{
		if (e.button == 1)
			mapaPlus.core.openUILinkIn(url);
		else if (email)
		{
			let aURI = Components.classes["@mozilla.org/network/io-service;1"]
							.getService(Components.interfaces.nsIIOService)
							.newURI(url, null, null);
			Components.classes["@mozilla.org/messengercompose;1"]
				.getService(Components.interfaces.nsIMsgComposeService)
				.OpenComposeWindowWithURI(null, aURI);
		}
		else
		{
			let tabmail = window.top.document.getElementById("tabmail"),
					args = {
						type: "contentTab",
						contentPage: url,
						background: false
					};
				tabmail.openTab(args.type, args);
		}
	}
	catch(e)
	{
		try{mapaPlus.core.openUILinkIn(url)}catch(e){};
	}
	return false;
}//linkClick()

mapaPlus.copyMenu = function(e)
{
	mapaPlus.copy(document.popupNode.hasAttribute("linkCopy") ? document.popupNode.getAttribute("linkCopy") : document.popupNode.getAttribute("link"));
}

mapaPlus.copy = function(txt)
{
	Cc["@mozilla.org/widget/clipboardhelper;1"]
		.getService(Ci.nsIClipboardHelper)
		.copyString(txt);
}

mapaPlus.loadArgs();

mapaPlus.timer.init();

window.addEventListener("load", mapaPlus.onLoadCommon , false);

})();