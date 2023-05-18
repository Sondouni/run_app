import { useEffect } from "react";
import {CardStyleInterpolators, createNativeStackNavigator} from '@react-navigation/native-stack';
import Main from "../screens/Main/Main";
import History from "../screens/History/History";
import HistoryDetail from "../screens/HistoryDetail/HistoryDetail";
import Test from "../screens/Test/Test";
import MapTest from "../screens/MapTest/MapTest";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
const TabNavigation = () =>{
    return(
        <Tab.Navigator
            headerMode="none"
        >
            <Tab.Screen
                name="Main"
                component={Main}
                options={{
                    title:'Main',
                    headerShown: false,
                    tabBarIcon: ({color}) => {
                        return <Icon
                            name={"map-outline"}
                            size={20}
                            color={color}
                        />;
                    },
                }}
            />
            <Tab.Screen
                name="History"
                component={History}
                options={{
                    title:'History',
                    headerShown: false,
                    tabBarIcon: ({color}) => {
                        return <Icon
                            name={"list-outline"}
                            size={20}
                            color={color}
                        />;
                    },
                }}
            />
        </Tab.Navigator>
        )

}


const Stack = createNativeStackNavigator();

const AppNavigation = () =>{

    useEffect(()=>{
        // SplashScreen.hide();
    },[])

    return(
        <Stack.Navigator
            headerMode="none"
            // initialRouteName={'Home'}
            initialRouteName={'MapTest'}
        >
            <Stack.Screen
                name="Home"
                component={TabNavigation}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="HistoryDetail"
                component={HistoryDetail}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Test"
                component={Test}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="MapTest"
                component={MapTest}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    )
}

export default AppNavigation;
