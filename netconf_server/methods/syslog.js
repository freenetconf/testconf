var netconf = require('../../core/netconf')

var methods = {}

module.exports = methods

methods["edit-config"] = {}

netconf.add_method(methods["edit-config"], "$..file-logging[*]", function(input)
{
	console.log("file-logging")
	console.log(input)

	// { code : int, msg : string}
	return { code : 0 }
})

netconf.add_method(methods["edit-config"], "$..console-logging[*]", function(input)
{
	console.log("console-logging")
	console.log(input)

	// { code : int, msg : string}
	return { code : 0 }
})
