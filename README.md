# Twitch VOD Chat Analyzer

Twitch VOD Chat Analyzer is a fast-and-dirty tool to visualise the chat activity in a twitch stream, over the course of that stream. It is built upon [Freaktechnik's "twitch-chatlog" package](https://www.npmjs.com/package/twitch-chatlog).

## Demo
![](https://i.imgur.com/CqKg8lO.gif)

## Installation
1. Install [twitch-chatlog](https://www.npmjs.com/package/twitch-chatlog) globally: 
```npm install -g twitch-chatlog```
2. Download or clone the Twitch VOD Chat Analyzer git repo.
3. Install by running ```npm install``` in the downloaded directory. i.e. wherever package.json and the other files are.
4. Start the server (it will start by default on port 3000) with:
```npm start```
5. visit http://localhost:3000 in any web-browser

## Usage
1. Type the ID of any vod into the top-left text box. The VOD id is the number that appears in the URL of the VOD were you to watch it on Twitch. E.g. if the URL of the VOD you wish to analyze is ```https://www.twitch.tv/videos/817230578```, the VOD id is ```817230578```.
2. In the top right textbox, you may include a list of words or phrases. These will be used to filter the results, such that only chat messages that include at least one of the phrases will be counted. **Separate phrases with commas**.
3. Press 'GO'.
4. The VOD's chat will be downloaded and graphs will be constructed to visualise the data under the VOD embed. This may take some time, especially for longer VODs
5. If you wish to change the precision (read: time window) of the graph, change the number in the chart title.
