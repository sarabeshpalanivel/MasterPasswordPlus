var mapaPlus = {

	locked: false,
	windowType: "window",
	loadCore: function()
	{
		Components.utils.import("resource://mapaplus/masterpasswordplusCore.jsm");
		this.core = mapaPlusCore;
		this.dump = this.core.dump;
	},

	ss: {
		getWindowValue: function(){return null;},
		setWindowValue: function(){},
		getWindowState: function(){},
		deleteWindowValue: function(){},
		init: function(){},
	},

	hotkeyString: {
		DIVIDE: "/",
		MULTIPLY: "*",
		SEMICOLON: ";",
		EQUALS: "=",
		SUBTRACT: "-",
		ADD: "+",
		COMMA: ",",
		PERIOD: ".",
		SLASH: "/",
		QUOTE: "'",
		OPEN_BRACKET: "[",
		CLOSE_BRACKET: "]",
		BACK_SLASH: "\\",
		DECIMAL: "Num .",
		BACK_QUOTE: "`",
		BACK_SPACE: "Backspace",
		CAPS_LOCK: "CapsLock",
		CONTEXT_MENU: "Context",
		SCROLL_LOCK: "ScrollLock",
		NUM_LOCK: "NumLock"
	},

	EMAIL: "support.master-password-plus.unique8402@vano.org",
	HOMEPAGE: "http://goo.gl/Ipdep",
	SUPPORTSITE: "http://goo.gl/65ef6",

	dump: null,

	changemp: function()
	{
		//open window to set up master password
		this._openDialog("chrome://mozapps/content/preferences/changemp.xul", "mapaPlusChangeMPWindow", "centerscreen");
//		this._openDialog("chrome://pippki/content/changepassword.xul", "mapaPlusChangePWindow", "centerscreen");
	},

	removemp: function()
	{
		//open window to remove master password
		this._openDialog("chrome://mozapps/content/preferences/removemp.xul", "mapaPlusRemoveMPWindow", "centerscreen");
	},

	_openDialog: function(a, b, c, arg)
	{
		if (mapaPlus.locked)
			return;

		var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
		var browsers = wm.getZOrderDOMWindowEnumerator('', false);
		while (browsers.hasMoreElements())
		{
			var browser = browsers.getNext();
			if (browser.location.href.toString() == a)
			{
				browser.focus();
				return;
			}
		}
		Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
			.getService(Components.interfaces.nsIWindowWatcher)
			.openWindow(null, a, b, c, arg);

//		window.openDialog(a, b, c, arg);
	},

	options: function(arg)
	{
		mapaPlus._openDialog("chrome://mapaplus/content/masterpasswordplusOptions.xul", "mapaPlusOptionsWindow", "centerscreen", arg);
	},

	about: function()
	{
		this._openDialog("chrome://mapaplus/content/masterpasswordplusAbout.xul", "mapaPlusAboutWindow", "centerscreen, resizable");
	},

	openURL: function(url)
	{
		if (mapaPlus.core.isTB)
		{
//url = "about:addons";
			try
			{
				openContentTab(url, "tab", "addons.mozilla.org");
			}
			catch(e){}
			return
			let tabmail = document.getElementById("tabmail"),
					args = {
						type: "chromeTab",
						chromePage: url,
						background: false
					};
			function o() tabmail.openTab(args.type, args);
			if (mapaPlus.locked)
				mapaPlus.showUnlockArray.push(o);
			else
				o();
		}
		else
			switchToTabHavingURI(url, true);
//			openUILinkIn(url, "tab", false, null, null);
	},

	setAttribute: function (obj, attr, value, remove, ignore)
	{
		ignore = ignore || [];
		if (typeof(obj) == "string")
			obj = document.getElementById(obj);

		var c = obj.childNodes;
		var command = remove ? "removeAttribute" : "setAttribute";
		if (!obj.id || ignore.indexOf(obj.id) == -1)
			obj[command](attr, value);

		for(var i = 0; i < c.length; i++)
		{
			var n = !c[i].id || ignore.indexOf(c[i].id) == -1;
			if (c[i][command] && n)
				c[i][command](attr, value);

			if (c[i].childNodes.length > 0 && n)
				mapaPlus.setAttribute(c[i], attr, value, remove, ignore);
		}
	},

	AeroPeek: false,
}

mapaPlus.loadCore();
switch (Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("ui.key.").getIntPref("accelKey"))
{
	case 17:  mapaPlus.core.accel = "CONTROL"; break;
	case 18:  mapaPlus.core.accel = "ALT"; break;
	case 224: mapaPlus.core.accel = "META"; break;
	default:  mapaPlus.core.accel = (window.navigator.platform.search("Mac") == 0 ? "META" : "CONTROL");
}
var mapaPlusCore = mapaPlus.core;