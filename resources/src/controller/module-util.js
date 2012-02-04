//= require "init-module"
/*global controller: false */
(function (module) {
	module.util = {
        /**
         * see http://ajaxian.com/archives/uuid-generator-in-javascript
         **/
		randomUUID: function () {
			var s = [], itoh = '0123456789ABCDEF', i;
		
			for (i = 0; i < 36; i++) { 
				s[i] = Math.floor(Math.random() * 0x10); 
			}
		
			s[14] = 4;
			s[19] = (s[19] & 0x3) | 0x8;  
		
			for (i = 0; i < 36; i++) { s[i] = itoh[s[i]]; }

			s[8] = s[13] = s[18] = s[23] = '-';

			return s.join('');
		}
	};
}(controller));