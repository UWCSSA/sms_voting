var db = require('./db.js');

function getAttribute( attr, callback ) {
	db.runQuery( 'SELECT value FROM config WHERE attribute = ?', [attr], function( err, rows ) {
		if( err ) {
			callback( err, '' );
			return;
		}
		
		if( rows.length == 0 ) {
			callback( null, 'undefined' );
		} else {
			callback( null, rows[0].value );
		}
	} );
}

function setAttribute( attr, val, callback ) {
	db.runQuery( 'UPDATE config SET value = ? WHERE attribute = ?', [val, attr], function( err ) {
		if( typeof callback == 'function' ) {
			callback( err );
		}
	} );
}

module.exports.getAttribute = getAttribute;
module.exports.setAttribute = setAttribute;
