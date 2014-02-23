var db = require( '../db.js' );
var types = require( '../types.js' );
var Message = types.Message;
var voters = require( '../voters.js' );
var config = require( '../config.js' );
var logger = require( '../logger.js' );
var util = require( 'util' );
var async = require( 'async' );
var EventEmitter = require( 'events' ).EventEmitter;


function TimerTicker( time, callback ) {
	EventEmitter.call( this );
	this.timerMax = 0;
	this.timerRemain = 0;
	
	this.intervalID = 0;
	
	this.setTimer = function( time, tickCallback ) {
		this.timerMax = time;
		this.timerRemain = time;
		this.on( 'tick', tickCallback, this.timerRemain );
		
		var self = this;
		this.intervalID = setInterval( function() {
			self.timerRemain --;
			if( self.timerRemain <= 0 ) {
				self.timerRemain = 0;
				clearInterval( self.intervalID );
			}
			self.emit( 'tick', self.timerRemain );
		}, 1000 );
	};
	
	this.cancelTimer = function() {
		clearInterval( this.intervalID );
	}
	
	this.getTimerRemain = function() {
		return this.timerRemain;
	}
	
	this.setTimer( time, callback );
}

util.inherits( TimerTicker, EventEmitter );

function DuelCandidate( cid, round ) {
	this.c_id = cid;
	this.c_name = '';
	this.currentVotes = 0;
	this.currentScore = 0;
	this.round_id = round;
	
	var self = this;
	
	db.runQuery( 'SELECT * FROM candidates WHERE c_id = ?', [ cid ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Cannot retrive candidate from database ' + err );
		} else if( rows.length == 0 ) {
			logger.errLog( 'Cannot find candidate ID ' + cid );
		} else {
			self.c_name = rows[0].c_name;
			logger.infoLog( 'Loaded candidate ' + cid + ' ' + self.c_name + ' for round ' + self.round_id );
		}
	} );
}

DuelCandidate.prototype.addScore = function( score, reset ) {
	if( reset ) {
		this.currentScore = score;
	} else {
		this.currentScore += score;
	}
	
	logger.infoLog( 'Score of candidate ' + this.c_id + ' - ' + this.c_name + ' is now ' + this.currentScore );
	
	return this.currentScore;
};

DuelCandidate.prototype.incrementVote = function() {
	this.currentVotes ++;
	return this.currentVotes;
};

DuelCandidate.prototype.getVotes = function() {
	return this.currentVotes;
};

DuelCandidate.prototype.getScore = function() {
	return this.currentScore;
};

DuelCandidate.prototype.getCandidateID = function() {
	return this.c_id;
};

DuelCandidate.prototype.getCandidateName = function() {
	return this.c_name;
};

DuelCandidate.prototype.getCompiledResult = function() {
	var ret = {
		cid: this.c_id,
		name: this.c_name,
		votes: this.currentVotes,
		score: this.currentScore
	};
	return ret;
};

DuelCandidate.prototype.writeResult = function( callback ) {
	var self = this;
	db.runQuery( 'INSERT INTO timed_duel_result( c_id, round_id, score, votes ) VALUES( ?, ?, ?, ? )', [ this.c_id, this.round_id, this.currentScore, this.currentVotes ], function( err, result ) {
		logger.infoLog( 'Round ' + self.round_id + ' candidate ' + self.c_id + ' ' + self.c_name + ' total score ' + self.currentScore + ' total votes ' + self.currentVotes + ' sum up ' + ( self.currentVotes + self.currentScore ) );
		if( err ) {
			logger.errLog( 'Cannot insert result to timed_duel_result - ' + err );
		}
		
		if( typeof callback == 'function' ) {
			callback( err );
		}
	} );
};

function TimedDuelVote( options ) {
	
	var opt = options || {};

	this.currentCandidates = new Array();
	this.previousCandidates = null;
	
	this.timerLength = 60;
	
	this.currentRoundTimer = 60;
	this.currentRound = 0;
	
	this.acceptingVotes = false;
	this.concluded = false;
	
	// State is one of IDLE, VOTING, VOTED, RESULT
	this.currentState = 'IDLE';
	
	this.timer = null;
}

