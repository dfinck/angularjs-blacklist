angularjs-blacklist
===================

Blacklist for input fields in forms in AngularJS.

You can check if a input contains a blacklisted text part and validate a form with this.


Usage
===================
 <form name='user'>
   <input blacklist ng-model='name' name='name'/>
   <div ng-show='user.name.$error.blacklist">Text is blacklisted</div>
 </form>



