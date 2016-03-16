mapaPlus.window = window;
mapaPlus.windowID = 0;
mapaPlus.windowType = "Dialog";
mapaPlus.pass = false;
mapaPlus.accepted = false;
mapaPlus.dialogOptions = mapaPlus.core.dialogOptions;
mapaPlus.dialogTemp = mapaPlus.core.dialogTemp;
mapaPlus.dialogBackup = {};
mapaPlus.loaded = false;
mapaPlus.gecko4 = false;
mapaPlus.titleOriginal = "";
mapaPlus.titleSuffix = "";
mapaPlus.mainWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"]
												.getService(Components.interfaces.nsIWindowMediator)
												.getMostRecentWindow((mapaPlus.core.isTB ? "mail:3pane" : "navigator:browser"));

mapaPlus._commonDialogOnLoad = commonDialogOnLoad;
commonDialogOnLoad = function(){};
mapaPlus._commonDialogOnUnload = commonDialogOnUnload;
commonDialogOnUnload = function(){};

mapaPlus.check = function ()
{
	let string;
	try
	{
		var propBag = window.arguments[0].QueryInterface(Ci.nsIWritablePropertyBag2)
										.QueryInterface(Ci.nsIWritablePropertyBag);
		let propEnum = propBag.enumerator;
		while (propEnum.hasMoreElements())
		{
			let prop = propEnum.getNext().QueryInterface(Ci.nsIProperty);
			if (prop.name == "text")
				string = prop.value;

			if (prop.name == "promptType" && prop.value == "promptPassword")
			{
				this.pass = true;
				break;
			}
		}
	}
	catch(e)
	{
		this.pass = gCommonDialogParam && (gCommonDialogParam.GetInt(3) == 1 && gCommonDialogParam.GetInt(4) == 1);
		this.gecko4 = true;
		string = gCommonDialogParam.GetString(0);
	}
//double check if it's the master password and not generic password prompt
	if (this.pass)
	{
		let modules = Components.classes["@mozilla.org/security/pkcs11moduledb;1"]
									.getService(Components.interfaces.nsIPKCS11ModuleDB).listModules(),
				slotnames = [],
				match = false,
				text = Components.classes["@mozilla.org/intl/stringbundle;1"].getService()
								.QueryInterface(Components.interfaces.nsIStringBundleService)
								.createBundle("chrome://pipnss/locale/pipnss.properties")
								.GetStringFromName("CertPassPrompt");
		try
		{
			let modulesMore = true,
					slotsMore = true;
			while(modulesMore)
			{
				let module = modules.currentItem().QueryInterface(Components.interfaces.nsIPKCS11Module);
				if (module)
				{
					let slots = module.listSlots();
					try
					{
						while(slotsMore)
						{
							let slot = null;
							try
							{
								slot = slots.currentItem().QueryInterface(Components.interfaces.nsIPKCS11Slot);
							}
							catch(e){}
							if (slot != null)
							{
								slotnames.push(slot.tokenName);
								slotnames.push(slot.name);
								try
								{
									slots.next();
								}
								catch(e)
								{
									slotsMore = false;
								}
							}
						}
					}
					catch(e){}
				}
				try
				{
					modules.next();
				}
				catch(e)
				{
					modulesMore = false;
				}
			}
		}
		catch(e){}
		if (text)
		{
			for(let i = 0; i < slotnames.length; i++)
			{
				if (string == text.replace("%S", slotnames[i]))
				{
					match = true;
					break;
				}
			}
		}
		if (!match)
			this.pass = false;
	}
	if (this.pass && (this.core.status != 1 || this.core.locked || !this.core.startupPassed))
	{
		var first = this.core.windowFirst(this.windowType);
		this.windowID = this.core.windowAdd(mapaPlus, this.windowType);
		if (!this.core.dialogForce)
		{
//this.dump([first, this.core.locked, this.core.prefSuppress, this.core.prefSuppressTemp, this.core.dialogShow, (this.core.isFF4 && !this.core.prefSuppress && !this.core.prefSuppressTemp)]);
			if (this.core.locked || this.core.prefSuppress || this.core.prefSuppressTemp || this.core.dialogShow || (this.core.isFF4 && !this.core.prefSuppress && !this.core.prefSuppressTemp))
			{
				if (first)
				{
					if (this.core.startupPassed)
					{
						if ("mapaPlus" in this.mainWindow && this.mainWindow.mapaPlus && this.mainWindow.mapaPlus.suppressed)
							this.mainWindow.mapaPlus.suppressed();

						this.core.dialogShow = false;
						this.core.suppressed();
						if (this.core.prefSuppressFocus || this.core.suppressedFocusForce)
						{
							this.core.suppressedFocusForce = false;
							this.core.timerFocus.init(this.windowType);
						}
/*
						if (this.core.isFF4 && this.core.prefNoWorkAround.indexOf("FF4") == -1)
							window.focus();
*/
						if (this.core.isFF4 && this.core.prefNoWorkAround.indexOf("FF4") == -1)
						{
//FF4 mouse wheel scroll bug workaround. Thanks to Infocatcher for this snippet!
							var o = window.opener;
							if (o && o.gURLBar)
								window.opener.setTimeout(function(o)
								{
									o.gURLBar.focus();
									o.content.focus();
								}, 0, o);
							else
								window.focus();
						}
					}
					if (this.core.isTB && this.gecko4)
						gCommonDialogParam.SetInt(0, 1);

					this.core.windowAction("suppressed", "", this.windowType);
					this.quit();
					return;
				}
			}
//this.dump(!this.core.dialogShow + " | " +  (this.core.prefSuppress == 2 || this.core.prefSuppressTemp) + " | " + this.core.prefSuppress + " | " + this.core.prefSuppressTemp);
			if (!this.core.dialogShow && (this.core.prefSuppress == 2 || this.core.prefSuppressTemp))
			{
				if ("mapaPlus" in this.mainWindow && this.mainWindow.mapaPlus && this.mainWindow.mapaPlus.suppressed)
					this.mainWindow.mapaPlus.suppressed();

				this.core.dialogShow = false;
				this.core.suppressed();
				if (this.core.isFF4 && this.core.prefNoWorkAround.indexOf("FF4") == -1)
				{
//FF4 mouse wheel scroll bug workaround. Thanks to Infocatcher for this snippet!
					var o = window.opener;
					if (o && o.gURLBar)
						window.opener.setTimeout(function(o)
						{
							o.gURLBar.focus();
							o.content.focus();
						}, 0, o);
					else
						window.focus();
				}
				if (this.core.isTB && this.gecko4)
					gCommonDialogParam.SetInt(0, 1);

				this.core.windowAction("suppressed", "", this.windowType);
				this.quit();
				return;
			}
		}
	}
	if (this.core.startupPassed)
	{
		for(var i in this.core.dialogBackup)
		{
			this.dialogBackup[i] = this.core[i];
			this.core[i] = this.core.dialogBackup[i];
		}
		this.dialogBackup.dialogForce = this.core.dialogForce;
		this.core.dialogForce = false;
		this.core.dialogBackup = {};
		this.core.dialogOptions = true;
		this.core.dialogTemp = true;
	}
//	this.core.dialogSuppress = false;
//	this.core.suppressTemp.stop();
	return;
}
/*

mapaPlus.load = function()
{
	if (!mapaPlus.pass)
		return;

	let t = mapaPlus.core.pref.getCharPref("identify");
	if (t)
	{
		document.title += " [" + t + "]";
	}
//	mapaPlus.core.dump(mapaPlus.core.dialogShow + " | " + mapaPlus.core.dialogForce + " | " + mapaPlus.core.prefSuppress + " | "  + mapaPlus.core.prefSuppressTemp);
}
*/

