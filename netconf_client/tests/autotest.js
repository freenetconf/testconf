/*
 * Copyright (C) 2016 Cisco Systems, Inc.
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

var util = require('util')
var libxmljs = require("libxmljs");
var pd = require('pretty-data').pd;
var fs = require('fs')
var Promise = require('promise')
var exec = require('child-process-promise').exec;
var config = require('../../core/config')
config.show_logs = false
config.yang_folder = '/tmp/testconf_u0VDCKBXlJRAC8qHJ47O'

// get yang models
function randomfolder() {
    var length = 20
    var result = ''
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
    return result;
}

var yang_list = '' +
'<get>' +
	'<filter type="subtree">' +
		'<netconf-state xmlns="urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring">' +
			'<schemas/>' +
		'</netconf-state>' +
	'</filter>' +
'</get>'

function download_schema_old(folder, xml) {
	return new Promise(function(resolve, reject){
		var netconf_client = require('../netconf_client')
		if (format == 'yang') {
			var request = '<get-schema>' +  xml + '</get-schema>'

			return netconf_client.create(config).then(function(client) {
			        return client.send(request).thenDefault(function(reply) {
					console.log("####################")
			                console.log(reply)
			                console.log(util.inspect(reply, {showHidden: false, depth: null}));
					return resolve(Schemas)
			                return client.send_close().thenDefault()
			        })
			})
		} else {
			return
		}
	})
}

function download_schema(folder, xml){
	var xmlDoc = libxmljs.parseXml(xml);
	var format = xmlDoc.get('/schema/format').childNodes()
	return new Promise(function(resolve, reject){
		if (format == 'yang') {
			var netconf_client = require('../netconf_client')
			var request = '<get-schema>' +  xml + '</get-schema>'
			return netconf_client.create().then(function(client) {
				console.log("--------------------------------------------")
				return client.send(request).thenDefault(function(reply) {

				        console.log(reply)
					return client.send_close().thenDefault()
				})
			})
		} else {
			return
		}
	})
}

function get_schema_list(){
	return new Promise(function(resolve, reject){
		var netconf_client = require('../netconf_client')
		return netconf_client.create().then(function(client) {
			return client.send(yang_list).thenDefault(function(reply) {
				// remove xmlns, TODO parse with xmlns
				xml = reply.replace(/\sxmlns[^"]+"[^"]+"/g, '')

				var xmlDoc = libxmljs.parseXml(reply)

				// remove first line
				var children = xmlDoc.root().childNodes()
				var child = children[0]

				// remove '#' character
				var states = children[0].toString().split('\n')[2]

				xmlDoc = libxmljs.parseXml(states)

				// create folder in /tmp
				folder_name = "/tmp/" + randomfolder()
				fs.mkdirSync(folder_name)
				Schemas = xmlDoc.childNodes()[0].childNodes()

				//return resolve(Schemas)
				return client.send_close().thenPromise()
			}).then(function() {
					  console.log("1 #####################"); // true
				})

		}).then(function(result) {
			console.log("2 ###########################################")
		})
	}).then(function(result) {
		console.log("2 ###########################################")
		console.log(Schemas.toString())
		return resolve("test")
		return Promise.all(result.map(function (element) {
			var xml = element.toString()
			return download_schema(folder_name, xml)
		}))
	})
}

exec('node ./get_schemas.js')
.then(function (result) {
	var stdout = result.stdout
	var stderr = result.stderr

	//create tmp folder
	folder = "/tmp/testconf_" + randomfolder()
	fs.mkdirSync(folder)

	//console.log(stdout)
	xmlDoc = libxmljs.parseXml(stdout)
	Schemas = xmlDoc.childNodes()
	return Promise.all(Schemas.map(function (element) {
		var xml = element.toString()
		//console.log('node ./download_schema.js ' + folder + ' \'' + xml + '\'')
		return exec('node ./download_schema.js ' + folder + ' \'' + xml + '\'')
		.then(function (result) {
			var stdout = result.stdout
			//console.log(stdout)
		})
		.catch(function (err) {
			console.error('ERROR: ', err);
		});
	}))

})
.catch(function (err) {
	console.error('ERROR: ', err);
});




/*
netconf_client.create().then(function(client)
{
	client.send(yang_list).thenDefault(function(reply)
	{
		client.send_close().thenDefault()

		// remove xmlns, TODO parse with xmlns
		xml = reply.replace(/\sxmlns[^"]+"[^"]+"/g, '')

		var xmlDoc = libxmljs.parseXml(reply)

		// remove first line
		var children = xmlDoc.root().childNodes()
		var child = children[0]

		// remove '#' character
		var states = children[0].toString().split('\n')[2]

		xmlDoc = libxmljs.parseXml(states)

		// create folder in /tmp
		folder_name = "/tmp/" + randomfolder()
		fs.mkdirSync(folder_name)
		Schemas = xmlDoc.childNodes()[0].childNodes()

		i = 0
		while (Schemas[i].toString()) {
			var xml = Schemas[i].toString()
			download_schemas(folder_name, xml)
			i++
		}
	})
})

var orig_xpath

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		orig_xpath = process.argv[index]
	else if (index == 3)
		yang_module_name = process.argv[index]
	else if (index == 4)
		yang_import_path = process.argv[index]
});

if (orig_xpath == undefined) {
	console.log("please provide xpath parameter")
	return
}

// get standard xpath
xpath = orig_xpath.replace(/^(\/|\/\/)[^;]*:/g, '')

// get yang model name
*/
//name = xpath.replace(/\/.*/g, '')
/*
xpath = '/' + xpath

var xml = '<get-config><source><running/></source><filter><' + name + '/></filter></get-config>'

function validate(xml) {
	var error;
	var yang = require("libyang")
	yang.ly_verb(yang.LY_LLWRN);

	var ctx = yang.ly_ctx_new(yang_import_path);
	yang_module_name = "../../ietf-yangs/example-module@2016-05-09.yang"
	yang_import_path = "../../ietf-yangs"
	var module = yang.lys_parse_path(ctx, yang_module_name, yang.LYS_IN_YANG);
	console.log("---------------------------------------------------------------")
	console.log(xml)
	var tmp = yang.lyxml_parse_mem(ctx, xml, 0);
	console.log(tmp)
	console.log("---------------------------------------------------------------")
	error =  yang.ly_errmsg();
	console.log(error)

	yang.ly_ctx_destroy(ctx)
}

if (yang_module_name != undefined && yang_import_path != undefined ) {
	validate(xml)
}

validate(xml)

netconf_client.create().then(function(client)
{
	client.send(xml).thenDefault(function(reply)
	{
		client.send_close().thenDefault()

		// remove xmlns, TODO parse with xmlns
		xml = reply.replace(/\sxmlns[^"]+"[^"]+"/g, '')

		var xmlDoc = libxmljs.parseXml(xml);

                xpath = "/rpc-reply/data/" + xpath
		var gchild = xmlDoc.get(xpath)

                xml_pp = pd.xml(gchild.childNodes().toString());
                console.log("\n" + xml_pp + "\n");

		if (yang_module_name != undefined && yang_import_path != undefined ) {
			validate(xml)
		}
	})
})
*/
