var f = 0;
var pollflag=false;
var pollctr;
var counter=0;

// function updatepoll(result){
// 	console.log(typeof result);

// 	var y=Math.floor((Math.random()*3)+1);
// 	var s;
// 	if (y === 0) s="647";
// 	if (y === 1) s="226";
// 	if (y === 2) s="416";
// 	if (y === 3) s="519";
// 	var x1=Math.floor((Math.random()*9)+1);
// 	var x2=Math.floor((Math.random()*9)+1);
// 	var x3=Math.floor((Math.random()*9)+1);
// 	var x4=Math.floor((Math.random()*9)+1);
// 	var x5=Math.floor((Math.random()*9)+1);
// 	var x6=Math.floor((Math.random()*9)+1);
// 	var x7=Math.floor((Math.random()*9)+1);
// 	$('#poll').html(s+x1+x2+x3+x4+x5+x6+x7);
// 	counter++;
// 	if (counter === 100) {
// 		clearInterval(pollctr);
// 		$('#poll').html(result[1]+result[2]+result[3]+"******"+result[10])
// 	}
// }

function updatevote(result){
	var candidateNum = result.data.candidates.length;

	if (result.mode === 'vote' && result.state === 'IDLE'){
		$('h1').html("比赛进行中");

		$("#poll").hide();
		$("#voting").hide();

		// update candidate information
		// hide third column
		if (candidateNum === 2) {
			$('table tr > :nth-child(3)').hide();
		}
		$('#c_id0').html(result.data.candidates[0].c_id+"号");
		$('#c_id1').html(result.data.candidates[1].c_id+"号");
		if (candidateNum === 3) {
			$('#c_id2').html(result.data.candidates[2].c_id+"号");
		}
		// update picture
		// TODO
		// name
		$('#c_name0').html(result.data.candidates[0].c_name);
		$('#c_name1').html(result.data.candidates[1].c_name);
		if (candidateNum === 3) {
			$('#c_name2').html(result.data.candidates[2].c_name);
		}
	}

	else if (result.mode === 'vote') {
		$('#voting').show();
		$("#poll").hide();

		if (result.state === "VOTING"){
			$('h1').html('投票进行中');
			// hide result row
			$('#total').hide();

			$('#timer').html(result.data.timerRemain);
			// update score
			$('#c_score0').html(result.data.candidates[0].c_score);
			$('#c_score1').html(result.data.candidates[1].c_score);
			if (candidateNum === 3) {
				$('#c_score2').html(result.data.candidates[2].c_score);
			}
			// update votes
			$('#c_votes0').html(result.data.candidates[0].votes);
			$('#c_votes1').html(result.data.candidates[1].votes);
			if (candidateNum === 3) {
				$('#c_votes2').html(result.data.candidates[2].votes);
			}
		}
		else if (result.state === "VOTED"){
			$('h1').html('投票结束');
			$('#timer').html(0);
			// TODO temporarily stop refreshing 
		}
		else if (result.state === 'RESULT'){
			$('h1').html('投票结果');
			$('#total').show();

			var t0 = result.data.candidates[0].votes + result.data.candidates[0].score;
			var t1 = result.data.candidates[1].votes + result.data.candidates[1].score;
			$('#c_total0').html(t0);
			$('#c_total1').html(t1);
			if (candidateNum === 3) {
				var t2 = result.data.candidates[2].votes + result.data.candidates[2].score;
				$('#c_total2').html(t2);
			}
		}
	}
	else if (result.mode === 'poll') {
		$('h1').html("抽奖");
		$('#voting').hide();
		$("#poll").show();

		// TODO
		// pollctr = setInterval(function(){updatepoll(result.winner)},30);
	  //$("#poll").html(result.winner[1]+result.winner[2]+result.winner[3]+"XXXXXX"+result.winner[10]);
	}
}

function update(){
	$.ajax({
		type: 'GET' ,
		url: 'http://sms.uwcssa.com:8081/result',
		dataType: 'json',
		success: function( result ){
			updatevote(result);
		}
	});
}

// $(document).ready(function(){
// 	setInterval("update()",1000);
// });