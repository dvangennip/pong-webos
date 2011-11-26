function HelpAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
    
    currentStageControl = argFromPusher; // 'this' from StageAssistant
    currentStageControl.aboutCardOpen = true;
}  

HelpAssistant.prototype.setup = function() {		
        /* this function is for setup tasks that have to happen when the scene is first created */
	
    // Set title
    this.controller.get('main_header_title').update("Pong: Help &amp; Feedback");
    this.controller.get('main_header_subtitle').update("Version " + Mojo.Controller.appInfo.version + " (BETA)");
    
    // Make sure feedback submission response element is hidden
    // (nothing is submitted yet)
    $('fb_submit_response').hide();
    
    // Setup application menu
    this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.MenuAttr, StageAssistant.appMenuModel);
    
    // Setup App Catalog button
    this.openCatalogButton = this.controller.get('fb_openCatalogButton');
    this.openCatalogButtonModel = {
	buttonLabel : 'Place review in App Catalog',
	buttonClass : '',
	disable : true
    };
    this.openCatalogButtonAttr = {};
    this.controller.setupWidget('fb_openCatalogButton', this.openCatalogButtonAttr, this.openCatalogButtonModel);
    
    // Setup Mail feedback button
    this.openMailButton = this.controller.get('fb_openMailButton');
    this.openMailButtonModel = {
	buttonLabel : 'Send e-mail with feedback',
	buttonClass : '',
	disable : false
    };
    this.openMailButtonAttr = {};
    this.controller.setupWidget('fb_openMailButton', this.openMailButtonAttr, this.openMailButtonModel);
    
    // Setup feedback form
    
    // like / dislike radio buttons
    this.likeButtonModel = {
	value: 1,
	disabled: false
    };
    this.controller.setupWidget("fb_likeButton",
        this.attributes = {
            choices: [
                {label: "I like Pong", value: 1},
                {label: "I dislike Pong", value: 0}
            ]
        },
        this.likeButtonModel
    );
    
    // textfield
    this.textfieldModel = {
	value: "",
        disabled: false
    };
    this.controller.setupWidget("fb_textField",
        this.attributes = {
            hintText: $L("  ... because ..."),
	    inputName: 'fb_textfield',
            multiline: true,
            enterSubmits: false,
            focus: false
         },
         this.textfieldModel
    );
    
    // submit button
    // location for storing disabled state
    this.submitDisabled = false;
    this.submitButton = this.controller.get('fb_submitButton');
    this.submitButtonModel = {
	buttonLabel : 'Submit Your Feedback!',
	buttonClass : '',
	disable : false
    };
    this.submitButtonAttr = {
	type : Mojo.Widget.activityButton
    };
    this.controller.setupWidget('fb_submitButton',this.submitButtonAttr,this.submitButtonModel);
    
    // bind handlers for later use with event listeners
    this.handleOpenCatalogBind = this.handleOpenCatalog.bind(this);
    this.handleOpenMailBind = this.handleOpenMail.bind(this);
    this.handleFeedbackSubmitBind = this.handleFeedbackSubmit.bind(this);
    this.handleFeedbackSubmitResponseBind = this.handleFeedbackSubmitResponse.bind(this);
    this.stopSpinningButton = this.stopSpinningSubmitButton.bind(this);
    
    // make sure no element gets the initial focus
    this.controller.setInitialFocusedElement(null);
};

HelpAssistant.prototype.activate = function(event){
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */
    Mojo.Event.listen(this.controller.get('fb_openCatalogButton'), Mojo.Event.tap, this.handleOpenCatalogBind);
    Mojo.Event.listen(this.controller.get('fb_openMailButton'), Mojo.Event.tap, this.handleOpenMailBind);
    Mojo.Event.listen(this.controller.get('fb_submitButton'), Mojo.Event.tap, this.handleFeedbackSubmitBind);
};


HelpAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
    Mojo.Event.stopListening(this.controller.get('fb_openCatalogButton'), Mojo.Event.tap, this.handleOpenCatalogBind);
    Mojo.Event.stopListening(this.controller.get('fb_openMailButton'), Mojo.Event.tap, this.handleOpenMailBind);
    Mojo.Event.stopListening(this.controller.get('fb_submitButton'), Mojo.Event.tap, this.handleFeedbackSubmitBind);
};

HelpAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
    Mojo.Event.stopListening(this.controller.get('fb_openCatalogButton'), Mojo.Event.tap, this.handleOpenCatalogBind);
    Mojo.Event.stopListening(this.controller.get('fb_openMailButton'), Mojo.Event.tap, this.handleOpenMailBind);
    Mojo.Event.stopListening(this.controller.get('fb_submitButton'), Mojo.Event.tap, this.handleFeedbackSubmitBind);
    
    currentStageControl.aboutCardOpen = false;
};

/**
 * Handler opens the app catalog with focus on this app
 */
HelpAssistant.prototype.handleOpenCatalog = function(event) {
    // call to open app catalog
    this.goToAppCatalog();
};

/**
 *
 */
HelpAssistant.prototype.handleOpenMail = function(event) {
    // call to open a new mail card
    this.sendFeedbackOpenMail();
};

/**
 * handleFeedbackSubmit takes the form values and submits these to the developer
 */
HelpAssistant.prototype.handleFeedbackSubmit = function(event) {
    
    // set disabled state
    this.submitDisabled = true;
    
    // Provide feedback to user - by spinning button
    this.adjustSpinningButton();
    
    // begin sending code
    if (this.submitDisabled) {
	// push feedback to sinds1984.nl
	
	// gather data to send
	var feedback = {like: this.likeButtonModel.value, text: this.textfieldModel.value};
	
	$('fb_submit_response').hide(); // clear success on transmission
	$('fb_submit_response').removeClassName('feedback-success');
	$('fb_submit_response').removeClassName('feedback-warning');
	
	// send data
	// Be sure to stop spinner at some point, usually when some asynchronous results are returned
	//   \-- handled via callback argument
	this.sendFeedback(feedback, this.handleFeedbackSubmitResponseBind);
    }
};

/**
 * Callback function for feedback submit handler.
 * It displays the positive or negative success of submission,
 * plus stops the button from spinning.
 */
HelpAssistant.prototype.handleFeedbackSubmitResponse = function(success) {
    
    // stop the activity button from spinning
    this.stopSpinningSubmitButton();
    
    // give user feedback on success of feedback submission
    $('fb_submit_response').show();
    // success
    if (success === 0) {
	$('fb_submit_response').addClassName('feedback-success');
	$('fb_submit_response').update('Thank you for giving feedback!');
    }
    // ajax error
    else if (success === 2) {
	$('fb_submit_response').addClassName('feedback-warning');
	$('fb_submit_response').update('No internet connection was found, so your feedback could not be submitted.');
    }
    // no connectivity
    else {
	$('fb_submit_response').addClassName('feedback-warning');
	$('fb_submit_response').update('Sorry, your feedback could not be submitted.<br />Please try again later.');
    }
};

/**
 * Function stops the submit button from spinning, e.g. when data has succesfully been sent
 */
HelpAssistant.prototype.stopSpinningSubmitButton = function(event) {
   this.submitButton.mojo.deactivate();
   
    // Set disabled state now we're done
    this.submitDisabled = false;
    // update button
    this.adjustSpinningButton();
};

/**
 * Function updates the spinning button appearance and internal state
 */
HelpAssistant.prototype.adjustSpinningButton = function() {
    // set state
    this.submitButtonModel.disabled = this.submitDisabled;
    // update appearance
    this.submitButtonModel.buttonClass = (this.submitDisabled) ? 'negative' : '';
    this.submitButtonModel.label = (this.submitDisabled) ? "Submitting ..." : 'Submit Your Feedback!';
    this.controller.modelChanged(this.submitButtonModel);
};

