var types = require( '../types.js' );
var Message = types.Message;
var Response = types.Response;
var NexmoMessage = require( '../parsers/nexmoparser.js' ).NexmoMessage;
var db = require( '../db.js' );
var config = require( '../config.js' );
var voters = require( '../voters.js' );
var colors = require( 'colors' );
var logger = require( '../logger.js' );


function SingleVote() {
	
	this.currentCandidate = '';
	this.currentCandidateID = 1;
	this.totalCandidates = 20;
	this.currentVotes = 0;
	this.acceptingVotes = false;
	this.round = 1;
	this.currentScore = 0;
	this.state = 'IDLE';
	this.hasConcluded = false;
	
	config.getAttribute( 'cid', function( err, val ) {
		if( err ) {
			logger.errLog( 'Cannot retrive cid ' + err );
		} else {
			
			this.setCandidateNameID( val || 1, function( err ) {
				if( !err ) {
					db.runQuery( 'SELECT count(*) AS counts FROM votes WHERE cid = ?', [ parseInt( this.currentCandidateID ) ], function( err, rows ) {
						if( err ) {
							logger.errLog( 'Cannot recover count data from database ' + err );
						} else {
							this.currentVotes = parseInt( rows[0].counts );
							logger.errLog( 'Recovering last voting data, cid = ' + this.currentCandidateID + ' votes = ' + rows[0].counts );
						}
					}.bind( this ) );
				}
			}.bind( this ) );
		}
	}.bind( this ) );
	
	config.getAttribute( 'total_candidates', function( err, val ) {
		if( err ) {
			logger.errLog( 'Cannot retrive total_candidates ' + err );
		} else {
			this.totalCandidates = parseInt( val );
		}
	}.bind( this ) );
}

SingleVote.prototype.setCandidateNameID = function( id, callback ) {
	db.runQuery( 'SELECT * FROM single_vote WHERE c_id = ?', [ id ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Cannot retrive candidate ' + err );
		} else if( rows.length == 0 ){
			logger.errLog( 'Cannot find candidate ID ' + id );
			err = 'Cannot find CID';
		} else {
			this.currentCandidate = rows[0].c_name;
			this.currentCandidateID = id;
			logger.infoLog( 'Candidate ID ' + id + ' name ' + this.currentCandidate );
		}
		
		if( typeof callback == 'function' ) {
			callback( err );
		}
		
	}.bind( this ) );
};

SingleVote.prototype.processVote = function( msg ) {
	if( ! ( msg instanceof Message ) ) {
		logger.errLog( 'Not an instance of Message' );
		return;
	}
	
	if( ! this.acceptingVotes ) {
		logger.errLog( 'Not accepting new votes, from ' + msg.Sender + ' content ' + msg.Message );
		return;
	}
	
	if( parseInt( msg.Message ) != this.currentCandidateID ) {
		logger.errLog( 'Received invalid vote from ' + msg.Sender + ': ' + msg.Message );
		return;
	}
	
	db.runQuery( 'INSERT INTO votes(voter, cid) VALUES( ?, ? )', [ msg.Sender, parseInt( msg.Message ) ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Received invalid vote from ' + msg.Sender + ': ' + msg.Message );
		} else {
			this.currentVotes ++;
		}
	}.bind( this ) );
};

SingleVote.prototype._recoverVotes = function( callback ) {
	db.runQuery( 'SELECT count(*) AS counts FROM votes WHERE cid = ?' , [ this.currentCandidateID ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Error recounting votes ' + err );
		} else {
			logger.infoLog( 'Setting vote to ' + rows[0].counts );
			this.currentVotes = rows[0].counts;
			config.setAttribute( 'cid', this.currentCandidateID, null );
		}
		
		if( typeof callback == 'function' ) {
			callback( err );
		}
	}.bind( this ) );
};

SingleVote.prototype._setCid = function( command ) {
	if( typeof command.cid == 'undefined' ) {
		logger.errLog( 'Invalid CID :' + command.cid );
		return false;
	}
	
	var c_id = parseInt( command.cid );
	
	if( typeof c_id != 'number' ) {
		logger.errLog( 'Invalid CID :' + command.cid );
		return false;
	}
	
	
	if( c_id < 1 || c_id > this.totalCandidates ) {
		logger.errLog( 'Invalid CID :' + command.cid );
		return false;
	}
	
	if( typeof command.concluded == 'string' ) {
		if( command.concluded == 'true' ) {
			this.concludeVote( function( err ) {
				if( !err ) {
					this.setCandidateNameID( c_id, function( err ) {
						if( ! err ) {
							logger.infoLog( 'Changed cid to ' + c_id );
							this._recoverVotes();
						}
					}.bind( this ) );
				}
			}.bind( this ) );
		}
	} else {
		
		this.setCandidateNameID( c_id, function( err ) {
			if( !err ) {
				logger.infoLog( 'Changed cid to ' + c_id );
				this._recoverVotes();
			}
		}.bind( this ) );
		
	} 
	
	
};

