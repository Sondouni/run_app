/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import type {Node} from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
    PermissionsAndroid,
    Platform,
    TouchableOpacity
} from 'react-native';

import {
    Colors,
    DebugInstructions,
    Header,
    LearnMoreLinks,
    ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigation from './navigation/AppNavigation';
import Geolocation from 'react-native-geolocation-service';


const App: () => Node = () => {
    const isDarkMode = useColorScheme() === 'dark';

    const [locaPermission,setLocaPermission] = useState(null);

    const requestLocationPermission = async () =>{
        if(Platform.OS=='android'){
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            console.log(granted,'granted?');
            console.log(granted=='granted');
            setLocaPermission(granted=='granted');
        }else {
            const result = await Geolocation.requestAuthorization('always');
            console.log(result,'result');
            setLocaPermission(result=='granted');
        }

    }

    useEffect(()=>{
        requestLocationPermission();
        console.log(locaPermission,'locaPermission');
    },[])


    return (
        <>
            {locaPermission==null?
                    (
                        <>
                            <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                                <Text>
                                    위치동의 없이는 앱 사용이 어렵습니다.
                                </Text>
                            </View>
                        </>
                    )
                :
                    (locaPermission?
                                (
                                    <NavigationContainer>
                                        <AppNavigation/>
                                    </NavigationContainer>
                                )

                            :
                                (
                                    <>
                                        <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
                                            <Text>
                                                위치동의 없이는 앱 사용이 어렵습니다.
                                            </Text>
                                            <TouchableOpacity
                                                style={{marginTop:10}}
                                                onPress={()=>{
                                                    requestLocationPermission();
                                                    console.log('testestest')
                                                }}
                                            >
                                                <View style={{backgroundColor:'black',height:50,paddingHorizontal:10,alignItems:'center',justifyContent:'center',borderRadius:10}}>
                                                    <Text style={{color:'white'}}>
                                                        위치동의하기
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )

                        )

            }

        </>
    );
};


export default App;
