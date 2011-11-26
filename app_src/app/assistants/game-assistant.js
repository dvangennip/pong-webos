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

function GameAssistant(argFromPusher) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
    
    this.currentStageControl = argFromPusher;
}

GameAssistant.prototype.setup = function() {		
        /* this function is for setup tasks that have to happen when the scene is first created */
    
    this.controller.enableFullScreenMode(true);
    
    // get colour constants
    this.backgroundColour = this.currentStageControl.backgroundColour;
    this.foregroundColour = this.currentStageControl.foregroundColour;
    this.textColour = this.currentStageControl.textColour;
    this.effectsColour = this.currentStageControl.effectsColour;
    
    // setup variables
    this.ctx = null;
    this.screenHeight = Mojo.Environment.DeviceInfo.screenHeight;
    this.screenWidth = Mojo.Environment.DeviceInfo.screenWidth;
    // TODO Pre3 does scaling so negate my own scaling for now...
    if (this.screenHeight > 480) {
	this.screenHeight = 480;
    }
    if (this.screenWidth > 320) {
	this.screenWidth = 320;
    }
    // TODO use another canvas for pre3
    if (Mojo.Environment.DeviceInfo.modelNameAscii.toLowerCase().indexOf('pre3') !== -1) {
	this.controller.get('mainCanvas480').addClassName('pre3');
    }
    
    // setup font sizes
    this.fontSmall = "normal normal bold " + Math.round(16 * (this.screenWidth/320)) + "pt prelude";
    this.fontMedium = "normal normal bold " + Math.round(20 * (this.screenWidth/320)) + "pt prelude";
    this.fontBig = "normal normal bold " + Math.round(30 * (this.screenWidth/320)) + "pt prelude";
    
    // setup ball launcher radius size resolution indepent
    this.launcherRadiusMax = Math.round(280 * (this.screenWidth/320));
    this.launcherRadiusFactor = Math.round( this.launcherRadiusMax / 70 );
    
    // get game mode
    // 0 - classic, 1 - last paddle standing
    this.gameMode = parseInt(this.currentStageControl.gameMode, 10);
    
    // get game difficulty level
    // convert from 0 <-> 100 range to -1.5 <-> 1.0
    this.gameDifficultyLevel = (this.currentStageControl.difficultyLevel / 40) - 1.5;
    // make it resolution independent
    this.gameDifficultyLevel = this.gameDifficultyLevel * (this.screenHeight/480);
    //Mojo.Log.info("*** "+this.gameDifficultyLevel);
    
    this.gameInProgress = false;
    this.gameIsPaused = true; // not playing now
    
    /**
     * The players descriptor objects.
     */
    this.playerOpponent = { x: null, width: null, widthLoss: null,
	score : 0, speed: null, moving: null,
	xAI: null, yAI: null, xPred: null, recentScore: 0,
	precision: null, sidesRisk: null };
    this.playerSelf = { x: null, width: null, widthLoss: null,
	score : 0, speed: null, moving: null, movement: 0, recentScore: 0 };

    /**
     * Object containing everything related to the ball.
     */
    var ballRadius = Math.round(11 * (this.screenWidth / 320));
    
    this.ball = { x: null, y: null, angle: null, speed: null, minSpeed: null, maxSpeed: null,
	radius: ballRadius, recentScore: null, nextSide: null, movingDown: null,
	debrisSize: 10 };
    
    // bind the main game loop for future referral
    this.mainLoopInterval = null;
    this.mainLoopBind = this.mainLoop.bind(this);
    
    // bind scene events
    this.stageDeactivateBind = this.stageDeactivate.bind(this);
    
    // bind user input events
    this.keyUpBind = this.keyUp.bind(this);
    this.keyDownBind = this.keyDown.bind(this);
    this.tapHandlerBind = this.tapHandler.bind(this);
    this.orientationChangeBind = this.orientationChange.bindAsEventListener(this);
};

