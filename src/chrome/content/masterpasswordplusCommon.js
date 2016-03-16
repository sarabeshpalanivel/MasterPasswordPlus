var mapaPlus = {

	locked: false,
	windowType: "window",
	loadCore: function()
	{
		Components.utils.import("resource://mapaplus/masterpasswordplusCore.jsm");
		this.core = mapaPlusCore;
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

	dump: function (aMessage, obj, tab, parent, c)
	{
	//	return;

		parent = parent || aMessage;
		c = c || 0;
		tab = tab || 0;

		let showType = 1,
				sort = 1, //0 = none, 1 = case sensetive, 2 = case insensitive
				ret = ret || "",
				i,
				r = "",
				t2,
				t = typeof(aMessage),
				append = "",
				tText = "",
				t2Text = "";
		function _tab(tab)
		{
			return (new Array(tab)).join(" ");
		}
		if (showType)
			tText = " (" + t + ")";

		if (obj && t == "object" && aMessage !== null)
		{
			try
			{
				var array = new Array();
				for(i in aMessage)
					array.push(i);

				if (sort)
					if (sort == 2)
					{
						array.sort(function (a, b)
						{
							function chunkify(t)
							{
								var tz = [], x = 0, y = -1, n = 0, i, j;

								while ((i = (j = t.charAt(x++)).charCodeAt(0)))
								{
									var m = (i == 46 || (i >=48 && i <= 57));
									if (m !== n)
									{
										tz[++y] = "";
										n = m;
									}
									tz[y] += j;
								}
								return tz;
							}

							var aa = chunkify(a.toLowerCase()),
									bb = chunkify(b.toLowerCase()),
									x, c, d;

							for (x = 0; aa[x] && bb[x]; x++)
							{
								if (aa[x] !== bb[x])
								{
									c = Number(aa[x]), d = Number(bb[x]);
									if (c == aa[x] && d == bb[x])
									{
										return c - d;
									}
									else
										return (aa[x] > bb[x]) ? 1 : -1;
								}
							}
							return aa.length - bb.length;
						});
					}
					else
						array.sort();

				for(var ii = 0; ii < array.length; ii++)
				{
					i = array[ii];
					try
					{
						t2 = typeof(aMessage[i]);
					}
					catch(e)
					{
						t2 = "error";
					}
					if (showType)
						t2Text = " (" + t2 + ")";

					try
					{
						let text = aMessage[i];
						append = _tab(tab);
						try
						{
							text = text.toString();
							text = text.split("\n");
							for(var l = 1; l < text.length; l++)
								text[l] = append + text[l];

							text = text.join("\n");
						}
						catch(e){}
						r += append + i + t2Text + ": " + text;
					}
					catch(e)
					{
						r += append + i + t2Text + ": " + e;
					};
					if (t2 == "object" && aMessage[i] !== null && aMessage[i] != parent && c < obj)
					{
						r += "\n" + _tab(tab) + "{\n" + this.dump(aMessage[i], obj, tab + 5, parent, c+1) + _tab(tab) + "}";
					}
					r += "\n"
				}
			}
			catch(e)
			{
				r += append + i + " (error): " + e + "\n"
			}
		}
		if (tab)
			return r;

			Components.classes["@mozilla.org/consoleservice;1"]
				.getService(Components.interfaces.nsIConsoleService)
				.logStringMessage("mapaPlus: " + tText + ":" + aMessage + (r ? "\n" + r : ""));
		return "";
	},

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