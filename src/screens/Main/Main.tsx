import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity,Platform} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from 'react-native-geolocation-service';
import MapStyle from './MapStyle.json';
import instance from '../../Utils/axiosHelper';
import socket from '../../Utils/socketHelper';
import axios from "axios";
import {io} from "socket.io-client";
import Icon from 'react-native-vector-icons/Ionicons';


export interface Props {
    navigation: any;
}

function Main({navigation}: any) {


    const [nickName, setNickName] = useState(null);
    const [userShow, setUserShow] = useState('N');
    const [tempNickName, setTempNickName] = useState('');

    const [curLoca, setCurLoca] = useState(null);
    const [myCurLocaList, setMyCurLocaList] = useState([]);
    const [otherRunner,setOtherRunner] = useState([]);

    const [watchId, setWatchId] = useState(null);

    const watchRef = useRef(null);
    const webSocket = useRef(null);

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

    const startWatch = async () => {
        const returnedWatchId = Geolocation.watchPosition(successCallback, (err) => console.log(err), watchOption);
        // console.log('watchId : ', returnedWatchId);
        setWatchId(returnedWatchId);
    }

    const finishWatch = async () => {
        if (watchId != null) {
            Geolocation.clearWatch(watchId);
            setWatchId(null)
            setMyCurLocaList([]);
            setOtherRunner([]);
        }
        if (webSocket.current != null){
            webSocket.current.close();
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
        // console.log(obj, "watch");
        console.log(`${Platform.OS}@@@`);
        if(webSocket.current!=null){
            const rightNow = new Date();
            // console.log(rightNow);
            const transObj = {nickName,reg_dt:Date.now(),show:userShow,latitude: obj.coords.latitude+'', longitude: obj.coords.longitude+''};
            webSocket.current.send(JSON.stringify(transObj));
        }
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

    const insertUserName = async () => {
        return await instance.post('/user',{user_nm:tempNickName});
    }

    const connectSocket = async () => {
        const tempSocket = new WebSocket(`ws://13.125.253.232:8080/socket/${nickName}/${userShow}`);
        // const tempSocket = new WebSocket(`ws://172.30.1.35:8080/socket/${nickName}/${userShow}`);
        webSocket.current = tempSocket;
        // 소켓 연결 시
        tempSocket.onopen = () => {
            // const transObj = {nickName,reg_dt:Date.now(),userShow};
            // tempSocket.send(JSON.stringify(transObj)); // 메세지 전송
        };

        // 메세지 수신
        tempSocket.onmessage = e => {
            console.log(e.data,`app message받음@@${nickName}`);
            const dataObj = JSON.parse(e.data);
            let check = false;
            const newState = otherRunner.map((item,index)=>{
                if(item.nickName==dataObj.nickName){
                    item.latitude = Number(dataObj.latitude);
                    item.longitude = Number(dataObj.longitude);
                    item.reg_dt = dataObj.reg_dt;
                    check = true;
                }
                return item;
            })
            if(!check){
                newState.push(dataObj);
            }
            console.log(dataObj);
            setOtherRunner(newState);
        };

        // 에러 발생시
        tempSocket.onerror = e => {
            console.log(e.message);
        };


        // 소켓 연결 해제
        tempSocket.onclose = e => {
            console.log(e.code, e.reason);
        };
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
                                strokeColor="#F53C39" // fallback for when `strokeColors` is not supported by the map-provider
                                strokeWidth={4}
                            />
                        }
                        {otherRunner.map((item,index)=>{
                            return(
                                <Marker
                                    key={index}
                                    coordinate={{latitude: Number(item.latitude), longitude: Number(item.longitude)}}
                                >
                                    <View style={{backgroundColor:'white',paddingHorizontal:10,paddingVertical:5,borderRadius:5}}>
                                        <View>
                                            <Text>
                                                {`${item.nickName}`}
                                            </Text>
                                        </View>
                                    </View>
                                </Marker>
                            )
                        })}
                        {/*<Marker*/}
                        {/*    coordinate={{latitude: 37.5170, longitude: 127.0264895}}*/}
                        {/*>*/}
                        {/*    <View style={{backgroundColor:'white',paddingHorizontal:10,paddingVertical:5,borderRadius:5}}>*/}
                        {/*        <View>*/}
                        {/*            <Text>*/}
                        {/*                테스트*/}
                        {/*            </Text>*/}
                        {/*        </View>*/}
                        {/*    </View>*/}

                        {/*</Marker>*/}
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
                <View style={{position: 'absolute', bottom: 110, alignSelf: 'center'}}>
                    <TouchableOpacity
                        onPress={async () => {
                            if (userShow=='Y'){
                                setUserShow('N');
                            }else {
                                setUserShow('Y');
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection:'row',
                        }}>
                            <Icon
                                name={userShow=='Y'?'checkbox-sharp':"checkbox-outline"}
                                size={20}
                                color="white"
                            />
                            <Text style={{color:'white',fontSize:13,marginLeft:5}}>
                                {`같이뛰기`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{position: 'absolute', bottom: 50, alignSelf: 'center'}}>
                    <TouchableOpacity
                        onPress={async () => {
                            if(watchId == null){
                                const result = await connectSocket();
                                await startWatch();
                            }else {
                                await finishWatch();
                            }
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
                            const result = await insertUserName();
                            if(result.data.result==1){
                                await AsyncStorage.setItem('nickName', tempNickName);
                                setNickName(tempNickName);
                            }else {
                                console.log(result.data);
                            }
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