GameAssistant.prototype.activate = function(){
	/* put in event handlers here that should only be in effect when this scene is active. For
	 example, key handlers that are observing the document */
    
    // get the right canvas element based on screensize
    if (this.screenHeight === 400) { // pixi, veer
         $("mainCanvas400").style.display = "block";
         this.ctx = $("mainCanvas400").getContext("2d");
    } else if (this.screenHeight === 480) { // pre1,2,plus
         $("mainCanvas480").style.display = "block";
         this.ctx = $("mainCanvas480").getContext("2d");
    } else if (this.screenHeight === 800) { // pre3
         $("mainCanvas800").style.display = "block";
         this.ctx = $("mainCanvas800").getContext("2d");
    }
    /*else if (this.screenHeight === 768) { // touchpad
         $("mainCanvas1024").style.display = "block";
         this.ctx = $("mainCanvas1024").getContext("2d");
    }*/
    
    if (this.gameInProgress) {
        this.pauseGame(false); // unpauses
    } else {
	this.startGame();
	//this.pauseGame(true); // immediately pause on start
    }
    
    // activate scene events
    this.controller.listen(this.controller.document, Mojo.Event.stageDeactivate, this.stageDeactivateBind, true);
    
    // activate user input events
    Mojo.Event.listen(this.controller.document, Mojo.Event.keydown, this.keyDownBind, true);
    Mojo.Event.listen(this.controller.document, Mojo.Event.keyup, this.keyUpBind, true);
    Mojo.Event.listen(this.controller.document, Mojo.Event.tap, this.tapHandlerBind);
    Mojo.Event.listen(this.controller.document, 'acceleration', this.orientationChangeBind, true); //Mojo.Event.orientationChange
};


GameAssistant.prototype.deactivate = function() {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
    if (this.gameInProgress) {
	this.pauseGame(true); // pauses
    }
    
    this.controller.stopListening(this.controller.document, Mojo.Event.stageDeactivate, this.stageDeactivateBind);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keydown, this.keyDownBind);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keyup, this.keyUpBind);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.tap, this.tapHandlerBind);
    Mojo.Event.stopListening(this.controller.document, 'acceleration', this.orientationChangeBind);
};

/**
 * Handles stage deactivation event.
 */
GameAssistant.prototype.stageDeactivate = function() {
    this.pauseGame(true); // pause
}; /* End stageDeactivate(). */

GameAssistant.prototype.cleanup = function() {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
    if (this.gameInProgress) {
	this.gameInProgress = false;
	this.pauseGame(true); // pauses
    }
    
    this.controller.stopListening(this.controller.document, Mojo.Event.stageDeactivate, this.stageDeactivateBind);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keydown, this.keyDownBind);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.keyup, this.keyUpBind);
    Mojo.Event.stopListening(this.controller.document, Mojo.Event.tap, this.tapHandlerBind);
    Mojo.Event.stopListening(this.controller.document, 'acceleration', this.orientationChangeBind);
};

/*
 * Event handlers --------------------------------------------------
 */

/**
 * Tap handler - starts or stops the game
 */
GameAssistant.prototype.tapHandler = function(event) {
    if (this.gameInProgress) {
	// if already playing pause or unpause
	if (this.gameIsPaused) {
	    this.pauseGame(false); // unpauses
	} else {
	    this.pauseGame(true); // pauses
	}
    } else {
	// start new game
        this.startGame();
    }
}; /*End tapHandler() */

/**
 * Handle KeyDown events.
 *
 * @param event The generated event object.
 */
GameAssistant.prototype.keyDown = function(event) {
    //Mojo.Log.info("*** keyDown event");
    if (this.gameInProgress) {
        switch (event.originalEvent.keyCode) {

            // Move left.
            case Mojo.Char.q: case Mojo.Char.q + 32:
                this.playerSelf.movement = -0.2;
                //Mojo.Log.info("Left button pressed");
            break;

            // Move right.
            case Mojo.Char.p: case Mojo.Char.p + 32:
                this.playerSelf.movement = 0.2;
                //Mojo.Log.info("Right button pressed");
            break;
        }
    }
}; /* End keyDown(). */

/**
 * Handle KeyUp events.
 */
