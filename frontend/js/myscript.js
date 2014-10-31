var pollInterval;
var pollCtr = 0;

var updateCandidatesFlag = true;
var pollflag = true;

function refresh(){
	$.ajax({
		type: 'GET' ,
		url: 'http://test.tinnytian.com:8081/result',
		dataType: 'json',
		success: function(response){
			update(response);
		}
	});
}


function update(response){

	if (response.mode === 'vote' && response.state === "IDLE") {
		// response is null do nothing
		$('h1').html("比赛进行中");
		hideAll();
		resetGlobalVars();
	}
	else if (response.mode === 'vote') {
		$("#poll").hide();
		
		// use a flag to avoid loading extra data
		if (updateCandidatesFlag) {
			updateCandidatesFlag = false;
			updateCandidatesInfo(response);
		}

		if (response.state === "VOTING"){
			var s = response.data.timerRemain;
			if (s <= 20) {
				s = '<span style="color:red">' + s + '</span>'
			}
			$('h1').html('投票进行中 ' + s);
			updateVotes(response);
		}
		else if (response.state === "VOTED"){
			$('h1').html('投票结束');
			updateVotes(response);
		}
		else if (response.state === 'RESULT'){
			$('h1').html('投票结果');
			updateResults(response);
		}
	}
	else if (response.mode === 'poll' && pollflag) {
		pollflag = false;
		$('h1').html("抽奖");
		$('#voting').hide();
		$('#repechage').hide();
		$("#poll").show();

		pollInterval = setInterval(function(){updatepoll(response);},30);
	}
}

function updatepoll(response){
	// fake animation
	var s;
	// return a random number between 0 and 3
	var y = Math.floor((Math.random() * 4)); 
	switch (y) {
		case 0:
			s = "647";
			break;
		case 1:
			s = "226";
			break;
		case 2:
			s = "416";
			break;
		case 3:
			s = "519";
			break;
	}

	// random numbers from 0-9
	var x1=Math.floor((Math.random()*10));
	var x2=Math.floor((Math.random()*10));
	var x3=Math.floor((Math.random()*10));
	var x4=Math.floor((Math.random()*10));
	var x5=Math.floor((Math.random()*10));
	var x6=Math.floor((Math.random()*10));
	var x7=Math.floor((Math.random()*10));

	$('#poll').html(s+x1+x2+x3+x4+x5+x6+x7);
	// repeat 100 times
	pollCtr++;
	
	// display real value from server
	if (pollCtr >= 100) {
		clearInterval(pollInterval);
		$("#poll").html(response.winner[1]+response.winner[2]+response.winner[3]+"XXX"
			+response.winner[7]+response.winner[8]+response.winner[9]+response.winner[10]);
	}
}

// need to change for the final round
function computeTotal(votes, totalVotes, score) {
	// 60% from mentor, 40% from audiance, in another word,
	// a candidate can get 100 only if his mentor gives him 100
	// and he gets all audience's votes
	var total;
	if (totalVotes === 0) {
		// if an error occurs and no votes received, use score
		total = score * 0.6;
	}
	else {
		total = votes / totalVotes * 40 + score * 0.6;
	}
	return total.toFixed(2); // round to 2 decimals
}

function setProgressBar(id, val) {
  $(id).css('width', val+'%').attr('aria-valuenow', val); 
}	

function setHighlight(id) {
	$('#r_id'+id).css("background-color", "#428bca");
	$('#r_name'+id).css("background-color", "#428bca");
	$('#r_votes'+id).css("background-color", "#428bca");
}

function disableHighlight(id) {
	$('#r_id'+id).css("background-color", "");
	$('#r_name'+id).css("background-color", "");
	$('#r_votes'+id).css("background-color", "");

}

// hide all sections, for resetting purpose
function hideAll() {
	$('#voting').hide();
	$('#poll').hide();
	$('#repechage').hide();
}

function resetGlobalVars() {
	updateCandidatesFlag = true;
	pollflag = true;
	pollCtr = 0;
}

function updateCandidatesInfo(response) {
	var candidateNum = response.data.candidates.length;
	// hide third column
	if (candidateNum <= 3) {
		if (candidateNum === 2) {
			// hide third column
			$('table tr > :nth-child(3)').hide();
		}
		// update candidate information, id and name
		for (var i = 0; i < candidateNum; i++) {
			$('#c_id'+i).html(response.data.candidates[i].cid+"号");
		}
		for (var i = 0; i < candidateNum; i++) {
			$('#c_name'+i).html(response.data.candidates[i].name);
		}
	}
	// repechage
	else if (candidateNum === 12) {
		for (var i = 0; i < candidateNum; i++) {
			$('#r_id'+i).html(response.data.candidates[i].cid+"号");
		}
		for (var i = 0; i < candidateNum; i++) {
			$('#r_name'+i).html(response.data.candidates[i].name);
		}
	}
}


function updateVotes(response) {
	var candidateNum = response.data.candidates.length;
	// repechage
	if (candidateNum === 12) {
		$('#voting').hide();
		$('#repechage').show();
		for (var i = 0; i < candidateNum; i++) {
			disableHighlight(i)
			$('#r_votes'+i).html(response.data.candidates[i].votes+" 票");
		}
	}
	// competition
	else {
		$('#repechage').hide();
		$('#voting').show();
		$('#total').hide();
		// update score and votes
		for (var i = 0; i < candidateNum; i++) {
			$('#c_score'+i).html(response.data.candidates[i].score+" 分");
		}
		for (var i = 0; i < candidateNum; i++) {
			$('#c_votes'+i).html(response.data.candidates[i].votes+" 票");
		}
		// update progress bar
		var maxVotes = response.data.maxVotes;
		for (var i = 0; i < candidateNum; i++) {
			setProgressBar("#c_prog"+i, response.data.candidates[i].votes / maxVotes * 100);
		}
	}
}


function updateResults(response) {
	var candidateNum = response.data.candidates.length;
	// competition
	if (candidateNum <= 3) {
		// calculate total votes
		var totalVotes = 0;
		for (var i = 0; i < candidateNum; i++) {
			totalVotes += response.data.candidates[i].votes;
		}
		// calculate total score
		for (var i = 0; i < candidateNum; i++) {
			var t = computeTotal(response.data.candidates[i].votes, totalVotes, response.data.candidates[i].score);
			$('#c_total'+i).html("总分 " + t);
		}
		$('#voting').show();
		$('#total').show();
		$('#repechage').hide();
	}
	// repechage
	else if (candidateNum === 12) {
		// find max
		var max = -1;
		var index;
		for (var i = 0; i < candidateNum; i++) {
			var votes = response.data.candidates[i].votes;
			if (votes > max) {
				max = votes;
				index = i;
			}
			// in case of multiple winners
			else if (votes === max) {
				index = index + "," + i;
			}
		}
		if (typeof index === "number") {
			setHighlight(index);
		}
		if (typeof index === "string") {
			var winners = index.split(",");
			for (var i in winners) {
				setHighlight(winners[i]);
			}
		}
		$('#voting').hide();
		$('#repechage').show();
	}
}


$(document).ready(function(){
	setInterval(refresh,1000);
});