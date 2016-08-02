const EXPORTED_SYMBOLS = ["mapaPlusCore"],
			{classes: Cc, interfaces: Ci, utils: Cu} = Components,
			nsIPKCS11Slot = Ci.nsIPKCS11Slot,
			PREF_BRANCH = "extensions.masterPasswordPlus.";
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

var self = this,
		_dump = function(){},
		mapaPlusCore = {
	GUID: 'masterpasswordtimeoutplus@vano',
	app: null,

	window: {},
	windowID: {},
	dialogShow: false,
	dialogSuppressTimer: 0,
	dialogSuppress: false,
	dialogTemp: true,
	dialogOptions: true,
	dialogForce: false, //bypass restrictions
	dialogBackup: {},

	suppressedIcon: false,
	suppressedLast: 0,
	suppressedPopupStop: false,
	suppressedFocusForce: false,

	prefLogoutTimeout: 0,
	prefLogoutInactivity: false,
	prefLogoutTimer: false,
	prefSuppressTimer: 0,
	prefSuppressBlink: false,
	prefSuppressTemp: 0,
	prefLockTimer: false,
	prefLockTimeout: false,
	prefLockInactivity: false,
	prefLockHideTitle: true,
	prefLockHotkey: "",
	prefLockWinHotkey: "",
	prefLogoutHotkey: "",
	prefLockLogoutHotkey: "",
	prefNoObserve: false,
	prefLockIncorrect: 3,
	prefLockLogout: false,
	prefLockMinimize: false,
	prefLockMinimizeBlur: false,
	prefLogoutHotkeyEnabled: false,
	prefLockHotkeyEnabled: false,
	prefLockWinHotkeyEnabled: false,
	prefLockLogoutHotkeyEnabled: false,
	prefForcePrompt: [],
	prefNoWorkAround: [],
	prefNonLatinWarning: 0,
	prefShowLang: 0,
	prefShowChangesLog: false,
	prefCommand: 0,
	prefCommandLoggedin: 0,
	prefLockIgnoreFirstKey: false,

	locked: false,
	lockDo: true,
	lockIncorrect: 0,
	lockOverlay: null,

	startupPassed: false,
	startupIncorrect: 0,

	quiting: false,
	keysList: null,
	accel: "CONTROL",
	lastKeyDown: [],
	eventKeypress: null,

	STARTUP_DONOTHING: 0,
	STARTUP_QUIT: 1,
	STARTUP_LOCK: 2,

	lockPrefBackup: null,
	storage: {
		persist: {},
	},
	PREF_BRANCH: PREF_BRANCH,
	pref: Cc["@mozilla.org/preferences-service;1"]
				.getService(Ci.nsIPrefService).getBranch(PREF_BRANCH),

//	crypt: Cc["@mozilla.org/security/sdr;1"].getService(Ci.nsISecretDecoderRing),

	timerTime: null,
	timerLockTime: null,

	initialized: false,
	timerFocus: {
		timer: Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),
		init: function(t)
		{
			t = t || "Window";
			this.timer.init({observe: function()
				{
					mapaPlusCore.windowFocus(t);
				}
			}, 100, this.timer.TYPE_ONE_SHOT)
		},
	},

	appInfo: Cc["@mozilla.org/xre/app-info;1"]
					.getService(Ci.nsIXULAppInfo),
	tokenDB: Cc['@mozilla.org/security/pk11tokendb;1']
					.getService(Ci.nsIPK11TokenDB).getInternalKeyToken(),

	timerDelay: 500, //how often current state will be checked (in miliseconds)

	startupShort: 60, //timeout on startup

	status: 0,
	last: 0,
	timeString: "",
	timeLockString: "",

	forced: false,

	observerService: null,

	focused: null,

	style: {},

	strings: {
		days: "d",
		deleteSettings: "Delete all settings?"
	},

	dump: function(){},

	windowAdd: function(win, t)
	{
		t = t || "Window";
		if (!(t in this.window))
		{
			this.windowID[t] = 0;
			this.window[t] = [];
		}
		this.windowID[t]++;
		this.window[t][this.windowID[t]] = win;
//		this.dump(t + " added: " + this.windowID[t])
		return this.windowID[t];
	},

	windowRemove: function(id, t)
	{
		t = t || "Window";
		if (t in this.window)
		{
			this.window[t][id] = null;
//			this.dump(t + " removed: " + id)
		}
	},

	windowUpdate: function(u, f, t)
	{
		t = t || "Window";
		var name = null;
		if (u)
			name = "update";
		else if (this.dialogSuppress)
			name = "blink";
		if (name)
		{
			this.windowAction(name, f, t);
		}
	},

	windowAction: function(subj, data, type)
	{
		let observerSubject = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);

		type = type || "Window";
		observerSubject.data = subj;
