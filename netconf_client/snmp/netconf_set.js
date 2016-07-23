/*
 * Copyright (C) 2016 Deutsche Telekom AG.
 *
 * Author: Mislav Novakovic <mislav.novakovic@sartura.hr>
 * Author: Luka Perkov <luka.perkov@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var netconf_client = require('../netconf_client')
var util = require('util')
var Promise = require('promise');
var fs = require('fs')
var exec = require('child-process-promise').exec;
var libxmljs = require("libxmljs");
var pd = require('pretty-data').pd;
var config = require('../../core/config')
var yang = require("libyang")

var nodeid = '/'

config.show_logs = false

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		xpath = process.argv[index]
	else if (index == 3)
		value = process.argv[index]
});

//TODO running hard coded
var left_xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
                "<target><running/></target>" +
		"<config>"
var right_xml = '</config>' +
		'</edit-config>'


function download_server_schemas() {
	return exec('node ./download_schemas.js')
	.then(function (result) {
		return run()
	})
	.catch(function (err) {
		console.error('ERROR: ', err);
	});

}

function check_schemas(path) {
	return new Promise(function(resolve, reject) {
	return fs.open(path,'r',function(err,fd){
		if (err && err.code=='ENOENT') {
			fs.mkdirSync(path);
			return download_server_schemas()
		} else {
			return run()
		}
	});
	})
}

function run() {
	// get namespace

	var ctx = yang.ly_ctx_new(config.remote_yang_dir)
	var fs = require('fs');
	var files = fs.readdirSync(config.remote_yang_dir);

	for (var i in files) {
		mod = yang.lys_parse_path(ctx, config.remote_yang_dir + files[i], yang.LYS_IN_YANG);
	}

	nodes = xpath.split("\/")

	var i = 0

	nodes.forEach(function(element) {
		i++
		if (element == '') return
		keys = element.split(/[\[,\]]+/)
		if (keys.length == 1) {
			nodeid += element
			node = element.split(":")
			if (node.length > 1) {
				result = yang.ly_ctx_get_node(ctx, null, nodeid)
				left_xml = left_xml + '<' + node[1]  + ' xmlns="' + result.module.ns + '">'
				right_xml = '</' + node[1] + '>' + right_xml
			} else {
				left_xml = left_xml + '<' + element + '>'

				if (i < nodes.length)
					right_xml = '</' + element + '>' + right_xml
				else
					right_xml = value + '</' + element + '>' + right_xml
			}
			nodeid += '/'
		} else if (keys.length > 1 ) {
			left_xml = left_xml + '<' + keys[0] + '>'
			key = keys[1].split(/[=,\']+/)
			left_xml = left_xml + '<' + key[0] + '>' + key[1] + '</' + key[0] + '>'
			right_xml = '</' + keys[0] + '>' + right_xml
			nodeid += keys[0] + '/'
		}
	})

	xml = left_xml + right_xml

	netconf_client.create().then(function(client)
	{
		client.send(xml).thenDefault(function(reply)
		{
			xmlDoc = libxmljs.parseXml(reply)
			response = xmlDoc.childNodes()

			if (response.toString() != "<ok/>") {
		                xml_pp = pd.xml(response.toString());
				console.log(xml_pp)
			}

			client.send_close().then(function (resolve, reject) {

			}).then(function (resolve, reject) {
				process.exit(0)
			}).catch(function (err) {
				console.error('ERROR: ', err);
			})
		})
	})
}

Promise.resolve(check_schemas(config.remote_yang_dir))
