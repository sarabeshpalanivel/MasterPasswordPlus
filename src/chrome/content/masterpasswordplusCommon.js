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

	dump: null,

	changemp: function()
	{
		//open window to set up master password
		return this._openDialog("chrome://mozapps/content/preferences/changemp.xul", "mapaPlusChangeMPWindow", "centerscreen");
//		this._openDialog("chrome://pippki/content/changepassword.xul", "mapaPlusChangePWindow", "centerscreen");
	},

	removemp: function()
	{
		//open window to remove master password
		return this._openDialog("chrome://mozapps/content/preferences/removemp.xul", "mapaPlusRemoveMPWindow", "centerscreen");
	},

	_openDialog: function(a, b, c, arg)
	{
		if (mapaPlus.locked)
			return null;

		var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
		var browsers = wm.getZOrderDOMWindowEnumerator('', false);
		while (browsers.hasMoreElements())
		{
			var browser = browsers.getNext();
			if (browser.location.href.toString() == a)
			{
				browser.focus();
				return browser;
			}
		}
		return Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
						.getService(Components.interfaces.nsIWindowWatcher)
						.openWindow(null, a, b, c, arg);

//		window.openDialog(a, b, c, arg);
	},

	options: function(arg)
	{
		return mapaPlus._openDialog("chrome://mapaplus/content/masterpasswordplusOptions.xul", "mapaPlusOptionsWindow", "centerscreen", arg);
	},

	about: function()
	{
		return this._openDialog("chrome://mapaplus/content/masterpasswordplusAbout.xul", "mapaPlusAboutWindow", "centerscreen, resizable");
	},

	openURL: function(url)
	{
		if (mapaPlus.core.isTB)
		{
//url = "about:addons";
			let win = null;
			try
			{
				win = openContentTab(url, "tab", "addons.mozilla.org");
mapaPlus.dump("openContentTab");
			}
			catch(e)
			{
mapaPlus.dump(e, 1);
				win = mapaPlus._openDialog(url, url);
			}
/*
			let tabmail = document.getElementById("tabmail"),
					args = {
						type: "chromeTab",
						chromePage: url,
						background: false
					};
			function o(){tabmail.openTab(args.type, args)}
			if (mapaPlus.locked)
				mapaPlus.showUnlockArray.push(o);
			else
				o();
*/
		}
		else
			win = switchToTabHavingURI(url, true);

		return win;
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
	notification: Components.classes['@mozilla.org/alerts-service;1'].getService(Components.interfaces.nsIAlertsService),
	openChanges: function()
	{
		mapaPlus.showChangesLog(mapaPlus.core.pref.getIntPref("showchangeslog"));
	},
	get getOpenURL ()
	{
		let	win = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsIWebNavigation)
							.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
							.rootTreeItem
							.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsIDOMWindow),
				first = mapaPlus.core.windowFirst(),
				func = win.switchToTabHavingURI;
		if (!func && first !== null)
		{
			func =  mapaPlus.core.window["Window"][first].window.switchToTabHavingURI || mapaPlus.core.window["Window"][first].openURL || mapaPlus.openURL;
		}
		return func
	},
	showChangesLog: function(type, demo)
	{
		if (typeof(type) == "undefined" || type & mapaPlus.CHANGESLOG_FULL)
		{
mapaPlus.dump(type);
			if (mapaPlus.getOpenURL)
				mapaPlus.getOpenURL("chrome://mapaplus/content/changes.xul", true);
		}
	
		let addon = this.core.addon;
		if (type & mapaPlus.CHANGESLOG_NOTIFICATION)
			try
			{
				let str = "",
						mp = mapaPlus,
						notifListener = {
							observe: function(aSubject, aTopic, aData)
							{
								if (aTopic == 'alertclickcallback')
								{
									mp.showChangesLog();
								}
							}
						};
				if (Components.classes["@mozilla.org/xpcom/version-comparator;1"]
						.getService(Components.interfaces.nsIVersionComparator)
						.compare(this.core.appInfo.version, "8.0") > 0)
				{
					let	utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService),
							ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
							scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"].getService(Components.interfaces.nsIScriptableInputStream),
							aURL = addon.getResourceURI("changes.txt").spec,
							channel,
							input
					try
					{
						channel = ioService.newChannel(aURL,null,null);
					}
					catch(e) //FF48 WHAT THE FUCK, MOZILLA?! HOW ABOUT YOU UPDATE THE DAMN DOCUMENTATION BEFORE YOU REMOVE SHIT WITHOUT BACKWARDS COMPATIBILITY?
					{
						channel = ioService.newChannel2(aURL,null,null,
																						null,      // aLoadingNode
																						Services.scriptSecurityManager.getSystemPrincipal(),
																						null,      // aTriggeringPrincipal
																						Components.interfaces.nsILoadInfo.SEC_NORMAL,
																						Components.interfaces.nsIContentPolicy.TYPE_INTERNAL_IMAGE
						);
					}
					input = channel.open();
		
					scriptableStream.init(input);
					str = scriptableStream.read(input.available());
					scriptableStream.close();
					input.close();
					str = utf8Converter.convertURISpecToUTF8 (str, "UTF-8");
					str = str.replace(/\t/g, "  ");
					function RegExpEscape(string)
					{
						return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
					}
					let strV = (new RegExp("(^v" + RegExpEscape(addon.version) + " \\([\\s\\S]+)" , "m")).exec(str),
							prevVersion = mapaPlus.core.prevVersion.replace("-signed", "");
		
					if (strV)
					{
						str = strV[1];
						if (demo && prevVersion == addon.version)
						{
							let v,l = [],
									r = new RegExp("[\\s\\S]{2}^v([a-z0-9.]+) \\(", "mig");
		
							while (v = r.exec(str))
								l.push(v[1]);
		
							if (l.length)
								prevVersion = l[Math.floor(Math.random() * l.length)];
		
						}
						strV = (new RegExp("([\\s\\S]+)^v" + RegExpEscape(prevVersion) + " \\(" , "m")).exec(str);
						if (strV)
							str = strV[1];
		
					}
				}

				mapaPlus.notification.showAlertNotification(	'chrome://mapaPlus/skin/images/masterpasswordplus.png',
																											addon.name + " " + mapaPlus._("updated").replace("{old}", "v" + mapaPlus.core.prevVersion).replace("{new}", "v" + addon.version),
																											str.replace(/^\s+|\s+$/g, ""),
																											true,
																											null,
																											notifListener,
																											addon.name + " " + mapaPlus._("updated"));
			}catch(e){mapaPlus.dump(e, 1);}
	
		if (type & mapaPlus.CHANGESLOG_NOTIFICATION2 && window.gBrowser && document.getElementById("notification-popup"))
		{
	//		try
	//		{
				if (mapaPlus.core._notify)
					mapaPlus.core._notify.remove()
	
	
				mapaPlus.core._notify = PopupNotifications.show(window.gBrowser.selectedBrowser,
					"mapaPlus-update",
					addon.name + " " + mapaPlus._("updated").replace("{old}", "v" + mapaPlus.core.prevVersion).replace("{new}", "v" + addon.version),
					null, /* anchor ID */
					{
						label: mapaPlus._("changesLog"),
						accessKey: mapaPlus._("changesLog_key"),
						callback: function() {
							mapaPlus.showChangesLog()
						}
					},
					[{  /* secondary action */
						label: mapaPlus._("menu_options"),
						accessKey: mapaPlus._("menu_options_key"),
						callback: function()
						{
							mapaPlus.core._notify.remove();
							mapaPlus.options();
						},
						dismiss: true
					}],
					{
						persistWhileVisible: true,
						learnMoreURL: mapaPlus.core.HOMEPAGE,
						hideNotNow: true,
						removeOnDismissal: demo ? true : false
					}
				);
	//		}catch(e){mapaPlus.core.dump(e, 1)};
		}
	
	}//openChanges()
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

(function()
{
	let _strings = Components.classes["@mozilla.org/intl/stringbundle;1"]
						.getService(Components.interfaces.nsIStringBundleService)
						.createBundle("chrome://" + (mapaPlus.core.ADDONDOMAIN || "mapaplus") + "/locale/main.properties");
	mapaPlus._ = function(s)
	{
		try
		{
			return _strings.GetStringFromName(s);
		}
		catch(e)
		{
			return mapaPlus.strings[s];
		}
	};
})();
