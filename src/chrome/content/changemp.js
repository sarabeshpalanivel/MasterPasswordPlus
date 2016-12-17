mapaPlus.window = window;
mapaPlus.checkPasswords = checkPasswords;
mapaPlus.setPassword = setPassword;
mapaPlus.okButton = null;
mapaPlus.okButtonLabel = "";
mapaPlus.bundle = null;
mapaPlus.protect = false; //don't ask for password
mapaPlus.protected = false; //disable everything until old password entered
mapaPlus.protectedBegin = true;
mapaPlus.windowID = 0;
mapaPlus.windowType = "changemp";
mapaPlus.pass = false;

mapaPlus.load = function()
{
	mapaPlus.init();
}

mapaPlus.init = function()
{
	this.windowID = this.core.windowAdd(mapaPlus, "changemp");
	this.bundle = document.getElementById("bundlePreferences");
	document.getElementById("masterPasswordPlusOptions").setAttribute("changemp", true);
	document.getElementById("changemp").setAttribute("ondialogaccept", "return setPassword();");
	document.getElementById("oldpw").setAttribute("oninput", "checkPasswords();");
	document.getElementById("mapaPlusString").setAttribute("tooltiptext", document.getElementById("mapaPlusString").getAttribute("tooltiptext").replace("#", this.core.appInfo.name));

	if (this.core.isFF4)
		document.getElementById("prompt-one").collapsed = document.getElementById("one.info").collapsed = true;

	document.getElementById("mapaPlusContextmenu").hidden = this.core.isTB;
	document.getElementById("mapaPlusUrlbarBox").hidden = this.core.isTB;
	if (!this.core.isTB)
	{
		if (this.iniIcons("urlbar-icons", "mapa_urlbar", "urlbar", "mapaPlusUrlbar"))
			document.getElementById("urlbar-container").collapsed = false;

		document.getElementById("panelDisplay").addEventListener("mousemove", this.showSelected, true);
		document.getElementById("mapaPlusSuppressPopupBox").collapsed = false;
		document.getElementById("mapaPlusSuppressPopupBox").setAttribute("suspended", this.core.suppressedPopupStop);
		if (document.getElementById("mapaPlusSuppressPopup").checked && this.core.suppressedPopupStop)
		{
			document.getElementById("mapaPlusSuppressPopup").setAttribute("indeterminate", true);
			document.getElementById("mapaPlusSuppressPopup").checked = false; //we want first click check the checkbox, not uncheck it.
		}
		document.getElementById("urlbar").boxObject.firstChild.setAttribute("flex", 0);
	}
	var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	timer.init({observe: function()
	{
		let x, y;
		if (document.getElementById("options").boxObject.width + 5 != document.getElementById("masterPasswordPlusOptions").boxObject.width)
		{
			x = (document.getElementById("options").boxObject.width + 5 - document.getElementById("masterPasswordPlusOptions").boxObject.width) + (document.width - document.getElementById("masterPasswordPlusOptions").boxObject.width);
			window.resizeBy(x, 0);
		}

		if (document.getElementById("options").boxObject.height + 15 != document.getElementById("masterPasswordPlusOptions").boxObject.height)
		{
			y = document.getElementById("options").boxObject.height - document.getElementById("masterPasswordPlusOptions").boxObject.height + 15;
			window.resizeBy(0, y);
		}
		if (document.getElementById("mapaPlusHotkeysBox").boxObject.width > document.getElementById("mapaPlusHotkeysBox").parentNode.boxObject.width)
		{
			x = document.getElementById("mapaPlusHotkeysBox").boxObject.width - document.getElementById("mapaPlusHotkeysBox").parentNode.boxObject.width;
			window.resizeBy(x, 0);
		}
		if (!mapaPlus.core.isTB)
		{
			if (document.getElementById("urlbar").boxObject.firstChild.boxObject.width > document.getElementById("urlbar").boxObject.width)
			{
				x = document.getElementById("urlbar").boxObject.firstChild.boxObject.width - document.getElementById("urlbar").boxObject.width;
				window.resizeBy(x, 0);
			}
			document.getElementById("urlbar").boxObject.firstChild.setAttribute("flex", 1);
		}
		x = document.documentElement.boxObject.width > window.screen.availWidth ? document.documentElement.boxObject.width - window.screen.availWidth : 0;
		y = document.documentElement.boxObject.height > window.screen.availHeight ? document.documentElement.boxObject.height - window.screen.availHeight : 0;
		if (x || y)
		{
			window.resizeBy(x, y);
			document.getElementById("masterPasswordPlusOptions").boxObject.parentBox.style.overflow = "auto";
			let pix = window.getComputedStyle(document.documentElement, null).paddingRight;
			document.documentElement.style.paddingRight = 0;
			let r = null;
			for(let b in document.documentElement._buttons)
			{
				b = document.documentElement._buttons[b];
				if (!r || b.boxObject.x > r.boxObject.x)
					r = b
			}
			r.style.marginRight = pix;
		}
	}}, 0, timer.TYPE_ONE_SHOT);
	this.okButton = document.documentElement.getButton("accept");
	this.okButtonLabel = this.okButton.label;

	setPassword = function ()
	{
		var pk11db = Components.classes["@mozilla.org/security/pk11tokendb;1"].getService(Components.interfaces.nsIPK11TokenDB);
		var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
																	.getService(Components.interfaces.nsIPromptService);
		var token = pk11db.findTokenByName(tokenName);
		dump("*** TOKEN!!!! (name = |" + token + "|\n");

		var oldpwbox = document.getElementById("oldpw");
		var initpw = oldpwbox.getAttribute("inited");
		var bundle = document.getElementById("bundlePreferences");
		var success = false;

		if (initpw == "false" || initpw == "empty") {
			try {
				var oldpw = "";
				var passok = 0;

				if (initpw == "empty") {
					passok = 1;
				} else {
					oldpw = oldpwbox.value;
					passok = oldpw != "" && token.checkPassword(oldpw);
				}

				if (passok) {
					if (initpw == "empty" && pw1.value == "") {
						// This makes no sense that we arrive here,
						// we reached a case that should have been prevented by checkPasswords.
					} else {
						if (pw1.value == "") {
							var secmoddb = Components.classes["@mozilla.org/security/pkcs11moduledb;1"].getService(Components.interfaces.nsIPKCS11ModuleDB);
							if (secmoddb.isFIPSEnabled) {
								// empty passwords are not allowed in FIPS mode
								promptService.alert(window,
																		bundle.getString("pw_change_failed_title"),
																		bundle.getString("pw_change2empty_in_fips_mode"));
								passok = 0;
							}
						}
						if (passok) {
							token.changePassword(oldpw, pw1.value);
							token.logoutAndDropAuthenticatedResources();
							success = true;
							mapaPlus.saveOptions();
							if (pw1.value == "") {
								promptService.alert(window,
																		bundle.getString("pw_change_success_title"),
																		bundle.getString("pw_erased_ok")
																		+ " " + bundle.getString("pw_empty_warning"));
							} else {
								promptService.alert(window,
																		bundle.getString("pw_change_success_title"),
																		bundle.getString("pw_change_ok"));
							}
						}
					}
				} else {
					if (pw1.value != "" || oldpw != "")
					{
						oldpwbox.focus();
						oldpwbox.setAttribute("value", "");
						promptService.alert(window,
																bundle.getString("pw_change_failed_title"),
																bundle.getString("incorrect_pw"));
					}
					else
					{
						success = true;
						mapaPlus.saveOptions();
					}
				}
			} catch (e) {
//				mapaPlus.dump(e);
				promptService.alert(window,
														bundle.getString("pw_change_failed_title"),
														bundle.getString("failed_pw_change"));
			}
		} else {
			token.initPassword(pw1.value);
			success = true;
			mapaPlus.saveOptions();
			if (pw1.value == "") {
				promptService.alert(window,
														bundle.getString("pw_change_success_title"),
														bundle.getString("pw_not_wanted")
														+ " " + bundle.getString("pw_empty_warning"));
			}
		}
		return success;
	}
	checkPasswords = function ()
	{
		mapaPlus.checkPasswords();
		if (!document.getElementById("oldpw").hidden)
		{
			document.documentElement.getButton("accept").disabled = !((!document.getElementById("oldpw").value
																																	&& document.getElementById("pw1").value == ""
																																	&& document.getElementById("pw2").value == "")
																															|| (document.getElementById("oldpw").value
																																	&& !document.documentElement.getButton("accept").disabled));

//			mapaPlus.core.tokenDB.logoutAndDropAuthenticatedResources();
			mapaPlus.setProtect("protected", mapaPlus.protectedBegin)
		}
		mapaPlus.enableDisable();
	}

	this.setListeners();
//	checkPasswords();
	this.suppress();

}//init()

