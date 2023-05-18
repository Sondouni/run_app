import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Linking,
    PermissionsAndroid,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    ToastAndroid,
    View,
} from 'react-native';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import {SafeAreaView} from "react-native-safe-area-context";
import VIForegroundService from '@voximplant/react-native-foreground-service';
import instance from '../../Utils/axiosHelper';
import KeepAwake from 'react-native-keep-awake';


export default function Test({navigation}: any) {
    const [forceLocation, setForceLocation] = useState(true);
    const [highAccuracy, setHighAccuracy] = useState(true);
    const [locationDialog, setLocationDialog] = useState(true);
    const [significantChanges, setSignificantChanges] = useState(false);
    const [observing, setObserving] = useState(false);
    const [foregroundService, setForegroundService] = useState(false);
    const [useLocationManager, setUseLocationManager] = useState(false);
    const [location, setLocation] = useState<GeoPosition | null>(null);
    const [socketState,setSocketState] = useState(null);

    const watchId = useRef<number | null>(null);
    const intervalId = useRef(null);
    const webSocket = useRef(null);

    const stopLocationUpdates = () => {
        if (Platform.OS === 'android') {
            VIForegroundService.getInstance()
                .stopService()
                .catch((err: any) => err);
        }

        if (watchId.current !== null) {
            Geolocation.clearWatch(watchId.current);
            watchId.current = null;
            setObserving(false);
        }

        if(intervalId.current!=null){
            clearInterval(intervalId.current);
        }
    };

    useEffect(() => {
        KeepAwake.activate();
        return () => {
            stopLocationUpdates();
        };
    }, []);

    const hasPermissionIOS = async () => {
        const openSetting = () => {
            Linking.openSettings().catch(() => {
                Alert.alert('Unable to open settings');
            });
        };
        const status = await Geolocation.requestAuthorization('whenInUse');

        if (status === 'granted') {
            return true;
        }

        if (status === 'denied') {
            Alert.alert('Location permission denied');
        }

        if (status === 'disabled') {
            Alert.alert(
                `Turn on Location Services to allow "${'test'}" to determine your location.`,
                '',
                [
                    { text: 'Go to Settings', onPress: openSetting },
                    { text: "Don't Use Location", onPress: () => {} },
                ],
            );
        }

        return false;
    };

    const hasLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            const hasPermission = await hasPermissionIOS();
            return hasPermission;
        }

        if (Platform.OS === 'android' && Platform.Version < 23) {
            return true;
        }

        const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (hasPermission) {
            return true;
        }

        const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (status === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
        }

        if (status === PermissionsAndroid.RESULTS.DENIED) {
            ToastAndroid.show(
                'Location permission denied by user.',
                ToastAndroid.LONG,
            );
        } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            ToastAndroid.show(
                'Location permission revoked by user.',
                ToastAndroid.LONG,
            );
        }

        return false;
    };

    const getLocation = async () => {
        const hasPermission = await hasLocationPermission();

        if (!hasPermission) {
            return;
        }

        Geolocation.getCurrentPosition(
            position => {
                setLocation(position);
                console.log(position,`    ${Platform.OS}`);
            },
            error => {
                Alert.alert(`Code ${error.code}`, error.message);
                setLocation(null);
                console.log(error);
            },
            {
                accuracy: {
                    android: 'high',
                    ios: 'best',
                },
                enableHighAccuracy: highAccuracy,
                timeout: 15000,
                maximumAge: 10000,
                distanceFilter: 0,
                forceRequestLocation: forceLocation,
                forceLocationManager: useLocationManager,
                showLocationDialog: locationDialog,

            },
        );
    };

    const openSocket = async () =>{
        const tempSocket = new WebSocket(encodeURI(`ws://172.30.1.48:3001/tracking`));
        console.log(tempSocket,'TEST');
        webSocket.current = tempSocket;
        setSocketState(tempSocket);
        // 소켓 연결 시
        tempSocket.onopen = (ev) => {
                console.log(ev,' socket on ');
        };
        tempSocket.onmessage = e => {
            console.log(e.data,' socket receive ');
        }
    }

    const testApi = async (obj) => {
        return await instance.get('/user',{params:obj});
    }

    const getLocationUpdates = async () => {
        const hasPermission = await hasLocationPermission();

        if (!hasPermission) {
            return;
        }

        if (Platform.OS === 'android' && foregroundService) {
            await startForegroundService();
        }

        setObserving(true);

        // intervalId.current = setInterval(()=>{
        //     console.log('TESTSTDSD');
        // },1000)

        watchId.current = Geolocation.watchPosition(
            async position => {
                setLocation(position);
                console.log(position,`    ${Platform.OS}`);
                const result = await testApi(position.coords);
                console.log(result.data,'@@@@@');
            },
            error => {
                setLocation(null);
                console.log(error);
            },
            {
                accuracy: {
                    android: 'high',
                    ios: 'best',
                },
                enableHighAccuracy: highAccuracy,
                distanceFilter: 0,
                interval: 3000,
                fastestInterval: 2000,
                forceRequestLocation: forceLocation,
                forceLocationManager: useLocationManager,
                showLocationDialog: locationDialog,
                useSignificantChanges: significantChanges,
                showsBackgroundLocationIndicator:true
            },
        );
    };

    const startForegroundService = async () => {
        if (Platform.Version >= 26) {
            await VIForegroundService.getInstance().createNotificationChannel({
                id: 'locationChannel',
                name: 'Location Tracking Channel',
                description: 'Tracks location of user',
                enableVibration: false,
            });
        }

        return VIForegroundService.getInstance().startService({
            channelId: 'locationChannel',
            id: 420,
            title: 'test',
            text: 'Tracking location updates',
            icon: 'ic_launcher',
        });
    };

    function generateRandomCoordinates() {
        const numCoordinates = 5000;
        const centerLat = 37.5270;
        const centerLng = 127.0276;
        const radius = 1; // in kilometers

        const coordinates = [];

        for (let i = 0; i < numCoordinates; i++) {
            // Convert radius from kilometers to degrees
            const radiusInDegrees = radius / 111.32;

            const u = Math.random();
            const v = Math.random();
            const w = radiusInDegrees * Math.sqrt(u);
            const t = 2 * Math.PI * v;
            const x = w * Math.cos(t);
            const y = w * Math.sin(t);

            // Adjust the x-coordinate for the desired center of the circle
            const newLng = x / Math.cos(centerLat);

            const foundLng = centerLng + newLng;
            const foundLat = centerLat + y;

            coordinates.push({ lat: foundLat, lng: foundLng });
        }

        return coordinates;
    }

    // Usage


    return (
        <SafeAreaView style={styles.mainContainer}>
            {/*<MapView coords={location?.coords || null} />*/}

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}>
                <View>
                    <View style={styles.option}>
                        <Text>Enable High Accuracy</Text>
                        <Switch onValueChange={setHighAccuracy} value={highAccuracy} />
                    </View>

                    {Platform.OS === 'ios' && (
                        <View style={styles.option}>
                            <Text>Use Significant Changes</Text>
                            <Switch
                                onValueChange={setSignificantChanges}
                                value={significantChanges}
                            />
                        </View>
                    )}

                    {Platform.OS === 'android' && (
                        <>
                            <View style={styles.option}>
                                <Text>Show Location Dialog</Text>
                                <Switch
                                    onValueChange={setLocationDialog}
                                    value={locationDialog}
                                />
                            </View>
                            <View style={styles.option}>
                                <Text>Force Location Request</Text>
                                <Switch
                                    onValueChange={setForceLocation}
                                    value={forceLocation}
                                />
                            </View>
                            <View style={styles.option}>
                                <Text>Use Location Manager</Text>
                                <Switch
                                    onValueChange={setUseLocationManager}
                                    value={useLocationManager}
                                />
                            </View>
                            <View style={styles.option}>
                                <Text>Enable Foreground Service</Text>
                                <Switch
                                    onValueChange={setForegroundService}
                                    value={foregroundService}
                                />
                            </View>
                        </>
                    )}
                </View>
                <View style={styles.buttonContainer}>
                    <Button title="Get Location" onPress={getLocation} />
                    <View style={styles.buttons}>
                        <Button
                            title="Start Observing"
                            // onPress={getLocationUpdates}
                            onPress={openSocket}
                            disabled={observing}
                        />
                        <Button
                            title="Stop Observing"
                            onPress={stopLocationUpdates}
                            disabled={!observing}
                        />
                    </View>
                </View>
                <View style={styles.result}>
                    <Text>Latitude: {location?.coords?.latitude || ''}</Text>
                    <Text>Longitude: {location?.coords?.longitude || ''}</Text>
                    <Text>Heading: {location?.coords?.heading}</Text>
                    <Text>Accuracy: {location?.coords?.accuracy}</Text>
                    <Text>Altitude: {location?.coords?.altitude}</Text>
                    <Text>Altitude Accuracy: {location?.coords?.altitudeAccuracy}</Text>
                    <Text>Speed: {location?.coords?.speed}</Text>
                    <Text>Provider: {location?.provider || ''}</Text>
                    <Text>
                        Timestamp:{' '}
                        {location?.timestamp
                            ? new Date(location.timestamp).toLocaleString()
                            : ''}
                    </Text>
                </View>
                <View>
                    <Button
                        title="앱으로 가기"
                        // onPress={()=>{navigation.navigate('Home')}}
                        onPress={()=>{
                            const randomCoordinates = generateRandomCoordinates();
                            console.log(randomCoordinates);
                        }}
                    />
                </View>
                {socketState!=null &&
                    <View style={{marginTop:50}}>
                        <Button
                            title="메세지 보내기"
                            onPress={()=>{
                                const transObj = {"usrCd":2,"location":{"type":"Point","coordinates":[34.1231241,128.1231203]}};
                                socketState.send(JSON.stringify(transObj));
                            }}
                        />
                    </View>
                }

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    contentContainer: {
        padding: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
    },
    result: {
        borderWidth: 1,
        borderColor: '#666',
        width: '100%',
        padding: 10,
    },
    buttonContainer: {
        alignItems: 'center',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginVertical: 12,
        width: '100%',
    },
});