TimedDuelVote.prototype.processVote = function( msg ) {
	if( !( msg instanceof Message ) ) {
		return false;
	}
	
	if( ! this.acceptingVotes ) {
		logger.errLog( 'Received vote from ' + msg.Sender + ' - not accepting votes' );
		return false;
	}
	
	var target = parseInt( msg.Message );
	
	if( target.toString() != msg.Message ) {
		logger.errLog( 'Invalid candidate ID' );
		return false;
	}
	
	var c = this._getCandidate( target );
	
	
	if( c == null ) {
		logger.errLog( 'Invalid candidate ID ' + target + ' from ' + msg.Sender );
		return false;;
	}
	
	
	var self = this;
	
	db.runQuery( 'INSERT INTO votes(round, cid, voter) VALUES( ?, ?, ? )', [ this.currentRound, target, msg.Sender ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Invalid vote to ' + target + ' from ' + msg.Sender + ' - ' + err );
		} else {
			c.incrementVote();
		}
	} );
	
	
	return true;
};

TimedDuelVote.prototype.processControl = function( cmd ) {
	if( typeof cmd.opcode != 'string' ) {
		logger.errLog( 'Invalid command' );
		return false;
	}
	
	if( cmd.opcode == 'setround' ) {
		
		this.loadRound( cmd );
		
	} else if( cmd.opcode == 'addscore' ) {
		
		this.addScore( cmd );
		
	} else if( cmd.opcode == 'setstate' ) {
		
		this.setState( cmd );
	
	} else if( cmd.opcode == 'settimer' ) {
		
		this.setCountdown( cmd );
		
	} else {
		logger.errLog( 'Invalid opcode ' + cmd.opcode );
	}
	
	
};

TimedDuelVote.prototype.setState = function( cmd ) {
	
	if( typeof cmd.newState != 'string' ) {
		logger.errLog( 'Invalid command' );
		return false;
	}
	
	if( cmd.newState != 'IDLE' && 
		cmd.newState != 'VOTING' &&
		cmd.newState != 'VOTED' &&
		cmd.newState != 'RESULT' ) {
		
		logger.errLog( 'Invalid state' );
		return false;
	}
	
	this.currentState = cmd.newState;
	
	if( typeof cmd.acceptingVotes == 'string' && cmd.acceptingVotes == 'true' ) {
		
		if( cmd.acceptingVotes == true ) {
			this.acceptingVotes = true;
		} else {
			this.acceptingVotes = false;
		}
		
	} else {
		
		if( cmd.newState == 'VOTING' ) {
			this.startVoting();
		} else if( cmd.newState == 'VOTED' ) {
			this.stopVoting();
		}
		
	}
	
	logger.infoLog( 'Setting state to ' + cmd.newState + ', acceptingVotes: ' + ( this.acceptingVotes ? 'true' : 'false' ) );
	
};

TimedDuelVote.prototype._getCandidate = function( cid ) {
	for( var i = 0; i < this.currentCandidates.length; i ++ ) {
		var c = this.currentCandidates[ i ];
		if( c.getCandidateID() == cid ) {
			return c;
		}
	}
	
	return null;
};

TimedDuelVote.prototype._loadRoundHelper = function( data ) {
	var cids = data.cids.split( ' ' );
	this.previousCandidates = this.currentCandidates;
	this.currentCandidates = new Array();
	
	for( var i = 0; i < cids.length; i ++ ) {
		this.currentCandidates.push( new DuelCandidate( cids[ i ], this.currentRound ) );
	}
};

TimedDuelVote.prototype.loadRound = function( cmd ) {
	
	if( typeof cmd.round_id != 'string' ) {
		logger.errLog( 'Invalid command' );
		return false;
	}
	
	if( parseInt( cmd.round_id ).toString() != cmd.round_id ) {
		logger.errLog( 'Invalid round id' );
		return false;
	}
	
	if( typeof cmd.concluded == 'string' && cmd.concluded == 'true' ) {
		this.concludeVote();
	}
	
	var round = parseInt( cmd.round_id );
	var self = this;
	
	db.runQuery( 'SELECT * FROM timed_duel WHERE round_id = ?', [ round ], function( err, rows ) {
		if( err || rows.length == 0 ) {
			logger.errLog( 'Cannot load round ' + err );
		} else {
			self.timerLength = parseInt( rows[ 0 ].timer );
			self.currentRound = parseInt( round );
			self._loadRoundHelper( rows[ 0 ] );
			logger.infoLog( 'Loaded round ' + round + ' default timer count down ' + self.timerLength );
		}
	} );
};

