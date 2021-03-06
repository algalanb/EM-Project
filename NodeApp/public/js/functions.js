var ip = "192.168.1.3";
var port = "8080";
var interval_nodes;
var interval_real_time;
function displayNodes(operation) {
	;
	if (operation == "start"){
		$(function(){
			$('#dynamictable').append('<table id="myTable"></table>');
			var table = $('#dynamictable').children();
			interval_nodes = setInterval(function() {
				  $.ajax({
					url: 'http://'+ip+':'+port+'/nodes',
					type: 'GET',
					success : function(data) {
						var res = data;
						var nodos = res.nodes;
						var stg = res.stgNodes;
						var tot = res.totNodes;
						var head = "<tr><th>nodo</th><th>mem("+res.weigths.weightMem+")</th><th>proc("+res.weigths.weigthProc+")</th><th>batt("+res.weigths.weigthBatt+")</th><th>Lat("+res.weigths.weigthLat+")</th><th>Power("+res.weigths.weigthPower+")</th><th>RAM("+res.weigths.weigthRAM+")</th></tr>"
						document.getElementById("myTable").remove();
						$('#dynamictable').append('<table id="myTable"></table>');
						var table = $('#dynamictable').children();
						table.append(head);
						for (var i=0; i<nodos.length; i++){
							var node = nodos[i];
							if(tot.indexOf(node.nodo) != -1){
								if(stg.indexOf(node.nodo) != -1){
										var line = "<tr style='color: green'><td>"+node.nodo+"</td><td>"+node.data[0].val+" ("+node.data[0].unit+")</td><td>"+node.data[1].val+" ("+node.data[1].unit+")</td><td>"+node.data[2].val+" ("+node.data[2].unit+")</td><td>"+node.data[5].val+" ("+node.data[5].unit+")</td><td>"+node.data[3].val+" ("+node.data[3].unit+")</td><td>"+node.data[4].val+" ("+node.data[4].unit+")</td></tr>"
								}else{
									var line = "<tr style='color: red'><td>"+node.nodo+"</td><td>"+node.data[0].val+" ("+node.data[0].unit+")</td><td>"+node.data[1].val+" ("+node.data[1].unit+")</td><td>"+node.data[2].val+" ("+node.data[2].unit+")</td><td>"+node.data[5].val+" ("+node.data[5].unit+")</td><td>"+node.data[3].val+" ("+node.data[3].unit+")</td><td>"+node.data[4].val+" ("+node.data[4].unit+")</td></tr>"
								}
								table.append(line);
							}
						}      	
					}
				});
			},500); 
		});
	}else{
		clearInterval(interval_nodes);
		document.getElementById("myTable").innerHTML = "";
	}
}
function realTime(node,param,operation) {
	if (operation == "start"){
		var url_req = 'http://'+ip+':'+port+'/realtimereq/'+node;
		var url_main = 'http://'+ip+':'+port+'/realtime/'+node +'/'+ param;
		var flag;
		$(function(){
			$.ajax({
				url: url_req ,
				type: 'GET',
				success : function(data) {

					flag = data.res;
				}
			});
		});
		
		if(flag = "ok"){	
			interval_real_time = setInterval(function() {
				$(function(){
				  $.ajax({
					url: url_main,
					type: 'GET',
					success : function(data) {
						if (data.error != undefined){
							console.log("error");
						}else{
							var chartProperties = {
								"caption": node,
								"xAxisName": "timestamp",
								"labelDisplay": "rotate",
								"yAxisName": param,
								"showValues": "1",
								"lineThickness": "5",
								"theme": "fint",
								"divLineDashed": "1",
								"divLineDashLen": "5",
								"divLineDashGap": "6"
							  };

							  var categoriesArray = [{
								  "category" : data["categories"]
							  }];
							  var lineChart = new FusionCharts({
								type: 'msline',
								renderAt: 'chart-location',
								width: '1000',
								height: '600',
								dataFormat: 'json',
								dataSource: {
								  chart: chartProperties,
								  categories : categoriesArray,
								  dataset : data["dataset"]
								}
							  });
							  lineChart.render();
						}
				  }
				  });
				});
			}, 3000);
		}

	}else{
		clearInterval(interval_real_time);
		//document.getElementById("chart-location").remove();
		document.getElementById("chart-location").innerHTML = "";
	}

}
function specificQuery(node,param, max, min) {

	var url_main = 'http://'+ip+':'+port+'/istate/'+node +'/'+ param +'/'+max +'/'+min;
	
	$(function(){
	  $.ajax({
		url: url_main,
		type: 'GET',
		success : function(data) {
			if (data.error != undefined){
				console.log("error");
			}else{
				
				var chartProperties = {
					"caption": node,
					"xAxisName": "timestamp",
					"labelDisplay": "rotate",
					"yAxisName": param,
					"showValues": "0",
					"lineThickness": "5",
					"theme": "fint",
					"divLineDashed": "1",
					"divLineDashLen": "5",
					"divLineDashGap": "6"
				  };

				  var categoriesArray = [{
					  "category" : data["categories"]
				  }];
				  var lineChart = new FusionCharts({
					type: 'msline',
					renderAt: 'chart-location',
					width: '1000',
					height: '600',
					dataFormat: 'json',
					dataSource: {
					  chart: chartProperties,
					  categories : categoriesArray,
					  dataset : data["dataset"]
					}
				  });
				  lineChart.render();
			}
	  }
	  });
	});	
}
	
