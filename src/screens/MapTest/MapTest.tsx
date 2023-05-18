import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Button,
    Linking,
    PermissionsAndroid,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    ToastAndroid,
    View,
} from 'react-native';
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import {SafeAreaView} from "react-native-safe-area-context";
import VIForegroundService from '@voximplant/react-native-foreground-service';
import instance from '../../Utils/axiosHelper';
import KeepAwake from 'react-native-keep-awake';
import NaverMapView, {Circle, Marker, Path, Polyline, Polygon} from "react-native-nmap";
import coord from './coord3.json';
import axios from "axios";
import SuperCluster from "supercluster";
import {
    markerToGeoJSONFeature,
    returnMapZoom

} from '../../Utils/Utils';

export default function MapTest({navigation}: any) {

    const [testState, setTestState] = useState([]);
    const [markerState, setMarkerState] = useState([]);

    const [mapPolygon,setMapPolygon] = useState([]);
    const [mapMarker,setMapMarker] = useState([]);

    const P0 = {latitude: 37.525075, longitude: 126.936754, zoom: 19};
    const P1 = {latitude: 37.565051, longitude: 126.978567};
    const P2 = {latitude: 37.565383, longitude: 126.976292};

    const [clustMarker,setClustMarker] = useState([]);

    //통신
    const getMapData = async () => {
        return await axios.get(
            `http://172.30.1.48:3000/geo/area`
        )
    }

    function getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2) {
        function deg2rad(deg) {
            return deg * (Math.PI / 180)
        }

        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lng2 - lng1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    const checkInMap = (orgLat, orgLng, comLat, comLng, r) => {
        if (Math.pow(r, 2) >= (Math.pow(orgLat - comLat, 2) + Math.pow(orgLng - comLng, 2))) {
            return true;
        } else {
            return false;
        }
    }

    // useEffect(()=>{
    //     if(testState.length>4){
    //         console.log(testState,Platform.OS,'TSET');
    //         const distance = getDistanceFromLatLonInKm(P0.latitude,P0.longitude,testState[4].latitude,testState[4].longitude);
    //         console.log(distance,'distance');
    //     }
    // },[testState]);

    useEffect(() => {
        // firstLoad();
    }, [])

    const firstLoad = async () => {
        const result = await getMapData();
        const geoData = result.data.geoData;

        const tempMarker = [];
        const tempPolygon = [];

        geoData.forEach((item,index)=>{
            const tempType = item.location.type;
            if(tempType=='Polygon'){
                tempPolygon.push(item);
            }else if(tempType=='Point'){
                tempMarker.push(item);
            }
        });

        // console.log(tempMarker,'tempMarker');
        // console.log(tempPolygon,'tempPolygon');

        setMapMarker(tempMarker);
        setMapPolygon(tempPolygon);

    }

    const getCircleCoords = async (center, bound) => {
        const distance = await getDistanceFromLatLonInKm(center.latitude, center.longitude, bound.latitude, bound.longitude);
        const tempList = coord.filter((item, index) => {
            // if(checkInMap(center.latitude,center.longitude,item.lat,item.lng,distance)){
            //     return item;
            // }
            const thisDistance = getDistanceFromLatLonInKm(center.latitude, center.longitude, item.lat, item.lng, distance);
            if (distance >= thisDistance) {
                return item;
            }
        });
        setMarkerState(tempList);
        console.log(distance);
        console.log(tempList.length);
    }

    useEffect(()=>{
        if(markerState.length>0){

        }
    },[markerState]);

    function generateRandomCoordinates() {
        const numCoordinates = 1000;
        const centerLat = 37.520418;
        const centerLng = 126.942189;
        const radius = 0.125; // in kilometers

        const coordinates = [];

        for (let i = 0; i < numCoordinates; i++) {
            // Convert radius from kilometers to degrees
            const radiusInDegrees = radius / 111.32;

            const u = Math.random();
            const v = Math.random();
            const w = radiusInDegrees * Math.sqrt(u);
            const t = 2 * Math.PI * v;
            const x = w * Math.cos(t);
            const y = w * Math.sin(t);

            // Adjust the x-coordinate for the desired center of the circle
            const newLng = x / Math.cos(centerLat);

            const foundLng = centerLng + newLng;
            const foundLat = centerLat + y;

            coordinates.push({lat: foundLat, lng: foundLng});
        }

        return coordinates;
    }

    return <NaverMapView style={{width: '100%', height: '100%'}}
                         showsMyLocationButton={true}
                         center={P0}
                         onCameraChange={e => {
                             const westPoint = {//west
                                 latitude:(e.coveringRegion[0].latitude+e.coveringRegion[1].latitude)/2,
                                 longitude:(e.coveringRegion[0].longitude+e.coveringRegion[1].longitude)/2};
                             const northPoint = {//north
                                 latitude:(e.coveringRegion[1].latitude+e.coveringRegion[2].latitude)/2,
                                 longitude:(e.coveringRegion[1].longitude+e.coveringRegion[2].longitude)/2};
                             const eastPoint = {//east
                                 latitude:(e.coveringRegion[2].latitude+e.coveringRegion[3].latitude)/2,
                                 longitude:(e.coveringRegion[2].longitude+e.coveringRegion[3].longitude)/2};
                             const southPoint = {//south
                                 latitude:(e.coveringRegion[3].latitude+e.coveringRegion[0].latitude)/2,
                                 longitude:(e.coveringRegion[3].longitude+e.coveringRegion[0].longitude)/2};


                             const tempArr = [westPoint,southPoint,eastPoint,northPoint];
                             const bbox = [westPoint.longitude,southPoint.latitude,eastPoint.longitude,northPoint.latitude];

                             if(markerState.length>0){
                                 const superCluster = new SuperCluster({
                                     radius: 40,
                                     maxZoom: 20,
                                     minZoom:0
                                 });

                                 const tempPoint = [];
                                 markerState.forEach((item,index)=>{
                                     tempPoint.push(markerToGeoJSONFeature(item,index));
                                 })

                                 // console.log(tempPoint);

                                 superCluster.load(tempPoint);

                                 const viewPortResult = returnMapZoom(bbox);
                                 // console.log(viewPortResult);
                                 // console.log(e.zoom,'zoommmm')
                                 // console.log(viewPortResult,' viewPortResult zoommmm')

                                 const returnClusters = superCluster.getClusters(bbox,viewPortResult);

                                 console.log(returnClusters,'@@@@@@');
                                 let pointCal = 0;
                                 const clustArr = [];
                                 returnClusters.forEach((item,index)=>{
                                     console.log(item.geometry.coordinates,item.properties.point_count);
                                     pointCal += item.properties.point_count;
                                     if(item.properties.point_count==0){
                                         pointCal += item.properties.index
                                     }
                                     clustArr.push({longitude:item.geometry.coordinates[0],latitude:item.geometry.coordinates[1],count:item.properties.point_count})
                                 })
                                 setClustMarker(clustArr);
                                 console.log(markerState.length,'######@@@@@@');
                                 console.log(pointCal,'######@@@@@@');

                             }

                             // console.log(tempArr);
                             setTestState(tempArr);
                             getCircleCoords({latitude: e.latitude, longitude: e.longitude}, northPoint);
                         }}
        // mapPadding={{left:50,right:50,bottom:50,top:50}}
        // onInitialized={(e)=>{
        //     console.log('TEST');
        //     console.log(e);
        // }}
    >
        {/*{testState.length>2&&*/}
        {/*    <Polygon  coordinates={testState} color={`rgba(0, 0, 0, 0.5)`} onClick={() => console.warn('onClick! polygon')} />*/}
        {/*}*/}

        {/*{testState.length>4&&testState.map((item,index)=>{*/}
        {/*    console.log(item,'itemitemitem');*/}
        {/*    return(*/}
        {/*        <Marker  coordinates={item} color={`rgba(0, 0, 0, 0.5)`} onClick={() => console.warn('onClick! polygon')}/>*/}
        {/*    )*/}
        {/*    })*/}
        {/*}*/}



        {/*{testState.map((item, index) => {*/}
        {/*    console.log(item,'???')*/}
        {/*    return (*/}
        {/*        <Marker coordinate={item}*/}
        {/*                onClick={() => console.warn('onClick! p0')}*/}
        {/*                // width={10}*/}
        {/*                // height={10}*/}
        {/*                // image={require('./pngwing.com.png')}*/}

        {/*        />*/}
        {/*    )*/}
        {/*})}*/}

        {/*{clustMarker.map((item, index) => {*/}
        {/*    return (*/}
        {/*        <Marker coordinate={item}*/}
        {/*                onClick={() => console.warn('onClick! p0')}*/}
        {/*                caption={{text:item.count+''}}*/}
        {/*                // width={10}*/}
        {/*                // height={10}*/}
        {/*                // image={require('./pngwing.com.png')}*/}

        {/*        />*/}
        {/*    )*/}
        {/*})}*/}

        {markerState.map((item, index) => {
            return (
                <Marker
                        key={index}
                        coordinate={{latitude: item.lat, longitude: item.lng}}
                        onClick={() => console.warn('onClick! p0')}
                        // pinColor={`blue`}
                        width={12.8}
                        height={19.2}
                        image={require('./pngwing.com.png')}
                        zIndex={9999}
                />
            )
        })}


        {mapPolygon.map((item, index) => {
            const tempList = item.location.coordinates[0];

            const polyCoord = [];
            tempList.forEach((item)=>{
                polyCoord.push({latitude:item[1],longitude:item[0]})
            })
            const tempTest = tempList[0];
            polyCoord.push({latitude:tempTest[1],longitude:tempTest[0]});
            return (
                <Polygon coordinates={polyCoord} color={`rgba(0, 0, 0, 0.5)`} onClick={() => console.warn(item.name)}/>
            )
        })}

        {/*{mapMarker.map((item, index) => {*/}
        {/*    return (*/}
        {/*        <Marker coordinate={{latitude: item.location[0], longitude: item.location[1]}}*/}
        {/*                onClick={() => console.warn('onClick! p0')}*/}
        {/*                // width={10}*/}
        {/*                // height={10}*/}
        {/*                // image={require('./pngwing.com.png')}*/}

        {/*        />*/}
        {/*    )*/}
        {/*})}*/}

    </NaverMapView>
}

