/**
 * Blacklist-Input validator for AngularJS forms.
 *
 *
 * You can provide a list of blocked words which should be validated in a input field on a form.
 * You can aswell provide a list of whitelisted words which should be whitelisted even if the input
 * has been blacklisted before.
 *
 *
 *
 * Uses ngModel to validate the input field.
 *
 * @author: Sebastian Zillessen (sebastian@pfeffermind-games.de)
 * @version: 0.0.2
 *
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Sebastian Zillessen(sebastian@pfeffermind-games.de)
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *   THE SOFTWARE.
 */

'use strict';

angular.module('BlackList')
  .run(function () {
    if (!String.prototype.hashCode) {
      /**
       * Hash Code generation for strings
       * @returns {number}
       */
      String.prototype.hashCode = function () {
        var hash = 0;
        if (this.length == 0) return hash;
        for (var i = 0; i < this.length; i++) {
          var character = this.charCodeAt(i);
          hash = ((hash << 5) - hash) + character;
          hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
      }
    }
  }).

/**
 * BlackListValidator
 * @author: Sebastian Zillessen (sebastian@pfeffermind-games.de)
 * @version: 0.0.2
 *
 *
 * This service can be used to check if a string is blacklisted by a given blacklist.
 *
 * It checks as well if the word is not whitelisted by the whitelist.
 *
 * Interface:
 *
 * check (<string>) : return boolean (true if valid, false if invalid)
 */
  service('BlackListValidator', function ($log, $http) {
    /**
     * List for blacklisted words. Fill it by hand or use the 'blacklist.json' file
     * @type {Array} of strings
     */
    var blacklist = [];
    /**
     * Blacklist Regexp which is used to validate input
     * @type {RegExp}
     */
    var blacklistReg = new RegExp("", "i");
    /**
     * List for whitelisted words. Fill it by hand or use the 'blacklist.json' file
     * @type {Array} of strings
     */
    var whitelist = [];
    /**
     * Whitelist Regexp which is used to validate input
     * @type {RegExp}
     */
    var whitelistReg = new RegExp("", "i");


    /**
     * Load Blacklist from file. Structure should be
     * {blacklist: [], whitelist: []}
     */
    $http.get("data/blacklist.json", {cache: false}).success(function (res) {
      // import black and whitelist
      blacklist = blacklist.concat(res.blacklist || []);
      whitelist = whitelist.concat(res.whitelist || []);

      // update regexp
      blacklistReg = new RegExp("(?:" + blacklist.join("|") + ")", "i");
      whitelistReg = new RegExp("(?:" + whitelist.join("|") + ")", "i");

      // update local cached values
      checkedTerms = {};
    }).error(function () {
      log("Blacklist-File not found. Please ensure, that you have the file 'data/blacklist.json' present in your application root");
    });


    function log(t) {
      $log.info("[BlackListValidator] " + t);
    }

    /**
     * Already checked terms to speed up validation.
     * @type contains
     */
    var checkedTerms = {};


    /**
     * Checks if a given value is blacklisted by checking it against the blacklist and then
     * checking if the value is whitelisted.
     * @param value text which should be validated on blacklisting
     * @returns true: if value was not blacklisted or whitelisted
     *          false: if the value contains blacklisted words and is these are not whitelisted.
     */
    this.check = function (value) {
      if (!value || blacklist.length === 0)
        return true;
      var old = checkedTerms[value.hashCode()];
      if (old !== undefined) {
        log("Returning old cached value");
        return old;
      }
      else {
        var result = true;
        var blacklisted = blacklistReg.exec(value) !== null;
        if (blacklisted) {
          var whitelisted = whitelistReg.exec(value) !== null;
          result = whitelisted;
        }
        checkedTerms[value.hashCode()] = result;
        log("'" + value + "' : " + result ? 'blachlisted' : 'whitelisted');
        return result;
      }
    }
  })

/**
 * Directive to provide form validations for angularjs with blacklisted words.
 *
 * By adding the attribute 'blacklist' to any input field in a form you can validate the
 * model and get an attribute $error.blacklist on your model attribute if the text is invalid
 * because it has been blacklisted.
 *
 *
 * Example:
 * <form name='user'>
 *    <input blacklist ng-model='name' name='name'/>
 *    <div ng-show='user.name.$error.blacklist">Text is blacklisted</div>
 * </form>
 *
 * Basic Idea taken from: http://stackoverflow.com/questions/12581439/how-to-add-custom-validation-to-an-angular-js-form
 *
 * Thanks to blesh (http://stackoverflow.com/users/135786/blesh)
 *
 * @author: Sebastian Zillessen (sebastian@pfeffermind-games.de)
 * @version: 0.0.2
 */
  .directive('blacklist', function (BlackListValidator) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function postLink(scope, element, attrs, ngModel) {

        //For DOM -> model validation
        ngModel.$parsers.unshift(function (value) {
          var v = BlackListValidator.check(value);
          ngModel.$setValidity('blacklist', v);
          return v ? value : undefined;
        });

        //For model -> DOM validation
        ngModel.$formatters.unshift(function (value) {
          ngModel.$setValidity('blacklist', BlackListValidator.check(value));
          return value;
        });
      }
    };
  });