TimedDuelVote.prototype.setCountdown = function( cmd ) {
	if( typeof cmd.cd != 'string' ) {
		logger.errLog( 'Invalid command type' );
		return false;
	}
	
	var cd = parseInt( cmd.cd );
	if( cd.toString() != cmd.cd ) {
		logger.errLog( 'Invalid count down time' );
		return false;
	}
	
	this.timerLength = cd;
	logger.infoLog( 'Setting count down timer to ' + cd );
};

TimedDuelVote.prototype._getVotingResult = function() {
	var ret = { 
		maxVotes: 600
	};
	
	var candidates = new Array();
	
	for( var i = 0; i < this.currentCandidates.length; i ++ ) { 
		candidates.push( this.currentCandidates[ i ].getCompiledResult() );
	}
	
	if( this.timer ) {
		ret.timerRemain = this.timer.getTimerRemain();
	} else {
		ret.timerRemain = 0;
	}
	
	ret.candidates = candidates;
	
	return ret;
};

TimedDuelVote.prototype.compileResult = function( callback ) {
	var ret = { state: this.currentState };
	var data = null;
	
	if( this.currentState == 'VOTING' ||
		this.currentState == 'VOTED' ||
		this.currentState == 'RESULT' ) {
		data = this._getVotingResult();
	}

	ret.data = data;
	
	callback( null, ret );
};

TimedDuelVote.prototype.getLastRoundID = function() {
	var last = this.currentRound - 1;
	if( last <= 0 ) {
		last = 1;
	}
	
	return last;
};

TimedDuelVote.prototype.getCurrentRoundID = function() {
	return this.currentRound;
};

TimedDuelVote.prototype.startVoting = function() {
	var self = this;
	this.acceptingVotes = true;
	
	logger.infoLog( 'Start accepting votes' );
	
	this.currentRoundTimer = this.timerLength;
	
	// setTimeout( function() {
	// 	self.stopVoting();
	// }, this.timerLength * 1000 );
	this.timer = new TimerTicker( this.currentRoundTimer, function( t ) {
		if( t == 0 ) {
			self.stopVoting();
			self.timer = null;
		}
	} );
};

TimedDuelVote.prototype.stopVoting = function() {
	this.acceptingVotes = false;
	this.currentState = 'VOTED';
	if( this.timer != null ) {
		this.timer.cancelTimer();
		this.timer = null;
	}
	
	logger.infoLog( 'Stop accepting votes' );
};

TimedDuelVote.prototype._addScoreTo = function( cid, score, reset ) {
	
	var c = this._getCandidate( cid );
	
	if( c == null ) {
		logger.errLog( 'Cannot find candidate ' + cid );
		return false;
	}
	
	c.addScore( score, reset );
		
	return true;
};

TimedDuelVote.prototype._checkAddScoreItem = function( item ) {
	if( typeof item.cid != 'string' ||
		typeof item.score != 'string' ) {
		return false;
	}
	
	if( parseInt( item.cid ).toString() != item.cid ||
		parseInt( item.score ).toString() != item.score ) {
		return false;
	}
	
	if( typeof item.reset == 'undefined' ) {
		item.reset = 'false';
	} 
	
	return true;
};

TimedDuelVote.prototype.addScore = function( cmd ) {
	
	if( typeof cmd.scores != 'object' ) {
		logger.errLog( 'Invalid command form' );
		return false;
	}
	
	for( var i = 0;i < cmd.scores.length; i++ ) {
		var cur = cmd.scores[i];
		if( this._checkAddScoreItem( cur ) ) {
			this._addScoreTo( parseInt( cur.cid ), parseInt( cur.score ), ( cur.reset == 'true' ? true : false ) );
		}
	}
	
};

TimedDuelVote.prototype.concludeVote = function( callback ) {
	if( this.concluded ) {
		return;
	}
	
	async.each( this.currentCandidates, function( item, callback ) {
		item.writeResult( callback );
	}, callback );

};


module.exports.TimedDuelVote = TimedDuelVote;
module.exports.TimerTicker = TimerTicker;

