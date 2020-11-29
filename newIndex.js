let numMessages = document.querySelector("#numMessages")    //number of messages window
let debounceNumMessages = null                              //length of time typing to debounce
let plyr;                                                   //twitch player
let previousVodID = ""                                      //previous vod id tracking (same vod doesn't need to be reloaded)
var ctx = document.getElementById('myChart')                //Raw number of messages chart
var ctx2 = document.getElementById('myChart2')              //%change in messages chart

//function to initialise a new VOD
async function initialise() {
    //show loading text
    document.querySelector(".loading").style.display = "flex";
    
    //make request to local server
    try{
        tmp = await fetch(`http://localhost:3000/getVod?id=${document.querySelector("#vodID").value}&filter=${document.querySelector("#filterString").value}&t=${document.querySelector("#numMessages").value}`)
        tmp = await tmp.json()
        if(tmp.message === undefined){
            //hide loading text
            document.querySelector(".loading").style.display = "none";
            tmp1 = tmp.data[0]
            
            //functions to set chart 1 and 2 respectively
            setChart(myChart, tmp1, true)
            setChart(myChart2, tmp, false)
        }else{
            //needed because server operations may take longer than browser default timeout
            console.log(tmp.message)
            initialise()
        }
    }catch(error){
        //needed because server operations may take longer than browser default timeout
        console.log(error)   
        initialise()
    }
    
    
   

}

//Event Listener & Debounce function for chart 1 window
//700ms debounce timer
numMessages.addEventListener("keyup", e => {
    clearTimeout(debounceNumMessages)
    debounceNumMessages = setTimeout(async () => {
        dbuffer = await fetch(`http://localhost:3000/setBuffer?t=${numMessages.value}&filter=${document.querySelector("#filterString").value}`)
        dbuffer = await dbuffer.json()
        tmp1 = dbuffer.data
        //Set chart with new values
        setChart(myChart, tmp1, true)
    }, 700)
})

//Event listener for "GO" button press
document.querySelector("#GOBTN").addEventListener("click", e => {
    current_vodID = document.querySelector("#vodID").value

    //Twitch embed options
    options = () => {
        return {
            width: 730,
            height: 411,
            video: `${current_vodID}`,
            muted: false,
            autoplay: false,
            allow: "autoplay",
        }
    };

    //Delete previous twitch VOD embed iframe (if it exists and has changed) and remake with new VOD
    if (current_vodID != previousVodID) {
        if (document.querySelector("#ttvEmbed iframe") != null) {
            document.querySelector("#ttvEmbed iframe").remove()
        }
        plyr = new Twitch.Player("ttvEmbed", options());
        previousVodID = current_vodID;
    }
    
    //main initialisation function. Sets both charts as appropriate
    //causes server to fetch new vod messages if necessary
    initialise()
})

// sticky element stick/unstick detection
const stickyElm = document.querySelector('.stickyHeader')

const observer = new IntersectionObserver(([e]) => {
    stickyElm.classList.toggle('stuck', e.intersectionRatio < 1)
}, {
    threshold: 1
});

observer.observe(stickyElm)

//function to set either chart
//chrt => the chart options stored in a variable
//tmp1 => Data retrieved from server
//Whether chart 1 or chart 2 is being set
function setChart(chrt, tmp1, valueNum) {
    //only used for chartjs labels
    mNum = document.querySelector("#numMessages").value
    //stores chartjs labels
    lbl = []

    //true = chart 1, false = chart 2
    if (valueNum == true) {
        //set chart labels
        for (i = 0; i < tmp1.length; i++) {
            lbl.push(`${Math.floor((i*mNum)/60)}:${(i*mNum)%60}}`)
        }
        
        //update chart
        chrt.data.labels = lbl
        chrt.data.datasets[0].data = tmp1
        chrt.update()

    } else {
        //find rolling % change of most recent 10 seconds vs preceeding 50 seconds
        //first 50 seconds are zero'd

        //set chart labels
        a = [0, 0, 0, 0, 0]
        for (k = 5; k < tmp1.data[1].length; k++) {
            a.push(tmp1.data[1][k][1])
        }
        a.forEach((bb, ii) => {
            if (isNaN(bb) == true) {
                a[ii] = 0
            }
        })
        for (i = 0; i < a.length; i++) {
            lbl.push(`${Math.floor((i*10)/60)}:${(i*10)%60}`)
        }

        //update chart
        chrt.data.labels = lbl
        chrt.data.datasets[0].data = a
        chrt.update()
    }
}

//set up chart 1 values (chartjs). 
//Uses 'default' values. These largely don't matter.
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['1', '2', '3', '4', '5', '6'],
        datasets: [{
            label: '# of Votes',
            data: [12, 0, 3, 5, 2, 3],
            backgroundColor: 'rgba(255,0,0,0.2)',
            borderColor: 'rgba(255, 0, 0, 1)',
            borderWidth: 1
        }]
    },
    options: {
        elements: {
            point: {
                radius: 0,
            },
        },
        tooltips: {
            enabled: false
        },
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                gridLines: {
                    color: "rgba(0, 0, 0, 1)",
                    drawTicks: false,
                    drawBorder: true,
                    drawOnChartArea: false,
                    display: true,
                    beginAtZero: true,
                },
                ticks: {
                    display: false,
                    beginAtZero: true,
                }
            }],
            xAxes: [{
                gridLines: {
                    lineWidth: 5,
                    color: "rgba(0, 0, 0, 1)",
                    drawTicks: false,
                    drawBorder: true,
                    drawOnChartArea: false,
                    display: true,
                },
                ticks: {
                    beginAtZero: true,
                    display: false
                }
            }]
        }
    }
});

//set up chart 2 options. (chart js)
//Uses 'default' values. These largely don't matter.
var myChart2 = new Chart(ctx2, {
    type: 'line',
    data: {
        labels: ['1', '2', '3', '4', '5', '6'],
        datasets: [{
            label: '# of Votes',
            data: [12, 0, 3, 5, 2, 3],
            backgroundColor: 'rgba(255,0,0,0.2)',
            borderColor: 'rgba(255, 0, 0, 1)',
            borderWidth: 1
        }]
    },
    options: {
        tooltips: {
            enabled: false
        },
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                gridLines: {
                    color: "rgba(0, 0, 0, 1)",
                    drawTicks: false,
                    drawBorder: true,
                    drawOnChartArea: false,
                    display: true,
                    beginAtZero: true,
                },
                ticks: {
                    display: false,
                    beginAtZero: true,
                }
            }],
            xAxes: [{
                gridLines: {
                    lineWidth: 5,
                    color: "rgba(0, 0, 0, 1)",
                    drawTicks: false,
                    drawBorder: true,
                    drawOnChartArea: false,
                    display: true,
                },
                ticks: {
                    beginAtZero: true,
                    display: false
                }
            }]
        }
    }
});
