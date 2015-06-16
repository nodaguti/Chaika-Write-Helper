Components.utils.import("resource://chaika-modules/ChaikaCore.js");

var cwh_overlay = {

	init: function cwhOverlay_init(){
		document.getElementById("contentAreaContextMenu")
			.addEventListener("popupshowing", cwh_overlay.showContext, false);
		cwh_overlay.createContextMenu();
	},

	uninit: function cwhOverlay_uninit(){
		document.getElementById("contentAreaContextMenu")
			.removeEventListener("popupshowing", cwh_overlay.showContext, false);
	},

	showContext: function cwhOverlay_showContext(event){
		if(event.originalTarget.id != "contentAreaContextMenu") return;
		document.getElementById("cwh-context-menu").hidden = true;

		var _document = gContextMenu.target.ownerDocument;
		var _window = _document.defaultView;

		if(!_window.getSelection().toString() ||
			!ChaikaCore.pref.getBool('aa.show_context') ||
			(ChaikaCore.pref.getBool('aa.show_context_only_2ch') && _document.URL.indexOf('127.0.0.1')==-1)
		) return;

		document.getElementById("cwh-context-menu").hidden = false;
	},

	createContextMenu: function cwhOverlay_createContextMenu(){
		var contextPopup = document.getElementById("cwh-context-popup");

		var range = document.createRange();
		range.selectNodeContents(contextPopup);
		range.deleteContents();

		var aaDir = ChaikaCore.getDataDir();
		aaDir.appendRelativePath("AA");

		function appendSubDir(aParentNode, aCurrentDir){
			var aaExtReg = /\.aa\.xml$/i;
			var entries = aCurrentDir.directoryEntries.QueryInterface(Ci.nsIDirectoryEnumerator);
			while(true){
				var entry = entries.nextFile;
				if(!entry) break;

				if(entry.isDirectory()){
					var fileNode = document.createElement("menu");
					fileNode.setAttribute("label", entry.leafName);
					fileNode.setAttribute("path", entry.path);
					aParentNode.appendChild(fileNode);
					var popup = document.createElement('menupopup');
					fileNode.appendChild(popup);

					//新規
					var item = document.createElement('menuitem');
					item.setAttribute('label','新規作成');
					var tmp = (function(path, popup){
						return function(){
							var _window = gContextMenu.target.ownerDocument.defaultView;
							cwh_overlay.addFolder(path, _window, popup);
						};
					})(entry.path, popup);
					item.addEventListener('command', tmp, false);
					popup.appendChild(item);
					popup.appendChild(document.createElement('menuseparator'));

					appendSubDir(popup, entry);
				}else if(aaExtReg.test(entry.leafName)){
					if(aParentNode.getAttribute("label") != entry.leafName.replace(aaExtReg, "")){
						var fileNode = document.createElement("menuitem");
						fileNode.setAttribute("label", entry.leafName.replace(aaExtReg, ""));
						fileNode.setAttribute("path", entry.path);
						fileNode.addEventListener('command',function(e){
							var _window = gContextMenu.target.ownerDocument.defaultView;
							cwh_overlay.addAA(e.originalTarget.getAttribute('path'), _window);
						},false);
						aParentNode.appendChild(fileNode);
					}
				}
			}
			entries.close();
		}

		//新規
		var item = document.createElement('menuitem');
		item.setAttribute('label','新規作成');
		var tmp = (function(path, popup){
			return function(){
				var _window = gContextMenu.target.ownerDocument.defaultView;
				cwh_overlay.addFolder(path, _window, popup);
			};
		})('', contextPopup);
		item.addEventListener('command', tmp, false);
		contextPopup.appendChild(item);
		contextPopup.appendChild(document.createElement('menuseparator'));

		appendSubDir(contextPopup, aaDir);
	},

	addAA: function cwhOverlay_addAA(filePath, _window){
		var file = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(filePath);

		var aaListXML = ChaikaCore.io.readString(file, "UTF-8");
		var aaStr = _window.getSelection().toString();

		if(/\n/.test(aaStr)){
			//複数行の場合
			var title = prompt('AAのタイトルを入力して下さい','');
			if(title == null) return;
			if(title == '') title = '無題';
			aaListXML = aaListXML.replace('</aalist>',[
				'	<aa title="'+title+'"><![CDATA[',
				aaStr,
				'	]]></aa>',
				'</aalist>'
			].join('\n'));
		}else{
			//一行の場合
			aaListXML = aaListXML.replace('</aalist>',[
				'	<aa title="'+aaStr+'"/>',
				'</aalist>'
			].join('\n'));
		}

		if(ChaikaCore.pref.getBool("aa.confirm_before_save")){
			if(!confirm(title||aaStr + ' を本当に保存しますか?')) return;
		}

		ChaikaCore.logger.debug(filePath);
		ChaikaCore.io.writeString(file, 'UTF-8', false, aaListXML);
	},

	addFolder: function cwhOverlay_addFolder(path, _window, aParent){
		var title = prompt('フォルダのタイトルまたはパスを入力して下さい','');
		if(title == null) return;
		if(title == '') title = '名称未設定';

		var aaListXML = '<?xml version="1.0"?>\
<aalist>\
</aalist>';

		if(!path){
			var _file = ChaikaCore.getDataDir();
			_file.appendRelativePath("AA");
		}else{
			var _file = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);
			_file.initWithPath(path);
		}
		var file = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);
		file.setRelativeDescriptor(_file, unescape(encodeURIComponent(title+'.aa.xml')));

		if(file.exists()){
			var type = ChaikaCore.pref.getInt('aa.replace_file');

			if(type == 3){
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
								.getService(Components.interfaces.nsIPromptService);
				var flags = prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 +
							prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1 +
							prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_2;
				var check = {value: false};
				type = prompts.confirmEx(_window, 'Confirm', 'そのファイルは既に存在しています.\n上書きしますか?',
						flags, '上書き', '番号付加', '中止', '今後確認しない', check);

				if(check.value == true){
					ChaikaCore.pref.setInt('aa.replace_file', type);
				}
			}

			switch(type){
				case 0: break;
				case 1:
					//同名ファイルチェック modified by 189
					/* ***** saveFolderModoki.uc.xul:Alice0775 *****/
					// Since we're automatically downloading, we don't get the file picker's 
					// logic to check for existing files, so we need to do that here.
					//
					// Note - this code is identical to that in
					//   mozilla/toolkit/mozapps/downloads/src/nsHelperAppDlg.js.in
					// If you are updating this code, update that code too! We can't share code
					// here since that code is called in a js component.
					var collisionCount = 0;
					while (file.exists()) {
						collisionCount++;
						if (collisionCount == 1) {
							// Append "(2)" before the last dot in (or at the end of) the filename
							// special case .ext.gz etc files so we don't wind up with .tar(2).gz
//							if (file.leafName.match(/\.[^\.]{1,3}\.(gz|bz2|Z)$/i))
								file.leafName = file.leafName.replace(/\.[^\.]{1,3}\.([^\.]*)?$/i, "(2)$&");
//							else
//								file.leafName = file.leafName.replace(/(\.[^\.]*)?$/, "(2)$&");
						}else {
							// replace the last (n) in the filename with (n+1)
							file.leafName = file.leafName.replace(/^(.*\()\d+\)/, "$1" + (collisionCount+1) + ")");
						}
					}
					/* ***** end ***** */
					break;

				case 2: return;
			}
		}

		ChaikaCore.logger.debug(file.path);
		ChaikaCore.io.writeString(file, 'UTF-8', false, aaListXML);

		cwh_overlay.createContextMenu();
		if(ChaikaCore.pref.getBool('aa.create_and_save')) cwh_overlay.addAA(file.path, _window);
	}
};

window.addEventListener('load', cwh_overlay.init, false);
window.addEventListener('unload', cwh_overlay.uninit, false);
