var logger = require( './logger.js' );
var db = require( './db.js' );
var voters = require( './voters.js' );
var config = require( './config.js' );


function Controller( match, parser ) {
	this.voteProcessor = match;
	this.smsParser = parser;
	
	this.currentResultMode = 'vote';
	this.pollWinner = '';
	
	this.debug = false;
	
	config.getAttribute( 'debug', function( err, val ) {
		if( err ) {
			logger.errLog( 'Cannot retrive debug switch from database - ' + err );
		} else {
			this.debug = ( val == 'true' ? true : false );
			if( this.debug ) {
				logger.infoLog( 'Controller is in debug mode' );
			}
		}
	}.bind( this ) );
}


Controller.prototype.setMatch = function( match ) {
	this.currentVoteProcessor = match;
};

Controller.prototype.setSMSParser = function( parser ) {
	this.smsParser = parser;
};


Controller.prototype.validateAdminIP = function( ip, callback ) {
	
	if( this.debug ) {
		callback( true );
		return;
	}
	
	config.getAttribute( 'admin_ip', function( err, val ) {
		if( err ) {
			logger.errLog( 'Cannot retrive admin IP from database ' + err );
			callback( false );
			
		} else if( val == '' ) {
			
			config.setAttribute( 'admin_ip', ip, null );
			logger.infoLog( ( 'Setting admin IP to ' + ip ).cyan );
			callback( true );
			
		} else if( ip !== val ) {
			
			logger.errLog( 'Invalid admin IP ' + ip );
			callback( false );
			
		} else {
			callback( true );
		}
	} );
};

Controller.prototype.processControl = function( cmd ) {
	
	if( typeof cmd.opcode != 'string' ) {
		logger.errLog( 'Invalid controller command' );
		return false;
	}
	
	if( cmd.opcode == 'poll' ) {
		
		this.pollAudienceWinner( cmd );
		
	} else {
		
		logger.errLog( 'Invalid controller command' );
	}
	
};

Controller.prototype.pollAudienceWinner = function( cmd ) {
	var lastRound = this.voteProcessor.getCurrentRoundID();
	var notify = false;
	var delayNotify = 0;
	
	if( typeof cmd.notifyWinner == 'string' && cmd.notifyWinner == 'true' ) {
		notify = true;
	}
	
	if( typeof cmd.delay == 'string' && parseInt( cmd.delay ).toString() == cmd.delay ) {
		delayNotify = parseInt( cmd.delay );
	}
	
	var self = this;
	if( this.currentResultMode != 'poll' ) {
		logger.infoLog( 'Switched to poll mode' );
	}
	this.currentResultMode = 'poll';
	voters.getAllVoters( lastRound, function( err, result ) {
		
		if( err ) {
			logger.errLog( 'Cannot get all voters ' + err );
			return false;
		} else if( result.length == 0 ) {
			logger.errLog( 'There are no voters' );
			return false;
		}
		
		logger.infoLog( 'Selecting winner from ' + result.length + ' voters' );
		var selection = Math.floor( Math.random() * result.length );
		logger.infoLog( 'Winner is ' + result[ selection ] );
		self.pollWinner = result[ selection ];
		if( notify ) {
			setTimeout( function() {
				self.smsParser.sendMessage( result[ selection ], 'Congratulations on winning a prize' );
			}, delayNotify * 1000 );
		}
	} );
};

Controller.prototype.getPollWinner = function() {
	return this.pollWinner;
};

Controller.prototype.getResultMode = function() {
	return this.currentResultMode;
};

Controller.prototype.setResultMode = function( mode ) {
	if( mode != 'vote' &&
		mode != 'poll' ) {
		logger.log( 'Invalid result mode ' + mode );
		return false;
	}
	
	this.currentResultMode = mode;
};


module.exports.Controller = Controller;
