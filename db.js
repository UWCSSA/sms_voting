var mysql = require('mysql');

var dbHost = 'localhost';
var dbName = 'smsvoting';
var dbUser = 'smsvoting';
var dbPwd = 'smsvoting';

var pool = mysql.createPool( {
	host: dbHost,
	user: dbUser,
	password: dbPwd,
	database: dbName
} );

function runQuery( query, values, callback ) {

	pool.getConnection( function( err, connection ) {
		if( err ) {
			console.log( 'Cannot connect to database ' + err );
		} else {
			connection.query( query, values, callback );
			connection.release();
		}
	} );
}

function closeDB() {
	pool.end( function( err ) {
		if( err ) {
			console.log( 'Cannot close DB pool ' + err );
		} else {
			console.log( 'Connection to database terminated' );
		}
	} );
}

module.exports.runQuery = runQuery;
module.exports.closeDB = closeDB;

