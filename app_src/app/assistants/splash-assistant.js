function SplashAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
    this.currentStageControl = argFromPusher;
}
    

SplashAssistant.prototype.setup = function() {		
        /* this function is for setup tasks that have to happen when the scene is first created */
    
    // Setup application menu
    this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.MenuAttr, StageAssistant.appMenuModel);
    
    // setup start game button
    this.buttonModel1 = {
	buttonLabel : 'Start new game!',
	buttonClass : 'affirmative',
	disable : false
    };
    this.buttonAtt1 = {
	//type : 'Activity'
    };
    this.controller.setupWidget('start_game_button',this.buttonAtt1,this.buttonModel1);
    
    // setup game difficulty slider
    this.sliderModel = {
	value: this.currentStageControl.difficultyLevel,
        disabled: false
    };
    this.controller.setupWidget("splash_slider",
        this.attributes = {
            minValue: 0,
            maxValue: 100
        },
        this.sliderModel
    );
    
    // Setup game mode widget  
    this.gameModeModel = {
	choices: this.currentStageControl.gameModeList,
	value: this.currentStageControl.gameMode,
	disabled: false
    };
    this.controller.setupWidget('splash_gameModeSelector',
	this.attributes = {
	    label: $L('Game mode')
	},
	this.gameModeModel
    );
    
    // Setup background colour widget  
    this.bgColourModel = {
	choices: this.currentStageControl.colourList,
	value: this.currentStageControl.colourDefault,
	disabled: false
    };
    this.controller.setupWidget('splash_bgSelector',
	this.attributes = {
	    label: $L('Background')
	},
	this.bgColourModel
    );
    
    // setup event listeners
    this.handleButtonPressBinder = this.handleButtonPress.bind(this);
    Mojo.Event.listen(this.controller.get('start_game_button'),Mojo.Event.tap, this.handleButtonPressBinder);
    
    this.handleSliderChangeBinder = this.handleSliderChange.bind(this);
    Mojo.Event.listen(this.controller.get('splash_slider'), Mojo.Event.propertyChange, this.handleSliderChangeBinder);
    
    this.handleGameSelectorBinder = this.handleGameSelectorChange.bind(this);
    Mojo.Event.listen(this.controller.get('splash_gameModeSelector'), Mojo.Event.propertyChange, this.handleGameSelectorBinder);
    
    this.handleBackgroundSelectorBinder = this.handleBackgroundSelectorChange.bind(this);
    Mojo.Event.listen(this.controller.get('splash_bgSelector'), Mojo.Event.propertyChange, this.handleBackgroundSelectorBinder);
};

SplashAssistant.prototype.activate = function(){
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */
    Mojo.Event.listen(this.controller.get('start_game_button'),Mojo.Event.tap, this.handleButtonPressBinder);
    Mojo.Event.listen(this.controller.get('splash_slider'), Mojo.Event.propertyChange, this.handleSliderChangeBinder);
    Mojo.Event.listen(this.controller.get('splash_gameModeSelector'), Mojo.Event.propertyChange, this.handleGameSelectorBinder);
    Mojo.Event.listen(this.controller.get('splash_bgSelector'), Mojo.Event.propertyChange, this.handleBackgroundSelectorBinder);
};


SplashAssistant.prototype.deactivate = function() {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
    Mojo.Event.stopListening(this.controller.get('start_game_button'),Mojo.Event.tap, this.handleButtonPressBinder);
    Mojo.Event.stopListening(this.controller.get('splash_slider'), Mojo.Event.propertyChange, this.handleSliderChangeBinder);
    Mojo.Event.stopListening(this.controller.get('splash_gameModeSelector'), Mojo.Event.propertyChange, this.handleGameSelectorBinder);
    Mojo.Event.stopListening(this.controller.get('splash_bgSelector'), Mojo.Event.propertyChange, this.handleBackgroundSelectorBinder);
};

SplashAssistant.prototype.cleanup = function() {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
    Mojo.Event.stopListening(this.controller.get('start_game_button'),Mojo.Event.tap, this.handleButtonPressBinder);
    Mojo.Event.stopListening(this.controller.get('splash_slider'), Mojo.Event.propertyChange, this.handleSliderChangeBinder);
    Mojo.Event.stopListening(this.controller.get('splash_gameModeSelector'), Mojo.Event.propertyChange, this.handleGameSelectorBinder);
    Mojo.Event.stopListening(this.controller.get('splash_bgSelector'), Mojo.Event.propertyChange, this.handleBackgroundSelectorBinder);
};

SplashAssistant.prototype.handleButtonPress = function(event){
    
	// push the game scene on the scene stack
	this.controller.stageController.pushScene({name: 'game'}, this.currentStageControl);
};

SplashAssistant.prototype.handleSliderChange = function(event) {
    
    // save the difficulty level
    this.currentStageControl.difficultyLevel = this.sliderModel.value;
    
    // save settings
    this.currentStageControl.saveSettings();
};

SplashAssistant.prototype.handleGameSelectorChange = function(event){
    
    // update background
    this.currentStageControl.gameMode = event.value;
    
    // save settings
    this.currentStageControl.saveSettings();
};

SplashAssistant.prototype.handleBackgroundSelectorChange = function(event){
    
    // update background
    this.currentStageControl.setBackground(event.value);
    
    // save settings
    this.currentStageControl.saveSettings();
};