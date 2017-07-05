# Tally
> Stream-based API for sports results

Easily stream sport score results into your NodeJS application using observables.

## Install

```shell
$ npm install --save tally-scores
```

## Usage

```javascript
  const Tally = require("tally-scores");

  // scores is an RxJS observable and can then be chained
  let scores = new Tally({league: "mlb"});  
```

### Continuous Stream

```javascript
  const Tally = require("tally-scores");
  // scores is an RxJS observable and can then be chained
  let scores = new Tally({league: "mlb"});

  // every time a new request is made, we will run the subscribed callback
  scores.subscribe(events => {
    events.map(event => {
      console.log(`Home: ${event.home_team.full_name} - Away: ${event.away_team.full_name}`);
    });
  });

  // Optionally we can specify the utc_offset for event times, and how many requests we'd like to make per seconds

  let scoresPerMinute = new Tally({
    league: "mlb",
    requests_per_second: 0.01, // 0.01 is 1 request per minute (1 rps / 60 seconds)
    utc_offset: 14400          // 14400 is EST
  });       
```

### One request Optionally

```javascript
  const Tally = require("tally-scores");
  let scores = new Tally({league: "mlb", max_requests: 1});

  // using the `take` method we can subscribe to the observable only once
  scores.subscribe(events => {
    events.map(event => {
      console.log(`Home: ${event.home_team.full_name} - Away: ${event.away_team.full_name}`);
    });
  });
```

### Errors

If no events can be found for the given league, you will be presented with an error, and your streams will be unsubscribed. Using the `subscribe` method's `error` callback, you can handle such requests

```javascript
  const Tally = require("./tally");
  let scores = new Tally({league: "nhl"}); //in July, there are no hockey games

  scores.subscribe(events => {
    events.map(event => {
      console.log(`Home: ${event.home_team.full_name} - Away: ${event.away_team.full_name}`);
    });
  }, error => {
    console.log(error); // will display "No scheduled events could be found"
  });
```
