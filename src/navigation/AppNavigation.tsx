import { useEffect } from "react";
import {CardStyleInterpolators, createNativeStackNavigator} from '@react-navigation/native-stack';
import Main from "../screens/Main/Main";
import History from "../screens/History/History";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";

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
                }}
            />
            <Tab.Screen
                name="History"
                component={History}
                options={{
                    title:'History',
                    headerShown: false,
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
        >
            <Stack.Screen
                name="Home"
                component={TabNavigation}
                options={{
                    headerShown: false,
                }}
            />
            {/*<Stack.Screen*/}
            {/*    name="History"*/}
            {/*    component={History}*/}
            {/*/>*/}
        </Stack.Navigator>
    )
}

export default AppNavigation;