mapaPlus.quit = function()
{
//	commonDialogOnLoad();
	this.core.windowRemove(this.windowID, this.windowType);
	window.close();
}

mapaPlus.suppressed = function()
{
	document.title = this.titleOriginal + this.titleSuffix + " (" + (++mapaPlus.core.dialogSuppressedCount) + ")";
}

mapaPlus.commonDialogOptions = function()
{
	this.options({protect: false, protected: false});
/*
	if (!this.core.pref.getBoolPref("protect"))
		this.options({protect: false, protected: false});
	else
		document.documentElement.getButton("disclosure").disabled = true;
*/
}
mapaPlus.checkLatin = function(t)
{
	for(var i = 0; i < t.length; i++)
		if (t.charCodeAt(i) > 127)
			return true;

	return false;
}

mapaPlus.nonLatin = function(e)
{
	document.getElementById("mapaPlusNonLat").collapsed = !(((mapaPlus.core.prefNonLatinWarning == 2 && mapaPlus.core.windowFullScreen())
																														 || mapaPlus.core.prefNonLatinWarning == 1)
																													 && mapaPlus.checkLatin(e.target.value));
}

mapaPlus.updateTitle = function()
{
	this.titleSuffix = this.core.pref.getComplexValue("identify", Ci.nsISupportsString).data;
	if (this.titleSuffix)
		this.titleSuffix = " [" + this.titleSuffix + "]";

	document.title = this.titleOriginal + this.titleSuffix;
	if (this.core.dialogSuppressedCount)
	{
		this.core.dialogSuppressedCount--;
		this.suppressed();
	}
}
mapaPlus.commonDialogOnLoad = function()
{
	this.loaded = true;
	this._commonDialogOnLoad();
	this.titleOriginal = document.title;
	if (this.pass)
	{
		mapaPlus.updateTitle();

		document.getElementById("password1Label").parentNode.insertBefore(document.getElementById("mapaPlusWarning"), document.getElementById("password1Label"));
		document.getElementById("mapaPlusWarning").appendChild(document.getElementById("password1Label"));
		if (this.dialogTemp && this.core.initialized && this.core.prefSuppress != 2)
		{
			this.displayTemp();
		}
//		if (!this.core.locked && this.core.initialized && this.dialogOptions && !this.core.pref.getBoolPref("protect"))
		if (!this.core.locked && this.core.initialized && this.dialogOptions)
		{
			document.documentElement.getButton("disclosure").label = this.strings.options;
			document.documentElement.getButton("disclosure").hidden = false;
		}
//		document.documentElement.getButton("cancel").addEventListener("command", this.commonDialogCancel, true);
		document.documentElement.getButton("disclosure").removeAttribute("accesskey");
		document.getElementById("password1Textbox").addEventListener("input", this.nonLatin, true);
		this.observer.init();

		var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
		timer.init({observe: function()
		{
			if (!mapaPlus.core.prefShowLang || (mapaPlus.core.prefShowLang == 2 && !mapaPlus.core.windowFullScreen()))
			{
				document.getElementById("password1Label").collapsed = true;
				return;
			}
			try
			{
				var l = mapaPlus.core.KB.getLangNameAbr().toUpperCase();
				if (document.getElementById("password1Label").value != l || document.getElementById("password1Label").collapsed)
				{
					document.getElementById("password1Label").collapsed = false;
					document.getElementById("password1Label").value = l;
				}
			}
			catch(e)
			{
//				mapaPlus.dump(e, 1);
			}
		}}, 100, timer.TYPE_REPEATING_SLACK);
		window.addEventListener("unload", timer.cancel, false);
		mapaPlus.core.dialogSuppressedCount = 0;
		if (!mapaPlus.core.prefLockIgnoreFirstKey && mapaPlus.core.eventKeypress && [13,27].indexOf(mapaPlus.core.eventKeypress.keyCode) == -1)
		{
			let sendEvent = function(type)
			{
				let evt = document.createEvent("KeyboardEvent"),
							e = mapaPlus.core.eventKeypress;
				try
				{
					evt.initKeyEvent(
										type,        //  in DOMString typeArg,
										e.bubbles,             //  in boolean canBubbleArg,
										e.cancelable,             //  in boolean cancelableArg,
										window,             //  in nsIDOMAbstractView viewArg,  Specifies UIEvent.view. This value may be null.
										e.ctrlKey,            //  in boolean ctrlKeyArg,
										e.altKey,            //  in boolean altKeyArg,
										e.shiftKey,            //  in boolean shiftKeyArg,
										e.metaKey,            //  in boolean metaKeyArg,
										e.keyCode,               //  in unsigned long keyCodeArg,
										e.charCode);              //  in unsigned long charCodeArg);
					document.getElementById("password1Textbox").inputField.dispatchEvent(evt);
				}
				catch(err)
				{
					mapaPlus.dump("SendEvent: " + err);
				}
			}
			sendEvent("keypress");
			mapaPlus.core.eventKeypress = null;
		}
	}
}
mapaPlus.commonDialogOnUnload = function()
{
	this.core.windowRemove(this.windowID, this.windowType);
	if (this.loaded)
		this._commonDialogOnUnload();
//	return this.loaded;
}