function changeLed(node,led,action){
	var  url_led = 'http://'+ip+':'+port+'/ostate/'+node;
	var data = "{\n      \"act\": \""+led+"\", \"val\": \""+action+"\"\n}";
	var settings = {
	  "async": true,
	  "crossDomain": true,
	  "url": url_led,
	  "method": "PUT",
	  "headers": {
		"content-type": "application/json",
		"cache-control": "no-cache",
	  },
	  "processData": false,
	  "data": "{\n      \"act\": \""+led+"\", \"val\": \""+action+"\"\n}"
	}

	$.ajax(settings).done(function (response) {
		alert("Done!!");
	  console.log(response);
	});
}	
	
$(document).ready(function(){
    $("#show").click(function(){
        displayNodes("start");
		$("#show").hide();
		$("#hide").show();
    });
	$("#hide").click(function(){
        displayNodes("stop");
		$("#show").show();
		$("#hide").hide();
    });
	$("#realtime").click(function(){
		$("#nodeSel").show();
		$("#paramSel").show();
		$("#accept").show();
		$("#specific").hide();	
		$("#realtime").hide();
    });
	$("#accept").click(function(){
		var node = document.getElementById("nodeSel").value;
		var param = document.getElementById("paramSel").value;
		$("#accept").hide();
		$("#hide_rt").show();
		realTime(node,param,"start");
    });
	
	$("#hide_rt").click(function(){
		var node = document.getElementById("nodeSel").value;
		var param = document.getElementById("paramSel").value;
		$("#realtime").show();
		$("#nodeSel").hide();
		$("#paramSel").hide();
		$("#accept").hide();
		$("#hide_rt").hide();
		$("#specific").show();
		realTime(node,param,"stop");
    });
	
	$("#specific").click(function(){
		$("#filter").show();
		$("#accept_q").show();
    });
	
	$("#accept_q").click(function(){
		$("#filter").hide();
		$("#accept_q").hide();
		$("#hide_sq").show();
		var node = document.getElementById("nodeSel_q").value;
		var param = document.getElementById("paramSel_q").value;
		var start = Date.parse(document.getElementById("start").value);
		var end = Date.parse(document.getElementById("end").value);
		specificQuery(node,param, start-7200000, end-7200000);
    });
		
	$("#hide_sq").click(function(){
		$("#specific").show();	
		$("#realtime").show();
		$("#hide_sq").hide();
		document.getElementById("chart-location").remove();
    });
	
	$("#leds").click(function(){
		$("#div_led").show();
		$("#accept_led").show();
		$("#hide_led").show();
		$("#leds").hide();
    });
	
	$("#accept_led").click(function(){
		$("#div_led").show();
		var node = document.getElementById("node_led").value;
		var led = document.getElementById("led").value;
		var action = document.getElementById("action_led").value;
		changeLed(node,led,action);
    });
	
	$("#hide_led").click(function(){
		$("#div_led").hide();
		$("#accept_led").hide();
		$("#hide_led").hide();
		$("#leds").show();
    });
	
	
});