/*
 * FEEDBACK RELATED FUNCTIONS GO HERE --------------------------
 */


/**
 * Function gets the device model, webOS and app version and sends it to a webserver
 *
 * Takes feedback object as paramter, and optionally a callback function
 */
HelpAssistant.prototype.sendFeedback = function(feedback, callback) {
    
    // check connectivity
    var connectivityRequest = this.controller.serviceRequest('palm://com.palm.connectionmanager', {
        method: 'getstatus',
        parameters: {},
        onSuccess: function (response) {
            var wifi = response.wifi;
            var wan = response.wan;
            var hasInternet = response.isInternetConnectionAvailable;
 
            if (hasInternet && (wifi.state === "connected" || wan.state === "connected")) {
		
		// create request URL
		var reqURL = "http://project.sinds1984.nl/cgi-bin/feedbackAdd.cgi?";
		reqURL += "a=1"; // internal app ID
		reqURL += "&d="+Mojo.Environment.DeviceInfo.modelName; // device type
		reqURL += "&dv="+Mojo.Environment.DeviceInfo.platformVersion; // device version
		reqURL += "&v="+Mojo.Controller.appInfo.version; // OS version
		reqURL += "&l="+feedback.like+"&t="+feedback.text; // feedback
		
		// send actual request via Ajax GET
		 var request = new Ajax.Request(reqURL, {
		    method: 'get',
		    onSuccess: function(response) {
			
			// check response code (0 means success)
			var success = false; // assume the worst
			// parse the response to get out the first integer, in base 10
			// e.g. a string like '0 blah' or '601 42' would become 0 and 601.
			if ( parseInt(response.responseText, 10) === 0) {
			    success = true;
			}
			
			// provide success / failure feedback to function
			if (callback) {
			    callback( 0 );
			}
		    },
		    onFailure: function(response, ex) {
			// exception occurred
			Mojo.Log.error("*** Feedback NOT sent: " + ex.message);
			
			// provide success / failure feedback to function
			if (callback) {
			    callback( 1 ); // ajax error
			}
		    }
		}); // end of Ajax request
            }
	    // else: no internet
	    else {
                if (callback) {
		    callback( 2 ); // no connectivity
		}
            }
        }.bind(this),
        onFailure: function(response) {
            if (callback) {
		callback( 2 ); // no connectivity determined
	    }
        }.bind(this)
    });
};

/**
 * Function opens the App Catalog if available on the device
 * Won't work on emulator
 * On 'no-paid apps' devices may show a blank screen if app is paid
 * 
 * Code comes from webos101.com/Code_Snippets
 */
HelpAssistant.prototype.goToAppCatalog = function(callback) {
 
    //var currentScene = Mojo.Controller.stageController.activeScene();
 
    var launchParams = {
        id: "com.palm.app.findapps",
        params: {'target': "http://developer.palm.com/appredirect/?packageid=nl.sinds1984.pong&applicationid=123"}
    };
 
    this.controller.serviceRequest('palm://com.palm.applicationManager', {
        method: 'open',
        parameters: launchParams
    });
};

/**
 * Function opens a new card to compose an e-mail message, with address filled in
 */
HelpAssistant.prototype.sendFeedbackOpenMail = function(callback) {
    
    //var currentScene = Mojo.Controller.stageController.activeScene();
    
    // open mail program
    var launchParams = {
        id: "com.palm.app.email",
        params: {
              summary: "Feedback on Pong for webOS",
              text: "",
              recipients: [{
                  type:"email",
                  role:1,
                  value:"feedback@sinds1984.nl",
                  contactDisplay:"Project84"
              }]
          }
    };
 
    this.controller.serviceRequest('palm://com.palm.applicationManager', {
        method: 'open',
        parameters: launchParams
    });
};