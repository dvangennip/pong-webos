/*
    Pong for webOS
    Doménique van Gennip / domo@sinds1984.nl / www.sinds1984.nl
    
    Copyright (C) 2010-2011 - Creative Commons - Attribution-NonCommercial 3.0 Unported
    
    You are free:
    * to Share - to copy, distribute and transmit the work
    * to Remix - to adapt the work

    Under the following conditions:
    * Attribution - You must attribute the work in the manner specified by the author or licensor (but not in any way that suggests that they endorse you or your use of the work).
    * Noncommercial - You may not use this work for commercial purposes.
    
    ---------------------------------------------------------------
    
    Uses code and principes of Far Out Owl by Frank W. Zammetti
    See for a tutorial: http://developer.palm.com/index.php?id=1987&option=com_content&view=article

    Far Out Owl is licensed under the terms of the MIT license as follows:

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to
    deal in the Software without restriction, including without limitation the
    rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM,OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.
*/

function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */
    
    // Initialise settings cookie
    this.settingsCookie = new Mojo.Model.Cookie(StageAssistant.kCookieKey);
    // Get settings
    this.getSettings();
    
    // setup background colour according to defaults
    this.setBackground();
    
    // push the splash scene, including a reference to this stage controller
    this.controller.pushScene({name: 'splash'}, this);
};

StageAssistant.prototype.handleCommand = function(event) {
    
    //var currentStageControl = Mojo.Controller.appController.getActiveStageController();
    //var currentScene = Mojo.Controller.stageController.activeScene();
    
    if (event.type === Mojo.Event.command) {
	switch(event.command) {
	    case 'do-game':
		this.controller.pushScene({name: 'game'}, this);
	    break;
	    case 'do-appHelp':
		// show about info + add reference to this stage controller instance
		// if already open just pop down to there, do not open a new card on top
		if (this.aboutCardOpen) {
		    this.controller.popScenesTo('help');
		} else {
		    this.controller.pushScene({name: 'help'}, this);
		}
	    break;
	}
    }
};

StageAssistant.prototype.setBackground = function(colourNumber) {
    
    // save the new number as default
    if (colourNumber >= 0) {
	this.colourDefault = colourNumber;
    }
    
    // set colour variables
    this.backgroundColour = this.colourList[ this.colourDefault ].background;
    this.foregroundColour = this.colourList[ this.colourDefault ].foreground;
    this.textColour = this.colourList[ this.colourDefault ].text;
    this.effectsColour = this.colourList[ this.colourDefault ].effects;
    
    // set html body background colour
    // if black or white, just set a white background
    // black text and GUI elements on black background does not work well
    if (colourNumber < 2) {
	this.controller.get('app_body').setStyle({'background-color': 'rgb(255,255,255)'});
    } else {
	this.controller.get('app_body').setStyle({'background-color': this.backgroundColour});
    }  
};

/*
 * STORAGE AND RETRIEVAL FUNCTIONS GO HERE --------------------------
 */

/* Gets a cookie with the app settings
 * if unavailable it reverts to the default settings
 */
StageAssistant.prototype.getSettings = function() {
	
	// this.settingsCookie is already initialised
	// test cookie
        if (!this.settingsCookie) {                                 
                Mojo.Log.error("*** Unable to access settings cookie.");
		// revert to defaults
		this.defaultSettings();
                return;                                                     
        } else {
		// feed setings with cookie
		this.values = this.settingsCookie.get();
                if (this.values) {
			this.gameMode = this.values.game;
			this.difficultyLevel = this.values.dif;
			this.colourDefault = this.values.colour;
                        return;
                } else {
			// revert to defaults
			this.defaultSettings();
		}
	} 
};

/* reverts settings to default settings */
StageAssistant.prototype.defaultSettings = function() {
	
	//Mojo.Log.info("*** ... reverting to default settings");
	this.gameMode = 0;
	this.difficultyLevel = 40;
	this.colourDefault = 4;
	// save the settings
	this.saveSettings();
};

