export const getDate = (long,type) => {
    const weekday = ["일","월","화","수","목","금","토"];

    const date = new Date(long);

    function leftPad(value) {
        if (value >= 10) {
            return value;
        }

        return `0${value}`;
    }

    const year = date.getFullYear();
    const month = leftPad(date.getMonth() + 1);
    const calDate = leftPad(date.getDate());
    const day = weekday[date.getDay()];

    const hours = leftPad(date.getHours()); // 시
    const minutes = leftPad(date.getMinutes());  // 분
    const seconds = leftPad(date.getSeconds());  // 초

    let result = `${year}.${month}.${calDate}`;
    if(type!=null && type=='full'){
        result = `${result} ${hours}:${minutes}:${seconds}`;
    }
    if(type!=null && type=='kor'){
        result = `${year}년 ${month}월 ${calDate}일 (${day})`;
    }
    if(type!=null && type=='obj'){
        result={
            year,month,calDate,day,hours,minutes,seconds
        }
    }

    return result;

};