mapaPlus.acceptObserve = function()
{
	this.accepted = true;
	document.documentElement.getButton("accept").click();
}

mapaPlus.commonDialogOnAccept = function()
{
	if (!this.pass || this.accepted)
		return true;

	var pass = false;
	try
	{
		pass = this.core.tokenDB.checkPassword(document.getElementById("password1Textbox").value);
	}
	catch(e){}
	if (pass)
	{
		this.core.lockIncorrect = 0;
		this.core.startupIncorrect = 0;
		if (this.core.locked)
		{
			this.core.unlock();
		}
		this.core.timerCheck.observe();
		this.core.windowAction("lock", false, this.windowType);
	}
	else
	{
		if (this.core.initialized)
		{
			this.core.lockIncorrect++;
			if (this.core.lockIncorrect >= this.core.prefLockIncorrect)
				this.core.lock();
		}
		else
		{
			this.core.startupIncorrect++;
			let i = this.core.pref.getIntPref("startupincorrect");
			if (i && this.core.startupIncorrect >= i)
			{
				this.quit();
				return false;
			}
		}
	}
/*
	if (document.getElementById("suppresstemp").checked)
	{
		this.core.prefSuppressTemp = parseInt(document.getElementById("hours").value) * 60 + parseInt(document.getElementById("minutes").value);
		this.core.pref.setIntPref("suppresstemp", this.core.prefSuppressTemp);
		this.core.suppressTemp.start();
	}
	else
*/
	if (!pass)
	{
		for(var i in this.dialogBackup)
			this.core[i] = this.dialogBackup[i];

		this.core.dialogTemp = this.dialogTemp;
		this.core.dialogOptions = this.dialogOptions;
//		this.core.dialogSuppress = false;
//		this.core.dialogShow = true;
		this.core.windowUpdate(false);
	}
	if (pass)
		this.core.windowAction("acceptObserve", "", this.windowType);

	return true;
}

