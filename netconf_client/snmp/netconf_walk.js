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
var xml_xpath = ''

config.show_logs = false

var ctx

process.argv.forEach(function (val, index, array) {
	if (index == 2)
		xpath = process.argv[index]
});

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

function iterate_xpaths(xml, namespace, result) {
	return new Promise((resolve, reject) => {
		if (xml.childNodes().length < 1) {
			result.push('/' + namespace + ':' + xml.parent().path().substring(1))
			return resolve()
		} else {
			var Schemas = xml.childNodes()
			return Promise.all(Schemas.map(function (element) {
				return iterate_xpaths(element, namespace, result)
			}));
		}
	})
}

function get_xpath(node, value) {
	return new Promise((resolve, reject) => {
		var orig = node
		var num = 0
		var head
		var top_ns = [] // write namespace only once

		var xpath = ''

		// check only leaf's
		if (node.schema.nodetype != yang.LYS_LEAF)
			return resolve()

		while (node) {
			s = node.schema.nodetype
			if (s == yang.LYS_LEAF || s == yang.LYS_CONTAINER || s == yang.LYS_LEAFLIST || s == yang.LYS_RFC) {
				if (node.parent && node.schema.module.name == node.parent.schema.module.name)
					xpath = '/' + node.schema.name + xpath
				else
					xpath = '/' + node.schema.module.name + ':' + node.schema.name + xpath
			}
			if (s == yang.LYS_LIST) {
				k = yang.cast_lys_node_list(node.schema)

				for (var i = 0; i < yang.get_uint8(k.keys_size); i++) {
					key = yang.get_lys_node_leaf(k.keys, 0)
					childs = node.child
					while (childs) {
						// TODO fix skiped key leafs
						if (orig.schema.name == key.name && num == 1)
							return resolve()

						if (key.name == childs.schema.name) {
							var el = yang.cast_lyd_node_leaf_list(childs)
							xpath = '[' + key.name + "='" + el.value_str + "']" + xpath
						}
						childs = childs.next
					}
				}
				if (node.parent && node.schema.module.name == node.parent.schema.module.name)
					xpath = '/' + node.schema.name + xpath
				else
					xpath = '/' + node.schema.module.name + ':' + node.schema.name + xpath
			}
			head = node
			node = node.parent
			++num
		}

		console.log(xpath + ' => ' + value)
		resolve()
	})
}

function get_type(xpath, reply) {
	return new Promise((resolve, reject) => {

		config_file = xpath.split(/[:,\/]+/)[1]

		var node = yang.lyd_parse_mem(ctx, reply, yang.LYD_XML, yang.LYD_OPT_GET);

		var set = yang.lyd_get_node(node, xpath);

		if (set) {
			var lyd = yang.get_lyd_node(set.set.d)
			if (lyd) {
				var lyd_leaf = yang.cast_lyd_node_leaf_list(lyd)

				if (lyd_leaf) {
					get_xpath(lyd, lyd_leaf.value_str)
				}
			}
		}

		return resolve()
	})
}


function run() {
	//TODO running hard coded
	var left_xml = '<get-config><source><running/></source><filter>'
	var right_xml = '</filter></get-config>'

	// get namespace

	ctx = yang.ly_ctx_new(config.remote_yang_dir)
	var fs = require('fs');
	var files = fs.readdirSync(config.remote_yang_dir);

	for (var i in files) {
		mod = yang.lys_parse_path(ctx, config.remote_yang_dir + files[i], yang.LYS_IN_YANG);
	}

	nodes = xpath.split("\/")

	nodes.forEach(function(element) {
		if (element == '') return
		keys = element.split(/[\[,\]]+/)
		if (keys.length == 1) {
			nodeid += element
			node = element.split(":")
			if (node.length > 1) {
				result = yang.ly_ctx_get_node(ctx, null, nodeid)
				left_xml = left_xml + '<' + node[1]  + ' xmlns="' + result.module.ns + '">'
				right_xml = '</' + node[1] + '>' + right_xml
				xml_xpath += node[1]
			} else {
				left_xml = left_xml + '<' + element + '>'
				right_xml = '</' + element + '>' + right_xml
				xml_xpath += element
			}
			nodeid += '/'
			xml_xpath += '/'
		} else if (keys.length > 1 ) {
			left_xml = left_xml + '<' + keys[0] + '>'
			key = keys[1].split(/[=,\']+/)
			left_xml = left_xml + '<' + key[0] + '>' + key[1] + '</' + key[0] + '>'
			right_xml = '</' + keys[0] + '>' + right_xml
			nodeid += keys[0] + '/'
			xml_xpath += keys[0] + '/'
		}
	})

	xml = left_xml + right_xml

	netconf_client.create().then(function(client)
	{
		client.send(xml).thenDefault(function(reply)
		{
			client.send_close().then(function (resolve, reject) {

				var xmlDoc = libxmljs.parseXml(reply);
				configs = xmlDoc.root().childNodes()[0].childNodes()

				//result = yang.lyd_parse_mem(ctx, reply, yang.LYD_XML, yang.LYD_OPT_CONFIG);

				var result = []
				return Promise.all(configs.map(function (element) {
					namespace = element.namespace().href().split(/[:,\/]+/).pop()
					element = libxmljs.parseXml(element.toString().replace(/\sxmlns[^"]+"[^"]+"/g, '')).root()

					iterate_xpaths(element, namespace, result)

				})).then(function (resolve, reject) {
					return Promise.all(result.map(function (el_xpath) {
						return get_type(el_xpath, configs.toString())
					}));
				}).then(function (resolve, reject) {
					process.exit(0)
				}).catch(function (err) {
					console.error('ERROR: ', err);
				});
			});
		});
	});

}

Promise.resolve(check_schemas(config.remote_yang_dir))
