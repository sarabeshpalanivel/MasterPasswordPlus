mapaPlus.LoadSignons = typeof(LoadSignons) == undefined ? null : LoadSignons,
mapaPlus.FinalizeSignonDeletions = typeof(FinalizeSignonDeletions) == undefined ? null : FinalizeSignonDeletions,
mapaPlus.ConfirmShowPasswords = typeof(ConfirmShowPasswords) == undefined ? null : ConfirmShowPasswords,
mapaPlus.TogglePasswordVisible = typeof(TogglePasswordVisible) == undefined ? null : TogglePasswordVisible,
mapaPlus.exec = function(f, v)
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

var LoadSignons = function()
{
	return mapaPlus.exec(mapaPlus.LoadSignons);
},

FinalizeSignonDeletions = function(syncNeeded)
{
	return mapaPlus.exec(mapaPlus.FinalizeSignonDeletions, syncNeeded);
},

ConfirmShowPasswords = function()
{
	return mapaPlus.exec(mapaPlus.ConfirmShowPasswords);
},

TogglePasswordVisible = function()
{
	return mapaPlus.exec(mapaPlus.TogglePasswordVisible);
}