Components.utils.import("resource://cwh/ChaikaP2Login.js");

var func = startup.toString();
func = func.replace(
	'os.addObserver(FormPage.beLoginObserver, "ChaikaBeLogin:Logout", false);',
	'os.addObserver(FormPage.beLoginObserver, "ChaikaBeLogin:Logout", false);\
	os.addObserver(FormPage.p2LoginObserver, "ChaikaP2Login:Login", false);\
	os.addObserver(FormPage.p2LoginObserver, "ChaikaP2Login:Logout", false);'
);
eval('startup = ' + func);

var func = shutdown.toString();
func = func.replace(
	'os.removeObserver(FormPage.beLoginObserver, "ChaikaBeLogin:Logout");',
	'os.removeObserver(FormPage.beLoginObserver, "ChaikaBeLogin:Logout");\
	os.removeObserver(FormPage.p2LoginObserver, "ChaikaP2Login:Login");\
	os.removeObserver(FormPage.p2LoginObserver, "ChaikaP2Login:Logout");'
);
eval('shutdown = ' + func);

var func = FormPage.pageShow.toString();
func = func.replace(
	'this._beCheck = document.getElementById("beCheck");',
	'this._beCheck = document.getElementById("beCheck");\
	this._p2Check = document.getElementById("p2Check");'
).replace(
	'this._beCheck.checked = ChaikaBeLogin.isLoggdIn();',
	'this._beCheck.checked = ChaikaBeLogin.isLoggdIn();\
	this._p2Check.checked = ChaikaP2Login.isLoggedIn() ? ChaikaP2Login.enabled : false;'
).replace(
	/if\s*\(gWizType\s*==\s*WIZ_TYPE_RES\)\s*{/,
	'if(gWizType == WIZ_TYPE_RES){\
		if(ChaikaP2Login.enabled)\
			gPost = new PostP2(gThread, gBoard);\
		else'
);
eval('FormPage.pageShow = ' + func);

FormPage.toggleP2Login = function FormPage_toggleP2Login(){
	var p2Checked = FormPage._p2Check.checked;
	if(p2Checked){
		FormPage._p2Check.checked = false;

		if(ChaikaP2Login.isLoggedIn()){
			ChaikaP2Login.enabled =
			FormPage._p2Check.checked = true;
			FormPage.gPostReset(true);
		}else{
			ChaikaP2Login.login();
		}
	}else{
		ChaikaP2Login.enabled =
		FormPage._p2Check.checked = false;
		FormPage.gPostReset(false);
	}
};

FormPage.p2LoginObserver = {
	observe: function(aSubject, aTopic, aData){

		//ログイン成功時
		if(aTopic == "ChaikaP2Login:Login" && aData == "OK"){
			ChaikaP2Login.enabled =
			FormPage._p2Check.checked = true;
			FormPage.gPostReset(true);

			if(ChaikaP2Login.resubmit){
				ChaikaP2Login.resubmit = false;
				var title   = FormPage._titleForm.value;
				var name    = FormPage._nameForm.value;
				var mail    = FormPage._mailForm.value;
				var message = FormPage._messeageForm.value;

				if(FormPage._sageCheck.checked){
					if(mail == ""){
						mail = "sage";
					}else if(mail.toLowerCase().indexOf("sage") == -1){
						mail += " sage";
					}
				}

				gPost.setPostData(title, name, mail, message);
				gPost.submit(SubmitPage);
			}
		}

		//ログイン失敗
		if(aTopic == "ChaikaP2Login:Login" && aData == "NG"){
			alert("p2.2ch.netへのログインに失敗しました。\n" +
					"ID と パスワードを確認してください。");
			ChaikaP2Login.enabled = 
			FormPage._p2Check.checked = false;
		}

		//ログアウト
		if(aTopic == "ChaikaP2Login:Logout" && aData == "OK"){
			ChaikaP2Login.enabled = 
			FormPage._p2Check.checked = false;
			FormPage.gPostReset(false);
		}
	}
};

//gPostResetをp2, JBBSなどに対応するよう上書きする
FormPage.gPostReset = function FormPage_gPostReset(useP2){
	gPost = null;
	
	if(useP2){
		if(gWizType == WIZ_TYPE_RES)
			gPost = new PostP2(gThread, gBoard);
		else
			gPost = new Post2chNewThreadP2(gBoard);
	}else{
		if(gWizType == WIZ_TYPE_RES){
			switch(gBoard.type){
				case ChaikaBoard.BOARD_TYPE_2CH:
					gPost = new Post(gThread, gBoard);
					break;
				case ChaikaBoard.BOARD_TYPE_JBBS:
					gPost = new PostJBBS(gThread, gBoard);
					break;
				case ChaikaBoard.BOARD_TYPE_MACHI:
					gPost = new PostMachi(gThread, gBoard);
					break;
				default:
					gPost = null;
			}
		}else if(gWizType == WIZ_TYPE_NEW_THREAD){
			if(gBoard.type == ChaikaBoard.BOARD_TYPE_JBBS)
				gPost = new PostJBBSNewThread(gBoard);
			else
				gPost = new Post2chNewThread(gBoard);
		}
	}
};

//再送信時にp2をログインし直すようにする
var func = SubmitPage.reSubmit.toString();
func = func.replace(
	'gPost.submit(this);',
	'if(ChaikaP2Login.enabled){\
		ChaikaP2Login.resubmit = true;\
		ChaikaP2Login.logout();\
		ChaikaP2Login.login();\
	}else{\
		gPost.submit(this);\
	}'
);
eval('SubmitPage.reSubmit = ' + func);