mapaPlus.commonDialogCancel = function(t)
{
	if (!mapaPlus.core.startupPassed)
		return;
	mapaPlus.core.windowAction("dialogCanceled", true, "Window");

	if (!t || document.getElementById("mapaPlus").collapsed)
		return;

//	mapaPlus.core.prefSuppressTemp = document.getElementById("mapaPlus").collapsed ? mapaPlus.core.pref.getIntPref("suppresstemp") : parseInt(document.getElementById("hours").value) * 60 + parseInt(document.getElementById("minutes").value);
	mapaPlus.core.prefSuppressTemp = parseInt(document.getElementById("hours").value) * 60 + parseInt(document.getElementById("minutes").value);
	mapaPlus.core.pref.setIntPref("suppresstemp", mapaPlus.core.prefSuppressTemp);
	mapaPlus.core.suppressTemp.start();
	window.close();
}

mapaPlus.displayTemp = function()
{
	//append new options to the prompt
	document.getElementById("password1Textbox").parentNode.parentNode.appendChild(document.getElementById("mapaPlus"));
	document.getElementById("mapaPlus").collapsed = false;
	var minutes = this.core.pref.getIntPref("suppresstemp");
	var hours = 0;
	if (minutes > 59)
	{
		hours = parseInt(minutes / 60);
		minutes = minutes - (hours * 60);
	}
	document.getElementById("hours").value = hours;
	document.getElementById("minutes").value = minutes;
}

mapaPlus.checkTemp = function()
{
	if (document.getElementById("hours").value == "0" && document.getElementById("minutes").value == "0")
		document.getElementById("minutes").value = 1;
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
//mapaPlus.dump(aTopic + " | " + aSubject.data + " | " + aData);
		if (aTopic != this._name || !mapaPlus[aSubject.data])
			return;

		mapaPlus[aSubject.data](aData);
	},
}

mapaPlus.lock = function(l)
{
	if (l.match(/\|/))
		return;

	document.documentElement.getButton("disclosure").disabled = l;
	mapaPlus.setAttribute("mapaPlusTemp", "disabled", l, !l);
}

//window.addEventListener("load", mapaPlus.load, false);
//document.getElementById("commonDialog").setAttribute("onload",					"mapaPlus.commonDialogOnLoad();" + document.getElementById("commonDialog").getAttribute("onload"));
//document.getElementById("commonDialog").setAttribute("onunload",				"if (mapaPlus.commonDialogOnUnload()) {" + document.getElementById("commonDialog").getAttribute("onunload") + "}");
document.getElementById("commonDialog").setAttribute("ondialogaccept",	"if(!mapaPlus.commonDialogOnAccept()) return false;" + document.getElementById("commonDialog").getAttribute("ondialogaccept"));
mapaPlus.check();
