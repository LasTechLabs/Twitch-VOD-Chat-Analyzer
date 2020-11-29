const fs = require('fs');
const fetch = require('node-fetch');
const { spawn } = require("child_process");
const express = require('express');
const app = express();
const port = 3000;

//route index.html
app.get('/', (req, res) =>{
    res.sendFile(__dirname + "/newIndex.html");
})

//getVod endpoint, takes query parameters filter, t, id. Used in initial fetch (any time "GO" button is pressed)
//id => id of new vod to fetch
//t => window size for chart 1 (raw number of messages)
//filter => comma separated string of phrases to include in output
app.get('/getVod', async (req, res)=>{
    id = req.query.id;
    filter = "";
    time = parseInt(req.query.t);
    if(req.query.filter != ""){;
        filter = req.query.filter.toUpperCase().split(",");
    }

    //try catch and Error response needed because sometimes loading the chatlog takes more time than 
    //the browser allows.
    try{
        data = await main(id, time, filter);
        res.send({'data': data});
    }catch(err){
        res.status(504).send({'message': 'Still Loading Log'})
    }
})

//setBuffer endpoint, takes query parameters t, filter. Used when windowsize is changed
//t => window size for chart 1(raw number of messages)
//filter => comma separated string of phrases to include in output
app.get('/setBuffer', async(req, res)=>{
    filter = ""
    if(req.query.filter != ""){
        filter = req.query.filter.toUpperCase().split(",")
    }
    arr = bucket(fullLog, parseInt(req.query.t), filter)
    res.send({'data':arr})
})

//return any other misc. documents  i.e. css, js etc
app.use(express.static(__dirname))

//start server listening on port 1231
app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


let mostRecentVodID = ""    //id of most recent vod. Used to stop unnecessary multiple requests for same VOD chatlog
let fullLog;                //contents of full LOG from most recent VOD


//central function called for most requests
//returns promise that resolves to [[rawNumberofMessages], [%change in messages in most recent 10s compared to 50s preceeding]]
//id => vod id
//time => window size for chart 1 (raw messages count)
//filter => comma separated string of phrases to include in output
async function main(id, time, filterList){
    return new Promise(async (resolve, reject)=>{
        
        //Fetch Video Chatlog (only needs to be refetched when new vod is submitted, not when filter is changed)
        if(mostRecentVodID != id){
            mostRecentVodID = id;
            fullLog = undefined;
            loggy = await fetchChatlog(id)
            loggy = initialSplit(loggy)
            fullLog = loggy
        }else if (fullLog === undefined) {
            promiseExtender = await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('0')
                }, 5000)
            })
            if(promiseExtender === '0'){
                reject()
            }
        }

        if(fullLog != undefined){
            //Analyse video Chatlog
            //parse messages
            arrrr = bucket(loggy, time, filterList)
            
            //1 min rolling average
            barrr = bucket(loggy, 10, filterList)
            carr = []

            for(i=5; i<barrr.length; i++){
                //sum preceeding 50s
                carr[i] = [(barrr[i-1]+barrr[i-2]+barrr[i-3]+barrr[i-4]+barrr[i-5])/5,]
                if(carr[i][0] === 0){
                    if(barrr[i] > 2){   
                        carr[i][1] = 0.05;                                          //this is arbitrary, it's just to stop /0 errors
                    }
                }else if(((barrr[i] - carr[i][0])/Math.abs(carr[i][0])) >= 0.5){
                    carr[i][1] = ((barrr[i] - carr[i][0])/Math.abs(carr[i][0]));    //calculate % change of i (10s) vs preceeding 50s
                }
                else{
                    carr[i][1] = 0;                                                 //else set to 0
                }
            }

            //resolves [[rawNumberofMessages], [%change in messages]]
            resolve([arrrr, carr])
        }
    })
}

//function to run freaktechnik's twitch-chatlog script in separate shell process
//see here for more information about twitch-chatlog: https://github.com/freaktechnik/twitch-chatlog
function fetchChatlog(vodID){
    return new Promise((resolve, reject)=>{
        let log;
        try{
        let options = {shell: true, stdio: 'pipe'}; //shell must be true
        
        //download entire chatlog of twitch VOD with id = vodID
        //equivalent to running twitch-chatlog vodID -l 0
        const chatlog = spawn("twitch-chatlog", [vodID, '-l', '0'], options); 
        
        chatlog.stdout.on("data", data => {
            log = data;
        });
        
        //useful progress messages returned here
        chatlog.stderr.on("data", data => {
            console.log(`stderr: ${data}`);
        });
    
        chatlog.on('error', (error) => {
            console.log(`error: ${error.message}`);
        });
        
        //onClose works. onExit does not.
        chatlog.on("close", code => {
            resolve(log.toString()) //toString() used as log is returned from spawned shell as buffer
        });
    }

    catch(error){
        reject(error)
    }
    })
}

//function to split raw chatlog retrieved from fetchChatlog() into useable pieces.
//return format: [[timestamp, user, message],...]
function initialSplit(loggo){
    loggy = loggo.split("\n")
    for(j=0; j<loggy.length; j++){
        loggy[j] = [new Date(loggy[j].substr(1, loggy[j].indexOf(']')-1)).getTime(), loggy[j].substring(25, loggy[j].indexOf(">")), loggy[j].substring(loggy[j].indexOf(">")+2)]
    }
    return loggy
}

//function to count and separate chatlog into time-windowed "buckets"
//return format: [number of messages from window 0-X seconds, number of messages from window X-2X seconds, ...]
//loggo => log after being parsed by initialSplit()
//bucketSize => number of seconds in time window
//filter => array of strings to use as filter. If message contains at least one string in array, it is counted.
function bucket(loggo, bucketSize, filterList){
    let bucketShelf = [];
    
    //for each message, add to appropriate bucket entry in array bucketShelf
    for(i = 0; i < loggo.length; i++){
       bucketShelf[Math.floor((loggo[i][0] - loggo[0][0])/(bucketSize*1000))] == undefined ? bucketShelf[Math.floor((loggo[i][0] - loggo[0][0])/(bucketSize*1000))] = 1 : bucketShelf[Math.floor((loggo[i][0] - loggo[0][0])/(bucketSize*1000))] += 1;
       
       //Filter for phrases
        if(filterList != "" && filterList != undefined){
            if(!filterList.some(substring=>loggo[i][2].toUpperCase().includes(substring))){
                bucketShelf[Math.floor((loggo[i][0] - loggo[0][0])/(bucketSize*1000))] -= 1; 
            }

        }
    }

    //null or NaN => 0
    for(i = 0; i< bucketShelf.length; i++){
        if(bucketShelf[i] == null){
            bucketShelf[i] = 0;
        }
    }

    //returns [number of messages from window 0-X seconds, number of messages from window X-2X seconds, ...]
    return bucketShelf
}