GameAssistant.prototype.keyUp = function() {
    if (this.gameInProgress) {
        this.playerSelf.movement = 0;
        //Mojo.Log.info("Buttons released");
    }
}; /* End keyUp(). */
     
/**
 * Handles orientation change events.
 */
GameAssistant.prototype.orientationChange = function(event) {
    //Mojo.Log.info(event.accelX);
    if (this.gameInProgress) {
	this.playerSelf.movement = event.accelX;
    }
};

//
// Game logic ---------------------------------------------------
//

/**
 * Starts the game and resets stuff to zero
 */
GameAssistant.prototype.startGame = function() {
    // set basics
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    
    // reset players and scores
    this.playerOpponent.moving = false;
    this.playerOpponent.score = 0;
    this.playerOpponent.recentScore = 0;
    this.playerSelf.moving = false;
    this.playerSelf.score = 0;
    this.playerSelf.recentScore = 0;
    
    var paddleWidth = Math.round(60 * (this.screenWidth / 320));
    var paddleWidthLoss = Math.round(paddleWidth / 10);
    var paddleSpeed = Math.round(15 * (this.screenHeight / 480)); // is a vertical property
    
    this.playerOpponent.speed = paddleSpeed;
    this.playerOpponent.width = paddleWidth;
    this.playerOpponent.widthLoss = paddleWidthLoss;
    this.playerSelf.speed = paddleSpeed;
    this.playerSelf.width = paddleWidth;
    this.playerSelf.widthLoss = paddleWidthLoss;
    
    // also update the opponent precision
    // value between -2 and 1 (+1 would be perfectly unbeatable)
    this.playerOpponent.precision = this.gameDifficultyLevel;
    // also update the risk the AI takes with regard to to distance of predicted target and own position
    // implemented as follows: distance to target > my width / sidesRisk; with sidesRisk [2-3]
    this.playerOpponent.sidesRisk = 3 - this.gameDifficultyLevel;
    if (this.playerOpponent.sidesRisk > 3) {
	this.playerOpponent.sidesRisk = 3;
    }
    
    // reset positions to halfway screen width
    this.playerOpponent.x = 160;
    this.playerOpponent.y = 20;
    this.playerSelf.x = 160;
    this.playerSelf.y = this.screenHeight-20;
    
    // reset opponent AI data
    this.playerOpponent.xAI = [0,0,0];
    this.playerOpponent.yAI = [0,0,0];
    
    // reset ball to defaults
    this.ball.maxSpeed = (19 * (this.screenHeight/480)) + 2 * this.gameDifficultyLevel; // range is 16-21
    this.ball.minSpeed = (10 * (this.screenHeight/480)) + this.gameDifficultyLevel;
    this.resetBall(false);
    
    // redraw scene as default
    this.ctx.fillStyle = this.backgroundColour;
    this.ctx.fillRect(0,0,320,this.screenHeight);
    this.ctx.fillStyle = this.foregroundColour;
    this.lineHeight = this.screenHeight / 2 - 1;
    this.ctx.fillRect(0, this.lineHeight, 320, 2);
    
    // start the game
    this.gameInProgress = true;
    this.pauseGame(false); // unpauses
    
}; /* End startGame() */
    
/**
 * Resets the ball to a new starting position after a score
 */
GameAssistant.prototype.resetBall = function(sideToStart) {
    // reset x value
    this.ball.x = 160;
    
    // reset y value based on who won (gets the service)
    // true is playerSelf scores / gets service
    if (sideToStart) {
        this.ball.y = this.screenHeight - 100;
        this.ball.angle = Math.sin( Math.random() - 0.5); // upwards
	this.ball.movingDown = false;
    } else {
        this.ball.y = 100;
        this.ball.angle = Math.PI + Math.sin( Math.random() - 0.5); // downwards
	this.ball.movingDown = true;
    }
    this.ball.speed = this.ball.minSpeed;
    this.ball.recentScore = 0;
};

/**
 * Pauses or unpauses game
 */
