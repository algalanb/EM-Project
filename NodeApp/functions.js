
"use strict";

var mqtt = require('mqtt');
var path = require('path');
var bunyan = require('bunyan');



var logger = bunyan.createLogger({name:'EMProyect'});
var prefix = 'Home';
var client;
var topic_model = "Home/+/model";
var topic_meta = "Home/+/meta";
var NodosModel = [];
var NodosMeta = [];


var Mem = []; //array that contains the memory param for every node

var Proc = []; //array that contains the process capability param for every node

var Batt = []; //array that contains the battery param for every node

var Lat = []; //array that contains the latency param for every node

function newConection (port, host, keepalive) {
		
		
	client = mqtt.connect({ port: port, host: host, keepalive: keepalive});

	
	client.on('error', function () {
        logger.error({
            method: "connect(error)",
            arguments: arguments,
            cause: "likely MQTT issue - will automatically reconnect soon",
        }, "unexpected error");
    });
    client.on('close', function () {
        logger.error({
            method: "connect(close)",
            arguments: arguments,
            cause: "likely MQTT issue - will automatically reconnect soon",
        }, "unexpected close");
    });
	

}

function checkStatus (channel, nodeID, callback){
	
	var topic = path.join(prefix, nodeID, channel);
	
		client.subscribe(topic, function () {
            /* maybe reset _subscribed on mqtt.open? */

            logger.info({
                method: "checkStatus",
                info: "suscribed to:",
                topic: topic
            });


        });
	
		client.on('message', function (topic, message) {
			callback (topic, message);
		});
		
		
}

function getModel_Meta (){
	console.log("Entramos en la funcion getModelMeta");
	client.subscribe(topic_model, function () {
        /* maybe reset _subscribed on mqtt.open? */

		logger.info({
			method: "getModel_Meta",
			info: "suscribed to:",
			topic: topic_model
		});
		
	});
		client.subscribe(topic_meta, function () {
        /* maybe reset _subscribed on mqtt.open? */

		logger.info({
			method: "getModel_Meta",
			info: "suscribed to:",
			topic: topic_meta
		});
		
	});

	client.on('message', function (topic_aux, message) {
		
		var nodos = [];
		var topic_str = topic_aux.toString();
		topic_aux = topic_aux.substring(1);
		var nodo = topic_aux.substring(topic_aux.indexOf('/') + 1, topic_aux.lastIndexOf('/'));
		var channel = topic_aux.substring(topic_aux.lastIndexOf('/') + 1 );
		
		if (channel == "model"){
		var nodo_obj = '';

		nodo_obj = '{"';
		nodo_obj = nodo_obj.concat(nodo);
		nodo_obj = nodo_obj.concat('":');
		nodo_obj = nodo_obj.concat(message.toString());
		nodo_obj = nodo_obj.concat('}');

		if(NodosModel.length == 0){
			NodosModel.push(nodo_obj);
		}
		
		for (var i = 0; i<NodosModel.length; i++){
			var obj = JSON.parse(NodosModel[i]);
			var nodo_aux = Object.keys(obj)[0];
			nodos.push(nodo_aux);
		}

		if (nodos.indexOf(nodo) != -1){
			NodosModel[nodos.indexOf(nodo)] = nodo_obj;
		}else{
			NodosModel.push(nodo_obj);			
		}
		
		nodos = [];
		}
		
		if (channel == "meta"){
		var nodo_obj = '';

		nodo_obj = '{"';
		nodo_obj = nodo_obj.concat(nodo);
		nodo_obj = nodo_obj.concat('":');
		nodo_obj = nodo_obj.concat(message.toString());
		nodo_obj = nodo_obj.concat('}');

		if(NodosMeta.length == 0){
			NodosMeta.push(nodo_obj);
		}
		
		for (var i = 0; i<NodosMeta.length; i++){
			var obj = JSON.parse(NodosMeta[i]);
			var nodo_aux = Object.keys(obj)[0];
			nodos.push(nodo_aux);
		}

		if (nodos.indexOf(nodo) != -1){
			NodosMeta[nodos.indexOf(nodo)] = nodo_obj;
		}else{
			NodosMeta.push(nodo_obj);			
		}
		
		nodos = [];
		Nodes();
		}
	});
	
	

}

function Nodes (){

	for (var i = 0; i<NodosMeta.length; i++){
		var obj = JSON.parse(NodosMeta[i]);
		var keys_nodes = Object.keys(obj);
		for (var j = 0; j < keys_nodes.length; j++) {
			var nodes = obj[keys_nodes[j]];
			var keys_params = Object.keys(nodes);
				for (var k = 0; k < keys_params.length; k++) {
					var val = nodes[keys_params[k]];
					var unit = searchUnit (keys_nodes[j],keys_params[k]);
					console.log(keys_nodes[j]);
					console.log(keys_params[k]);
					console.log(val);
					console.log(unit);
					console.log("-----------------------------------------------");
					addParam (keys_params[k], val, unit);
					console.log("Memoria");
					console.log(Mem);
					console.log("Procesamiento");
					console.log(Proc);
					console.log("Bateria");
					console.log(Batt);
					console.log("Latencia");
					console.log(Lat);
					console.log("-----------------------------------------------");
				}
		}
		
	}
	
		Mem = []; 

		Proc = []; 

		Batt = []; 

		Lat = []; 
};

function searchUnit (nodo,param){
	for (var i = 0; i<NodosModel.length; i++){
		var obj = JSON.parse(NodosModel[i]);
		if (Object.keys(obj) == nodo ){
		var unit = obj[nodo][param];
		}
	}
	
	return unit;
};

function addParam (param, valu, unit){
	switch(param)
		{
		case "mem":
			switch(unit)
			{
			case "Gb":
				valu = valu*1024;
				break;
			case "Mb":
				//By default the unit for the memory is Mb
				break;
			case "Kb":
				valu = valu/1024;
				break;
			default:
				console.log("Erro to convert the memory param")
			}
			
			Mem.push(valu);
			
		  break;
		case "proc":

			Proc.push(valu);
			
		  break;
		case "batt":
		  switch(unit)
			{
			case "V":
				valu = valu*1000;
				break;
			case "mV":
				//By default the unit for the battery is mV
				break;
			case "uV":
				valu = valu/1000;
				break;
			default:
				console.log("Erro to convert the memory param")
			}
			
			Batt.push(valu);
			
		  break;
		case "lat":
		switch(unit)
			{
		  case "seg":
				//By default the unit for the battery is mV
				break;
			case "mseg":
				valu = valu/1000;
				break;
			default:
				console.log("Erro to convert the latency param")
			}
		  Lat.push(valu);
		  
		  break;
		default:
		  console.log("Erro to add the param")
		}
			
	
};

function updateStatus (channel, nodeID, message){
	var topic = path.join(prefix, nodeID, channel);
	client.publish(topic, message, function(){
		
		logger.info ({
			method: "updateStatus",
			info: "published message",
			message: message,
			topic: topic
		});
	});
	
	
}

exports.getModel_Meta = getModel_Meta;
exports.newConection = newConection;
exports.checkStatus = checkStatus;
exports.updateStatus = updateStatus;
exports.Nodes = Nodes;