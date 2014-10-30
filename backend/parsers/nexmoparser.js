var accountKey = 'bcc4bc28';
var accountSecret = '6752ab0f';
var inboundNumber = '12898099764';

var util = require( 'util' );
var Message = require( '../types.js' ).Message;
var Nexmo = require( 'nexmoapi' ).Nexmo;
var logger = require( '../logger.js' );


function NexmoMessage() {
	Message.call( this );
	
	var d = new Date();
	
	this.Sender = '';
	this.Message = '';
	this.MessageID = '';
	this.Timestamp = Math.round( d.getTime() / 1000 );
	this.SendTime = d.toTimeString();
	this.LogString = '';
	this.done = function() {
		this.LogString = 'MSG ID ' + this.MessageID + ' RECV\'d ON ' + this.SendTime + ' FROM ' + this.Sender + ':\n';
		this.LogString += '\t' + this.Message + '\n';
	};
}


util.inherits( NexmoMessage, Message );

function NexmoParser() {
	
	this.checkMessage = function( msg ) {
		
		if( typeof msg != "object" ) {
			return false;
		}
		
		if( typeof msg.msisdn == "undefined" ||
			typeof msg.to == "undefined" ||
			typeof msg.messageId == "undefined" ||
			typeof msg.text == "undefined" ) {
				
			return false;
		}
		
		if( msg.to !== inboundNumber ) {
			return false;
		}
		
		return true;
	}
	
	this.parseMessage = function( msg ) {
		
		var ts = Math.round( new Date().getTime() / 1000 );
		
		var ret = new NexmoMessage();
		
		ret.Sender = msg.msisdn;
		ret.Message = msg.text;
		ret.MessageID = msg.messageId;
		ret.done();
		
		return ret;
	}
	
	this.nexmo_api = new Nexmo( accountKey, accountSecret, true );
	
}

NexmoParser.prototype.sendMessage = function( number, msg ) {
	
	this.nexmo_api.send( inboundNumber, number, msg, function( err ) {
		if( err ) {
			logger.errLog( 'Cannot send SMS to ' + number + ' content ' + msg );
		} else {
			logger.infoLog( 'SMS sent to ' + number );
		}
	} );
	
};

module.exports.NexmoParser = NexmoParser;
module.exports.NexmoMessage = NexmoMessage;


// {
// 	"msisdn":"15197816103",
// 	"to":"12893490912",
// 	"messageId":"0300000027F1072A",
// 	"text":"nexmo message",
// 	"type":"text",
// 	"message-timestamp":"2013-10-26 16:40:46"
// }
