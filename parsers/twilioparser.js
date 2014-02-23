var accountSID = 'AC369976eaa7875c32914103dd8918486d';
var accountToken = 'd0abc96a7dec45736725c43561fc8628';
var inboundNumber = '12267804517';

function TwilioParser() {
	
	this.checkMessage = function( msg ) {
		if( typeof msg.AccountSid == "undefined" ) {
			return false;
		}
		
		if( msg.AccountSid == accountSID && 
			typeof msg.Body === "string" &&
			typeof msg.From === "string" ) {
			return true;
		}
		
		return false;
	}
	
	
	this.parseMessage = function( msg ) {
		var d = new Date();
		var ts = Math.round( d.getTime() / 1000 );
		var ret = {
			Sender: msg.From,
			Message: msg.Body,
			Timestamp: ts,
			SendTime: d.toTimeString(),
			MessageID: msg.SmsMessageSid
		};
	}
	
}

module.exports = TwilioParser;

// {
// 	"AccountSid":"ACb4c0db00d68a2fd3ed2887d7f2c8fb6c",
// 	"MessageSid":"SMb2f2333441352d2ca7e815ae6e3bc4fe",
// 	"Body":"lalal",
// 	"ToZip":"",
// 	"ToCity":"GUELPH",
// 	"FromState":"ON",
// 	"ToState":"ON",
// 	"SmsSid":"SMb2f2333441352d2ca7e815ae6e3bc4fe",
// 	"To":"+12267804517",
// 	"ToCountry":"CA",
// 	"FromCountry":"CA",
// 	"SmsMessageSid":"SMb2f2333441352d2ca7e815ae6e3bc4fe",
// 	"ApiVersion":"2010-04-01",
// 	"FromCity":"KITCHENER",
// 	"SmsStatus":"received",
// 	"NumMedia":"0",
// 	"From":"+15197816103",
// 	"FromZip":""
// }
