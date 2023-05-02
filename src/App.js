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
    Platform
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
    },[])


    return (
        <>
            {locaPermission==null?
                    (
                        <></>
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
                                    <></>
                                )

                        )

            }

        </>
    );
};


export default App;
