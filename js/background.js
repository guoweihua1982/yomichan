//辞書
var DIC_URL = "chrome-extension://lib/kuromoji/dict/";
// tokenizerObjオブジェクト
var tokenizer = null;
// kuromoji初期化
kuromoji.builder({
	dicPath : DIC_URL
}).build(function(error, _tokenizer) {
	if (error != null) {
		console.log(error);
	}
	tokenizer = _tokenizer;
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var resultHtml = "";
	if(request.selectionText==null || request.selectionText==""){
		return ;
	}
	request.selectionText.split(/\r\n|\r|\n/).forEach(function(v, i) {
		if (resultHtml != "") {
			resultHtml += "<br>";
		}
		if(v==null || v.trim()==""){
			return;
		}
		var tokens = tokenizer.tokenize(v);
		for (let i = 0; i < tokens.length; i++) {
			let token = tokens[i];
			let surfaceForm = token.surface_form;
			let reading = token.reading;
			if (surfaceForm == null || surfaceForm == "") {
				continue;
			}
			if (reading != null && reading.trim() != "") {
				var kana = kanaToHira(reading);
				if (kana != kanaToHira(surfaceForm)) {
					resultHtml += "<ruby><rb>" + surfaceForm
							+ "</rb><rp>(</rp><rt>&nbsp;" + kana
							+ "&nbsp;</rt><rp>)</rp></ruby>";
					continue;
				}
			}
			resultHtml += surfaceForm;
		}
	})
	sendResponse(resultHtml);
});
function kanaToHira(str) {
	return str.replace(/[\u30a1-\u30f6]/g, function(match) {
		var chr = match.charCodeAt(0) - 0x60;
		return String.fromCharCode(chr);
	});
}