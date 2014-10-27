var pollctr = 0;
var pollid;

var updateCandidatesFlag = true;
var pollflag = true;

function updatepoll(result){
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
	pollctr++;
	
	// display real value from server
	if (pollctr === 100) {
		clearInterval(pollid);
		$("#poll").html(result.winner[1]+result.winner[2]+result.winner[3]+"XXXXXX"+result.winner[10]);
	}
}

function updatevote(result){

	if (result.mode === 'vote' && result.state === "IDLE") {
		// result is null do nothing
		$('h1').html("比赛进行中");
		hideAll();

		updateCandidatesFlag = true;
		pollflag = true;
	}
	else if (result.mode === 'vote') {
		$("#poll").hide();
		
		var candidateNum = result.data.candidates.length;
		// use a flag to avoid loading extra data
		if (updateCandidatesFlag) {
			updateCandidatesFlag = false;
			// hide third column
			if (candidateNum <= 3) {
				if (candidateNum === 2) {
					// hide third column
					$('table tr > :nth-child(3)').hide();
				}
				// update candidate information, id and name
				for (var i = 0; i < candidateNum; i++) {
					$('#c_id'+i).html(result.data.candidates[i].cid+"号");
				}
				for (var i = 0; i < candidateNum; i++) {
					$('#c_name'+i).html(result.data.candidates[i].name);
				}
			}
			// repechage
			else if (candidateNum === 12) {
				for (var i = 0; i < candidateNum; i++) {
					$('#r_id'+i).html(result.data.candidates[i].cid+"号");
				}
				for (var i = 0; i < candidateNum; i++) {
					$('#r_name'+i).html(result.data.candidates[i].name);
				}
			}
		}

		if (result.state === "VOTING"){
			var s = result.data.timerRemain;
			if (s <= 20) {
				s = '<span style="color:red">' + s + '</span>'
			}
			$('h1').html('投票进行中 ' + s);
			
			$('#total').hide();

			// repechage
			if (candidateNum === 12) {
				$('#voting').hide();
				$('#repechage').show();
				for (var i = 0; i < candidateNum; i++) {
					$('#r_votes'+i).html(result.data.candidates[i].votes+" 票");
				}
			}
			// competition
			else {
				$('#repechage').hide();
				$('#voting').show();
				// update score and votes
				for (var i = 0; i < candidateNum; i++) {
					$('#c_score'+i).html(result.data.candidates[i].score+" 分");
				}
				for (var i = 0; i < candidateNum; i++) {
					$('#c_votes'+i).html(result.data.candidates[i].votes+" 票");
				}
				// update progress bar
				var maxVotes = result.data.maxVotes;
				for (var i = 0; i < candidateNum; i++) {
					setProgressBar("#c_prog"+i, result.data.candidates[i].votes / maxVotes * 100);
				}
			}
		}
		else if (result.state === "VOTED"){
			$('h1').html('投票结束');
		}
		else if (result.state === 'RESULT'){
			$('h1').html('投票结果');

			// competition
			if (candidateNum <= 3) {
				// calculate total votes
				var totalVotes = 0;
				for (var i = 0; i < candidateNum; i++) {
					totalVotes += result.data.candidates[i].votes;
				}
				// calculate total score
				for (var i = 0; i < candidateNum; i++) {
					var t = computeTotal(result.data.candidates[i].votes, totalVotes, result.data.candidates[i].score);
					totalVotes += result.data.candidates[i].votes;
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
					disableHighlight(i);
					var votes = result.data.candidates[i].votes;
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
	}
	else if (result.mode === 'poll' && pollflag) {
		pollflag = false;
		$('h1').html("抽奖");
		$('#voting').hide();
		$('#repechage').hide();
		$("#poll").show();

		pollid = setInterval(function(){updatepoll(result);},30);
	}
}

function update(){
	$.ajax({
		type: 'GET' ,
		url: 'http://localhost:8081/result',
		dataType: 'json',
		success: function( result ){
			updatevote(result);
		}
	});
}

function computeTotal(votes, totalVotes, score) {
	// 60% from mentor, 40% from audiance, in another word,
	// a candidate can get 100 only if his mentor gives him 100
	// and he gets all audience's votes
	return votes / totalVotes * 40 + score * 0.6;
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

$(document).ready(function(){
	setInterval(update,1000);
});