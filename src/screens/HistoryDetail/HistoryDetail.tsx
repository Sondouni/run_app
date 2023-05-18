import * as React from 'react';
import {View, Text, AppState, TouchableOpacity, ScrollView} from 'react-native';
import { KakaoMapView} from '@jiggag/react-native-kakao-maps';
import {useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import AsyncStorage from "@react-native-async-storage/async-storage";
import instance from '../../Utils/axiosHelper';
import MapStyle from './MapStyle.json';
import {SafeAreaView} from "react-native-safe-area-context";
import {

    getDate
} from '../../Utils/Utils';
import MapView, {Polyline, PROVIDER_GOOGLE} from "react-native-maps";

export interface Props {
    navigation: any;
}

function HistoryDetail({navigation,route}: any) {

    const [runPk] = useState(route.params.run_pk);
    const [totalDistance] = useState(route.params.totalDistance);
    const [addr] = useState(route.params.addr);
    const [regDt] = useState(route.params.reg_dt);
    const [myRunHistory,setMyRunHistory] = useState(null);

    const settingFc = async () => {
        const result = await getUserHistory();
        console.log(result.data);
        const newList = result.data.list.map((item)=>{
            item.latitude = Number(item.latitude);
            item.longitude = Number(item.longitude);
            return item;
        })
        setMyRunHistory(newList);
    }

    //통신
    const getUserHistory = async () => {
        return await instance.get('/user/history/detail',
            {
                params:{
                    run_pk:runPk
                }
            });
    }

    useEffect(()=>{
        settingFc();
    },[])

    useEffect(()=>{
        console.log(myRunHistory,'?%?%??%?%?');
    },[myRunHistory])

    return (
        <SafeAreaView style={{marginHorizontal:20,paddingVertical:20,flex:1}}>
            <View style={{marginBottom:30}}>
                <Text style={{fontSize:40,fontWeight:'700'}}>
                    기록
                </Text>
            </View>
            {myRunHistory == null ?
                    (
                        <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                            <Text>
                                잠시 기다려주세요
                            </Text>
                        </View>
                    )
                :
                    (
                        <View style={{flex:1}}>
                            <MapView
                                style={{flex:1.5}}
                                // style={{}}
                                provider={PROVIDER_GOOGLE}
                                customMapStyle={MapStyle}
                                zoomEnabled={false}
                                initialRegion={{
                                    latitude: Number(myRunHistory[0].latitude),
                                    longitude: Number(myRunHistory[0].longitude),
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                            >
                                <Polyline
                                    coordinates={myRunHistory}
                                    strokeColor="#F53C39" // fallback for when `strokeColors` is not supported by the map-provider
                                    strokeWidth={4}
                                />
                            </MapView>
                            <View style={{flex:1}}>
                                <View style={{marginVertical:10,marginTop:20}}>
                                    <Text style={{fontSize:20,fontWeight:'600'}}>
                                        {`날짜    ${regDt.year}-${regDt.month}-${regDt.calDate}, ${regDt.hours}:${regDt.minutes}`}
                                    </Text>
                                </View>
                                <View style={{marginVertical:10}}>
                                    <Text style={{fontSize:20,fontWeight:'600'}}>
                                        {`위치    ${addr}`}
                                    </Text>
                                </View>
                                <View style={{marginVertical:10}}>
                                    <Text style={{fontSize:20,fontWeight:'600'}}>
                                        {`거리    ${totalDistance} m`}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )

            }

        </SafeAreaView>
    );
}

export default HistoryDetail;
