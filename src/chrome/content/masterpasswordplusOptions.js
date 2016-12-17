(function(){
function $(id)
{
	return document.getElementById(id);
}
mapaPlus.window = window;
mapaPlus.protect = false; //ask for password
mapaPlus.protected = false;//mapaPlus.core.prefs.getBoolPref("protect");
mapaPlus.protectedBegin = true;
mapaPlus.pass = false;
mapaPlus.windowType = "options";
mapaPlus.windowID = 0;

mapaPlus.saveOptions = function ()
{
	this.core.prefNoObserve = true;
	var sel = this.getOrder("urlbar-icons");
	if (sel)
		this.core.prefs.setCharPref("urlbarpos", (sel.dir?1:0)+sel.id);

	sel = this.getOrder("status-bar");
	if (sel)
		this.core.prefs.setCharPref("statusbarpos", (sel.dir?1:0)+sel.id);

	if (document.getElementById("mapaPlusSuppressPopup").getAttribute("indeterminate") == "true")
		document.getElementById("mapaPlusSuppressPopup").checked = true;
	else
		this.core.suppressedPopupStop = false;

	this.hotkeySave("mapaPlusLogoutHotkey", "logouthotkey");
	this.hotkeySave("mapaPlusLockHotkey", "lockhotkey");
	this.hotkeySave("mapaPlusLockWinHotkey", "lockwinhotkey");
	this.hotkeySave("mapaPlusLockLogoutHotkey", "locklogouthotkey");

	this.core.prefNoObserve = false;
	this.core.windowUpdate(true,true);
	this.core.init(true, this);
	this.core.windowAction("updateTitle", null, "Dialog");
	this.debugSave();
	this.changesLogSave();

}

//Initialize options
mapaPlus.load = function ()
{
	mapaPlus.init();
}
mapaPlus.init = function()
{
	document.getElementById("mapaPlusContextmenu").hidden = this.core.isTB;
	document.getElementById("mapaPlusUrlbarBox").hidden = this.core.isTB;
	document.getElementById("mapaPlusString").value = document.getElementById("mapaPlusString").value.replace("#", this.core.appInfo.name);
	if (this.core.isFF4)
		document.getElementById("prompt-one").collapsed = document.getElementById("one.info").collapsed = true;

	if (!this.core.isTB)
	{
		if (this.iniIcons("urlbar-icons", "mapa_urlbar", "urlbar", "mapaPlusUrlbar"))
			document.getElementById("urlbar-container").collapsed = false;

		document.getElementById("panelDisplay").addEventListener("mousemove", this.showSelected, true);
		document.getElementById("mapaPlusSuppressPopupBox").collapsed = false;
		if (document.getElementById("mapaPlusSuppressPopup").checked && this.core.suppressedPopupStop)
		{
			document.getElementById("mapaPlusSuppressPopup").setAttribute("indeterminate", true);
			document.getElementById("mapaPlusSuppressPopup").checked = false; //we want first click check the checkbox, not uncheck it.
		}
		document.getElementById("urlbar").boxObject.firstChild.setAttribute("flex", 0);
		document.getElementById("options").setAttribute("options", true);
	}
	let timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	timer.init({observe:function()
	{
		let x, y;
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
			document.getElementById("masterPasswordPlusOptions").boxObject.parentBox.boxObject.parentBox.style.overflow = "auto";
			document.getElementById("masterPasswordPlusOptions").boxObject.parentBox.setAttribute("flex", 0);
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
	if (this.strings.moreinfo)
		document.documentElement.getButton("disclosure").label = this.strings.moreinfo;

	this.setListeners();
	window.addEventListener("unload", this.close, false);
//	this.setProtect("protected", false)
	this.loadArgs();

}


mapaPlus.suppress = function()
{
	var status = document.getElementById("mapaPlusSuppress").value == 0 || document.getElementById("mapaPlusSuppress").disabled || mapaPlus.isLocked;
	mapaPlus.setAttribute("mapaPlusSuppressBox", "disabled", status, !status, "mapaPlusSuppressPopup");
	status = ((!document.getElementById("mapaPlusSuppressPopup").checked && document.getElementById("mapaPlusSuppressPopup").getAttribute("indeterminate") != "true") || document.getElementById("mapaPlusSuppressPopup").disabled || mapaPlus.locked);
	mapaPlus.setAttribute("mapaPlusSuppressPopupRemoveBox", "disabled", status, !status);
}

mapaPlus.enableDisable = function(e)
{
	var status, startup, lock, disable, minimize;
	var locked = (mapaPlus.protected || mapaPlus.isLocked);
	if (locked)
	{
		status = true;
		startup = true;
		lock = true;
		minimize = true;
		document.getElementById("mapaPlusEnabled").disabled = true;
		document.getElementById("mapaPlusStartup").disabled = true;
		document.getElementById("mapaPlusLockTimer").disabled = true;
		document.documentElement.getButton("accept").disabled = true;
		document.documentElement.getButton("disclosure").disabled = true;
		document.documentElement.getButton("extra1").hidden = false;
		disable = true;
	}
	else
	{
		document.getElementById("mapaPlusEnabled").disabled = false;
		document.getElementById("mapaPlusStartup").disabled = false;
		document.documentElement.getButton("accept").disabled = false;
		document.documentElement.getButton("disclosure").disabled = false;
		document.documentElement.getButton("extra1").hidden = true;
		document.getElementById("mapaPlusLockTimer").disabled = false;
		status = !document.getElementById("mapaPlusEnabled").checked;
		startup = !document.getElementById("mapaPlusStartup").checked;
		lock = !document.getElementById("mapaPlusLockTimer").checked;
		disable = false;
		minimize = !document.getElementById("mapaPlusLockMinimize").checked || lock;
	}
	document.getElementById("mapaPlusSuppressLabel").disabled = locked;
	document.getElementById("mapaPlusSuppress").disabled = locked;
	mapaPlus.setAttribute("panelGeneral", "disabled", locked, !locked);
	mapaPlus.setAttribute("mapaPlusTimeoutBox", "disabled", status, !status);
	mapaPlus.setAttribute("mapaPlusLogoutOnMinimize", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusStartupBox", "disabled", startup, !startup);
	mapaPlus.setAttribute("panelDisplay", "disabled", locked, !locked);
	mapaPlus.setAttribute("mapaPlusLockBox", "disabled", lock, !lock);
	mapaPlus.setAttribute("mapaPlusLockBox2", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusLockBox3", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusSuppressBlinkBox", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusSuppressPopupBox", "disabled", disable, !disable);
	mapaPlus.setAttribute("mapaPlusSuppressSoundBox", "disabled", disable, !disable);
	document.getElementById("mapaPlusLockMinimizeBlur").disabled = minimize;
	let urlbar = !document.getElementById("mapaPlusUrlbar").checked || locked;
	mapaPlus.setAttribute("urlbar-container", "disabled", urlbar, !urlbar);

/*
	if (e !== false)
		mapaPlus.core.windowAction("lock", locked+"|"+mapaPlus.windowID, "Dialog");
*/
	
	var n = document.getElementsByClassName("note");
	for(var i = 0; i < n.length; i++)
		n[i].collapsed = mapaPlus.core.status;

	mapaPlus.suppress();
}//enableDisable()

})();