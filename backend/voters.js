var db = require( './db.js' );
var types = require( './types.js' );
var Message = types.Message;
var logger = require( './logger.js' );
var async = require( 'async' );

var totalUserCounter = 0;

var codePattern = new RegExp( '^[a-zA-Z]{8}$', '' );
var votePattern = new RegExp( '^[0-9]{1,}$', '' );
var pnbrPattern = new RegExp( '^[0-9]{11}$', '' );

db.runQuery( 'SELECT count(*) AS counts FROM voters', [], function( err, rows ) {
	totalUserCounter = rows[0].counts;
} );

function validateUser( msg, callback ) {
	if( !( msg instanceof Message ) ) {
		callback( false );
	}
	
	db.runQuery( 'SELECT * FROM voters WHERE phone_number = ?', [ msg.Sender ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Error validating voter ' + err );
			callback( false );
		} else if( rows.length == 0 ) {
			callback( false );
		} else {
			callback( true );
		}
	} );
}

function verifyRegistration( number, code, callback ) {
	var ret = {
		result: false
	};
	
	if( ! codePattern.test( code ) ||
		! pnbrPattern.test( number ) ) {
		
		callback( ret );
		return false;
	}
	
	db.runQuery( 'SELECT * FROM voters WHERE phone_number = ? AND reg_key = ?', [ number, code.toUpperCase() ], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Cannot retrive voter information from database - ' + err );
		} else if( rows.length > 0 ) {
			ret.result = true;
		}
		
		callback( ret );
	} );
}

function isRegistration( text ) {
	return codePattern.test( text );
}

function isVote( text ) {
	return votePattern.test( text );
}

function addUser( msg ) {
	if( !( msg instanceof Message ) ) {
		return false;
	}
	
	if( ! isRegistration( msg.Message ) ) {
		return false;
	}
	
	var regKey = msg.Message.toUpperCase();
	
	db.runQuery( 'INSERT INTO voters(phone_number, reg_key) VALUES( ?, ? )', [ msg.Sender, regKey ], function( err, rows ) {
		if( err ) {
			var errmsg = '';
			if( err.toString().indexOf( 'KeyValidation' ) != -1 ) {
				errmsg = 'Invalid key: ' + regKey;
			} else {
				errmsg = err.toString();
			}
				
			console.log( 'Error adding user ' + msg.Sender + ' - ' + errmsg );
		} else {
			db.runQuery( 'UPDATE reg_key SET used = 1 WHERE reg_key = ?', [ msg.Message ], function( err, rows ) {
				if( err ) {
					console.log( 'Error updating registration key state, key ' + regKey + ' err ' + err );
				} else {
					totalUserCounter ++;
				}
			} );
		}
	} );
}

function getTotalUsers() {
	return totalUserCounter;
}

function getAllVoters( votedInRound, callback ) {
	
	var query = '';
	var voted = false;
	
	if( typeof votedInRound == 'number' ) {
		query = 'SELECT DISTINCT voter FROM votes WHERE round = ' + votedInRound;
		voted = true;
	} else {
		query = 'SELECT phone_number FROM voters';
	}
	
	db.runQuery( query, [], function( err, rows ) {
		if( err ) {
			logger.errLog( 'Cannot fetch all voters ' + err );
			callback( err, [] );
		} else {
			async.map( rows, function( row, callback ) { callback( null, voted ? row.voter : row.phone_number ); }, callback );
		}
	} );
}


module.exports.validateUser = validateUser;
module.exports.addUser = addUser;
module.exports.isRegistration = isRegistration;
module.exports.isVote = isVote;
module.exports.verifyRegistration = verifyRegistration;
module.exports.getAllVoters = getAllVoters;
