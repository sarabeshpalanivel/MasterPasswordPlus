pref("extensions.masterPasswordPlus.logouttimer", false);
pref("extensions.masterPasswordPlus.logouttimeout", 300);
pref("extensions.masterPasswordPlus.logoutinactivity", true);
pref("extensions.masterPasswordPlus.statusbar", false);
pref("extensions.masterPasswordPlus.statusbarpos", "");
pref("extensions.masterPasswordPlus.toolsmenu", true);
pref("extensions.masterPasswordPlus.contextmenu", false);
pref("extensions.masterPasswordPlus.urlbar", true);
pref("extensions.masterPasswordPlus.urlbarpos", "0go-button");
pref("extensions.masterPasswordPlus.startup", false);
pref("extensions.masterPasswordPlus.startupfail", 1);
pref("extensions.masterPasswordPlus.startupshort", true);
pref("extensions.masterPasswordPlus.startuptimeout", 60);
pref("extensions.masterPasswordPlus.startupincorrect", 3);
pref("extensions.masterPasswordPlus.suppress", 0);
pref("extensions.masterPasswordPlus.suppresstimer", 10);
pref("extensions.masterPasswordPlus.suppressblink", true);
pref("extensions.masterPasswordPlus.suppresstemp", 10);
pref("extensions.masterPasswordPlus.suppresssound", true);
pref("extensions.masterPasswordPlus.suppresspopup", true);
pref("extensions.masterPasswordPlus.suppresspopupremove", 30);
pref("extensions.masterPasswordPlus.suppressfocus", true);
pref("extensions.masterPasswordPlus.protect", false);
pref("extensions.masterPasswordPlus.locktimer", false);
pref("extensions.masterPasswordPlus.locktimeout", 300);
pref("extensions.masterPasswordPlus.lockinactivity", true);
pref("extensions.masterPasswordPlus.lockrestore", true);
pref("extensions.masterPasswordPlus.lockhidetitle", true);
pref("extensions.masterPasswordPlus.logouthotkey", "ALT L");
pref("extensions.masterPasswordPlus.logouthotkeyenabled", 1);
pref("extensions.masterPasswordPlus.lockhotkey", "ALT K");
pref("extensions.masterPasswordPlus.lockhotkeyenabled", 1);
pref("extensions.masterPasswordPlus.lockwinhotkey", "ACCEL ALT K");
pref("extensions.masterPasswordPlus.lockwinhotkeyenabled", 1);
pref("extensions.masterPasswordPlus.locklogouthotkey", "ALT SHIFT L");
pref("extensions.masterPasswordPlus.locklogouthotkeyenabled", 1);
pref("extensions.masterPasswordPlus.lockincorrect", 3); //lock after NN incorrect password attempts
pref("extensions.masterPasswordPlus.identify", ""); //MP prompt identification string
pref("extensions.masterPasswordPlus.lockminimize", false); //minimize on lock
pref("extensions.masterPasswordPlus.lockminimizeblur", true); //minimize on lock only when not in focus
pref("extensions.masterPasswordPlus.command", 0); //0=loging/logout; 1=lock window; 2=lock all windows; 3=lock all windows and logout
pref("extensions.masterPasswordPlus.commandloggedin", true); //use command only when logged in
pref("extensions.masterPasswordPlus.logoutonminimize", false); //logout on minimize
pref("extensions.masterPasswordPlus.lockonminimize", 0); //lock on minimize


//hidden settings
pref("extensions.masterPasswordPlus.showchangeslog", true); //show changes log after each update
pref("extensions.masterPasswordPlus.nonlatinwarning", 2); //show warning icon when used non-latin letter in the password (0=off, 1=always, 2=full screen only)
pref("extensions.masterPasswordPlus.showlang", 2); //show current keyboard language (windows only)(0=off, 1=always, 2=full screen only)
pref("extensions.masterPasswordPlus.noworkaround", ""); //list of work around of conflicts with other extensions to ignore, separate by comma. Available: AeroBuddy
pref("extensions.masterPasswordPlus.locktransparent", true); //windows vista/7 aero transparency of locked windows
pref("extensions.masterPasswordPlus.lockbgimage", true); //show locked background image?
pref("extensions.masterPasswordPlus.hidenewmailalert", true); //hide new email alert box (TB only)
pref("extensions.masterPasswordPlus.hidenewmailballoon", true); //hide new email balloon popup (TB only)
pref("extensions.masterPasswordPlus.forceprompt", '[{"name":"PassHash","url":"chrome://passhash/content/passhash-dialog.xul"},{"name":"FireFTP","url":"chrome://fireftp/content/fireftp.xul"},{"name":"SessionManager","url":"chrome://sessionmanager/content/session_prompt.xul"}]'); //force MP login before listed windows opened. separate by space

//internal settings, do not change
pref("extensions.masterPasswordPlus.locked", false);
pref("extensions.masterPasswordPlus.version", "firstinstall");
