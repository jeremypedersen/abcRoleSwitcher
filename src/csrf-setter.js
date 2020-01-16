// FIXME: Dependency on AWS specific query selector (form)
setTimeout(function(){
  var csrf = abc.Auth.getMbtc();
  var forms = document.querySelectorAll('#abc-username-menu-recent-roles form');
  for (var i = 0, len = forms.length; i < len; i++) {
    forms[i].csrf.value = csrf;
  }
}, 200);
