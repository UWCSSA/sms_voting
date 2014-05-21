<!DOCTYPE html>
<html lang="">
    <head>
    <meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	
	<title>UWCSSA 投票平台</title>
	</head>
	
	<link href='http://fonts.googleapis.com/css?family=Maven+Pro:700,900|Open+Sans:300italic,400italic,600italic,400,300,600' rel='stylesheet' type='text/css'>
	<script type="text/javascript" src="jquery.js"></script>
	<link href="css/bootstrap.css" rel="stylesheet" type="text/css">
	<link href="css/reset.css" rel="stylesheet" type="text/css" />
	<link href="css/960.css" rel="stylesheet" type="text/css" />
	<link href="css/styles.css" rel="stylesheet" type="text/css" />
	<link href="fancybox/jquery.fancybox-1.3.4.css" rel="stylesheet" type="text/css" />
	
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
	<script type="text/javascript" src="js/smooth-scroll.js"></script>
	<script type="text/javascript" src="js/jquery.sticky.js"></script>
	<script type="text/javascript" src="fancybox/jquery.fancybox-1.3.4.pack.js"></script>
	<script type="text/javascript" src="js/jquery.easing-1.3.pack.js"></script>
	<script type="text/javascript" src="fancybox/jquery.mousewheel-3.0.4.pack.js"></script>
	<script type="text/javascript" src="cform.js"></script>


<script type="text/javascript">
  var f = 0;
  var pollflag=0;
  var pollctr;
  var counter=0;
  function updatepoll(result){
    console.log(typeof result);
	
    var y=Math.floor((Math.random()*3)+1);
	var s;
	if (y == 0) s="647";
	if (y == 1) s="226";
	if (y == 2) s="416";
    if (y == 3) s="519";
    var x1=Math.floor((Math.random()*9)+1);
	var x2=Math.floor((Math.random()*9)+1);
	var x3=Math.floor((Math.random()*9)+1);
	var x4=Math.floor((Math.random()*9)+1);
	var x5=Math.floor((Math.random()*9)+1);
	var x6=Math.floor((Math.random()*9)+1);
	var x7=Math.floor((Math.random()*9)+1);
	$('#poll').html(s+x1+x2+x3+x4+x5+x6+x7);
	counter++;
	if (counter == 100) {
	  clearInterval(pollctr);
	  $('#poll').html(result[1]+result[2]+result[3]+"******"+result[10])
	}
  }
  function updatevote(result){
    if (result.mode == "vote"){
	  $('#title').html("投票结果");
	  $('#p').hide(800);
	  if (result.state == "IDLE"){
	    $('#topimg').slideDown("slow");
	  }
	  else{
	    if (result.state == "VOTING"){
		  $('#topimg').slideUp("slow");
		  if (result.data.candidates.length == 2){
		    $('#timer').html(result.data.timerRemain);
			$('#th1').html(result.data.candidates[0].cid+"号");
			$('#th2').html(result.data.candidates[1].cid+"号");
			$('#name0').html(result.data.candidates[0].name);
			$('#name1').html(result.data.candidates[1].name);
			$('#votenumber0').html(result.data.candidates[0].votes);
			$('#votenumber1').html(result.data.candidates[1].votes);
		  }
		  if (result.data.candidates.length == 3){
		    $('#firstround').hide(200)
		    $('#finalround').show(200);
			var h,m,l;
			var hc,mc,lc;
			h = result.data.candidates[0].score;
			m = result.data.candidates[1].score;
			l = result.data.candidates[2].score;
			if ((h >= l) && (h >= m)) hc=0;
			  else if ((m >= h) && (m >= l)) hc=1;
			         else hc=2;
			if ((h >= l) && (m >= l)) lc=2;
			  else if ((h >= m) && (l >= m)) lc=1;
			         else lc=0;
			mc = 3 - hc - lc;
			$('#finaltimer').html(result.data.timerRemain)
 		    $('#finalname1').html(result.data.candidates[hc].cid+"号      "+result.data.candidates[hc].name);
			$('#finalvote1').html(result.data.candidates[hc].score);
			$('#finalname2').html(result.data.candidates[mc].cid+"号      "+result.data.candidates[mc].name);
			$('#finalvote2').html(result.data.candidates[mc].score);
			$('#finalname3').html(result.data.candidates[lc].cid+"号      "+result.data.candidates[lc].name);
			$('#finalvote3').html(result.data.candidates[lc].score);
		  }
		}
		if (result.state == "VOTED"){
		  if (result.data.candidates.length == 2){
		    $('#timer').html(0);
		  }
		  if (result.data.candidates.length == 3){
		    $('#finaltimer').html(0);
		  }
		}
		if (result.state == "RESULT"){
		  if (result.data.candidates.length == 2){
		    var r1 = result.data.candidates[0].votes + result.data.candidates[0].score;
			var r2 = result.data.candidates[1].votes + result.data.candidates[1].score;
		    $('#votenumber0').html(r1);
			$('#votenumber1').html(r2);
		  }
		}
	  }
	}
	else if (pollflag == 0) {
	  pollflag=1;
	  $('#title').html("幸运观众");
	  $('#firstround').hide(800);
	  $('#p').show(800);
	  $('#topimg').slideUp("slow");
	  pollctr = setInterval(function(){updatepoll(result.winner)},30);
	  //$("#poll").html(result.winner[1]+result.winner[2]+result.winner[3]+"XXXXXX"+result.winner[10]);
	}
  }
  function update(){
  $.ajax({
    type: 'GET' ,
	url: 'http://sms.uwcssa.com:8081/result',
	dataType: 'json',
	// username: ,
	// password: ,
    success: function( result ){
      updatevote(result);
	}	
  });
  }
  $(document).ready(function(){
    setInterval("update()",1000);
  });
