mapaPlus.load = function()
{
	mapaPlus.init();
}
mapaPlus.init = function()
{
	this.LoadSignons = typeof(window.LoadSignons) == undefined ? null : window.LoadSignons,
	this.FinalizeSignonDeletions = typeof(window.FinalizeSignonDeletions) == undefined ? null : window.FinalizeSignonDeletions,
	this.ConfirmShowPasswords = typeof(window.ConfirmShowPasswords) == undefined ? null : window.ConfirmShowPasswords,
	this.TogglePasswordVisible = typeof(window.TogglePasswordVisible) == undefined ? null : window.TogglePasswordVisible,
	window.LoadSignons = function()
	{
		return mapaPlus.exec(mapaPlus.LoadSignons);
	}
	
	window.FinalizeSignonDeletions = function(syncNeeded)
	{
		return mapaPlus.exec(mapaPlus.FinalizeSignonDeletions, syncNeeded);
	}
	
	window.ConfirmShowPasswords = function()
	{
		return mapaPlus.exec(mapaPlus.ConfirmShowPasswords);
	}
	
	window.TogglePasswordVisible = function()
	{
		return mapaPlus.exec(mapaPlus.TogglePasswordVisible);
	}
}
mapaPlus.exec = function(f, v)	
{	
	var dialogShow = mapaPlus.core.dialogShow;	
	var dialogTemp = mapaPlus.core.dialogTemp;	
	mapaPlus.core.dialogShow = true;	
	mapaPlus.core.dialogTemp = false;	
	mapaPlus.core.suppressedFocusForce = true;	
	var r = f(v);	
	mapaPlus.core.dialogTemp = dialogTemp;	
	mapaPlus.core.dialogShow = dialogShow;	
	return r;	
}
window.addEventListener("load", mapaPlus.load, true);