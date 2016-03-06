<i>Current version has an issue that prevents Firefox from unlocking, nothing happens when it's locked and user click or presses a button.
As a work around this issue, press CTRL+N to open new window, then you'll be able unlock it.
As of now I'm struggling to find what causing this. I need your help:
http://goo.gl/waq6w</i>


<b> Features:</b>
<ul>
<li> Ability to enable or disable timeout
<li> Toolbar, addressbar and statusbar icons
<li> Icons are dynamic and represent current state of master password, such as locked/unlocked or unset
<li> Options to hide the icons and/or menu items
<li> Set options directly from "Change Master Password" window
<li> Lock application on demand or with timer
<li> Two different timers for logout and lock
<li> Hotkey to logout/login master security device (default: ALT + L)
<li> Hotkey to lock application and/or individual windows (default: ALT + SHIFT + L and CTRL + ALT + SHIFT + L)
<li> Easy access to options or set/change master password via right click on toolbar/statusbar icons or tools menu
<li> Option to prompt master password on startup (work around for <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=536140" target="_blank">Bug 536140</a> which prompts multiple times for master password on startup).
<li> Option to suppress all or duplicate master password prompt popups (added in v1.2.20101212) (Note: when prompts are suppressed, they are actually being canceled. This means whatever requested master password will be notified as if user canceled the prompt, this might bring unexpected results.)
<li> Temporary suppress MP prompts
<li> Audio and icon blinking notifications when MP prompt was suppressed
<li> Notification bar when MP suppressed
<li> Lock application after <i>NN</i> incorrect entered passwords
<li> Logout / lock application (or single window) on minimize
<li> Support for Thunderbird
</ul>


<b>NOTE</b>
There is a little inconvenience if MP+ set to block master password prompts - it will block them by canceling them before they appear on screen. Because of that if you open a web page that has login/autofill form and required master password, you'll need manually login via MP+ <b>and refresh the page</b> to get the available login information for the login/autofill form. The same thing applied to any other extensions, option windows, etc that use protect by master password data - if it's a window, you'll need reopen the window after you manually logged in with master password.


<b>Disclaimer</b>
This addon is not a replacement for built-in master password, it's an enhancement for it. It also cannot guarantee total protection, simply because anyone can disable it even without starting the browser.
Disabling or uninstalling this addon will NOT delete your master password!
You can find more about master password <a href="http://kb.mozillazine.org/Master_password">http://kb.mozillazine.org/Master_password</a>



<b><strong>Please report bugs and feature requests at <a href="http://goo.gl/d3xyv" target="_blank">http://goo.gl/d3xyv</a> or via email in the support section of addon page (<a href="http://goo.gl/Ipdep" target="_blank">http://goo.gl/Ipdep</a>)

<i>Bug reports or feature requests posted in review sections will be ignored and may be reported as spam.<i></strong></b>