//this.dump(subj + " | " + type + " | " + data);
		Cc["@mozilla.org/observer-service;1"]
			.getService(Ci.nsIObserverService)
			.notifyObservers(observerSubject, "mapaPlus" + type, data);
	},

	windowBlinkCancel: function(t)
	{
		t = t || "Window";
		this.dialogSuppress = false;
		this.windowAction("blinkCancel", null, t)
	},

	windowFirst: function(t)
	{
		t = t || "Window";
		if (!(t in this.window))
			return null;

		var w = this.window[t]
		for(var i = 1; i < w.length; i++)
		{
			if (w[i] != null)
			{
				return i;
			}
		}
		return null;
	},

	windowFocus: function(t, first)
	{
		t = t || "Window";
		if (!(t in this.window))
			return false;

		if (typeof(first) == "undefined")
			var first = this.windowFirst(t);

		if (first !== null)
		{
			if ("window" in this.window[t][first])
				this.window[t][first].window.focus();
			else
				this.window[t][first].focus();
		}
	},

	windowFullScreen: function()
	{
		if (!(["Window"] in this.window))
			return false;

		var w = this.window["Window"];
		for(var i = 1; i < w.length; i++)
		{
			if (w[i] != null && w[i].window.fullScreen)
			{
				return true;
			}
		}
		return false;
	},

	windowFocused: function(e)
	{
		if ("openUILinkIn" in e.currentTarget)
			mapaPlusCore.focused = e.currentTarget;
	},

	openUILinkIn: function(url, tab, a, b, c)
	{
		if (this.isTB)
		{
			var messenger = Cc["@mozilla.org/messenger;1"].createInstance();
			messenger = messenger.QueryInterface(Ci.nsIMessenger);
			messenger.launchExternalURL(url);
		}
		else
		{
			tab = tab || "tab";
			a = typeof(a) == "undefined" ? false : a;
			if (this.focused && !this.focused.closed)
				this.focused.openUILinkIn(url, tab, a, b, c);
			else
			{
				var arg = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
				arg.data = url;
				var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
				ww.openWindow(null, "chrome://browser/content/browser.xul", "_blank", "chrome,all,dialog=no", arg);
			}
		}
	},

	/**
	 * Save callbacks to run when unloading. Optionally scope the callback to a
	 * container, e.g., window. Provide a way to run all the callbacks.
	 *
	 * @usage unload(): Run all callbacks and release them.
	 *
	 * @usage unload(callback): Add a callback to run on unload.
	 * @param [function] callback: 0-parameter function to call on unload.
	 * @return [function]: A 0-parameter function that undoes adding the callback.
	 *
	 * @usage unload(callback, container) Add a scoped callback to run on unload.
	 * @param [function] callback: 0-parameter function to call on unload.
	 * @param [node] container: Remove the callback when this container unloads.
	 * @return [function]: A 0-parameter function that undoes adding the callback.
	 */
	unload: function(callback, container) {
		// Initialize the array of unloaders on the first usage
		let unloaders = this.unload.unloaders;
		if (unloaders == null)
			unloaders = this.unload.unloaders = [];

		// Calling with no arguments runs all the unloader callbacks
		if (callback == null) {
			unloaders.slice().forEach(function(unloader){unloader()});
			unloaders.length = 0;
			return;
		}

		// The callback is bound to the lifetime of the container if we have one
		if (container != null) {
			// Remove the unloader when the container unloads
			container.addEventListener("unload", removeUnloader, false);

			// Wrap the callback to additionally remove the unload listener
			let origCallback = callback;
			callback = function() {
				container.removeEventListener("unload", removeUnloader, false);
				origCallback();
			}
		}

		// Wrap the callback in a function that ignores failures
		function unloader() {
			try {
				callback();
			}
			catch(ex) {}
		}
		unloaders.push(unloader);

		// Provide a way to remove the unloader
		function removeUnloader() {
			let index = unloaders.indexOf(unloader);
			if (index != -1)
				unloaders.splice(index, 1);
		}
		return removeUnloader;
	},

	observe: function(aSubject, aTopic, aData)
	{
		if (aTopic == "quit-application")
		{
			mapaPlusCore.unload();
		}
	},

	lock: function(l, m)
	{
		if (this.status || !this.startupPassed)
		{
			l = l || false;
			m = m || false;
			this.locked = true;
			this.prefNoObserve = true;
			this.pref.setBoolPref("locked", true);
			this.prefNoObserve = false;
			this.windowAction("showLock");
			this.dialogShow = false;
			this.prefSuppress = 2;
			if (l)
				this.tokenDB.logoutAndDropAuthenticatedResources();

			this.timerCheck.observe();
			this.windowAction("lock", true, "Dialog");

			if (m && this.prefLockMinimize)
			{
				if (!this.prefLockMinimizeBlur
						|| (this.prefLockMinimizeBlur
								&& !Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher).activeWindow))
				{
					let timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
					timer.init({observe:function()
					{
						let enumerator = Cc["@mozilla.org/appshell/window-mediator;1"]
															.getService(Ci.nsIWindowMediator)
															.getEnumerator(null);

						while(enumerator.hasMoreElements())
						{
							let win = enumerator.getNext();
							if (win.windowState != win.STATE_MINIMIZED)
							{
								win.minimize();
								let timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
								timer.init({observe:function()
								{
//									win.minimize();
								}}, 0, timer.TYPE_ONE_SHOT);
							}
						}

					}}, 101, timer.TYPE_ONE_SHOT);
				}
			}
			if (!this.lockPrefBackup)
			{
				this.lockPrefBackup = [];
				function rp (pref)
				{
					let p = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch(""),
							b = p.getBoolPref(pref);
					function unload(){p.setBoolPref(pref, b)};
					mapaPlusCore.lockPrefBackup.push([unload, mapaPlusCore.unload(unload)]);
					p.setBoolPref(pref, false);
				}
				if (this.isTB)
				{
					if (this.pref.getBoolPref("hidenewmailalert"))
						rp("mail.biff.show_alert");

					if (this.pref.getBoolPref("hidenewmailballoon"))
						rp("mail.biff.show_balloon");
				}
				if (Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getDefaultBranch("extensions.wmn.").getPrefType("showNotification") == Ci.nsIPrefBranch.PREF_BOOL)
				{
					if (this.pref.getBoolPref("hidenewmailalert"))
						rp("extensions.wmn.showNotification");
				}
			}
			return;
		}
	},

	showLock: function(window)
	{
//		this.dump("showlock");
		if (window.locked)
			return;

		if (!window.lockedWindow)
			this.locked = true;
		else
			this.ss.setWindowValue(window, "lockedWindow", window.lockedWindow.toString());

		window.locked = true;
		if (!this.isTB && this.prefLockHideTitle && window.gBrowser)
		{
			window.lockedTitle = window.gBrowser.contentDocument.title;
			window.gBrowser.contentDocument.title = window.document.getElementById("masterPasswordPlusUnLockInfo").value;
		}
		let o = window.document.getElementById("titlebar"); //FF4 with no menubar
		if (o)
		{
			o = o.firstChild.boxObject.height + "px";
			window.document.getElementById("masterPasswordPlusLock").style.top = o;
			window.document.getElementById("masterPasswordPlusLockBox").style.top = o;
			window.document.getElementById("masterPasswordPlusLockBox2").style.top = o;
		}
		window.document.getElementById('masterPasswordPlusLock').hidden = false;
		var n = window.document.getElementsByTagName("window")[0].childNodes;
		for(var i = 0; i < n.length; i++)
		{
			if (n[i].id != "masterPasswordPlusLock" && n[i].id != "titlebar")
			{
				n[i].setAttribute("mapaVisibility", n[i].style.visibility);
				n[i].style.visibility="hidden";
			}
		}
		for(var i = 0; i < window.lockList.length; i++)
		{
			n = window.document.getElementById(window.lockList[i]);
			if (n)
			{
				n.setAttribute("mapaDisplay", n.style.display);
				n.style.display = "none";
			}
		}

		window.document.getElementById('masterPasswordPlusUnLock').focus();
		this.workAround.do("off", window.mapaPlus);
	//	this.core.dump(this.AeroPeek.enabled);
	},

	showUnlock: function(window)
	{
		if (!window.locked)
			return;

		if (window.lockedWindow)
		{
			if (!f && !window.lockedWindowClicked)
				return;

			window.lockedWindowClicked = false;
		}
		else
		{
			this.locked = false;
		}
		try
		{
			window.ss.deleteWindowValue(window, "lockedWindow");
		}catch(e){};

		window.locked = false;
		if (!this.isTB && this.prefLockHideTitle)
		{
			gBrowser.contentDocument.title = window.lockedTitle;
		}
		this.workAround.do("on", window.mapaPlus);
		window.document.getElementById('masterPasswordPlusLock').hidden = true;
		var n = window.document.getElementsByTagName("window")[0].childNodes;
		for(var i = 0; i < n.length; i++)
		{
			if (n[i].hasAttribute("mapaVisibility"))
			{
				n[i].style.visibility = n[i].getAttribute("mapaVisibility");
				n[i].removeAttribute("mapaVisibility");
			}

		}
		for(var i = 0; i < window.lockList.length; i++)
		{
			n = window.document.getElementById(window.mapaPlus.lockList[i]);
			if (n && n.hasAttribute("mapaDisplay"))
			{
				n.style.display = n.getAttribute("mapaDisplay");
				n.removeAttribute("mapaDisplay");
			}
		}
		window.mapaPlus.Win7Features.onOpenWindow(window);

	},

	unlock: function()
	{
		this.locked = false;
		this.windowAction("lock", false, "Dialog");
		this.countdownResetLock();
		this.prefNoObserve = true;
		this.pref.setBoolPref("locked", false);
		this.prefNoObserve = false;
		this.prefSuppress = this.pref.getIntPref("suppress");
		this.windowAction("showUnlock");
		if (this.lockPrefBackup)
		{
			this.lockPrefBackup.forEach(function(data)
			{
				data[0]();
				data[1]();
			});
			this.lockPrefBackup = null;
		}
	},

	suppressed: function()
	{
		if (this.locked)
			return;

		this.dialogSuppress = true;
		this.dialogSuppressTimer = this.prefSuppressTimer*2+2;
	},

	countdownReset: function()
	{
		var time = (this.forced ? this.forced : this.prefLogoutTimeout);
		time = new Date((parseInt((new Date().getTime()/1000))+time) * 1000);
		this.timerTime = time;
	},

	countdownResetLock: function()
	{
		var time = this.pref.getIntPref("locktimeout");
		time = new Date((parseInt((new Date().getTime()/1000))+time) * 1000) ;
		this.timerLockTime = time;
	},

	resetTimer: function(e)
	{
		if (mapaPlusCore.prefLogoutInactivity && !mapaPlusCore.forced)
			mapaPlusCore.countdownReset();

		if (mapaPlusCore.prefLockInactivity)
			mapaPlusCore.countdownResetLock();
	},

	timerToString: function(t, time)
	{
		var difference = t - time + 1000;
		if (!t || difference < 0)
			return "";

		var milliseconds = Math.floor( difference % 1000);
		difference = difference / 1000;
		var seconds = Math.floor( difference % 60 );
		difference = difference / 60;
		var minutes = Math.floor( difference % 60 );
		difference = difference / 60;
		var hours = Math.floor( difference % 24 );
		difference = difference / 24;
		var days = Math.floor( difference );
		var r = (hours > 9 ? "" : "0") + hours + ":" + (minutes > 9 ? "" : "0") + minutes + ":" + (seconds > 9 ? "" : "0") + seconds;
//		mapaPlusCore.dump(r);
		return r;
	},

	timerCheck: {
		timer: Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),
		init: function()
		{
			mapaPlusCore.countdownReset();
			mapaPlusCore.countdownResetLock();
			this.timer.cancel();
			if (mapaPlusCore.status)
				this.timer.init(this, mapaPlusCore.timerDelay, this.timer.TYPE_REPEATING_SLACK);

			this.observe();
		},
		observe: function()
		{
			mapaPlusCore.timerCheckObserver();
		}
	},


	timerCheckObserver: function()
	{
		var time = new Date();
		if(this.tokenDB.needsLogin())
		{
			var locked = this.locked;
			if (this.prefLockTimer)
			{
				if (!locked && this.timerLockTime && time.getTime() >= this.timerLockTime.getTime())
				{
					this.status = 1;
//this.dump("locked done");
					this.locked = true;
					locked = true;
					this.lock(this.prefLockLogout, true);
					this.lockDo = true;
				}
				else
				{
					this.timeLockString = this.timerToString(this.timerLockTime, time);
				}
			}
			if (this.tokenDB.isLoggedIn())
			{
				if (this.last != 1)
				{
					this.countdownReset();
					this.countdownResetLock();
					this.windowBlinkCancel();
					this.windowAction("suppressedPopupRemove");
				}
				var l = true;
				if ((this.prefLogoutTimer || this.forced) && this.timerTime && time.getTime() >= this.timerTime.getTime())
				{
					this.tokenDB.logoutAndDropAuthenticatedResources();
					this.status = 2;
					if (this.prefSuppress != 2 && !this.prefSuppressTemp)
						this.dialogShow = true;

					l = false;
				}
				else
				{
					this.status = 1;
					this.timeString = this.timerToString(this.timerTime, time);
				}
				if (this.last != this.status)
				{
					this.windowUpdate(true);
					if (!locked)
						this.windowAction("showUnlock");
				}
				if (l)
					this.last = this.status;
			}
			else
			{
				this.status = 2;

				if (this.forced)
				{
					this.forced = false;
				}
				if (this.dialogSuppress || this.last != this.status)
				{
					this.dialogSuppressTimer--;
					if (this.locked || !this.dialogSuppress || (this.dialogSuppressTimer < 2 && this.prefSuppressTimer))
					{
						this.windowBlinkCancel();
					}
					else
					{
						this.suppressedIcon = this.prefSuppressBlink ? Boolean(this.dialogSuppressTimer%2) : true;
					}
					this.windowUpdate(this.last != this.status);
				}
				else if (!this.dialogSuppress && this.suppressedIcon)
				{
					this.windowBlinkCancel();
				}

				this.last = this.status;
			}
		}
		else
		{
			this.timerCheck.timer.cancel();
			this.status = 0;
			if (this.last != this.status)
			{
				this.windowBlinkCancel();
				this.windowUpdate(true);
			}
			this.last = this.status;
		}
	},

	suppressTemp: {
		timer: Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),
		start: function()
		{
			mapaPlusCore.dialogShow = false;
			this.timer.init(this, mapaPlusCore.prefSuppressTemp*60000, this.timer.TYPE_ONE_SHOT);
		},

		stop: function()
		{
			this.timer.cancel();
			this.observe();
		},

		observe: function()
		{
			mapaPlusCore.prefSuppressTemp = false;
		}
	},

	suppressedSound: function()
	{
		var sound = Cc["@mozilla.org/sound;1"]
								.createInstance(Ci.nsISound);
		try
		{
			sound.init();
			sound.play(Cc["@mozilla.org/network/io-service;1"]
									.getService(Ci.nsIIOService)
									.newURI("chrome://mapaplus/skin/pop.wav", null, null));
		}
		catch(e)
		{
			try{sound.beep()}catch(e){this.dump(e)}
		}
	},

	workAround: {
		init: function(mapaPlus, f)
		{
			for(var i in this.list)
				this.list[i].init(mapaPlus, f);
		},

		do: function(c, mapaPlus)
		{
			var w = mapaPlusCore.prefNoWorkAround;
			for(var i in this.list)
				if (typeof this.list[i].obj != "undefined" && this.list[i].obj == i && w.indexOf(i) == -1 && typeof this.list[i][c] == "function")
					this.list[i][c](mapaPlus);
		},

		list: {
			AeroBuddy: {
				obj: "AeroBuddy", //some basic protection
				_glass: null,
				_initialized: false,
				_pref: null,
				init: function(mapaPlus, first)
				{
					if (!this._initialized)
					{
						this._initialized = true;
						this._pref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.AeroBuddy.");
					}
					try
					{
						let g = this._pref.getBoolPref("glass");
					}
					catch(e){return;}
					try
					{
						var s = mapaPlus.ss.getWindowValue(mapaPlus.window, "AeroBuddy");
						if (s === "")
							return;

						if (first)
							this._pref.setBoolPref("glass", s == "true")

					}catch(e){};
				},//workAround.list.AeroBuddy.init()

				off: function(mapaPlus)
				{
					var w = mapaPlusCore.window["Window"];
					let l = 0;
					for(let i = 1; i < w.length; i++)
						if (w[i] != null && w[i].locked)
							l++;

					if (l > 1 || this._glass !== null)
						return;
					try
					{
						let v = this._pref.getBoolPref("glass");
						this._glass = v;
						mapaPlus.ss.setWindowValue(mapaPlus.window, "AeroBuddy", v.toString());
						this._pref.setBoolPref("glass", false);
					}
					catch(e){};
				},//workAround.list.AeroBuddy.off()

				on: function(mapaPlus)
				{
					var w = mapaPlusCore.window["Window"];
					let l = 0;
					for(let i = 1; i < w.length; i++)
						if (w[i] != null && w[i].locked)
							l++;

					if (l > 0 || this._glass === null)
						return;

					try
					{
						let v = this._pref.getBoolPref("glass");
						if (!v && this._glass)
							this._pref.setBoolPref("glass", this._glass);

						this._glass = null;
						mapaPlus.ss.deleteWindowValue(mapaPlus.window, "AeroBuddy");
					}
					catch(e){};
				}//workAround.list.AeroBuddy.on()
			},//workAround.list.AeroBuddy{}
		}//workAround.list{}
	},//workAround{}

	matchKeys: function(k, l, len)
	{
//		return (k.toString().toUpperCase() == l.toString().toUpperCase());

		if (k.length != l.length || (len && k.length < len))
			return false;

		for(var i = 0; i < l.length; i++)
		{
			if (k.indexOf(this.getAccel(l[i])) == -1)
			{
				return false;
			}
		}
//this.dump("\n" + k + "\n" + l + "\n-----");
		return true;
	},

	getKeys: function(e)
	{
		var keys = [];
		var keycode = this.getAccel(this.keysList[e.keyCode]);
		if(e.ctrlKey) keys.push(this.getAccel("CONTROL"));
		if(e.altKey) keys.push(this.getAccel("ALT"));
		if(e.metaKey) keys.push(this.getAccel("META"));
		if(e.shiftKey) keys.push(this.getAccel("SHIFT"));

		var modifiers = keys.slice();
		if (keys.indexOf(keycode) == -1)
			keys.push(keycode);
		return [keys, [modifiers, keycode]];
	},

	getAccel: function(a)
	{
		return this.accel == a ? "ACCEL" : a;
	},

	prepareHotkey: function()
	{
		this.prefLogoutHotkeyEnabled = this.pref.getIntPref("logouthotkeyenabled");
		this.prefLockHotkeyEnabled = this.pref.getIntPref("lockhotkeyenabled");
		this.prefLockWinHotkeyEnabled = this.pref.getIntPref("lockwinhotkeyenabled");
		this.prefLockLogoutHotkeyEnabled = this.pref.getIntPref("locklogouthotkeyenabled");
		this.prefLogoutHotkey = this.pref.getCharPref("logouthotkey").split(" ");
		this.prefLockHotkey = this.pref.getCharPref("lockhotkey").split(" ");
		this.prefLockWinHotkey = this.pref.getCharPref("lockwinhotkey").split(" ");
		this.prefLockLogoutHotkey = this.pref.getCharPref("locklogouthotkey").split(" ");
		this.windowAction("hotkeyInit");
	},

	onPrefChange: {
		observe: function(subject, topic, key)
		{
			this.do();
		},
		do: function(mapaPlus)
		{
			var mpc = mapaPlusCore;
			if (mpc.prefNoObserve)
				return;

			mapaPlus = mapaPlus || null;

			mpc.prefLogoutTimeout = mpc.pref.getIntPref("logouttimeout");
			mpc.prefLogoutInactivity = mpc.pref.getBoolPref("logoutinactivity");
			mpc.prefLogoutOnMinimize = mpc.pref.getBoolPref("logoutonminimize");

			mpc.prefSuppress = mpc.pref.getIntPref("suppress");
			mpc.prefSuppressTimer = mpc.pref.getIntPref("suppresstimer");
			mpc.prefSuppressBlink = mpc.pref.getBoolPref("suppressblink");
			mpc.prefSuppressSound = mpc.pref.getBoolPref("suppresssound");
			mpc.prefSuppressPopup = mpc.pref.getBoolPref("suppresspopup");
			mpc.prefSuppressFocus = mpc.pref.getBoolPref("suppressfocus");
			mpc.prefSuppressPopupRemove = mpc.pref.getIntPref("suppresspopupremove");

			mpc.prefLockInactivity = mpc.pref.getBoolPref("lockinactivity");
			mpc.prefLockHideTitle = mpc.pref.getBoolPref("lockhidetitle");
			mpc.prefLockMinimize = mpc.pref.getBoolPref("lockminimize");
			mpc.prefLockMinimizeBlur = mpc.pref.getBoolPref("lockminimizeblur");
			mpc.prefLockTimeout = mpc.pref.getIntPref("locktimeout");
			mpc.prefLockOnMinimize = mpc.pref.getIntPref("lockonminimize");
			if (mpc.prefLockTimeout < 10)
				mpc.pref.setIntPref("locktimeout", 10);

			mpc.timerCheck.init();

			mpc.prefLogoutTimer = mpc.pref.getBoolPref("logouttimer");
			mpc.prefLockTimer = mpc.pref.getBoolPref("locktimer");
			mpc.prefLockIncorrect = mpc.pref.getIntPref("lockincorrect");

			mpc.prefNonLatinWarning = mpc.pref.getIntPref("nonlatinwarning");
			mpc.prefShowLang = mpc.KB ? mpc.pref.getIntPref("showlang") : 0;
			mpc.prefNoWorkAround = mpc.pref.getCharPref("noworkaround").split(",");

			mpc.prefShowChangesLog = mpc.pref.getIntPref("showchangeslog");

			mpc.prefCommand = mpc.pref.getIntPref("command");
			mpc.prefCommandLoggedin = mpc.pref.getBoolPref("commandloggedin");

			mpc.prefLockIgnoreFirstKey = mpc.pref.getBoolPref("lockignorefirstkey");
			mpc.prepareHotkey();
			mpc.windowAction("lockSetTransparent", mpc.pref.getBoolPref("locktransparent"));
			mpc.windowAction("lockSetBgImage", mpc.pref.getBoolPref("lockbgimage"));

			try
			{
				mpc.prefForcePrompt = JSON.parse(mpc.pref.getComplexValue("forceprompt", Components.interfaces.nsISupportsString).data);
			}
			catch(e)
			{
				mpc.prefForcePrompt = [];
			}
			let id = mapaPlus && mapaPlus.windowID ? mapaPlus.windowID : 0;
			mpc.windowAction("hotkeyInit", id, "Dialog");
			mpc.windowAction("show", "", "Window");

		}
	},


	prompt: function(f)
	{
		this.dialogBackup = {
			dialogOptions: this.dialogOptions,
			dialogTemp: this.dialogTemp,
			dialogShow: this.dialogShow,
		};
		let r = false
		if (f)
			this.tokenDB.logoutAndDropAuthenticatedResources();

		try
		{
			this.dialogShow = true;
			this.dialogTemp = false;
			this.dialogForce = true;
			this.dialogOptions = false;
			this.tokenDB.login(false);
			r = true;
		}
		catch(e){}
		return r;
	},

	command: function()
	{
		this.dialogShow = false;

		this.windowBlinkCancel();

		if (this.status == 1)
		{
			this.lockDo = false;
			this.tokenDB.logoutAndDropAuthenticatedResources();
			this.timerCheck.observe();
			if (this.prefSuppress != 2 && !this.prefSuppressTemp)
				this.dialogShow = true;
		}
		else
		{
			this.windowAction("login", "", "Window");
		}
		this.dialogTemp = true;
		this.timerCheck.observe();
	},

	hotkeyDown: function(e)
	{
		if ("hasAttribute" in e.target && e.target.hasAttribute("hotkey"))
			return true;

		if ("mapaPlus" in e.currentTarget && e.currentTarget.mapaPlus.windowType == "window" && "hotkeyDown" in e.currentTarget.mapaPlus)
			return e.currentTarget.mapaPlus.hotkeyDown(e);

		return true;
/*
		var keys = mapaPlusCore.getKeys(e);
		if (mapaPlusCore.matchKeys(mapaPlusCore.lastKeyDown, keys[0], 2)) //prevent repeats
			return true;

		mapaPlusCore.lastKeyDown = keys[0];
		var r = true;
		if (mapaPlusCore.matchKeys(keys[0], mapaPlusCore.prefLockHotkey, 2))
		{
			if (!mapaPlusCore.prefLockHotkeyEnabled)
				return r;

			r = false;
			e.preventDefault();
			e.stopPropagation();
			mapaPlusCore.lock();
		}
		else if (mapaPlusCore.matchKeys(keys[0], mapaPlusCore.prefLogoutHotkey, 2))
		{
			if (!mapaPlusCore.prefLogoutHotkeyEnabled)
				return r;

			r = false;
			e.preventDefault();
			e.stopPropagation();
			mapaPlusCore.command();
		}
		else if (mapaPlusCore.matchKeys(keys[0], mapaPlusCore.prefLockLogoutHotkey, 2))
		{
			if (!mapaPlusCore.prefLockLogoutHotkeyEnabled)
				return r;

			r = false;
			e.preventDefault();
			e.stopPropagation();
			mapaPlusCore.windowAction("lockLogout", "", "Window");
		}
		return r;
	//	mpc.dump("down: " + keys[0] + "\n" + mapaPlus.lastKeyDown);
*/
	},

	hotkeyPress: function(e)
	{
		if ("mapaPlus" in e.currentTarget && e.currentTarget.mapaPlus.windowType == "window" && "hotkeyPress" in e.currentTarget.mapaPlus)
			return e.currentTarget.mapaPlus.hotkeyPress(e);

	//	mpc.dump("down: " + keys[0] + "\n" + mapaPlus.lastKeyDown);
	},

	hotkeyUp: function(e)
	{
//		var keys = mapaPlusCore.getKeys(e);
		mapaPlusCore.lastKeyDown = [];

		if ("mapaPlus" in e.currentTarget && e.currentTarget.mapaPlus.windowType == "window" && "hotkeyUp" in e.currentTarget.mapaPlus)
			return e.currentTarget.mapaPlus.hotkeyUp(e);

		return true;
	//	mapaPlus.core.dump("up: " + keys[0]);
	},

	windowListener: {
		observe: function(aSubject, aTopic, aData)
		{
			let window = aSubject.QueryInterface(Components.interfaces.nsIDOMWindow),
					windowClose = false;
			if (aTopic == "domwindowopened")
			{
/*
let timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
timer.init({observe: function(e)
{
	mapaPlusCore.dump(window.location);
	if (window.location.toString().match("common"))
	{
//		window.close();
	}

	if (!window.location.toString().match("about:blank"))
	{
		timer.cancel();
		mapaPlusCore.dump(window.arguments, 2);
	}

}}, 0, timer.TYPE_REPEATING_SLACK);
//mapaPlusCore.dump(window,2);
//mapaPlusCore.dump(mapaPlusCore.dump.cache, 1);
*/
				if ("mapaPlus" in window && !window.mapaPlus.noOverlayLoaded)
				{
					if (window.mapaPlus.close)
						window.addEventListener("close", window.mapaPlus.close, true);

					if (window.mapaPlus.mouseDown)
						window.addEventListener("mousedown", window.mapaPlus.mouseDown, true);
					window.mapaPlusEventsAdded = true;
				}
				window.addEventListener("keydown", mapaPlusCore.hotkeyDown, true);
				window.addEventListener("keypress", mapaPlusCore.hotkeyPress, true);
				window.addEventListener("keyup", mapaPlusCore.hotkeyUp, true);
				window.addEventListener("mousemove", mapaPlusCore.resetTimer, false);
				window.addEventListener("keydown", mapaPlusCore.resetTimer, false);
				window.addEventListener("mousedown", mapaPlusCore.resetTimer, false);
				window.addEventListener("DOMMouseScroll", mapaPlusCore.resetTimer, false);
				window.addEventListener("focus", mapaPlusCore.windowFocused, true);
				window.addEventListener("load", function(event)
				{
					if (!("mapaPlus" in window) || window.mapaPlus.noOverlayLoaded)
					{
						let list = mapaPlusCore.prefForcePrompt;
						for(let i = 0; i < list.length; i++)
						{
							if (!("enabled" in list[i])
									|| (!("id" in list[i] && window.name && list[i].id == window.name)
											&& !("url" in list[i] && window.location.href == list[i].url)))
								continue;
							let param = "";
							if ("param" in list[i])
							{
								param = list[i].param.split("|");
							}
							let isParam = function(name)
							{
								return param.indexOf(name) != -1;
							}
							if ((mapaPlusCore.status == 2
									&& (mapaPlusCore.prefSuppress == 2
											|| mapaPlusCore.prefSuppressTemp
											|| (isParam("startup") && !mapaPlusCore.startupPassed)))
									|| isParam("always"))
							{
								let f = mapaPlusCore.dialogForce, t = mapaPlusCore.dialogTemp, ok = false;
								mapaPlusCore.dialogForce = true;
//									mapaPlusCore.dialogTemp = false;
								try
								{
									mapaPlusCore.tokenDB.login(isParam("always"));
									ok = true;
								}catch(e){}
								mapaPlusCore.dialogForce = f;
//									mapaPlusCore.dialogTemp = t;
								if (!ok && isParam("close"))
								{
									windowClose = true;
								}
							}
							break;
						}
						if (!windowClose)
						{
							window.document.documentElement.ownerDocument.loadOverlay("chrome://mapaplus/content/masterpasswordplusOverlay.xul", {observe: function(e)
							{
								window.mapaPlus = window.mapaPlus || {};
								window.mapaPlus.noOverlayLoaded = true;
								let timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
								timer.init({observe:function()
								{
									window.mapaPlus.loadedManualy = true;
									try
									{
										window.mapaPlus.load();
									}catch(e){};
									if ("mapaPlus" in window && (!("mapaPlusEventsAdded" in window) || !window.mapaPlusEventsAdded))
									{
										if (window.mapaPlus.close)
											window.addEventListener("close", window.mapaPlus.close, true);

										if (window.mapaPlus.mouseDown)
											window.addEventListener("mousedown", window.mapaPlus.mouseDown, true);
										window.mapaPlusEventsAdded = true;
									}
								}}, 100, timer.TYPE_ONE_SHOT);
							}});
						}
					}
					if (!windowClose && "mapaPlus" in window && (!("mapaPlusEventsAdded" in window) || !window.mapaPlusEventsAdded))
					{
						if (window.mapaPlus.close)
							window.addEventListener("close", window.mapaPlus.close, true);

						if (window.mapaPlus.mouseDown)
							window.addEventListener("mousedown", window.mapaPlus.mouseDown, true);
					}
					window.removeEventListener("load", arguments.callee, true);
					if (windowClose)
						window.close();

				}, true); //addEventListener("load")
			}
			else if (aTopic == "domwindowclosed")
			{
				if ("mapaPlus" in window)
				{
					window.removeEventListener("close", window.mapaPlus.close, true);
					window.removeEventListener("mousedown", window.mapaPlus.mouseDown, true);
				}
				window.removeEventListener("keydown", mapaPlusCore.hotkeyDown, true);
				window.removeEventListener("keypress", mapaPlusCore.hotkeyPress, true);
				window.removeEventListener("keyup", mapaPlusCore.hotkeyUp, true);
				window.removeEventListener("mousemove", mapaPlusCore.resetTimer, false);
				window.removeEventListener("keydown", mapaPlusCore.resetTimer, false);
				window.removeEventListener("mousedown", mapaPlusCore.resetTimer, false);
				window.removeEventListener("DOMMouseScroll", mapaPlusCore.resetTimer, false);
				window.removeEventListener("focus", mapaPlusCore.windowFocused, true);
			}
		},//windowListener.observe()
	},//windowListener

	quit: function()
	{
		this.quiting = true;
		try
		{
			Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup).quit(Ci.nsIAppStartup.eForceQuit);
		}
		catch(e)
		{
			Cc["@mozilla.org/embedcomp/prompt-service;1"]
				.getService(Ci.nsIPromptService).alert(null, "Master Password+", "You should not see this!\n\n" + e);
		}
	},

	deleteSettings: function()
	{
		let prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
								.getService(Ci.nsIPromptService),
				flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
								prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;
		let button = prompts.confirmEx(null, mapaPlusCore.addon.name, mapaPlusCore.strings.deleteSettings.replace("#", mapaPlusCore.addon.name), flags, "", "", "", null, {});
		if (!button)
		{
			try
			{
				mapaPlusCore.pref.resetBranch('');
			}
			catch(e)
			{
				let list = mapaPlusCore.pref.getChildList('', {});
				for(let i = 0; i < list.length; i++)
					mapaPlusCore.pref.clearUserPref(list[i]);
			}
		}
	},

	init: function(f, mapaPlus)
	{
		f = f || false;
		if (!this.initialized)
		{
			try
			{
				this.pref.QueryInterface(Ci.nsIPrefBranch).addObserver('', this.onPrefChange, false);
			}
			catch(e)
			{
				this.pref.QueryInterface(Ci.nsIPrefBranch2).addObserver('', this.onPrefChange, false);
			}
		}
		this.onPrefChange.do(mapaPlus);
		if (f || !this.initialized)
		{
			this.initialized = true;
			this.timerCheck.init();
			this.suppressTemp.stop();
			this.dialogTemp = true;
		}
	},

	async: function(callback, time, timer)
	{
		if (timer)
			timer.cancel();
		else
			timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

		timer.init({observe:function()
		{
			callback();
		}}, time || 0, timer.TYPE_ONE_SHOT);
		return timer;
	},//async()

}//mapaPlusCore

