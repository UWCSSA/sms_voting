var util = require( 'util' );
var colors = require( 'colors' );


module.exports.errLog = function( msg ) {
	util.log( msg );
};


module.exports.infoLog = function( msg ) {
	util.log( msg.cyan );
};