</script>

<style>

{ margin: 0; padding: 0; }

html { 
        background: url('images/yourimage.jpg') no-repeat center center; 
        -webkit-background-size: cover;
        -moz-background-size: cover;
        -o-background-size: cover;
        background-size: cover;
}


</style>



<img id="topimg" src="front.jpg" height="100%" width="100%">

	<!--<div class="container_16">-->
<body background="landing.png" style="font-family:'RTWS YueRoundedGothic Demo';background-repeat:no-repeat;background-size:cover;" >		
		
		<div class="subheader">
			<span id="title" style="font-size:75px;text-align:center;font-family:'RTWS YueRoundedGothic Demo'">投票结果</span>
		</div>


<!-- for voting -->

<table id="firstround" width="100%" style="margin-left:0px;margin-right:auto">
<tr>
<th style="text-align:center"><span id="th1" style="font-size:90px">11号</span></th>
<th style="vertical-align:bottom"><div style="font-size:60px;text-align:center;">倒计时</div></th>
<th style="text-align:center"><span id="th2" style="font-size:90px">12号</span></th>
</tr>
<tr>
<td>
<div id="name0" style="font-size:100px;margin:auto;text-align:center;width:350px">王若西</div>
</td>
<td><div id="timer" style="font-size:100px;text-align:center;">1</div></td>
<td>
<div id="name1" style="font-size:100px;margin:auto;text-align:center;width:350px">Shuhei</div>
</td>
</tr>
<tr>
<td>
<div id="votenumber0" style="font-size:125px; text-align: center;">10</div>
</td>
<td></td>
<td>
<div id="votenumber1" style="font-size:125px; text-align: center;">200</div>
</td>
</tr>
</table>
<div id="p" style="display:none;text-align:center">
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<span id="poll" style="font-size:140px;">5197476532</span>
</div>
<!-- final round -->
<table id="finalround" width="100%" style="margin-left:auto;margin-right:auto;display:none;max-width:650px">
<tr>
<td style="width:350px"><span id="finalname1" style="font-size:65px;margin:auto">11号 Kiki</span></td>
<td style="text-align:center"><span id="finalvote1" style="font-size:85px;text-align:center;">100</span></td>
<td style="width:200px;vertical-align:bottom"><div style="font-size:55px;text-align:center;">倒计时</div></td>
</tr>
<tr>
<td style="width:350px"><span id="finalname2" style="font-size:65px;margin:auto">11号 Kiki</span></td>
<td style="text-align:center"><span id="finalvote2" style="font-size:85px;text-align:center;">100</span></td>
<td><div id="finaltimer" style="font-size:95px;text-align:center;">1</div></td>
</tr>
<tr>
<td style="width:350px"><span id="finalname3" style="font-size:65px;margin:auto">11号 Kiki</span></td>
<td style="text-align:center"><span id="finalvote3" style="font-size:85px;text-align:center;">100</span></td>
<td></td>
</tr>
</table>
</body>
</html>