mapaPlus.suppress = function()
{
	var status = document.getElementById("mapaPlusSuppress").value == 0 || document.getElementById("mapaPlusSuppress").disabled || mapaPlus.isLocked;
	mapaPlus.setAttribute("mapaPlusSuppressBox", "disabled", status, !status);
	status = ((!document.getElementById("mapaPlusSuppressPopup").checked && document.getElementById("mapaPlusSuppressPopup").getAttribute("indeterminate") != "true") || document.getElementById("mapaPlusSuppressPopup").disabled) || mapaPlus.isLocked;
	mapaPlus.setAttribute("mapaPlusSuppressPopupRemoveBox", "disabled", status, !status);
}

mapaPlus.enableDisable = function(e)
{
	var status, startup, lock, disable, display, minimize;
	var del = (document.getElementById("oldpw").value != ""
			&& document.getElementById("pw1").value == "" && document.getElementById("pw2").value == "");
	var locked = (mapaPlus.protected || mapaPlus.isLocked);
	if (del || locked)
	{
		status = true;
		startup = true;
		lock = true;
		disable = true;
		display = locked ? true : false;
		minimize = true;
		document.getElementById("mapaPlusEnabled").disabled = true;
		document.getElementById("mapaPlusStartup").disabled = true;
		if (!del)
			document.documentElement.getButton("extra1").hidden = false;

		document.getElementById("mapaPlusLockTimer").disabled = true;
	}
	else
	{
		document.getElementById("mapaPlusEnabled").disabled = false;
		document.getElementById("mapaPlusStartup").disabled = false;
		document.documentElement.getButton("extra1").hidden = true;
		document.getElementById("mapaPlusLockTimer").disabled = false;
		status = !document.getElementById("mapaPlusEnabled").checked;
		startup = !document.getElementById("mapaPlusStartup").checked;
		lock = !document.getElementById("mapaPlusLockTimer").checked;
		disable = false;
		display = false;
		minimize = !document.getElementById("mapaPlusLockMinimize").checked || lock;
	}
	mapaPlus.okButton.label = del ? mapaPlus.bundle.getString("pw_remove_button") : mapaPlus.okButtonLabel;
	document.getElementById("mapaPlusSuppressLabel").disabled = disable;
	document.getElementById("mapaPlusSuppress").disabled = disable;
	mapaPlus.setAttribute("panelGeneral", "disabled", disable, !disable);
	mapaPlus.setAttribute("panelDisplay", "disabled", display, !display);

	mapaPlus.setAttribute("mapaPlusTimeoutBox", "disabled", status, !status);
	mapaPlus.setAttribute("mapaPlusLogoutOnMinimize", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusStartupBox", "disabled", startup, !startup);
	mapaPlus.setAttribute("mapaPlusLockBox", "disabled", lock, !lock);
	mapaPlus.setAttribute("mapaPlusLockBox2", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusLockBox3", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusSuppressBlinkBox", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusSuppressPopupBox", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusSuppressSoundBox", "disabled", disable, !disable);
	let urlbar = !document.getElementById("mapaPlusUrlbar").checked || locked;
	mapaPlus.setAttribute("urlbar-container", "disabled", urlbar, !urlbar);
	document.getElementById("mapaPlusLockMinimizeBlur").disabled = minimize;

/*
	if (e !== false && !del)
		mapaPlus.core.windowAction("lock", locked+"|"+mapaPlus.windowID, "Dialog");
*/

	mapaPlus.suppress();
}

mapaPlus.saveOptions = function()
{
	this.core.prefNoObserve = true;
	// we don't want save new settings if options locked
	if (!this.isLocked)
	{
		if (document.getElementById("mapaPlusSuppressPopup").getAttribute("indeterminate") == "true")
			document.getElementById("mapaPlusSuppressPopup").checked = true;
		else
			this.core.suppressedPopupStop = false;

		this.hotkeySave("mapaPlusLogoutHotkey", "logouthotkey");
		this.hotkeySave("mapaPlusLockHotkey", "lockhotkey");
		this.hotkeySave("mapaPlusLockWinHotkey", "lockwinhotkey");
		this.hotkeySave("mapaPlusLockLogoutHotkey", "locklogouthotkey");

		var el = document.getElementById("options").getElementsByTagName('*');
		var pref, prefType, prefValue, prefExtra;
		for(var i = 0; i < el.length; i++)
		{
			prefType = null;
			prefValue = null;
			prefExtra = null;
			pref = el[i].getAttribute("preference");
			if (!pref)
				continue;

			if (document.getElementById(pref))
				prefType = document.getElementById(pref).getAttribute("type");

			switch (prefType)
			{
				case "bool":
						prefType = "setBoolPref";
						prefValue = el[i].checked;
					break;
				case "int":
						prefType = "setIntPref";
						prefValue = el[i].value;
					break;
				case "char":
						prefType = "setCharPref";
						prefValue = el[i].value;
					break;
				case "unichar":
						prefType = "setComplexValue";
						prefValue = Components.interfaces.nsISupportsString;
						prefExtra = Components.classes["@mozilla.org/supports-string;1"].createInstance(prefValue);
						prefExtra.data = el[i].value;
					break;
				default:
						prefType = null;
			}
			if (!prefType)
				continue;

			this.core.pref[prefType](pref, prefValue, prefExtra);
		}



	}
	var sel = this.getOrder("urlbar-icons");
	if (sel)
		this.core.pref("urlbarpos", (sel.dir?1:0)+sel.id);

	sel = false;//this.getOrder("status-bar");
	if (sel)
		this.core.pref("statusbarpos", (sel.dir?1:0)+sel.id);

	this.core.prefNoObserve = false;
	this.core.windowUpdate(true,true);
	this.core.init(true, mapaPlus);
}

mapaPlus.close = function(e)
{
	mapaPlus.core.windowRemove(mapaPlus.windowID, "changemp");
	window.close();
}

var first = mapaPlus.core.windowFirst("changemp");
if (first)
{
	mapaPlus.core.timerFocus.init("changemp");
	mapaPlus.close();
}
else
{
	window.addEventListener("load", mapaPlus.load, false);
	window.addEventListener("unload", mapaPlus.close, false);
}
