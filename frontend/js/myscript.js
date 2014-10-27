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
		$("#poll").hide();
		$("#voting").hide();
		updateCandidatesFlag = true;
		pollflag = true;
	}
	else if (result.mode === 'vote') {
		var candidateNum = result.data.candidates.length;
		// use a flag to avoid loading extra data
		if (updateCandidatesFlag) {
			updateCandidatesFlag = false;
			// hide third column
			if (candidateNum === 2) {
				$('table tr > :nth-child(3)').hide();
			}
			// update candidate information
			$('#c_id0').html(result.data.candidates[0].cid+"号");
			$('#c_id1').html(result.data.candidates[1].cid+"号");
			if (candidateNum === 3) {
				$('#c_id2').html(result.data.candidates[2].cid+"号");
			}
			// name
			$('#c_name0').html(result.data.candidates[0].name);
			$('#c_name1').html(result.data.candidates[1].name);
			if (candidateNum === 3) {
				$('#c_name2').html(result.data.candidates[2].name);
			}
		}

		if (result.state === "VOTING"){
			var s = result.data.timerRemain;
			if (s <= 20) {
				s = '<span style="color:red">' + s + '</span>'
			}
			$('h1').html('投票进行中 ' + s);
			
			$('#voting').show();
			$('#total').hide();

			// update score
			$('#c_score0').html(result.data.candidates[0].score+" 分");
			$('#c_score1').html(result.data.candidates[1].score+" 分");
			if (candidateNum === 3) {
				$('#c_score2').html(result.data.candidates[2].score+" 分");
			}
			// update votes
			$('#c_votes0').html(result.data.candidates[0].votes+" 票");
			$('#c_votes1').html(result.data.candidates[1].votes+" 票");
			if (candidateNum === 3) {
				$('#c_votes2').html(result.data.candidates[2].votes+" 票");
			}
			// update progress bar
			var maxVotes = result.data.maxVotes;
			setProgressBar("#c_prog0", result.data.candidates[0].votes / maxVotes * 100);
			setProgressBar("#c_prog1", result.data.candidates[1].votes / maxVotes * 100);
			setProgressBar("#c_prog2", result.data.candidates[2].votes / maxVotes * 100);
		}
		else if (result.state === "VOTED"){
			$('h1').html('投票结束');
		}
		else if (result.state === 'RESULT'){
			$('h1').html('投票结果');
			$('#total').show();

			var totalVotes = 0;
			totalVotes += result.data.candidates[0].votes;
			totalVotes += result.data.candidates[1].votes;
			if (candidateNum === 3) {
				totalVotes += result.data.candidates[2].votes;
			}

			var t0 = computeTotal(result.data.candidates[0].votes, totalVotes, result.data.candidates[0].score);
			var t1 = computeTotal(result.data.candidates[1].votes, totalVotes, result.data.candidates[1].score);
			$('#c_total0').html("总分 " + t0);
			$('#c_total1').html("总分 " + t1);
			if (candidateNum === 3) {
				var t2 = computeTotal(result.data.candidates[2].votes, totalVotes, result.data.candidates[2].score);
				$('#c_total2').html("总分 " + t2);
			}
		}
	}
	else if (result.mode === 'poll' && pollflag) {
		pollflag = false;
		$('h1').html("抽奖");
		$('#voting').hide();
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

$(document).ready(function(){
	setInterval(update,1000);
});