// import 'package:beacon_broadcast/beacon_broadcast.dart';
import 'dart:async';
import 'dart:collection';
import 'dart:convert';

import 'package:flutter/material.dart';

// import 'package:flutter_blue/flutter_blue.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:http/http.dart' as http;
import 'package:http/http.dart';
import 'dart:convert' as convert;
import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:international_phone_input/international_phone_input.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:assets_audio_player/assets_audio_player.dart';
import 'package:url_launcher/url_launcher.dart';

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
      home: Scaffold(body: Aloitus()),
    );
  }
}

class Aloitus extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => AloitusState();
}

class AloitusState extends State<Aloitus> {
  String name;
  String macAddress;
  String phoneNumber;
  String oneSignalId;

  initState() {
    super.initState();
    oneSignalId = null;
    name = "";
    macAddress = "";
    phoneNumber = "";
    initOneSignal();

    check();
  }

  Future<void> initOneSignal() async {
    await OneSignal.shared.setLogLevel(OSLogLevel.verbose, OSLogLevel.none);
    print("haloo1");
    await OneSignal.shared.init(
      'a757a77e-72fd-4a39-95cc-51b762c73908',
    );
    print("haloo2");
    await OneSignal.shared
        .setInFocusDisplayType(OSNotificationDisplayType.notification);
    print("haloo3");
    await OneSignal.shared.setSubscriptionObserver((changes) {
      if (changes.to.subscribed) {
        SharedPreferences.getInstance().then((prefs) {
          prefs.setString("one-signal-id", changes.to.userId);
        });
        setState(() {
          oneSignalId = changes.to.userId;
        });
      }
    });
    print("haloo4");
    await OneSignal.shared.setNotificationOpenedHandler((result) {
      if (result.action.actionId == "nobeer") {
        AssetsAudioPlayer.newPlayer().open(Audio("assets/audio/toihin.mp3"),
            showNotification: true, autoStart: true, respectSilentMode: false);
      } else if (result.action.actionId == "beer") {
        var number = result.notification.payload.additionalData['phone'];
        print("calling $number");
        callNumber(number);
      }
    });
    print("haloo5");
  }

  callNumber(String number) async {
    var url = 'tel:${number}';
    if (await canLaunch(url)) {
      print('launching ${url}');
      await launch(url);
    } else {
      print('can\'t launch');
    }
  }

  check() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    if (prefs.containsKey("one-signal-id")) {
      setState(() {
        oneSignalId = prefs.get("one-signal-id");
      });
    }

