
function Message() {}

var d = new Date();
Message.prototype.Sender = '';
Message.prototype.Message = '';
Message.prototype.MessageID = '';
Message.prototype.Timestamp = Math.round( d.getTime() / 1000 );
Message.prototype.SendTime = d.toUTCString();
Message.prototype.LogString = '';


function Response( rc, results ) {
	this.StatusCode = parseInt( rc );
	this.Results = results;
}

Response.prototype.isSucceed = function() {
	return this.StatusCode == 0;
};

Response.prototype.toString = function() {
	return 'StatusCode ' + this.StatusCode;
};

module.exports.Response = Response;
module.exports.Message = Message;
