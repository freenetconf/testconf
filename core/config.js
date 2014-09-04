var config = {}
module.exports = config

config.yang_dir = __dirname + "/../yang/"
config.keys_dir = __dirname + "/../keys/"
config.server_methods_dir = __dirname + "/../netconf_server/methods/"

config.netconf = {}
config.netconf.host = '127.0.0.1'
config.netconf.port = 1830
config.netconf.user = 'admin'
config.netconf.pass = 'admin'