function include(path)
{
	Services.scriptloader.loadSubScript(mapaPlusCore.addon.getResourceURI(path).spec, self);
}
var __dumpName__ = "_dump";

Services.scriptloader.loadSubScript("chrome://mapaplus/content/dump.js");
mapaPlusCore.log = _dump;
mapaPlusCore.dump = _dump;
var log = _dump;
log.folder = "";
log.title = "CM+";
log.showCaller = 3;
AddonManager.getAddonByID(mapaPlusCore.GUID, function(addon)
{
	mapaPlusCore.addon = addon;
	include("chrome/content/constants.js");
	mapaPlusCore.EMAIL = EMAIL;
	mapaPlusCore.HOMEPAGE = HOMEPAGE;
	mapaPlusCore.SUPPORTSITE = SUPPORTSITE;
	mapaPlusCore.ISSUESSITE = ISSUESSITE;
	mapaPlusCore.ADDONDOMAIN = ADDONDOMAIN;
//	mapaPlusCore.isTB = (mapaPlusCore.appInfo.ID == "{3550f703-e582-4d05-9a08-453d09bdfdc6}");
	mapaPlusCore.isTB = (mapaPlusCore.appInfo.ID == "{3550f703-e582-4d05-9a08-453d09bdfdc6}" || mapaPlusCore.appInfo.ID == "postbox@postbox-inc.com");
	mapaPlusCore.isGecko2 = Cc["@mozilla.org/xpcom/version-comparator;1"]
													.getService(Ci.nsIVersionComparator)
													.compare(mapaPlusCore.appInfo.version, (mapaPlusCore.isTB ? "3.3" : "4.0")) >= 0
	
	mapaPlusCore.isFF4 = (!mapaPlusCore.isTB && mapaPlusCore.isGecko2);
	
	mapaPlusCore.KB = null;
	let a = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime);
	if (a.OS == "WINNT" && mapaPlusCore.isGecko2)
	{
		//keyboard language code borrowed from TabLang addon: https://addons.mozilla.org/addon/tablang/
		(mapaPlusCore.KB = {
			GetKeyboardLayout: null,
			GetLocaleInfoW: null,
			init: function()
			{
				Components.utils.import("resource://gre/modules/ctypes.jsm", this);
				let ctypes = this.ctypes;
				let abi = a.XPCOMABI.indexOf("x86_64") == -1 ? ctypes.winapi_abi : ctypes.default_abi;
				this.GetKeyboardLayout = ctypes.open("user32.dll").declare("GetKeyboardLayout", abi, ctypes.uintptr_t, ctypes.uint32_t);
				this.GetLocaleInfoW = ctypes.open("kernel32.dll").declare("GetLocaleInfoW", abi, ctypes.int32_t, ctypes.uint32_t, ctypes.uint32_t, ctypes.jschar.ptr, ctypes.int32_t);
			},
			getLangNameAbr: function()
			{
				try
				{
					let ctypes = this.ctypes;
					let lcid = ctypes.UInt64.lo(ctypes.UInt64("0x" + this.GetKeyboardLayout(0).toString(16))) & 0xFFFF;
					let bufferLength = this.GetLocaleInfoW(lcid, 89, ctypes.jschar.ptr(0), 0);
					if (bufferLength == 0)
						return;
	
					let buffer = ctypes.jschar.array(bufferLength)();
					if (this.GetLocaleInfoW(lcid, 89, ctypes.cast(buffer.address(), ctypes.jschar.ptr), bufferLength) != 0)
						return buffer.readString();
				}
				catch(e){};
			}
		}).init();
	}
	else
	{
		mapaPlusCore.pref.setIntPref("showlang", 0);
	}
});
//ask for master password on startup
(mapaPlusCore.startupPass = function()
{

	mapaPlusCore.status = mapaPlusCore.tokenDB.needsLogin() ? 1 : 0;
	if (mapaPlusCore.pref.getBoolPref("startup"))
	{
		let timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
		try
		{
			mapaPlusCore.dialogShow = true;
			mapaPlusCore.dialogTemp = false;
			mapaPlusCore.dialogForce = false;
			mapaPlusCore.prefNonLatinWarning = mapaPlusCore.pref.getIntPref("nonlatinwarning");
			mapaPlusCore.prefShowLang = mapaPlusCore.KB ? mapaPlusCore.pref.getIntPref("showlang") : 0;
			mapaPlusCore.tokenDB.login(false);
			mapaPlusCore.locked = false;
			mapaPlusCore.startupPassed = true;
			if (mapaPlusCore.pref.getBoolPref("startupshort"))
			{
				var timeout = mapaPlusCore.pref.getIntPref("startuptimeout");
				if (timeout)
					mapaPlusCore.forced = timeout;
				else
					mapaPlusCore.tokenDB.logoutAndDropAuthenticatedResources();
			}
		}
		catch(e)
		{
			let i = mapaPlusCore.pref.getIntPref("startupincorrect");
			var sf = mapaPlusCore.pref.getIntPref("startupfail");
			if ((i && mapaPlusCore.startupIncorrect >= i) || (sf == mapaPlusCore.STARTUP_QUIT && !mapaPlusCore.startupPassed))
			{
				mapaPlusCore.quit();
				return;
			}
			else
			{
				if (sf == mapaPlusCore.STARTUP_LOCK && !mapaPlusCore.startupPassed)
					mapaPlusCore.lock();

				mapaPlusCore.startupPassed = true;
			}
		}
	}
	else
	{
		mapaPlusCore.startupPassed = true;
	}
})();

mapaPlusCore.dialogTemp = true;
mapaPlusCore.dialogForce = false;
mapaPlusCore.dialogShow = false;
mapaPlusCore.observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).addObserver(mapaPlusCore, "quit-application", false);

let listener = {
	onUninstalling: function(addon)
	{
		if (addon.id == "masterpasswordtimeoutplus@vano")
		{
			if (!mapaPlusCore.prompt(true))
				addon.cancelUninstall();
			else
				mapaPlusCore.deleteSettings();
		}
	},
	onDisabling: function(addon, restart)
	{
		if (addon.id == "masterpasswordtimeoutplus@vano")
		{
			if (!mapaPlusCore.prompt(true))
				addon.userDisabled = false;
		}
	}
}
AddonManager.addAddonListener(listener);

Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher)
	.registerNotification(mapaPlusCore.windowListener);