    var prefMac = prefs.containsKey("mac");
    if (prefMac) {
      print(prefs.getString("mac"));
      await OneSignal.shared
          .setExternalUserId(prefs.getString("mac").toLowerCase());
      Navigator.push(
          context, MaterialPageRoute(builder: (context) => MyHomePage("asd")));
    }
  }

  sendData() async {
    if (oneSignalId == null) {
      Scaffold.of(context).showSnackBar(SnackBar(
          content: Text("Still initializing...please try again later")));
      return;
    }

    print("Checking if user exists:");
    if (await checkExistence(macAddress)) {
      movetonext();
    }
    await OneSignal.shared.setExternalUserId(macAddress.toLowerCase());
    var data = {
      "mac": macAddress,
      "pushNotificationId": oneSignalId,
      "meta": {"phone": phoneNumber, "name": name}
    };
    print(data);
    var response = await http.post(
        'https://stupidhack2020-service.herokuapp.com/api/devices',
        body: convert.jsonEncode(data),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        });
    if (response.statusCode == 200) {
      print("je");
      SharedPreferences prefs = await SharedPreferences.getInstance();
      prefs.setString("mac", macAddress);
      prefs.setString("phoneNumber", phoneNumber);
      prefs.setString("name", name);
      movetonext();
    } else {
      print("ärr");
      print(response);
    }
  }

  Future<bool> checkExistence(String macAddress) async {
    final http.Response response = await http.get(
        'https://stupidhack2020-service.herokuapp.com/api/devices/$macAddress');
    print(response.statusCode);
    print(
        'https://stupidhack2020-service.herokuapp.com/api/devices/$macAddress');
    if (response.statusCode == 404) {
      print("device does not exists!");
      return Future<bool>.value(false);
    } else {
      print("device exists!");
      return Future<bool>.value(true);
    }
  }

  void movetonext() {
    Navigator.push(
        context, MaterialPageRoute(builder: (context) => MyHomePage("asd")));
  }

  @override
  Widget build(BuildContext context) {
    // TODO: implement build
    return Scaffold(
        appBar: AppBar(title: Text('PoC')),
        body: Column(children: <Widget>[
          Padding(padding: const EdgeInsets.all(16.0), child: Text('hello')),
          Form(
              child: Column(
            children: <Widget>[
              Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                    decoration: InputDecoration(hintText: 'your name'),
                    onChanged: (text) => {
                      setState(() {
                        name = text;
                      })
                    },
                  )),
              Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextField(
                      onChanged: (text) => {
                            setState(() {
                              macAddress = text;
                            })
                          },
                      decoration: InputDecoration(hintText: 'your bt address'),
                      autocorrect: false)),
              Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: InternationalPhoneInput(
                    hintText: 'your phone number',
                    initialSelection: '+358',
                    onPhoneNumberChange: (String number,
                        String internationalizedPhoneNumber, String isoCode) {
                      setState(() {
                        phoneNumber = internationalizedPhoneNumber;
                      });
                    },
                  )),
              Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: FlatButton(
                      onPressed: () {
                        sendData();
                      },
                      child: Text('yes'),
                      color: Colors.redAccent))
            ],
          ))
        ]));
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
  HashSet<BluetoothDiscoveryResult> oldDevices;
  bool scanning;
  StreamSubscription<BluetoothDiscoveryResult> scanner;

  // BeaconBroadcast beaconBroadcast;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    this.btInstance = FlutterBluetoothSerial.instance;
    this.devices = [];
    this.oldDevices = new HashSet<BluetoothDiscoveryResult>();
    this.scanning = false;
    this.scanner = null;
    // this.beaconBroadcast = BeaconBroadcast();
    startScanning();
  }

  bool exists(BluetoothDiscoveryResult result) {
    return devices.any((BluetoothDiscoveryResult element) =>
        element.device.address == result.device.address);
  }

  StreamSubscription<BluetoothDiscoveryResult> startDiscovery() {
    var listen =
        btInstance.startDiscovery().listen((BluetoothDiscoveryResult r) async {
      if (!exists(r)) {
        SharedPreferences prefs = await SharedPreferences.getInstance();
        postDiscovery(prefs.getString("mac"), r.device.address.toLowerCase());
        setState(() {
          devices.add(r);
        });
      }
    });
    listen.onDone(() {
      print("haloo");
      // sendPush();
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
    var devicesList =
        devices.map((e) => e.device.address.toLowerCase()).toList().join(',');
    final http.Response response = await http.get(
        'https://stupidhack2020-service.herokuapp.com/api/devices?devices=' +
            devicesList);
  }

  Future<void> sendPush() async {
    var devicesList = devices
        .where((element) => !oldDevices.contains(element))
        .map((e) => e.device.address.toLowerCase());
    oldDevices.addAll(devices);
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String mac = prefs.getString("mac");
    devicesList.map((e) => postDiscovery(mac, e));
  }

  Future<void> postDiscovery(String columbus, String america) async {
    print("sending");
    var data = {"columbus": columbus, "america": america};
    final http.Response response = await http.post(
        'https://stupidhack2020-service.herokuapp.com/api/discoveries',
        body: convert.jsonEncode(data),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        });
    print(response.statusCode);
    if (response.statusCode == 200) {
      var jsonDecode = convert.jsonDecode(response.body);
    }
  }

  Future<http.Response> postDrunkness() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String mac = prefs.getString("mac");
    final http.Response response = await http.post(
        'https://stupidhack2020-service.herokuapp.com/api/devices/iAmTaranted/' +
            mac,
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        });
    print("drunk");
    print(response);
    return response;
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
        ),
        body: Center(
            child: Column(
          children: <Widget>[
            Padding(
                padding: const EdgeInsets.all(16.0),
                child: CircularProgressIndicator()),
            Padding(
                padding: const EdgeInsets.all(16.0),
                child: FlatButton(
                    onPressed: () {
                      postDrunkness();
                    },
                    child: Text("i am drunk"),
                    color: Colors.redAccent))
          ],
        )));
  }
}
