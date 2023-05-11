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
import {SafeAreaView} from "react-native-safe-area-context";


export interface Props {
    navigation: any;
}

function Main({navigation}: any) {


    const [nickName, setNickName] = useState(null);
    const [userShow, setUserShow] = useState('N');
    const [tempNickName, setTempNickName] = useState('');
    const [curAddr,setCurAddr] = useState(null);
    const [curDistance,setCurDistance] = useState(0);
    const [dpNickNameErr,setDpNickNameErr] = useState(false);
    const [nickNameErr,setNickNameErr] = useState(false);

    const [curLoca, setCurLoca] = useState(null);
    const [myCurLocaList, setMyCurLocaList] = useState([]);
    const [sendLocaList,setSendLocaList] = useState([]);
    const [otherRunner,setOtherRunner] = useState([]);

    const [watchId, setWatchId] = useState(null);

    const watchIntervalRef = useRef(null);
    const curLocaRef = useRef(null);
    const webSocket = useRef(null);

    useEffect(() => {
        checkNickName();
        Geolocation.getCurrentPosition(
            async (position) => {
                console.log(position, 'getCurrentPosition');
                setCurLoca(position.coords);
                const result = await getCurAdd(position.coords);
                if(result.data!=null){
                    if(result.data.documents!=null&&result.data.documents.length>0){
                        console.log(result.data.documents[0]);
                        setCurAddr(`${result.data.documents[0].address.region_1depth_name} ${result.data.documents[0].address.region_2depth_name} ${result.data.documents[0].address.region_3depth_name}`);
                    }
                }
                console.log(result.data,'KAKAO@@@');
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
        watchIntervalRef.current = setInterval(()=>{
            if(webSocket.current!=null && curLocaRef.current!=null){
                const transObj = {nickName,reg_dt:Date.now(),show:userShow,latitude: curLocaRef.current.latitude+'', longitude: curLocaRef.current.longitude+''};
                webSocket.current.send(JSON.stringify(transObj));
            }
        },5000)
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
        if(watchIntervalRef.current!=null){
            clearInterval(watchIntervalRef.current);
        }
        setCurDistance(0);
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
        curLocaRef.current = {...obj.coords};
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
        // const tempSocket = new WebSocket(encodeURI(`ws://13.125.253.232:8080/socket/${nickName}/${userShow}/${curAddr}`));
        const tempSocket = new WebSocket(encodeURI(`ws://172.30.1.35:8080/socket/${nickName}/${userShow}/${curAddr}`));
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
            if(dataObj.distance!=null){
                console.log(dataObj.distance);
                console.log(typeof dataObj.distance);
                setCurDistance(state=>{return state+dataObj.distance});
            }else if(dataObj.finishedUser=="Y"){
                setOtherRunner(state=>{
                    return state.map((item,index)=>{
                        if(item.nickName!=dataObj.nickName){
                            return item;
                        }
                    })
                })
            }else {
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
            }
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

    const getCurAdd = async (obj) => {
        return await axios.get(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?input_coord=WGS84&x=${obj.longitude}&y=${obj.latitude}`,
            {
                headers: {
                    Authorization: 'KakaoAK a1725f73d8f2210e891f17870815bfcc',  // REST API 키
                },
            },
        )
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

                                coordinates={myCurLocaList}
                                strokeColor="#F53C39" // fallback for when `strokeColors` is not supported by the map-provider
                                strokeWidth={4}
                            />
                        }
                        {otherRunner.map((item,index)=>{
                            if(item!=null && item!= undefined){
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
                            }
                        })}

                    </MapView>
                }
                <View style={{position:'absolute',top:10,left:20}}>
                    <SafeAreaView>
                        {curAddr!=null&&
                            <Text style={{color:'white',fontSize:30}}>
                                {`${curAddr}`}
                            </Text>
                        }
                        {curDistance>0&&
                            <Text style={{color: 'white',fontSize:20,marginTop:30}}>
                                {`${curDistance}m`}
                            </Text>
                        }
                    </SafeAreaView>
                </View>
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
                <View style={{marginVertical:20}}>
                    <Text>
                        닉네임을 입력해주세요
                    </Text>
                </View>
                {dpNickNameErr&&
                    <View>
                        <Text style={{color:'red'}}>
                            닉네임이 중복되었습니다.
                        </Text>
                    </View>
                }
                {nickNameErr&&
                    <View>
                        <Text style={{color:'red'}}>
                            잠시후 다시 시도해주세요.
                        </Text>
                    </View>
                }

                <View style={{marginVertical:15}}>
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
                            if(result.data.result.result==1){
                                await AsyncStorage.setItem('nickName', tempNickName);
                                setNickName(tempNickName);
                            }else if(result.data.result.result==2){
                                setDpNickNameErr(true);
                            }else {
                                setNickNameErr(true);
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