GameAssistant.prototype.pauseGame = function(doPause) {
    if (doPause) {
	// pause game
	this.gameIsPaused = true;
	clearInterval(this.mainLoopInterval);
	Mojo.Event.stopListening(this.controller.document, 'acceleration', this.orientationChangeBind, true);
	this.controller.stageController.setWindowProperties({
	    fastAccelerometer: false,
	    blockScreenTimeout: false
	});
	
	// indicate state on canvas if playing
	if (this.gameInProgress) {
	    this.ctx.font = this.fontMedium;
	    this.ctx.fillStyle = this.backgroundColour;
	    this.ctx.fillRect(20, this.screenHeight/2-2, 280, 4);
	    this.ctx.fillStyle = this.textColour;
	    this.ctx.fillText("(tap to unpause game)", 160, this.screenHeight/2-3);
	}
    } else {
	// unpause game
	this.gameIsPaused = false;
	this.controller.stageController.setWindowProperties({
	    fastAccelerometer:true,
	    blockScreenTimeout: true
	});
	Mojo.Event.listen(this.controller.document, 'acceleration', this.orientationChangeBind, true);
	this.mainLoopInterval = setInterval(this.mainLoopBind, 33); // every 33 ms ~ 30 fps
    }
};

/**
 * Function handles situations for when one of the players is game over
 */
GameAssistant.prototype.gameOver = function(userWon) {
    // stop the game
    this.gameInProgress = false;
    this.pauseGame(true); // pauses
    
    // show dialog, ability to restart
    var titleText = $L("Game over!");
    var messageText = $L("You've lost this game, but there is hope. Do you want to try again?");
    if (userWon) {
	titleText = $L("You won!");
	messageText = $L("You've won this game, more glory awaits! Do you want to try again?");
    }
    // TODO play sound
    // show the actual dialog
    this.controller.showAlertDialog({
	onChoose: function(value) {
	    if (value) {
		// restart
		this.startGame();
	    } else {
		// pop this scene to go back to main screen
		this.currentStageControl.controller.popScene();
	    }
	},
	title: titleText,
	message: messageText,
	choices:[
	    {label:$L('Try again'), value: true, type:'affirmative'},
	    {label:$L('Meh! Leave game'), value: false, type:'negative'}
	]
    });
}; // end of gameOver()

/*
 * Main game loop -------------------------------------------------
 */
