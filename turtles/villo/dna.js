(function($) {
	
	var collection = Backbone.Collection.extend({
		initialize : function(models, options) {
			// prevents loss of 'this' inside methods
			_.bindAll(this, "refresh");

			// bind refresh
			this.bind("born", this.refresh);
			this.bind("refresh", this.refresh);

			// default error value
			options.error = false;

			// automatic collection refresh each minute, this will 
			// trigger the reset event
			refreshInterval = window.setInterval(this.refresh, 60000);
		},
		refresh : function() {
			var self = this;
			self.fetch({
				error : function() {
					// will allow the view to detect errors
					self.options.error = true;

					// if there are no previous items to show, display error message
					if(self.length == 0)
						self.trigger("reset");
				}
			});
		},
		url : function() {
            var latitude = this.options.location.split(';')[0];
            var longitude = this.options.location.split(';')[1];
        
            return "http://data.irail.be/Bikes/Villo.json?lat=" + encodeURIComponent(latitude) + "&long=" + encodeURIComponent(longitude) + "&offset=0&rowcount=1";
		},
		parse : function(json) {
            var villo = json.Villo;
            
            if (villo.length <= 0) {
                return undefined;
            }
            
            for(var i in villo) {
                villo[i].distance = Math.round(parseInt(villo[i].distance)/10)*10;
                
                var name = jQuery.trim(villo[i].name);
                name = name.match(/^[0-9]+\s*-\s*(.*?)(?:[\/|:](.*))?$/)[1];
				villo[i].name = this.capitalizeWords(name);
            }
            
            return villo;
		},
		capitalizeWords: function (strSentence) {
			return strSentence.toLowerCase().replace(/\b[a-z]/g, convertToUpper);

			function convertToUpper() {
				return arguments[0].toUpperCase();
			}
		}
	});

	var view = Backbone.View.extend({
		initialize : function() {
			// prevents loss of 'this' inside methods
			_.bindAll(this, "render");
			
			// bind render to collection reset
			this.collection.bind("reset", this.render);

			// pre-fetch template file and render when ready
			var self = this;
			if (this.template == null) {
				$.get("turtles/villo/views/list.html", function(template) {
					self.template = template;
					self.render();
				});
			}
		},
		render : function() {
			// only render when template file is loaded
			if (this.template && this.collection.length) {
			
				var data = this.collection.toJSON()[0];
				data.error = this.options.error; // have there been any errors?
				
				// add html to container
				this.$el.html(Mustache.render(this.template, data));
			}
		}
	});

	// register turtle
	Turtles.register("villo", {
		collection : collection,
		view : view
	});

})(jQuery);