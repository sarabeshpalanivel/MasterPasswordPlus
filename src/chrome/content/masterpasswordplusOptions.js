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

	if ($("mapaPlusSuppressPopup").getAttribute("indeterminate") == "true")
		$("mapaPlusSuppressPopup").checked = true;
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
	$("mapaPlusContextmenu").hidden = this.core.isTB;
	$("mapaPlusUrlbarBox").hidden = this.core.isTB;
	$("mapaPlusString").value = $("mapaPlusString").value.replace("#", this.core.appInfo.name);
	if (this.core.isFF4)
		$("prompt-one").collapsed = $("one.info").collapsed = true;

	if (!this.core.isTB)
	{
		if (this.iniIcons("urlbar-icons", "mapa_urlbar", "urlbar", "mapaPlusUrlbar"))
			$("urlbar-container").collapsed = false;

		$("panelDisplay").addEventListener("mousemove", this.showSelected, true);
		$("mapaPlusSuppressPopupBox").collapsed = false;
		if ($("mapaPlusSuppressPopup").checked && this.core.suppressedPopupStop)
		{
			$("mapaPlusSuppressPopup").setAttribute("indeterminate", true);
			$("mapaPlusSuppressPopup").checked = false; //we want first click check the checkbox, not uncheck it.
		}
		$("urlbar").boxObject.firstChild.setAttribute("flex", 0);
		$("options").setAttribute("options", true);
	}
	let timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
	timer.init({observe:function()
	{
		let x, y;
		if (!mapaPlus.core.isTB)
		{
			if ($("urlbar").boxObject.firstChild.boxObject.width > $("urlbar").boxObject.width)
			{
				x = $("urlbar").boxObject.firstChild.boxObject.width - $("urlbar").boxObject.width;
				window.resizeBy(x, 0);
			}
			$("urlbar").boxObject.firstChild.setAttribute("flex", 1);
		}
		x = document.documentElement.boxObject.width > window.screen.availWidth ? document.documentElement.boxObject.width - window.screen.availWidth : 0;
		y = document.documentElement.boxObject.height > window.screen.availHeight ? document.documentElement.boxObject.height - window.screen.availHeight : 0;
		if (x || y)
		{
			window.resizeBy(x, y);
			$("masterPasswordPlusOptions").boxObject.parentBox.boxObject.parentBox.style.overflow = "auto";
			$("masterPasswordPlusOptions").boxObject.parentBox.setAttribute("flex", 0);
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

	replace_validateValue($("mapaPlusFailedAttempts"));
	replace_validateValue($("mapaPlusFailedAttemptsTime"));
}


mapaPlus.suppress = function()
{
	var status = $("mapaPlusSuppress").value == 0 || $("mapaPlusSuppress").disabled || mapaPlus.isLocked;
	mapaPlus.setAttribute("mapaPlusSuppressBox", "disabled", status, !status, "mapaPlusSuppressPopup");
	status = ((!$("mapaPlusSuppressPopup").checked && $("mapaPlusSuppressPopup").getAttribute("indeterminate") != "true") || $("mapaPlusSuppressPopup").disabled || mapaPlus.locked);
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
		$("mapaPlusEnabled").disabled = true;
		$("mapaPlusStartup").disabled = true;
		$("mapaPlusLockTimer").disabled = true;
		document.documentElement.getButton("accept").disabled = true;
		document.documentElement.getButton("disclosure").disabled = true;
		document.documentElement.getButton("extra1").hidden = false;
		disable = true;
	}
	else
	{
		$("mapaPlusEnabled").disabled = false;
		$("mapaPlusStartup").disabled = false;
		document.documentElement.getButton("accept").disabled = false;
		document.documentElement.getButton("disclosure").disabled = false;
		document.documentElement.getButton("extra1").hidden = true;
		$("mapaPlusLockTimer").disabled = false;
		status = !$("mapaPlusEnabled").checked;
		startup = !$("mapaPlusStartup").checked;
		lock = !$("mapaPlusLockTimer").checked;
		disable = false;
		minimize = !$("mapaPlusLockMinimize").checked || lock;
	}
	$("mapaPlusSuppressLabel").disabled = locked;
	$("mapaPlusSuppress").disabled = locked;
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
	$("mapaPlusLockMinimizeBlur").disabled = minimize;
	let urlbar = !$("mapaPlusUrlbar").checked || locked;
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


function replace_validateValue(obj)
{
	obj.prev = [0, 0, obj._value];
	obj._validateValue = function(aValue, aIsIncDec)
	{
		let min = obj.min,
				max = obj.max,
				val = String(aValue).replace(/[^0-9\-]/g, "");
		val = val.replace(/[\-]{2,}/g, "-");
		val = val.replace(/([0-9]+)[\-]+/g, "$1");
		if (val == "-")
			aValue = val;
		else
			aValue = Number(val) || 0;

		if (aValue < min)
			aValue = min;
		else if (aValue > max)
			aValue = obj._value > max ? max : obj._value;

		aValue = "" + aValue;
		obj._valueEntered = false;
		obj._value = aValue == "-" ? aValue : Number(aValue);
		obj.prev.push(obj._value);
		obj.prev.splice(0,1);
		obj.inputField.value = Number(aValue) || aValue == "-" ? aValue : mapaPlus.strings.disabled;
		obj._enableDisableButtons();
		return aValue;
	}
	obj.value = obj.value;
} //replace_validateValue()

})();