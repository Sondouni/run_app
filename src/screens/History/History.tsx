import * as React from 'react';
import {View, Text, AppState, TouchableOpacity, ScrollView} from 'react-native';
import { KakaoMapView} from '@jiggag/react-native-kakao-maps';
import {useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import AsyncStorage from "@react-native-async-storage/async-storage";
import instance from '../../Utils/axiosHelper';
import {get} from "axios";
import {SafeAreaView} from "react-native-safe-area-context";
import {

    getDate
} from '../../Utils/Utils';

export interface Props {
    navigation: any;
}

function History({navigation}: any) {

    const [nickName,setNickName] = useState(null);
    const [userHistory,setUserHistory] = useState(null);
    const [testText,setTestText] = useState('');
    const [testBtn,setTestBtn] = useState(false);



    const getUserNickName = async () =>{
        const nickName = await AsyncStorage.getItem("nickName");
        setNickName(nickName);
    }

    useEffect(()=>{
        getUserNickName();
    },[])

    useEffect(()=>{
        if(nickName!=null){
            makeUserHistory();
        }
    },[nickName])

    const makeUserHistory = async () =>{
        const result = await getUserHistory();
        setUserHistory(result.data.list);
    }

    //통신
    const getUserHistory = async () => {
        return await instance.get('/user/history',
            {
                params:{
                        nickName:nickName
                        }
            });
    }


    return (
        <View style={{}}>
            <View
                style={{width:'100%',height:'100%'}}
            >
                {nickName==null?
                        (
                            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                                <Text>
                                    닉네임 설정이 필요합니다.
                                </Text>
                            </View>
                        )
                    :
                        (
                            <>
                                {userHistory==null?
                                        (
                                            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                                                <Text>
                                                    잠시 기다려주세요.
                                                </Text>
                                            </View>
                                        )
                                    :
                                        (userHistory.length==0?
                                                    (
                                                        <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                                                            <Text>
                                                                아직 기록이 없습니다.
                                                            </Text>
                                                        </View>
                                                    )
                                                :
                                                    (
                                                        <SafeAreaView style={{marginHorizontal:20,paddingVertical:20}}>
                                                            <View style={{marginBottom:30}}>
                                                                <Text style={{fontSize:40,fontWeight:'700'}}>
                                                                    기록
                                                                </Text>
                                                            </View>
                                                            <ScrollView
                                                                contentContainerStyle={{paddingBottom:30}}
                                                                showsVerticalScrollIndicator={false}
                                                            >
                                                                {userHistory.map((item,index)=>{
                                                                    const itemDate = getDate(item.reg_dt,'obj');
                                                                    return(
                                                                        <View style={{marginVertical:10}}>
                                                                            <TouchableOpacity
                                                                                onPress={()=>{
                                                                                    navigation.navigate('HistoryDetail',{run_pk:item.run_pk,totalDistance:item.totalDistance,reg_dt:itemDate,addr:item.addr})
                                                                                }}
                                                                            >
                                                                                <View style={{borderRadius:20,borderColor:'black',borderWidth:1,paddingVertical:15,paddingHorizontal: 20}}>
                                                                                    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                                                                                        <View>

                                                                                            <View style={{flexDirection:'row',marginBottom:10}}>
                                                                                                <View style={{marginRight:15}}>
                                                                                                    <Text>
                                                                                                        {`위치 `}
                                                                                                    </Text>

                                                                                                </View>
                                                                                                <View>
                                                                                                    <Text>
                                                                                                        {`${item.addr}`}
                                                                                                    </Text>
                                                                                                </View>
                                                                                            </View>
                                                                                            <View style={{flexDirection:'row'}}>
                                                                                                <View style={{marginRight:15}}>
                                                                                                    <Text>
                                                                                                        {`거리 `}
                                                                                                    </Text>

                                                                                                </View>
                                                                                                <View>
                                                                                                    <Text>
                                                                                                        {`${item.totalDistance} m`}
                                                                                                    </Text>
                                                                                                </View>
                                                                                            </View>
                                                                                        </View>
                                                                                        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                                                                                            <View>
                                                                                                <Text>
                                                                                                    {`${itemDate.year}-${itemDate.month}-${itemDate.calDate}, ${itemDate.hours}:${itemDate.minutes}`}
                                                                                                </Text>
                                                                                            </View>
                                                                                        </View>
                                                                                    </View>

                                                                                </View>
                                                                            </TouchableOpacity>
                                                                        </View>
                                                                    )
                                                                })}
                                                            </ScrollView>
                                                        </SafeAreaView>

                                                    )
                                        )
                                }
                            </>
                        )
                }

            </View>
        </View>

    );
}

export default History;
