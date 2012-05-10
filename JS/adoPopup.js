
// adoPopup, Version 0.1
// Copyright (c) May 10, 2012 adardesign.com
// adoPopup is freely distributable under the terms of an MIT-style license
// This means you are free to use the code, but please leave this copyright notice intact

adoPopup = {
	init: function() {
		var self = this;
		$(document).on("click", ".popup", function(e) {
			var jThis = $(this);
			if (jThis.closest(".popupContent").length) {
				self.nested(jThis);
				return false;
			}
			self.eleData = {
				jThis: jThis,
				href: jThis.attr("href"),
				title: jThis.attr("title"),
				rel: jThis.attr("rel"),
				callback: jThis.attr("data-callback"),
				callbackArgs: jThis.attr("data-callbackarguments") || "",
				options: jThis.attr("data-options")
			}
			self.buildFrags();
			return false
		})
	},
	properties: {
		popupPageFill: "popupPageFill",
		popupBorder: "popupBorder",
		popupContainer: "popupContainer",
		popupExit: "popupExit",
		popupHeader: "popupHeader",
		popupContent: "popupContent",
		nestedContainer: "nestedPopupContainer",
		nestedTitle: "nestedPopupTitle",
		nestedClose: "nestedPopupClose",
		nestedContent: "nestedPopupContent"
	},
	buildFrags: function() {
		var self = this;
		if (this.cachedFrags) {
			this.customize();
			return;
		}
		this.popupPageFill = $("<div class='" + this.properties.popupPageFill + "'>").on("click", $.proxy(self.close, self));
		this.popupBorder = $("<div/>");
		this.popupContainer = $("<div/>").addClass(this.properties.popupContainer);
		this.popupHeader = $("<h2/>").addClass(this.properties.popupHeader);
		this.popupExit = $("<div/>").addClass(this.properties.popupExit);
		this.popupContent = $("<div/>").addClass(this.properties.popupContent);
		this.popupPageFill.append(this.popupBorder);
		this.popupBorder.append(this.popupContainer);
		this.popupBorder.append(this.popupExit);
		this.popupContainer.append(this.popupHeader);
		this.popupContainer.append(this.popupContent);
		this.cachedFrags = true;
		this.customize();
	},
	isImage:function(url){
		return /(?:jpg|gif|png)/.test(url);
	},
	handleImage:function(){
		var self = this,
			imageTemplate = "<div class='imageWrapper'><img src='"+self.eleData.href+"'/></div>";
		
		self.popupContent.html(imageTemplate).addClass("loaded");
		self.callback();
		
	},

	customize: function() {
		this.popupBorder.removeAttr("class").addClass(this.properties.popupBorder + " " + (this.eleData.rel || ""));
		this.popupHeader.text(this.eleData.title || "");
		this.popupContent.removeClass("loaded");
		this.addToPage();
		this.fixPosition();
		this.show();
	},
	addToPage: function() {
		if($("."+this.properties.popupPageFill).length){
			return;
		} 

		$("body").append(this.popupPageFill);
	},
	fixPosition: function() {
		var viewPortHeight = self.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		if (viewPortHeight < 800) {
			this.popupBorder.addClass("viewPortLessThen800");
			
		}
		if (viewPortHeight < 650) {
			this.popupBorder.addClass("viewPortLessThen650");
		}
	},
	show: function() {
		var self = this;
		self.popupPageFill.fadeIn(300, function() {
			self.load();
		});
		$(document).on("keydown.adoPop", function(e) {
			((e.keyCode ? e.keyCode : e.which) === 27) && self.close(e);
		})
	},
	load: function(nested) {
		var self = this;
		
		// todo handle nested image
		if(self.isImage(self.eleData.href)){
			self.handleImage();
			return false;
		}
		
		
		$.ajax({
			url: !nested ? this.eleData.href : this.nested.eleData.href
		}).done(function(html) {
			if (nested) {
				self.nested.content.html(html).addClass("loaded");
				self.nestedCallback();
				return false
			}
			self.popupContent.html(html).addClass("loaded");
			self.callback();
		}).fail(function() {
			self.popupContent.html("<div class='errorLoadingPopup'> Sorry! The content of this popup failed to load</div>").addClass("loaded")
		})
	},
	close: function(e) {
		var target = $(e.target),
			self = this;
		if (self.hasNested) {
			if (e.type !== "keydown" && target.closest("." + self.properties.nestedContainer).length && !target.is("." + self.properties.nestedClose)) {
				return
			}
			self.nested.container.fadeOut(300, function() {
				self.nested.container.remove();
				self.hasNested = false;
				self.closeNested();
			})
			 if (!target.is("." + self.properties.popupExit)){ 
			 	return}
		}
		if (e.type !== "keydown" && target.closest("." + self.properties.popupBorder).length && !target.is("." + self.properties.popupExit)) {
			return;
		}
		this.popupPageFill.fadeOut(300, function() {
			self.popupContent.empty();
			$(document).off("keydown.adoPop");
		});
		self.hasNested = false;
		this.eleData = null;
	},
	callback: function() {
		var callback = this.nested.eleData.callback;
		$.isFunction(callback) && callback(this.eleData.callbackArgs);
	},
	hasNested: false,
	nested: function(ele) {
		this.hasNested = true;
		this.nested.eleData = {
			jThis: ele,
			href: ele.attr("href"),
			title: ele.attr("title"),
			rel: ele.attr("rel"),
			callback: ele.attr("data-callback"),
			callbackArgs: ele.attr("data-callbackarguments") || "",
			options: ele.attr("data-options")
		}
		this.buildNested();
	},
	buildNested: function() {
		var self = this;
		self.nested.container = $("<div/>").addClass(self.properties.nestedContainer);
		self.nested.content = $("<div/>").addClass(self.properties.nestedContent).css({
			maxHeight: $("." + self.properties.popupContent).css("maxHeight"),
			minHeight: $("." + self.properties.popupContent).css("height")
		});
		self.nested.close = $("<div/>").addClass(self.properties.nestedClose+" button button-gray").text("Back").on("click", $.proxy(self.close, self));
		self.nested.title = $("<h2/>").addClass(self.properties.nestedTitle).html(self.nested.eleData.title);
		self.nested.title.append(self.nested.close);
		self.nested.container.append(self.nested.title);

		
		self.nested.container.append(self.nested.content);
		self.popupContent.after(self.nested.container)
		self.nested.container.fadeIn(100);
		self.load("nested");
	},
	nestedCallback: function() {
		var callback = this.nested.eleData.callback;
		$.isFunction(callback) && callback(this.nested.eleData.callbackArgs);

	},
	closeNested: function() {}
}



