import * as React from 'react';
import {View, Text, AppState, TouchableOpacity} from 'react-native';
import { KakaoMapView} from '@jiggag/react-native-kakao-maps';
import {useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import AsyncStorage from "@react-native-async-storage/async-storage";
import instance from '../../Utils/axiosHelper';
import {get} from "axios";
import {SafeAreaView} from "react-native-safe-area-context";

export interface Props {
    navigation: any;
}

function History({navigation}: any) {

    const [nickName,setNickName] = useState(null);
    const [userHistory,setUserHistory] = useState(null);
    const [testText,setTestText] = useState('');
    const [testBtn,setTestBtn] = useState(false);

    const stateChangeRef = useRef(null);
    const testRef = useRef(null);

    const addAppStateListener = () =>{
        stateChangeRef.current = AppState.addEventListener('change', appStateFunction );
    }

    const removeAppStateListener = () =>{
        // AppState.removeEventListener('change', appStateFunction );
        if(stateChangeRef.current!=null){
            stateChangeRef.current.remove();
        }
    }

    const appStateFunction = async (nextAppState)=>{
        console.log(nextAppState,'nextAppState@@@');

        // 앱 백그라운드에서 실행시 버전체크는 다음주 컨펌받고 작업

        if(nextAppState=='active'){
            // dispatch(changeNeedUpdate(true));
            console.log('active');
        }
        if(nextAppState=='background'){
            console.log('background');
            setInterval(()=>{
                console.log('background interval')
            },1000);
        }
    }

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

    const backgroundTest = () => {
        testRef.current = setInterval(()=>{
            console.log('INTERVAL');
            setTestText(state=> ''+(Number(state)+1));
        },1000);
    }

    return (
        <View style={{}}>
            <View
                style={{width:'100%',height:'100%'}}
            >
                {/*{nickName==null?*/}
                {/*        (*/}
                {/*            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>*/}
                {/*                <Text>*/}
                {/*                    닉네임 설정이 필요합니다.*/}
                {/*                </Text>*/}
                {/*            </View>*/}
                {/*        )*/}
                {/*    :*/}
                {/*        (*/}
                {/*            <>*/}
                {/*                {userHistory==null?*/}
                {/*                        (*/}
                {/*                            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>*/}
                {/*                                <Text>*/}
                {/*                                    잠시 기다려주세요.*/}
                {/*                                </Text>*/}
                {/*                            </View>*/}
                {/*                        )*/}
                {/*                    :*/}
                {/*                        (userHistory.length==0?*/}
                {/*                                    (*/}
                {/*                                        <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>*/}
                {/*                                            <Text>*/}
                {/*                                                아직 기록이 없습니다.*/}
                {/*                                            </Text>*/}
                {/*                                        </View>*/}
                {/*                                    )*/}
                {/*                                :*/}
                {/*                                    (*/}
                {/*                                        <SafeAreaView style={{marginHorizontal:20,paddingVertical:20}}>*/}
                {/*                                            <View style={{marginBottom:30}}>*/}
                {/*                                                <Text style={{fontSize:40,fontWeight:'700'}}>*/}
                {/*                                                    기록*/}
                {/*                                                </Text>*/}
                {/*                                            </View>*/}
                {/*                                            {userHistory.map((item,index)=>{*/}
                {/*                                                const itemDate = new Date(item.reg_dt);*/}

                {/*                                                console.log(itemDate,'ㅆㄸㄴㅆ');*/}
                {/*                                                return(*/}
                {/*                                                    <TouchableOpacity*/}
                {/*                                                        onPress={()=>{*/}

                {/*                                                        }}*/}
                {/*                                                    >*/}
                {/*                                                        <View style={{borderRadius:20,borderColor:'black',borderWidth:1,padding:20}}>*/}
                {/*                                                            <View>*/}

                {/*                                                            </View>*/}
                {/*                                                            <View style={{flexDirection:'row',justifyContent:'space-between'}}>*/}
                {/*                                                                <View>*/}
                {/*                                                                    <Text>*/}
                {/*                                                                        거리*/}
                {/*                                                                    </Text>*/}
                {/*                                                                </View>*/}
                {/*                                                                <View>*/}
                {/*                                                                    <Text>*/}
                {/*                                                                        {`${item.reg_dt}`}*/}
                {/*                                                                    </Text>*/}
                {/*                                                                </View>*/}
                {/*                                                            </View>*/}
                {/*                                                        </View>*/}
                {/*                                                    </TouchableOpacity>*/}
                {/*                                                )*/}
                {/*                                            })}*/}
                {/*                                        </SafeAreaView>*/}

                {/*                                    )*/}
                {/*                        )*/}
                {/*                }*/}
                {/*            </>*/}
                {/*        )*/}
                {/*}*/}
                <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                    <Text style={{fontSize:20}}>
                        {`${testText} 번째`}
                    </Text>
                </View>
                <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                    <TouchableOpacity
                        onPress={()=>{
                            if(testRef.current!=null){
                                removeAppStateListener();
                                setTestBtn(false);
                                clearInterval(testRef.current);
                                testRef.current=null;
                            }else {
                                addAppStateListener();
                                setTestBtn(true);
                                backgroundTest();
                            }
                        }}
                    >
                        <View style={{backgroundColor:'black',padding:20}}>
                            <Text style={{color:"white"}}>
                                {`${!testBtn?'TEST':'STOP'}`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>

    );
}

export default History;