GameAssistant.prototype.mainLoop = function() {
    
    // reset variables
    this.ping = false; // indicates whether the ball should flip when up or down, else someone scores
    this.pong = false; // same
    this.currentDx = null;
    this.maxDx = null;
    
    // game logic ----------------------------
    
    /* phone position is paddle position
    // update player position
    this.playerSelf.moving = true;
    this.playerSelf.x = (this.playerSelf.movement + 0.25) * 2 * this.screenWidth; // movement range -0.25 to 0.25
    
    // constrain player within playing field
    if (this.playerSelf.x < (this.playerSelf.width/2) ) {
	this.playerSelf.x = this.playerSelf.width/2;
    } else if (this.playerSelf.x > (this.screenWidth - this.playerSelf.width/2) ) {
	this.playerSelf.x = this.screenWidth - this.playerSelf.width/2;
    }
    */
    
    if (Math.abs(this.playerSelf.movement) > 0.03) {
	// determine player speed
	// 0.03 is used as a deadzone
	// 0.15 is used as maximum tilt ~ maxspeed
	this.displacement = (this.playerSelf.movement / 0.10) * this.playerSelf.speed;
	// limit to maximum speed
	if (Math.abs(this.displacement) > this.playerSelf.speed) {
	    // ±0.3 / 0.3 = ±1
	    this.displacement = (this.displacement/Math.abs(this.displacement)) * this.playerSelf.speed;
	}
	// update position
	this.playerSelf.moving = true;
        this.playerSelf.x = this.playerSelf.x + this.displacement;
	// constrain player within playing field
	if (this.playerSelf.x < (this.playerSelf.width/2) ) {
	    this.playerSelf.x = this.playerSelf.width/2;
	} else if (this.playerSelf.x > (this.screenWidth - this.playerSelf.width/2) ) {
	    this.playerSelf.x = this.screenWidth - this.playerSelf.width/2;
	}
    } else {
	this.playerSelf.moving = false;
    }
    
    // update opponent position
    this.playerAI();
    
    // update ball position - only when no recent score due to short pause
    if (this.ball.recentScore <= 2) {
	this.ball.x = this.ball.x + Math.round(Math.sin(this.ball.angle) * this.ball.speed);
	this.ball.y = this.ball.y + Math.round(-Math.cos(this.ball.angle) * this.ball.speed);
	
	// deal with potential loss of ball due to a bug
	if (this.ball.y < 0 || this.ball.y > this.screenHeight) {
	    this.ball.movingDown = !this.ball.movingDown;
	}
    }
    if (this.ball.recentScore === 0) {
	// sides collision detection (0 < x < screenWidth)
	// added 3 pixels to compensate for effect that the ball does not touch when going fast
	if (this.ball.x <= (this.ball.radius+3) || this.ball.x >= (320-this.ball.radius-3)) {
	    this.ball.angle = (Math.PI - (this.ball.angle-Math.PI));
	}
      
	// ping detection - adds five pixels to compensate for overshooting
	if (!this.ball.movingDown && this.ball.y <= (25 + this.ball.radius)) {
	    // get distance from middle of player
	    this.currentDx = Math.abs(this.playerOpponent.x-this.ball.x);
	    // include the diameter of the ball
	    this.maxDx = (this.playerOpponent.width/2 + this.ball.radius);
	    // if distance is within width it is ok, ball is flipped, else a score for opponent
	    if (this.maxDx >= this.currentDx) {
		this.ping = true;
		this.ball.y = 20 + this.ball.radius;
	    } else {
		// player 2 scores!
		this.playerSelf.score++;
		this.playerSelf.recentScore = 1;
		// indicate scoring - preparing for reset
		this.ball.recentScore = 1;
		this.ball.nextSide = true;
		
		// decrease paddle width for player 1
		if (this.gameMode === 1) {
		    this.playerOpponent.width = this.playerOpponent.width-this.playerOpponent.widthLoss;
		    if (this.playerOpponent.width <= 0) {
			this.gameOver(true);
		    }
		}
	    }
	}
	// pong detection - adds five pixels to compensate for overshooting
	if (this.ball.movingDown && this.ball.y >= (this.screenHeight - 25 - this.ball.radius)) {
	    // get distance from middle of player
	    this.currentDx = Math.abs(this.playerSelf.x-this.ball.x);
	    // include the diameter of the ball
	    this.maxDx = (this.playerSelf.width/2 + this.ball.radius);
	    // if distance is within width it is ok, ball is flipped, else a score for opponent
	    if (this.maxDx >= this.currentDx) {
		this.pong = true;
		this.ball.y = this.screenHeight - 20 - this.ball.radius;
	    } else {
		// player 1 scores!
		this.playerOpponent.score++;
		this.playerOpponent.recentScore = 1;
		// indicate scoring - preparing for reset
		this.ball.recentScore = 1;
		this.ball.nextSide = false;
		
		// decrease paddle width for player 2
		if (this.gameMode === 1) {
		    this.playerSelf.width = this.playerSelf.width-this.playerSelf.widthLoss;
		    if (this.playerSelf.width <= 0) {
			this.gameOver(false);
		    }
		}
	    }
	}
      
	// if succesful bounced by a player do flip direction + adjust speed
	// effect based on place of hitting ball
	if (this.ping || this.pong) {
	    
	    // indicate flipping
	    // NOTE: this variable is used to deal with the issue that the ball
	    //	     may get behind the player and gets flipped, and again, and again...
	    this.ball.movingDown = !this.ball.movingDown;
	    
	    // calculate the change in angle
	    this.change = (this.currentDx / this.maxDx) * Math.PI/3; // 0...1 * max angle
	    
	    // adjust angle and flip
	    if (this.ball.angle <= (Math.PI / 2) ) { // < 90 degrees
		this.ball.angle = Math.PI - this.change;
	    } else if (this.ball.angle <= Math.PI) { // < 180 degrees
		this.ball.angle = this.change;
	    } else if (this.ball.angle <= (Math.PI + Math.PI/2) ) { // < 270 degrees
		this.ball.angle = -this.change;
	    } else if (this.ball.angle <= (2*Math.PI) ) { // < 360 degrees
		this.ball.angle = Math.PI + this.change;
	    }
	    
	    // constrain angle within 0 < angle < 2*PI
	    if (this.ball.angle < 0) { // 0 degrees
		this.ball.angle = this.ball.angle + (2*Math.PI);
	    } else if (this.ball.angle > (2*Math.PI) ) {
		this.ball.angle = this.ball.angle - (2*Math.PI);
	    }
	    //this.ball.angle = (this.ball.angle+Math.PI) % (2*Math.PI);
	    
	    // adjust speed based on place of hitting and movement
	    if (this.ping) {
		if (this.playerOpponent.moving) {
		    this.ball.speed = 3*(this.currentDx / this.maxDx)*this.ball.maxSpeed;
		} else {
		    this.ball.speed = (5 * this.currentDx / this.maxDx) + this.ball.minSpeed;
		}
	    } else if (this.pong) {
		if (this.playerSelf.moving) {
		    this.ball.speed = 3*(this.currentDx / this.maxDx)*this.ball.maxSpeed;
		} else {
		    this.ball.speed = (5 * this.currentDx / this.maxDx) + this.ball.minSpeed;
		}
	    }
	    // constrain speed
	    if (this.ball.speed < this.ball.minSpeed) {
		this.ball.speed = this.ball.minSpeed;
	    } else if (this.ball.speed > this.ball.maxSpeed) {
		this.ball.speed = this.ball.maxSpeed;
	    }
	} // end of adjusting ball based on ping or pong
    }
    
    // draw to canvas -----------------------------------
    
    // first draw playing field
    this.ctx.fillStyle = this.backgroundColour;
    this.ctx.fillRect(0,0,320,this.screenHeight);
    this.ctx.fillStyle = this.foregroundColour;
    this.lineHeight = this.screenHeight / 2 - 1;
    this.ctx.fillRect(0, this.lineHeight, 320, 2);
    
    // draw scores
    // do not show for 'last paddle standing' mode
    if (this.gameMode === 0) {
        this.ctx.font = this.fontSmall;
	this.ctx.fillText(this.playerOpponent.score, 12, this.screenHeight/2-17);
	this.ctx.fillText(this.playerSelf.score, 12, this.screenHeight/2+17);
    }
    
    // draw score screamer
    this.ctx.font = this.fontBig;
    if (this.playerSelf.recentScore >= 1) {
	// indicate the next launching place of ball
	if (this.playerSelf.recentScore > 50 && this.playerSelf.recentScore < 70) {
	    this.ctx.fillStyle = this.effectsColour;
	    this.ctx.beginPath();
	    this.ctx.arc(160, this.screenHeight-100, this.launcherRadiusMax-this.launcherRadiusFactor*this.playerSelf.recentScore, 0, Math.PI*2, true);
	    this.ctx.closePath();
	    this.ctx.fill();
	}
	// score text
	this.ctx.fillStyle = this.textColour;
	this.ctx.fillText("you score", 160, this.screenHeight-105);
	// remove scores after 90 frames ~ 3 sec
	if (this.playerSelf.recentScore > 90) {
	    this.playerSelf.recentScore = 0;
	} else {
	    this.playerSelf.recentScore++;
	}
    }
    if (this.playerOpponent.recentScore >= 1) {
	// indicate the next launching place of ball
	if (this.playerOpponent.recentScore > 50 && this.playerOpponent.recentScore < 70) {
	    this.ctx.fillStyle = this.effectsColour;
	    this.ctx.beginPath();
	    this.ctx.arc(160, 100, this.launcherRadiusMax-this.launcherRadiusFactor*this.playerOpponent.recentScore, 0, Math.PI*2, true);
	    this.ctx.closePath();
	    this.ctx.fill();
	}
	// score text
	this.ctx.fillStyle = this.textColour;
	this.ctx.fillText("opponent scores", 160, 95);
	// remove scores after 90 frames ~ 3 sec
	if (this.playerOpponent.recentScore > 90) {
	    this.playerOpponent.recentScore = 0;
	} else {
	    this.playerOpponent.recentScore++;
	}
    }
    
    // draw players
    this.ctx.fillStyle = this.foregroundColour;
    //this.ctx.fillRect(this.playerOpponent.xPred, 0, 2, 25); // AI predicted landing point for ball
    this.ctx.fillRect(this.playerOpponent.x-this.playerOpponent.width/2, 10, this.playerOpponent.width, 10);
    this.ctx.fillRect(this.playerSelf.x-this.playerSelf.width/2, this.screenHeight-20, this.playerSelf.width, 10);
    
    // draw ball
    if (this.ball.recentScore === 0) {
	this.ctx.beginPath();
	this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2, true);
	this.ctx.closePath();
	this.ctx.fill();
    } else if (this.ball.recentScore <= 50) {
	// draw the ball as if exploding when a player misses / the other scores
	
	// debris
	this.ctx.fillStyle = this.effectsColour;
	this.ctx.fillRect(this.ball.x-4, this.ball.y-4 - 1.5*this.ball.recentScore, this.ball.debrisSize,this.ball.debrisSize);
	this.ctx.fillRect(this.ball.x-4, this.ball.y-4 + 1.5*this.ball.recentScore, this.ball.debrisSize,this.ball.debrisSize);
	this.ctx.fillRect(this.ball.x-4 + 1.5*this.ball.recentScore, this.ball.y-4, this.ball.debrisSize,this.ball.debrisSize);
	this.ctx.fillRect(this.ball.x-4 - 1.5*this.ball.recentScore, this.ball.y-4, this.ball.debrisSize,this.ball.debrisSize);
	
	this.ctx.fillRect(this.ball.x-4 - this.ball.recentScore, this.ball.y-4 - this.ball.recentScore, this.ball.debrisSize,this.ball.debrisSize);
	this.ctx.fillRect(this.ball.x-4 - this.ball.recentScore, this.ball.y-4 + this.ball.recentScore, this.ball.debrisSize,this.ball.debrisSize);
	this.ctx.fillRect(this.ball.x-4 + this.ball.recentScore, this.ball.y-4 - this.ball.recentScore, this.ball.debrisSize,this.ball.debrisSize);
	this.ctx.fillRect(this.ball.x-4 + this.ball.recentScore, this.ball.y-4 + this.ball.recentScore, this.ball.debrisSize,this.ball.debrisSize);
	
	this.ctx.fillRect(this.ball.x-4 - 1.5*this.ball.recentScore, this.ball.y-4 - 2.5*this.ball.recentScore, this.ball.debrisSize-2,this.ball.debrisSize-2);
	this.ctx.fillRect(this.ball.x-4 - 2.5*this.ball.recentScore, this.ball.y-4 + 1.5*this.ball.recentScore, this.ball.debrisSize-2,this.ball.debrisSize-2);
	this.ctx.fillRect(this.ball.x-4 + 1.5*this.ball.recentScore, this.ball.y-4 - 2.5*this.ball.recentScore, this.ball.debrisSize-2,this.ball.debrisSize-2);
	this.ctx.fillRect(this.ball.x-4 + 2.5*this.ball.recentScore, this.ball.y-4 + 1.5*this.ball.recentScore, this.ball.debrisSize-2,this.ball.debrisSize-2);
	
	// the ball itself
	this.ctx.fillStyle = this.foregroundColour;
	this.ctx.fillStyle = this.ctx.fillStyle.replace(/^rgb/, 'rgba').replace(/\)$/, '') + "," + (50 - this.ball.recentScore)/50 + ")";
	this.ctx.beginPath();
	this.ctx.arc(this.ball.x, this.ball.y, (this.ball.radius + this.ball.recentScore/2), 0, Math.PI*2, true);
	this.ctx.closePath();
	this.ctx.fill();
	
	// this gives a pause equal to the amount of frames indicated in the if-statement.
	this.ball.recentScore++;
	if (this.ball.recentScore > 50) {
	    this.ball.recentScore = 0;
	    this.resetBall(this.ball.nextSide);
	}
    }
}; /* End mainLoop() */
    