StageAssistant.prototype.saveSettings = function() {
	/* saves a cookie with the app settings */

	// this.settingsCookie is already initialised
	// get settings
	this.values = {game: this.gameMode, dif: this.difficultyLevel, colour: this.colourDefault};
	// test cookie for availability
	if (!this.settingsCookie) {                                         
                Mojo.Log.error("*** Unable to access settings cookie."); 
        } else {
		//Mojo.Log.info("*** saving settings");
                this.settingsCookie.put(this.values);                       
        } 
};

StageAssistant.kCookieKey = "pongS84settings"; 

/* GLOBAL VARIABLES */

StageAssistant.MenuAttr = {omitDefaultItems: true};

StageAssistant.appMenuModel = {
        visible: true,
        items: [
		Mojo.Menu.editItem,
		{label: $L('Help'), command: 'do-appHelp', disabled: false}
	    ]
};

StageAssistant.prototype.aboutCardOpen = false;

// Settings variables
StageAssistant.prototype.gameMode = 0;
StageAssistant.prototype.difficultyLevel = 40;
StageAssistant.prototype.colourDefault = 4;

StageAssistant.prototype.gameModeList = [
    {
	value: 0,
	label: $L('Classic')
    },
    {
	value: 1,
	label: $L('Last Paddle Standing')
    }
];

StageAssistant.prototype.backgroundColour = "rgb(90,128,255)"; // default
StageAssistant.prototype.foregroundColour = "rgb(0,0,0)"; // default
StageAssistant.prototype.textColour = "rgb(255,255,255)"; // default
StageAssistant.prototype.effectsColour = "rgb(255,0,0)"; // default
StageAssistant.prototype.colourList = [
    {
	value: 0,
	label: $L('White'),
	secondaryIcon: 'white',
	background: "rgb(255,255,255)",
	foreground: "rgb(0,0,0)",
	text: "rgb(128,128,128)",
	effects: "rgb(255,0,0)"
    },
    {
	value: 1,
	label: $L('Black'),
	secondaryIcon: 'black',
	background: "rgb(0,0,0)",
	foreground: "rgb(255,255,255)",
	text: "rgb(200,200,200)",
	effects: "rgb(255,0,0)"
    },
    {
	value: 2,
	label: $L('Blue'),
	secondaryIcon: 'blue',
	background: "rgb(110,150,255)",
	foreground: "rgb(0,0,0)",
	text: "rgb(255,255,255)",
	effects: "rgb(255,0,100)"
    },
    {
	value: 3,
	label: $L('Green'),
	secondaryIcon: 'green',
	background: "rgb(146,255,83)",
	foreground: "rgb(0,0,0)",
	text: "rgb(255,255,255)",
	effects: "rgb(255,80,0)"
    },
    {
	value: 4,
	label: $L('Yellow'),
	secondaryIcon: 'yellow',
	background: "rgb(255,204,0)",
	foreground: "rgb(0,0,0)",
	text: "rgb(255,255,255)",
	effects: "rgb(255,0,0)"
    },
    {
	value: 5,
	label: $L('Orange'),
	secondaryIcon: 'orange',
	background: "rgb(255,120,0)",
	foreground: "rgb(255,255,255)",
	text: "rgb(255,255,255)",
	effects: "rgb(146,255,83)"
    },
    {
	value: 6,
	label: $L('Red'),
	secondaryIcon: 'red',
	background: "rgb(255,0,0)",
	foreground: "rgb(255,255,255)",
	text: "rgb(255,255,255)",
	effects: "rgb(255,255,0)"
    },
    {
	value: 7,
	label: $L('Pink'),
	secondaryIcon: 'pink',
	background: "rgb(255,90,180)",
	foreground: "rgb(255,255,255)",
	text: "rgb(255,255,255)",
	effects: "rgb(0,174,255)"
    }
];