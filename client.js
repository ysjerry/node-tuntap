var tuntap = require('./index.js');

try {
    var tt = tuntap({
        type: 'tun',
        name: 'tun12',
        mtu: 1400,
        addr: '192.168.100.3',
        dest: '192.168.100.1',
        mask: '255.255.255.0',
        ethtype_comp: 'none',
        persist: false,
        //up: true,
        //running: true,
    });
}
catch(e) {
    console.log('Tuntap creation error: ', e);
    process.exit(0);
}


var uuid = require('uuid');
var clinet_id=uuid.v4();

var net = require('net');
//var ports = [18881]
var ports = [18881, 18882, 18883, 18884]

for(var p in ports) {
    console.log(ports[p])
}

var clients = {}

var enc = new tuntap.muxer(1410);

for(var i in ports) {
    var p = ports[i];

    console.log(p);
    try {
        clients[p]  = net.connect({port: p, host: "p.savenet.cn"},
            function () { //'connect' listener
                console.log('connected to server!');
                this.write(clinet_id);
                this.dec = new tuntap.demuxer(1410);
                this.dec.on('data', function (data) {
                    console.log("Dec Recv: ", data.length);
                    tt.write(data);
                });
                this.on('data', function (data) {
                    console.log("ip alloc is: ", data.toString());
                    this.removeAllListeners(["data"]);
                    this.on('data', function (data) {
                        console.log("Socket Recv: ", data.length);
                        this.dec.write(data);
                    });
                });
                this.on('end', function () {
                    console.log('disconnected from server');
                    this.end();
                    delete clients[p];
                });
            });



        clients[p].on("error", function (v) {
            console.log('error when connect server port ' + v.port);
            //client.end();
            delete clients[v.port];
            this.end();
        });
    }catch(e) {
        console.log('catch(e) [v.port] ' + p);
        delete clients[p];
    }
}


tt.pipe(enc)
//dec.pipe(tt);

function getIdleSocket() {
    var minRemain = 0x7FFFFFFF;
    var socket = undefined;
    for( var i in clients) {
        sock  = clients[i];
        if (sock.remainPackages == undefined || sock.remainPackages < minRemain) {
            sock.remainPackages ||(sock.remainPackages = 1);
            socket = sock;
            minRemain = socket.remainPackages;
        }
    }
    return socket;

}


tt.on('data', function() {
    console.log("tt buffer length= ", arguments[0].length);
});

enc.on('data', function() {
    console.log("enc buffer length= ", arguments[0].length);
    sock = getIdleSocket();

    if(sock) {
        sock.remainPackages++;
        console.log("Write to Socket = " + sock.port);
        sock.write(arguments[0], function() {
            this.remainPackages--;
        });
    }
});


//dec.on('data', function() {
//    console.log("dec length= ", arguments.length);
//    console.log("dec buffer length= ", arguments[0].length);
//});


//var client = net.connect({port: 18881, host:"p.savenet.cn"},
//    function(v) { //'connect' listener
//  console.log('connected to server!' );
//  client.write(clinet_id);
//  var seq = 1;
//  client.on('data', function(data) {
//  		console.log(data.toString());
//  		client.write("DATA FOR " + clinet_id  + " seq " + (seq++) );
//	});
//	client.on('end', function() {
//		console.log('disconnected from server');
//	});
//});

