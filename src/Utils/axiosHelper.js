import axios from 'axios';

// const baseURL= 'http://13.125.253.232:8080/api';
const baseURL= 'http://172.30.1.35:8080/api';
// const baseURL= 'http://172.30.1.29:8080/app';
// const baseURL= 'https://api.benefitholiday.com/app';


const instance = axios.create({
    baseURL: baseURL
});




export default instance;
