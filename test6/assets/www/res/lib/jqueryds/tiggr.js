if (typeof setVariable == 'undefined' && typeof getVariable == 'undefined') {
	
	setVariable = function(name, value) {
		if (!value) {
			delete localStorage[name];
		} else {
			localStorage[name] = value || "";
		}
	};
	
	getVariable = function(name) {
		return localStorage[name];
	};
	
}