/**
 * Opponent AI algorithm - Calculates the best place to rebound
 */
GameAssistant.prototype.playerAI = function() {
    // variable for predicting landing point
    this.xOppAI = this.playerOpponent.xPred;
    
    // only calculate when ball is nearing (270 < angle < 90 degrees)
    if (this.ball.angle < (Math.PI/2) || this.ball.angle > (Math.PI + Math.PI/2) ) {
        this.playerOpponent.xAI[2] = this.playerOpponent.xAI[1];
        this.playerOpponent.yAI[2] = this.playerOpponent.yAI[1];
        this.playerOpponent.xAI[1] = this.playerOpponent.xAI[0];
        this.playerOpponent.yAI[1] = this.playerOpponent.yAI[0];
        this.playerOpponent.xAI[0] = this.ball.x;
        this.playerOpponent.yAI[0] = this.ball.y;
        
        this.xDiff = this.playerOpponent.xAI[2]-this.playerOpponent.xAI[0];
        this.yDiff = this.playerOpponent.yAI[0]-this.playerOpponent.yAI[2];
        this.aiDirection = Math.PI + Math.atan( this.xDiff / this.yDiff);
      
        this.yDistance = Math.abs(this.playerOpponent.yAI[0] - 20);
        this.xDistance = Math.round(Math.tan(this.aiDirection) * this.yDistance);
        // get the landing position based on current path
	// uses the current x position + predicted distance in x direction
	// the precision is varying (otherwise it is perfectly unbeatable)
        this.xOppAI = this.playerOpponent.xAI[0] + (this.playerOpponent.precision * this.xDistance);
      
        // flipflopping to deal with bouncing
        // correct for a path that goes out of bounds / width
	var i = 0; // counter to prevent while loop from freezing the application
	while (this.xOppAI > 320) {
            this.xOppAI = 320-Math.abs(this.xOppAI-320);
            if (this.xOppAI < 0) {
                this.xOppAI = Math.abs(this.xOppAI);
            }
	    i++;
	    if (i > 10) {
		break;
	    }
        }
	while (this.xOppAI < 0) {
            this.xOppAI = Math.abs(this.xOppAI);
            if (this.xOppAI > 320) {
                this.xOppAI = 320-Math.abs(this.xOppAI-320);
            }
	    i++;
	    if (i > 10) {
		break;
	    }
        }
    }
    
    // steer towards this.xOppAI if not in good position
    // at least distance to predicted x should be smaller than half the width
    // here 1/n of the width (sidesRisk variable) is used to counter inprecise predictions
    if (Math.abs(this.playerOpponent.x-this.xOppAI) > (this.playerOpponent.width / this.playerOpponent.sidesRisk) ) {
	this.playerOpponent.moving = true;
        if (this.xOppAI < this.playerOpponent.x) {
            this.playerOpponent.x = this.playerOpponent.x - this.playerOpponent.speed;
        }
        else if (this.xOppAI > this.playerOpponent.x) {
            this.playerOpponent.x = this.playerOpponent.x + this.playerOpponent.speed;
        }
        // check boundaries (left & right)
        if (this.playerOpponent.x < this.playerOpponent.width/2) {
            this.playerOpponent.x = this.playerOpponent.width/2;
        } else if (this.playerOpponent.x > (320-this.playerOpponent.width/2)) {
            this.playerOpponent.x = (320-this.playerOpponent.width/2);
        }
    } else {
	this.playerOpponent.moving = false;
    }
    
    // set values for this player
    this.playerOpponent.xPred = this.xOppAI;
};