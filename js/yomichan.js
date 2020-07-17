//辞書の置き場
var DIC_URL = "chrome-extension://lib/kuromoji/dict/";
var ymcMain = {
	enabled : false,
	// tokenizerObjオブジェクト
	tokenizer : null,

	// 初期処理
	init : function() {
		// kuromoji初期化
		kuromoji.builder({
			dicPath : DIC_URL
		}).build(function(error, _tokenizer) {
			if (error != null) {
				console.log(error);
			}
			tokenizer = _tokenizer;
		});
		chrome.storage.local.get("yomichanEnabled", function(value) {
			ymcMain.enabled = value.yomichanEnabled;
			if (ymcMain.enabled === undefined) {
				ymcMain.enabled=true;
			}
			// アイコン設定
			ymcMain.setIcon();
		});

	},
	// クリックすると、有効／無効の設定
	onClicked : function(tab) {
		ymcMain.enabled = !ymcMain.enabled;
		chrome.storage.local.set({
			'yomichanEnabled' : ymcMain.enabled
		}, function() {
		});
		// アイコン設定
		ymcMain.setIcon();
		// 有効／無効の状態をcontentに送信する
		ymcMain.sendEnabled(tab.id);
	},
	onSelectionChanged : function(tabId) {
		// 有効／無効の状態をcontentに送信する
		ymcMain.sendEnabled(tabId);
	},
	// ブラウザ上に表示するアイコンを設定
	setIcon : function() {
		if (ymcMain.enabled) {
			chrome.browserAction.setIcon({
				path : "../img/yomichan_enable.png"
			});
		} else {
			chrome.browserAction.setIcon({
				path : "../img/yomichan_disable.png"
			});
		}
	},
	// 有効／無効の状態をcontentに送信する
	sendEnabled : function(tabId) {
		if (ymcMain.enabled) {
			chrome.tabs.sendMessage(tabId, {
				"type" : "enableYomichan"
			});
		} else {
			chrome.tabs.sendMessage(tabId, {
				"type" : "disableYomichan"
			});
		}
	},
	// ふりがなを付ける
	getFurigana : function(text, sendResponse) {
		var resultHtml = "";
		if (text == null || text == "") {
			return;
		}
		let hasResponse = false;
		text.split(/\r\n|\r|\n/).forEach(
				function(v, i) {
					// 行ごとに処理
					if (resultHtml != "") {
						resultHtml += "<br>";
					}
					if (v == null || v.trim() == "") {
						return;
					}
					// kuromojiで形態素解析を行う
					var tokens = tokenizer.tokenize(v);
					for (let i = 0; i < tokens.length; i++) {
						let token = tokens[i];
						// 対象単語
						let surfaceForm = token.surface_form;
						// 読み方
						let reading = token.reading;
						if (surfaceForm == null || surfaceForm == "") {
							continue;
						}
						if (reading != null && reading.trim() != "") {
							// 読み方が存在する場合、読み方をひらがなに変換
							var kana = kana2Hira(reading);
							if (kana != kana2Hira(surfaceForm)) {
								// ひらがなに変換する対象単語がふりがなの読み方と一緒でない（漢字である）場合、rubyタグを作成
								resultHtml += "<ruby><rb>" + surfaceForm
										+ "</rb><rp>(</rp><rt>&nbsp;" + kana
										+ "&nbsp;</rt><rp>)</rp></ruby>";
								hasResponse=true;
								continue;
							}
						}
						// 漢字以外の場合、そのまま文章に設定する
						resultHtml += surfaceForm;
					}
				});
		if (hasResponse) {
			// 作成したHTMLをcontentに返却する
			sendResponse(resultHtml);
		}
	}
}

// カタカナ⇒ふりがな
function kana2Hira(str) {
	return str.replace(/[\u30a1-\u30f6]/g, function(match) {
		var chr = match.charCodeAt(0) - 0x60;
		return String.fromCharCode(chr);
	});
}