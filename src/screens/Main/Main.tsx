import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import MapView, {Polyline, PROVIDER_GOOGLE} from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from 'react-native-geolocation-service';
import MapStyle from './MapStyle.json';

export interface Props {
    navigation: any;
}

function Main({navigation}: any) {


    const [nickName, setNickName] = useState(null);
    const [tempNickName, setTempNickName] = useState('');

    const [curLoca, setCurLoca] = useState(null);
    const [myCurLocaList, setMyCurLocaList] = useState([]);

    const [watchId, setWatchId] = useState(null);

    const watchRef = useRef(null);

    useEffect(() => {
        checkNickName();
        Geolocation.getCurrentPosition(
            (position) => {
                console.log(position, 'getCurrentPosition');
                setCurLoca(position.coords);
            },
            (error) => {
                // setCurLoca({latitude: 37.5170, longitude: 127.0264895});
                // See error code charts below.
                console.log(error.code, error.message);
            },
            {
                accuracy: {
                    android: 'best',
                    ios: 'best'
                },
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000
            }
        );
    }, []);

    const startWatch = () => {
        const returnedWatchId = Geolocation.watchPosition(successCallback, (err) => console.log(err), watchOption);
        console.log('watchId : ', returnedWatchId);
        setWatchId(returnedWatchId);
    }

    const finishWatch = () => {
        if (watchId != null) {
            Geolocation.clearWatch(watchId);
            setWatchId(null)
            setMyCurLocaList([]);
        }
    }

    const watchOption = {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 10000
    }

    const successCallback = (obj) => {
        setMyCurLocaList(state => {
            return state.concat({latitude: obj.coords.latitude, longitude: obj.coords.longitude})
        })
        setCurLoca(obj.coords);
        console.log(obj, "watch");
    }

    const checkNickName = async () => {
        const storedNickName = await AsyncStorage.getItem('nickName');
        console.log(storedNickName);
        if (storedNickName) {
            setNickName(storedNickName);
        } else {
            setNickName('');
        }
    }

    useEffect(()=>{
        console.log(myCurLocaList,'myCurLocaList');
    },[myCurLocaList])

    const mapView = () => {
        return (
            <View style={{flex: 1, position: 'relative'}}>
                {curLoca != null &&
                    <MapView
                        style={{flex: 1}}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: curLoca.latitude,
                            longitude: curLoca.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        region={{
                            latitude: curLoca.latitude,
                            longitude: curLoca.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                        customMapStyle={MapStyle}
                        zoomEnabled={false}
                    >
                        {myCurLocaList.length>0&&
                            <Polyline
                                // coordinates={[
                                //     {latitude: 37.5180926, longitude: 127.0265895},
                                //     {latitude: 37.5170, longitude: 127.0264895},
                                //     {latitude: 37.5160, longitude: 127.0263895},
                                //     {latitude: 37.5180, longitude: 127.0262895},
                                //     {latitude: 37.5190, longitude: 127.0261895},
                                //     {latitude: 37.5200, longitude: 127.0260895},
                                // ]}
                                coordinates={myCurLocaList}
                                strokeColor="white" // fallback for when `strokeColors` is not supported by the map-provider
                                strokeWidth={6}
                            />
                        }
                        {/*<Polyline*/}
                        {/*    coordinates={[*/}
                        {/*        {latitude: 37.520926, longitude: 127.0265895},*/}
                        {/*        {latitude: 37.5210, longitude: 127.0264895},*/}
                        {/*        {latitude: 37.5220, longitude: 127.0263895},*/}
                        {/*        {latitude: 37.5230, longitude: 127.0262895},*/}
                        {/*        {latitude: 37.5240, longitude: 127.0261895},*/}
                        {/*        {latitude: 37.5250, longitude: 127.0260895},*/}
                        {/*    ]}*/}
                        {/*    strokeColor="yellow" // fallback for when `strokeColors` is not supported by the map-provider*/}
                        {/*    // strokeColors={[*/}
                        {/*    //     '#7F0000',*/}
                        {/*    //     '#00000000', // no color, creates a "long" gradient between the previous and next coordinate*/}
                        {/*    //     '#B24112',*/}
                        {/*    //     '#E5845C',*/}
                        {/*    //     '#238C23',*/}
                        {/*    //     '#7F0000',*/}
                        {/*    // ]}*/}
                        {/*    strokeWidth={6}*/}
                        {/*/>*/}
                    </MapView>
                }
                <View style={{position: 'absolute', bottom: 50, alignSelf: 'center'}}>
                    <TouchableOpacity
                        onPress={() => {
                            console.log(watchId);
                            watchId == null ? startWatch() : finishWatch();
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={{
                            width: 100,
                            height: 50,
                            borderRadius: 15,
                            backgroundColor: 'white',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text>
                                {`${watchId == null ? 'START' : 'FINISH'}`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }


    const needNickName = () => {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <View>
                    <Text>
                        닉네임을 입력해주세요
                    </Text>
                </View>
                <View>
                    <TextInput
                        value={tempNickName}
                        onChangeText={(str) => {
                            console.log(str);
                            setTempNickName(str);
                        }}
                        placeholder={'닉네임'}
                    />
                </View>
                <TouchableOpacity
                    onPress={async () => {
                        if (tempNickName != '') {
                            await AsyncStorage.setItem('nickName', tempNickName);
                            setNickName(tempNickName);
                        }
                    }}
                >
                    <View style={{
                        backgroundColor: 'black',
                        borderRadius: 15,
                        height: 40,
                        width: 100,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <Text style={{color: 'white', fontSize: 14}}>
                            확인
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <>
            {nickName != null ?
                (
                    nickName == '' ?
                        needNickName()
                        :
                        mapView()
                )
                :
                (
                    <></>
                )

            }
        </>
    );
}

export default Main;