SingleVote.prototype._setState = function( command ) {
	if( typeof command.newState != 'string' ) {
		logger.errLog( 'Invalid new state' );
		return false;
	}
	
	if( command.newState != 'IDLE' &&
		command.newState != 'VOTING' &&
		command.newState != 'RESULT' &&
		command.newState != 'RANK' ) {
		
		logger.errLog( 'Invalid new state ' + command.newState );
		return false;
	}
	
	if( typeof command.acceptingVotes != 'string' ) {
		
		if( command.newState == 'VOTING' ) {
			
			this.startVoting();
		} else if( command.newState == 'RESULT' || command.newState == 'IDLE' ) {
			this.acceptingVotes = false;
		}
		
	} else {
		this.acceptingVotes = ( command.acceptingVotes == 'true' ? true : false );
	}
	
	if( command.newState == 'RANK' && this.hasConcluded == false ) {
		this.concludeVote( function( err ) {
			if( err ) {
				logger.errLog( 'Cannot conclude current vote ' + err );
			} else {
				this.state = command.newState;
			}
		}.bind( this ) );
	} else {
		this.state = command.newState;
	}
	
	logger.infoLog( 'Setting system state to ' + command.newState + ' acceptingVotes: ' + this.acceptingVotes );
	
	
	
	return true;
};

SingleVote.prototype._addScore = function( command ) {
	
	if( typeof command.score != 'string' ||
		typeof command.candidate != 'string' ) {
		
		logger.errLog( 'Invalid score' );
		return false;		
	}
	
	if( typeof parseInt( command.score ) != 'number' ||
		typeof parseInt( command.candidate ) != 'number' ) {
		logger.errLog( 'Invalid command' );
		return false;
	}
	
	var c_id = parseInt( command.candidate );
	var score = parseInt( command.score );
	
	if( this.currentCandidateID != c_id ) {
		logger.errLog( 'Cannot add score to ' + score );
		return false;
	}
	
	if( typeof command.reset == 'string' && 
		command.reset == 'true' ) {
		this.currentScore = score;
	} else {
		this.currentScore += score;
	}
	
	this.hasConcluded = false;
	
	logger.infoLog( 'Score of candidate ' + this.currentCandidateID + ' is now ' + this.currentScore );
	
	return true;
};

SingleVote.prototype.processControl = function( command ) {
	if( typeof command != 'object' ) {
		return false;
	}
	
	if( typeof command.opcode != 'string' ) {
		return false;
	}
	
	
	if( command.opcode == 'setcid' ) {
		
		this._setCid( command );
		
	} else if( command.opcode == 'setstate' ) {
		
		this._setState( command );
		
	} else if( command.opcode == 'addscore' ) {
		
		this._addScore( command );
		
	} else {
		logger.errLog( 'Received unrecognizable command ' + JSON.stringify( command ) );
		return false;
	}
	
	return true;
};

SingleVote.prototype.startVoting = function( candidate ) {
	this.acceptingVotes = true;
	this.hasConcluded = false;
	if( candidate != null ) {
		this.currentCandidate = candidate;
	}
	this.currentVotes = 0;
	this.currentScore = 0;
	
	db.runQuery( 'SELECT count(*) AS counts FROM votes WHERE cid = ?', [ this.currentCandidateID ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Cannot count votes ' + err );
		} else {
			logger.infoLog( 'Setting vote to ' + rows[0].counts );
			this.currentVotes = rows[0].counts;
		}
	}.bind( this ) );
};

SingleVote.prototype.stopVoting = function() {
	this.acceptingVotes = false;
};

SingleVote.prototype._singleVoteResult = function() {
	var ret = { name: this.currentCandidate, cid: this.currentCandidateID, votes: this.currentVotes, maxVotes: 300 };
	
	return ret;
};

SingleVote.prototype._rankResult = function( callback ) {
	db.runQuery( 'SELECT c_id AS cid, c_name AS name, (score + votes) AS final_score FROM single_vote ORDER BY final_score DESC LIMIT 0, 10', [], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Cannot fetch rankings ' + err );
		}
		
		callback( err, { state: 'RANK', data: rows } );
	} );
};

SingleVote.prototype.compileResult = function( callback ) {
	
	if( this.state == 'VOTING' || this.state == 'RESULT' ) {

		callback( null, { state: this.state, data: this._singleVoteResult() } );
		
	} else if( this.state == 'RANK' ) {
		this._rankResult( callback );
	} else {
		callback( null, { state: 'IDLE', data: {} } );
	}
};

// SingleVote.prototype.addScore = function( score ) {
// 	var s = parseInt( score );
	
// 	this.currentScore += s;
// };

SingleVote.prototype.concludeVote = function( callback ) {
	db.runQuery( 'UPDATE single_vote SET votes = ?, score = ? WHERE c_id = ?', [ this.currentVotes, this.currentScore, this.currentCandidateID ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Error concluding vote ' + err );
		} else {
			this.hasConcluded = true;
			logger.infoLog( 'CandidateID ' + this.currentCandidateID + ' total votes: ' + this.currentVotes + ' total score: ' + this.currentScore );
		}
		
		if( typeof callback == 'function' ) {
			callback( err );
		}
	}.bind( this ) );
};

SingleVote.prototype.setCandidateID = function( id ) {
	db.runQuery( 'SELECT name FROM single_vote WHERE c_id = ?', [ id ], function( err, rows ) {
		this.currentCandidate = rows[0].c_name;
		this.currentCandidateID = id;
	}.bind( this ) );
};

module.exports.SingleVote = SingleVote;
