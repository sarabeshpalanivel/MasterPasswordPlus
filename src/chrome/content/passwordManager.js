(function()
{
Components.utils.import("resource://mapaplus/masterpasswordplusCore.jsm");
let _LoadSignons = typeof(window.LoadSignons) == undefined ? null : window.LoadSignons,
		_FinalizeSignonDeletions = typeof(window.FinalizeSignonDeletions) == undefined ? null : window.FinalizeSignonDeletions,
		_ConfirmShowPasswords = typeof(window.ConfirmShowPasswords) == undefined ? null : window.ConfirmShowPasswords,
		_TogglePasswordVisible = typeof(window.TogglePasswordVisible) == undefined ? null : window.TogglePasswordVisible;

window.LoadSignons = function()
{
	dump(mapaPlusCore.dialogShow)
	return _exec(_LoadSignons);
}

window.FinalizeSignonDeletions = function(syncNeeded)
{
	return _exec(_FinalizeSignonDeletions, syncNeeded);
}

window.ConfirmShowPasswords = function()
{
	return _exec(_ConfirmShowPasswords);
}

window.TogglePasswordVisible = function()
{
	return _exec(_TogglePasswordVisible);
}

_exec = function(f, v)	
{	
	var dialogShow = mapaPlusCore.dialogShow;	
	var dialogTemp = mapaPlusCore.dialogTemp;	
	mapaPlusCore.dialogShow = true;	
	mapaPlusCore.dialogTemp = false;	
	mapaPlusCore.suppressedFocusForce = true;
	var r = f(v);	
	mapaPlusCore.dialogTemp = dialogTemp;	
	mapaPlusCore.dialogShow = dialogShow;	
	return r;	
}
})();