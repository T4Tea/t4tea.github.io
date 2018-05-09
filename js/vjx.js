function clicktoplay(){
	var jx = document.getElementById("jx").value;
	var url = document.getElementById("url").value;
	document.getElementById("player").src = jx + url;
}