// import 'package:beacon_broadcast/beacon_broadcast.dart';
import 'dart:async';

import 'package:flutter/material.dart';
// import 'package:flutter_blue/flutter_blue.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:http/http.dart' as http;
import 'dart:convert' as convert;
import 'package:onesignal_flutter/onesignal_flutter.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  Widget build(BuildContext context) {

    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: Aloitus(),
    );
  }
}

class Aloitus extends StatelessWidget {
  @override
  Widget build(BuildContext context) {

    // TODO: implement build
    OneSignal.shared.setLogLevel(OSLogLevel.error, OSLogLevel.none);

    OneSignal.shared.init('a757a77e-72fd-4a39-95cc-51b762c73908',);
    OneSignal.shared.setInFocusDisplayType(OSNotificationDisplayType.notification);
    return Scaffold(
        appBar: AppBar(title: Text('PoC')),
        body: Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(hintText: 'your bt address'),
              onSubmitted: (text) {
                Navigator.push(context, MaterialPageRoute(builder: (context) => MyHomePage(text)));
              },
            )));
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage(String address) {
    this.address = address;
  }

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  String address;

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  FlutterBluetoothSerial btInstance;
  List<BluetoothDiscoveryResult> devices;
  bool scanning;
  StreamSubscription<BluetoothDiscoveryResult> scanner;
  // BeaconBroadcast beaconBroadcast;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    this.btInstance = FlutterBluetoothSerial.instance;
    this.devices = [];
    this.scanning = false;
    this.scanner = null;
    // this.beaconBroadcast = BeaconBroadcast();
  }

  bool exists(BluetoothDiscoveryResult result) {
    return devices.any((BluetoothDiscoveryResult element) => element.device.address == result.device.address);
  }

  StreamSubscription<BluetoothDiscoveryResult> startDiscovery() {
    var listen = btInstance.startDiscovery().listen((BluetoothDiscoveryResult r) {
      if (!exists(r)) {
        setState(() {
          devices.add(r);
        });
      }
    });
    listen.onDone(() {
      if (scanning) {
        setState(() {
          scanner = startDiscovery();
        });
      }
    });
    return listen;
  }

  Future<void> startScanning() async {
    setState(() {
      scanning = true;
      devices.clear();
      scanner = startDiscovery();
    });

   /*  var transmissionSupportStatus = await beaconBroadcast.checkTransmissionSupported();
    print("heh");
    print(transmissionSupportStatus);
    btInstance.startScan(timeout: Duration(seconds: 60));
    beaconBroadcast
        .setUUID('39ED98FF-2900-441A-802F-9C398FC199D2')
        .setMajorId(1)
        .setMinorId(100)
        .start();
    btInstance.scanResults.listen((results) {
      print('lol');
      print(results);
      setState(() {
        devices = results;
      });
    }); */
  }

  void stopScanning() {
    setState(() {
      scanning = false;
    });
    scanner.cancel();
  }

  Future<void> announceNearbyDevices() async {
    final http.Response response = await http.post('/api',
        body: convert.jsonEncode(this.devices),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        });
    if (response.statusCode == 200) {
      var jsonDecode = convert.jsonDecode(response.body);
    }
  }

  Future<void> announceYourself() async {
    final http.Response response = await http.post('/api',
        body: convert.jsonEncode(this.devices),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        });
    if (response.statusCode == 200) {
      var jsonDecode = convert.jsonDecode(response.body);
    }
  }

  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Scaffold(
        appBar: AppBar(
          title: Text('PoC'),
          actions: <Widget>[
            IconButton(
                icon: new Icon(Icons.play_arrow),
                onPressed: () {
                  this.startScanning();
                }),            IconButton(
                icon: new Icon(Icons.stop),
                onPressed: () {
                  this.stopScanning();
                }),
          ],
        ),
        body: ListView.builder(
            itemCount: this.devices.length,
            itemBuilder: (context, index) {
              final item = this.devices[index];

              var address = item.device.address == null ? "" : item.device.address;
              var name = item.device.name == null ? "" : item.device.name;

              return ListTile(
                  title: Text(address),
                  subtitle: Text(name));
            }));
  }
}
