var parseerror =  undefined;
var usrName = undefined;
var password = undefined;
(function($, undefined) {
    $.fn.observer = function(xPath, attr, ds, pid,dsid) {
        if (xPath) {
            this.xPath = xPath;
            this.pid=pid;
            this.dsid=dsid;
            //TODO make refactoring here. rework notify call for working without attribute param
            // if (typeof attr !=='string' ) {
            //  this.attribute = "value";
            //  ds = attr;
            // } else {
            this.attribute = attr;
            // }
            if (ds) {
                ds.addObserver(this);
            }
        } else {
            $.log("Observer requires a dispatcher and xPath! Check your parameters");
        }
        this.notify = function(attrib, value) {
            var txt = String(value);
            //TODO remove this legacy case (attrib!='@')
            if ((attrib!=null) && (attrib!='@')) {
                this.attr(attrib, value);
            } else {
                $(this[0]).text(txt);
            }

        };
        return this;
    };
})(jQuery);
(function($, undefined) {
    $.fn.observable = function(xPath, attr, ds, pid) {
        if (xPath) {
            this.xPath = xPath;
            this.pid=pid;
            if (typeof attr !=='string' ) {
                this.attribute = "value";
                ds = attr;
            } 
            else {
                this.attribute = attr;
            }
            if (ds) {
                ds.addObservable(this);
            }

        } else {
            $.log("Observer requires a dispatcher and xPath! Check your parameters");
        }

        this.getAttribute = function() {
            return this.attr(this.attribute);
        }
        return this;
    };
})(jQuery);
(function($, undefined) {

    $.dispatcher = function(options) {
        var that = this, i;

        if (options) {
            $.extend( this.settings, options );
        }

        function init(options) {
            $.log("init dispatcher");
            var defaults = {
                dataType: 'json',
                //ajaxComplete: functiion ()
                cache: true,
                timeout: 50000,
                error: function(jqXHR, textStatus, errorThrown) {

                    // if (textStatus=="parsererror") {
                    //  this.success("error_handled");
                    // }
                    if (options.onError) {
                        options.onError(jqXHR, textStatus, errorThrown);
                    }
                },
                complete: function(jqXHR, textStatus) { 
                    if (options.onComplete) {
                        options.onComplete(jqXHR, textStatus);
                    }
                },
                configuration: undefined
            }
            var settings = $.extend({}, defaults, options )
            if (settings.configuration) {
                var observers = settings.configuration.observers;
                if (observers && observers.length) {
                    $.each(observers, function(i, item) {
                        if (!(item.SET)) {
                            that.addObserver($('*[dsid='+item.ID+']').observer((item.PATH).join('.'), item.ATTR));
                        } else {
                            var dsidz=[];
                            var pathz=[];
                            var parentz=[];
                            var attrz=[];
                            $.each(item.SET, function(i,setItem) {
                                //TODO change to commented for simple array's mode
                                //that.addObserver($('*[dsid='+setItem.ID+']').observer((item.PATH).join('.')+'.'+(setItem.PATH).join('.'), setItem.ATTR, null, item.ID));
                                dsidz[i]=setItem.ID;
                                pathz[i] = (item.PATH).join('.')+'[*].'+(setItem.PATH).join('.');
                                parentz[i] = item.ID;
                                attrz[i] = setItem.ATTR;

                            });
                            that.addObserver($('*[dsid='+dsidz[0]+']').observer(pathz, attrz, null, parentz, dsidz));
                        }
                    })
                }

                var observervable = settings.configuration.observables;
                if (observervable && observervable.length) {
                    $.each(observervable, function(i, item) {
                        if (!item.SET) {
                            if ((item.ID!=undefined) && ((item.ID).length>0)) {
                                that.addObservable($('*[dsid='+item.ID+']').observable( (item.PATH).join('.'), item.ATTR ));
                                if((item.HEADER!=undefined) && ((item.HEADER) === true)) {
									that.addHeader(item.PATH[0]);
								}                                
                            } else {
                            	that.addObservable($(document).observable((item.PATH).join('.'), item.ATTR));
                            	if((item.HEADER!=undefined) && ((item.HEADER) === true)) {
									that.addHeader(item.PATH[0]);
								}
                            }
                        } else {
                            $.each(item.SET, function(i,setItem) {
                                that.addObservable($('*[dsid='+setItem.ID+']').observable((item.PATH).join('.')+'.'+(setItem.PATH).join('.'), setItem.ATTR, null, setItem.ID));
                            });
                        }

                    })
                }
            }
            that.settings = settings;

            $.log("dispatcher initialized");
        }

        init(options);
    };
    $.extend($.dispatcher.prototype, {
        data: undefined,
        observers: [],
        observables: [],
        headers : [],

        serialize: function() {
            var result = [];
            $.each(this.observables, function(i,o) {
                if (!o.pid) {
                    if (o.attribute=='value') {
                        //TODO Remove as legacy code
                        if (o.xPath!='authName' && o.xPath!='authPassword') {
                            result.push({
                                'name':o.xPath,
                                /*Old version
                                 * 'value':o.getAttribute()
                                 * */
                                'value':$(o.selector).attr(o.attribute)
                            });
                        } 
                        else {
                            o.xPath=='authName'?usrName=o.getAttribute():password=o.getAttribute();
                        }
                    }
                    else if(o.attribute=='@') {
                        if (o.xPath!='authName' && o.xPath!='authPassword') {
                            result.push({
                                'name':o.xPath,
                                'value':$(o.selector).val().trim()
                            });
                        } 
                        else {
                            o.xPath=='authName'?$(o.selector).text():password=$(o.selector).text();
                        }     	
                    }
                    else {                   	
                    	 //need to get value from local storage
                        var value;
                        if(o.selector == '*[dsid=___local_storage___]') {
                        	value = localStorage.getItem(o.attribute)
                        	if (value == undefined) {
                        		//if value is absent in local_storage then put key as value
                        		value = o.attribute;
                        	}
                        }
                        //just pass from ATTR to value
                        else {
                        	value = o.attribute;
                        } 	
                        if (o.xPath!='authName' && o.xPath!='authPassword') {
                            result.push({
                                'name':o.xPath,
                                'value':value
                            });
                        } else {
                            o.xPath=='authName'?usrName=o.attribute:password=value;
                        }
                    }
                } 
                else {
                    arr=[];
                    var l=0;
                    var observedEl=$('*[dsid='+o.pid+l+']');
                    while (observedEl.length>0) {
                        arr.push({
                            'name':o.xPath+'['+l+']',
                            'value':observedEl[0].value
                        });
                        l++;
                        observedEl=$('*[dsid='+o.pid+l+']');
                    }
                    if (arr.length>0) {
                        result.push({
                            'name':o.xPath,
                            'value':arr.join(",")
                        });
                    }
                }
            });
            return jQuery.param(result);
        },
        //TODO remove thise function when refactoring
        test: function(options) {
            this.execute($.extend({}, {
                "success": function(data) {
                    $('#testDataDiv').html(JSON.stringify(data));
                }
            }, options));
        },
		beforeSend: function (xhr, settings) {
			var url = settings.url;
			var ind = url.indexOf('?');
			var newParams;
			var requestParams;
			var param;
			if(ind !== -1) {
				newParams = url.substr(ind+1);
				url = url.substr(0,ind);
				requestParams = newParams.split('&');
				newParams = '';
				for(o in requestParams) {
					param = requestParams[o].split("=");
					if( _.indexOf(settings.requestHeaders, param[0]) !== -1) {
						xhr.setRequestHeader(param[0], param[1]);
					} else {
						newParams += (newParams === '' ? '' : '&') + requestParams[o];
					}
				}
				settings.url = url;
				if(newParams !== '')
					settings.url += "?"+newParams;
			}
		},        
        execute: function(options) {
            var that = this;

            var params = {
                "success": function(data) {
                    $.type(data)=='object'?that.data=data:
                    that.data = eval("("+data+")");
                    //that.data = jResult;
                    $.each(that.observers, function(index, observer) {
                        if (!observer.pid) {
                            observer.notify(observer.attribute,jsonPath(that.data, observer.xPath));
                        } else {
                            var obs =  observer;
                            //var dsid=observer.attr('dsid');
                            var dsid=observer.dsid;
                            var template = $('*[dsid='+observer.pid[0]+']');
                            realParent = template[0].parentNode;
                            if (($(template[0]).is(":visible"))){ 
                            $(template[0]).toggle();
							}
                            that.clearScene($(template),observer.pid[0]);
                            $(template[0]).toggle();
                            $.each((jsonPath(that.data, observer.xPath[0])), function(i, value) {
                                newObs= template.clone();
                                realParent.appendChild(newObs[0]);
                                var normalPath;
                                $.each(dsid, function(l,currentDs) {
                                    normalPath = observer.xPath[l].replace('*',i);
                                    if (currentDs != undefined) {
                                    	if(currentDs == '___local_storage___') {
                                    		localStorage.setItem(observer.attribute[l], jsonPath(that.data, observer.xPath[l]));
                                    	}
                                    	else {
                                    		mapedElement = newObs[0].querySelector("*[dsid='"+currentDs+"']");
                                    		mapedElement=$(mapedElement);                                                                               
                                    		mapedElement.observer(normalPath,observer.attribute[l]);
                                    		mapedElement.attr('dsid',currentDs+"_"+i);
                                    		that.addObserver(mapedElement);
                                    		value = jsonPath(that.data, mapedElement.xPath);
                                    		if (value!==false) {
                                    			mapedElement.notify(observer.attribute[l],value);
                                    		} else {
                                    			realParent.removeChild(newObs[0]);
                                    		}
                                    	}
                                    }
                                    else {
                                    	$(newObs).prepend('<br>'+jsonPath(that.data, normalPath)+ '</br>');
                                    }
                                });
                            });
                            $(template[0]).toggle();
                        }
                    }//{"error": function() {
                    //  alert("err");
                    //
                    // }}
                    );
                    callback = that.settings.onSuccess;
                    if (callback && jQuery.isFunction(callback)) {
                        callback(data);
                    };
                }                
            };
            $.extend(params, that.settings, options);

            var req = this.serialize();
            if (req) {
                //TODO add here token.
                var templatePattern = /\{(.+?)\}/g;
				var variables = params.url.match(templatePattern);
				_.templateSettings = {interpolate : templatePattern};
                if(variables) {
					var requestParams = req.split('&');
					req='';
					var param;
					var changes = "";
					for(o in requestParams) {
						param = requestParams[o].split("=");
						if( _.indexOf(variables, '{' + param[0] + '}') !== -1) {
							changes += param[0] + ": '" +  param[1] + "',";
						} else {
							req += (req === '' ? '' : '&') + requestParams[o];
						}
					}
					var compiledTemplate = _.template(params.url);
					params.url = compiledTemplate(eval("({" + changes + "})"));
				}
                if(req !== '')
                	params.url += "?"+req;
            }
            if ((usrName ==undefined) && (password==undefined)) {
                if (this.settings.securityContext) {
                    this.settings.securityContext.invoke({
                        execute: function(params) {$.ajax(params);}
                    }, params);
                } else {
					$.extend(params, { beforeSend : that.beforeSend}, {requestHeaders: that.headers} );
                    $.ajax(params);
                }
            } else {
                //params.success(result);
                ajaxReplacer(params);
            }
        },
        clearScene: function(templates) {
            $.each(templates, function(i, templ) {
                if (templ.style.display!='none') {
                    $(templ).remove();
                } else {
                    //alert("template founded");
                }
            });
            //TODO change it
            /*z=parent.parentElement.querySelectorAll("*[dsid^='"+dsid+"']");
             parent.innerHTML='';
             parent.parentElement.appendChild(z[0]);
             */
        },
        addObserver: function(observer) {
            this.observers.push(observer);
        },
        removeObserver: function(xPath) {
            for(o in this.observers) {
                if (this.observers[o].xPath == xPath) {
                    this.observers.splice(a,1);
                }
            }
        },
        addObservable: function(observable) {
            this.observables.push(observable);
        },
        addHeader: function(item) {
            this.headers.push(item);
        },
        removeObservable: function(xPath) {
            for(o in this.observables) {
                if (this.observables[o].xPath == xPath) {
                    this.observables.splice(a,1);
                }
            }
        }
    });
    //TODO rewrite it in better way. КОСТЫЛЬ
    ajaxReplacer= function(params) {
        var authString = $.base64Encode(usrName+":"+password);
        var http = new XMLHttpRequest();
        var url = params.url;
        var data = "";
        http.open("GET", url, true);

        //Send the proper header information along with the request
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.setRequestHeader("Content-length", data.length);
        http.setRequestHeader("Connection", "close");
        http.setRequestHeader("Authorization", "Basic "+authString);

        http.onreadystatechange = function() {//Call a function when the state changes.
            if(http.readyState == 4 && http.status == 200) {
                params.success(http.responseText);
            }
        }
        http.send(data);

    } 
})(jQuery);
(function(a) {
    a.log= function() {
        if(window.console&&window.console.log) {
            console.log.apply(window.console,arguments)
        }
    };
    a.fn.log= function() {
        a.log(this);
        return this
    }
}
)(jQuery);
