if (mapaPlus.core.prefSuppress == 2 && mapaPlus.core.status == 2)
{
	var b = mapaPlus.core.dialogForce, ok = false;
	mapaPlus.core.dialogForce = true;
	try
	{
		mapaPlus.core.tokenDB.login(false);
		ok = true;
	}catch(e){}
	mapaPlus.core.dialogForce = b;
	if (!ok)
	{
		window.close();
	}
}